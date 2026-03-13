import { PrismaClient } from "@prisma/client";
import { CreateSavedAnalysisDto } from "./savedAnalysis.types";
import { deleteJobFolder } from "../../utils/cleanup";

const prisma = new PrismaClient();

export async function createSavedAnalysis(data: CreateSavedAnalysisDto) {
  const { userId, jobId, analysisType, title, notes, totalAudios, topAcousticRichness, results, tags, microResult } = data;

  const savedAnalysis = await prisma.savedAnalysis.create({
    data: {
      userId,
      jobId,
      analysisType,
      title,
      notes: notes || null,
      totalAudios: totalAudios || null,
      topAcousticRichness: topAcousticRichness || null,
    },
  });

  await prisma.analysisResult.create({
    data: {
      analysisId: savedAnalysis.id,
      results,
    },
  });

  if (tags && typeof tags === "object") {
    const tagRecords = buildTagRecords(savedAnalysis.id, tags);
    if (tagRecords.length > 0) {
      await prisma.spectrogramTag.createMany({ data: tagRecords });
    }
  }

  if (microResult && typeof microResult === "object" && microResult.status === "completed") {
    const microJobId = (microResult.jobId || jobId).replace(/_micro$/, "").slice(0, 36);
    await prisma.microResult.create({
      data: {
        analysisId: savedAnalysis.id,
        microJobId,
        results: microResult,
      },
    });
  }

  return savedAnalysis;
}

export async function getUserSavedAnalyses(userId: string) {
  return await prisma.savedAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      analysisResult: {
        select: {
          results: true,
        },
      },
    },
  });
}

// Restricted to the owning user
export async function getSavedAnalysisById(id: string, userId: string) {
  return await prisma.savedAnalysis.findFirst({
    where: { id, userId },
    include: {
      analysisResult: true,
      microResults: true,
      spectrogramTags: true,
    },
  });
}

// Deletes the analysis and cascades related records
export async function deleteSavedAnalysis(id: string, userId: string) {
  const analysis = await prisma.savedAnalysis.findFirst({
    where: { id, userId },
  });

  if (!analysis) {
    throw new Error("Analysis not found or unauthorized");
  }

  await prisma.savedAnalysis.delete({
    where: { id },
  });
  await deleteJobFolder(analysis.jobId);
  return { success: true };
}

// Replaces all spectrogram tags for a given analysis
export async function updateSavedAnalysisTags(
  analysisId: string,
  userId: string,
  tags: Record<string, any[]>,
) {
  const analysis = await prisma.savedAnalysis.findFirst({
    where: { id: analysisId, userId },
  });

  if (!analysis) {
    throw new Error("Analysis not found or unauthorized");
  }

  await prisma.spectrogramTag.deleteMany({
    where: { analysisId },
  });

  const tagRecords = buildTagRecords(analysisId, tags);

  if (tagRecords.length > 0) {
    await prisma.spectrogramTag.createMany({ data: tagRecords });
  }

  return { success: true, tagCount: tagRecords.length };
}

export async function isJobAlreadySaved(jobId: string, userId: string) {
  const existing = await prisma.savedAnalysis.findFirst({
    where: { jobId, userId },
  });

  return !!existing;
}

// Only returns the analysis if it is linked to a published article
export async function getPublicAnalysisById(id: string) {
  const article = await prisma.article.findFirst({
    where: { analysisId: id, published: true },
    select: { id: true, title: true },
  });

  if (!article) return null;

  const analysis = await prisma.savedAnalysis.findUnique({
    where: { id },
    include: {
      analysisResult: true,
      microResults: true,
      spectrogramTags: true,
      user: { select: { name: true } },
    },
  });

  if (!analysis) return null;

  return { ...analysis, linkedArticle: article };
}

// --- Helpers ---

// Converts a tags map into flat records for batch insert
function buildTagRecords(analysisId: string, tags: Record<string, any[]>) {
  const records: Array<{
    analysisId: string;
    audioFilename: string;
    startTime: number;
    endTime: number;
    minFreqHz: number;
    maxFreqHz: number;
    species: string;
    numIndividuals: number;
    type: string;
    comments: string | null;
    color: string;
  }> = [];

  for (const [filename, fileTags] of Object.entries(tags)) {
    if (!Array.isArray(fileTags)) continue;
    for (const t of fileTags as any[]) {
      records.push({
        analysisId,
        audioFilename: filename,
        startTime: t.startTime ?? 0,
        endTime: t.endTime ?? 0,
        minFreqHz: t.minFreqHz ?? 0,
        maxFreqHz: t.maxFreqHz ?? 0,
        species: t.species ?? "",
        numIndividuals: t.numIndividuals ?? 1,
        type: t.type ?? "Unknown",
        comments: t.comments || null,
        color: t.color ?? "#f472b6",
      });
    }
  }

  return records;
}