import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IAction } from '../interfaces/action.interface';

class Action extends Model<IAction> { }

Action.init(
  {
    id_action: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    description: {
      type: DataTypes.STRING(100),
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Actions', // We need to choose the model name
    timestamps: false,
  },
);

export default Action;
