import Ticket from "../models/ticket.model"
import TicketDetails from "../models/ticket_details.model";
import Visit from "../models/visit.model"

export const ticketAssociations = () => {
    Ticket.belongsTo(Visit, {
        foreignKey: 'id_visit',
        as: 'visit',
    });

    Ticket.hasMany(TicketDetails, { 
        as: 'ticket_details', 
        foreignKey: 'id_ticket' 
    });
};