"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { AudioFilterState } from "./useAudioPlayer";

const LOWPASS_PRESETS = [
  { label: "500 Hz", value: 500, description: "Apenas graves profundos" },
  { label: "1 kHz", value: 1000, description: "Graves e médios graves" },
  { label: "2 kHz", value: 2000, description: "Voz humana baixa" },
  { label: "4 kHz", value: 4000, description: "Canto de pássaros (baixo)" },
  { label: "8 kHz", value: 8000, description: "Maioria dos cantos" },
  { label: "12 kHz", value: 12000, description: "Alta fidelidade" },
] as const;

const HIGHPASS_PRESETS = [
  { label: "50 Hz", value: 50, description: "Remove sub-graves" },
  { label: "100 Hz", value: 100, description: "Remove rumble" },
  { label: "200 Hz", value: 200, description: "Remove graves baixos" },
  { label: "500 Hz", value: 500, description: "Apenas médios e agudos" },
  { label: "1 kHz", value: 1000, description: "Apenas agudos" },
  { label: "2 kHz", value: 2000, description: "Ultrafiltrado" },
] as const;

interface AudioFilterControlsProps {
  filter: AudioFilterState;
  onFilterChange: (update: Partial<AudioFilterState>) => void;
  highpassFilter: AudioFilterState;
  onHighpassChange: (update: Partial<AudioFilterState>) => void;
}

export function AudioFilterControls({
  filter,
  onFilterChange,
  highpassFilter,
  onHighpassChange,
}: AudioFilterControlsProps) {
  const [expanded, setExpanded] = useState(false);

  const formatFreq = (hz: number) => {
    if (hz >= 1000) return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`;
    return `${hz} Hz`;
  };

  const anyActive = filter.enabled || highpassFilter.enabled;

  return (
    <div className="rounded-xl bg-[color:var(--color-bg-card)] border border-[color:var(--color-border)] overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--color-bg-card-hover)] transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4 text-[color:var(--color-text-muted)]" />
        <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
          Filtros de Áudio
        </span>

        {anyActive && (
          <div className="flex items-center gap-1 ml-1">
            {filter.enabled && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[color:var(--color-primary)] text-white">
                LP {formatFreq(filter.frequency)}
              </span>
            )}
            {highpassFilter.enabled && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                HP {formatFreq(highpassFilter.frequency)}
              </span>
            )}
          </div>
        )}

        <div className="ml-auto">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[color:var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[color:var(--color-text-muted)]" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[color:var(--color-border)]">
          {/* Low-pass */}
          <FilterSection
            title="Passa-Baixa"
            description="Permite apenas frequências abaixo do valor de corte, atenuando sons agudos. Útil para isolar vocalizações graves."
            color="var(--color-primary)"
            filter={filter}
            onChange={onFilterChange}
            presets={LOWPASS_PRESETS}
            min={100}
            max={20000}
            step={50}
            formatFreq={formatFreq}
          />

          <div className="border-t border-[color:var(--color-border)]" />

          {/* High-pass */}
          <FilterSection
            title="Passa-Alta"
            description="Permite apenas frequências acima do valor de corte, atenuando sons graves. Útil para remover ruído de fundo e vento."
            color="#f59e0b"
            filter={highpassFilter}
            onChange={onHighpassChange}
            presets={HIGHPASS_PRESETS}
            min={20}
            max={5000}
            step={10}
            formatFreq={formatFreq}
          />
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  description,
  color,
  filter,
  onChange,
  presets,
  min,
  max,
  step,
  formatFreq,
}: {
  title: string;
  description: string;
  color: string;
  filter: AudioFilterState;
  onChange: (update: Partial<AudioFilterState>) => void;
  presets: readonly { label: string; value: number; description: string }[];
  min: number;
  max: number;
  step: number;
  formatFreq: (hz: number) => string;
}) {
  return (
    <div className="space-y-3">
      {/* Title + toggle */}
      <div className="flex items-center justify-between pt-3">
        <span className="text-xs font-bold text-[color:var(--color-text-primary)] uppercase tracking-wider">
          {title}
        </span>
        <div
          role="switch"
          aria-checked={filter.enabled}
          tabIndex={0}
          onClick={() => onChange({ enabled: !filter.enabled })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange({ enabled: !filter.enabled });
            }
          }}
          className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
          style={{ backgroundColor: filter.enabled ? color : "#d1d5db" }}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              filter.enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </div>

      <p className="text-[11px] text-[color:var(--color-text-muted)] leading-relaxed">
        {description}
      </p>

      {/* Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[color:var(--color-text-secondary)]">
            Frequência de Corte
          </label>
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {formatFreq(filter.frequency)}
          </span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={filter.frequency}
          onChange={(e) => onChange({ frequency: Number(e.target.value) })}
          disabled={!filter.enabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
        />

        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[color:var(--color-text-muted)]">{formatFreq(min)}</span>
          <span className="text-[9px] text-[color:var(--color-text-muted)]">{formatFreq(max)}</span>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-xs font-semibold text-[color:var(--color-text-secondary)] mb-2">
          Presets
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => onChange({ frequency: p.value, enabled: true })}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                filter.enabled && filter.frequency === p.value
                  ? "text-white border-transparent"
                  : "bg-[color:var(--color-bg-card-hover)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border)] hover:border-[color:var(--color-border-hover)]"
              }`}
              style={
                filter.enabled && filter.frequency === p.value
                  ? { backgroundColor: color, borderColor: color }
                  : undefined
              }
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
