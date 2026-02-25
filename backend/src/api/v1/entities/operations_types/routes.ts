import { Router } from 'express';
import {
    deleteOperationTypeController,
    getAllOperationsTypesController,
    getOperationType,
    getOperationsByRoleController,
    getOperationsTypes,
    getOperationsTypesListController,
    postOperationType,
    putOperationType,
    putOperationTypeRole,
} from './controllers';
import { adminRoleValidator, cajaRoleValidator, jwtValidator, validRole } from '../../middlewares';

const routes = Router();

// ==================== ENDPOINTS EXISTENTES (MANTENER COMPATIBILIDAD) ====================
routes.get('/get', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getOperationsTypes);
routes.get('/getAll', [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], getAllOperationsTypesController);

// ==================== CRUD DE OPERATIONS_TYPES ====================
routes.get('/', [jwtValidator, adminRoleValidator, validRole], getOperationsTypesListController);
routes.get('/:id', [jwtValidator, adminRoleValidator, validRole], getOperationType);
routes.post('/', [jwtValidator, adminRoleValidator, validRole], postOperationType);
routes.put('/:id', [jwtValidator, adminRoleValidator, validRole], putOperationType);
routes.delete('/:id', [jwtValidator, adminRoleValidator, validRole], deleteOperationTypeController);

// ==================== GESTIÓN POR ROL ====================
routes.get('/by-role/:roleId', [jwtValidator, adminRoleValidator, validRole], getOperationsByRoleController);

// ==================== ASIGNAR ROL ====================
routes.put('/:id/assign-role', [jwtValidator, adminRoleValidator, validRole], putOperationTypeRole);

export = routes;