import {
  analyzeFile,
  getJobResult,
  analyzeMicroFile,
  detectSauim,
  canAccessJob,
  generateSpectrogram,
  computeAllAudio,
} from "./analysis.service";
import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";

const UPLOADS_BASE = "/app/uploads";
const JOBS_BASE = path.join(UPLOADS_BASE, "jobs");

function sanitizePath(baseDir: string, ...segments: string[]): string | null {
  const sanitized = segments.map((s) => path.basename(s));
  const resolved = path.resolve(baseDir, ...sanitized);
  if (!resolved.startsWith(path.resolve(baseDir))) return null;
  return resolved;
}

function validateParams(jobId: string | undefined, filename: string | undefined): string | null {
  if (!jobId || !filename) return "Missing jobId or filename";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(jobId)) return "Invalid jobId";
  if (!filename.endsWith(".wav")) return "Invalid file format";
  return null;
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findCsvForJob(jobId: string): Promise<string | null> {
  const jobDir = path.join(JOBS_BASE, jobId);
  try {
    const files = await fs.readdir(jobDir);
    const csv = files.find((f) => f.toLowerCase().endsWith(".csv"));
    return csv ? path.join(jobDir, csv) : null;
  } catch {
    return null;
  }
}

// --- Controllers ---

export async function uploadAndAnalyzeMicroFile(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file)  return res.status(400).json({ error: "No file uploaded" });

    await fs.mkdir(UPLOADS_BASE, { recursive: true });

    const safeName  = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename  = `${Date.now()}-${safeName}`;
    const csvPath   = sanitizePath(UPLOADS_BASE, filename);
    if (!csvPath) return res.status(400).json({ error: "Invalid filename" });

    await fs.writeFile(csvPath, req.file.buffer);
    const jobId = await analyzeMicroFile(csvPath, userId);
    res.json({ jobId, status: "queued" });
  } catch (error) {
    console.error("[analysis] Failed to upload CSV:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
}

export async function triggerMicroAnalysis(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { jobId } = req.params;
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) return res.status(400).json({ error: "Invalid jobId" });

    const csvPath = await findCsvForJob(jobId);
    if (!csvPath) {
      return res.status(404).json({
        error: "No CSV file found for this job. Make sure the original ZIP contained a CSV file.",
      });
    }

    const microJobId = `${jobId}_micro`;
    await analyzeMicroFile(csvPath, userId, microJobId);
    res.json({ jobId: microJobId, status: "queued" });
  } catch (error) {
    console.error("[analysis] Failed to trigger micro analysis:", error);
    res.status(500).json({ error: "Failed to trigger micro analysis" });
  }
}

export async function uploadAndAnalyzeFile(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file)  return res.status(400).json({ error: "No file uploaded" });

    await fs.mkdir(UPLOADS_BASE, { recursive: true });

    const safeName  = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename  = `${Date.now()}-${safeName}`;
    const audioPath = sanitizePath(UPLOADS_BASE, filename);
    if (!audioPath) return res.status(400).json({ error: "Invalid filename" });

    await fs.writeFile(audioPath, req.file.buffer);
    const jobId = await analyzeFile(audioPath, userId);
    res.json({ jobId, status: "queued" });
  } catch (error) {
    console.error("[analysis] Failed to upload file:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
}

export async function getAnalysisResult(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { jobId } = req.params;
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    if (!canAccessJob(jobId, userId)) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const result = await getJobResult(jobId);
    if (!result) return res.json({ status: "processing" });
    res.json(result);
  } catch (error) {
    console.error("[analysis] Failed to get result:", error);
    res.status(500).json({ error: "Failed to get result" });
  }
}

export async function serveAudioFile(req: Request, res: Response) {
  try {
    const { jobId, filename } = req.params;
    const validationError = validateParams(jobId, filename);
    if (validationError) return res.status(400).json({ error: validationError });

    const audioPath = sanitizePath(JOBS_BASE, jobId!, filename!);
    if (!audioPath) return res.status(400).json({ error: "Invalid path" });
    if (!(await checkFileExists(audioPath))) return res.status(404).json({ error: "File not found" });

    res.sendFile(audioPath);
  } catch (error) {
    console.error("[analysis] Failed to serve audio file:", error);
    res.status(500).json({ error: "Failed to serve audio file" });
  }
}

export async function serveChartImage(req: Request, res: Response) {
  try {
    const { jobId, filename } = req.params;
    if (!jobId || !filename) return res.status(400).json({ error: "Missing jobId or filename" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) return res.status(400).json({ error: "Invalid jobId" });
    if (!filename.endsWith(".png")) return res.status(400).json({ error: "Invalid file format" });

    const chartPath = sanitizePath(JOBS_BASE, jobId, filename);
    if (!chartPath) return res.status(400).json({ error: "Invalid path" });
    if (!(await checkFileExists(chartPath))) return res.status(404).json({ error: "Chart not found" });

    res.sendFile(chartPath);
  } catch (error) {
    console.error("[analysis] Failed to serve chart image:", error);
    res.status(500).json({ error: "Failed to serve chart image" });
  }
}

export async function serveSpectrogramImage(req: Request, res: Response) {
  try {
    const { jobId, filename } = req.params;
    const validationError = validateParams(jobId, filename);
    if (validationError) return res.status(400).json({ error: validationError });

    const baseFilename      = path.basename(filename!).replace(/\.wav$/i, "");
    const spectrogramPath   = sanitizePath(JOBS_BASE, jobId!, `${baseFilename}_spectrogram.png`);
    if (!spectrogramPath) return res.status(400).json({ error: "Invalid path" });
    if (!(await checkFileExists(spectrogramPath))) return res.status(404).json({ error: "Spectrogram not found" });

    res.sendFile(spectrogramPath);
  } catch (error) {
    console.error("[analysis] Failed to serve spectrogram:", error);
    res.status(500).json({ error: "Failed to serve spectrogram image" });
  }
}

export async function triggerSauimDetection(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { jobId, filename } = req.params;
    if (!jobId || !filename) return res.status(400).json({ error: "Missing jobId or filename" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) return res.status(400).json({ error: "Invalid jobId" });
    if (!filename.endsWith(".wav")) return res.status(400).json({ error: "File must be .wav format" });

    const audioPath = sanitizePath(JOBS_BASE, jobId, filename);
    if (!audioPath) return res.status(400).json({ error: "Invalid path" });
    if (!(await checkFileExists(audioPath))) return res.status(404).json({ error: "Audio file not found" });

    const sauimJobId = await detectSauim(audioPath, jobId, filename, userId);
    res.json({ jobId: sauimJobId, status: "queued" });
  } catch (error) {
    console.error("[analysis] Failed to trigger sauim detection:", error);
    res.status(500).json({ error: "Failed to trigger sauim detection" });
  }
}

export async function requestSpectrogramGeneration(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { jobId, filename } = req.params;
    const validationError = validateParams(jobId, filename);
    if (validationError) return res.status(400).json({ error: validationError });

    const audioPath = sanitizePath(JOBS_BASE, jobId!, filename!);
    if (!audioPath) return res.status(400).json({ error: "Invalid path" });
    if (!(await checkFileExists(audioPath))) return res.status(404).json({ error: "Audio file not found" });

    const baseFilename    = path.basename(filename!).replace(/\.wav$/i, "");
    const spectrogramPath = sanitizePath(JOBS_BASE, jobId!, `${baseFilename}_spectrogram.png`);
    if (spectrogramPath && (await checkFileExists(spectrogramPath))) {
      return res.json({ status: "ready" });
    }

    const spectrogramJobId = `${jobId}_spectrogram_${baseFilename}`;
    await generateSpectrogram(audioPath, userId, spectrogramJobId);
    res.json({ jobId: spectrogramJobId, status: "queued" });
  } catch (error) {
    console.error("[analysis] Failed to request spectrogram generation:", error);
    res.status(500).json({ error: "Failed to request spectrogram generation" });
  }
}

// Triggers full acoustic index computation for all non-computed files of a batch job.
// Body: { files: Array<{ filepath: string; filename: string; ar: number }> }
export async function triggerComputeAll(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { jobId } = req.params;
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) return res.status(400).json({ error: "Invalid jobId" });

    if (!canAccessJob(jobId, userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { files } = req.body as {
      files: Array<{ filepath: string; filename: string; ar: number }>;
    };

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files must be a non-empty array" });
    }

    // Basic validation — no path traversal
    for (const f of files) {
      if (!f.filepath || !f.filename || typeof f.ar !== "number") {
        return res.status(400).json({ error: "Each file must have filepath, filename and ar" });
      }
      const resolved = path.resolve(f.filepath);
      if (!resolved.startsWith(path.resolve(JOBS_BASE))) {
        return res.status(400).json({ error: "Invalid filepath" });
      }
    }

    const fullJobId = await computeAllAudio(jobId, files, userId);
    res.json({ jobId: fullJobId, status: "queued" });
  } catch (error) {
    console.error("[analysis] Failed to trigger compute-all:", error);
    res.status(500).json({ error: "Failed to trigger compute-all" });
  }
}

export default {
  uploadAndAnalyzeFile,
  triggerMicroAnalysis,
  triggerSauimDetection,
  triggerComputeAll,
  getAnalysisResult,
  serveAudioFile,
  serveChartImage,
  serveSpectrogramImage,
  uploadAndAnalyzeMicroFile,
  requestSpectrogramGeneration,
};