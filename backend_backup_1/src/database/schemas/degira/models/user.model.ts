import { DataTypes, Model } from "sequelize";
import { DEGIRA_DB } from "../../../connection";
import { IUser } from "../interfaces/user.interface";

class User extends Model<IUser> {}

User.init(
  {
    id_user: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    username: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    surname: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    // Campos opcionales que pueden no existir en la BD
    email: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    id_rol: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    id_state: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: "Users", // We need to choose the model name
    // No sincronizar automáticamente para evitar errores con columnas faltantes
    // Sequelize intentará usar solo las columnas que existen
  }
);

export default User;
