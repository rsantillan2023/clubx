import { Sequelize } from 'sequelize';
import config from './config/config';

// Usar 'development' por defecto si NODE_ENV no está definido
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validar que el entorno existe en la configuración, usar 'development' como fallback
const env = config[NODE_ENV] ? NODE_ENV : 'development';
if (!config[NODE_ENV]) {
  console.warn(`⚠️  Entorno '${NODE_ENV}' no encontrado en config. Usando 'development' por defecto.`);
}

const sequelizeCofig = config[env];
console.log(`✅ Conectando a base de datos para entorno: ${env} (${sequelizeCofig.database})`);

export const DEGIRA_DB = new Sequelize(sequelizeCofig);
