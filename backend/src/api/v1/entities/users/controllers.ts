import { Request, Response } from 'express';
import { responseHandler } from '../../helpers';
import { IErrorResponse } from '../../types/errorResponse.interface';
import {
  addRoleToUser,
  assignRolesToUser,
  changeUserPassword,
  createUser,
  deleteUser,
  getUserById,
  getUserList,
  getUserPermissions,
  getUserRoles,
  removeRoleFromUser,
  updateUser,
  userLogin,
} from './helpers';
import { ICreateUser, IUpdateUser, IUserParams } from './types';

// ==================== AUTENTICACIÓN ====================

export const postLogin = async (req: Request, res: Response) => {
  const {
    body: { username = '', password = '' },
  } = req;
  try {
    const response = await userLogin(username, password);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== CRUD DE USUARIOS ====================

export const getUsers = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, search, roleId },
  } = req;
  try {
    const userParams: IUserParams = {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search: search as string,
      roleId: roleId ? Number(roleId) : undefined,
    };
    const response = await getUserList(userParams);
    responseHandler(response, res, Number(page) || 1, Number(pageSize) || 10);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    const response = await getUserById(id_user);
    if (!response) {
      return res.status(404).send({ message: 'Usuario no encontrado' });
    }
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const postUser = async (req: Request, res: Response) => {
  const { body } = req;
  try {
    const userData: ICreateUser = {
      name: body.name,
      surname: body.surname,
      username: body.username,
      password: body.password,
      roles: body.roles || [],
    };
    const response = await createUser(userData);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const putUser = async (req: Request, res: Response) => {
  const {
    params: { id },
    body,
  } = req;
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    const userData: IUpdateUser = {
      name: body.name,
      surname: body.surname,
      username: body.username,
      password: body.password,
    };
    const response = await updateUser(id_user, userData);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    await deleteUser(id_user);
    responseHandler({ message: 'Usuario eliminado correctamente' }, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== GESTIÓN DE ROLES ====================

export const getUserRolesController = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    const response = await getUserRoles(id_user);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const postUserRoles = async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] || 'NO-ID';
  const timestamp = new Date().toISOString();
  
  console.log('=== POST USER ROLES - REQUEST RECIBIDO ===');
  console.log('Request ID:', requestId);
  console.log('Timestamp:', timestamp);
  console.log('req.headers:', JSON.stringify(req.headers, null, 2));
  console.log('req.body completo:', JSON.stringify(req.body, null, 2));
  console.log('req.body.roles:', req.body.roles);
  console.log('req.body.roles (tipo):', typeof req.body.roles, Array.isArray(req.body.roles));
  console.log('req.body.roles (verificación completa):', JSON.stringify(req.body.roles));
  console.log('req.params:', req.params);
  
  const {
    params: { id },
    body: { roles },
  } = req;
  
  console.log('Desestructuración - roles:', roles);
  console.log('Desestructuración - roles (tipo):', typeof roles, Array.isArray(roles));
  
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    if (!Array.isArray(roles)) {
      console.error('ERROR: roles no es un array! Tipo:', typeof roles, 'Valor:', roles);
      return res.status(400).send({ message: 'Los roles deben ser un array' });
    }
    
    // Convertir todos los roles a números explícitamente
    const roleIds = roles.map(r => Number(r)).filter(r => !isNaN(r) && r > 0);
    
    console.log('=== ASIGNANDO ROLES ===');
    console.log('Usuario ID:', id_user);
    console.log('Roles recibidos (raw):', roles);
    console.log('Roles recibidos (raw JSON):', JSON.stringify(roles));
    console.log('Roles convertidos a números:', roleIds);
    
    if (roleIds.length === 0) {
      return res.status(400).send({ message: 'Debe proporcionar al menos un rol válido' });
    }
    
    await assignRolesToUser(id_user, roleIds);
    const response = await getUserRoles(id_user);
    
    console.log('=== ROLES ASIGNADOS CORRECTAMENTE ===');
    console.log('Usuario ID:', id_user);
    console.log('Roles asignados (response):', JSON.stringify(response, null, 2));
    console.log('Cantidad de roles:', response.length);
    response.forEach((role: any, index: number) => {
      console.log(`  Rol ${index + 1}: ID=${role.id_role}, Desc=${role.description}`);
    });
    
    responseHandler(response, res);
  } catch (error: any) {
    console.error('Error al asignar roles:', error);
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const postUserRole = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { id_role },
  } = req;
  try {
    const id_user = Number(id);
    const roleId = Number(id_role);
    if (!id_user || !roleId) {
      return res.status(400).send({ message: 'ID de usuario o rol inválido' });
    }
    await addRoleToUser(id_user, roleId);
    const response = await getUserRoles(id_user);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const deleteUserRole = async (req: Request, res: Response) => {
  const {
    params: { id, roleId },
  } = req;
  try {
    const id_user = Number(id);
    const id_role = Number(roleId);
    if (!id_user || !id_role) {
      return res.status(400).send({ message: 'ID de usuario o rol inválido' });
    }
    await removeRoleFromUser(id_user, id_role);
    responseHandler({ message: 'Rol removido correctamente' }, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== GESTIÓN DE PERMISOS ====================

export const getUserPermissionsController = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = req;
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    const response = await getUserPermissions(id_user);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// ==================== GESTIÓN DE CONTRASEÑA ====================

export const putUserPassword = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { password },
  } = req;
  try {
    const id_user = Number(id);
    if (!id_user) {
      return res.status(400).send({ message: 'ID de usuario inválido' });
    }
    if (!password) {
      return res.status(400).send({ message: 'La contraseña es requerida' });
    }
    await changeUserPassword(id_user, password);
    responseHandler({ message: 'Contraseña actualizada correctamente' }, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};
