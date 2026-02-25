/**
 * Servicio para sincronización manual de tickets pendientes
 */
import axios from 'axios';

const LOCAL_API_URL = 'http://localhost:3001/api/v1';

/**
 * Obtener estado de sincronización
 */
export const getSyncStatus = async () => {
  try {
    const response = await axios.get(`${LOCAL_API_URL}/sync/status`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error al obtener estado de sincronización:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener estado',
    };
  }
};

/**
 * Sincronizar tickets pendientes (PUSH manual)
 */
export const syncPendingTickets = async () => {
  try {
    const response = await axios.post(`${LOCAL_API_URL}/sync/tickets`);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.data?.message || 'Sincronización completada',
    };
  } catch (error) {
    console.error('Error al sincronizar tickets:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al sincronizar tickets',
    };
  }
};

export default {
  getSyncStatus,
  syncPendingTickets,
};

