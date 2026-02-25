import { Router } from "express";
import { getUsers, postLogin } from "./controllers";

const routes = Router();

routes.get("/", getUsers);
routes.post("/login", postLogin);

export = routes;
