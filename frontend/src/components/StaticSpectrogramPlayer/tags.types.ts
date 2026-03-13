/** Spectrogram annotation tag — all coordinates in real units (seconds / Hz) */
export type SpectrogramTag = {
  id: string;
  startTime: number;   // seconds
  endTime: number;     // seconds
  minFreqHz: number;   // Hz
  maxFreqHz: number;   // Hz
  species: string;
  numIndividuals: number;
  type: "Song" | "Call" | "Unknown";
  comments: string;
  color: string;
};

/** Rectangle being drawn (pixel-relative, 0-1 fractions) */
export type DrawingRect = {
  x1: number; // fraction 0-1
  y1: number;
  x2: number;
  y2: number;
};

/** Palette of distinct colors for tags */
export const TAG_COLORS = [
  "#f472b6", // pink
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fbbf24", // amber
  "#a78bfa", // violet
  "#fb923c", // orange
  "#2dd4bf", // teal
  "#f87171", // red
  "#818cf8", // indigo
  "#4ade80", // green
];

export function getNextTagColor(existingTags: SpectrogramTag[]): string {
  return TAG_COLORS[existingTags.length % TAG_COLORS.length];
}
