import { Request, Response } from 'express';
import { responseHandler } from '../../helpers';
import { IErrorResponse } from '../../types/errorResponse.interface';
import {
  getPartner,
  partnerDischarge,
  PartnersInClub,
  partnerUpdate,
  reactivatePartner,
  searchPartner,
  updatePartnerMembership,
  partnerLiteDischarge,
  getPartnersList,
  getHistoricalVisits,
  getHistogramData,
  getDatesWithVisits,
  getVisitsWithConsumptions,
  getDatesWithConsumptions,
  getMensualVisitTypeId,
  mensualSchemePayment,
  partnerAnotarNoPago,
} from './helpers';


export const partnerMembershipChecker = async (req: Request, res: Response) => {
  try {
    const response = await updatePartnerMembership();
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
}

export const getPartnerByDni = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, dni },
    body: { id_user = '', roles = [] }
  } = req;
  try {
    const response = await getPartner(
      JSON.parse(
        JSON.stringify({
          page: Number(page),
          pageSize: Number(pageSize),
          dni,
        }),
      ),
      roles,
      id_user,
    );
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getPartnerSearcher = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, search },
    body: {
      id_user = '',
      roles = []
    },
  } = req;
  try {
    const response = await searchPartner(
      JSON.parse(
        JSON.stringify({
          page: Number(page),
          pageSize: Number(pageSize),
          search,
        }),
      ),
      id_user,
      roles
    );
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getPartnerInside = async (req: Request, res: Response) => {
  const {
    body: { id_user = '', roles = [] },
    query: { page, pageSize, sortBy, sortDesc, search, id_state, id_visit_type },
  } = req;
  try {
    const response = await PartnersInClub(
      JSON.parse(
        JSON.stringify({
          page: Number(page),
          pageSize: Number(pageSize),
          sortBy,
          sortDesc: sortDesc === 'true',
          search: search as string || '',
          id_state: id_state ? Number(id_state) : undefined,
          id_visit_type: id_visit_type ? Number(id_visit_type) : undefined,
        }),
      ),
      id_user,
      roles,
    );
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};



export const postPartnerDischarge = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user = '',
      alias = '',
      partner_dni = '',
      partner_name = '',
      partner_birthdate = '',
      partner_phone = '',
      affiliate_dni = '',
      affiliate_name = '',
      affiliate_birthdate = '',
      affiliate_phone = '',
      id_visit_type_usualy = '',
      id_state = '',
      observations = '',
      suggest_membership_amount = '',
      id_payment_method = '',
    },
  } = req;


  try {
    const response = await partnerDischarge(
      roles,
      id_user,
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
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const updatePartner = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user = "",
      alias = "",
      partner_dni = "",
      partner_name = "",
      partner_birthdate = "",
      partner_phone = "",
      affiliate_dni = "",
      affiliate_name = "",
      affiliate_birthdate = "",
      affiliate_phone = "",
      id_visit_type_usualy = "",
      id_state = "",
      observations = "",
      suspension_reason = "",
      expultion_reason = "",
      santion_date: santionDateParam = "",
    },
    params: {
      id_partner = "",
    },
  } = req;

  try {
    const santionDate = santionDateParam && String(santionDateParam).trim() ? String(santionDateParam).trim() : undefined;
    const response = await partnerUpdate(roles, id_user, id_partner, alias, partner_dni, partner_name, partner_birthdate, partner_phone, affiliate_dni, affiliate_name, affiliate_birthdate, affiliate_phone, id_visit_type_usualy, id_state, observations, suspension_reason, expultion_reason, santionDate);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const membershipReactivation = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user = "",
      id_state = "",
      reactivation_amount = "",
      id_payment_method = "",
    },
    params: {
      id_partner = "",
    },
  } = req;
  try {

    const response = await reactivatePartner(roles, id_user, id_partner, id_state, reactivation_amount, id_payment_method);

    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
}

export const postPartnerLiteDischarge = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user= "",
      alias = "",
      id_visit_type_usualy = "",
      observations = "",
      suggest_membership_amount = "",
      id_payment_method = "",
    },
  } = req;

  try {
    const response = await partnerLiteDischarge(roles, id_user, alias, id_visit_type_usualy, observations, suggest_membership_amount, id_payment_method);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
}

export const getPartners = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, sortBy, sortDesc, search, id_state, id_visit_type_usualy },
  } = req;
  
  try {
    // Manejar id_state como array o valor único
    let idStateValue: number | number[] | undefined = undefined;
    if (id_state) {
      if (Array.isArray(id_state)) {
        idStateValue = id_state.map(s => Number(s)).filter(s => !isNaN(s));
      } else if (typeof id_state === 'string' && id_state.includes(',')) {
        // Si viene como string separado por comas
        idStateValue = id_state.split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
      } else {
        idStateValue = Number(id_state);
      }
      // Si después del procesamiento está vacío o es NaN, dejarlo undefined
      if (Array.isArray(idStateValue) && idStateValue.length === 0) {
        idStateValue = undefined;
      } else if (!Array.isArray(idStateValue) && isNaN(idStateValue)) {
        idStateValue = undefined;
      }
    }
    
    const response = await getPartnersList({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      sortBy: sortBy as string || 'id_partner',
      sortDesc: sortDesc === 'true',
      search: search as string || '',
      id_state: idStateValue,
      id_visit_type_usualy: id_visit_type_usualy ? Number(id_visit_type_usualy) : undefined,
    });
    
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getHistoricalVisitsController = async (req: Request, res: Response) => {
  const {
    body: { id_user = '', roles = [] },
    query: { page, pageSize, sortBy, sortDesc, date, search, id_state, id_visit_type },
  } = req;
  try {
    const response = await getHistoricalVisits(
      JSON.parse(
        JSON.stringify({
          page: Number(page),
          pageSize: Number(pageSize),
          sortBy,
          sortDesc: sortDesc === 'true',
          date: date as string || '',
          search: search as string || '',
          id_state: id_state ? Number(id_state) : undefined,
          id_visit_type: id_visit_type ? Number(id_visit_type) : undefined,
        }),
      ),
      id_user,
      roles,
    );
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getHistogramController = async (req: Request, res: Response) => {
  const {
    query: { period },
  } = req;
  try {
    const periodValue = (period as string) || 'month';
    const response = await getHistogramData(periodValue);
    res.status(200).send({ data: response });
  } catch (error: any) {
    console.error('Error en getHistogramController:', error);
    console.error('Query params:', { period });
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ 
      message: message || error.message || 'Error al obtener datos del histograma' 
    });
  }
};

export const getDatesWithVisitsController = async (req: Request, res: Response) => {
  try {
    const dates = await getDatesWithVisits();
    res.status(200).send({ data: dates });
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getVisitsWithConsumptionsController = async (req: Request, res: Response) => {
  const {
    body: { id_user = '', roles = [] },
    query: { page, pageSize, sortBy, sortDesc, date, search, id_state, id_visit_type, id_partner, bracelet_number },
  } = req;
  try {
    const params = JSON.parse(
      JSON.stringify({
        page: Number(page),
        pageSize: Number(pageSize),
        sortBy,
        sortDesc: sortDesc === 'true',
        date: date as string || '',
        search: search as string || '',
        id_state: id_state ? Number(id_state) : undefined,
        id_visit_type: id_visit_type ? Number(id_visit_type) : undefined,
        id_partner: id_partner ? Number(id_partner) : undefined,
        bracelet_number: bracelet_number as string || '',
      }),
    );
    
    console.log('getVisitsWithConsumptionsController - Params:', params);
    
    const response = await getVisitsWithConsumptions(
      params,
      id_user,
      roles,
    );
    
    console.log('getVisitsWithConsumptionsController - Response count:', response?.count || 0);
    
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    console.error('Error en getVisitsWithConsumptionsController:', error);
    console.error('Query params:', { page, pageSize, sortBy, sortDesc, date, search, id_state, id_visit_type, id_partner, bracelet_number });
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message: message || error.message || 'Error al obtener visitas con consumos' });
  }
};

export const getDatesWithConsumptionsController = async (req: Request, res: Response) => {
  try {
    const dates = await getDatesWithConsumptions();
    res.status(200).send({ data: dates });
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getMensualVisitTypeIdController = async (req: Request, res: Response) => {
  try {
    const id = await getMensualVisitTypeId();
    res.status(200).send({ data: { id_visit_type_mensual: id } });
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const postMensualSchemeController = async (req: Request, res: Response) => {
  const {
    body: {
      id_user = '',
      roles = [],
      id_partner = '',
      santion_date: santionDateParam = '',
      amount = '',
    },
  } = req;
  try {
    const id_partner_num = Number(id_partner);
    const amount_num = Number(amount);
    if (!id_partner_num || isNaN(id_partner_num)) {
      return res.status(400).send({ message: 'id_partner inválido' });
    }
    if (amount === '' || isNaN(amount_num) || amount_num < 0) {
      return res.status(400).send({ message: 'amount debe ser un número mayor o igual a 0' });
    }
    let santion_date: Date;
    if (santionDateParam) {
      santion_date = new Date(santionDateParam as string);
      if (isNaN(santion_date.getTime())) {
        return res.status(400).send({ message: 'santion_date inválida' });
      }
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      santion_date = d;
    }
    const response = await mensualSchemePayment(
      id_partner_num,
      santion_date,
      amount_num,
      Number(id_user),
      Array.isArray(roles) ? roles : [],
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const patchPartnerNoPagaController = async (req: Request, res: Response) => {
  const {
    params: { id_partner = '' },
    body: { id_user = '', roles = [] },
  } = req;
  try {
    const id_partner_num = Number(id_partner);
    if (!id_partner_num || isNaN(id_partner_num)) {
      return res.status(400).send({ message: 'id_partner inválido' });
    }
    const response = await partnerAnotarNoPago(
      id_partner_num,
      Number(id_user),
      Array.isArray(roles) ? roles : [],
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};