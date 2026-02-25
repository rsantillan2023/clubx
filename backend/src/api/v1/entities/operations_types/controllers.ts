import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import {
    assignRoleToOperationType,
    createOperationType,
    deleteOperationType,
    getAllOperationsTypes,
    getOperationTypeById,
    getOperationTypeList,
    getOperationsByRole,
    getOperationsTypesList,
    updateOperationType,
} from "./helpers";
import { ICreateOperationType, IOperationTypeParams, IUpdateOperationType } from "./types";

// ==================== ENDPOINTS EXISTENTES (MANTENER COMPATIBILIDAD) ====================

export const getOperationsTypes = async (req: Request, res: Response) => {
    const {
        query: { id_user },
        body: { id_user: id_user_body },
    } = req;
    try {
        // El id_user puede venir en query o en body (compatibilidad)
        const id_user_final = (id_user as string) || id_user_body || req.body.id_user;
        const response = await getOperationsTypesList(id_user_final as string);
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

export const getAllOperationsTypesController = async (req: Request, res: Response) => {
    try {
        const response = await getAllOperationsTypes();
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

// ==================== CRUD DE OPERATIONS_TYPES ====================

export const getOperationsTypesListController = async (req: Request, res: Response) => {
    const {
        query: { page, pageSize, roleId, search, menuAvailable },
    } = req;
    try {
        const params: IOperationTypeParams = {
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            roleId: roleId ? Number(roleId) : undefined,
            search: search as string,
            menuAvailable: menuAvailable ? Number(menuAvailable) : undefined,
        };
        const response = await getOperationTypeList(params);
        responseHandler(response, res, Number(page) || 1, Number(pageSize) || 10);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

export const getOperationType = async (req: Request, res: Response) => {
    const {
        params: { id },
    } = req;
    try {
        const id_operation_type = Number(id);
        if (!id_operation_type) {
            return res.status(400).send({ message: "ID de operación inválido" });
        }
        const response = await getOperationTypeById(id_operation_type);
        if (!response) {
            return res.status(404).send({ message: "Tipo de operación no encontrado" });
        }
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

export const postOperationType = async (req: Request, res: Response) => {
    const { body } = req;
    try {
        const operationData: ICreateOperationType = {
            description: body.description,
            action: body.action,
            id_role: body.id_role,
            tag: body.tag,
            icon: body.icon,
            path: body.path,
            menu_available: body.menu_available,
            order: body.order,
        };
        const response = await createOperationType(operationData);
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

export const putOperationType = async (req: Request, res: Response) => {
    const {
        params: { id },
        body,
    } = req;
    try {
        const id_operation_type = Number(id);
        if (!id_operation_type) {
            return res.status(400).send({ message: "ID de operación inválido" });
        }
        const operationData: IUpdateOperationType = {
            description: body.description,
            action: body.action,
            id_role: body.id_role,
            tag: body.tag,
            icon: body.icon,
            path: body.path,
            menu_available: body.menu_available,
            order: body.order,
        };
        const response = await updateOperationType(id_operation_type, operationData);
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

export const deleteOperationTypeController = async (req: Request, res: Response) => {
    const {
        params: { id },
    } = req;
    try {
        const id_operation_type = Number(id);
        if (!id_operation_type) {
            return res.status(400).send({ message: "ID de operación inválido" });
        }
        await deleteOperationType(id_operation_type);
        responseHandler({ message: "Tipo de operación eliminado correctamente" }, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

// ==================== GESTIÓN POR ROL ====================

export const getOperationsByRoleController = async (req: Request, res: Response) => {
    const {
        params: { roleId },
    } = req;
    try {
        const id_role = Number(roleId);
        if (!id_role) {
            return res.status(400).send({ message: "ID de rol inválido" });
        }
        const response = await getOperationsByRole(id_role);
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};

// ==================== ASIGNAR ROL ====================

export const putOperationTypeRole = async (req: Request, res: Response) => {
    const {
        params: { id },
        body: { id_role },
    } = req;
    try {
        const id_operation_type = Number(id);
        const roleId = Number(id_role);
        if (!id_operation_type || !roleId) {
            return res.status(400).send({ message: "ID de operación o rol inválido" });
        }
        const response = await assignRoleToOperationType(id_operation_type, roleId);
        responseHandler(response, res);
    } catch (error: any) {
        const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
        res.status(code).send({ message });
    }
};