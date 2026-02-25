/**
 * Interceptor HTTP para detección automática de modo offline
 * Intercepta todas las llamadas HTTP y redirige a API local si el servidor remoto está caído
 * NO MODIFICA ningún componente existente, funciona automáticamente
 */

import axios from 'axios';

const REMOTE_API_URL = process.env.VUE_APP_DEGIRA || '';
const LOCAL_API_URL = 'http://localhost:3001/api/v1';

// Endpoints que pueden usar modo offline
const OFFLINE_ENABLED_ENDPOINTS = [
  'consumptions/get/featured',
  'consumptions/create',
  'partners/inside',
];

/**
 * Verifica si una URL debe usar modo offline
 */
const shouldUseOffline = (url) => {
  if (!url || !REMOTE_API_URL || !url.includes(REMOTE_API_URL)) {
    return false;
  }
  return OFFLINE_ENABLED_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

/**
 * Intercepta requests antes de enviarlas
 * No hacemos health check preventivo, solo interceptamos en caso de error
 */
axios.interceptors.request.use(
  function (config) {
    // No modificamos el request inicialmente
    // La detección offline se hace en el interceptor de respuesta
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

/**
 * Intercepta responses para manejar errores de conexión
 */
axios.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    // Si hay error de conexión y la URL es de un endpoint offline, intentar con local
    if (
      error.config &&
      error.config.url &&
      shouldUseOffline(error.config.url) &&
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response || error.response?.status >= 500)
    ) {
      console.log('🔄 Error de conexión con servidor remoto, intentando con API local...');
      
      // Cambiar URL a local
      const localUrl = error.config.url.replace(REMOTE_API_URL, LOCAL_API_URL);
      
      try {
        // Reintentar con API local
        const response = await axios({
          ...error.config,
          url: localUrl,
        });
        return response;
      } catch (localError) {
        // Si también falla la API local, retornar error original
        console.error('❌ Error también con API local:', localError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Exportar función para verificar estado manualmente (para componentes)
export const isRemoteServerAvailable = () => true; // Por defecto asumimos online
export const checkRemoteStatus = async () => {
  // Función para verificar estado remoto si es necesario
  // Por ahora retornamos true, la detección se hace por errores
  return true;
};

console.log('✅ Interceptor HTTP offline inicializado');

