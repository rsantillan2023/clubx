import axios from 'axios';
import PartnerLocal from '../models/partner.model';
import SyncMetadata from '../models/sync_metadata.model';
import { LOCAL_DB } from '../connection';

const REMOTE_API_URL = process.env.REMOTE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Sincroniza todos los Partners del servidor remoto a SQLite local
 * Se ejecuta diariamente al iniciar el servicio
 */
export const syncPartners = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  const transaction = await LOCAL_DB.transaction();
  
  try {
    console.log('🔄 Iniciando sincronización de Partners...');
    
    // Obtener partners del servidor remoto
    // Nota: Asumiendo que existe endpoint /partners/list que devuelve todos los partners
    const response = await axios.get(`${REMOTE_API_URL}/partners/list`, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.data || !response.data.data) {
      throw new Error('Respuesta inválida del servidor remoto');
    }

    const partners = Array.isArray(response.data.data) 
      ? response.data.data 
      : (response.data.data.rows || []);

    if (partners.length === 0) {
      console.log('⚠️  No se encontraron partners para sincronizar');
      await transaction.rollback();
      return { success: true, message: 'No hay partners para sincronizar', count: 0 };
    }

    // Sincronizar usando bulkCreate con updateOnDuplicate
    await PartnerLocal.bulkCreate(partners, {
      updateOnDuplicate: [
        'alias',
        'partner_dni',
        'partner_name',
        'partner_birthdate',
        'partner_phone',
        'affiliate_dni',
        'affiliate_name',
        'affiliate_birthdate',
        'id_visit_type_usualy',
        'partner_discharge_date',
        'id_state',
        'observations',
        'suspension_reason',
        'expultion_reason',
        'santion_date',
        'affiliate_phone',
      ],
      transaction,
    });

    // Actualizar metadata de sincronización
    await SyncMetadata.upsert(
      {
        resource_name: 'partners',
        last_sync_date: new Date(),
        sync_status: 'SUCCESS',
        error_message: undefined,
      },
      { transaction }
    );

    await transaction.commit();
    
    console.log(`✅ Partners sincronizados exitosamente: ${partners.length} registros`);
    return { success: true, message: 'Partners sincronizados exitosamente', count: partners.length };
    
  } catch (error: any) {
    await transaction.rollback();
    
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    console.error('❌ Error al sincronizar Partners:', errorMessage);
    
    // Guardar error en metadata
    await SyncMetadata.upsert({
      resource_name: 'partners',
      sync_status: 'ERROR',
      error_message: errorMessage,
    });
    
    return { success: false, message: `Error al sincronizar Partners: ${errorMessage}` };
  }
};

