"use client";

import { Activity, Loader2, AlertCircle, Gauge } from "lucide-react";

type MicroStatistics = {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
};

type DerivedMetric = {
  label: string;
  unit: string;
  mean: number;
  min: number;
  max: number;
  description?: string;
  series?: number[];
  per_day?: Record<string, number>;
};

type DiurnalProfile = {
  label: string;
  hours: number[];
  data: Record<string, number[]>;
};

type PeriodAverages = {
  label: string;
  periods: string[];
  data: Record<string, Record<string, number>>;
};

type CorrelationData = {
  label: string;
  columns: string[];
  matrix: number[][];
};

type DerivedMetrics = {
  ponto_de_orvalho?: DerivedMetric;
  vpd?: DerivedMetric;
  indice_de_calor?: DerivedMetric;
  amplitude_termica?: DerivedMetric & { per_day?: Record<string, number> };
  altitude_barometrica?: DerivedMetric;
  qualidade_ar?: DerivedMetric & { description?: string };
  perfil_diurno?: DiurnalProfile;
  correlacao?: CorrelationData;
  medias_por_periodo?: PeriodAverages;
};

type MicroResult = {
  jobId: string;
  status: string;
  total_readings: number;
  time_range: {
    start: string;
    end: string;
    duration_hours: number;
  };
  statistics: Record<string, MicroStatistics>;
  derived_metrics?: DerivedMetrics;
  charts: string[];
  raw_data_sample: Record<string, any>[];
};

const METRIC_CONFIG: Record<string, { label: string; unit: string; icon: string; color: string }> = {
  "temperatura(C)":  { label: "Temperatura",  unit: "°C",   icon: "", color: "#dc2626" },
  "umidade(%)":      { label: "Umidade",       unit: "%",    icon: "", color: "#2563eb" },
  "pressao(Pa)":     { label: "Pressão",       unit: "Pa",   icon: "", color: "#7c3aed" },
  "gas(ohms)":       { label: "Gás",           unit: "Ω",    icon: "", color: "#d97706" },
  "luminosidade(%)": { label: "Luminosidade",  unit: "%",    icon: "", color: "#ca8a04" },

};

interface DashboardMicroStatsProps {
  result: MicroResult | null;
  loading: boolean;
  error: string | null;
}

export function DashboardMicroStats({ result, loading, error }: DashboardMicroStatsProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-600">Erro na análise micrometeorológica</p>
          <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
        <div className="text-center">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Processando micrometeorologia
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Calculando estatísticas...
          </p>
        </div>
      </div>
    );
  }

  const statEntries = Object.entries(result.statistics);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-[var(--color-primary)]" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          Estatísticas dos Sensores
        </h2>
        <span className="text-[10px] text-[var(--text-muted)] font-mono ml-auto">
          {statEntries.length} variáveis
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {statEntries.map(([metric, stat]) => {
          const config = METRIC_CONFIG[metric] ?? {
            label: metric,
            unit: "",
            icon: "",
            color: "#059669",
          };

          return (
            <div
              key={metric}
              className="relative bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl p-4 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-hover)] transition-all overflow-hidden"
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                style={{ backgroundColor: config.color }}
              />

              {/* Header */}
              <div className="flex items-center justify-between mb-3 pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{config.icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {config.label}
                  </span>
                </div>
                <span
                  style={{ color: config.color, backgroundColor: `${config.color}10`, borderColor: `${config.color}30` }}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                >
                  {config.unit || "idx"}
                </span>
              </div>

              {/* Main value */}
              <div className="pl-2">
                <div style={{ color: config.color }} className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {stat.mean.toFixed(2)}
                  <span className="text-xs font-normal ml-1 text-[var(--text-muted)]">
                    {config.unit}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mb-3">média</div>

                {/* Min / Median / Max row */}
                <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-[var(--border-default)]">
                  {[
                    { label: "MÍN", value: stat.min },
                    { label: "MED", value: stat.median },
                    { label: "MÁX", value: stat.max },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[var(--text-muted)] font-semibold">{label}</div>
                      <div className="text-[var(--text-secondary)] font-mono font-medium">
                        {value.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Derived Metrics Section ── */}
      {result.derived_metrics && (
        <DerivedMetricsSection derived={result.derived_metrics} />
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Derived Metrics Sub-component
   ═══════════════════════════════════════════════════════════════ */

const DERIVED_CONFIG: Record<string, { icon: string; color: string }> = {
  ponto_de_orvalho:     { icon: "", color: "#2563eb" },
  vpd:                  { icon: "", color: "#059669" },
  indice_de_calor:      { icon: "", color: "#dc2626" },
  amplitude_termica:    { icon: "", color: "#7c3aed" },
  qualidade_ar:         { icon: "", color: "#0891b2" },
};

function DerivedMetricsSection({ derived }: { derived: DerivedMetrics }) {
  const scalarMetrics = [
    "ponto_de_orvalho",
    "vpd",
    "indice_de_calor",
    "amplitude_termica",
    "qualidade_ar",
  ] as const;

  const available = scalarMetrics.filter(
    (k) => derived[k] && typeof (derived[k] as DerivedMetric).mean === "number"
  );

  if (available.length === 0 && !derived.medias_por_periodo) return null;

  return (
    <div className="space-y-5 pt-3">
      {/* Divider + Header */}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-default)]">
        <Gauge className="w-4 h-4 text-[var(--color-primary)] mt-3" />
        <div className="mt-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Métricas Derivadas
          </h2>
          <p className="text-[10px] text-[var(--text-muted)]">
            calculadas a partir dos dados brutos
          </p>
        </div>
      </div>

      {/* Derived Metric cards */}
      {available.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {available.map((key) => {
            const metric = derived[key] as DerivedMetric;
            const cfg = DERIVED_CONFIG[key] ?? { icon: "📊", color: "#059669" };

            return (
              <div
                key={key}
                className="relative bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl p-4 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-hover)] transition-all overflow-hidden"
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                  style={{ backgroundColor: cfg.color }}
                />

                <div className="flex items-center justify-between mb-3 pl-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {metric.label}
                    </span>
                  </div>
                  <span
                    style={{
                      color: cfg.color,
                      backgroundColor: `${cfg.color}10`,
                      borderColor: `${cfg.color}30`,
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                  >
                    {metric.unit}
                  </span>
                </div>

                <div className="pl-2">
                  <div
                    style={{ color: cfg.color }}
                    className="text-2xl md:text-3xl font-extrabold tracking-tight"
                  >
                    {metric.mean.toFixed(2)}
                    <span className="text-xs font-normal ml-1 text-[var(--text-muted)]">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mb-3">
                    média
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-[var(--border-default)]">
                    <div>
                      <div className="text-[var(--text-muted)] font-semibold">MÍN</div>
                      <div className="text-[var(--text-secondary)] font-mono font-medium">
                        {metric.min.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)] font-semibold">MÁX</div>
                      <div className="text-[var(--text-secondary)] font-mono font-medium">
                        {metric.max.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {metric.description && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
                      {metric.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Period Averages Table */}
      {derived.medias_por_periodo && (
        <PeriodAveragesTable data={derived.medias_por_periodo} />
      )}
    </div>
  );
}

const PERIOD_ICONS: Record<string, string> = {
  Madrugada: "",
  Manhã: "",
  Tarde: "",
  Noite: "",
};

function PeriodAveragesTable({ data }: { data: PeriodAverages }) {
  const metrics = Object.keys(data.data);
  const periods = data.periods;

  if (metrics.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        
        <h3 className="text-xs font-bold text-[var(--text-primary)]">
          Médias por Período do Dia
        </h3>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[var(--bg-primary)]">
              <th className="text-left py-2.5 px-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                Variável
              </th>
              {periods.map((p) => (
                <th
                  key={p}
                  className="text-center py-2.5 px-3 text-[var(--text-muted)] font-semibold uppercase tracking-wider"
                >
                  <span className="block text-sm mb-0.5">{PERIOD_ICONS[p] ?? ""}</span>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, i) => {
              const cfg = METRIC_CONFIG[metric];
              return (
                <tr
                  key={metric}
                  className={`border-t border-[var(--border-default)] ${
                    i % 2 === 0 ? "bg-white" : "bg-[var(--bg-primary)]"
                  }`}
                >
                  <td className="py-2.5 px-3 font-medium text-[var(--text-secondary)]">
                    {cfg?.icon ?? "📊"} {cfg?.label ?? metric}
                  </td>
                  {periods.map((p) => (
                    <td key={p} className="text-center py-2.5 px-3 font-mono font-medium text-[var(--text-primary)]">
                      {data.data[metric]?.[p]?.toFixed(2) ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
