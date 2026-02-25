import { DataTypes, Model } from 'sequelize';
import { LOCAL_DB } from '../connection';
import { ITicketDetails } from '../../schemas/degira/interfaces/ticket_details.interface';

class TicketDetailsLocal extends Model<ITicketDetails> {}

TicketDetailsLocal.init(
  {
    id_ticket_detail: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    id_ticket: {
      type: DataTypes.BIGINT,
    },
    id_product_service: {
      type: DataTypes.INTEGER,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    payed: {
      type: DataTypes.TINYINT,
    },
    ref_id_ticket_detail: {
      type: DataTypes.BIGINT,
    },
    state: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize: LOCAL_DB,
    tableName: 'Ticket_Details',
    timestamps: false,
  },
);

export default TicketDetailsLocal;

