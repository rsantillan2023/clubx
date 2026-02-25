import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IUserRole } from '../interfaces/user_role.interface';

class UserRole extends Model<IUserRole> {}

UserRole.init(
  {
    id_user_role: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    id_user: {
      type: DataTypes.BIGINT,
    },
    id_role: {
      type: DataTypes.INTEGER,
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Users_Roles', // We need to choose the model name
    timestamps: false,
  },
);

export default UserRole;
