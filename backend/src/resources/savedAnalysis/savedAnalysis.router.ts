import { Router } from "express";
import requireAuth from "../../middlewares/requireAuth";
import {
  saveAnalysis,
  getMyAnalyses,
  getSavedAnalysis,
  getPublicAnalysis,
  updateTags,
  deleteAnalysis,
} from "./savedAnalysis.controller";

const router = Router();

// Public
router.get("/:id/public", getPublicAnalysis);

// Authenticated
router.post("/", requireAuth, saveAnalysis);
router.get("/", requireAuth, getMyAnalyses);
router.get("/:id", requireAuth, getSavedAnalysis);
router.patch("/:id/tags", requireAuth, updateTags);
router.delete("/:id", requireAuth, deleteAnalysis);

export default router;