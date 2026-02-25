import { Router, Request, Response } from 'express';
import {
  getFeaturedProducts,
  getPartnersInside,
  createConsumption,
  healthCheck,
} from './controllers/consumptions.controller';
import { syncTickets } from '../../database/local/sync/sync-tickets';
import SyncMetadata from '../../database/local/models/sync_metadata.model';

const routes = Router();

// Health check (sin autenticación)
routes.get('/health', healthCheck);

// Endpoints de consumos (sin autenticación para modo offline)
routes.get('/consumptions/get/featured', getFeaturedProducts);
routes.get('/partners/inside', getPartnersInside);
routes.post('/consumptions/create', createConsumption);

// Endpoints de sincronización
routes.get('/sync/status', async (req: Request, res: Response) => {
  try {
    const metadata = await SyncMetadata.findAll({
      order: [['resource_name', 'ASC']],
    });

    // Contar tickets pendientes
    const TicketLocal = (await import('../../database/local/models/ticket.model')).default;
    const pendingTickets = await TicketLocal.count({
      where: { sync_status: 'PENDING' },
    });

    res.status(200).json({
      success: true,
      data: {
        sync_metadata: metadata,
        pending_tickets: pendingTickets,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estado de sincronización',
    });
  }
});

routes.post('/sync/tickets', async (req: Request, res: Response) => {
  try {
    const result = await syncTickets();
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al sincronizar tickets',
    });
  }
});

export default routes;

