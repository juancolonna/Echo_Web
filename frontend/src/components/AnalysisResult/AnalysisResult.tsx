"use client";

import {
  CheckCircle2,
  RefreshCw,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { AudioDetail } from "./AudioDetail";
import { DashboardRanking, AudioResult } from "./DashboardRanking";
import { DashboardMicroStats } from "./DashboardMicroStats";
import { DashboardMicroCharts } from "./DashboardMicroCharts";
import { useMicroAnalysis } from "./useMicroAnalysis";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import { SaveAnalysisModal } from "../SaveAnalysisModal/SaveAnalysisModal";
import { SpectrogramTag } from "../StaticSpectrogramPlayer/tags.types";
import api from "@/utils/api";

type AnalysisResultProps = {
  result: {
    success?: boolean;
    status?: string;
    message?: string;
    jobId?: string;
    results?: AudioResult[];
  };
  onReset: () => void;
  initialTags?: Record<string, SpectrogramTag[]>;
  preloadedMicroResult?: any;
  savedAnalysisId?: string;
  readOnly?: boolean;
};

export function AnalysisResult({
  result,
  onReset,
  initialTags,
  preloadedMicroResult,
  savedAnalysisId,
  readOnly,
}: AnalysisResultProps) {
  const { user } = useContext(AuthContext);
  const [selectedAudio, setSelectedAudio] = useState<{
    audio: AudioResult;
    rank: number;
  } | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [tagsMap, setTagsMap] = useState<Record<string, SpectrogramTag[]>>(
    initialTags ?? {}
  );
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Live results (may be enriched by compute-all) ──
  const [liveResults, setLiveResults] = useState<AudioResult[]>(
    result.results ?? []
  );

  // ── Compute-all state ──
  const [computeAllLoading, setComputeAllLoading] = useState(false);
  const [computeAllDone, setComputeAllDone] = useState(false);
  const computeAllPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync liveResults if the parent result changes (e.g. from AnalysisContext)
  useEffect(() => {
    if (result.results) setLiveResults(result.results);
  }, [result.results]);

  // ── Compute-all handler ──
  const handleComputeAll = useCallback(async () => {
    if (!result.jobId || computeAllLoading) return;

    const uncomputed = liveResults.filter((r) => r.indices_computed === false);
    if (uncomputed.length === 0) return;

    setComputeAllLoading(true);

    try {
       await api.post(`/analysis/compute-all/${result.jobId}`, {
        files: uncomputed.map(({ filepath, filename, acoustic_richness }) => ({
          filepath,
          filename,
          ar: acoustic_richness,
        })),
      });
    } catch (err) {
      console.error("compute-all request failed:", err);
      setComputeAllLoading(false);
      return;
    }

    // Poll for batch_enriched on the _full job
    const fullJobId = `${result.jobId}_full`;

    const checkEnriched = async () => {
      try {
        const { data } = await api.get(`/analysis/analyze/${fullJobId}`);
        if (data.status === "completed" && data.type === "batch_enriched") {
          // Merge: replace uncomputed entries with freshly computed ones
          const enrichedMap = new Map<string, AudioResult>(
            (data.results as AudioResult[]).map((r) => [r.filename, r])
          );
          setLiveResults((prev) =>
            prev.map((r) => enrichedMap.get(r.filename) ?? r)
          );
          setComputeAllLoading(false);
          setComputeAllDone(true);
          if (computeAllPollingRef.current) {
            clearInterval(computeAllPollingRef.current);
            computeAllPollingRef.current = null;
          }
        } else if (data.status === "failed") {
          console.error("compute-all job failed:", data.error);
          setComputeAllLoading(false);
          if (computeAllPollingRef.current) {
            clearInterval(computeAllPollingRef.current);
            computeAllPollingRef.current = null;
          }
        }
      } catch {
        // Not ready yet, keep polling
      }
    };

    checkEnriched();
    computeAllPollingRef.current = setInterval(checkEnriched, 3000);
  }, [result.jobId, liveResults, computeAllLoading]);

  // Cleanup compute-all polling on unmount
  useEffect(() => {
    return () => {
      if (computeAllPollingRef.current)
        clearInterval(computeAllPollingRef.current);
    };
  }, []);

  // ── Auto-save tags ──
  const autoSaveTags = useCallback(
    (tags: Record<string, SpectrogramTag[]>) => {
      if (!savedAnalysisId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          setAutoSaveStatus("saving");
          await api.patch(`/saved-analysis/${savedAnalysisId}/tags`, { tags });
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        } catch (err) {
          console.error("Auto-save tags failed:", err);
          setAutoSaveStatus("error");
          setTimeout(() => setAutoSaveStatus("idle"), 3000);
        }
      }, 1000);
    },
    [savedAnalysisId]
  );

  const handleTagsChange = useCallback(
    (filename: string, newTags: SpectrogramTag[]) => {
      setTagsMap((prev) => {
        const updated = { ...prev, [filename]: newTags };
        autoSaveTags(updated);
        return updated;
      });
    },
    [autoSaveTags]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const { microResult, microJobId, loading: microLoading, error: microError } =
    useMicroAnalysis(
      preloadedMicroResult ? undefined : result.jobId,
      preloadedMicroResult
    );

  if (!liveResults || liveResults.length === 0) return null;

  const computedCount = liveResults.filter(
    (r) => r.indices_computed !== false
  ).length;

  if (selectedAudio) {
    return (
      <AudioDetail
        audio={selectedAudio.audio}
        rank={selectedAudio.rank}
        onBack={() => setSelectedAudio(null)}
        tags={tagsMap[selectedAudio.audio.filename] ?? []}
        onTagsChange={(newTags) =>
          handleTagsChange(selectedAudio.audio.filename, newTags)
        }
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-6 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* ── HEADER ── */}
        <header className="bg-white border border-[var(--border-default)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">
                  Dashboard de Análise
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  {computedCount === liveResults.length ? (
                    <>
                      {liveResults.length}{" "}
                      {liveResults.length === 1
                        ? "áudio analisado"
                        : "áudios analisados"}{" "}
                      — Ranking + Micrometeorologia
                    </>
                  ) : (
                    <>
                      <span className="text-[var(--color-primary)] font-semibold">
                        {computedCount} índices completos
                      </span>
                      {" · "}
                      <span className="text-amber-600">
                        {liveResults.length - computedCount} estimados por AR
                      </span>
                      {" · "}
                      {liveResults.length} total
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Auto-save status indicator */}
              {!readOnly && savedAnalysisId && autoSaveStatus !== "idle" && (
                <span
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
                    autoSaveStatus === "saving"
                      ? "text-amber-600 bg-amber-50 border-amber-200"
                      : autoSaveStatus === "saved"
                      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                      : "text-red-600 bg-red-50 border-red-200"
                  }`}
                >
                  {autoSaveStatus === "saving" && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  {autoSaveStatus === "saved" && (
                    <Check className="w-3 h-3" />
                  )}
                  {autoSaveStatus === "error" && (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {autoSaveStatus === "saving"
                    ? "Salvando tags..."
                    : autoSaveStatus === "saved"
                    ? "Tags salvas"
                    : "Erro ao salvar"}
                </span>
              )}

              <button
                onClick={onReset}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {readOnly ? "Voltar" : "Nova Análise"}
              </button>

              {!readOnly &&
                (savedAnalysisId ? (
                  Object.values(tagsMap).flat().length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-xs text-emerald-700 font-medium">
                        {Object.values(tagsMap).flat().length} tag
                        {Object.values(tagsMap).flat().length !== 1
                          ? "s"
                          : ""}{" "}
                        — salva automaticamente
                      </p>
                    </div>
                  )
                ) : user ? (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Análise
                    {Object.values(tagsMap).flat().length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">
                        {Object.values(tagsMap).flat().length} tag
                        {Object.values(tagsMap).flat().length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card-hover)] border border-[var(--border-default)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)]">
                      Faça login para salvar
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </header>

        {/* ── KPI STRIP ── */}
        <KpiStrip microResult={microResult} audioCount={liveResults.length} />

        {/* ── MAIN GRID: Ranking + Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Left: Ranking */}
          <aside className="bg-white border border-[var(--border-default)] rounded-xl p-4 shadow-[var(--shadow-card)] lg:max-h-[calc(100vh-200px)] lg:sticky lg:top-[72px] overflow-hidden flex flex-col">
            <DashboardRanking
              results={liveResults}
              onSelectAudio={(audio, rank) =>
                setSelectedAudio({ audio, rank })
              }
              onComputeAll={!readOnly ? handleComputeAll : undefined}
              computeAllLoading={computeAllLoading}
              computeAllDone={computeAllDone}
            />
          </aside>

          {/* Right: Micro Stats */}
          <main className="min-w-0">
            <section className="bg-white border border-[var(--border-default)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
              <DashboardMicroStats
                result={microResult}
                loading={microLoading}
                error={microError}
              />
            </section>
          </main>
        </div>

        {/* ── CHARTS ── */}
        <section className="bg-white border border-[var(--border-default)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
          <DashboardMicroCharts
            jobId={microResult?.jobId ?? microJobId}
            charts={microResult?.charts ?? null}
            loading={microLoading}
            error={microError}
          />
        </section>
      </div>

      <SaveAnalysisModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        result={{ ...result, results: liveResults, tags: tagsMap, microResult }}
        onSuccess={() => {
          alert("Análise salva com sucesso!");
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI Strip
   ═══════════════════════════════════════════════════════════════ */

function KpiStrip({
  microResult,
  audioCount,
}: {
  microResult: any;
  audioCount: number;
}) {
  const kpis = [
    { label: "Áudios", value: audioCount.toString(), icon: "", accent: "#059669" },
    {
      label: "Leituras",
      value: microResult
        ? microResult.total_readings.toLocaleString("pt-BR")
        : "—",
      icon: "",
      accent: "#2563eb",
    },
    {
      label: "Duração",
      value: microResult
        ? `${microResult.time_range.duration_hours.toFixed(1)}h`
        : "—",
      icon: "",
      accent: "#7c3aed",
    },
    {
      label: "Início",
      value: microResult
        ? new Date(microResult.time_range.start).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      icon: "",
      accent: "#d97706",
    },
    {
      label: "Fim",
      value: microResult
        ? new Date(microResult.time_range.end).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      icon: "",
      accent: "#dc2626",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="relative bg-white border border-[var(--border-default)] rounded-xl px-4 py-3.5 shadow-[var(--shadow-card)] overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: kpi.accent }}
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {kpi.label}
              </p>
              <p className="text-base md:text-lg font-bold font-mono text-[var(--text-primary)] mt-1 truncate">
                {kpi.value}
              </p>
            </div>
            <span className="text-lg opacity-70">{kpi.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}