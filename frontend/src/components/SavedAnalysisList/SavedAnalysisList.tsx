"use client";

import { useState, useEffect } from "react";
import { SavedAnalysisCard } from "./SavedAnalysisCard";
import { Loader2, FolderOpen } from "lucide-react";
import api from "@/utils/api";

type SavedAnalysis = {
  id: string;
  title: string;
  createdAt: string;
  totalAudios: number | null;
  topAcousticRichness: number | null;
  analysisType: string;
};

export function SavedAnalysisList() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/saved-analysis");
      setAnalyses(data.analyses);
    } catch (err) {
      console.error("Error fetching analyses:", err);
      setError("Erro ao carregar análises salvas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta análise?")) {
      return;
    }

    try {
      await api.delete(`/saved-analysis/${id}`);
      
      // Remove da lista localmente
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      
      alert("Análise deletada com sucesso!");
    } catch (err) {
      console.error("Error deleting analysis:", err);
      alert("Erro ao deletar análise");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 text-[color:var(--color-primary)] animate-spin" />
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Carregando análises...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="p-4 bg-[color:var(--color-bg-card)] rounded-full">
          <FolderOpen className="w-12 h-12 text-[color:var(--color-text-muted)]" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)] mb-2">
            Nenhuma análise salva
          </h3>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Faça uma análise e clique em "Salvar" para vê-la aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {analyses.map((analysis) => (
        <SavedAnalysisCard
          key={analysis.id}
          analysis={analysis}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}