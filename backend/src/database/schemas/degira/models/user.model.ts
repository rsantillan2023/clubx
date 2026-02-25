import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IUser } from '../interfaces/user.interface';

class User extends Model<IUser> {}

User.init(
  {
    id_user: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    name: {
      type: DataTypes.STRING(30),
    },
    surname: {
      type: DataTypes.STRING(45),
    },
    username: {
      type: DataTypes.STRING(45),
    },
    password: {
      type: DataTypes.STRING(255),
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'Users', // We need to choose the model name
    timestamps: false,
  },
);

export default User;
