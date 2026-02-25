import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IOperation } from '../interfaces/operation.interface';

class Operation extends Model<IOperation> {}

Operation.init(
  {
    id_operation: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    id_user: {
      type: DataTypes.BIGINT,
    },
    id_operation_type: {
      type: DataTypes.INTEGER,
    },
    operation_metadata: {
      type: DataTypes.JSON,
    },
    operation_log: {
      type: DataTypes.JSON,
    },
    id_partner: {
      type: DataTypes.BIGINT,
    },
    id_visit: {
      type: DataTypes.BIGINT,
    },
    id_role: {
      type: DataTypes.INTEGER,
    },
    operation_date: {
      type: DataTypes.DATE,
    },
    operation_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    id_payment_method: {
      type: DataTypes.INTEGER,
    },
    id_day: {
      type: DataTypes.INTEGER,
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Operations', // We need to choose the model name
    timestamps: false,
  },
);

export default Operation;
