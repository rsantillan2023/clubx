import { Includeable } from "sequelize";
import Action from "../../../../database/schemas/degira/models/action.model";
import State from "../../../../database/schemas/degira/models/states.model";

const actionIncludeable: Includeable = {
    model: Action,
    as: 'actions',
};

export const getStatesList = async () => {
    try {
        const states = await State.findAll({
            include: [actionIncludeable],
        });
        return states;
    } catch (error) {
        throw error;
    }
}