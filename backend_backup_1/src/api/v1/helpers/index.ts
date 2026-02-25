import { Response } from 'express';
import { IRequestReponse } from '../types/requestResponse.interface';

export const errorHandler = (code: number, message: string) => {
  throw { code, message };
};

export const responseHandler = (
  data: any | any[],
  res: Response,
  page?: number,
  pageSize?: number,
) => {
  try {
    const { count = -1, rows } = data || {};
    let response: IRequestReponse = {};
    if (Array.isArray(data)) {
      // When is response array
      response = { ...response, data, totalCount: data.length };
    } else {
      if (count >= 0 && rows) {
        // when is paginated
        response = { ...response, data: rows, totalCount: count };
        if (!isNaN(page || 0) && page) {
          response = {
            ...response,
            pageCount: rows.length,
            currentPage: rows.length ? page : 1,
            totalPages: Math.ceil(count / (pageSize || 0)),
            previousPage: rows.length
              ? response.currentPage === 1
                ? null
                : (page || 0) - 1
              : null,
            nextPage: rows.length
              ? response.currentPage === response.totalPages
                ? null
                : (page || 0) + 1
              : null,
          };
        }
      } else {
        // when response is one object
        response = { ...response, data };
      }
    }
    return res.status(200).send(response);
  } catch (error) {
    throw error;
  }
};

export const getPagination = (page: number, size: number) => {
  try {
    const limit = size;
    const offset = (page || 0) > 0 ? (page - 1) * limit : undefined;
    return { limit, offset };
  } catch (error) {
    throw error;
  }
};
