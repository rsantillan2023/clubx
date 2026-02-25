import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getVisitsTypesList } from "./helpers";

export const getVisitsTypes = async (req: Request, res: Response) => {
    try {
        const response = await getVisitsTypesList();
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Unknown error" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}