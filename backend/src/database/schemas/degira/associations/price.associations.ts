import Day from "../models/day.model";
import Price from "../models/price.model";
import ReceivableConcept from "../models/receivable_concepts.model";
import VisitType from "../models/visit_type.model";

export const priceAssociations = () => {
    Price.belongsTo(ReceivableConcept, {
        foreignKey: 'id_receivable_concept',
        as: 'receivable_concept',
    });
    Price.belongsTo(Day, {
        foreignKey: 'id_day',
        as: 'day',
    });
    Price.belongsTo(VisitType, {
        foreignKey: 'id_visit_type',
        as: 'visit_type',
    });
}