import { Router } from "express";
import { getPrice, getPricesListController, putBulkUpdatePrices, putUpdatePrice } from "./controllers";
import { jwtValidator, adminRoleValidator, validRole } from "../../middlewares";

const router = Router();

router.get("/get", getPrice);
router.get("/list", [jwtValidator, adminRoleValidator, validRole], getPricesListController);
router.put("/bulk-update", [jwtValidator, adminRoleValidator, validRole], putBulkUpdatePrices);
router.put("/update", [jwtValidator, adminRoleValidator, validRole], putUpdatePrice);

export = router;