import { Request, Response } from 'express';
import { responseHandler } from '../../helpers';
import { IErrorResponse } from '../../types/errorResponse.interface';
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoleComplete,
  getRoleList,
  getRoleOperations,
  getRoleUsers,
  updateRole,
} from './helpers';
import { ICreateRole, IRoleParams, IUpdateRole } from './types';

// ==================== CRUD DE ROLES ====================

export const getRoles = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, search },
  } = req;
  try {
    const roleParams: IRoleParams = {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search: search as string,
    };
    const response = await getRoleList(roleParams);
    responseHandler(response, res, Number(page) || 1, Number(pageSize) || 10);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getRole = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_role = Number(id);
    if (!id_role) {
      return res.status(400).send({ message: 'ID de rol inválido' });
    }
    const response = await getRoleById(id_role);
    if (!response) {
      return res.status(404).send({ message: 'Rol no encontrado' });
    }
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const postRole = async (req: Request, res: Response) => {
  const { body } = req;
  try {
    const roleData: ICreateRole = {
      description: body.description,
    };
    const response = await createRole(roleData);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const putRole = async (req: Request, res: Response) => {
  const {
    params: { id },
    body,
  } = req;
  try {
    const id_role = Number(id);
    if (!id_role) {
      return res.status(400).send({ message: 'ID de rol inválido' });
    }
    const roleData: IUpdateRole = {
      description: body.description,
    };
    const response = await updateRole(id_role, roleData);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const deleteRoleController = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_role = Number(id);
    if (!id_role) {
      return res.status(400).send({ message: 'ID de rol inválido' });
    }
    await deleteRole(id_role);
    responseHandler({ message: 'Rol eliminado correctamente' }, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== GESTIÓN DE USUARIOS ====================

export const getRoleUsersController = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_role = Number(id);
    if (!id_role) {
      return res.status(400).send({ message: 'ID de rol inválido' });
    }
    const response = await getRoleUsers(id_role);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== GESTIÓN DE OPERACIONES ====================

export const getRoleOperationsController = async (
  req: Request,
  res: Response,
) => {
  const {
    params: { id },
  } = req;
  try {
    const id_role = Number(id);
    if (!id_role) {
      return res.status(400).send({ message: 'ID de rol inválido' });
    }
    const response = await getRoleOperations(id_role);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== ROL COMPLETO ====================

export const getRoleCompleteController = async (
  req: Request,
  res: Response,
) => {
  const {
    params: { id },
  } = req;
  try {
    const id_role = Number(id);
    if (!id_role) {
      return res.status(400).send({ message: 'ID de rol inválido' });
    }
    const response = await getRoleComplete(id_role);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};


