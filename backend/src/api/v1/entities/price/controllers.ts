import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { priceSearcher, getPricesList, bulkUpdatePrices, updatePrice } from "./helpers";
import { DEGIRA_DB } from "../../../../database/connection";

export const getPrice = async (req: Request, res: Response) => {
    const {
        query: {
            id_visit_type,
            id_payment_method,
            id_receivable_concept,
        }
    } = req;
    try {
        const response = await priceSearcher(
            JSON.parse(
                JSON.stringify({
                    id_visit_type,
                    id_payment_method,
                    id_receivable_concept,
                })
            )
        )
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const getPricesListController = async (req: Request, res: Response) => {
    const {
        query: {
            page,
            pageSize,
            sortBy,
            sortDesc,
            id_day,
            id_visit_type,
            id_receivable_concept,
        }
    } = req;

    try {
        const params = {
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            sortBy: sortBy as string | undefined,
            sortDesc: sortDesc === 'true',
            id_day: id_day ? Number(id_day) : undefined,
            id_visit_type: id_visit_type ? Number(id_visit_type) : undefined,
            id_receivable_concept: id_receivable_concept ? Number(id_receivable_concept) : undefined,
        };

        const response = await getPricesList(params);
        responseHandler(response, res, params.page, params.pageSize);
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const putBulkUpdatePrices = async (req: Request, res: Response) => {
    const {
        body: {
            id_user = '',
            roles = [],
            ids = [],
            updateType = '',
            value = 0,
        },
    } = req;

    try {
        const transaction = await DEGIRA_DB.transaction();
        
        try {
            const response = await bulkUpdatePrices(
                {
                    ids: Array.isArray(ids) ? ids.map(id => Number(id)) : [Number(ids)],
                    updateType: updateType as 'percentage' | 'absolute' | 'relative',
                    value: Number(value),
                },
                id_user,
                roles,
                transaction,
            );
            
            await transaction.commit();
            responseHandler(response, res);
        } catch (error: any) {
            await transaction.rollback();
            throw error;
        }
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const putUpdatePrice = async (req: Request, res: Response) => {
    const {
        body: {
            id_user = '',
            roles = [],
            id_price = 0,
            total_amount = 0,
        },
    } = req;

    try {
        const transaction = await DEGIRA_DB.transaction();
        
        try {
            const response = await updatePrice(
                Number(id_price),
                Number(total_amount),
                id_user,
                roles,
                transaction,
            );
            
            await transaction.commit();
            responseHandler(response, res);
        } catch (error: any) {
            await transaction.rollback();
            throw error;
        }
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}