import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getAllOperations  } from "./helpers";

export const getOperations = async (req: Request, res: Response) => {
    const {
        query: { page, pageSize, sortBy, sortDesc, searcher, tipoOperacion, fechas },
    } = req;
    try {
        const response = await getAllOperations(
            JSON.parse(
                JSON.stringify({
                    page: Number(page),
                    pageSize: Number(pageSize),
                    sortBy: sortBy,
                    sortDesc: sortDesc === 'true',
                    searcher: searcher,
                    tipoOperacion,
                    fechas,
                }),
            ),
        );
        responseHandler(response, res, Number(page), Number(pageSize));

    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

