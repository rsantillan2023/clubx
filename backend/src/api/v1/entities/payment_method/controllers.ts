import { Request, response, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getPaymentMethodsList } from "./helpers";

export const getPaymentMethods = async (req: Request, res: Response) => {
    try {
        const response = await getPaymentMethodsList();
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}