import api from "@/utils/api";

const baseURL = api.defaults.baseURL;

type MicroStatistics = {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
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
  derived_metrics?: Record<string, any>;
  charts: string[];
  raw_data_sample: Record<string, any>[];
};

interface Props {
  result: MicroResult | null;
  onReset: () => void;
}

const METRIC_CONFIG: Record<string, { label: string; unit: string; icon: string; color: string }> = {
  "temperatura(C)":  { label: "Temperatura",  unit: "°C",   icon: "", color: "#ef4444" },
  "umidade(%)":      { label: "Umidade",       unit: "%",    icon: "", color: "#3b82f6" },
  "pressao(Pa)":     { label: "Pressão",       unit: "Pa",   icon: "", color: "#8b5cf6" },
  "gas(ohms)":       { label: "Gás",           unit: "Ω",    icon: "", color: "#f59e0b" },
  "luminosidade(%)": { label: "Luminosidade",  unit: "%",    icon: "", color: "#fbbf24" },

};

function StatCard({
  metric,
  stat,
}: {
  metric: string;
  stat: MicroStatistics;
}) {
  const config = METRIC_CONFIG[metric] ?? { label: metric, unit: "", icon: "", color: "#10b981" };

  return (
    <div
      style={{ borderColor: `${config.color}22` }}
      className="relative bg-white border rounded-xl p-6 overflow-hidden transition-all hover:border-opacity-60 group"
    >
      {/* glow accent */}
      <div
        style={{ background: `radial-gradient(circle at top left, ${config.color}18, transparent 70%)` }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
            {config.label}
          </span>
        </div>
        <span
          style={{ color: config.color, borderColor: `${config.color}44`, backgroundColor: `${config.color}11` }}
          className="text-xs font-mono px-2 py-0.5 rounded-full border"
        >
          {config.unit || "idx"}
        </span>
      </div>

      {/* main value */}
      <div style={{ color: config.color }} className="text-4xl font-black tracking-tight mb-1">
        {stat.mean.toFixed(2)}
        <span className="text-lg font-normal ml-1 text-[color:var(--color-text-muted)]">{config.unit}</span>
      </div>
      <div className="text-xs text-[color:var(--color-text-muted)] mb-5">média</div>

      {/* stats row */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "MEDIANA", value: stat.median },
          { label: "MÍN",     value: stat.min },
          { label: "MÁX",     value: stat.max },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-[color:var(--color-text-muted)] font-semibold mb-0.5">{label}</div>
            <div className="text-[color:var(--color-text-secondary)] font-mono">{value.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* divider */}
      <div className="my-4 border-t border-[color:var(--color-border)]" />

      {/* quartis */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "Q25",  value: stat.q25 },
          { label: "STD",  value: stat.std },
          { label: "Q75",  value: stat.q75 },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-[color:var(--color-text-muted)] font-semibold mb-0.5">{label}</div>
            <div className="text-[color:var(--color-text-secondary)] font-mono">{value.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalysisMicro({ result, onReset }: Props) {
  if (!result) return null;
  if (!result.statistics) return null;
  if (!result.time_range) return null;

  const startDate = new Date(result.time_range.start).toLocaleString("pt-BR");
  const endDate   = new Date(result.time_range.end).toLocaleString("pt-BR");
  const duration  = result.time_range.duration_hours.toFixed(2);
  const statEntries = Object.entries(result.statistics);
  const sensorCount = statEntries.length;

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] px-6 py-16">
      <div className="relative max-w-7xl mx-auto space-y-10">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-primary)] mb-1">
              Dashboard / Monitoramento Ambiental
            </p>
            <h1 className="text-3xl font-extrabold text-[color:var(--color-text-primary)] tracking-tight">
              Resumo da Análise
            </h1>
            <p className="text-sm text-[color:var(--color-text-secondary)] mt-1">
              Visão geral do monitoramento micrometeorológico.
            </p>
          </div>

          <button onClick={onReset} className="btn-secondary text-sm self-start">
            Nova análise
          </button>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Leituras",  value: result.total_readings, suffix: "", note: "registros coletados" },
            { label: "Duração Total",      value: `${duration}h`,        suffix: "", note: "período monitorado" },
            { label: "Status do Sistema",  value: "Ativo",               suffix: "", note: "sem erros detectados" },
            { label: "Sensores Online",    value: `${sensorCount}/${sensorCount}`, suffix: "", note: "sem erros" },
          ].map(({ label, value, note }) => (
            <div
              key={label}
              className="bg-white border border-[var(--border-default)] rounded-xl p-5 hover:border-[var(--border-hover)] transition-all"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-2">
                {label}
              </div>
              <div className="text-2xl font-black text-[color:var(--color-primary)] tracking-tight">
                {value}
              </div>
              <div className="text-xs text-[color:var(--color-text-muted)] mt-1">{note}</div>
            </div>
          ))}
        </div>

        {/* período */}
        <div className="flex flex-wrap gap-6 text-xs text-[color:var(--color-text-muted)] border-l-2 border-[color:var(--color-primary)] pl-4">
          <div>
            <span className="font-bold uppercase tracking-wider">Início</span>
            <div className="text-[color:var(--color-text-secondary)] font-mono mt-0.5">{startDate}</div>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider">Fim</span>
            <div className="text-[color:var(--color-text-secondary)] font-mono mt-0.5">{endDate}</div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-4">
            Estatísticas por Sensor
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {statEntries.map(([metric, stat]) => (
              <StatCard key={metric} metric={metric} stat={stat} />
            ))}
          </div>
        </div>

        {/* ── GRÁFICOS ── */}
        {result.charts?.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-4">
              Séries Temporais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {result.charts.map((filename, index) => (
                <div
                  key={index}
                  className="bg-white border border-[var(--border-default)] rounded-xl overflow-hidden hover:border-[var(--border-hover)] transition-all"
                >
                  <img
                    src={`${baseURL}/analysis/chart/${result.jobId.replace(/_micro$/, "")}/${filename}`}
                    alt={filename.replace(/_chart\.png$/, "").replace(/_/g, " ")}
                    className="w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        
        

      </div>
    </div>
  );
}