"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import { AnalysisResult } from "@/components/AnalysisResult/AnalysisResult";
import { SpectrogramTag } from "@/components/StaticSpectrogramPlayer/tags.types";
import { ArrowLeft, Loader2, FileEdit } from "lucide-react";
import Link from "next/link";
import api from "@/utils/api";

export default function SavedAnalysisDetailPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }

    fetchAnalysisDetail();
  }, [user, id]);

  const fetchAnalysisDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/saved-analysis/${id}`);
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error("Error fetching analysis detail:", err);
      if (err.response?.status === 404) {
        setError("Análise não encontrada");
      } else {
        setError("Erro ao carregar análise");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    router.push("/dashboard/my-analyses");
  };

  if (user === null || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">
            Carregando análise...
          </p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600 mb-4">{error || "Análise não encontrada"}</p>
            <Link
              href="/dashboard/my-analyses"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Minhas Análises
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reconstrói o formato esperado pelo AnalysisResult
  const resultData = {
    jobId: analysis.jobId,
    status: "completed",
    results: analysis.analysisResult?.results || [],
  };

  // Reconstrói micro result a partir de microResults do banco
  const preloadedMicro = analysis.microResults?.[0]?.results ?? null;

  // Reconstrói tagsMap a partir de spectrogramTags do banco
  const initialTags: Record<string, SpectrogramTag[]> = {};
  if (analysis.spectrogramTags && Array.isArray(analysis.spectrogramTags)) {
    for (const t of analysis.spectrogramTags) {
      const filename = t.audioFilename;
      if (!initialTags[filename]) initialTags[filename] = [];
      initialTags[filename].push({
        id: t.id,
        startTime: t.startTime,
        endTime: t.endTime,
        minFreqHz: t.minFreqHz,
        maxFreqHz: t.maxFreqHz,
        species: t.species || "",
        numIndividuals: t.numIndividuals ?? 1,
        type: (t.type as SpectrogramTag["type"]) || "Unknown",
        comments: t.comments || "",
        color: t.color || "#f472b6",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header com título e botão voltar */}
      <div className="border-b border-[var(--border-default)] bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {analysis.title}
              </h1>
              {analysis.notes && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {analysis.notes}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/articles/editor?analysisId=${id}&analysisTitle=${encodeURIComponent(analysis.title)}`}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <FileEdit className="w-4 h-4" />
                Escrever Artigo
              </Link>
              <Link
                href="/dashboard/my-analyses"
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Minhas Análises
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de resultados */}
      <AnalysisResult result={resultData} onReset={handleReset} initialTags={initialTags} savedAnalysisId={id} preloadedMicroResult={preloadedMicro} />
    </div>
  );
}