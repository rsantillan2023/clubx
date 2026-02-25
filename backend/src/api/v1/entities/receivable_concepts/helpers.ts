import ReceivableConcept from "../../../../database/schemas/degira/models/receivable_concepts.model";

export const getReceivableConceptsList = async () => {
    try {
        const receivableConcepts = await ReceivableConcept.findAll();
        return receivableConcepts;
    } catch (error) {
        console.log(error);
        throw error;
    }
}