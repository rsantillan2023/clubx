import { Config } from 'sequelize';
import { IEnviromentConfig } from './enviromentConfig.interface';

const username = process.env.DB_USERNAME || '';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || '';
const dialect = process.env.DB_DIALECT || '';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

// Usar diferentes bases de datos según el entorno
const database = process.env.DB_DATABASE || '';
const databaseDev = process.env.DB_DATABASE_DEV || 'miclub_db_dev';
const databaseProd = process.env.DB_DATABASE_PROD || process.env.DB_DATABASE || 'miclub_db';

const config: IEnviromentConfig | any = {
  development: {
    username,
    password,
    database: databaseDev, // Base de datos de desarrollo
    host,
    port,
    dialect,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by',
      updatedBy: 'updated_by',
    },
    logging: false,
    quoteIdentifiers: false,
  },
  test: {
    username,
    password,
    database,
    host,
    port,
    dialect,
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by',
      updatedBy: 'updated_by',
    },
    logging: true,
    quoteIdentifiers: false,
  },
  production: {
    username,
    password,
    database: databaseProd, // Base de datos de producción
    host,
    port,
    dialect,
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by',
      updatedBy: 'updated_by',
    },
    logging: false,
    quoteIdentifiers: false,
  },
};

export = config;
