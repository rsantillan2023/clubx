import { DataTypes, Model } from 'sequelize';
import { DEGIRA_DB } from '../../../connection';
import { ITicketDetails } from '../interfaces/ticket_details.interface';

class TicketDetails extends Model<ITicketDetails> { }

TicketDetails.init(
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
        // Other model options go here
        sequelize: DEGIRA_DB, // We need to pass the connection instance
        tableName: 'Ticket_Details', // We need to choose the model name
        timestamps: false,
    },
);

export default TicketDetails;