import PaymentMethod from "../../../../database/schemas/degira/models/payment_method.model.interface";

export const getPaymentMethodsList = async () => {
    try {
        const paymentMethods = await PaymentMethod.findAll();
        return paymentMethods;
    } catch (error) {
        console.log(error);
        throw error;
    }
}