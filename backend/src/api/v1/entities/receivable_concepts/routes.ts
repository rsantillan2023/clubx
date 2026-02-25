import { Router } from "express";
import { getReceivableConcepts } from "./controllers";

const router = Router();

router.get("/get", getReceivableConcepts);

export = router;