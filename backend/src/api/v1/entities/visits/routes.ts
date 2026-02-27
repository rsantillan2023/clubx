import { Router } from "express";
import { adminRoleValidator, cajaRoleValidator, jwtValidator, validRole } from "../../middlewares";
import { getVisits, postVisit, updateExitVisit, postFastEntry, getVisitsPayingAtExitController } from "./controllers";

const routes = Router();

routes.get("/", getVisits);
routes.get("/paying-at-exit", [jwtValidator, validRole], getVisitsPayingAtExitController);
routes.post("/entry", [jwtValidator, validRole], postVisit)
routes.post("/fast-entry", [jwtValidator, validRole], postFastEntry)
routes.put("/exit/:id_visit", [jwtValidator, adminRoleValidator, cajaRoleValidator, validRole], updateExitVisit)

export = routes;