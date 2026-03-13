"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { SpectrogramTag } from "./tags.types";

interface TagFormModalProps {
  isOpen: boolean;
  /** Pre-filled values (from drawing or editing an existing tag) */
  initial: Partial<SpectrogramTag>;
  /** Whether editing an existing tag (shows delete button) */
  isEditing: boolean;
  onSave: (tag: Omit<SpectrogramTag, "id" | "color">) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TagFormModal({
  isOpen,
  initial,
  isEditing,
  onSave,
  onDelete,
  onClose,
}: TagFormModalProps) {
  const [species, setSpecies] = useState(initial.species ?? "");
  const [startTime, setStartTime] = useState(initial.startTime ?? 0);
  const [endTime, setEndTime] = useState(initial.endTime ?? 0);
  const [minFreqHz, setMinFreqHz] = useState(initial.minFreqHz ?? 0);
  const [maxFreqHz, setMaxFreqHz] = useState(initial.maxFreqHz ?? 0);
  const [numIndividuals, setNumIndividuals] = useState(initial.numIndividuals ?? 1);
  const [type, setType] = useState<SpectrogramTag["type"]>(initial.type ?? "Unknown");
  const [comments, setComments] = useState(initial.comments ?? "");

  // Sync when initial changes
  useEffect(() => {
    if (isOpen) {
      setSpecies(initial.species ?? "");
      setStartTime(+(initial.startTime ?? 0).toFixed(1));
      setEndTime(+(initial.endTime ?? 0).toFixed(1));
      setMinFreqHz(Math.round(initial.minFreqHz ?? 0));
      setMaxFreqHz(Math.round(initial.maxFreqHz ?? 0));
      setNumIndividuals(initial.numIndividuals ?? 1);
      setType(initial.type ?? "Unknown");
      setComments(initial.comments ?? "");
    }
  }, [isOpen, initial]);

  const handleSave = () => {
    onSave({
      startTime,
      endTime,
      minFreqHz,
      maxFreqHz,
      species: species.trim(),
      numIndividuals,
      type,
      comments: comments.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[color:var(--color-bg-card)] border border-[color:var(--color-border)] rounded-xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[color:var(--color-text-primary)]">
            {isEditing ? "Editar Tag" : "Nova Tag"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-card-hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Species */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-1.5">
              Espécie
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Ex: Orthotomus ruficeps"
              className="w-full px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] transition-all"
            />
          </div>

          {/* Time range */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-1.5">
              Tempo (s)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min={0}
                value={startTime}
                onChange={(e) => setStartTime(+e.target.value)}
                className="flex-1 px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm font-mono text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
              <span className="text-xs text-[color:var(--color-text-muted)]">até</span>
              <input
                type="number"
                step="0.1"
                min={0}
                value={endTime}
                onChange={(e) => setEndTime(+e.target.value)}
                className="flex-1 px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm font-mono text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
              <span className="text-xs text-[color:var(--color-text-muted)]">sec</span>
            </div>
          </div>

          {/* Frequency range */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-1.5">
              Frequência (Hz)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min={0}
                value={minFreqHz}
                onChange={(e) => setMinFreqHz(+e.target.value)}
                className="flex-1 px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm font-mono text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
              <span className="text-xs text-[color:var(--color-text-muted)]">até</span>
              <input
                type="number"
                step="1"
                min={0}
                value={maxFreqHz}
                onChange={(e) => setMaxFreqHz(+e.target.value)}
                className="flex-1 px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm font-mono text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
              <span className="text-xs text-[color:var(--color-text-muted)]">Hz</span>
            </div>
          </div>

          {/* Individuals + Type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-1.5">
                Nº de Indivíduos
              </label>
              <input
                type="number"
                min={1}
                value={numIndividuals}
                onChange={(e) => setNumIndividuals(Math.max(1, +e.target.value))}
                className="w-full px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm font-mono text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-1.5">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SpectrogramTag["type"])}
                className="w-full px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              >
                <option value="Song">Song</option>
                <option value="Call">Call</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-1.5">
              Comentários
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Observações sobre o som identificado..."
              rows={3}
              className="w-full px-3 py-2 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {isEditing && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] rounded-lg text-sm font-semibold text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-card)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-[color:var(--color-primary)] text-white rounded-lg text-sm font-bold hover:bg-[color:var(--color-primary-light)] transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isEditing ? "Atualizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
