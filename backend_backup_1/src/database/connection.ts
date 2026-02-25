import { Sequelize } from "sequelize";
import config from "./config/config";

const NODE_ENV = process.env.NODE_ENV || "";

const sequelizeCofig = config[NODE_ENV];

export const DEGIRA_DB = new Sequelize(sequelizeCofig);
