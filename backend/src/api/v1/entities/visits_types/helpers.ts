import VisitType from "../../../../database/schemas/degira/models/visit_type.model"

export const getVisitsTypesList = async () => {
    const visitTypes = await VisitType.findAll({
        order: [
            ['id_visit_type', 'ASC'],
        ],
    });
    return visitTypes;
}