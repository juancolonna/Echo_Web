"use client";

import { useState, useContext } from "react";
import { X, Save, Loader2 } from "lucide-react";
import api from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";

type SaveAnalysisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  onSuccess?: () => void;
};

export function SaveAnalysisModal({
  isOpen,
  onClose,
  result,
  onSuccess,
}: SaveAnalysisModalProps) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("O título é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Strip raw_data_sample from microResult to reduce payload size
      const microToSave = result.microResult
        ? { ...result.microResult, raw_data_sample: undefined }
        : null;

      await api.post("/saved-analysis", {
        jobId: result.jobId,
        title: title.trim(),
        notes: notes.trim() || undefined,
        results: result,
        tags: result.tags || {},
        microResult: microToSave,
      });

      // Sucesso!
      onSuccess?.();
      onClose();
      
      // Limpa o formulário
      setTitle("");
      setNotes("");
    } catch (err: any) {
      console.error("Error saving analysis:", err);
      
      if (err.response?.status === 409) {
        setError("Você já salvou esta análise anteriormente");
      } else {
        setError("Erro ao salvar análise. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[color:var(--color-bg-card)] border border-[color:var(--color-border)] rounded-xl p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[color:var(--color-primary-glow)] rounded-lg">
              <Save className="w-5 h-5 text-[color:var(--color-primary)]" />
            </div>
            <h2 className="text-xl font-bold text-[color:var(--color-text-primary)]">
              Salvar Análise
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-card-hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Título */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-[color:var(--color-text-secondary)] mb-2"
            >
              Título da Análise *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Floresta Amazônica - Janeiro 2025"
              className="w-full px-4 py-3 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-xl text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] transition-all"
              maxLength={255}
            />
          </div>

          {/* Notas */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-[color:var(--color-text-secondary)] mb-2"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a coleta, localização, condições climáticas..."
              rows={4}
              className="w-full px-4 py-3 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-xl text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] transition-all resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text-primary)] font-semibold hover:bg-[color:var(--color-bg-card)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="flex-1 px-6 py-3 bg-[color:var(--color-primary)] text-white rounded-lg font-bold hover:bg-[color:var(--color-primary-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}