import axios from 'axios';
import VisitLocal from '../models/visit.model';
import SyncMetadata from '../models/sync_metadata.model';
import { LOCAL_DB } from '../connection';

const REMOTE_API_URL = process.env.REMOTE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Sincroniza Visits de los últimos 3 días del servidor remoto a SQLite local
 * Se ejecuta cada 15 minutos (incremental)
 */
export const syncVisits = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  const transaction = await LOCAL_DB.transaction();
  
  try {
    console.log('🔄 Iniciando sincronización de Visits...');
    
    // Calcular fecha de hace 3 días
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    // Obtener metadata de última sincronización
    const lastSync = await SyncMetadata.findOne({
      where: { resource_name: 'visits' },
      transaction,
    });

    // Determinar fecha desde la cual sincronizar (incremental)
    const lastSyncData = lastSync ? lastSync.toJSON() : null;
    const sinceDate = lastSyncData?.last_sync_date 
      ? new Date(lastSyncData.last_sync_date) 
      : threeDaysAgo;

    // Obtener visitas del servidor remoto
    // Nota: Asumiendo que existe endpoint que permite filtrar por fecha
    const response = await axios.get(`${REMOTE_API_URL}/visits/`, {
      timeout: 30000,
      params: {
        page: 1,
        pageSize: 10000,
        since: sinceDate.toISOString(),
        hour_exit: null, // Solo visitas activas
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.data || !response.data.data) {
      throw new Error('Respuesta inválida del servidor remoto');
    }

    const visits = Array.isArray(response.data.data) 
      ? response.data.data 
      : (response.data.data.rows || []);

    if (visits.length === 0) {
      console.log('ℹ️  No hay visitas nuevas para sincronizar');
      await transaction.rollback();
      return { success: true, message: 'No hay visitas nuevas', count: 0 };
    }

    // Filtrar solo visitas de los últimos 3 días
    const recentVisits = visits.filter((visit: any) => {
      const visitDate = new Date(visit.visit_date);
      return visitDate >= threeDaysAgo;
    });

    if (recentVisits.length === 0) {
      console.log('ℹ️  No hay visitas recientes (últimos 3 días) para sincronizar');
      await transaction.rollback();
      return { success: true, message: 'No hay visitas recientes', count: 0 };
    }

    // Sincronizar usando bulkCreate con updateOnDuplicate
    await VisitLocal.bulkCreate(recentVisits, {
      updateOnDuplicate: [
        'id_partner',
        'visit_date',
        'id_state',
        'id_visit_type',
        'other_visit_obs',
        'entry_visit_obs',
        'exit_visit_obs',
        'entry_amount_paid',
        'visit_amount_consumed',
        'exit_amount_payed',
        'hour_entry',
        'hour_exit',
        'id_bracelet_1',
        'id_bracelet_2',
        'last_visit',
        'id_day',
        'extra_entry',
        'extra_exit',
        'extra_entry_obs',
        'extra_exit_obs',
        'had_to_paid',
      ],
      transaction,
    });

    // Actualizar metadata
    await SyncMetadata.upsert(
      {
        resource_name: 'visits',
        last_sync_date: new Date(),
        sync_status: 'SUCCESS',
        error_message: undefined,
      },
      { transaction }
    );

    await transaction.commit();
    
    console.log(`✅ Visits sincronizadas exitosamente: ${recentVisits.length} registros`);
    return { success: true, message: 'Visits sincronizadas exitosamente', count: recentVisits.length };
    
  } catch (error: any) {
    await transaction.rollback();
    
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    console.error('❌ Error al sincronizar Visits:', errorMessage);
    
    // Guardar error en metadata
    await SyncMetadata.upsert({
      resource_name: 'visits',
      sync_status: 'ERROR',
      error_message: errorMessage,
    });
    
    return { success: false, message: `Error al sincronizar Visits: ${errorMessage}` };
  }
};

