import { Router } from "express";
import { getDays } from "./controllers";

const router = Router();

router.get("/get", getDays);

export = router;