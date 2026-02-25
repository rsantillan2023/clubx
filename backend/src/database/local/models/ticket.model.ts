import { DataTypes, Model } from 'sequelize';
import { LOCAL_DB } from '../connection';
import { ITicket } from '../../schemas/degira/interfaces/tickets.interface';

interface ITicketLocal extends ITicket {
  sync_status?: string;
  remote_id_ticket?: number;
  synced_at?: Date;
  created_offline?: boolean;
}

class TicketLocal extends Model<ITicketLocal> {}

TicketLocal.init(
  {
    id_ticket: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT,
    },
    id_visit: {
      type: DataTypes.BIGINT,
    },
    id_bracelet: {
      type: DataTypes.STRING(255),
    },
    observations: {
      type: DataTypes.STRING(255),
    },
    ticket_date: {
      type: DataTypes.DATE,
    },
    ticket_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    sync_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'SYNCED',
    },
    remote_id_ticket: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_offline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: LOCAL_DB,
    tableName: 'Tickets',
    timestamps: false,
  },
);

export default TicketLocal;

