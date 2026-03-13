export interface AnalysisResult {
    success: boolean;
    message: string;
    fileName?: string;
    spectrogram?: string;
    audioFiles?: string[];
}