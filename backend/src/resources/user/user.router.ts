import { Router } from "express";
import userController from "./user.controller";
import requireAuth from "../../middlewares/requireAuth";
import checkAuthorization from "../../middlewares/checkAuthorization";

const router = Router();

router.get("/", requireAuth, checkAuthorization, userController.index);
router.post("/", requireAuth, checkAuthorization, userController.create);

export default router;