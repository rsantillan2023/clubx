import { FindAndCountOptions, Includeable, Op, Transaction } from "sequelize";
import Operation from "../../../../database/schemas/degira/models/operation.model";
import Partner from "../../../../database/schemas/degira/models/partner.model";
import State from "../../../../database/schemas/degira/models/states.model";
import Visit from "../../../../database/schemas/degira/models/visit.model";
import VisitType from "../../../../database/schemas/degira/models/visit_type.model";
import { argentinianDate, errorHandler, getPagination, getVisitDate } from "../../helpers";
import { EOpertationType } from '../operations_types/types';
import { ERoles } from '../roles/types';
import { IExitRegister, ITicketAPI, IVisitParams, IVisitRegister } from "./types";
import { entryValidator, exitValidator, generarIdBasadoEnFecha } from "./middlewares";
import Ticket from "../../../../database/schemas/degira/models/ticket.model";
import TicketDetails from "../../../../database/schemas/degira/models/ticket_details.model";
import PaymentMethod from "../../../../database/schemas/degira/models/payment_method.model.interface";
import Day from "../../../../database/schemas/degira/models/day.model";
import { EDays } from "../days/types";
import { EPartnerState } from "../partners/types";
import { EPaymentMethod } from "../payment_method/types";

const visitTypeIncludeable: Includeable = {
    model: VisitType,
    as: "visit_type",
}

const partnerIncludeable: Includeable = {
    model: Partner,
    as: "partner",
}

const stateIncludeable: Includeable = {
    model: State,
    as: "state",
}

const ticketDetailsIncludeable: Includeable = {
    model: TicketDetails,
    as: "ticket_details",
}

const ticketIncludeable: Includeable = {
    model: Ticket,
    as: "ticket",
    include: [ticketDetailsIncludeable]
}

const dayIncludeable: Includeable = {
    model: Day,
    as: "days",
}

export const getVisitsList = async (visitParams: IVisitParams) => {
    try {
        const { page, pageSize } = visitParams;

        const include: Includeable[] = [visitTypeIncludeable, partnerIncludeable, stateIncludeable, dayIncludeable];
        let findOptions: FindAndCountOptions = { include };

        if (page && pageSize) {
            const { limit, offset } = getPagination(page, pageSize);
            findOptions = { ...findOptions, offset, limit };
        }

        const visits = await Visit.findAndCountAll(findOptions);

        return visits;
    } catch (error) {
        console.log(error);
    }
}

export const entryRegister = async (
    //id_visit: number,
    roles: number[],
    id_user: number,
    id_partner: number,
    //visit_date: Date,
    id_state: number,
    id_visit_type: number,
    other_visit_obs: string,
    entry_visit_obs: string,
    entry_amount_paid: number,
    other_paid: number,
    other_paid_obs: string,
    id_bracelet_1: string,
    id_bracelet_2: string,
    id_payment_method: number,
    had_to_paid: number,
    transaction?: Transaction
): Promise<IVisitRegister> => {
    try {
        //const include: Includeable[] = [visitTypeIncludeable, partnerIncludeable, stateIncludeable];
        const [isValid, message] = await entryValidator(
            //id_visit,
            id_partner,
            //visit_date,
            id_state,
            id_visit_type,
            //other_visit_obs,
            //entry_visit_obs,
            entry_amount_paid,
            other_paid,
            other_paid_obs,
            id_bracelet_1,
            id_bracelet_2,
            id_payment_method,
        )

        if (!isValid) return errorHandler(400, message)

        //SETTERS

        //OTHER PAID
        if (!other_paid) {
            other_paid = 0;
        } else {
            if (!other_paid_obs && !other_paid_obs.length) {
                return errorHandler(400, "Debe ingresar una observación para el pago extra");
            }
        }

        //Entry Amount Paid

        if ((!entry_amount_paid && id_state === EPartnerState.SOCIO_INVITADO) || id_payment_method === EPaymentMethod.NO_PAGA) {
            entry_amount_paid = 0;
            id_payment_method = 5;
        }

        //VISIT DATE

        let visitDate = argentinianDate(new Date());

        //HOUR ENTRY

        const hourEntry = argentinianDate(new Date());

        let day = new Date(visitDate).getDay();
        if (visitDate.getHours() < 8) {
            // If the hour of entry is before 8am, it belongs to the previous day
            day = day === 0 ? 6 : day - 1;
            visitDate = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate() - 1);
        }
        let dayVisit;
        if (day === 0) {
            dayVisit = EDays.Domingo;
        } else if (day === 1) {
            dayVisit = EDays.Lunes;
        } else if (day === 2) {
            dayVisit = EDays.Martes;
        } else if (day === 3) {
            dayVisit = EDays.Miercoles;
        } else if (day === 4) {
            dayVisit = EDays.Jueves;
        } else if (day === 5) {
            dayVisit = EDays.Viernes;
        } else if (day === 6) {
            dayVisit = EDays.Sabado;
        } else {
            dayVisit = EDays.CualquierDia;
        }


        const visit = await Visit.create({
            //id_visit,
            exit_amount_payed: 0,
            exit_visit_obs: "",
            visit_amount_consumed: 0,
            id_partner,
            visit_date: visitDate,
            id_state,
            id_visit_type,
            other_visit_obs,
            entry_visit_obs,
            entry_amount_paid,
            //other_paid,
            extra_entry: other_paid,
            extra_entry_obs: other_paid_obs,
            hour_entry: hourEntry,
            id_bracelet_1,
            id_bracelet_2,
            last_visit: hourEntry,
            id_day: dayVisit,
            had_to_paid,
        }, { transaction })

        const { id_visit, visit_date } = visit.toJSON();



        await Operation.create({
            id_visit,
            id_partner,
            id_user,
            id_operation_type: EOpertationType.INGRESO_VISITA,
            operation_log: JSON.stringify(visit),
            operation_metadata: JSON.stringify({
                id_partner,
                visit_date: visitDate,
                id_state,
                id_visit_type,
                other_visit_obs,
                entry_visit_obs,
                entry_amount_paid,
                other_paid,
                other_paid_obs,
                id_bracelet_1,
                id_bracelet_2,
                operation_date: hourEntry,
                id_role: roles,
            }),
            id_role: roles[0],
            operation_date: hourEntry,
            operation_amount: Number(entry_amount_paid) + Number(other_paid),
            id_payment_method: id_payment_method,
            id_day: dayVisit,
        }, { transaction })


        await transaction?.commit();

        return { id_partner, visit_date, id_state, id_visit_type, other_visit_obs, entry_visit_obs, entry_amount_paid, other_paid, other_paid_obs, hour_entry: argentinianDate(new Date()), id_bracelet_1, id_bracelet_2, id_payment_method, total_amount: Number(entry_amount_paid) + Number(other_paid), had_to_paid: had_to_paid === null ? 0 : had_to_paid };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}

export const exitRegister = async (
    roles: number[],
    id_user: number,
    id_visit: string,
    id_state: number,
    exit_visit_obs: string,
    exit_amount_payed: number,
    other_paid: number,
    other_paid_obs: string,
    id_payment_method: number,
    had_to_paid: number,
    transaction?: Transaction
): Promise<IExitRegister> => {
    const [isValid, message] = await exitValidator(
        id_visit,
        id_state,
        exit_visit_obs,
        exit_amount_payed,
        other_paid,
        other_paid_obs,
        id_payment_method
    )
    //SETTERS
    if (!isValid) return errorHandler(400, message)

    if (!other_paid) {
        other_paid = 0;
    } else {
        if (!other_paid_obs && !other_paid_obs.length) {
            return errorHandler(400, "Debe ingresar una observación para el pago extra");
        }
    }

    if ((!exit_amount_payed && id_state === EPartnerState.SOCIO_INVITADO) || id_payment_method === EPaymentMethod.NO_PAGA) {
        exit_amount_payed = 0;
        id_payment_method = 5;
    }

    const visit = await Visit.findOne({
        where: {
            id_visit
        },
        transaction
    })

    const { id_bracelet_1, id_bracelet_2, hour_exit, extra_exit: otherPaid, had_to_paid: hadToPaid } = visit?.toJSON() || {};

    if (hour_exit) {
        return errorHandler(400, "La visita ya fue registrada como salida");
    }


    const tickets = await Ticket.findAll({
        where: {
            id_visit
        },
        transaction
    });

    const ticketIds: number[] = tickets
        .filter(ticket => ticket.toJSON().id_ticket !== undefined)
        .map(ticket => ticket.toJSON().id_ticket as number);

    const ticketDetails: TicketDetails[] = await TicketDetails.findAll({
        where: {
            id_ticket: {
                [Op.in]: ticketIds
            }
        },
        transaction
    });


    try {

        await Promise.all(ticketDetails.map(async (ticketDetail) => {
            await TicketDetails.update({
                payed: true,
                state: "PAGADO"
            }, {
                where: {
                    id_ticket_detail: ticketDetail.toJSON().id_ticket_detail
                },
                transaction
            })
        }))

        const paymentMethod = await PaymentMethod.findOne({
            where: {
                id_payment_method
            }
        })


        const exit = await Visit.update({
            id_state,
            exit_visit_obs,
            exit_amount_payed,
            extra_exit: Number(otherPaid) + Number(other_paid),
            extra_exit_obs: other_paid_obs,
            hour_exit: argentinianDate(new Date()),
            had_to_paid: Number(hadToPaid) + Number(had_to_paid),
        }, {
            where: {
                id_visit,
            }, transaction
        })

        if (!exit) return errorHandler(400, "No se pudo actualizar la visita o ya fue dada de alta la salida");

        const numberIdVisit = parseInt(id_visit);

        const dayOfWeek = getVisitDate(new Date())

        await Operation.create({
            id_visit: numberIdVisit,
            id_operation_type: EOpertationType.EGRESO_VISITA,
            id_partner: visit?.toJSON().id_partner,
            id_user,
            operation_log: JSON.stringify(visit),
            operation_metadata: JSON.stringify({
                id_state,
                exit_visit_obs,
                exit_amount_payed,
                other_paid,
                other_paid_obs,
                operation_date: argentinianDate(new Date()),
                id_role: roles,
            }),
            id_role: roles[0],
            operation_date: argentinianDate(new Date()),
            operation_amount: Number(exit_amount_payed) + Number(other_paid),
            id_payment_method: id_payment_method,
            id_day: dayOfWeek
        }, { transaction })


        await transaction?.commit();

        return { id_visit, id_state, exit_visit_obs, exit_amount_payed, other_paid: Number(otherPaid) + Number(other_paid), other_paid_obs, hour_exit: argentinianDate(new Date()), id_bracelet_1, id_bracelet_2, had_to_paid: had_to_paid === null ? 0 : Number(had_to_paid) };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}

export const fastEntryRegister = async (
    roles: number[],
    id_user: number,
    id_partner: number,
    //visit_date: Date,
    id_state: number,
    id_visit_type: number,
    other_visit_obs: string,
    entry_visit_obs: string,
    entry_amount_paid: number,
    other_paid: number,
    other_paid_obs: string,
    id_bracelet_1: string,
    id_bracelet_2: string,
    id_payment_method: number,
    had_to_paid: number,
    transaction?: Transaction
) => {
    try {
        const visitType = await VisitType.findOne({
            where: {
                id_visit_type
            }
        })

        if (!visitType) return errorHandler(400, "No se encontró el tipo de visita");

        //Entry Amount Paid

        //VISIT DATE

        let visitDate = argentinianDate(new Date());

        //HOUR ENTRY

        const hourEntry = argentinianDate(new Date());

        let day = new Date(visitDate).getDay();

        if (visitDate.getHours() < 8) {
            // If the hour of entry is before 8am, it belongs to the previous day
            day = day === 0 ? 6 : day - 1;
            visitDate = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate() - 1);
        }

        let dayVisit;
        if (day === 0) {
            dayVisit = EDays.Domingo;
        } else if (day === 1) {
            dayVisit = EDays.Lunes;
        } else if (day === 2) {
            dayVisit = EDays.Martes;
        } else if (day === 3) {
            dayVisit = EDays.Miercoles;
        } else if (day === 4) {
            dayVisit = EDays.Jueves;
        } else if (day === 5) {
            dayVisit = EDays.Viernes;
        } else if (day === 6) {
            dayVisit = EDays.Sabado;
        } else {
            dayVisit = EDays.CualquierDia;
        }

        let idBracelet = await generarIdBasadoEnFecha(dayVisit, visitDate, transaction);
        await new Promise(resolve => setTimeout(resolve, 1));

        const visit = await Visit.create({
            id_partner,
            id_visit_type,
            other_visit_obs,
            entry_visit_obs,
            entry_amount_paid,
            extra_entry: other_paid,
            extra_entry_obs: other_paid_obs,
            had_to_paid,
            hour_entry: hourEntry,
            id_day: dayVisit,
            visit_date: visitDate,
            last_visit: hourEntry,
            id_state,
            id_bracelet_1: idBracelet,
        }, { transaction })

        const { id_visit, visit_date } = visit.toJSON();

        await Operation.create({
            id_visit,
            id_operation_type: EOpertationType.ENTRADA_RAPIDA,
            operation_log: JSON.stringify(visit),
            operation_metadata: JSON.stringify({
                id_visit_type,
                other_visit_obs,
                entry_visit_obs,
                entry_amount_paid,
                other_paid,
                other_paid_obs,
                operation_date: hourEntry,
            }),
            operation_date: hourEntry,
            operation_amount: Number(entry_amount_paid) + Number(other_paid),
            id_payment_method: id_payment_method,
            id_day: dayVisit,
            id_user,
            id_partner,
            id_role: roles[0],
        }, { transaction })

        await transaction?.commit();

        return { id_partner, visit_date, id_visit_type, other_visit_obs, entry_visit_obs, entry_amount_paid, other_paid, other_paid_obs, hour_entry: argentinianDate(new Date()), id_payment_method, total_amount: Number(entry_amount_paid) + Number(other_paid), had_to_paid: had_to_paid === null ? 0 : had_to_paid, id_bracelet_1: idBracelet};
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}


export const fixEmptyEntryRegister = async (transaction?: Transaction) => {
    try {
        // Consulto todos los partners creados en el ultimo año hasta hace 2 dias, los cuales no tienen cargada una visita
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);         
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        // Definir las asociaciones temporalmente para esta consulta
        Partner.hasMany(Visit, { foreignKey: 'id_partner' });
        Visit.belongsTo(Partner, { foreignKey: 'id_partner' });

        const partners = await Partner.findAll({
            include: [
                {
                  model: Visit,
                  required: false, 
                  attributes: [] 
                }
              ],
            where: {                
                partner_discharge_date: {
                    [Op.between]: [oneYearAgo, twoDaysAgo]
                  },
                '$Visits.id_visit$': {
                    [Op.is]: null 
                }
            },
            transaction,
          });                        

        const visitPromises = partners.map(async (partner) => {
            const partnerData = partner.toJSON();
            let visitDate = partnerData.partner_discharge_date? partnerData.partner_discharge_date : new Date();            
            let day = visitDate?.getDay();
            let dayVisit = day !== undefined ? day : EDays.CualquierDia;
    
            if (day !== undefined) {
                dayVisit = [EDays.Domingo, EDays.Lunes, EDays.Martes, EDays.Miercoles, EDays.Jueves, EDays.Viernes, EDays.Sabado][day];
            }

            let idBracelet = await generarIdBasadoEnFecha(dayVisit, visitDate, transaction);
            const hourExit = new Date(visitDate);
            hourExit.setHours(hourExit.getHours() + 1);

            const visit = await Visit.create({
                id_partner: partnerData.id_partner,
                id_visit_type: partnerData.id_visit_type_usualy,
                other_visit_obs: "Inicial",
                entry_visit_obs: "Inicial",
                entry_amount_paid: 0,
                extra_entry: 0,
                extra_entry_obs: "Inicial",
                had_to_paid: 0,
                hour_entry: visitDate,
                hour_exit: hourExit,
                id_day: dayVisit,
                visit_date: visitDate,
                last_visit: visitDate,
                id_state: partnerData.id_state,
                id_bracelet_1: idBracelet,
            }, { transaction });            
        });

        await Promise.all(visitPromises);
        await transaction?.commit();

        return { msg: 'Visitas y operaciones agregadas correctamente' };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        throw error;
    }
}