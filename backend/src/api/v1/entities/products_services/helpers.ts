import { FindAndCountOptions, FindOptions, Op, OrderItem, Transaction, WhereOptions } from 'sequelize';
import ProductService from '../../../../database/schemas/degira/models/product_service.model';
import { errorHandler, getPagination } from '../../helpers';
import { IProductServiceParams, IPostProductService, IUpdateProductService, IBulkPriceUpdate } from './types';
import { argentinianDate, getVisitDate } from '../../helpers';
import Operation from '../../../../database/schemas/degira/models/operation.model';
import { EOpertationType } from '../operations_types/types';

// Obtener lista de productos/servicios con paginación y búsqueda
export const getProductsServicesList = async (
  params: IProductServiceParams,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const { page, pageSize, sortBy, sortDesc, search, available, featured } = params;

    const whereConditionsArray: any[] = [];

    // Búsqueda general
    if (search) {
      whereConditionsArray.push({
        [Op.or]: [
          { description: { [Op.like]: `%${search}%` } },
          { long_description: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Filtro por disponibilidad
    if (available !== undefined) {
      whereConditionsArray.push({ available });
    }

    // Filtro por destacado
    if (featured !== undefined) {
      whereConditionsArray.push({ featured });
    }

    // Construir whereConditions
    const whereConditions: WhereOptions = whereConditionsArray.length > 0
      ? (whereConditionsArray.length === 1 ? whereConditionsArray[0] : { [Op.and]: whereConditionsArray })
      : {};

    // Ordenamiento
    let order: OrderItem[] = [['id_product_service', 'DESC']];
    if (sortBy) {
      const direction = sortDesc ? 'DESC' : 'ASC';
      const sortFieldMap: { [key: string]: string } = {
        'id_product_service': 'id_product_service',
        'description': 'description',
        'price': 'price',
        'available': 'available',
        'featured': 'featured',
      };
      
      const actualSortBy = sortFieldMap[sortBy] || 'id_product_service';
      order = [[actualSortBy, direction]];
    }

    // Paginación
    let findOptions: FindAndCountOptions = {
      where: whereConditions,
      order,
    };

    if (page && pageSize) {
      const { limit, offset } = getPagination(page, pageSize);
      findOptions = {
        ...findOptions,
        offset,
        limit,
      };
    }

    const productsServices = await ProductService.findAndCountAll(findOptions);

    return productsServices;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Obtener un producto/servicio por ID
export const getProductServiceById = async (
  id_product_service: number,
  transaction?: Transaction
) => {
  try {
    const productService = await ProductService.findByPk(id_product_service, { transaction });
    
    if (!productService) {
      return errorHandler(404, 'Producto/Servicio no encontrado');
    }

    return productService;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Función helper para limpiar y normalizar URLs de imágenes
const cleanImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url || !url.trim()) {
    return undefined;
  }

  let cleanUrl = url.trim();

  // Si es una URL completa (http:// o https://), extraer solo la ruta relativa
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const urlObj = new URL(cleanUrl);
      cleanUrl = urlObj.pathname;
    } catch (e) {
      // Si falla al parsear, intentar extraer manualmente
      const match = cleanUrl.match(/\/uploads\/.*$/);
      if (match) {
        cleanUrl = match[0];
      } else {
        // Si no tiene /uploads/, retornar undefined
        return undefined;
      }
    }
  }

  // Remover cualquier /v1/ que pueda estar en la ruta
  cleanUrl = cleanUrl.replace(/^\/v1\//, '/').replace(/\/v1\//g, '/');

  // Asegurar que empiece con /uploads/
  if (!cleanUrl.startsWith('/uploads/')) {
    // Si no empieza con /uploads/, puede ser solo el nombre del archivo
    // En ese caso, construir la ruta completa
    if (cleanUrl && !cleanUrl.includes('/')) {
      cleanUrl = `/uploads/products-services/${cleanUrl}`;
    } else {
      // Si tiene otra estructura, retornar undefined
      return undefined;
    }
  }

  return cleanUrl;
};

// Crear un nuevo producto/servicio
export const createProductService = async (
  data: IPostProductService,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    // Validaciones básicas
    if (!data.description || !data.description.trim()) {
      return errorHandler(400, 'La descripción es requerida');
    }

    if (data.price === undefined || data.price === null || data.price < 0) {
      return errorHandler(400, 'El precio es requerido y debe ser mayor o igual a 0');
    }

    // Construir objeto de creación con campos opcionales solo si tienen valor
    const createData: any = {
      description: data.description.trim(),
      available: data.available ?? 0,
      price: data.price,
      featured: data.featured ?? false,
    };

    // Agregar campos opcionales solo si tienen valor
    if (data.long_description && data.long_description.trim()) {
      createData.long_description = data.long_description.trim();
    }

    // Limpiar y normalizar la URL de la imagen antes de guardar
    const cleanedImageUrl = cleanImageUrl(data.url_image);
    if (cleanedImageUrl) {
      createData.url_image = cleanedImageUrl;
      console.log('URL de imagen normalizada:', {
        original: data.url_image,
        cleaned: cleanedImageUrl,
      });
    } else if (data.url_image) {
      console.warn('URL de imagen no pudo ser normalizada, se omitirá:', data.url_image);
    }

    console.log('Creando nuevo producto/servicio:', {
      createData,
      url_image: createData.url_image,
    });
    
    const productService = await ProductService.create(createData, { transaction });
    const productData = productService.toJSON();
    
    console.log('Producto creado exitosamente en BD:');
    console.log('  - ID:', productData.id_product_service);
    console.log('  - Descripción:', productData.description);
    console.log('  - URL imagen guardada:', productData.url_image);
    console.log('  - Precio:', productData.price);

    const dayOfWeek = getVisitDate(new Date());

    // Registrar operación
    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.ALTA_PRODUCTO_SERVICIO,
      operation_log: JSON.stringify(productService.toJSON()),
      operation_metadata: JSON.stringify({
        action: 'CREATE_PRODUCT_SERVICE',
        data,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: roles[0],
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });

    await transaction?.commit();

    return productService;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Actualizar un producto/servicio
export const updateProductService = async (
  id_product_service: number,
  data: IUpdateProductService,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const productService = await ProductService.findByPk(id_product_service, { transaction });
    
    if (!productService) {
      return errorHandler(404, 'Producto/Servicio no encontrado');
    }

    const oldData = productService.toJSON();

    // Validaciones
    if (data.price !== undefined && data.price < 0) {
      return errorHandler(400, 'El precio debe ser mayor o igual a 0');
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.available !== undefined) updateData.available = data.available;
    if (data.long_description !== undefined) {
      updateData.long_description = data.long_description?.trim() || undefined;
    }
    if (data.price !== undefined) updateData.price = data.price;
    // Limpiar y normalizar la URL de la imagen antes de guardar
    if (data.url_image !== undefined) {
      const cleanedImageUrl = cleanImageUrl(data.url_image);
      if (cleanedImageUrl) {
        updateData.url_image = cleanedImageUrl;
        console.log('URL de imagen normalizada para actualización:', {
          original: data.url_image,
          cleaned: cleanedImageUrl,
        });
      } else if (data.url_image) {
        console.warn('URL de imagen no pudo ser normalizada, se omitirá:', data.url_image);
        // Si se envía una URL vacía o null, eliminar la imagen
        updateData.url_image = null;
      } else {
        // Si url_image es undefined, no hacer nada (no actualizar ese campo)
        delete updateData.url_image;
      }
    }
    if (data.featured !== undefined) updateData.featured = data.featured;

    // Asegurar que solo se actualice el producto específico
    // Verificar que updateData no esté vacío
    if (Object.keys(updateData).length === 0) {
      return errorHandler(400, 'No hay datos para actualizar');
    }
    
    console.log('Actualizando producto:', {
      id_product_service,
      updateData,
      oldData: oldData.url_image,
    });
    
    const updateResult = await ProductService.update(updateData, {
      where: { id_product_service },
      transaction,
    });
    
    console.log('Resultado de actualización:', {
      id_product_service,
      rowsAffected: updateResult[0],
      updateData,
    });
    
    // Verificar que solo se actualizó un registro
    if (updateResult[0] !== 1) {
      console.warn('ADVERTENCIA: Se actualizaron', updateResult[0], 'registros en lugar de 1');
    }
    
    // Obtener el producto actualizado para verificar
    const updatedProductService = await ProductService.findByPk(id_product_service, { transaction });
    if (updatedProductService) {
      const updatedData = updatedProductService.toJSON();
      console.log('Producto actualizado exitosamente en BD:');
      console.log('  - ID:', updatedData.id_product_service);
      console.log('  - Descripción:', updatedData.description);
      console.log('  - URL imagen guardada:', updatedData.url_image);
      console.log('  - Precio:', updatedData.price);
    }

    const dayOfWeek = getVisitDate(new Date());

    // Registrar operación
    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.MODIFICACION_PRODUCTO_SERVICIO,
      operation_log: JSON.stringify({
        old: oldData,
        new: updatedProductService?.toJSON(),
      }),
      operation_metadata: JSON.stringify({
        action: 'UPDATE_PRODUCT_SERVICE',
        id_product_service,
        data,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: roles[0],
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });

    await transaction?.commit();

    return updatedProductService;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Eliminar un producto/servicio
export const deleteProductService = async (
  id_product_service: number,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const productService = await ProductService.findByPk(id_product_service, { transaction });
    
    if (!productService) {
      return errorHandler(404, 'Producto/Servicio no encontrado');
    }

    const productData = productService.toJSON();

    await ProductService.destroy({
      where: { id_product_service },
      transaction,
    });

    const dayOfWeek = getVisitDate(new Date());

    // Registrar operación
    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.ELIMINACION_PRODUCTO_SERVICIO,
      operation_log: JSON.stringify(productData),
      operation_metadata: JSON.stringify({
        action: 'DELETE_PRODUCT_SERVICE',
        id_product_service,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: roles[0],
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });

    await transaction?.commit();

    return { message: 'Producto/Servicio eliminado correctamente' };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Actualización masiva de precios
export const bulkUpdatePrices = async (
  data: IBulkPriceUpdate,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    const { ids, updateType, value } = data;

    if (!ids || ids.length === 0) {
      return errorHandler(400, 'Debe seleccionar al menos un producto/servicio');
    }

    if (value === undefined || value === null) {
      return errorHandler(400, 'El valor es requerido');
    }

    // Obtener productos actuales
    const products = await ProductService.findAll({
      where: {
        id_product_service: { [Op.in]: ids },
      },
      transaction,
    });

    if (products.length === 0) {
      return errorHandler(404, 'No se encontraron productos/servicios');
    }

    const updates: any[] = [];
    const oldPrices: any = {};

    for (const product of products) {
      const currentPrice = parseFloat(product.get('price') as string) || 0;
      oldPrices[product.get('id_product_service') as number] = currentPrice;

      let newPrice = currentPrice;

      switch (updateType) {
        case 'percentage':
          // Porcentaje: aumentar o disminuir por porcentaje
          newPrice = currentPrice * (1 + value / 100);
          break;
        case 'absolute':
          // Absoluto: establecer un valor fijo
          newPrice = value;
          break;
        case 'relative':
          // Relativo: sumar o restar un valor
          newPrice = currentPrice + value;
          break;
        default:
          return errorHandler(400, 'Tipo de actualización inválido');
      }

      // Asegurar que el precio no sea negativo
      if (newPrice < 0) {
        newPrice = 0;
      }

      updates.push({
        id: product.get('id_product_service') as number,
        oldPrice: currentPrice,
        newPrice: parseFloat(newPrice.toFixed(2)),
      });
    }

    // Actualizar todos los productos
    for (const update of updates) {
      await ProductService.update(
        { price: update.newPrice },
        {
          where: { id_product_service: update.id },
          transaction,
        }
      );
    }

    const dayOfWeek = getVisitDate(new Date());

    // Registrar operación
    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.ACTUALIZACION_MASIVA_PRECIOS,
      operation_log: JSON.stringify({
        action: 'BULK_UPDATE_PRICES',
        updateType,
        value,
        updates,
      }),
      operation_metadata: JSON.stringify({
        action: 'BULK_UPDATE_PRICES',
        ids,
        updateType,
        value,
        oldPrices,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: roles[0],
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });

    await transaction?.commit();

    return {
      message: `${updates.length} producto(s)/servicio(s) actualizado(s) correctamente`,
      updated: updates,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Actualización masiva de otros campos
export const bulkUpdateProductsServices = async (
  ids: number[],
  data: IUpdateProductService,
  id_user: number,
  roles: number[],
  transaction?: Transaction
) => {
  try {
    if (!ids || ids.length === 0) {
      return errorHandler(400, 'Debe seleccionar al menos un producto/servicio');
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.available !== undefined) updateData.available = data.available;
    if (data.long_description !== undefined) {
      updateData.long_description = data.long_description?.trim() || undefined;
    }
    // Limpiar y normalizar la URL de la imagen antes de guardar
    if (data.url_image !== undefined) {
      const cleanedImageUrl = cleanImageUrl(data.url_image);
      updateData.url_image = cleanedImageUrl;
    }
    if (data.featured !== undefined) updateData.featured = data.featured;

    // No permitir actualización masiva de precio aquí (usar bulkUpdatePrices)
    if (data.price !== undefined) {
      return errorHandler(400, 'Para actualizar precios use el endpoint de actualización masiva de precios');
    }

    const [affectedRows] = await ProductService.update(updateData, {
      where: {
        id_product_service: { [Op.in]: ids },
      },
      transaction,
    });

    const dayOfWeek = getVisitDate(new Date());

    // Registrar operación
    await Operation.create({
      id_user,
      id_operation_type: EOpertationType.ACTUALIZACION_MASIVA_PRODUCTOS_SERVICIOS,
      operation_log: JSON.stringify({
        action: 'BULK_UPDATE_PRODUCTOS_SERVICIOS',
        ids,
        data: updateData,
        affectedRows,
      }),
      operation_metadata: JSON.stringify({
        action: 'BULK_UPDATE_PRODUCTS_SERVICES',
        ids,
        data: updateData,
        operation_date: argentinianDate(new Date()),
        id_role: roles,
      }),
      id_role: roles[0],
      operation_date: argentinianDate(new Date()),
      id_day: dayOfWeek,
    }, { transaction });

    await transaction?.commit();

    return {
      message: `${affectedRows} producto(s)/servicio(s) actualizado(s) correctamente`,
      affectedRows,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

