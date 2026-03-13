"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  FileAudio,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Cpu,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export type AudioResult = {
  filename: string;
  filepath: string;
  acoustic_richness: number;
  duration_seconds: number;
  sample_rate: number;
  num_samples: number;
  Ht: number;
  M: number;
  ACI: number;
  NDSI: number;
  BI: number;
  H: number;
  Hf: number;
  ADI: number;
  spectrogram_vmin_db?: number;
  spectrogram_vmax_db?: number;
  indices_computed?: boolean; // false = only AR pre-ranking from CSV
};

/**
 * Parses filenames like "record-2026_02_01_00_11_03.wav"
 * into a formatted date string "01/02/2026 00:11:03"
 */
function formatAudioDate(filename: string): string | null {
  const match = filename.match(/(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return `${day}/${month}/${year}  ${hour}:${minute}:${second}`;
}

interface DashboardRankingProps {
  results: AudioResult[];
  onSelectAudio: (audio: AudioResult, rank: number) => void;
  onComputeAll?: () => void;
  computeAllLoading?: boolean;
  computeAllDone?: boolean;
}

export function DashboardRanking({
  results,
  onSelectAudio,
  onComputeAll,
  computeAllLoading = false,
  computeAllDone = false,
}: DashboardRankingProps) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const INITIAL_COUNT = 20;

  const computedCount = useMemo(
    () => results.filter((r) => r.indices_computed !== false).length,
    [results]
  );
  const unComputedCount = results.length - computedCount;
  const hasUncomputed = unComputedCount > 0;

  // Pre-compute formatted dates for all results
  const resultsWithDates = useMemo(
    () =>
      results.map((audio, index) => ({
        audio,
        originalRank: index + 1,
        formattedDate: formatAudioDate(audio.filename),
      })),
    [results]
  );

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return resultsWithDates;
    const q = searchQuery.toLowerCase().trim();
    return resultsWithDates.filter(
      ({ audio, formattedDate }) =>
        (formattedDate && formattedDate.toLowerCase().includes(q)) ||
        audio.filename.toLowerCase().includes(q)
    );
  }, [resultsWithDates, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const displayed = isSearching
    ? filtered
    : showAll
    ? filtered
    : filtered.slice(0, INITIAL_COUNT);

  const hasMore = !isSearching && filtered.length > INITIAL_COUNT;
  const medals = ["1", "2", "3"];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-amber-50">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-bold text-[var(--text-primary)]">
            Ranking Bioacústico
          </h2>
          <p className="text-[9px] text-[var(--text-muted)] truncate">
            {hasUncomputed ? (
              <>
                <span className="text-[var(--color-primary)] font-semibold">
                  {computedCount} completos
                </span>
                {" · "}
                <span className="text-amber-500">{unComputedCount} estimados</span>
                {" · "}
                {results.length} total
              </>
            ) : (
              <>Acoustic Richness — {results.length} áudio{results.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      </div>

      {/* Search box */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!showAll) setShowAll(true);
          }}
          placeholder="Buscar por data..."
          className="w-full pl-7 pr-7 py-1.5 text-[11px] border border-[var(--border-default)] rounded-lg bg-white placeholder:text-[var(--text-muted)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-glow)] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {isSearching && (
        <p className="text-[9px] text-[var(--text-muted)] mb-1.5">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* List */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-0.5 min-h-0">
        {displayed.map(({ audio, originalRank, formattedDate }) => {
          const isTop = originalRank <= 3;
          const isComputed = audio.indices_computed !== false;
          const isClickable = isComputed;

          return (
            <button
              key={audio.filename}
              onClick={() => isClickable && onSelectAudio(audio, originalRank)}
              disabled={!isClickable}
              className={`w-full text-left rounded-lg px-2.5 py-2 border transition-all group ${
                !isClickable
                  ? "bg-[var(--bg-card-hover)] border-[var(--border-default)] opacity-60 cursor-default"
                  : isTop
                  ? "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                  : "bg-white border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isTop && isComputed
                      ? "bg-white border border-emerald-200"
                      : "bg-[var(--bg-card-hover)] border border-[var(--border-default)]"
                  }`}
                >
                  {originalRank <= 3 && isComputed
                    ? medals[originalRank - 1]
                    : `#${originalRank}`}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <FileAudio className="w-2.5 h-2.5 text-[var(--text-muted)] flex-shrink-0" />
                    <span className="text-[11px] font-medium truncate text-[var(--text-primary)]">
                      {formattedDate || audio.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-semibold ${
                        isComputed
                          ? "text-[var(--color-primary)]"
                          : "text-amber-500"
                      }`}
                    >
                      AR: {audio.acoustic_richness.toFixed(4)}
                    </span>
                    {isComputed ? (
                      audio.duration_seconds > 0 && (
                        <span className="text-[9px] font-mono text-[var(--text-muted)]">
                          {audio.duration_seconds.toFixed(1)}s
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] text-amber-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        estimado
                      </span>
                    )}
                  </div>
                </div>

                {isClickable && (
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}

        {isSearching && filtered.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-[var(--text-muted)]">
              Nenhum áudio encontrado para &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-2 space-y-1.5">
        {/* Collapse button — only when expanded, no uncomputed, and compute-all not done (done state has its own toggle) */}
        {showAll && !hasUncomputed && !computeAllDone && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors border-t border-[var(--border-default)] pt-3 mt-1"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Top 20
          </button>
        )}

        {/* Compute-all button — shown when there are uncomputed results */}
        {hasUncomputed && onComputeAll && !computeAllDone && (
          <div className="pt-2 border-t border-[var(--border-default)] mt-1">
            <button
              onClick={onComputeAll}
              disabled={computeAllLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border ${
                computeAllLoading
                  ? "bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed"
                  : "bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer shadow-sm"
              }`}
            >
              {computeAllLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processando {unComputedCount} áudios…
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  Processar todos os áudios
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">
                    +{unComputedCount}
                  </span>
                </>
              )}
            </button>
            {!computeAllLoading && (
              <p className="text-[9px] text-[var(--text-muted)] text-center mt-1.5">
                Calcula índices completos para os {unComputedCount} áudios restantes
              </p>
            )}
          </div>
        )}

        {/* Done state + expand/collapse toggle */}
        {computeAllDone && (
          <div className="pt-2 border-t border-[var(--border-default)] mt-1 space-y-1">
            <div className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Todos os índices calculados
            </div>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Top 20
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Ver todos ({results.length})
                </>
              )}
            </button>
          </div>
        )}

        {/* Show more — normal case (no compute-all involved) */}
        {hasMore && !hasUncomputed && !computeAllDone && (
          <div className="pt-3 border-t border-[var(--border-default)] mt-1">
            <button
              onClick={() => setShowAll(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Ver todos ({results.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}