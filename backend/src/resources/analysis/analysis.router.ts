import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import analysisController from "./analysis.controller";
import requireAuth from "../../middlewares/requireAuth";

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// 20 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads, please try again later" },
});

// Upload + análise
// comentada para testes: router.post("/analyze", requireAuth, uploadLimiter, upload.single("file"), analysisController.uploadAndAnalyzeFile);
router.post("/analyze", requireAuth, upload.single("file"), analysisController.uploadAndAnalyzeFile);

// Análises secundárias
router.post("/micro/:jobId",              requireAuth, uploadLimiter, analysisController.triggerMicroAnalysis);
router.post("/sauim/:jobId/:filename",    requireAuth,               analysisController.triggerSauimDetection);
router.post("/compute-all/:jobId",        requireAuth,               analysisController.triggerComputeAll);

// Polling de resultado — suporta jobId base e jobId com sufixos (_full, _micro, etc.)
router.get("/analyze/:jobId", requireAuth, analysisController.getAnalysisResult);

// Arquivos estáticos (sem auth)
router.get("/audio/:jobId/:filename",        analysisController.serveAudioFile);
router.get("/spectrogram/:jobId/:filename",  analysisController.serveSpectrogramImage);
router.get("/chart/:jobId/:filename",        analysisController.serveChartImage);

// Geração de espectrograma sob demanda
router.post("/spectrogram/generate/:jobId/:filename", requireAuth, analysisController.requestSpectrogramGeneration);

export default router;