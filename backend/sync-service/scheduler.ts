/**
 * Configuración de tareas programadas para sincronización
 * Este archivo puede ser usado para configuraciones avanzadas
 */

export const SCHEDULE_CONFIG = {
  // Sincronización de Partners (diario)
  PARTNERS: {
    cron: '0 2 * * *', // 2:00 AM todos los días
    description: 'Sincronización diaria de Partners',
  },
  
  // Sincronización de Products (cada 15 minutos)
  PRODUCTS: {
    cron: '*/15 * * * *', // Cada 15 minutos
    description: 'Sincronización de Products_Services cada 15 minutos',
  },
  
  // Sincronización de Visits (cada 15 minutos)
  VISITS: {
    cron: '*/15 * * * *', // Cada 15 minutos
    description: 'Sincronización de Visits cada 15 minutos',
  },
};

export default SCHEDULE_CONFIG;

