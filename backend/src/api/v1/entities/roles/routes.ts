import { Router } from 'express';
import { adminRoleValidator, jwtValidator, validRole } from '../../middlewares';
import {
  deleteRoleController,
  getRole,
  getRoleCompleteController,
  getRoleOperationsController,
  getRoleUsersController,
  getRoles,
  postRole,
  putRole,
} from './controllers';

const routes = Router();

// ==================== CRUD DE ROLES ====================
routes.get('/', [jwtValidator, adminRoleValidator, validRole], getRoles);
routes.get('/:id', [jwtValidator, adminRoleValidator, validRole], getRole);
routes.post('/', [jwtValidator, adminRoleValidator, validRole], postRole);
routes.put('/:id', [jwtValidator, adminRoleValidator, validRole], putRole);
routes.delete('/:id', [jwtValidator, adminRoleValidator, validRole], deleteRoleController);

// ==================== GESTIÓN DE USUARIOS ====================
routes.get('/:id/users', [jwtValidator, adminRoleValidator, validRole], getRoleUsersController);

// ==================== GESTIÓN DE OPERACIONES ====================
routes.get('/:id/operations', [jwtValidator, adminRoleValidator, validRole], getRoleOperationsController);

// ==================== ROL COMPLETO ====================
routes.get('/:id/complete', [jwtValidator, adminRoleValidator, validRole], getRoleCompleteController);

export = routes;


