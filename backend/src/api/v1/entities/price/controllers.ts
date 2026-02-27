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
            page: page !== undefined && page !== null && page !== '' ? Number(page) : undefined,
            pageSize: pageSize !== undefined && pageSize !== null && pageSize !== '' ? Number(pageSize) : undefined,
            sortBy: sortBy as string | undefined,
            sortDesc: String(sortDesc) === 'true',
            id_day: id_day !== undefined && id_day !== null && id_day !== '' ? Number(id_day) : undefined,
            id_visit_type: id_visit_type !== undefined && id_visit_type !== null && id_visit_type !== '' ? Number(id_visit_type) : undefined,
            id_receivable_concept: id_receivable_concept !== undefined && id_receivable_concept !== null && id_receivable_concept !== '' ? Number(id_receivable_concept) : undefined,
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

    const roleIds: number[] = Array.isArray(roles)
        ? roles.map((r: any) => (typeof r === 'object' && r != null && r.id_role != null ? Number(r.id_role) : Number(r))).filter((id) => !isNaN(id) && id > 0)
        : [];

    try {
        const transaction = await DEGIRA_DB.transaction();

        try {
            const response = await bulkUpdatePrices(
                {
                    ids: Array.isArray(ids) ? ids.map(id => Number(id)) : [Number(ids)],
                    updateType: updateType as 'percentage' | 'absolute' | 'relative',
                    value: Number(value),
                },
                Number(id_user) || 0,
                roleIds,
                transaction,
            );

            await transaction.commit();
            responseHandler(response, res);
        } catch (error: any) {
            try {
                await transaction.rollback();
            } catch (_) {}
            throw error;
        }
    } catch (error: any) {
        const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
        res.status(code).send({ message });
    }
}

export const putUpdatePrice = async (req: Request, res: Response) => {
    console.log('[BACKEND price/update] PETICIÓN RECIBIDA en este servidor');
    const {
        body: {
            id_user = '',
            roles = [],
            id_price = 0,
            total_amount = 0,
        },
    } = req;

    console.log('[price/update] body recibido:', { id_price, total_amount, id_user, roles: Array.isArray(roles) ? roles.length : roles });

    // El login devuelve roles como [{ id_role, description }, ...]; normalizar a number[] para el helper
    const roleIds: number[] = Array.isArray(roles)
        ? roles.map((r: any) => (typeof r === 'object' && r != null && r.id_role != null ? Number(r.id_role) : Number(r))).filter((id) => !isNaN(id) && id > 0)
        : [];

    try {
        const transaction = await DEGIRA_DB.transaction();

        try {
            const response = await updatePrice(
                Number(id_price),
                Number(total_amount),
                Number(id_user) || 0,
                roleIds,
                transaction,
            );

            await transaction.commit();
            responseHandler(response, res);
        } catch (error: any) {
            try {
                await transaction.rollback();
            } catch (_) {
                // La transacción ya pudo estar cerrada; no enmascarar el error original
            }
            throw error;
        }
    } catch (error: any) {
        const code = (error && error.code) || 400;
        let message = (error && error.message) || 'Error Desconocido';
        if (typeof message === 'string' && message.includes('rolled back')) {
            message = 'Error al actualizar el precio. Revise los datos e intente de nuevo.';
        }
        console.log('[price/update] error:', code, message);
        res.status(code).send({ message });
    }
}