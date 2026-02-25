import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { IUserDealer } from '../interfaces/userDealer.interface';

class UserDealer extends Model<IUserDealer> {}

UserDealer.init(
  {
    id_user_dealer: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    id_user: {
      type: DataTypes.BIGINT,
    },
    id_dealer: {
      type: DataTypes.BIGINT,
    },
  },
  {
    // Other model options go here
    sequelize: DEGIRA_DB, // We need to pass the connection instance
    tableName: 'UserDealers', // We need to choose the model name
  },
);

export default UserDealer;
