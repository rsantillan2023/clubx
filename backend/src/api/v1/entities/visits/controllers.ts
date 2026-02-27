import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { entryRegister, exitRegister, getVisitsList, fastEntryRegister, getVisitsPayingAtExit } from "./helpers";

export const getVisits = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize },
  } = req;

  try {
    const response = await getVisitsList(
      JSON.parse(
        JSON.stringify({ page: Number(page), pageSize: Number(pageSize) })
      )
    );
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};


export const getVisitsPayingAtExitController = async (req: Request, res: Response) => {
  const { query: { page, pageSize } } = req;
  try {
    const response = await getVisitsPayingAtExit({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    responseHandler(response, res, Number(page) || 1, Number(pageSize) || 50);
  } catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};


export const postVisit = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user = "",
      id_partner = "",
      //visit_date = "",
      id_state = "",
      id_visit_type = "",
      other_visit_obs = "",
      entry_visit_obs = "",
      entry_amount_paid = "",
      other_paid = "",
      other_paid_obs = "",
      id_bracelet_1 = "",
      id_bracelet_2 = "",
      id_payment_method = "",
      had_to_paid = "",
    }
  } = req;
  try {
    const response = await entryRegister(
      roles,
      id_user,
      id_partner,
      //visit_date,
      id_state,
      id_visit_type,
      other_visit_obs,
      entry_visit_obs,
      entry_amount_paid,
      other_paid,
      other_paid_obs,
      id_bracelet_1,
      id_bracelet_2,
      id_payment_method,
      had_to_paid,
    );
    responseHandler(response, res);
  }
  catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }

}

export const updateExitVisit = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user = "",
      id_state = "",
      exit_visit_obs = "",
      exit_amount_payed = "",
      other_paid = "",
      other_paid_obs = "",
      id_payment_method = "",
      had_to_paid = "",
    },
    params: { id_visit = "" },
  } = req
  try {
    const response = await exitRegister(
      roles,
      id_user,
      id_visit,
      id_state,
      exit_visit_obs,
      exit_amount_payed,
      other_paid,
      other_paid_obs,
      id_payment_method,
      had_to_paid,
    );
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }

};


export const postFastEntry = async (req: Request, res: Response) => {
  const {
    body: {
      roles = [],
      id_user = "",
      id_partner = "",
      //visit_date = "",
      id_state = "",
      id_visit_type = "",
      other_visit_obs = "",
      entry_visit_obs = "",
      entry_amount_paid = "",
      other_paid = "",
      other_paid_obs = "",
      id_bracelet_1 = "",
      id_bracelet_2 = "",
      id_payment_method = "",
      had_to_paid = "",
    }
  } = req;

  try {
    const response = await fastEntryRegister(
      roles,
      id_user,
      id_partner,
      //visit_date,
      id_state,
      id_visit_type,
      other_visit_obs,
      entry_visit_obs,
      entry_amount_paid,
      other_paid,
      other_paid_obs,
      id_bracelet_1,
      id_bracelet_2,
      id_payment_method,
      had_to_paid,
    );
    responseHandler(response, res);
  }
  catch (error: any) {
    const { code = 400, message = "Error Desconocido" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
}