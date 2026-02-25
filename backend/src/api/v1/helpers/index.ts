import { Response } from 'express';
import { IRequestReponse } from '../types/requestResponse.interface';
import moment from 'moment-timezone';
import Partner from '../../../database/schemas/degira/models/partner.model';
import VisitType from '../../../database/schemas/degira/models/visit_type.model';
import State from '../../../database/schemas/degira/models/states.model';
import Action from '../../../database/schemas/degira/models/action.model';
import { OrderItem, Sequelize, WhereOptions } from 'sequelize';
import TicketDetails from '../../../database/schemas/degira/models/ticket_details.model';
import ProductService from '../../../database/schemas/degira/models/product_service.model';
import Ticket from '../../../database/schemas/degira/models/ticket.model';
import OperationType from '../../../database/schemas/degira/models/operation_type.model';
import User from '../../../database/schemas/degira/models/user.model';
import Role from '../../../database/schemas/degira/models/rol.model';
import PaymentMethod from '../../../database/schemas/degira/models/payment_method.model.interface';
import { EDays } from '../entities/days/types';

export const errorHandler = (code: number, message: string) => {
  throw { code, message };
};

export const responseHandler = (
  data: any | any[],
  res: Response,
  page?: number,
  pageSize?: number,
) => {
  try {
    const { count = -1, rows } = data || {};
    let response: IRequestReponse = {};
    if (Array.isArray(data)) {
      // When is response array
      response = { ...response, data, totalCount: data.length };
    } else {
      if (count >= 0 && rows) {
        // when is paginated
        response = { ...response, data: rows, totalCount: count };
        if (!isNaN(page || 0) && page) {
          response = {
            ...response,
            pageCount: rows.length,
            currentPage: rows.length ? page : 1,
            totalPages: Math.ceil(count / (pageSize || 0)),
            previousPage: rows.length
              ? response.currentPage === 1
                ? null
                : (page || 0) - 1
              : null,
            nextPage: rows.length
              ? response.currentPage === response.totalPages
                ? null
                : (page || 0) + 1
              : null,
          };
        }
      } else {
        // when response is one object
        response = { ...response, data };
      }
    }

    // Check if pageSize is -1, then return all results
    if (pageSize === -1) {
      response = {
        ...response,
        data: rows || data, // If data is paginated, use rows, otherwise use data
        totalCount: count >= 0 ? count : (rows || data).length,
        pageCount: 1,
        currentPage: 1,
        totalPages: 1,
        previousPage: null,
        nextPage: null,
      };
    }
    
    return res.status(200).send(response);
  } catch (error) {
    throw error;
  }
};

export const getPagination = (page: number, size: number) => {
  try {
    const limit = size;
    const offset = (page || 0) > 0 ? (page - 1) * limit : undefined;
    return { limit, offset };
  } catch (error) {
    throw error;
  }
};


export const argentinianDate = (date: Date) => {
  try {
    const dateUTC = new Date(date);
    const dateArg = new Date(dateUTC.getTime() - 3 * 60 * 60 * 1000);
    return dateArg;
  }
  catch (error) {
    throw error;
  }
}

export const maxLimitHour = (date: Date) => {
  try {
    const dateUTC = new Date(date);
    const dateArg = new Date(dateUTC.getTime() + 10 * 60 * 60 * 1000);
    return dateArg;
  } catch (error) {
    throw error;
  }
}

export const minLimitHour = (date: Date) => {
  try {
    const dateUTC = new Date(date);
    const dateArg = new Date(dateUTC.getTime() - 10 * 60 * 60 * 1000);
    return dateArg;
  } catch (error) {
    throw error;
  }
}

export const getOrderItemPartnerInside = (sortBy: string | undefined, criteria: string): OrderItem[] => {

  if (sortBy === 'partner.visit_type.description') {
    return [[{ model: Partner, as: 'partner' }, { model: VisitType, as: 'visit_type' }, 'description', criteria]];
  }
  if (sortBy === 'partner.alias') {
    return [[{ model: Partner, as: 'partner' }, 'alias', criteria]];
  }
  if (sortBy === 'partner.state.description') {
    return [[{ model: Partner, as: 'partner' }, { model: State, as: 'state' }, 'description', criteria]];
  }
  if (sortBy === 'visit_date') {
    return [['visit_date', criteria]];
  }
  if (sortBy === 'total_amount') {
    return [['total_amount', criteria]];
  }
  if (sortBy === 'visit_type.description') {
    return [[{ model: VisitType, as: 'visit_type' }, 'description', criteria]];
  }
  if (sortBy === 'id_bracelet_1') {
    return [['id_bracelet_1', criteria]];
  }
  if (sortBy === 'id_bracelet_2') {
    return [['id_bracelet_2', criteria]];
  }
  if (sortBy === 'id_day') {
    return [['id_day', criteria]];
  }
  if (sortBy === 'total_payed') {
    // Ordenar por la suma de entry_amount_paid + extra_entry usando Sequelize.literal
    return [[Sequelize.literal('(entry_amount_paid + COALESCE(extra_entry, 0))'), criteria]];
  }
  if (sortBy === 'entry_amount_paid') {
    return [['entry_amount_paid', criteria]];
  }
  if (sortBy === 'extra_entry') {
    return [['extra_entry', criteria]];
  }
  if (sortBy === 'visit_amount_consumed') {
    return [['visit_amount_consumed', criteria]];
  }
  if (sortBy === 'exit_amount_payed') {
    return [['exit_amount_payed', criteria]];
  }
  if (sortBy === 'extra_exit') {
    return [['extra_exit', criteria]];
  }
  if (sortBy === 'total') {
    // Ordenar por la suma total de todos los montos
    return [[Sequelize.literal('(COALESCE(entry_amount_paid, 0) + COALESCE(extra_entry, 0) + COALESCE(visit_amount_consumed, 0) + COALESCE(exit_amount_payed, 0) + COALESCE(extra_exit, 0))'), criteria]];
  }
  if (sortBy === 'hour_entry') {
    return [['hour_entry', criteria]];
  }
  if (sortBy === 'actions') {
    return [[{ model: State, as: 'state' }, { model: Action, as: 'actions' }, 'description', criteria]];
  }

  return [['id_visit', criteria]];
};

export const getOrderItemConsume = (sortBy: string | undefined, sortDesc: number | boolean | undefined): OrderItem[] => {
  const direction = sortDesc ? 'DESC' : 'ASC';

  if (sortBy === 'id') {
    return [[{ model: Ticket, as: 'tickets' }, { model: TicketDetails, as: 'ticket_details' }, 'id_ticket_detail', direction]];
  }
  if (sortBy === 'description') {
    return [[{ model: Ticket, as: 'tickets' }, { model: TicketDetails, as: 'ticket_details' }, { model: ProductService, as: 'product_service' }, 'description', direction]];
  }
  if (sortBy === 'ticket_date') {
    return [[{ model: Ticket, as: 'tickets' }, 'ticket_date', direction]];
  }
  if (sortBy === 'id_bracelet') {
    return [[{ model: Ticket, as: 'tickets' }, 'id_bracelet', direction]];
  }
  if (sortBy === 'price') {
    return [[{ model: Ticket, as: 'tickets' }, { model: TicketDetails, as: 'ticket_details' }, { model: ProductService, as: 'product_service' }, 'price', direction]];
  }
  if (sortBy === 'quantity') {
    return [[{ model: Ticket, as: 'tickets' }, { model: TicketDetails, as: 'ticket_details' }, 'quantity', direction]];
  }
  if (sortBy === 'monto') {
    return [[{ model: Ticket, as: 'tickets' }, 'ticket_amount', direction]];
  }
  if (sortBy === 'estado') {
    return [[{ model: Ticket, as: 'tickets' }, { model: TicketDetails, as: 'ticket_details' }, 'payed', direction]];
  }
  if (sortBy === 'observations') {
    return [[{ model: Ticket, as: 'tickets' }, 'observations', direction]];
  }
  if (sortBy === 'actions') {
    return [[{ model: State, as: 'state' }, { model: Action, as: 'actions' }, 'description', direction]];
  }

  return [[{ model: Ticket, as: 'tickets' }, 'ticket_date', direction]]; // Orden por defecto
};

export const getOrderOperations = (sortBy: string | undefined, sortDesc: number | boolean | undefined): OrderItem[] => {
  const direction = sortDesc ? 'DESC' : 'ASC';

  if (sortBy === 'id_operation') {
    return [['id_operation', direction]];
  }
  if (sortBy === 'operation_date') {
    return [['operation_date', direction]];
  }
  if (sortBy === 'operation_type.description') {
    return [[{ model: OperationType, as: 'operation_type' }, 'description', direction]];
  }
  if (sortBy === 'user.username') {
    return [[{ model: User, as: 'user' }, 'username', direction]];
  }
  if (sortBy === 'role.description') {
    return [[{ model: Role, as: 'role' }, 'description', direction]];
  }
  if (sortBy === 'partner.partner_name') {
    return [[{ model: Partner, as: 'partner' }, 'partner_name', direction]];
  }
  if (sortBy === 'id_visit') {
    return [['id_visit', direction]];
  }
  if (sortBy === 'payment_method.method') {
    return [[{ model: PaymentMethod, as: 'payment_method' }, 'method', direction]];
  }
  if (sortBy === 'operation_amount') {
    return [['operation_amount', direction]];
  }

  return [['id_operation', direction]]; // Orden por defecto
}

export const getVisitDate = (date: Date) => {
  let visitDate = argentinianDate(new Date(date));

  // Obtener el día de la semana
  let day = visitDate.getDay();

  // Si la hora de entrada es antes de las 8am, ajustar la fecha y el día de la semana
  if (visitDate.getHours() < 8) {
    if (day === 0) {
      day = 6;
    } else {
      day--;
    }
    visitDate.setDate(visitDate.getDate() - 1);
  }

  // Convertir el número del día de la semana en una cadena de texto
  let dayOfWeek;
  if (day === 0) {
    dayOfWeek = EDays.Domingo;
  } else if (day === 1) {
    dayOfWeek = EDays.Lunes;
  } else if (day === 2) {
    dayOfWeek = EDays.Martes;
  } else if (day === 3) {
    dayOfWeek = EDays.Miercoles;
  } else if (day === 4) {
    dayOfWeek = EDays.Jueves;
  } else if (day === 5) {
    dayOfWeek = EDays.Viernes;
  } else if (day === 6) {
    dayOfWeek = EDays.Sabado;
  } else {
    dayOfWeek = EDays.CualquierDia;
  }

  // Devolver el día de la semana correspondiente
  return dayOfWeek;
}