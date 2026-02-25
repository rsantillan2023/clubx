import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IOperationType } from '../interfaces/operation_type.interface';

class OperationType extends Model<IOperationType> {}

OperationType.init(
  {
    id_operation_type: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    action: {
      type: DataTypes.STRING(255),
    },
    id_role: {
      type: DataTypes.INTEGER,
    },
    tag: {
      type: DataTypes.STRING(10),
    },
    icon: {
      type: DataTypes.STRING(255),
    },
    path: {
      type: DataTypes.STRING(45),
    },
    order: {
      type: DataTypes.INTEGER,
    },
    menu_available:{
      type: DataTypes.TINYINT,
    }
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Operations_Types', // We need to choose the model name
    timestamps: false,
  },
);

export default OperationType;
