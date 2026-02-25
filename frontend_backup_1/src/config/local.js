// Configuración para desarrollo local
export const LOCAL_CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api/v1/degira/',
  LOGIN_URI: 'http://localhost:3000/api/v1/degira/users/login',
  REGISTER: 'http://localhost:3000/api/v1/degira/partners/register',
  PARTNERS: 'http://localhost:3000/api/v1/degira/partners',
  PARTNERS_UPDATE: 'http://localhost:3000/api/v1/degira/partners/update',
  ENTRY_REGISTER: 'http://localhost:3000/api/v1/degira/visits/entry',
  VISITS: 'http://localhost:3000/api/v1/degira/visits/',
  BUTTONS: 'http://localhost:3000/api/v1/degira/buttons',
  GOOGLE_MAPS_KEY: 'your_google_maps_key_here'
};

// Función para obtener la URL correcta según el entorno
export const getApiUrl = (endpoint) => {
  // Si estamos en desarrollo local, usar configuración local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return LOCAL_CONFIG[endpoint] || LOCAL_CONFIG.API_BASE_URL;
  }
  
  // Si no, usar las variables de entorno (producción)
  return process.env[`VUE_APP_${endpoint}`] || process.env.VUE_APP_DEGIRA;
};
