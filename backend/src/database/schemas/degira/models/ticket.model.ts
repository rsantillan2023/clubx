import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { ITicket } from '../interfaces/tickets.interface';

class Ticket extends Model<ITicket> { }

Ticket.init(
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
    },
    {
        // Other model options go here
        sequelize: DEGIRA_DB, // We need to pass the connection instance
        tableName: 'Tickets', // We need to choose the model name
        timestamps: false,
    },
);

export default Ticket;