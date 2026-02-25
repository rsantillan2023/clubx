import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getReceivableConceptsList } from "./helpers";

export const getReceivableConcepts = async (req: Request, res: Response) => {
    try {
        const response = await getReceivableConceptsList();
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}