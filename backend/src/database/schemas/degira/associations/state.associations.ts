import Action from "../models/action.model"
import State from "../models/states.model"

export const stateAssociations = () => {
    State.belongsTo(Action, {
        foreignKey: "id_action",
        as: "actions",
    })
}