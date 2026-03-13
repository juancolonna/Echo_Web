import { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import {
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle,
  getPublishedArticles,
  getUserArticles,
  getArticleByAnalysisId,
} from "./article.service";

export async function create(req: Request, res: Response) {
  try {
    const authorId = req.session.userId!;
    const { title, content, analysisId } = req.body;

    if (!title || content === undefined) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "title and content are required" });
    }

    const article = await createArticle({ authorId, title, content, analysisId });
    res.status(StatusCodes.CREATED).json({ article });
  } catch (err) {
    console.error("[article] Failed to create:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}

export async function listPublished(_req: Request, res: Response) {
  try {
    const articles = await getPublishedArticles();
    res.json({ articles });
  } catch (err) {
    console.error("[article] Failed to list published:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const articles = await getUserArticles(userId);
    res.json({ articles });
  } catch (err) {
    console.error("[article] Failed to list user articles:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}

export async function getByAnalysis(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { analysisId } = req.params;
    if (!analysisId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "analysisId is required" });
    }
    const article = await getArticleByAnalysisId(analysisId, userId);
    res.json({ article });
  } catch (err) {
    console.error("[article] Failed to fetch by analysis:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Article id is required" });
    }
    const article = await getArticleById(id);
    if (!article) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Article not found" });
    }
    // Unpublished articles are only visible to the author
    if (!article.published && article.authorId !== req.session.userId) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Article not found" });
    }
    res.json({ article });
  } catch (err) {
    console.error("[article] Failed to fetch:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { id } = req.params;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Article id is required" });
    }
    const article = await getArticleById(id);

    if (!article || article.authorId !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Article not found" });
    }

    const { title, content, published } = req.body;
    const updated = await updateArticle(id, { title, content, published });
    res.json({ article: updated });
  } catch (err) {
    console.error("[article] Failed to update:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { id } = req.params;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Article id is required" });
    }
    const article = await getArticleById(id);

    if (!article || article.authorId !== userId) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Article not found" });
    }

    await deleteArticle(id);
    res.json({ success: true });
  } catch (err) {
    console.error("[article] Failed to delete:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
}