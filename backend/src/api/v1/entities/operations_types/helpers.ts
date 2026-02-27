import { FindAndCountOptions, Includeable, Op, WhereOptions } from "sequelize";
import OperationType from "../../../../database/schemas/degira/models/operation_type.model";
import Role from "../../../../database/schemas/degira/models/rol.model";
import UserRole from "../../../../database/schemas/degira/models/user_role.model";
import { errorHandler } from "../../helpers";
import { getPagination } from "../../helpers";
import {
    ICreateOperationType,
    IOperationTypeParams,
    IOperationTypeWithRole,
    IUpdateOperationType,
} from "./types";

const roleIncludeable: Includeable = {
    model: Role,
    as: 'role',
};

// ==================== VALIDACIONES ====================

export const validateOperationTypeExists = async (id_operation_type: number): Promise<void> => {
    const operationType = await OperationType.findByPk(id_operation_type);
    if (!operationType) {
        errorHandler(404, 'Tipo de operación no encontrado');
    }
};

export const validatePathUnique = async (
    _path: string,
    _excludeId?: number,
): Promise<void> => {
    // Deshabilitado: permitimos mismo path en varios ítems (uno por rol).
    return;
};

export const validateRoleExists = async (id_role: number): Promise<void> => {
    const role = await Role.findByPk(id_role);
    if (!role) {
        errorHandler(404, 'Rol no encontrado');
    }
};

// ==================== HELPERS EXISTENTES (MANTENER COMPATIBILIDAD) ====================

export const getOperationsTypesList = async (id_user: string) => {
    try {
        const userRoles = await UserRole.findAll({
            where: {
                id_user,
            },
        });

        const idRoleArray = userRoles.map((userRole) => userRole.dataValues.id_role);

        if (idRoleArray.length === 0) {
            return [];
        }

        const operationType = await OperationType.findAll({
            where: {
                id_role: idRoleArray,
                menu_available: {
                    [Op.ne]: 0
                }
            },
            include: [roleIncludeable],
            order: [
                ['order', 'ASC'],
            ],
        });

        return operationType || [];

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getAllOperationsTypes = async () => {
    try {
        const operationType = await OperationType.findAll({
            include: [roleIncludeable],
            order: [
                ['order', 'ASC'],
            ],
        });

        return operationType || [];

    } catch (error) {
        console.log(error);
        throw error;
    }
};

// ==================== CRUD DE OPERATIONS_TYPES ====================

export const getOperationTypeList = async (params: IOperationTypeParams) => {
    try {
        const { page, pageSize, roleId, search, menuAvailable } = params;

        const where: WhereOptions = {};

        // Filtro por rol
        if (roleId) {
            where.id_role = roleId;
        }

        // Filtro por menu_available
        if (menuAvailable !== undefined) {
            where.menu_available = menuAvailable;
        }

        // Búsqueda por descripción o path
        if (search) {
            where[Op.or as any] = [
                { description: { [Op.like]: `%${search}%` } },
                { path: { [Op.like]: `%${search}%` } },
            ];
        }

        let findOptions: FindAndCountOptions = {
            where,
            include: [roleIncludeable],
            order: [['order', 'ASC']],
            distinct: true,
        };

        if (page && pageSize) {
            const { limit, offset } = getPagination(page, pageSize);
            findOptions = { ...findOptions, offset, limit };
        }

        const operations = await OperationType.findAndCountAll(findOptions);
        
        // Convertir las instancias de Sequelize a objetos JSON planos
        const rows = operations.rows ? operations.rows.map((row: any) => row.toJSON ? row.toJSON() : row) : [];
        
        return {
            rows: rows,
            count: operations.count,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getOperationTypeById = async (
    id_operation_type: number,
): Promise<IOperationTypeWithRole | null> => {
    try {
        const operationType = await OperationType.findByPk(id_operation_type, {
            include: [roleIncludeable],
        });

        if (!operationType) {
            return null;
        }

        return operationType.toJSON() as IOperationTypeWithRole;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const createOperationType = async (
    operationData: ICreateOperationType,
): Promise<IOperationTypeWithRole> => {
    try {
        const { description, action, id_role, tag, icon, path, menu_available, order } = operationData;

        // Validaciones
        await validateRoleExists(id_role);
        // Path puede repetirse: mismo path para distintos roles (ej. CAJA y ADMIN)
        // if (path) { await validatePathUnique(path); }

        // Crear operation type
        const operationType = await OperationType.create({
            description,
            action: action || null,
            id_role,
            tag: tag || null,
            icon: icon || null,
            path: path || null,
            menu_available: menu_available !== undefined ? menu_available : 0,
            order: order || null,
        } as any);

        const id_operation_type = (operationType as any).id_operation_type;

        // Retornar operation type con rol
        return (await getOperationTypeById(id_operation_type))!;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updateOperationType = async (
    id_operation_type: number,
    operationData: IUpdateOperationType,
): Promise<IOperationTypeWithRole> => {
    try {
        await validateOperationTypeExists(id_operation_type);

        const { description, action, id_role, tag, icon, path, menu_available, order } = operationData;
        const updateData: any = {};

        if (description !== undefined) updateData.description = description;
        if (action !== undefined) updateData.action = action;
        if (id_role !== undefined) {
            await validateRoleExists(id_role);
            updateData.id_role = id_role;
        }
        if (tag !== undefined) updateData.tag = tag;
        if (icon !== undefined) updateData.icon = icon;
        if (path !== undefined) {
            // Path puede repetirse: mismo path para distintos roles
            // await validatePathUnique(path, id_operation_type);
            updateData.path = path;
        }
        if (menu_available !== undefined) updateData.menu_available = menu_available;
        if (order !== undefined) updateData.order = order;

        await OperationType.update(updateData, {
            where: { id_operation_type },
        });

        return (await getOperationTypeById(id_operation_type))!;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteOperationType = async (id_operation_type: number): Promise<void> => {
    try {
        await validateOperationTypeExists(id_operation_type);

        await OperationType.destroy({
            where: { id_operation_type },
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// ==================== GESTIÓN POR ROL ====================

export const getOperationsByRole = async (id_role: number) => {
    try {
        await validateRoleExists(id_role);

        const operations = await OperationType.findAll({
            where: { id_role },
            include: [roleIncludeable],
            order: [['order', 'ASC']],
        });

        return operations;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// ==================== ASIGNAR ROL A OPERATION TYPE ====================

export const assignRoleToOperationType = async (
    id_operation_type: number,
    id_role: number,
): Promise<IOperationTypeWithRole> => {
    try {
        await validateOperationTypeExists(id_operation_type);
        await validateRoleExists(id_role);

        await OperationType.update(
            { id_role },
            { where: { id_operation_type } },
        );

        return (await getOperationTypeById(id_operation_type))!;
    } catch (error) {
        console.log(error);
        throw error;
    }
};