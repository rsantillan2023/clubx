import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IVisitType } from '../interfaces/visit_type.interface';

class VisitType extends Model<IVisitType> {}

VisitType.init(
  {
    id_visit_type: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    suggest_entry_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    suggest_membership_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Visits_Types', // We need to choose the model name
    timestamps: false,
  },
);

export default VisitType;
