import { DataTypes, Model } from "sequelize";
import { DEGIRA_DB } from "../../../connection";
import { IRol } from "../interfaces/rol.interface";

class Rol extends Model<IRol> {}

Rol.init(
  {
    id_rol: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    description: {
      type: DataTypes.STRING(255),
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: "Roles",
  }
);

export default Rol;
