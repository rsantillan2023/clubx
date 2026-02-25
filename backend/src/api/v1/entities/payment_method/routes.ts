import { Router } from "express";
import { getPaymentMethods } from "./controllers";

const routes = Router();

routes.get("/get", getPaymentMethods);

export = routes;