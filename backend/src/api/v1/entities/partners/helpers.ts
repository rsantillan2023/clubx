import { FindAndCountOptions, FindOptions, Includeable, json, Model, NUMBER, Op, Order, OrderItem, Sequelize, Transaction, WhereOptions } from 'sequelize';
import State from '../../../../database/schemas/degira/models/states.model';
import VisitType from '../../../../database/schemas/degira/models/visit_type.model';
import { EPartnerVisitType, IPostPartner, IPartnerParams, EPartnerState, IVisitInsideAPI, IPartnerInsideAPI, IPartnerDNIAPI } from './types';
import Partner from '../../../../database/schemas/degira/models/partner.model';
import { argentinianDate, errorHandler, getOrderItemPartnerInside, getPagination, getVisitDate, maxLimitHour, minLimitHour } from '../../helpers';
import { postPartnerValidator, putPartnerValidator } from './middlewares';
import Action from '../../../../database/schemas/degira/models/action.model';
import { IPartner } from '../../../../database/schemas/degira/interfaces/partner.interface';
import Operation from '../../../../database/schemas/degira/models/operation.model';
import { EOpertationType } from '../operations_types/types';
import Visit from '../../../../database/schemas/degira/models/visit.model';
import { QueryTypes } from 'sequelize';
import { DEGIRA_DB } from '../../../../database/connection';
import { IVisit } from '../../../../database/schemas/degira/interfaces/visit.interface';
import PaymentMethod from '../../../../database/schemas/degira/models/payment_method.model.interface';
import Ticket from '../../../../database/schemas/degira/models/ticket.model';
import TicketDetails from '../../../../database/schemas/degira/models/ticket_details.model';

const stateIncludeable: Includeable = {
  model: State,
  as: 'state',
  include: [
    {
      model: Action,
      as: 'actions',
    },
  ],
};

const statePartnerIncludeable: Includeable = {
  model: State,
  as: 'state',
};

const visitTypeIncludeable: Includeable = {
  model: VisitType,
  as: 'visit_type',
};

const visitTypeForPartner: Includeable = {
  model: VisitType,
  as: 'visit_type',
}

const partnerIncludeable: Includeable = {
  model: Partner,
  as: 'partner',
  include: [statePartnerIncludeable, visitTypeForPartner],
}

/** Asegura id_role numérico para Operation: roles puede ser number[] o Array<{ id_role: number }> */
const getFirstRoleId = (roles: number[] | Array<{ id_role?: number }> | undefined): number | undefined => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return undefined;
  const first = roles[0];
  return typeof first === 'number' ? first : (first as { id_role?: number })?.id_role;
};


export const getPartner = async (partnerParams: IPartnerParams, roles: number[], id_user: number, transaction?: Transaction) => {
  try {

    const { page, pageSize, dni } = partnerParams;

    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable];

    let findOptions: FindAndCountOptions = { include };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
        where: {
          [Op.or]: [
            { partner_dni: dni },
            { affiliate_dni: dni },
          ],
        },
        include,
      };
    }

    let partners = await Partner.findOne(findOptions);

    if (!partners) {
      const dayOfWeek = getVisitDate(new Date());
      await Operation.create({
        id_user,
        id_operation_type: EOpertationType.LECTURA_DNI,
        operation_log: `Se busco fallidamente el dni: ${dni}`,
        id_partner: 3777,
        operation_metadata: JSON.stringify({
          dni,
          operation_date: argentinianDate(new Date()),
          id_role: roles
        }),
        id_role: getFirstRoleId(roles),
        operation_date: argentinianDate(new Date()),
        id_day: dayOfWeek,
      }, { transaction });
      return null;
    }



    const partnerId = typeof partners?.toJSON().id_partner === 'number' ? partners.toJSON().id_partner : -1;



    const visitQuery = `
    SELECT * FROM \`Visits\`
    WHERE \`id_partner\` = :partnerId
    AND \`hour_exit\` IS NULL
    ORDER BY \`last_visit\` DESC
    LIMIT 1
    `;



    const visit = await DEGIRA_DB.query<IVisit>(visitQuery, {
      replacements: {
        partnerId,
      },
      type: QueryTypes.SELECT
    });

    // Obtener la última visita del socio desde la tabla Visits
    const lastVisitQuery = `
      SELECT id_partner, MAX(last_visit) AS last_visit
      FROM Visits
      WHERE id_partner = :partnerId
      GROUP BY id_partner
    `;

    const lastVisits = await DEGIRA_DB.query<{ id_partner: number, last_visit: Date }>(lastVisitQuery, {
      replacements: {
        partnerId,
      },
      type: QueryTypes.SELECT
    });

    const last_visit = lastVisits.length > 0 && lastVisits[0].last_visit ? lastVisits[0].last_visit : null;

    // Validación al acceso: si hace más de un año que no visita y está en estado "normal", marcar como socio no frecuente y devolver estado actualizado (frontend muestra "Reactivar Membresía")
    // Solo aplicar si hay al menos una última visita conocida y es mayor a un año. No marcar como no frecuente cuando last_visit es null (socio nuevo o sin visitas).
    const yearAgo = argentinianDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    const partnerJson = partners.toJSON() as IPartner & { state?: { id_state: number; actions?: { id_action: number } } };
    const id_state = partnerJson.id_state;
    const isNormalState = id_state != null && ![EPartnerState.SOCIO_NO_FRECUENTE, EPartnerState.SOCIO_SUSPENDIDO, EPartnerState.SOCIO_EXPULSADO, EPartnerState.SOCIO_INVITADO].includes(id_state);
    const lastVisitTooOld = last_visit != null && new Date(last_visit).getTime() <= yearAgo.getTime();
    if (isNormalState && lastVisitTooOld && (partnerId ?? 0) > 0) {
      await Partner.update(
        { id_state: EPartnerState.SOCIO_NO_FRECUENTE },
        { where: { id_partner: partnerId }, transaction }
      );
      const reloaded = await Partner.findByPk(partnerId, { include, transaction });
      if (reloaded) partners = reloaded;
    }

    if (visit.length === 0) {
      const partnerData: IPartnerDNIAPI = {
        ...partners.toJSON(),
        partner_in_establishment: false,
        last_visit: last_visit,
        has_consumptions: false,
      };
      partners = partnerData as any;
    } else {
      // Verificar si tiene consumos usando una consulta SQL directa
      const consumptionsQuery = `
        SELECT COUNT(*) as count
        FROM \`Ticket_Details\` td
        INNER JOIN \`Tickets\` t ON td.id_ticket = t.id_ticket
        WHERE t.id_visit = :id_visit
      `;
      
      const consumptionsResult = await DEGIRA_DB.query<{ count: number }>(consumptionsQuery, {
        replacements: { id_visit: visit[0].id_visit },
        type: QueryTypes.SELECT,
        transaction
      });
      
      const hasConsumptions = consumptionsResult.length > 0 && consumptionsResult[0].count > 0;
      
      const partnerData: IPartnerDNIAPI = {
        ...partners.toJSON(),
        partner_in_establishment: true,
        id_bracelet_1: visit[0].id_bracelet_1,
        id_bracelet_2: visit[0].id_bracelet_2,
        last_visit: last_visit || visit[0].last_visit,
        has_consumptions: hasConsumptions
      };
      partners = partnerData as any;
    }

    const dayOfWeek = getVisitDate(new Date());

    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.LECTURA_DNI,
      id_partner: partnerId,
      operation_log: JSON.stringify(partners),
      operation_metadata: JSON.stringify({
        dni,
        operation_date: argentinianDate(new Date()),
        id_role: roles
      }),
      id_role: getFirstRoleId(roles),
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });



    await transaction?.commit();


    return partners;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const searchPartner = async (
  partnerParams: IPartnerParams,
  id_user: number,
  roles: number[],
  transaction?: Transaction) => {
  try {
    const { page, pageSize, search } = partnerParams;


    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable];

    let findOptions: FindAndCountOptions = { include };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
        where: {
          [Op.or]: [
            { partner_dni: { [Op.like]: `%${search}%` } },
            { partner_name: { [Op.like]: `%${search}%` } },
            { affiliate_dni: { [Op.like]: `%${search}%` } },
            { affiliate_name: { [Op.like]: `%${search}%` } },
            { alias: { [Op.like]: `%${search}%` } },
          ],
        },
        include,
        transaction,
      };
    }


    const partners = await Partner.findAndCountAll(findOptions);

    const dayOfWeek = getVisitDate(new Date());

    if (!partners.rows.length) {
      await Operation.create({
        id_user,
        id_operation_type: EOpertationType.CONSULTAR_SOCIO,
        operation_log: `Se busco fallidamente el socio con el siguiente dato: ${search}`,
        operation_metadata: JSON.stringify({
          search,
          operation_date: argentinianDate(new Date()),
          id_role: roles
        }),
        id_role: getFirstRoleId(roles),
        operation_date: argentinianDate(new Date()),
        id_day: dayOfWeek,
      }, { transaction });
      return [];
    } else if (partners.rows.length === 1) {
      const partner = partners.rows[0];
      const partnerId = typeof partner.toJSON().id_partner === 'number' ? partner.toJSON().id_partner : -1;

      const visit = await Visit.findOne({
        where: {
          id_partner: partnerId,
          hour_exit: null,
        },
        transaction,
      });

      console.log(visit);


      const lastVisitQuery = `
      SELECT id_partner, MAX(last_visit) AS last_visit
      FROM Visits
      WHERE id_partner IN (:partnerId)
      GROUP BY id_partner
    `;

      const lastVisits = await DEGIRA_DB.query<{ id_partner: number, last_visit: Date }>(lastVisitQuery, {
        replacements: {
          partnerId,
        },
        type: QueryTypes.SELECT
      });

      console.log(lastVisits);

      const last_visit = lastVisits.find((visit) => visit.id_partner === partnerId)?.last_visit;

      console.log(last_visit);

      if (!visit) {
        partner.setDataValue('partner_in_establishment', false);
        partner.setDataValue('last_visit', last_visit ? last_visit : null);
      } else {
        const visitData = visit.toJSON();
        partner.setDataValue('partner_in_establishment', true);
        partner.setDataValue('last_visit', last_visit ? last_visit : null);
        // Incluir datos de la visita activa para facilitar acceso a consumos
        (partner as any).setDataValue('id_bracelet_1', visitData.id_bracelet_1 || null);
        (partner as any).setDataValue('id_bracelet_2', visitData.id_bracelet_2 || null);
        (partner as any).setDataValue('id_visit', visitData.id_visit || null);
        
          // Verificar si tiene consumos usando una consulta SQL directa
          const consumptionsQuery = `
            SELECT COUNT(*) as count
            FROM \`Ticket_Details\` td
            INNER JOIN \`Tickets\` t ON td.id_ticket = t.id_ticket
            WHERE t.id_visit = :id_visit
          `;
          
          const consumptionsResult = await DEGIRA_DB.query<{ count: number }>(consumptionsQuery, {
            replacements: { id_visit: visitData.id_visit },
            type: QueryTypes.SELECT,
            transaction
          });
          
          const hasConsumptions = consumptionsResult.length > 0 && consumptionsResult[0].count > 0;
          (partner as any).setDataValue('has_consumptions', hasConsumptions);
      }

      
      
      Operation.create({
        id_user,
        id_operation_type: EOpertationType.CONSULTAR_SOCIO,
        id_partner: partnerId,
        id_visit: (visit?.toJSON().id_visit !== null) ? visit?.toJSON().id_visit : undefined,
        operation_log: JSON.stringify(partner.toJSON()),
        operation_metadata: JSON.stringify({
          search,
          operation_date: argentinianDate(new Date()),
          id_role: roles
        }),
        id_role: getFirstRoleId(roles),
        operation_date: argentinianDate(new Date()),
        id_day: dayOfWeek,
      }, { transaction });
      
      return [partner];
    }

    const partnerIds = partners.rows.map((partner) => partner.toJSON().id_partner);

    const visitsQuery = `
    SELECT * FROM \`Visits\`
    WHERE \`id_partner\` IN (:partnerIds)
    AND \`hour_exit\` IS NULL
    `;

    const visits = await DEGIRA_DB.query<IVisit>(visitsQuery, {
      replacements: {
        partnerIds,
      },
      type: QueryTypes.SELECT
    });

    const lastVisitQuery = `
    SELECT id_partner, MAX(last_visit) AS last_visit
    FROM Visits
    WHERE id_partner IN (:partnerIds)
    GROUP BY id_partner
  `;


    const lastVisits = await DEGIRA_DB.query<{ id_partner: number, last_visit: Date }>(lastVisitQuery, {
      replacements: {
        partnerIds,
      },
      type: QueryTypes.SELECT
    });

    console.log(visits);
    if (!visits.length) {
      partners.rows.forEach((partner) => {
        partner.setDataValue('partner_in_establishment', false);
        const partnerId = typeof partner.toJSON().id_partner === 'number' ? partner.toJSON().id_partner : -1;
        const lastVisit = lastVisits.find((visit) => visit.id_partner === partnerId);
        partner.setDataValue('last_visit', lastVisit?.last_visit ? lastVisit?.last_visit : null);
      });
    } else {
      for (const partner of partners.rows) {
        const partnerId = typeof partner.toJSON().id_partner === 'number' ? partner.toJSON().id_partner : -1;
        const lastVisit = lastVisits.find((visit) => visit.id_partner === partnerId);
        const visit = visits.find((visit) => visit.id_partner === partnerId);
        if (!visit) {
          partner.setDataValue('partner_in_establishment', false);
          partner.setDataValue('last_visit', lastVisit?.last_visit);
        } else {
          partner.setDataValue('partner_in_establishment', true);
          partner.setDataValue('last_visit', lastVisit?.last_visit);
          // Incluir datos de la visita activa para facilitar acceso a consumos
          (partner as any).setDataValue('id_bracelet_1', visit.id_bracelet_1 || null);
          (partner as any).setDataValue('id_bracelet_2', visit.id_bracelet_2 || null);
          (partner as any).setDataValue('id_visit', visit.id_visit || null);
          
          // Verificar si tiene consumos usando una consulta SQL directa
          const consumptionsQuery = `
            SELECT COUNT(*) as count
            FROM \`Ticket_Details\` td
            INNER JOIN \`Tickets\` t ON td.id_ticket = t.id_ticket
            WHERE t.id_visit = :id_visit
          `;
          
          const consumptionsResult = await DEGIRA_DB.query<{ count: number }>(consumptionsQuery, {
            replacements: { id_visit: visit.id_visit },
            type: QueryTypes.SELECT,
            transaction
          });
          
          const hasConsumptions = consumptionsResult.length > 0 && consumptionsResult[0].count > 0;
          (partner as any).setDataValue('has_consumptions', hasConsumptions);
        }
      }
    }

    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.CONSULTAR_SOCIO,
      id_partner: 3777,
      operation_log: JSON.stringify(partners?.rows.map((partner) => partner.toJSON())),
      operation_metadata: JSON.stringify({
        search,
        operation_date: argentinianDate(new Date()),
        id_role: roles
      }),
      id_role: getFirstRoleId(roles),
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });

    await transaction?.commit();



    return partners;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};



export const PartnersInClub = async (
  partnerParams: IPartnerParams,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const { page, pageSize, sortBy, sortDesc } = partnerParams;


    let criteria = sortDesc ? 'DESC' : 'ASC';

    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable, partnerIncludeable];

    let order: OrderItem[] = [['id_visit', criteria]];


    if (sortBy) {
      order = getOrderItemPartnerInside(sortBy, criteria);
    }


    let findOptions: FindAndCountOptions = { include };

    let where: WhereOptions = {
      hour_exit: null
    };


    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
      };

    }

    let visit = await Visit.findAndCountAll({ ...findOptions, where, order, include, transaction }) as any;

    visit.rows = visit.rows.map((visit: Model<IVisitInsideAPI>) => {
      const currentVisit = visit.toJSON();
      const entryPaid = Number(currentVisit.entry_amount_paid || 0);
      const hadToPaid = Number(currentVisit.had_to_paid || 0);
      const pendienteEntrada = Math.max(0, hadToPaid - entryPaid);
      const esPagoAlSalir = (String(currentVisit.entry_visit_obs || "")).includes("PAGAR_AL_SALIR");
      return {
        ...visit.toJSON(),
        visit_date: currentVisit.visit_date,
        id_bracelet_1: currentVisit.id_bracelet_1,
        id_bracelet_2: currentVisit.id_bracelet_2,
        hour_entry: currentVisit.hour_entry,
        id_day: currentVisit.id_day,
        last_visit: currentVisit.last_visit,
        entry_amount_paid: entryPaid,
        extra_entry: Number(currentVisit.extra_entry || 0),
        extra_entry_obs: currentVisit.extra_entry_obs || '',
        visit_amount_consumed: Number(currentVisit.visit_amount_consumed || 0),
        exit_amount_payed: Number(currentVisit.exit_amount_payed || 0),
        extra_exit: Number(currentVisit.extra_exit || 0),
        extra_exit_obs: currentVisit.extra_exit_obs || '',
        entry_visit_obs: currentVisit.entry_visit_obs || '',
        other_visit_obs: currentVisit.other_visit_obs || '',
        total_payed: Number(currentVisit.entry_amount_paid || 0) + Number(currentVisit.extra_entry || 0) + Number(currentVisit.exit_amount_payed || 0) + Number(currentVisit.extra_exit || 0),
        pendiente_entrada: pendienteEntrada,
        es_pago_al_salir: esPagoAlSalir,
      };
    });

    //const dayOfWeek = getVisitDate(new Date());

    if (!visit.rows.length) {
      return { rows: [], count: 0 };
    }


    return { rows: visit.rows, count: visit.count };


  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
}


export const partnerDischarge = async (
  roles: number[],
  id_user: number,
  alias: string,
  partner_dni: string,
  partner_name: string,
  partner_birthdate: string,
  partner_phone: string,
  affiliate_dni: string,
  affiliate_name: string,
  affiliate_birthdate: string,
  affiliate_phone: string,
  id_visit_type_usualy: number,
  id_state: number,
  observations: string,
  suggest_membership_amount: number,
  id_payment_method: number,
  transaction?: Transaction,
)/* : Promise<IPostPartner> */ => {
  try {
    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable];
    const [isValid, message] = await postPartnerValidator(
      alias,
      partner_dni,
      partner_name,
      partner_birthdate,
      partner_phone,
      affiliate_dni,
      affiliate_name,
      affiliate_birthdate,
      affiliate_phone,
      id_visit_type_usualy,
      id_state,
      observations,
      suggest_membership_amount,
      id_payment_method,
    );

    if (!isValid) return errorHandler(400, message);

    //SETTERS

    //PARTNER_BIRTHDATE
    const newDate = partner_birthdate.split('/');
    const date = new Date(newDate[1] + '/' + newDate[0] + '/' + newDate[2]);
    partner_birthdate = date.toISOString();

    //AFFILIATE_BIRTHDATE
    if (affiliate_birthdate) {
      const newDate2 = affiliate_birthdate.split('/');
      const date2 = new Date(newDate2[1] + '/' + newDate2[0] + '/' + newDate2[2]);
      affiliate_birthdate = date2.toISOString()
    }
    //PAYMENT METHOD
    const paymentMethod = await PaymentMethod.findOne({ where: { id_payment_method } });

    if (!suggest_membership_amount && id_state === EPartnerState.SOCIO_INVITADO) {
      suggest_membership_amount = 0;
      id_payment_method = 5;
    }

    const partner = await Partner.create(
      {
        alias,
        partner_dni,
        partner_name,
        partner_birthdate: new Date(partner_birthdate),
        partner_phone,
        affiliate_dni,
        affiliate_name,
        affiliate_phone: affiliate_phone,
        affiliate_birthdate: affiliate_birthdate ? new Date(affiliate_birthdate) : null,
        id_visit_type_usualy: id_visit_type_usualy,
        id_state: id_state,
        observations,
        partner_discharge_date: argentinianDate(new Date()),
      },
      { include, transaction },
    );


    const {
      id_partner
    } = partner.toJSON() as IPartner;

    if (partner_dni.length === 14){
      await Partner.update({
        alias: alias + ' ' + id_partner,
      },{
        where: {
          id_partner
        },
        transaction
      })
      
    }

    const dayOfWeek = getVisitDate(new Date());

    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.ALTA_SOCIO,
      id_partner,
      operation_log: JSON.stringify(partner.toJSON()),
      operation_metadata: JSON.stringify({
        alias,
        partner_dni,
        partner_name,
        partner_birthdate,
        partner_phone,
        affiliate_dni,
        affiliate_name,
        affiliate_birthdate,
        affiliate_phone,
        id_visit_type_usualy,
        id_state,
        observations,
        suggest_membership_amount,
        operation_date: argentinianDate(new Date()),
        id_day: dayOfWeek,
        id_payment_method,
        id_role: roles
      }),
      id_role: getFirstRoleId(roles),
      operation_date: argentinianDate(new Date()),
      operation_amount: suggest_membership_amount,
      id_day: dayOfWeek,
      id_payment_method,
    }, { transaction });

    await transaction?.commit();

    return { partner, suggest_membership_amount };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const partnerUpdate = async (
  roles: number[],
  id_user: number,
  id_partner: string,
  alias?: string,
  partner_dni?: string,
  partner_name?: string,
  partner_birthdate?: string,
  partner_phone?: string,
  affiliate_dni?: string,
  affiliate_name?: string,
  affiliate_birthdate?: string,
  affiliate_phone?: string,
  id_visit_type_usualy?: number,
  id_state?: number,
  observations?: string,
  suspension_reason?: string,
  expultion_reason?: string,
  santion_date?: string,
  transaction?: Transaction,
) => {
  try {
    const partner = await Partner.findByPk(id_partner, { transaction });
    if (!partner) errorHandler(403, "El socio no existe");

    const [isValid, message] = await putPartnerValidator(
      id_partner,
      alias,
      partner_dni,
      partner_name,
      partner_birthdate,
      partner_phone,
      affiliate_dni,
      affiliate_name,
      affiliate_birthdate,
      affiliate_phone,
      id_visit_type_usualy,
      id_state,
      suspension_reason,
      expultion_reason,
    )

    //Partner Birthdate
    if (partner_birthdate) {
      const newDate = partner_birthdate.split('/');
      const date = new Date(newDate[1] + '/' + newDate[0] + '/' + newDate[2]);
      partner_birthdate = date.toISOString();
    }

    //Affiliate Birthdate

    if (affiliate_birthdate) {
      const newDate2 = affiliate_birthdate.split('/');
      const date2 = new Date(newDate2[1] + '/' + newDate2[0] + '/' + newDate2[2]);
      affiliate_birthdate = date2.toISOString()
    }

    
    if (!isValid) return errorHandler(400, message);
    
    const {
      alias: alias2,
      partner_dni: partner_dni2,
      partner_name: partner_name2,
      partner_birthdate: partner_birthdate2,
      partner_phone: partner_phone2,
      affiliate_dni: affiliate_dni2,
      affiliate_name: affiliate_name2,
      affiliate_birthdate: affiliate_birthdate2,
      affiliate_phone: affiliate_phone2,
      id_visit_type_usualy: id_visit_type_usualy2,
      id_state: id_state2,
      observations: observations2,
      suspension_reason: suspention_reason2,
      expultion_reason: expultion_reason2,
      santion_date: santion_date2,
    } = partner?.toJSON() as IPartner;

    const newSantionDate = santion_date !== undefined && santion_date !== null && santion_date !== ''
      ? new Date(santion_date as string)
      : (id_state === EPartnerState.SOCIO_SUSPENDIDO || id_state === EPartnerState.SOCIO_EXPULSADO)
        ? argentinianDate(new Date())
        : santion_date2;

    //SETTERS
    


    await Partner.update({
      alias: alias ? alias : alias2,
      partner_dni: partner_dni ? partner_dni : partner_dni2,
      partner_name: partner_name ? partner_name : partner_name2,
      partner_birthdate: partner_birthdate ? new Date(partner_birthdate) : partner_birthdate2,
      partner_phone: partner_phone ? partner_phone : partner_phone2,
      affiliate_dni: affiliate_dni ? affiliate_dni : affiliate_dni2,
      affiliate_name: affiliate_name ? affiliate_name : affiliate_name2,
      affiliate_phone: affiliate_phone ? affiliate_phone : affiliate_phone2,
      affiliate_birthdate: affiliate_birthdate ? new Date(affiliate_birthdate) : affiliate_birthdate2,
      id_visit_type_usualy: id_visit_type_usualy ? id_visit_type_usualy : id_visit_type_usualy2,
      id_state: id_state ? id_state : id_state2,
      observations: observations ? observations : observations2,
      suspension_reason: suspension_reason ? suspension_reason : suspention_reason2,
      expultion_reason: expultion_reason ? expultion_reason : expultion_reason2,
      santion_date: newSantionDate,
    }, {
      where: {
        id_partner
      },
      transaction
    },
    );

    const dayOfWeek = getVisitDate(new Date());

    await Operation.create({
      id_user,
      id_partner: Number(id_partner),
      id_operation_type: EOpertationType.MODIFICACION_SOCIO,
      operation_log: JSON.stringify({
        alias: alias ? alias : alias2,
        partner_dni: partner_dni ? partner_dni : partner_dni2,
        partner_name: partner_name ? partner_name : partner_name2,
        partner_birthdate: partner_birthdate ? new Date(partner_birthdate) : partner_birthdate2,
        partner_phone: partner_phone ? partner_phone : partner_phone2,
        affiliate_dni: affiliate_dni ? affiliate_dni : affiliate_dni2,
        affiliate_name: affiliate_name ? affiliate_name : affiliate_name2,
        affiliate_phone: affiliate_phone ? affiliate_phone : affiliate_phone2,
        affiliate_birthdate: affiliate_birthdate ? new Date(affiliate_birthdate) : affiliate_birthdate2,
        id_visit_type_usualy: id_visit_type_usualy ? id_visit_type_usualy : id_visit_type_usualy2,
        id_state: id_state ? id_state : id_state2,
        observations: observations ? observations : observations2,
        suspension_reason: suspension_reason ? suspension_reason : suspention_reason2,
        expultion_reason: expultion_reason ? expultion_reason : expultion_reason2,
        santion_date: newSantionDate,
      }),
      operation_metadata: JSON.stringify({
        alias: alias ? alias : alias2,
        partner_dni: partner_dni ? partner_dni : partner_dni2,
        partner_name: partner_name ? partner_name : partner_name2,
        partner_birthdate: partner_birthdate ? new Date(partner_birthdate) : partner_birthdate2,
        partner_phone: partner_phone ? partner_phone : partner_phone2,
        affiliate_dni: affiliate_dni ? affiliate_dni : affiliate_dni2,
        affiliate_name: affiliate_name ? affiliate_name : affiliate_name2,
        affiliate_phone: affiliate_phone ? affiliate_phone : affiliate_phone2,
        affiliate_birthdate: affiliate_birthdate ? new Date(affiliate_birthdate) : affiliate_birthdate2,
        id_visit_type_usualy: id_visit_type_usualy ? id_visit_type_usualy : id_visit_type_usualy2,
        id_state: id_state ? id_state : id_state2,
        observations: observations ? observations : observations2,
        suspension_reason: suspension_reason ? suspension_reason : suspention_reason2,
        expultion_reason: expultion_reason ? expultion_reason : expultion_reason2,
        santion_date: newSantionDate,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      operation_date: argentinianDate(new Date()),
      id_role: getFirstRoleId(roles),
      id_day: dayOfWeek,
    }, { transaction });

    const partnerUpdated = await Partner.findByPk(Number(id_partner), { transaction });

    await transaction?.commit();

    return { partnerUpdated: partnerUpdated?.toJSON() };

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log(error);
    throw error;
  }
}

export const reactivatePartner = async (
  roles: number[],
  id_user: number,
  id_partner: string,
  id_state: number,
  reactivation_amount: number,
  id_payment_method: number,
  transaction?: Transaction
) => {
  try {
    const partner = await Partner.findByPk(Number(id_partner), { transaction });
    if (!partner) {
      errorHandler(400, 'No existe el socio');
    }
    const payment_method = await PaymentMethod.findByPk(id_payment_method, { transaction });

    if (!payment_method) {
      errorHandler(400, 'No existe el metodo de pago');
    }

    await Partner.update({
      id_state,
    }, {
      where: {
        id_partner
      },
      transaction
    });

    const dayOfWeek = getVisitDate(new Date());


    await Operation.create({
      id_user,
      id_partner: Number(id_partner),
      id_operation_type: EOpertationType.REACTIVACION_MEMBRESIA,
      operation_log: JSON.stringify({
        id_state,
        reactivation_amount,
      }),
      operation_metadata: JSON.stringify({
        id_state,
        reactivation_amount,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      operation_date: argentinianDate(new Date()),
      id_role: getFirstRoleId(roles),
      operation_amount: reactivation_amount,
      id_day: dayOfWeek,
      id_payment_method,
    }, { transaction });

    await transaction?.commit();


    return { alias: partner?.toJSON().alias, reactivation_amount, msg: 'Socio reactivado' };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
}

export const updatePartnerMembership = async (transaction?: Transaction) => {
  try {
    //Conocer la fecha de hoy menos un año
    const yearAgo = argentinianDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    //Buscar todos los socios que tengan estado normal
    const partners = await Partner.findAll({
      where: {
        [Op.not]: {
          id_state: {
            [Op.in]: [EPartnerState.SOCIO_NO_FRECUENTE, EPartnerState.SOCIO_SUSPENDIDO, EPartnerState.SOCIO_EXPULSADO, EPartnerState.SOCIO_INVITADO]
          }
        }
      },
      transaction,
    });
    const partnersIds = partners.map((partner) => Number(partner.toJSON().id_partner));

    const lastYearVisits = await Visit.findAll({
      where: {
        id_partner: partnersIds,
        last_visit: { [Op.gte]: yearAgo },
      },
      order: [['last_visit', 'DESC']],
      attributes: ['id_partner'],
      transaction,
    });

    const lastYearPartnerIds = lastYearVisits.map((visit) => Number(visit.toJSON().id_partner));

    //Buscar todas las visitas de esos socios y que en su ultima visita el campo last_visit sea menor a la fecha de hoy menos un año
    const latestVisits = await Visit.findAll({
      where: {
        [Op.and]: [{
          id_partner: partnersIds,
        }, {
          id_partner: {
            [Op.notIn]: lastYearPartnerIds
          }
        }],
        last_visit: { [Op.lte]: yearAgo },
      },
      attributes: ['id_partner'],
      group: ['id_partner'],
      transaction,
    });

    const lastestVisitPartnerIds = latestVisits.map((visit) => Number(visit.toJSON().id_partner));

    await Partner.update({
      id_state: EPartnerState.SOCIO_NO_FRECUENTE,
    }, {
      where: {
        id_partner: lastestVisitPartnerIds,
      },
      transaction,
    });

    await transaction?.commit();

    return { msg: 'Membresias actualizadas' };

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log(error);
    throw error;
  }
};

export const partnerLiteDischarge = async (
  roles: number[],
  id_user: number,
  alias: string,
  id_visit_type_usualy: number,
  observations: string,
  suggest_membership_amount: number,
  id_payment_method: number,
  transaction?: Transaction,
) => {
  try {
    
    const partner = await Partner.create(
      {
        alias,
        id_visit_type_usualy,
        observations,
        partner_discharge_date: argentinianDate(new Date()),
      },
      { transaction },
    );

    const {
      id_partner
    } = partner.toJSON() as IPartner;

    const dayOfWeek = getVisitDate(new Date());

    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.ALTA_SOCIO,
      id_partner,
      operation_log: JSON.stringify(partner.toJSON()),
      operation_metadata: JSON.stringify({
        alias,
        id_visit_type_usualy,
        observations,
        operation_date: argentinianDate(new Date()),
        id_day: dayOfWeek,
        id_payment_method,
        id_role: roles
      }),
      id_role: getFirstRoleId(roles),
      operation_date: argentinianDate(new Date()),
      operation_amount: suggest_membership_amount,
      id_day: dayOfWeek,
      id_payment_method,
    }, { transaction });

    await transaction?.commit();

    return { partner, suggest_membership_amount };

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log(error);
  }
}

export const getPartnersList = async (partnerParams: IPartnerParams) => {
  try {
    const { page, pageSize, sortBy, sortDesc, search, id_state, id_visit_type_usualy } = partnerParams;

    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable];

    let where: WhereOptions = {};

    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { partner_dni: { [Op.like]: `%${search}%` } },
          { partner_name: { [Op.like]: `%${search}%` } },
          { affiliate_dni: { [Op.like]: `%${search}%` } },
          { affiliate_name: { [Op.like]: `%${search}%` } },
          { alias: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    if (id_state) {
      // Si id_state es un array, usar Op.in para múltiples estados
      if (Array.isArray(id_state) && id_state.length > 0) {
        where = {
          ...where,
          id_state: {
            [Op.in]: id_state,
          },
        };
      } else if (!Array.isArray(id_state)) {
        // Si es un solo valor, mantener compatibilidad
        where = {
          ...where,
          id_state,
        };
      }
    }

    if (id_visit_type_usualy) {
      where = {
        ...where,
        id_visit_type_usualy,
      };
    }

    let order: OrderItem[] = [['id_partner', 'DESC']];
    if (sortBy) {
      const direction = sortDesc ? 'DESC' : 'ASC';
      order = [[sortBy as string, direction]];
    }

    let findOptions: FindAndCountOptions = { 
      include,
      where,
      order,
    };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
      };
    }

    const partners = await Partner.findAndCountAll(findOptions);

    return partners;
  } catch (error) {
    throw error;
  }
}

// --- Esquema de pago mensual (workaround sin tocar modelo) ---
const MENSUAL_DESCRIPTION = 'MENSUAL';
const NO_PAGO_PREFIX = 'NO_PAGO';

/** Obtiene el id_visit_type del tipo MENSUAL */
export const getMensualVisitTypeId = async (transaction?: Transaction): Promise<number | null> => {
  const row = await VisitType.findOne({
    where: { description: MENSUAL_DESCRIPTION },
    attributes: ['id_visit_type'],
    transaction,
  });
  return row ? (row.get('id_visit_type') as number) : null;
};

/**
 * Alta o renovación del esquema de pago mensual.
 * Convención: santion_date = vto, suspension_reason = último monto, expultion_reason = acumulado (string).
 */
export const mensualSchemePayment = async (
  id_partner: number,
  santion_date: Date,
  amount: number,
  id_user: number,
  roles: number[],
  transaction?: Transaction,
) => {
  const idMensual = await getMensualVisitTypeId(transaction);
  if (!idMensual) errorHandler(500, 'Tipo de visitante MENSUAL no existe en la base de datos');
  const idMensualNum = idMensual as number;

  const partner = await Partner.findByPk(id_partner, { transaction });
  if (!partner) errorHandler(404, 'Socio no encontrado');
  const p = partner as NonNullable<typeof partner>;

  const amountStr = String(amount);
  const json = p.toJSON() as IPartner;
  const currentExpulsion = json.expultion_reason;
  const currentIdVisitType = json.id_visit_type_usualy;

  let newExpulsion: string;
  if (currentIdVisitType === idMensualNum && currentExpulsion) {
    const prev = parseFloat(currentExpulsion) || 0;
    newExpulsion = String(prev + amount);
  } else {
    newExpulsion = amountStr;
  }

  await Partner.update(
    {
      id_visit_type_usualy: idMensualNum,
      santion_date,
      suspension_reason: amountStr,
      expultion_reason: newExpulsion,
    },
    { where: { id_partner }, transaction },
  );

  const dayOfWeek = getVisitDate(new Date());
  await Operation.create(
    {
      id_user,
      id_partner,
      id_operation_type: EOpertationType.MODIFICACION_SOCIO,
      operation_log: JSON.stringify({
        action: 'MENSUAL_SCHEME_PAYMENT',
        id_partner,
        santion_date,
        amount,
        newExpulsion,
      }),
      operation_metadata: JSON.stringify({
        action: 'MENSUAL_SCHEME_PAYMENT',
        id_partner,
        santion_date,
        amount,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: getFirstRoleId(roles),
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    },
    { transaction },
  );

  const updated = await Partner.findByPk(id_partner, { transaction });
  return { partner: updated?.toJSON() };
};

/**
 * Anotar "no paga" en el esquema mensual: concatena en observations " | NO_PAGO [YYYY-MM-DD]".
 */
export const partnerAnotarNoPago = async (
  id_partner: number,
  id_user: number,
  roles: number[],
  transaction?: Transaction,
) => {
  const partner = await Partner.findByPk(id_partner, { transaction });
  if (!partner) errorHandler(404, 'Socio no encontrado');
  const p = partner as NonNullable<typeof partner>;

  const json = p.toJSON() as IPartner;
  const observations = json.observations || '';
  const today = argentinianDate(new Date());
  const dateStr = today.toISOString().slice(0, 10);
  const newObservation = observations.trim()
    ? `${observations} | ${NO_PAGO_PREFIX} [${dateStr}]`
    : `${NO_PAGO_PREFIX} [${dateStr}]`;

  await Partner.update(
    { observations: newObservation },
    { where: { id_partner }, transaction },
  );

  const dayOfWeek = getVisitDate(new Date());
  await Operation.create(
    {
      id_user,
      id_partner,
      id_operation_type: EOpertationType.MODIFICACION_SOCIO,
      operation_log: JSON.stringify({
        action: 'MENSUAL_ANOTAR_NO_PAGO',
        id_partner,
        date: dateStr,
      }),
      operation_metadata: JSON.stringify({
        action: 'MENSUAL_ANOTAR_NO_PAGO',
        id_partner,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: getFirstRoleId(roles),
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    },
    { transaction },
  );

  const updated = await Partner.findByPk(id_partner, { transaction });
  return { partner: updated?.toJSON() };
};

// Helper para obtener visitas históricas por fecha
export const getHistoricalVisits = async (
  partnerParams: IPartnerParams,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const { page, pageSize, sortBy, sortDesc, date, search, id_state, id_visit_type } = partnerParams;

    let criteria = sortDesc ? 'DESC' : 'ASC';

    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable, partnerIncludeable];

    let order: OrderItem[] = [['id_visit', criteria]];

    if (sortBy) {
      order = getOrderItemPartnerInside(sortBy, criteria);
    }

    let findOptions: FindAndCountOptions = { include };

    const whereConditions: any[] = [];

    // Filtrar por fecha (solo visitas del día seleccionado)
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereConditions.push({
        visit_date: {
          [Op.between]: [startDate, endDate]
        }
      });
    }

    // Filtro de búsqueda por DNI, nombre o alias
    if (search) {
      whereConditions.push({
        [Op.or]: [
          { '$partner.partner_dni$': { [Op.like]: `%${search}%` } },
          { '$partner.partner_name$': { [Op.like]: `%${search}%` } },
          { '$partner.alias$': { [Op.like]: `%${search}%` } },
          { '$partner.affiliate_dni$': { [Op.like]: `%${search}%` } },
          { '$partner.affiliate_name$': { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Filtro por estado
    if (id_state) {
      whereConditions.push({ id_state });
    }

    // Filtro por tipo de visita
    if (id_visit_type) {
      whereConditions.push({ id_visit_type });
    }

    // Construir el objeto where
    const where: WhereOptions = whereConditions.length > 0
      ? (whereConditions.length === 1 ? whereConditions[0] : { [Op.and]: whereConditions })
      : {};

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
      };
    }

    let visit = await Visit.findAndCountAll({ ...findOptions, where, order, include, transaction }) as any;

    visit.rows = visit.rows.map((visit: Model<IVisitInsideAPI>) => {
      const currentVisit = visit.toJSON();
      return {
        ...visit.toJSON(),
        visit_date: currentVisit.visit_date,
        id_bracelet_1: currentVisit.id_bracelet_1,
        id_bracelet_2: currentVisit.id_bracelet_2,
        hour_entry: currentVisit.hour_entry,
        entry_amount_paid: Number(currentVisit.entry_amount_paid || 0),
        extra_entry: Number(currentVisit.extra_entry || 0),
        visit_amount_consumed: Number(currentVisit.visit_amount_consumed || 0),
        exit_amount_payed: Number(currentVisit.exit_amount_payed || 0),
        extra_exit: Number(currentVisit.extra_exit || 0),
        total_payed: Number(currentVisit.entry_amount_paid || 0) + Number(currentVisit.extra_entry || 0) + Number(currentVisit.exit_amount_payed || 0) + Number(currentVisit.extra_exit || 0)
      };
    });

    if (!visit.rows.length) {
      return { rows: [], count: 0 };
    }

    return { rows: visit.rows, count: visit.count };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Helper para obtener datos del histograma
export const getHistogramData = async (period: string) => {
  try {
    let startDate: Date;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Calcular fecha de inicio según el período
    switch (period) {
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'semester':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    startDate.setHours(0, 0, 0, 0);

    // Query para obtener visitas agrupadas por fecha y tipo de visita
    // CORRECCIÓN: Usar hour_entry en lugar de visit_date para obtener la hora real de entrada
    // LÓGICA CORREGIDA: 
    // - Si la hora es entre 19:00 y 23:59 → se agrupa al mismo día (el día que abrió el club)
    // - Si la hora es entre 0:00 y 18:59 → se agrupa al día anterior (porque el club abrió el día anterior)
    // hour_entry ya está en hora local (UTC-3) gracias a argentinianDate()
    const query = `
      SELECT 
        CASE 
          WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
          WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
          ELSE DATE(v.hour_entry)
        END as date,
        vt.id_visit_type,
        vt.description as visit_type_description,
        COUNT(*) as count
      FROM \`Visits\` v
      INNER JOIN \`Visits_Types\` vt ON v.id_visit_type = vt.id_visit_type
      WHERE v.hour_entry IS NOT NULL
        AND v.hour_entry >= :startDate 
        AND v.hour_entry <= :endDate
      GROUP BY 
        CASE 
          WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
          WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
          ELSE DATE(v.hour_entry)
        END,
        vt.id_visit_type, 
        vt.description
      ORDER BY date DESC, vt.id_visit_type ASC
    `;

    const results = await DEGIRA_DB.query(query, {
      replacements: {
        startDate,
        endDate,
      },
      type: QueryTypes.SELECT,
    }) as any[];

    // Procesar resultados para agrupar por fecha
    const groupedByDate: { [key: string]: any } = {};

    results.forEach((row: any) => {
      // Manejar diferentes formatos de fecha que puede devolver MySQL
      let dateObj: Date;
      if (row.date instanceof Date) {
        dateObj = row.date;
      } else if (typeof row.date === 'string') {
        dateObj = new Date(row.date);
      } else {
        // Si es un objeto con métodos de fecha (como los objetos Date de MySQL)
        dateObj = new Date(row.date);
      }

      // Validar que la fecha sea válida
      if (isNaN(dateObj.getTime())) {
        console.warn('Fecha inválida encontrada:', row.date);
        return; // Saltar este registro
      }

      const dateStr = dateObj.toISOString().split('T')[0];
      
      // Formatear fecha para mostrar
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {
          date: formattedDate,
          dateKey: dateStr,
          types: []
        };
      }

      // Colores para tipos de visita
      const colors: { [key: number]: string } = {
        1: '#4CAF50',
        2: '#2196F3',
        3: '#9C27B0',
        4: '#FF9800',
        5: '#F44336',
      };

      groupedByDate[dateStr].types.push({
        id_visit_type: row.id_visit_type,
        description: row.visit_type_description,
        count: row.count,
        color: colors[row.id_visit_type] || '#757575'
      });
    });

    // Convertir a array y ordenar por fecha (más reciente primero)
    const histogramData = Object.values(groupedByDate).sort((a: any, b: any) => {
      return new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime();
    });

    return histogramData;
  } catch (error: any) {
    console.error('Error en getHistogramData:', error);
    console.error('Stack:', error.stack);
    console.error('Period:', period);
    throw {
      code: 400,
      message: error.message || 'Error al obtener datos del histograma',
      originalError: error
    };
  }
};

// Helper para obtener solo las fechas que tienen visitantes
export const getDatesWithVisits = async () => {
  try {
    // Obtener todas las fechas únicas que tienen visitas (últimos 2 años)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    twoYearsAgo.setHours(0, 0, 0, 0);

    const query = `
      SELECT DISTINCT DATE(visit_date) as date
      FROM Visits
      WHERE visit_date IS NOT NULL
        AND visit_date >= :startDate
      ORDER BY DATE(visit_date) DESC
    `;

    const results = await DEGIRA_DB.query(query, {
      replacements: {
        startDate: twoYearsAgo,
      },
      type: QueryTypes.SELECT,
    }) as any[];

    // Convertir a array de strings en formato YYYY-MM-DD
    const dates = results
      .map((row: any) => {
        // Manejar diferentes formatos de fecha que puede devolver MySQL
        let dateObj: Date;
        if (row.date instanceof Date) {
          dateObj = row.date;
        } else if (typeof row.date === 'string') {
          dateObj = new Date(row.date);
        } else {
          dateObj = new Date(row.date);
        }

        // Validar que la fecha sea válida
        if (isNaN(dateObj.getTime())) {
          console.warn('Fecha inválida encontrada en getDatesWithVisits:', row.date);
          return null;
        }

        return dateObj.toISOString().split('T')[0];
      })
      .filter((date: string | null) => date !== null) as string[];

    return dates;
  } catch (error: any) {
    console.error('Error en getDatesWithVisits:', error);
    console.error('Stack:', error.stack);
    throw {
      code: 400,
      message: error.message || 'Error al obtener fechas con visitantes',
      originalError: error
    };
  }
};

// Helper para obtener visitas con consumos detallados
export const getVisitsWithConsumptions = async (
  partnerParams: IPartnerParams,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const { page, pageSize, sortBy, sortDesc, date, search, id_state, id_visit_type, bracelet_number } = partnerParams;

    let criteria = sortDesc ? 'DESC' : 'ASC';

    const include: Includeable[] = [stateIncludeable, visitTypeIncludeable, partnerIncludeable];

    let order: OrderItem[] = [['id_visit', criteria]];

    if (sortBy) {
      order = getOrderItemPartnerInside(sortBy, criteria);
    }

    let findOptions: FindAndCountOptions = { include };

    const whereConditions: any[] = [];

    // Filtrar por fecha usando la lógica de agrupación del histograma
    // Si la hora es entre 19:00 y 23:59 → se agrupa al mismo día
    // Si la hora es entre 0:00 y 18:59 → se agrupa al día anterior
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Buscar visitas que se agrupen al día seleccionado
      // Visitas del día seleccionado entre 19:00-23:59
      const startDateSameDay = new Date(targetDate);
      startDateSameDay.setHours(19, 0, 0, 0);
      const endDateSameDay = new Date(targetDate);
      endDateSameDay.setHours(23, 59, 59, 999);
      
      // Visitas del día siguiente entre 0:00-18:59 (se agrupan al día anterior)
      const startDateNextDay = new Date(nextDate);
      startDateNextDay.setHours(0, 0, 0, 0);
      const endDateNextDay = new Date(nextDate);
      endDateNextDay.setHours(18, 59, 59, 999);

      whereConditions.push({
        [Op.or]: [
          {
            hour_entry: {
              [Op.between]: [startDateSameDay, endDateSameDay]
            }
          },
          {
            hour_entry: {
              [Op.between]: [startDateNextDay, endDateNextDay]
            }
          }
        ]
      });
    }

    // Filtro de búsqueda por DNI, nombre, alias o número de tarjeta
    if (search) {
      whereConditions.push({
        [Op.or]: [
          { '$partner.partner_dni$': { [Op.like]: `%${search}%` } },
          { '$partner.partner_name$': { [Op.like]: `%${search}%` } },
          { '$partner.alias$': { [Op.like]: `%${search}%` } },
          { '$partner.affiliate_dni$': { [Op.like]: `%${search}%` } },
          { '$partner.affiliate_name$': { [Op.like]: `%${search}%` } },
          { id_bracelet_1: { [Op.like]: `%${search}%` } },
          { id_bracelet_2: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Filtro por número de tarjeta específico
    if (bracelet_number) {
      whereConditions.push({
        [Op.or]: [
          { id_bracelet_1: bracelet_number },
          { id_bracelet_2: bracelet_number },
        ]
      });
    }

    // Filtro por socio (id_partner)
    if (partnerParams.id_partner) {
      whereConditions.push({ id_partner: partnerParams.id_partner });
    }

    // Filtro por estado
    if (id_state) {
      whereConditions.push({ id_state });
    }

    // Filtro por tipo de visita
    if (id_visit_type) {
      whereConditions.push({ id_visit_type });
    }

    // Construir el objeto where
    const where: WhereOptions = whereConditions.length > 0
      ? (whereConditions.length === 1 ? whereConditions[0] : { [Op.and]: whereConditions })
      : {};

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
      };
    }

    let visit = await Visit.findAndCountAll({ ...findOptions, where, order, include, transaction }) as any;

    // Si no hay resultados, retornar vacío
    if (!visit || !visit.rows || visit.rows.length === 0) {
      return { rows: [], count: 0 };
    }

    // Calcular fecha agrupada y mapear resultados
    visit.rows = visit.rows.map((visit: Model<IVisitInsideAPI>) => {
      const currentVisit = visit.toJSON();
      const hourEntry = currentVisit.hour_entry ? new Date(currentVisit.hour_entry) : null;
      
      // Calcular fecha agrupada según la lógica del histograma
      let groupedDate: Date | null = null;
      if (hourEntry) {
        const hour = hourEntry.getHours();
        if (hour >= 19 && hour <= 23) {
          // Mismo día
          groupedDate = new Date(hourEntry);
          groupedDate.setHours(0, 0, 0, 0);
        } else if (hour >= 0 && hour < 19) {
          // Día anterior
          groupedDate = new Date(hourEntry);
          groupedDate.setDate(groupedDate.getDate() - 1);
          groupedDate.setHours(0, 0, 0, 0);
        } else {
          groupedDate = new Date(hourEntry);
          groupedDate.setHours(0, 0, 0, 0);
        }
      }

      return {
        ...currentVisit,
        visit_date: currentVisit.visit_date,
        id_bracelet_1: currentVisit.id_bracelet_1,
        id_bracelet_2: currentVisit.id_bracelet_2,
        hour_entry: currentVisit.hour_entry,
        grouped_date: groupedDate,
        entry_amount_paid: Number(currentVisit.entry_amount_paid || 0),
        visit_amount_consumed: Number(currentVisit.visit_amount_consumed || 0),
        exit_amount_payed: Number(currentVisit.exit_amount_payed || 0),
        extra_entry: Number(currentVisit.extra_entry || 0),
        extra_exit: Number(currentVisit.extra_exit || 0),
        extra_entry_obs: currentVisit.extra_entry_obs || '',
        extra_exit_obs: currentVisit.extra_exit_obs || '',
      };
    });

    if (!visit.rows.length) {
      return { rows: [], count: 0 };
    }

    return { rows: visit.rows, count: visit.count };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Helper para obtener solo las fechas que tienen consumos (usando lógica de agrupación del histograma)
export const getDatesWithConsumptions = async () => {
  try {
    // Obtener todas las fechas únicas que tienen consumos (últimos 2 años)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    twoYearsAgo.setHours(0, 0, 0, 0);

    // Query usando la misma lógica de agrupación del histograma
    // Si la hora es entre 19:00 y 23:59 → se agrupa al mismo día
    // Si la hora es entre 0:00 y 18:59 → se agrupa al día anterior
    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN HOUR(v.hour_entry) >= 19 AND HOUR(v.hour_entry) <= 23 THEN DATE(v.hour_entry)
          WHEN HOUR(v.hour_entry) >= 0 AND HOUR(v.hour_entry) < 19 THEN DATE_SUB(DATE(v.hour_entry), INTERVAL 1 DAY)
          ELSE DATE(v.hour_entry)
        END as date
      FROM \`Visits\` v
      WHERE v.hour_entry IS NOT NULL
        AND v.hour_entry >= :startDate
        AND (
          v.visit_amount_consumed > 0 
          OR v.entry_amount_paid > 0 
          OR v.exit_amount_payed > 0 
          OR v.extra_entry > 0 
          OR v.extra_exit > 0
        )
      ORDER BY date DESC
    `;

    const results = await DEGIRA_DB.query(query, {
      replacements: {
        startDate: twoYearsAgo,
      },
      type: QueryTypes.SELECT,
    }) as any[];

    // Convertir a array de strings en formato YYYY-MM-DD
    const dates = results
      .map((row: any) => {
        // Manejar diferentes formatos de fecha que puede devolver MySQL
        let dateObj: Date;
        if (row.date instanceof Date) {
          dateObj = row.date;
        } else if (typeof row.date === 'string') {
          dateObj = new Date(row.date);
        } else {
          dateObj = new Date(row.date);
        }

        // Validar que la fecha sea válida
        if (isNaN(dateObj.getTime())) {
          console.warn('Fecha inválida encontrada en getDatesWithConsumptions:', row.date);
          return null;
        }

        return dateObj.toISOString().split('T')[0];
      })
      .filter((date: string | null) => date !== null) as string[];

    // Eliminar duplicados (por si acaso)
    const uniqueDates = [...new Set(dates)];

    return uniqueDates;
  } catch (error: any) {
    console.error('Error en getDatesWithConsumptions:', error);
    console.error('Stack:', error.stack);
    throw {
      code: 400,
      message: error.message || 'Error al obtener fechas con consumos',
      originalError: error
    };
  }
};
