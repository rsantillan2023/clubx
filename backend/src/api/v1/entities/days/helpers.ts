import Day from "../../../../database/schemas/degira/models/day.model";

export const getDaysList = async () => {
    try {
        const days = await Day.findAll();
        return days;
    } catch (error) {
        console.log(error);
        throw error;
    }
}