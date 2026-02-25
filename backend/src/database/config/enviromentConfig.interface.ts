import { Config } from 'sequelize';

export interface IEnviromentConfig {
  development: Config;
  test: Config;
  production: Config;
}
