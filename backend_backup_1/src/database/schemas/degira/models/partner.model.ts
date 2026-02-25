import { DataTypes, Model } from "sequelize";
import { DEGIRA_DB } from "../../../connection";
import { IPartner } from "../interfaces/partner.interface";

class Partner extends Model<IPartner> {}

Partner.init(
  {
    id_partner: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    alias: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    id_state: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize: DEGIRA_DB,
    tableName: "partners",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Partner;
