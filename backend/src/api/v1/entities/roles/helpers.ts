import { FindAndCountOptions, Includeable, Op, WhereOptions } from 'sequelize';
import OperationType from '../../../../database/schemas/degira/models/operation_type.model';
import Rol from '../../../../database/schemas/degira/models/rol.model';
import User from '../../../../database/schemas/degira/models/user.model';
import UserRole from '../../../../database/schemas/degira/models/user_role.model';
import { errorHandler } from '../../helpers';
import { getPagination } from '../../helpers';
import {
  ICreateRole,
  IRoleComplete,
  IRoleParams,
  IRoleWithOperations,
  IRoleWithUsers,
  IUpdateRole,
} from './types';

const userIncludeable: Includeable = {
  model: User,
  as: 'users',
};

const operationIncludeable: Includeable = {
  model: OperationType,
  as: 'operations',
};

// ==================== VALIDACIONES ====================

export const validateRoleExists = async (id_role: number): Promise<void> => {
  const role = await Rol.findByPk(id_role);
  if (!role) {
    errorHandler(404, 'Rol no encontrado');
  }
};

export const validateRoleDescriptionUnique = async (
  description: string,
  excludeId?: number,
): Promise<void> => {
  const where: WhereOptions = { description };
  if (excludeId) {
    where.id_role = { [Op.ne]: excludeId };
  }
  const existingRole = await Rol.findOne({ where });
  if (existingRole) {
    errorHandler(400, 'Ya existe un rol con esta descripción');
  }
};

export const validateRoleInUse = async (id_role: number): Promise<boolean> => {
  const [usersCount, operationsCount] = await Promise.all([
    UserRole.count({ where: { id_role } }),
    OperationType.count({ where: { id_role } }),
  ]);

  return usersCount > 0 || operationsCount > 0;
};

// ==================== CRUD DE ROLES ====================

export const getRoleList = async (roleParams: IRoleParams) => {
  try {
    const { page, pageSize, search } = roleParams;

    const where: WhereOptions = {};

    // Búsqueda por descripción
    if (search) {
      where.description = { [Op.like]: `%${search}%` };
    }

    let findOptions: FindAndCountOptions = {
      where,
      order: [['description', 'ASC']],
    };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = { ...findOptions, offset, limit };
    }

    const roles = await Rol.findAndCountAll(findOptions);
    return roles;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getRoleById = async (
  id_role: number,
): Promise<IRoleWithOperations | null> => {
  try {
    const role = await Rol.findByPk(id_role, {
      include: [operationIncludeable],
    });

    if (!role) {
      return null;
    }

    return role.toJSON() as IRoleWithOperations;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createRole = async (
  roleData: ICreateRole,
): Promise<IRoleWithOperations> => {
  try {
    const { description } = roleData;

    // Validaciones
    await validateRoleDescriptionUnique(description);

    // Crear rol
    const role = await Rol.create({ description } as any);

    const id_role = (role as any).id_role;

    // Retornar rol
    return (await getRoleById(id_role))!;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateRole = async (
  id_role: number,
  roleData: IUpdateRole,
): Promise<IRoleWithOperations> => {
  try {
    await validateRoleExists(id_role);

    const { description } = roleData;
    const updateData: any = {};

    if (description !== undefined) {
      await validateRoleDescriptionUnique(description, id_role);
      updateData.description = description;
    }

    await Rol.update(updateData, {
      where: { id_role },
    });

    return (await getRoleById(id_role))!;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteRole = async (id_role: number): Promise<void> => {
  try {
    await validateRoleExists(id_role);

    // Validar que el rol no esté en uso
    const inUse = await validateRoleInUse(id_role);
    if (inUse) {
      errorHandler(
        400,
        'No se puede eliminar el rol porque está asignado a usuarios o tiene operaciones asociadas',
      );
    }

    // Eliminar rol
    await Rol.destroy({
      where: { id_role },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// ==================== GESTIÓN DE USUARIOS DEL ROL ====================

export const getRoleUsers = async (id_role: number): Promise<IRoleWithUsers> => {
  try {
    await validateRoleExists(id_role);

    const role = await Rol.findByPk(id_role, {
      include: [userIncludeable],
    });

    if (!role) {
      errorHandler(404, 'Rol no encontrado');
    }

    return role!.toJSON() as IRoleWithUsers;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// ==================== GESTIÓN DE OPERACIONES DEL ROL ====================

export const getRoleOperations = async (
  id_role: number,
): Promise<IRoleWithOperations> => {
  try {
    await validateRoleExists(id_role);

    const role = await Rol.findByPk(id_role, {
      include: [operationIncludeable],
    });

    if (!role) {
      errorHandler(404, 'Rol no encontrado');
    }

    return role!.toJSON() as IRoleWithOperations;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// ==================== ROL COMPLETO ====================

export const getRoleComplete = async (
  id_role: number,
): Promise<IRoleComplete> => {
  try {
    await validateRoleExists(id_role);

    const role = await Rol.findByPk(id_role, {
      include: [userIncludeable, operationIncludeable],
    });

    if (!role) {
      errorHandler(404, 'Rol no encontrado');
    }

    return role!.toJSON() as IRoleComplete;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

