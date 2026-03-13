"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnalysisResult } from "@/components/AnalysisResult/AnalysisResult";
import { SpectrogramTag } from "@/components/StaticSpectrogramPlayer/tags.types";
import { ArrowLeft, Loader2, Globe, User, FileText } from "lucide-react";
import Link from "next/link";
import api from "@/utils/api";

export default function PublicAnalysisPage() {
  const params = useParams();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/saved-analysis/${id}/public`);
        setAnalysis(data.analysis);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Análise não encontrada ou não está vinculada a um artigo publicado");
        } else {
          setError("Erro ao carregar análise");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Carregando análise...</p>
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
              href="/articles"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Artigos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reconstruct data for AnalysisResult
  const resultData = {
    jobId: analysis.jobId,
    status: "completed",
    results: analysis.analysisResult?.results || [],
  };

  const preloadedMicro = analysis.microResults?.[0]?.results ?? null;

  // Reconstruct tags
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
      {/* Header */}
      <div className="border-b border-[var(--border-default)] bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-700 uppercase">
                  <Globe className="w-3 h-3" />
                  Análise Pública
                </span>
                {analysis.user?.name && (
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <User className="w-3 h-3" />
                    {analysis.user.name}
                  </span>
                )}
              </div>
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
              {analysis.linkedArticle && (
                <Link
                  href={`/articles/${analysis.linkedArticle.id}`}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Ver Artigo
                </Link>
              )}
              <Link
                href="/articles"
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Artigos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis data — read-only (no savedAnalysisId = no auto-save, onReset goes to articles) */}
      <AnalysisResult
        result={resultData}
        onReset={() => window.history.back()}
        initialTags={initialTags}
        preloadedMicroResult={preloadedMicro}
        readOnly
      />
    </div>
  );
}
