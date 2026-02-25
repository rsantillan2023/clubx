import { Model, Sequelize } from 'sequelize';
import { DEGIRA_DB } from '../../../../database/connection';
import { getPagination } from '../../helpers';
import { Op } from 'sequelize';

// Mapeo de nombres de tablas a modelos
const modelMap: { [key: string]: typeof Model } = {
  'Actions': require('../../../../database/schemas/degira/models/action.model').default,
  'Days': require('../../../../database/schemas/degira/models/day.model').default,
  'Operations': require('../../../../database/schemas/degira/models/operation.model').default,
  'Operations_Types': require('../../../../database/schemas/degira/models/operation_type.model').default,
  'Partners': require('../../../../database/schemas/degira/models/partner.model').default,
  'Payment_Methods': require('../../../../database/schemas/degira/models/payment_method.model.interface').default,
  'Prices': require('../../../../database/schemas/degira/models/price.model').default,
  'Products_Services': require('../../../../database/schemas/degira/models/product_service.model').default,
  'Receivable_Concepts': require('../../../../database/schemas/degira/models/receivable_concepts.model').default,
  'Roles': require('../../../../database/schemas/degira/models/rol.model').default,
  'States': require('../../../../database/schemas/degira/models/states.model').default,
  'Ticket_Details': require('../../../../database/schemas/degira/models/ticket_details.model').default,
  'Tickets': require('../../../../database/schemas/degira/models/ticket.model').default,
  'Users': require('../../../../database/schemas/degira/models/user.model').default,
  'Users_Roles': require('../../../../database/schemas/degira/models/user_role.model').default,
  'Visits': require('../../../../database/schemas/degira/models/visit.model').default,
  'Visits_Types': require('../../../../database/schemas/degira/models/visit_type.model').default,
};

// Obtener todas las tablas disponibles
export const getAvailableTables = async () => {
  try {
    const tables = Object.keys(modelMap).map(tableName => ({
      name: tableName,
      displayName: tableName.replace(/_/g, ' '),
    }));
    return tables;
  } catch (error: any) {
    throw { code: 500, message: error.message || 'Error al obtener las tablas' };
  }
};

// Obtener el modelo por nombre de tabla
const getModel = (tableName: string): typeof Model | null => {
  if (!tableName) {
    return null;
  }

  // Normalizar el nombre de la tabla para que coincida con el modelMap
  // El modelMap usa formato "Users", "Partners", "Operations_Types", etc.
  
  // Intentar primero con el nombre tal cual
  if (modelMap[tableName]) {
    return modelMap[tableName];
  }
  
  // Normalizar: reemplazar espacios por guiones bajos, luego capitalizar cada palabra
  // Ejemplo: "users" -> "Users", "users roles" -> "Users_Roles", "operations_types" -> "Operations_Types"
  const normalized = tableName
    .trim()
    .replace(/\s+/g, '_')  // Reemplazar espacios por guiones bajos
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
  
  // Intentar con el nombre normalizado
  if (modelMap[normalized]) {
    return modelMap[normalized];
  }
  
  // Intentar con mayúsculas completas
  const upperCase = tableName.toUpperCase();
  if (modelMap[upperCase]) {
    return modelMap[upperCase];
  }
  
  // Buscar de forma case-insensitive en el modelMap (comparando sin espacios/guiones)
  const normalizeForComparison = (str: string) => str.toLowerCase().replace(/[\s_]/g, '');
  const normalizedTableName = normalizeForComparison(tableName);
  
  for (const key in modelMap) {
    if (normalizeForComparison(key) === normalizedTableName) {
      return modelMap[key];
    }
  }
  
  // Log para debugging
  console.warn(`No se encontró el modelo para la tabla: "${tableName}". Modelos disponibles:`, Object.keys(modelMap));
  
  return null;
};

// Obtener estructura de la tabla (columnas)
export const getTableStructure = async (tableName: string) => {
  try {
    const ModelClass = getModel(tableName);
    if (!ModelClass) {
      throw { code: 404, message: `Tabla ${tableName} no encontrada` };
    }

    const attributes = (ModelClass as any).getAttributes();
    const columns = Object.keys(attributes).map(key => {
      const attr = attributes[key];
      return {
        name: key,
        type: attr.type?.toString() || 'unknown',
        allowNull: attr.allowNull !== false,
        primaryKey: attr.primaryKey === true,
        autoIncrement: attr.autoIncrement === true,
      };
    });

    return columns;
  } catch (error: any) {
    throw { code: 500, message: error.message || 'Error al obtener la estructura de la tabla' };
  }
};

// Obtener todos los registros de una tabla
export const getAllRecords = async (
  tableName: string,
  page: number = 1,
  pageSize: number = 50,
  search?: string,
  sortBy?: string,
  sortDesc: boolean = false,
) => {
  try {
    console.log(`[getAllRecords] Buscando modelo para tabla: "${tableName}"`);
    const ModelClass = getModel(tableName);
    if (!ModelClass) {
      console.error(`[getAllRecords] No se encontró el modelo para la tabla: "${tableName}"`);
      throw { code: 404, message: `Tabla ${tableName} no encontrada` };
    }
    console.log(`[getAllRecords] Modelo encontrado para tabla: "${tableName}"`);

    const { limit, offset } = getPagination(page, pageSize);
    const where: any = {};

    // Si hay búsqueda, buscar en todos los campos de texto
    if (search && search.trim()) {
      try {
        const attributes = (ModelClass as any).getAttributes();
        const searchConditions: any[] = [];
        const searchTerm = search.trim();
        
        Object.keys(attributes).forEach(key => {
          try {
            const attr = attributes[key];
            const type = attr.type?.toString() || '';
            // Buscar solo en campos de texto (STRING, TEXT, CHAR, VARCHAR)
            // Excluir campos que son claves foráneas o auto-incrementales
            if (
              (type.includes('STRING') || type.includes('TEXT') || type.includes('CHAR')) &&
              !attr.primaryKey &&
              !attr.autoIncrement &&
              key !== 'createdAt' &&
              key !== 'updatedAt'
            ) {
              searchConditions.push({
                [key]: {
                  [Op.like]: `%${searchTerm}%`,
                },
              });
            }
          } catch (err) {
            // Ignorar errores en campos individuales
            console.warn(`Error al procesar campo ${key} para búsqueda:`, err);
          }
        });

        if (searchConditions.length > 0) {
          where[Op.or] = searchConditions;
        }
      } catch (error: any) {
        console.error('Error al construir condiciones de búsqueda:', error);
        // Si hay error en la búsqueda, continuar sin filtro de búsqueda
        // en lugar de fallar completamente
      }
    }

    // Determinar el ordenamiento
    let orderBy: any[] = [];
    const attributes = (ModelClass as any).getAttributes();
    
    if (sortBy && attributes[sortBy]) {
      // Si se especifica una columna para ordenar, usarla
      orderBy = [[sortBy, sortDesc ? 'DESC' : 'ASC']];
    } else {
      // Ordenamiento por defecto
      const attributeKeys = Object.keys(attributes);
      const firstKey = attributeKeys[0];
      const hasCreatedAt = 'createdAt' in attributes;
      orderBy = hasCreatedAt ? [['createdAt', 'DESC']] : [[firstKey, 'DESC']];
    }

    const result = await (ModelClass as any).findAndCountAll({
      where,
      limit,
      offset,
      order: orderBy,
      raw: false, // Mantener instancias de Sequelize para poder acceder a métodos si es necesario
    });

    // Convertir las instancias de Sequelize a objetos JSON planos
    const rows = result.rows ? result.rows.map((row: any) => row.toJSON ? row.toJSON() : row) : [];

    console.log(`[getAllRecords] Resultado para tabla "${tableName}":`, {
      count: result.count,
      rowsCount: rows.length,
      page,
      pageSize,
    });

    return {
      count: result.count,
      rows: rows,
    };
  } catch (error: any) {
    console.error('Error en getAllRecords:', error);
    console.error('Tabla:', tableName);
    console.error('Parámetros:', { page, pageSize, search, sortBy, sortDesc });
    
    // Si el error ya tiene código, lanzarlo tal cual
    if (error.code) {
      throw error;
    }
    
    throw { 
      code: 500, 
      message: error.message || 'Error al obtener los registros',
      details: error.stack 
    };
  }
};

// Obtener un registro por ID
export const getRecordById = async (tableName: string, id: string) => {
  try {
    const ModelClass = getModel(tableName);
    if (!ModelClass) {
      throw { code: 404, message: `Tabla ${tableName} no encontrada` };
    }

    const attributes = (ModelClass as any).getAttributes();
    const primaryKey = Object.keys(attributes).find(key => attributes[key].primaryKey === true);
    
    if (!primaryKey) {
      throw { code: 400, message: 'No se encontró la clave primaria de la tabla' };
    }

    const record = await (ModelClass as any).findOne({
      where: {
        [primaryKey]: id,
      } as any,
    });

    if (!record) {
      throw { code: 404, message: 'Registro no encontrado' };
    }

    return record;
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw { code: 500, message: error.message || 'Error al obtener el registro' };
  }
};

// Crear un nuevo registro
export const createRecord = async (tableName: string, data: any) => {
  try {
    const ModelClass = getModel(tableName);
    if (!ModelClass) {
      throw { code: 404, message: `Tabla ${tableName} no encontrada` };
    }

    // Remover campos que son auto-incrementales
    const attributes = (ModelClass as any).getAttributes();
    const cleanedData: any = { ...data };
    
    Object.keys(attributes).forEach(key => {
      if (attributes[key].autoIncrement === true) {
        delete cleanedData[key];
      }
    });

    const record = await (ModelClass as any).create(cleanedData);
    return record;
  } catch (error: any) {
    throw { code: 500, message: error.message || 'Error al crear el registro' };
  }
};

// Actualizar un registro
export const updateRecord = async (tableName: string, id: string, data: any) => {
  try {
    const ModelClass = getModel(tableName);
    if (!ModelClass) {
      throw { code: 404, message: `Tabla ${tableName} no encontrada` };
    }

    const attributes = (ModelClass as any).getAttributes();
    const primaryKey = Object.keys(attributes).find(key => attributes[key].primaryKey === true);
    
    if (!primaryKey) {
      throw { code: 400, message: 'No se encontró la clave primaria de la tabla' };
    }

    // Remover la clave primaria de los datos a actualizar
    const cleanedData: any = { ...data };
    delete cleanedData[primaryKey];

    // Remover campos auto-incrementales
    Object.keys(attributes).forEach(key => {
      if (attributes[key].autoIncrement === true) {
        delete cleanedData[key];
      }
    });

    const [affectedRows] = await (ModelClass as any).update(cleanedData, {
      where: {
        [primaryKey]: id,
      } as any,
    });

    if (affectedRows === 0) {
      throw { code: 404, message: 'Registro no encontrado' };
    }

    const updatedRecord = await (ModelClass as any).findOne({
      where: {
        [primaryKey]: id,
      } as any,
    });

    return updatedRecord;
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw { code: 500, message: error.message || 'Error al actualizar el registro' };
  }
};

// Eliminar un registro
export const deleteRecord = async (tableName: string, id: string) => {
  try {
    const ModelClass = getModel(tableName);
    if (!ModelClass) {
      throw { code: 404, message: `Tabla ${tableName} no encontrada` };
    }

    const attributes = (ModelClass as any).getAttributes();
    const primaryKey = Object.keys(attributes).find(key => attributes[key].primaryKey === true);
    
    if (!primaryKey) {
      throw { code: 400, message: 'No se encontró la clave primaria de la tabla' };
    }

    const deletedRows = await (ModelClass as any).destroy({
      where: {
        [primaryKey]: id,
      } as any,
    });

    if (deletedRows === 0) {
      throw { code: 404, message: 'Registro no encontrado' };
    }

    return { message: 'Registro eliminado correctamente' };
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw { code: 500, message: error.message || 'Error al eliminar el registro' };
  }
};

