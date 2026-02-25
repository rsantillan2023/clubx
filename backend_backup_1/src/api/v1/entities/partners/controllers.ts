import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getPartnersList, getPartnersInsideList } from "./helpers";

export const getPartners = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, sortBy, sortDesc, searcher, status, fechas },
  } = req;
  
  try {
    const response = await getPartnersList({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      sortBy: sortBy as string || 'created_at',
      sortDesc: sortDesc === 'true',
      searcher: searcher as string || '',
      status: status as string || '',
      fechas: fechas as string || ''
    });
    
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = "Unknown error" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const getPartnersInside = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize, sortBy, sortDesc },
  } = req;
  
  try {
    const response = await getPartnersInsideList({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      sortBy: sortBy as string || 'id_bracelet_1',
      sortDesc: sortDesc as string || 'false'
    });
    
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = "Unknown error" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};
