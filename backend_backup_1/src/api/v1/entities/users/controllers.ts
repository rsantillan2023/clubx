import { Request, Response } from "express";
import { responseHandler } from "../../helpers";
import { IErrorResponse } from "../../types/errorResponse.interface";
import { getUserList, userLogin } from "./helpers";

export const getUsers = async (req: Request, res: Response) => {
  const {
    query: { page, pageSize },
  } = req;
  try {
    const response = await getUserList(
      JSON.parse(
        JSON.stringify({ page: Number(page), pageSize: Number(pageSize) })
      )
    );
    responseHandler(response, res, Number(page), Number(pageSize));
  } catch (error: any) {
    const { code = 400, message = "Unknown error" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};

export const postLogin = async (req: Request, res: Response) => {
  const {
    body: { username = "", password = "" },
  } = req;
  try {
    const response = await userLogin(username, password);
    responseHandler(response, res);
  } catch (error: any) {
    const { code = 400, message = "Unknown error" } = error as IErrorResponse;
    res.status(code).send({ message });
  }
};
