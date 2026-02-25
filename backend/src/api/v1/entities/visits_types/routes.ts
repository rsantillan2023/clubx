import { Router } from "express";
import { getVisitsTypes } from "./controllers";

const routes = Router();

routes.get("/get", getVisitsTypes);

export = routes;