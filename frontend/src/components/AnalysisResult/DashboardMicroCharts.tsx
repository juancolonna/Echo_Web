"use client";

import { BarChart3, Loader2, AlertCircle } from "lucide-react";
import api from "@/utils/api";

const baseURL = api.defaults.baseURL;

/**
 * Friendly chart labels — maps chart filename patterns to readable titles.
 * Anything not matched falls back to sanitizing the filename.
 */
const CHART_LABELS: Record<string, string> = {
  // Time-series (existing)
  "temperatura_C__chart":                   "Temperatura ao Longo do Tempo",
  "umidade_pct__chart":                     "Umidade Relativa ao Longo do Tempo",
  "pressao_Pa__chart":                      "Pressão Atmosférica ao Longo do Tempo",
  "gas_ohms__chart":                        "Resistência do Sensor de Gás",
  "luminosidade_pct__chart":                "Luminosidade ao Longo do Tempo",
  // Advanced charts (new)
  "correlacao_heatmap_chart":               "Matriz de Correlação entre Variáveis",
  "perfil_diurno_chart":                    "Perfil Diurno — Média por Hora",
  "boxplot_periodo_chart":                  "Distribuição de Temperatura por Período",
  "ponto_orvalho_vs_temp_chart":            "Temperatura vs Ponto de Orvalho",
  "vpd_timeseries_chart":                   "Déficit de Pressão de Vapor (VPD)",
  "luminosidade_temperatura_overlay_chart": "Luminosidade + Temperatura Sobrepostos",
  "indice_calor_chart":                     "Índice de Calor (Sensação Térmica)",
};

/** Desired display order — charts listed here appear first, in this order */
const CHART_ORDER: string[] = [
  "correlacao_heatmap_chart.png",
];

function getChartLabel(filename: string): string {
  const key = filename.replace(/\.png$/, "");
  if (CHART_LABELS[key]) return CHART_LABELS[key];
  // Fallback: sanitize filename
  return key.replace(/_chart$/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sortCharts(filenames: string[]): string[] {
  const orderMap = new Map(CHART_ORDER.map((name, idx) => [name, idx]));
  return [...filenames].sort((a, b) => {
    const ia = orderMap.get(a) ?? 999;
    const ib = orderMap.get(b) ?? 999;
    return ia - ib;
  });
}

interface DashboardMicroChartsProps {
  jobId: string | null;
  charts: string[] | null;
  loading: boolean;
  error: string | null;
}

export function DashboardMicroCharts({
  jobId,
  charts,
  loading,
  error,
}: DashboardMicroChartsProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-xs text-red-600">Não foi possível carregar os gráficos</p>
      </div>
    );
  }

  if (loading || !charts || !jobId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
        <div className="text-center">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Gerando gráficos
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Séries temporais...
          </p>
        </div>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
        <BarChart3 className="w-5 h-5 text-[var(--text-muted)]" />
        <p className="text-xs text-[var(--text-muted)]">
          Nenhum gráfico disponível para esta análise
        </p>
      </div>
    );
  }

  // Strip _micro suffix — charts live in the base audio job directory
  const chartsJobId = jobId.replace(/_micro$/, "");

  // Sort so correlation comes first
  const sorted = sortCharts(charts);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          Gráficos de Micrometeorologia
        </h2>
        <span className="text-[10px] text-[var(--text-muted)] font-mono ml-auto">
          {charts.length} gráfico{charts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* All charts in 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((filename, index) => (
          <div
            key={index}
            className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl overflow-hidden hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-hover)] transition-all"
          >
            <div className="px-4 py-2.5 border-b border-[var(--border-default)] bg-white">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {getChartLabel(filename)}
              </p>
            </div>
            <img
              src={`${baseURL}/analysis/chart/${chartsJobId}/${filename}`}
              alt={getChartLabel(filename)}
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
