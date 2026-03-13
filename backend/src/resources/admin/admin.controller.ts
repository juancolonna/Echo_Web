import { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import {
  getAdminStats,
  getAllUsers,
  getAllAnalyses,
  deleteUser,
  deleteAnalysisAdmin,
} from "./admin.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: string) { return UUID_REGEX.test(v); }

export async function stats(req: Request, res: Response) {
  try {
    const data = await getAdminStats();
    res.json(data);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function users(req: Request, res: Response) {
  try {
    const data = await getAllUsers();
    res.json({ users: data });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function analyses(req: Request, res: Response) {
  try {
    const data = await getAllAnalyses();
    res.json({ analyses: data });
  } catch (error) {
    console.error("Admin analyses error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function removeUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing or invalid user ID" });
    }

    const result = await deleteUser(id, req.session.userId!);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Cannot delete yourself") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
    if (error.message === "User not found") {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    console.error("Admin delete user error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function removeAnalysis(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing or invalid analysis ID" });
    }

    const result = await deleteAnalysisAdmin(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Analysis not found") {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }
    console.error("Admin delete analysis error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: ReasonPhrases.INTERNAL_SERVER_ERROR,
    });
  }
}
