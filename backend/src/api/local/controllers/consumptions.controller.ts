import { Request, Response } from 'express';
import ProductServiceLocal from '../../../database/local/models/product_service.model';
import VisitLocal from '../../../database/local/models/visit.model';
import TicketLocal from '../../../database/local/models/ticket.model';
import TicketDetailsLocal from '../../../database/local/models/ticket_details.model';
import PartnerLocal from '../../../database/local/models/partner.model';
import { LOCAL_DB } from '../../../database/local/connection';
import { Op } from 'sequelize';

/**
 * Obtener productos destacados (offline)
 */
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductServiceLocal.findAll({
      where: {
        available: {
          [Op.ne]: 0,
        },
      },
      order: [['featured', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: products,
      totalCount: products.length,
    });
  } catch (error: any) {
    console.error('Error al obtener productos destacados:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener productos destacados',
    });
  }
};

/**
 * Obtener socios en el club (offline)
 */
export const getPartnersInside = async (req: Request, res: Response) => {
  try {
    const visits = await VisitLocal.findAll({
      where: {
        hour_exit: null,
      },
      include: [{
        model: PartnerLocal,
        as: 'partner',
        required: false,
      }],
      order: [['visit_date', 'DESC']],
    });

    // Formatear respuesta similar a la API remota
    const formattedVisits = visits.map((visit: any) => {
      const visitData = visit.toJSON();
      return {
        ...visitData,
        partner: visitData.partner || {},
      };
    });

    res.status(200).json({
      success: true,
      data: formattedVisits,
      totalCount: formattedVisits.length,
    });
  } catch (error: any) {
    console.error('Error al obtener socios en el club:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener socios en el club',
    });
  }
};

/**
 * Crear ticket offline
 */
export const createConsumption = async (req: Request, res: Response) => {
  const transaction = await LOCAL_DB.transaction();
  
  try {
    const {
      cart = [],
      total_consumed,
      id_bracelet,
      ticket_observations = '',
    } = req.body;

    // Validaciones básicas
    if (!id_bracelet) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El brazalete es requerido',
      });
    }

    if (!cart || cart.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío',
      });
    }

    // Buscar visita activa
    const visit = await VisitLocal.findOne({
      where: {
        [Op.or]: [
          { id_bracelet_1: id_bracelet },
          { id_bracelet_2: id_bracelet },
        ],
        hour_exit: null,
      },
      include: [{
        model: PartnerLocal,
        as: 'partner',
        required: false,
      }],
      order: [['visit_date', 'DESC']],
      transaction,
    });

    if (!visit) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se encontró la visita activa para este brazalete',
      });
    }

    const visitData = visit.toJSON();
    const { id_visit, visit_amount_consumed, id_partner } = visitData;

    // Buscar partner
    const partner = await PartnerLocal.findByPk(id_partner, { transaction });
    if (!partner) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se encontró el socio',
      });
    }

    const partnerData = partner.toJSON();

    // Crear ticket
    const ticket = await TicketLocal.create({
      id_visit,
      id_bracelet,
      ticket_date: new Date(),
      ticket_amount: total_consumed,
      observations: ticket_observations,
      sync_status: 'PENDING', // Marcar como pendiente de sincronizar
      created_offline: true,
    }, { transaction });

    if (!ticket) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pudo crear el ticket',
      });
    }

    const ticketData = ticket.toJSON();

    // Crear ticket_details
    const ticketDetails = cart.map((product: any) => ({
      id_ticket: ticketData.id_ticket,
      id_product_service: product.id_product_service,
      quantity: product.cantidad,
      unit_price: product.price,
      payed: false,
      state: 'NO PAGADO',
    }));

    await TicketDetailsLocal.bulkCreate(ticketDetails, { transaction });

    // Actualizar visit
    const newVisitAmountConsumed = visit_amount_consumed 
      ? Number(total_consumed) + Number(visit_amount_consumed) 
      : total_consumed;

    await VisitLocal.update(
      { visit_amount_consumed: newVisitAmountConsumed },
      {
        where: { id_visit },
        transaction,
      }
    );

    await transaction.commit();

    // Formatear respuesta similar a la API remota
    const responseData = {
      id_ticket: ticketData.id_ticket,
      id_bracelet: ticketData.id_bracelet,
      ticket_amount: ticketData.ticket_amount,
      ticket_observation: ticketData.observations,
      partner_name: partnerData.partner_name,
      partner_phone: partnerData.partner_phone,
      products: cart.map((p: any) => ({
        id_product_service: p.id_product_service,
        description: p.description || '',
        cantidad: p.cantidad,
        price: p.price,
      })),
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Ticket creado exitosamente (offline)',
    });

  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al crear consumo offline:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear consumo',
    });
  }
};

/**
 * Health check para verificar que la API local está funcionando
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    await LOCAL_DB.authenticate();
    res.status(200).json({
      success: true,
      message: 'API local funcionando correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error en API local',
      error: error.message,
    });
  }
};

