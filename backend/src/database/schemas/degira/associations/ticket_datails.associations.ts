import ProductService from "../models/product_service.model";
import Ticket from "../models/ticket.model";
import TicketDetails from "../models/ticket_details.model";

export const ticketDetailsAssociations = () => {
    TicketDetails.belongsTo(Ticket, {
        foreignKey: 'id_ticket',
        as: 'ticket',
    });

    TicketDetails.belongsTo(ProductService, {
        foreignKey: 'id_product_service',
        as: 'product_service',
    })
}
