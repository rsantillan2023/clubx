import { Request, Response } from 'express';
import { responseHandler } from '../../helpers';
import { IErrorResponse } from '../../types/errorResponse.interface';
import {
  getAvailableTables,
  getTableStructure,
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} from './helpers';

// Obtener todas las tablas disponibles
export const getTables = async (req: Request, res: Response) => {
  try {
    const response = await getAvailableTables();
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Obtener estructura de una tabla
export const getTableSchema = async (req: Request, res: Response) => {
  const {
    params: { tableName },
  } = req;
  try {
    // Decodificar el nombre de la tabla en caso de que esté codificado en la URL
    const decodedTableName = decodeURIComponent(tableName);
    console.log(`[getTableSchema] Nombre de tabla recibido: "${tableName}", decodificado: "${decodedTableName}"`);
    const response = await getTableStructure(decodedTableName);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Obtener todos los registros de una tabla
export const getTableRecords = async (req: Request, res: Response) => {
  const {
    params: { tableName },
    query: { page, pageSize, search, sortBy, sortDesc },
  } = req;
  try {
    // Decodificar el nombre de la tabla en caso de que esté codificado en la URL
    const decodedTableName = decodeURIComponent(tableName);
    console.log(`[getTableRecords] Nombre de tabla recibido: "${tableName}", decodificado: "${decodedTableName}"`);
    const response = await getAllRecords(
      decodedTableName,
      Number(page) || 1,
      Number(pageSize) || 50,
      search as string,
      sortBy as string,
      sortDesc === 'true',
    );
    responseHandler(response, res, Number(page) || 1, Number(pageSize) || 50);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Obtener un registro por ID
export const getTableRecord = async (req: Request, res: Response) => {
  const {
    params: { tableName, id },
  } = req;
  try {
    const response = await getRecordById(tableName, id);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Crear un nuevo registro
export const postTableRecord = async (req: Request, res: Response) => {
  const {
    params: { tableName },
    body,
  } = req;
  try {
    const response = await createRecord(tableName, body);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Actualizar un registro
export const putTableRecord = async (req: Request, res: Response) => {
  const {
    params: { tableName, id },
    body,
  } = req;
  try {
    const response = await updateRecord(tableName, id, body);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Eliminar un registro
export const deleteTableRecord = async (req: Request, res: Response) => {
  const {
    params: { tableName, id },
  } = req;
  try {
    const response = await deleteRecord(tableName, id);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

