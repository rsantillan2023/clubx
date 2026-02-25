import { Router } from 'express';
import { jwtValidator, adminRoleValidator, validRole } from '../../middlewares';
import {
  getTables,
  getTableSchema,
  getTableRecords,
  getTableRecord,
  postTableRecord,
  putTableRecord,
  deleteTableRecord,
} from './controllers';

const routes = Router();

// Obtener todas las tablas disponibles
routes.get('/tables', [jwtValidator, adminRoleValidator, validRole], getTables);

// Obtener estructura de una tabla
routes.get('/tables/:tableName/structure', [jwtValidator, adminRoleValidator, validRole], getTableSchema);

// Obtener todos los registros de una tabla
routes.get('/tables/:tableName/records', [jwtValidator, adminRoleValidator, validRole], getTableRecords);

// Obtener un registro por ID
routes.get('/tables/:tableName/records/:id', [jwtValidator, adminRoleValidator, validRole], getTableRecord);

// Crear un nuevo registro
routes.post('/tables/:tableName/records', [jwtValidator, adminRoleValidator, validRole], postTableRecord);

// Actualizar un registro
routes.put('/tables/:tableName/records/:id', [jwtValidator, adminRoleValidator, validRole], putTableRecord);

// Eliminar un registro
routes.delete('/tables/:tableName/records/:id', [jwtValidator, adminRoleValidator, validRole], deleteTableRecord);

export = routes;


