import { Router } from "express";
import requireAuth from "../../middlewares/requireAuth";
import {
  create,
  listPublished,
  listMine,
  getByAnalysis,
  getOne,
  update,
  remove,
} from "./article.controller";

const articleRouter = Router();

// Public
articleRouter.get("/published", listPublished);

// Auth required
articleRouter.post("/", requireAuth, create);
articleRouter.get("/mine", requireAuth, listMine);
articleRouter.get("/by-analysis/:analysisId", requireAuth, getByAnalysis);
articleRouter.get("/:id", requireAuth, getOne);
articleRouter.put("/:id", requireAuth, update);
articleRouter.delete("/:id", requireAuth, remove);

export default articleRouter;
