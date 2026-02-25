import Day from '../models/day.model';
import Partner from '../models/partner.model';
import State from '../models/states.model';
import Ticket from '../models/ticket.model';
import Visit from '../models/visit.model';
import VisitType from '../models/visit_type.model';

export const visitAssociations = () => {
  Visit.belongsTo(VisitType, {
    foreignKey: 'id_visit_type',
    as: 'visit_type',
  });
  Visit.belongsTo(Partner, {
    foreignKey: 'id_partner',
    as: 'partner',
  });
  Visit.belongsTo(State, {
    foreignKey: 'id_state',
    as: 'state',
  });
  Visit.hasMany(Ticket, {
    foreignKey: 'id_visit',
    as: 'tickets',
  })

  Visit.belongsTo(Day, {
    foreignKey: 'id_day',
    as: 'days',
  })
/*   Visit.hasMany(BraceletConsumption, {
    foreignKey: {
      name: 'id_bracelet_1',
      allowNull: true
    },
    as: 'bracelet_consumptions_1'
  });
  
  Visit.hasMany(BraceletConsumption, {
    foreignKey: {
      name: 'id_bracelet_2',
      allowNull: true
    },
    as: 'bracelet_consumptions_2'
  }); */
  
};
