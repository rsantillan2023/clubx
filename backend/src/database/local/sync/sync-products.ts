import axios from 'axios';
import ProductServiceLocal from '../models/product_service.model';
import SyncMetadata from '../models/sync_metadata.model';
import { LOCAL_DB } from '../connection';
import * as crypto from 'crypto';

const REMOTE_API_URL = process.env.REMOTE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Calcula hash MD5 de un array de productos para detectar cambios
 */
const calculateHash = (products: any[]): string => {
  const data = JSON.stringify(products.map(p => ({
    id: p.id_product_service,
    description: p.description,
    price: p.price,
    available: p.available,
    featured: p.featured,
  })));
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Sincroniza Products_Services del servidor remoto a SQLite local
 * Se ejecuta cada 15 minutos
 * Solo sincroniza si hubo cambios (comparando hash)
 */
export const syncProducts = async (): Promise<{ success: boolean; message: string; count?: number; changed?: boolean }> => {
  const transaction = await LOCAL_DB.transaction();
  
  try {
    console.log('🔄 Iniciando sincronización de Products_Services...');
    
    // Obtener metadata de última sincronización
    const lastSync = await SyncMetadata.findOne({
      where: { resource_name: 'products_services' },
      transaction,
    });

    // Obtener productos del servidor remoto
    const response = await axios.get(`${REMOTE_API_URL}/products_services/`, {
      timeout: 30000,
      params: {
        page: 1,
        pageSize: 10000, // Obtener todos
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.data || !response.data.data) {
      throw new Error('Respuesta inválida del servidor remoto');
    }

    const products = Array.isArray(response.data.data) 
      ? response.data.data 
      : (response.data.data.rows || []);

    if (products.length === 0) {
      console.log('⚠️  No se encontraron productos para sincronizar');
      await transaction.rollback();
      return { success: true, message: 'No hay productos para sincronizar', count: 0, changed: false };
    }

    // Calcular hash de productos remotos
    const remoteHash = calculateHash(products);
    const lastSyncData = lastSync ? lastSync.toJSON() : null;
    const localHash = (lastSyncData as any)?.last_sync_hash || '';

    // Si el hash es igual, no hay cambios
    if (remoteHash === localHash && lastSync) {
      console.log('ℹ️  No hay cambios en Products_Services, omitiendo sincronización');
      await transaction.rollback();
      return { success: true, message: 'No hay cambios', count: products.length, changed: false };
    }

    // Hay cambios, sincronizar
    await ProductServiceLocal.bulkCreate(products, {
      updateOnDuplicate: [
        'description',
        'available',
        'long_description',
        'price',
        'url_image',
        'featured',
      ],
      transaction,
    });

    // Actualizar metadata
    await SyncMetadata.upsert(
      {
        resource_name: 'products_services',
        last_sync_date: new Date(),
        last_sync_hash: remoteHash,
        sync_status: 'SUCCESS',
        error_message: undefined,
      },
      { transaction }
    );

    await transaction.commit();
    
    console.log(`✅ Products_Services sincronizados exitosamente: ${products.length} registros`);
    return { success: true, message: 'Products_Services sincronizados exitosamente', count: products.length, changed: true };
    
  } catch (error: any) {
    await transaction.rollback();
    
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    console.error('❌ Error al sincronizar Products_Services:', errorMessage);
    
    // Guardar error en metadata
    await SyncMetadata.upsert({
      resource_name: 'products_services',
      sync_status: 'ERROR',
      error_message: errorMessage,
    });
    
    return { success: false, message: `Error al sincronizar Products_Services: ${errorMessage}` };
  }
};

