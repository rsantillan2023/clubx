import { operationAssociations } from "./schemas/degira/associations/operation.associations";
import { operationTypeAssociations } from "./schemas/degira/associations/operation_type.associations";
import { partnerAssociations } from "./schemas/degira/associations/partner.associations";
import { priceAssociations } from "./schemas/degira/associations/price.associations";
import { roleAssociations } from "./schemas/degira/associations/role.associations";
import { stateAssociations } from "./schemas/degira/associations/state.associations";
import { ticketAssociations } from "./schemas/degira/associations/tickets.associations";
import { ticketDetailsAssociations } from "./schemas/degira/associations/ticket_datails.associations";
import { userAssociations } from "./schemas/degira/associations/user.associations";
import { visitAssociations } from "./schemas/degira/associations/visit.associations";

export const initAllAssociations = () => {
  console.log('Init Assocations');
  operationAssociations();
  operationTypeAssociations();
  partnerAssociations();
  roleAssociations();
  stateAssociations();
  ticketDetailsAssociations();
  ticketAssociations();
  userAssociations();
  visitAssociations();
  priceAssociations();
};
