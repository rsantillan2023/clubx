import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { createOrNullConsumption, getConsumptionsByBracelet, getFeaturedProductsList, getMinimumConsumption } from "./helpers";

export const getBraceletConsumptions = async (req: Request, res: Response) => {
    const {
        query: { id_bracelet, sortBy, sortDesc },
    } = req;
    try {
        const response = await getConsumptionsByBracelet(
            JSON.parse(
                JSON.stringify({
                    id_bracelet,
                    sortBy,
                    sortDesc: sortDesc === 'true',
                })
            ),
        );
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const getFeaturedProducts = async (req: Request, res: Response) => {
    const {
        query: { page, pageSize },
    } = req;
    try {
        const response = await getFeaturedProductsList(
            JSON.parse(
                JSON.stringify({ page: Number(page), pageSize: Number(pageSize) })
            )
        );
        responseHandler(response, res, Number(page), Number(pageSize));
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const minimumConsumption = async (req: Request, res: Response) => {
    try {
        const response = await getMinimumConsumption();
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const createConsumption = async (req: Request, res: Response) => {
    const {
        body: {
            id_user,
            roles = [],
            cart = [],
            total_consumed,
            id_bracelet,
            ticket_observations,
            id_ticket_detail = 0,
        } 
    } = req;
    try {

        const response = await createOrNullConsumption(
            id_user,
            roles,
            cart,
            total_consumed,
            id_bracelet,
            ticket_observations,
            id_ticket_detail,
        );
        responseHandler(response, res);
        
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}




















/* import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { createConsumption, getConsumptionsById, getConsumptionsList } from "./helpers";

export const getConsumptions = async (req: Request, res: Response) => {
    const {
        query: { page, pageSize },
    } = req;
    try {
        const response = await getConsumptionsList(
            JSON.parse(
                JSON.stringify({ page: Number(page), pageSize: Number(pageSize) })
            )
        );
        responseHandler(response, res, Number(page), Number(pageSize));
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const getConsumption = async (req: Request, res: Response) => {
    const {
        query: { id_bracelet },
    } = req;
    console.log(id_bracelet);
    try {
        const response = await getConsumptionsById(
            JSON.parse(
                JSON.stringify(id_bracelet)
            ),
        );
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}


export const createProductConsumption = async (req: Request, res: Response) => {
    const {
        body: { roles, id_user, id_product_service, amount, observation, id_bracelet, quantity },
    } = req;
    try {
        const response = await createConsumption(
            roles,
            id_user,
            id_product_service,
            quantity,
            observation,
            id_bracelet,
        );
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }

} */
