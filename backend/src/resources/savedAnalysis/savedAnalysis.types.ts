import { SavedAnalysis } from "@prisma/client";

export type CreateSavedAnalysisDto = {
  userId: string;
  jobId: string;
  analysisType: "acoustic" | "micro" | "combined";
  title: string;
  notes?: string;
  totalAudios?: number;
  topAcousticRichness?: number;
  results: any;
  tags?: Record<string, any[]>;
  microResult?: any;
};

export type SavedAnalysisDto = SavedAnalysis & {
  analysisResult?: {
    results: any;
  } | null;
  microResults?: Array<{
    microJobId: string;
    results: any;
  }>;
};