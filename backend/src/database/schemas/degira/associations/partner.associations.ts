import Partner from '../models/partner.model';
import State from '../models/states.model';
import Visit from '../models/visit.model';
import VisitType from '../models/visit_type.model';

export const partnerAssociations = () => {
  Partner.belongsTo(State, {
    foreignKey: 'id_state',
    as: 'state',
  });

  Partner.belongsTo(VisitType, {
    foreignKey: 'id_visit_type_usualy',
    as: 'visit_type',
  });

  Partner.hasMany(Visit, {
    foreignKey: 'id_partner',
  });
};
