import { Router } from "express";
import { getPartners, getPartnersInside } from "./controllers";

const routes = Router();

routes.get("/", getPartners);
routes.get("/inside", getPartnersInside);

export = routes;
