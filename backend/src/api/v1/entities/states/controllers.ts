import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getStatesList } from "./helpers";

export const getStates = async (req: Request, res: Response) => {
    try{
        const response = await getStatesList();
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Unknown error" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}