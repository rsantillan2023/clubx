import axios from 'axios';
import TicketLocal from '../models/ticket.model';
import TicketDetailsLocal from '../models/ticket_details.model';
import VisitLocal from '../models/visit.model';
import ProductServiceLocal from '../models/product_service.model';
import { LOCAL_DB } from '../connection';
import { Op } from 'sequelize';

const REMOTE_API_URL = process.env.REMOTE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Verifica si el servidor remoto está disponible
 */
const checkRemoteServerAvailable = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${REMOTE_API_URL}/health`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

/**
 * Sincroniza tickets creados offline al servidor remoto (PUSH)
 * Se ejecuta manualmente cuando el usuario presiona el botón de sincronizar
 */
export const syncTickets = async (): Promise<{ 
  success: boolean; 
  message: string; 
  synced: number; 
  total: number; 
  errors?: string[] 
}> => {
  try {
    console.log('🔄 Iniciando sincronización de Tickets (PUSH)...');
    
    // Verificar que servidor remoto está disponible
    const isAvailable = await checkRemoteServerAvailable();
    if (!isAvailable) {
      return {
        success: false,
        message: 'Servidor remoto no disponible',
        synced: 0,
        total: 0,
      };
    }

    // Obtener tickets pendientes
    const pendingTickets = await TicketLocal.findAll({
      where: {
        sync_status: 'PENDING',
      },
    });

    // Obtener detalles de cada ticket
    const ticketsWithDetails = await Promise.all(
      pendingTickets.map(async (ticket) => {
        const ticketData = ticket.toJSON();
        const details = await TicketDetailsLocal.findAll({
          where: { id_ticket: ticketData.id_ticket },
        });
        return {
          ...ticketData,
          ticket_details: details.map(d => d.toJSON()),
        };
      })
    );

    if (ticketsWithDetails.length === 0) {
      return {
        success: true,
        message: 'No hay tickets pendientes de sincronizar',
        synced: 0,
        total: 0,
      };
    }

    let synced = 0;
    const errors: string[] = [];

    // Sincronizar cada ticket
    for (const ticket of ticketsWithDetails) {
      const ticketData = ticket;
      const ticketDetails = ticket.ticket_details || [];

      try {
        // Preparar datos para enviar al servidor remoto
        const cart = ticketDetails.map((td: any) => ({
          id_product_service: td.id_product_service,
          cantidad: td.quantity,
          price: td.unit_price,
        }));

        // Enviar ticket al servidor remoto
        const response = await axios.post(
          `${REMOTE_API_URL}/consumptions/create`,
          {
            cart,
            total_consumed: ticketData.ticket_amount,
            id_bracelet: ticketData.id_bracelet,
            ticket_observations: ticketData.observations,
          },
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && response.data.data) {
          // Marcar ticket como sincronizado
          await TicketLocal.update(
            {
              sync_status: 'SYNCED',
              remote_id_ticket: response.data.data.id_ticket || null,
              synced_at: new Date(),
            },
            {
              where: { id_ticket: ticketData.id_ticket },
            }
          );
          synced++;
          console.log(`✅ Ticket ${ticketData.id_ticket} sincronizado exitosamente`);
        } else {
          throw new Error('Respuesta inválida del servidor remoto');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        errors.push(`Ticket ${ticketData.id_ticket}: ${errorMessage}`);
        console.error(`❌ Error al sincronizar ticket ${ticketData.id_ticket}:`, errorMessage);
        // Mantener ticket como PENDING para reintentar después
      }
    }

    const message = errors.length > 0
      ? `Sincronizados ${synced} de ${ticketsWithDetails.length} tickets. ${errors.length} errores.`
      : `Sincronizados ${synced} de ${ticketsWithDetails.length} tickets exitosamente`;

    return {
      success: synced > 0,
      message,
      synced,
      total: ticketsWithDetails.length,
      errors: errors.length > 0 ? errors : undefined,
    };
    
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido';
    console.error('❌ Error general al sincronizar tickets:', errorMessage);
    return {
      success: false,
      message: `Error al sincronizar tickets: ${errorMessage}`,
      synced: 0,
      total: 0,
    };
  }
};

