import { Router } from "express";
import requireAuth from "../../middlewares/requireAuth";
import checkAuthorization from "../../middlewares/checkAuthorization";
import { stats, users, analyses, removeUser, removeAnalysis } from "./admin.controller";

const router = Router();

router.use(requireAuth, checkAuthorization);

router.get("/stats", stats);
router.get("/users", users);
router.get("/analyses", analyses);
router.delete("/users/:id", removeUser);
router.delete("/analyses/:id", removeAnalysis);

export default router;
