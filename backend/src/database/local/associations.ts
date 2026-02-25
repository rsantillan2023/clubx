/**
 * Inicializar asociaciones entre modelos locales
 */
import PartnerLocal from './models/partner.model';
import VisitLocal from './models/visit.model';
import TicketLocal from './models/ticket.model';
import TicketDetailsLocal from './models/ticket_details.model';
import ProductServiceLocal from './models/product_service.model';

export const initLocalAssociations = () => {
  // Visit -> Partner
  VisitLocal.belongsTo(PartnerLocal, {
    foreignKey: 'id_partner',
    as: 'partner',
  });

  PartnerLocal.hasMany(VisitLocal, {
    foreignKey: 'id_partner',
    as: 'visits',
  });

  // Ticket -> Visit
  TicketLocal.belongsTo(VisitLocal, {
    foreignKey: 'id_visit',
    as: 'visit',
  });

  VisitLocal.hasMany(TicketLocal, {
    foreignKey: 'id_visit',
    as: 'tickets',
  });

  // Ticket -> TicketDetails
  TicketLocal.hasMany(TicketDetailsLocal, {
    foreignKey: 'id_ticket',
    as: 'ticket_details',
  });

  TicketDetailsLocal.belongsTo(TicketLocal, {
    foreignKey: 'id_ticket',
    as: 'ticket',
  });

  // TicketDetails -> ProductService
  TicketDetailsLocal.belongsTo(ProductServiceLocal, {
    foreignKey: 'id_product_service',
    as: 'product_service',
  });

  ProductServiceLocal.hasMany(TicketDetailsLocal, {
    foreignKey: 'id_product_service',
    as: 'ticket_details',
  });

  console.log('✅ Asociaciones locales inicializadas');
};

