"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import AnalysisMicro from "@/components/AnalysisResult/AnalysisMicro";

export default function MicroAnalysisView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audioJobId = searchParams.get("jobId");

  const [microResult, setMicroResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [microJobId, setMicroJobId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef(false);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const checkJobStatus = async (id: string) => {
    try {
      const { data } = await api.get(`/analysis/analyze/${id}`);

      if (data.status === "completed" && data.type === "micro") {
        setMicroResult(data);
        setLoading(false);
        stopPolling();
      }

      if (data.status === "failed") {
        setError(data.error || "Erro ao processar análise micrometeorológica");
        setLoading(false);
        stopPolling();
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  useEffect(() => {
    if (!audioJobId || triggerRef.current) return;
    triggerRef.current = true;

    const trigger = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.post(`/analysis/micro/${audioJobId}`);
        setMicroJobId(data.jobId);
      } catch (err: any) {
        const message = err.response?.data?.error || "Falha ao iniciar análise micrometeorológica";
        setError(message);
        setLoading(false);
      }
    };

    trigger();
  }, [audioJobId]);

  useEffect(() => {
    if (!microJobId) return;

    checkJobStatus(microJobId);
    pollingRef.current = setInterval(() => checkJobStatus(microJobId), 2000);

    return () => stopPolling();
  }, [microJobId]);

  const handleReset = () => {
    router.push("/analysis");
  };

  if (microResult) {
    return <AnalysisMicro result={microResult} onReset={handleReset} />;
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] px-6 py-24 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)] mb-2">
                Erro na análise micrometeorológica
              </h2>
              <p className="text-sm text-[color:var(--color-text-secondary)] max-w-md">
                {error}
              </p>
            </div>
            <button onClick={handleReset} className="btn-secondary text-sm">
              Voltar para análise de áudio
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] animate-spin" />
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)] mb-1">
                Processando dados micrometeorológicos
              </h2>
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Calculando estatísticas e gerando gráficos...
              </p>
            </div>
            {microJobId && (
              <p className="text-xs text-[color:var(--color-text-muted)] tracking-widest font-mono">
                JOB {microJobId.slice(0, 8)}...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}