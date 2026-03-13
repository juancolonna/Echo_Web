"use client";

import { FileAudio, Calendar, TrendingUp, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

type SavedAnalysisCardProps = {
  analysis: {
    id: string;
    title: string;
    createdAt: string;
    totalAudios: number | null;
    topAcousticRichness: number | null;
    analysisType: string;
  };
  onDelete: (id: string) => void;
};

export function SavedAnalysisCard({
  analysis,
  onDelete,
}: SavedAnalysisCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-xl p-6 bg-[color:var(--color-bg-card)] border border-[color:var(--color-border)] hover:border-[color:var(--color-border-hover)] hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-[color:var(--color-primary-glow)] rounded-lg">
            <FileAudio className="w-5 h-5 text-[color:var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)] truncate">
              {analysis.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-[color:var(--color-text-muted)]" />
              <span className="text-xs text-[color:var(--color-text-muted)]">
                {formatDate(analysis.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Badge do tipo */}
        <span className="badge text-[10px]">{analysis.analysisType}</span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {analysis.totalAudios !== null && (
          <div className="p-3 bg-[color:var(--color-bg-card-hover)] rounded-xl">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[color:var(--color-text-muted)] mb-1">
              Total de Áudios
            </p>
            <p className="text-lg font-bold text-[color:var(--color-text-primary)]">
              {analysis.totalAudios}
            </p>
          </div>
        )}

        {analysis.topAcousticRichness !== null && (
          <div className="p-3 bg-[color:var(--color-bg-card-hover)] rounded-xl">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[color:var(--color-text-muted)] mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Top Richness
            </p>
            <p className="text-lg font-bold font-mono text-[color:var(--color-primary-light)]">
              {Number(analysis.topAcousticRichness).toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/dashboard/analysis/${analysis.id}`)}
          className="flex-1 px-4 py-2.5 bg-[color:var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[color:var(--color-primary-light)] transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Ver Detalhes
        </button>

        <button
          onClick={() => onDelete(analysis.id)}
          className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}