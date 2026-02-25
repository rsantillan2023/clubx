import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IPartner } from '../interfaces/partner.interface';

class Partner extends Model<IPartner> {}

Partner.init(
  {
    id_partner: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    alias: {
      type: DataTypes.STRING(20),
    },
    partner_dni: {
      type: DataTypes.STRING(15),
    },
    partner_name: {
      type: DataTypes.STRING(30),
    },
    partner_birthdate: {
      type: DataTypes.DATE,
    },
    partner_phone: {
      type: DataTypes.STRING(15),
    },
    affiliate_dni: {
      type: DataTypes.STRING(15),
    },
    affiliate_name: {
      type: DataTypes.STRING(30),
    },
    affiliate_birthdate: {
      type: DataTypes.DATE,
    },
    id_visit_type_usualy: {
      type: DataTypes.INTEGER,
    },
    partner_discharge_date: {
      type: DataTypes.DATE,
    },
    id_state: {
      type: DataTypes.INTEGER,
    },
    observations: {
      type: DataTypes.STRING(255),
    },
    suspension_reason: {
      type: DataTypes.STRING(255),
    },
    expultion_reason: {
      type: DataTypes.STRING(255),
    },
    santion_date: {
      type: DataTypes.DATE,
    },
    affiliate_phone: {
      type: DataTypes.STRING(15),
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Partners', // We need to choose the model name
    timestamps: false,
  },
);

export default Partner;
