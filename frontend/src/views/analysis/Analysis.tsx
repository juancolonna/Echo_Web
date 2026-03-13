"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/navigation";
import { InputFile } from "@/components/InputFile/InputFile";
import { AnalysisResult } from "@/components/AnalysisResult/AnalysisResult";
import { DashboardMicroStats } from "@/components/AnalysisResult/DashboardMicroStats";
import { DashboardMicroCharts } from "@/components/AnalysisResult/DashboardMicroCharts";
import api from "@/utils/api";
import { ShieldCheck, Zap, Activity, RefreshCw, Loader2 } from "lucide-react";
import { AnalysisContext } from "@/providers/AnalysisProvider/AnalysisProvider";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";

export default function AnalysisView() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { result, setResult, clearResult, isHydrated } = useContext(AnalysisContext);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number | null>(null);
  const [microResult, setMicroResult] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const microPollingRef = useRef<NodeJS.Timeout | null>(null);

const checkJobStatus = async (id: string) => {
  try {
    const { data } = await api.get(`/analysis/analyze/${id}`);

    if (data.status === "completed" && data.type === "batch_complete") {
      if (microPollingRef.current) {
        clearInterval(microPollingRef.current);
        microPollingRef.current = null;
      }
      setResult(data);
      setLoading(false);
      clearInterval(pollingIntervalRef.current!);
    } else if (data.status === "completed") {
      if (microPollingRef.current) {
        clearInterval(microPollingRef.current);
        microPollingRef.current = null;
      }
      setResult(data);
      setLoading(false);
      clearInterval(pollingIntervalRef.current!);
    } else if (data.status === "processing" && data.total_files) {
      setTotalFiles(data.total_files);
    }

    if (data.status === "failed") {
      alert(data.error || "Erro ao processar arquivo");
      setLoading(false);
      clearInterval(pollingIntervalRef.current!);
    }
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    if (!jobId) return;

    checkJobStatus(jobId);
    pollingIntervalRef.current = setInterval(
      () => checkJobStatus(jobId),
      2000
    );

    return () => clearInterval(pollingIntervalRef.current!);
  }, [jobId]);

  // ── Poll for micro result (runs in parallel, arrives faster) ──
  useEffect(() => {
    if (!jobId) return;

    const microJobId = `${jobId}_micro`;

    const checkMicro = async () => {
      try {
        const { data } = await api.get(`/analysis/analyze/${microJobId}`);
        if (data.status === "completed" && data.type === "micro") {
          setMicroResult(data);
          if (microPollingRef.current) {
            clearInterval(microPollingRef.current);
            microPollingRef.current = null;
          }
        }
      } catch {
        // Micro may not exist yet, ignore
      }
    };

    checkMicro();
    microPollingRef.current = setInterval(checkMicro, 2000);

    return () => {
      if (microPollingRef.current) {
        clearInterval(microPollingRef.current);
        microPollingRef.current = null;
      }
    };
  }, [jobId]);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      alert("Você precisa estar logado para realizar análises.");
      return;
    }

    setLoading(true);
    setMicroResult(null);
    setTotalFiles(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/analysis/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.jobId) setJobId(data.jobId);
      else {
        setResult(data);
        setLoading(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao processar arquivo");
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearResult();
    setJobId(null);
    setMicroResult(null);
    setTotalFiles(null);
    clearInterval(pollingIntervalRef.current!);
    if (microPollingRef.current) {
      clearInterval(microPollingRef.current);
      microPollingRef.current = null;
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-20">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-3 border-[var(--border-hover)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-16">
        <div className="max-w-2xl mx-auto text-center bg-white border border-[var(--border-default)] rounded-xl p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Login necessário
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Você precisa estar logado para realizar análises de arquivos.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  // ── Full result ready → show complete dashboard ──
  if (result) {
    return (
      <AnalysisResult
        result={result}
        onReset={handleReset}
        preloadedMicroResult={microResult}
      />
    );
  }

  // ── Loading: micro ready but audio still processing → partial dashboard ──
  if (loading && microResult) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-6 font-sans">
        <div className="max-w-[1440px] mx-auto space-y-4">
          {/* Header */}
          <header className="bg-white border border-[var(--border-default)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold tracking-tight">
                    Dashboard de Análise
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Micrometeorologia pronta — Processando áudios…
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </header>

          {/* Audio processing banner */}
          <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-[var(--shadow-card)] flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Processando áudios
                {totalFiles ? ` (${totalFiles} arquivos)` : ""}…
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                O ranking bioacústico será exibido quando a análise for
                concluída
              </p>
            </div>
            {jobId && (
              <p className="text-[10px] text-[var(--text-muted)] font-mono flex-shrink-0">
                JOB {jobId.slice(0, 8)}…
              </p>
            )}
          </div>

          {/* Micro stats — full width */}
          <section className="bg-white border border-[var(--border-default)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
            <DashboardMicroStats
              result={microResult}
              loading={false}
              error={null}
            />
          </section>

          {/* Micro charts — full width */}
          <section className="bg-white border border-[var(--border-default)] rounded-xl p-4 md:p-5 shadow-[var(--shadow-card)]">
            <DashboardMicroCharts
              jobId={microResult?.jobId ?? null}
              charts={microResult?.charts ?? null}
              loading={false}
              error={null}
            />
          </section>
        </div>
      </div>
    );
  }

  // ── Loading: nothing ready yet → spinner ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 rounded-full border-3 border-[var(--color-primary)] border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">
              Processando arquivo…
              {totalFiles
                ? ` (${totalFiles} áudios encontrados)`
                : ""}
            </p>
            {jobId && (
              <p className="text-xs text-[var(--text-muted)] font-mono">
                JOB {jobId.slice(0, 8)}…
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Upload form ──
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {/* TÍTULO */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Análise de Arquivo
          </h1>
          <p className="max-w-xl mx-auto text-sm text-[var(--text-secondary)]">
            Carregue suas gravações bioacústicas para processamento instantâneo.
          </p>
        </div>

        <InputFile onFileSelect={handleFileSelect} />

        <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <strong>Atenção:</strong> envie apenas arquivos{" "}
          <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">.zip</code>{" "}
          contendo gravações originais com metadados intactos para melhor
          precisão.
        </div>
      </div>
    </div>
  );
}

function Benefit({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card-eco flex gap-3 !p-4">
      <div className="text-[var(--color-primary)] mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm text-[var(--text-primary)]">
          {title}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
