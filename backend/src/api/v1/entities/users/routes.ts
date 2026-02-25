import { Router } from 'express';
import { adminRoleValidator, jwtValidator, validRole } from '../../middlewares';
import {
  deleteUserController,
  deleteUserRole,
  getUser,
  getUserPermissionsController,
  getUserRolesController,
  getUsers,
  postLogin,
  postUser,
  postUserRole,
  postUserRoles,
  putUser,
  putUserPassword,
} from './controllers';

const routes = Router();

// ==================== AUTENTICACIÓN ====================
routes.post('/login', postLogin);

// ==================== CRUD DE USUARIOS ====================
routes.get('/', [jwtValidator, adminRoleValidator, validRole], getUsers);
routes.get('/:id', [jwtValidator, adminRoleValidator, validRole], getUser);
routes.post('/', [jwtValidator, adminRoleValidator, validRole], postUser);
routes.put('/:id', [jwtValidator, adminRoleValidator, validRole], putUser);
routes.delete('/:id', [jwtValidator, adminRoleValidator, validRole], deleteUserController);

// ==================== GESTIÓN DE ROLES ====================
routes.get('/:id/roles', [jwtValidator, adminRoleValidator, validRole], getUserRolesController);
routes.post('/:id/roles', [jwtValidator, adminRoleValidator, validRole], postUserRoles);
routes.post('/:id/roles/add', [jwtValidator, adminRoleValidator, validRole], postUserRole);
routes.delete('/:id/roles/:roleId', [jwtValidator, adminRoleValidator, validRole], deleteUserRole);

// ==================== GESTIÓN DE PERMISOS ====================
routes.get('/:id/permissions', [jwtValidator, adminRoleValidator, validRole], getUserPermissionsController);

// ==================== GESTIÓN DE CONTRASEÑA ====================
routes.put('/:id/password', [jwtValidator, adminRoleValidator, validRole], putUserPassword);

export = routes;
