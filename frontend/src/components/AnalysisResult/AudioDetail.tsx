"use client";

import {
  ArrowLeft,
  FileAudio,
  BarChart3,
  Activity,
  Waves,
  Loader2,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { StaticSpectrogramPlayer } from "../StaticSpectrogramPlayer/StaticSpectrogramPlayer";
import { SpectrogramTag } from "../StaticSpectrogramPlayer/tags.types";
import api from "@/utils/api";

type AudioResult = {
  filename: string;
  filepath: string;
  acoustic_richness: number;
  duration_seconds: number;
  sample_rate: number;
  num_samples: number;
  Ht: number;
  M: number;
  ACI: number | null;
  NDSI: number | null;
  BI: number | null;
  H: number | null;
  Hf: number | null;
  ADI: number | null;
  spectrogram_vmin_db?: number;
  spectrogram_vmax_db?: number;
};

type DetailedIndices = {
  ACI: number;
  NDSI: number;
  BI: number;
  H: number;
  Hf: number;
  ADI: number;
};

type AudioDetailProps = {
  audio: AudioResult;
  rank: number;
  onBack: () => void;
  tags: SpectrogramTag[];
  onTagsChange: (tags: SpectrogramTag[]) => void;
  readOnly?: boolean;
};

export function AudioDetail({ audio, rank, onBack, tags, onTagsChange, readOnly }: AudioDetailProps) {
  const [detailedIndices, setDetailedIndices] = useState<DetailedIndices | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Sauim detection state
  const [sauimStatus, setSauimStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [sauimResult, setSauimResult] = useState<{
    detected: boolean;
    total_detections: number;
    detections: { start: number; end: number; label: string }[];
    processing_time: number;
  } | null>(null);
  const [sauimError, setSauimError] = useState<string | null>(null);
  const sauimPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset sauim state when switching audio files & cleanup polling on unmount
  useEffect(() => {
    // Cleanup any active polling from previous audio
    if (sauimPollRef.current) {
      clearInterval(sauimPollRef.current);
      sauimPollRef.current = null;
    }
    setSauimStatus('idle');
    setSauimResult(null);
    setSauimError(null);

    return () => {
      if (sauimPollRef.current) {
        clearInterval(sauimPollRef.current);
        sauimPollRef.current = null;
      }
    };
  }, [audio.filename]);

  const [spectrogramStatus, setSpectrogramStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const spectrogramPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spectrogramPollRef.current) {
      clearInterval(spectrogramPollRef.current);
      spectrogramPollRef.current = null;
    }
    setSpectrogramStatus('idle');

    return () => {
      if (spectrogramPollRef.current) {
        clearInterval(spectrogramPollRef.current);
        spectrogramPollRef.current = null;
      }
    };
  }, [audio.filename]);


  const medals = ["1", "2", "3"];
  const rankDisplay = rank <= 3 ? medals[rank - 1] : `#${rank}`;

  /**
   * Parses filenames like "record-2026_02_01_00_11_03.wav"
   * into a formatted date string "01/02/2026  00:11:03"
   */
  const formatAudioDate = (filename: string): string | null => {
    const match = filename.match(/(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second] = match;
    return `${day}/${month}/${year}  ${hour}:${minute}:${second}`;
  };

  const displayName = formatAudioDate(audio.filename) || audio.filename;

  const getJobId = () => {
    const pathParts = audio.filepath.split('/');
    return pathParts[pathParts.length - 2];
  };

  const jobId = getJobId();

  // /spectrogram/generate/:jobId/:filename
  const generateSpectrogramUrl = () => {
    const baseURL = typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_DOCKER_API
      : process.env.NEXT_PUBLIC_API;
    return `${baseURL}/analysis/spectrogram/generate/${jobId}/${audio.filename}`;
  }


  const getAudioUrl = () => {
    const baseURL = typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_DOCKER_API
      : process.env.NEXT_PUBLIC_API;
    return `${baseURL}/analysis/audio/${jobId}/${audio.filename}`;
  };

  const getSpectrogramUrl = () => {
    const baseURL = typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_DOCKER_API
      : process.env.NEXT_PUBLIC_API;
    return `${baseURL}/analysis/spectrogram/${jobId}/${audio.filename}`;
  };

  const handleSauimDetection = useCallback(async () => {
    setSauimStatus('loading');
    setSauimError(null);

    try {
      // Trigger detection job
      const { data } = await api.post(`/analysis/sauim/${jobId}/${audio.filename}`);
      const sauimJobId = data.jobId;

      // Poll for results
      const maxAttempts = 120; // 2 minutes max (sauim can be slow)
      let attempts = 0;

      // Clear any previous poll before starting a new one
      if (sauimPollRef.current) {
        clearInterval(sauimPollRef.current);
      }

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const { data: result } = await api.get(`/analysis/analyze/${sauimJobId}`);

          if (result.status === "completed" && result.type === "sauim_detection") {
            clearInterval(pollInterval);
            sauimPollRef.current = null;
            setSauimResult({
              detected: result.detected,
              total_detections: result.total_detections,
              detections: result.detections,
              processing_time: result.processing_time,
            });
            setSauimStatus('completed');
          } else if (result.status === "failed") {
            clearInterval(pollInterval);
            sauimPollRef.current = null;
            setSauimError(result.error || "Falha na detecção");
            setSauimStatus('error');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            sauimPollRef.current = null;
            setSauimError("Tempo esgotado na detecção");
            setSauimStatus('error');
          }
        } catch {
          // keep polling
        }
      }, 2000);

      sauimPollRef.current = pollInterval;

    } catch (err) {
      console.error("Error triggering sauim detection:", err);
      setSauimError("Erro ao iniciar detecção");
      setSauimStatus('error');
    }
  }, [jobId, audio.filename]);


  const handleGenerateSpectrogram = useCallback(async () => {
    setSpectrogramStatus('loading');

    try {
      const { data } = await api.post(`/analysis/spectrogram/generate/${jobId}/${audio.filename}`);

      // Espectrograma já existia
      if (data.status === 'ready') {
        setSpectrogramStatus('ready');
        return;
      }

      // Aguarda geração via polling
      const spectrogramJobId = data.jobId;
      let attempts = 0;
      const maxAttempts = 60;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const { data: result } = await api.get(`/analysis/analyze/${spectrogramJobId}`);

          if (result.status === 'completed' && result.type === 'spectrogram') {
            clearInterval(pollInterval);
            spectrogramPollRef.current = null;
            setSpectrogramStatus('ready');
          } else if (result.status === 'failed') {
            clearInterval(pollInterval);
            spectrogramPollRef.current = null;
            setSpectrogramStatus('error');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            spectrogramPollRef.current = null;
            setSpectrogramStatus('error');
          }
        } catch {
          // keep polling
        }
      }, 2000);

      spectrogramPollRef.current = pollInterval;

    } catch {
      setSpectrogramStatus('error');
    }
  }, [jobId, audio.filename]);

  const audioUrl = getAudioUrl();
  const spectrogramUrl = getSpectrogramUrl();

  useEffect(() => {
    if (audio.ACI !== null) {
      setDetailedIndices({
        ACI: audio.ACI,
        NDSI: audio.NDSI!,
        BI: audio.BI!,
        H: audio.H!,
        Hf: audio.Hf!,
        ADI: audio.ADI!,
      });
      return;
    }

    const loadDetailedAnalysis = async () => {
      setIsLoadingDetails(true);
      setDetailsError(null);

      try {
        const baseURL = typeof window === "undefined"
          ? process.env.NEXT_PUBLIC_DOCKER_API
          : process.env.NEXT_PUBLIC_API;

        const detailResponse = await fetch(
          `${baseURL}/analysis/audio/${jobId}/${audio.filename}/details`
        );

        if (!detailResponse.ok) {
          throw new Error("Falha ao solicitar análise detalhada");
        }

        const { detailedJobId } = await detailResponse.json();

        const maxAttempts = 30;
        let attempts = 0;

        const pollInterval = setInterval(async () => {
          attempts++;

          try {
            const resultResponse = await fetch(
              `${baseURL}/analysis/analyze/${detailedJobId}`
            );
            const result = await resultResponse.json();

            if (result.status === "completed" && result.type === "detailed") {
              clearInterval(pollInterval);
              const indices = result.result;
              setDetailedIndices({
                ACI: indices.ACI,
                NDSI: indices.NDSI,
                BI: indices.BI,
                H: indices.H,
                Hf: indices.Hf,
                ADI: indices.ADI,
              });
              setIsLoadingDetails(false);
            } else if (result.status === "failed") {
              clearInterval(pollInterval);
              setDetailsError("Erro ao calcular índices detalhados");
              setIsLoadingDetails(false);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setDetailsError("Tempo esgotado ao calcular índices");
              setIsLoadingDetails(false);
            }
          } catch (error) {
            console.error("Erro no polling:", error);
          }
        }, 1000);

      } catch (error) {
        console.error("Erro ao carregar análise detalhada:", error);
        setDetailsError("Falha ao carregar índices detalhados");
        setIsLoadingDetails(false);
      }
    };

    loadDetailedAnalysis();
  }, [audio, jobId]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Back button */}
        <button
          onClick={onBack}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-bold">
            {rankDisplay}
          </div>
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-[var(--text-muted)]" />
            <h1 className="text-xl font-bold tracking-tight">
              {displayName}
            </h1>
          </div>
        </div>

        {/* Spectrogram */}
        <div className="card-eco">
          <div className="flex items-center gap-2 mb-4 badge">
            <Waves className="w-3.5 h-3.5" />
            Espectrograma e Player de Áudio
          </div>

          {spectrogramStatus === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-[var(--bg-card-hover)] rounded-lg">
              <button onClick={handleGenerateSpectrogram} className="btn-primary flex items-center gap-2">
                <Waves className="w-4 h-4" />
                Gerar Espectrograma
              </button>
            </div>
          )}

          {spectrogramStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-[var(--bg-card-hover)] rounded-lg">
              <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
              <p className="text-sm text-[var(--text-secondary)]">Gerando espectrograma...</p>
            </div>
          )}

          {spectrogramStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <p className="text-sm text-red-500">Erro ao gerar espectrograma</p>
              <button onClick={handleGenerateSpectrogram} className="btn-secondary text-sm">
                Tentar novamente
              </button>
            </div>
          )}

          {spectrogramStatus === 'ready' && (
            <StaticSpectrogramPlayer
              audioUrl={audioUrl}
              spectrogramUrl={spectrogramUrl}
              duration={audio.duration_seconds}
              maxFreqKhz={audio.sample_rate / 2000}
              dbRange={
                audio.spectrogram_vmin_db != null && audio.spectrogram_vmax_db != null
                  ? { min: audio.spectrogram_vmin_db, max: audio.spectrogram_vmax_db }
                  : undefined
              }
              tags={tags}
              onTagsChange={onTagsChange}
              readOnly={readOnly}
            />
          )}
        </div>
        {/* Sauim de Coleira Detection */}
        <div className="card-eco">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="badge">
                <ScanSearch className="w-3.5 h-3.5" />
                Detecção de Sauim de Coleira
              </div>
              <span className="text-[10px] text-[var(--text-muted)] italic">
                Saguinus bicolor
              </span>
            </div>

            {sauimStatus === 'idle' && (
              <button
                onClick={handleSauimDetection}
                className="btn-primary flex items-center gap-2 text-sm !py-2"
              >
                <ScanSearch className="w-4 h-4" />
                Detectar Sauim
              </button>
            )}

            {sauimStatus === 'loading' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="text-sm text-amber-700 font-medium">Analisando áudio...</span>
              </div>
            )}
          </div>

          {sauimStatus === 'loading' && (
            <div className="mt-4 p-4 bg-[var(--bg-card-hover)] rounded-lg">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                O detector utiliza um modelo um classificador treinado para identificar vocalizações
                do <strong>Sauim de Coleira (Saguinus bicolor)</strong>. Este processo pode levar
                alguns minutos dependendo da duração do áudio.
              </p>
            </div>
          )}

          {sauimStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Erro na detecção</p>
                <p className="text-xs text-red-600 mt-1">{sauimError}</p>
                <button
                  onClick={handleSauimDetection}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {sauimStatus === 'completed' && sauimResult && (
            <div className="mt-4 space-y-4">
              {/* Detection summary */}
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${sauimResult.detected
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
                }`}>
                {sauimResult.detected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-base font-bold ${sauimResult.detected ? "text-emerald-800" : "text-gray-600"
                    }`}>
                    {sauimResult.detected
                      ? `🐒 Sauim de Coleira detectado!`
                      : "Nenhuma vocalização de Sauim detectada"
                    }
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm text-[var(--text-secondary)]">
                      <strong>{sauimResult.total_detections}</strong>{" "}
                      {sauimResult.total_detections === 1 ? "detecção" : "detecções"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {sauimResult.processing_time.toFixed(1)}s de processamento
                    </span>
                  </div>
                </div>
              </div>

              {/* Detection intervals table */}
              {sauimResult.detections.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Intervalos de Detecção
                  </h3>
                  <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--bg-card-hover)]">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">#</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">Início</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">Fim</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">Duração</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sauimResult.detections.map((det, idx) => (
                          <tr key={idx} className="border-t border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]">
                            <td className="px-3 py-2 font-mono text-xs text-[var(--text-muted)]">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-xs">{formatTime(det.start)}</td>
                            <td className="px-3 py-2 font-mono text-xs">{formatTime(det.end)}</td>
                            <td className="px-3 py-2 font-mono text-xs text-[var(--color-primary)]">
                              {(det.end - det.start).toFixed(1)}s
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                    ⚠️ As detecções são baseadas em classificador e necessitam validação manual.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Basic info */}
          <div className="lg:col-span-1">
            <div className="card-eco h-full">
              <div className="flex items-center gap-2 mb-5 badge">
                <Activity className="w-3.5 h-3.5" />
                Informações básicas
              </div>

              <div className="space-y-0">
                <InfoItem
                  label="Acoustic Richness"
                  value={audio.acoustic_richness.toFixed(4)}
                  highlight
                />
                <InfoItem
                  label="Duração"
                  value={`${audio.duration_seconds.toFixed(2)}s`}
                />
                <InfoItem
                  label="Sample Rate"
                  value={`${(audio.sample_rate / 1000).toFixed(1)} kHz`}
                />
                <InfoItem
                  label="Temporal Entropy (Ht)"
                  value={audio.Ht.toFixed(4)}
                />
                <InfoItem
                  label="Temporal Median (M)"
                  value={audio.M.toFixed(4)}
                />
                <InfoItem
                  label="Total de Samples"
                  value={audio.num_samples.toLocaleString()}
                />
                {detailedIndices && (
                  <InfoItem
                    label="Frequency Entropy (Hf)"
                    value={detailedIndices.Hf.toFixed(4)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Acoustic indices */}
          <div className="lg:col-span-2">
            <div className="card-eco h-full">
              <div className="flex items-center gap-2 mb-5 badge">
                <BarChart3 className="w-3.5 h-3.5" />
                Índices acústicos
              </div>

              {isLoadingDetails && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Calculando índices acústicos detalhados...
                  </p>
                </div>
              )}

              {detailsError && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{detailsError}</p>
                </div>
              )}

              {detailedIndices && !isLoadingDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AcousticIndexCard
                    code="ACI"
                    name="Acoustic Complexity Index"
                    value={detailedIndices.ACI}
                    description="Mede a variabilidade temporal do espectro sonoro"
                    icon={<Waves className="w-5 h-5" />}
                  />
                  <AcousticIndexCard
                    code="NDSI"
                    name="Normalized Difference Soundscape Index"
                    value={detailedIndices.NDSI}
                    description="Razão entre sons biofônicos e antropofônicos"
                    icon={<Activity className="w-5 h-5" />}
                  />
                  <AcousticIndexCard
                    code="BI"
                    name="Bioacoustic Index"
                    value={detailedIndices.BI}
                    description="Concentração de energia na faixa bioacústica (2-8 kHz)"
                    icon={<BarChart3 className="w-5 h-5" />}
                  />
                  <AcousticIndexCard
                    code="H"
                    name="Acoustic Entropy Index"
                    value={detailedIndices.H}
                    description="Produto das entropias temporal e espectral"
                    icon={<Waves className="w-5 h-5" />}
                  />
                  <div className="md:col-span-2">
                    <AcousticIndexCard
                      code="ADI"
                      name="Acoustic Diversity Index"
                      value={detailedIndices.ADI}
                      description="Diversidade de sons em diferentes bandas de frequência"
                      icon={<BarChart3 className="w-5 h-5" />}
                      highlight
                    />
                  </div>
                </div>
              )}

              {detailedIndices && (
                <div className="mt-5 p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    <strong className="text-[var(--text-primary)]">Nota:</strong>{" "}
                    Os índices acústicos ecológicos são métricas quantitativas que
                    caracterizam paisagens sonoras e podem ser usados para
                    monitoramento de biodiversidade e avaliação ambiental.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Helper functions --- */

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
}

/* --- Subcomponents --- */

function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--border-default)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span
        className={`text-sm font-mono font-medium ${highlight
          ? "text-[var(--color-primary)]"
          : "text-[var(--text-primary)]"
          }`}
      >
        {value}
      </span>
    </div>
  );
}

function AcousticIndexCard({
  code,
  name,
  value,
  description,
  icon,
  highlight = false,
}: {
  code: string;
  name: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-5 border transition-colors ${highlight
        ? "bg-emerald-50 border-emerald-200"
        : "bg-[var(--bg-primary)] border-[var(--border-default)] hover:border-[var(--border-hover)]"
        }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 p-2 rounded-md bg-white border border-[var(--border-default)]">
          <div className="text-[var(--text-muted)]">{icon}</div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold tracking-tight">{code}</h3>
          <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
            {name}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xl font-mono font-semibold text-[var(--color-primary)]">
            {value.toFixed(3)}
          </span>
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
