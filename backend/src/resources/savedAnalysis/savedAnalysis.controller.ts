import { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import {
  createSavedAnalysis,
  getUserSavedAnalyses,
  getSavedAnalysisById,
  deleteSavedAnalysis,
  updateSavedAnalysisTags,
  isJobAlreadySaved,
  getPublicAnalysisById,
} from "./savedAnalysis.service";

export async function saveAnalysis(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { jobId, title, notes, results, tags, microResult } = req.body;

    if (!jobId || !title || !results) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Missing required fields: jobId, title, results",
      });
    }

    const alreadySaved = await isJobAlreadySaved(jobId, userId);
    if (alreadySaved) {
      return res.status(StatusCodes.CONFLICT).json({
        error: "This analysis has already been saved",
      });
    }

    const totalAudios = results.results?.length || 0;
    const topAcousticRichness = results.results?.[0]?.acoustic_richness || null;

    const savedAnalysis = await createSavedAnalysis({
      userId,
      jobId,
      analysisType: "acoustic",
      title,
      notes,
      totalAudios,
      topAcousticRichness,
      results: results.results,
      tags: tags || {},
      microResult: microResult || null,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      analysisId: savedAnalysis.id,
    });
  } catch (error) {
    console.error("[saved-analysis] Failed to save:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function getMyAnalyses(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const analyses = await getUserSavedAnalyses(userId);

    res.json({ analyses });
  } catch (error) {
    console.error("[saved-analysis] Failed to list:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function getPublicAnalysis(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing analysis ID" });
    }

    const analysis = await getPublicAnalysisById(id);

    if (!analysis) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Analysis not found or not linked to a published article",
      });
    }

    res.json({ analysis });
  } catch (error) {
    console.error("[saved-analysis] Failed to fetch public:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function getSavedAnalysis(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Missing analysis ID",
      });
    }

    const analysis = await getSavedAnalysisById(id, userId);

    if (!analysis) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Analysis not found",
      });
    }

    res.json({ analysis });
  } catch (error) {
    console.error("[saved-analysis] Failed to fetch:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function updateTags(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { id } = req.params;
    const { tags } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Missing analysis ID",
      });
    }

    if (!tags || typeof tags !== "object") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Missing or invalid tags object",
      });
    }

    const result = await updateSavedAnalysisTags(id, userId, tags);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Analysis not found or unauthorized") {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }

    console.error("[saved-analysis] Failed to update tags:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function deleteAnalysis(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Missing analysis ID",
      });
    }

    await deleteSavedAnalysis(id, userId);

    res.json({ success: true });
  } catch (error: any) {
    if (error.message === "Analysis not found or unauthorized") {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }

    console.error("[saved-analysis] Failed to delete:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}