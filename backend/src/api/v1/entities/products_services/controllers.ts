import { Request, Response } from 'express';
import { responseHandler } from '../../helpers';
import { IErrorResponse } from '../../types/errorResponse.interface';
import {
  getProductsServicesList,
  getProductServiceById,
  createProductService,
  updateProductService,
  deleteProductService,
  bulkUpdatePrices,
  bulkUpdateProductsServices,
} from './helpers';

// Obtener lista de productos/servicios
export const getProductsServices = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, sortBy, sortDesc, search, available, featured },
    body: { id_user = '', roles = [] },
  } = req;

  try {
    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;
    
    const response = await getProductsServicesList(
      {
        page: pageNum,
        pageSize: pageSizeNum,
        sortBy: (sortBy as string) || 'id_product_service',
        sortDesc: sortDesc === 'true',
        search: (search as string) || '',
        available: available ? Number(available) : undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      },
      id_user,
      roles,
    );
    responseHandler(response, res, pageNum || 1, pageSizeNum || response.count || 10);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Obtener un producto/servicio por ID
export const getProductService = async (req: Request, res: Response) => {
  const {
    params: { id_product_service },
  } = req;

  try {
    const response = await getProductServiceById(Number(id_product_service));
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Crear un nuevo producto/servicio
export const postProductService = async (req: Request, res: Response) => {
  const {
    body: {
      id_user = '',
      roles = [],
      description = '',
      available = 0,
      long_description = '',
      price = 0,
      url_image = '',
      featured = false,
    },
  } = req;

  try {
    const response = await createProductService(
      {
        description,
        available: Number(available),
        long_description,
        price: Number(price),
        url_image,
        featured: Boolean(featured),
      },
      id_user,
      roles,
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Actualizar un producto/servicio
export const putProductService = async (req: Request, res: Response) => {
  const {
    params: { id_product_service },
    body: {
      id_user = '',
      roles = [],
      description,
      available,
      long_description,
      price,
      url_image,
      featured,
    },
  } = req;

  try {
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (available !== undefined) updateData.available = Number(available);
    if (long_description !== undefined) updateData.long_description = long_description;
    if (price !== undefined) updateData.price = Number(price);
    if (url_image !== undefined) updateData.url_image = url_image;
    if (featured !== undefined) updateData.featured = Boolean(featured);

    const response = await updateProductService(
      Number(id_product_service),
      updateData,
      id_user,
      roles,
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Eliminar un producto/servicio
export const deleteProductServiceController = async (req: Request, res: Response) => {
  const {
    params: { id_product_service },
    body: { id_user = '', roles = [] },
  } = req;

  try {
    const response = await deleteProductService(
      Number(id_product_service),
      id_user,
      roles,
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Actualización masiva de precios
export const putBulkUpdatePrices = async (req: Request, res: Response) => {
  const {
    body: {
      id_user = '',
      roles = [],
      ids = [],
      updateType = '',
      value = 0,
    },
  } = req;

  try {
    const response = await bulkUpdatePrices(
      {
        ids: Array.isArray(ids) ? ids.map(id => Number(id)) : [Number(ids)],
        updateType: updateType as 'percentage' | 'absolute' | 'relative',
        value: Number(value),
      },
      id_user,
      roles,
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

// Actualización masiva de otros campos
export const putBulkUpdate = async (req: Request, res: Response) => {
  const {
    body: {
      id_user = '',
      roles = [],
      ids = [],
      description,
      available,
      long_description,
      url_image,
      featured,
    },
  } = req;

  try {
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (available !== undefined) updateData.available = Number(available);
    if (long_description !== undefined) updateData.long_description = long_description;
    if (url_image !== undefined) updateData.url_image = url_image;
    if (featured !== undefined) updateData.featured = Boolean(featured);

    const response = await bulkUpdateProductsServices(
      Array.isArray(ids) ? ids.map(id => Number(id)) : [Number(ids)],
      updateData,
      id_user,
      roles,
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = 'Error Desconocido' } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

