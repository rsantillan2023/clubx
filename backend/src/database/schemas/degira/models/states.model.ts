import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IState } from '../interfaces/states.interface';

class State extends Model<IState> {}

State.init(
  {
    id_state: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    description: {
      type: DataTypes.STRING(100),
    },
    id_action: {
      type: DataTypes.INTEGER,
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'States', // We need to choose the model name
    timestamps: false,
  },
);

export default State;
