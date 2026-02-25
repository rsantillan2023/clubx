import { DataTypes, Model } from 'sequelize';
import { LOCAL_DB } from '../connection';
import { IVisit } from '../../schemas/degira/interfaces/visit.interface';

class VisitLocal extends Model<IVisit> {}

// Importación circular resuelta en associations.ts

VisitLocal.init(
  {
    id_visit: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    id_partner: {
      type: DataTypes.BIGINT,
    },
    visit_date: {
      type: DataTypes.DATE,
    },
    id_state: {
      type: DataTypes.INTEGER,
    },
    id_visit_type: {
      type: DataTypes.INTEGER,
    },
    other_visit_obs: {
      type: DataTypes.STRING(255),
    },
    entry_visit_obs: {
      type: DataTypes.STRING(255),
    },
    exit_visit_obs: {
      type: DataTypes.STRING(255),
    },
    entry_amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
    },
    visit_amount_consumed: {
      type: DataTypes.DECIMAL(10, 2),
    },
    exit_amount_payed: {
      type: DataTypes.DECIMAL(10, 2),
    },
    hour_entry: {
      type: DataTypes.DATE,
    },
    hour_exit: {
      type: DataTypes.DATE,
    },
    id_bracelet_1: {
      type: DataTypes.STRING(255),
    },
    id_bracelet_2: {
      type: DataTypes.STRING(255),
    },
    last_visit: {
      type: DataTypes.DATE,
    },
    id_day: {
      type: DataTypes.INTEGER,
    },
    extra_entry: {
      type: DataTypes.DECIMAL(10, 2),
    },
    extra_exit: {
      type: DataTypes.DECIMAL(10, 2),
    },
    extra_entry_obs: {
      type: DataTypes.STRING(100),
    },
    extra_exit_obs: {
      type: DataTypes.STRING(100),
    },
    had_to_paid: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
  {
    sequelize: LOCAL_DB,
    tableName: 'Visits',
    timestamps: false,
  }
);

export default VisitLocal;

