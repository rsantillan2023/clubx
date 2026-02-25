import { Config } from 'sequelize';
import { IEnviromentConfig } from './enviromentConfig.interface';

const username = process.env.DB_USERNAME || '';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_DATABASE || '';
const host = process.env.DB_HOST || '';
const dialect = process.env.DB_DIALECT || '';

const config: IEnviromentConfig | any = {
  development: {
    username,
    password,
    database,
    host,
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
    database,
    host,
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
