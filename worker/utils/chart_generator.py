import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pathlib import Path

# ── Light theme for charts ──
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({
    'figure.facecolor': '#ffffff',
    'axes.facecolor':   '#f8fafb',
    'axes.edgecolor':   '#cbd5e1',
    'text.color':       '#1e293b',
    'axes.labelcolor':  '#334155',
    'xtick.color':      '#475569',
    'ytick.color':      '#475569',
    'grid.color':       '#e2e8f0',
    'grid.alpha':       0.8,
    'font.size':        11,
    'axes.titlesize':   15,
    'axes.labelsize':   12,
    'xtick.labelsize':  10,
    'ytick.labelsize':  10,
})

_PERIOD_LABELS = ['Madrugada', 'Manhã', 'Tarde', 'Noite']


def generate_time_series_charts(df: pd.DataFrame, output_dir: str) -> list[str]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    metrics_config = [
        {'column': 'temperatura(C)',  'title': 'Temperatura ao Longo do Tempo',         'ylabel': 'Temperatura (°C)',  'color': '#dc2626'},
        {'column': 'umidade(%)',      'title': 'Umidade Relativa ao Longo do Tempo',    'ylabel': 'Umidade (%)',       'color': '#2563eb'},
        {'column': 'pressao(Pa)',     'title': 'Pressão Atmosférica ao Longo do Tempo', 'ylabel': 'Pressão (Pa)',      'color': '#7c3aed'},
        {'column': 'gas(ohms)',       'title': 'Resistência do Sensor de Gás',          'ylabel': 'Resistência (Ω)',  'color': '#d97706'},
        {'column': 'luminosidade(%)', 'title': 'Luminosidade ao Longo do Tempo',        'ylabel': 'Luminosidade (%)', 'color': '#ca8a04'},
    ]

    filenames = []

    for config in metrics_config:
        column = config['column']
        if column not in df.columns:
            continue

        filename = f"{column.replace('(', '_').replace(')', '_').replace('%', 'pct')}_chart.png"
        filepath = output_path / filename

        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(df['timestamp'], df[column], color=config['color'], linewidth=2, alpha=0.85)
        ax.fill_between(df['timestamp'], df[column], alpha=0.08, color=config['color'])
        ax.set_title(config['title'], fontsize=15, fontweight='bold', color='#1e293b', pad=12)
        ax.set_xlabel('Timestamp', fontsize=11, color='#475569')
        ax.set_ylabel(config['ylabel'], fontsize=11, color='#475569')
        ax.grid(True, alpha=0.6, linewidth=0.5)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.tick_params(axis='x', rotation=45)
        for label in ax.get_xticklabels():
            label.set_ha('right')
        fig.tight_layout()
        fig.savefig(filepath, dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)

        filenames.append(filename)
        print(f"Grafico gerado: {filename}")

    return filenames


# ═══════════════════════════════════════════════════════════════════
#  Advanced Charts — derived metrics
# ═══════════════════════════════════════════════════════════════════

LABEL_MAP = {
    'temperatura(C)':  'Temperatura (°C)',
    'umidade(%)':      'Umidade (%)',
    'pressao(Pa)':     'Pressão (Pa)',
    'gas(ohms)':       'Gás (Ω)',
    'luminosidade(%)': 'Luminosidade (%)',
}


def generate_advanced_charts(df: pd.DataFrame, derived: dict, output_dir: str) -> list[str]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    filenames: list[str] = []

    if 'correlacao' in derived:
        fn = _chart_correlation_heatmap(derived['correlacao'], output_path)
        if fn: filenames.append(fn)

    if 'perfil_diurno' in derived:
        fn = _chart_diurnal_profile(derived['perfil_diurno'], output_path)
        if fn: filenames.append(fn)

    if 'medias_por_periodo' in derived:
        fn = _chart_boxplot_by_period(df, output_path)
        if fn: filenames.append(fn)

    if 'ponto_de_orvalho' in derived:
        fn = _chart_dewpoint_vs_temp(df, derived['ponto_de_orvalho'], output_path)
        if fn: filenames.append(fn)

    if 'vpd' in derived:
        fn = _chart_vpd_timeseries(df, derived['vpd'], output_path)
        if fn: filenames.append(fn)

    if 'luminosidade(%)' in df.columns and 'temperatura(C)' in df.columns:
        fn = _chart_light_temp_overlay(df, output_path)
        if fn: filenames.append(fn)

    if 'indice_de_calor' in derived:
        fn = _chart_heat_index(df, derived['indice_de_calor'], output_path)
        if fn: filenames.append(fn)

    return filenames


# ── Individual chart generators ──────────────────────────────────

def _chart_correlation_heatmap(corr_data: dict, out: Path) -> str | None:
    try:
        cols   = corr_data['columns']
        matrix = np.array(corr_data['matrix'])
        labels = [LABEL_MAP.get(c, c) for c in cols]

        fig, ax = plt.subplots(figsize=(6, 5))
        im = ax.imshow(matrix, cmap='RdBu_r', vmin=-1, vmax=1, aspect='auto')

        ax.set_xticks(range(len(labels)))
        ax.set_yticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=40, ha='right', fontsize=9)
        ax.set_yticklabels(labels, fontsize=9)

        for i in range(len(labels)):
            for j in range(len(labels)):
                val   = matrix[i, j]
                color = '#ffffff' if abs(val) > 0.5 else '#1e293b'
                ax.text(j, i, f'{val:.2f}', ha='center', va='center',
                        fontsize=10, fontweight='bold', color=color)

        fig.colorbar(im, ax=ax, shrink=0.8, label='Correlação')
        ax.set_title('Matriz de Correlação entre Variáveis', fontsize=15,
                     fontweight='bold', color='#1e293b', pad=12)
        fig.tight_layout()
        fig.savefig(out / 'correlacao_heatmap_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: correlacao_heatmap_chart.png")
        return 'correlacao_heatmap_chart.png'
    except Exception as e:
        print(f"Erro ao gerar heatmap de correlação: {e}")
        return None


def _chart_diurnal_profile(diurnal: dict, out: Path) -> str | None:
    try:
        hours = diurnal['hours']
        data  = diurnal['data']

        color_map = {
            'temperatura(C)':  '#dc2626',
            'umidade(%)':      '#2563eb',
            'luminosidade(%)': '#ca8a04',
        }

        fig, ax = plt.subplots(figsize=(12, 5))
        for col, values in data.items():
            label = LABEL_MAP.get(col, col)
            color = color_map.get(col, '#059669')
            ax.plot(hours, values, marker='o', markersize=4, linewidth=2.5,
                    label=label, color=color, alpha=0.9)

        ax.set_xticks(range(0, 24, 2))
        ax.set_xlabel('Hora do Dia', fontsize=11)
        ax.set_ylabel('Valor Médio', fontsize=11)
        ax.set_title('Perfil Diurno — Média por Hora do Dia', fontsize=15,
                     fontweight='bold', color='#1e293b', pad=12)
        ax.legend(fontsize=9, framealpha=0.9)
        ax.grid(True, alpha=0.6, linewidth=0.5)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        fig.tight_layout()
        fig.savefig(out / 'perfil_diurno_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: perfil_diurno_chart.png")
        return 'perfil_diurno_chart.png'
    except Exception as e:
        print(f"Erro ao gerar perfil diurno: {e}")
        return None


def _chart_boxplot_by_period(df: pd.DataFrame, out: Path) -> str | None:
    try:
        target_col = 'temperatura(C)'
        if target_col not in df.columns or 'periodo' not in df.columns:
            return None

        groups       = [df.loc[df['periodo'] == p, target_col].dropna().values for p in _PERIOD_LABELS]
        group_labels = [p for p, g in zip(_PERIOD_LABELS, groups) if len(g) > 0]
        groups       = [g for g in groups if len(g) > 0]

        if not groups:
            return None

        fig, ax = plt.subplots(figsize=(10, 5))
        bp = ax.boxplot(groups, labels=group_labels, patch_artist=True, widths=0.6)

        colors = ['#6366f1', '#f59e0b', '#dc2626', '#3b82f6']
        for patch, color in zip(bp['boxes'], colors[:len(groups)]):
            patch.set_facecolor(color)
            patch.set_alpha(0.3)
        for median in bp['medians']:
            median.set_color('#1e293b')
            median.set_linewidth(2)

        ax.set_title('Distribuição de Temperatura por Período do Dia', fontsize=15,
                     fontweight='bold', color='#1e293b', pad=12)
        ax.set_ylabel('Temperatura (°C)', fontsize=11)
        ax.grid(True, alpha=0.4, linewidth=0.5, axis='y')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        fig.tight_layout()
        fig.savefig(out / 'boxplot_periodo_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: boxplot_periodo_chart.png")
        return 'boxplot_periodo_chart.png'
    except Exception as e:
        print(f"Erro ao gerar boxplot por período: {e}")
        return None


def _chart_dewpoint_vs_temp(df: pd.DataFrame, dew_data: dict, out: Path) -> str | None:
    try:
        Td_series = dew_data['series']

        fig, ax1 = plt.subplots(figsize=(12, 5))
        ax1.plot(df['timestamp'], df['temperatura(C)'], color='#dc2626',
                 linewidth=2, alpha=0.85, label='Temperatura')
        ax1.plot(df['timestamp'], Td_series, color='#2563eb',
                 linewidth=2, alpha=0.85, linestyle='--', label='Ponto de Orvalho')

        T_arr      = df['temperatura(C)'].values
        Td_arr     = np.array(Td_series)
        close_mask = (T_arr - Td_arr) < 2.0
        if close_mask.any():
            ax1.fill_between(df['timestamp'], T_arr, Td_arr, where=close_mask,
                             alpha=0.15, color='#3b82f6', label='Zona de condensação')

        ax1.set_xlabel('Timestamp', fontsize=11)
        ax1.set_ylabel('Temperatura (°C)', fontsize=11)
        ax1.set_title('Temperatura vs Ponto de Orvalho', fontsize=15,
                      fontweight='bold', color='#1e293b', pad=12)
        ax1.legend(fontsize=9, loc='upper left', framealpha=0.9)
        ax1.grid(True, alpha=0.6, linewidth=0.5)
        ax1.spines['top'].set_visible(False)
        ax1.spines['right'].set_visible(False)
        ax1.tick_params(axis='x', rotation=45)
        for label in ax1.get_xticklabels():
            label.set_ha('right')
        fig.tight_layout()
        fig.savefig(out / 'ponto_orvalho_vs_temp_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: ponto_orvalho_vs_temp_chart.png")
        return 'ponto_orvalho_vs_temp_chart.png'
    except Exception as e:
        print(f"Erro ao gerar gráfico ponto de orvalho vs temperatura: {e}")
        return None


def _chart_vpd_timeseries(df: pd.DataFrame, vpd_data: dict, out: Path) -> str | None:
    try:
        vpd_series = vpd_data['series']

        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(df['timestamp'], vpd_series, color='#059669', linewidth=2, alpha=0.85)
        ax.fill_between(df['timestamp'], vpd_series, alpha=0.10, color='#059669')
        ax.axhline(y=0.8, color='#f59e0b', linestyle=':', linewidth=1, alpha=0.7, label='Estresse leve (0.8 hPa)')
        ax.axhline(y=1.6, color='#dc2626', linestyle=':', linewidth=1, alpha=0.7, label='Estresse severo (1.6 hPa)')
        ax.set_xlabel('Timestamp', fontsize=11)
        ax.set_ylabel('VPD (hPa)', fontsize=11)
        ax.set_title('Déficit de Pressão de Vapor (VPD)', fontsize=15,
                     fontweight='bold', color='#1e293b', pad=12)
        ax.legend(fontsize=9, loc='upper right', framealpha=0.9)
        ax.grid(True, alpha=0.6, linewidth=0.5)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.tick_params(axis='x', rotation=45)
        for label in ax.get_xticklabels():
            label.set_ha('right')
        fig.tight_layout()
        fig.savefig(out / 'vpd_timeseries_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: vpd_timeseries_chart.png")
        return 'vpd_timeseries_chart.png'
    except Exception as e:
        print(f"Erro ao gerar gráfico de VPD: {e}")
        return None


def _chart_light_temp_overlay(df: pd.DataFrame, out: Path) -> str | None:
    try:
        fig, ax1 = plt.subplots(figsize=(12, 5))

        ax1.plot(df['timestamp'], df['temperatura(C)'], color='#dc2626',
                 linewidth=2, alpha=0.8, label='Temperatura')
        ax1.set_ylabel('Temperatura (°C)', color='#dc2626', fontsize=11)
        ax1.tick_params(axis='y', labelcolor='#dc2626')

        ax2 = ax1.twinx()
        ax2.plot(df['timestamp'], df['luminosidade(%)'], color='#ca8a04',
                 linewidth=2, alpha=0.8, label='Luminosidade')
        ax2.fill_between(df['timestamp'], df['luminosidade(%)'], alpha=0.08, color='#ca8a04')
        ax2.set_ylabel('Luminosidade (%)', color='#ca8a04', fontsize=11)
        ax2.tick_params(axis='y', labelcolor='#ca8a04')

        ax1.set_xlabel('Timestamp', fontsize=11)
        ax1.set_title('Luminosidade + Temperatura Sobrepostos', fontsize=15,
                      fontweight='bold', color='#1e293b', pad=12)

        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax1.legend(lines1 + lines2, labels1 + labels2, fontsize=9,
                   loc='upper left', framealpha=0.9)

        ax1.grid(True, alpha=0.4, linewidth=0.5)
        ax1.spines['top'].set_visible(False)
        ax1.tick_params(axis='x', rotation=45)
        for label in ax1.get_xticklabels():
            label.set_ha('right')
        fig.tight_layout()
        fig.savefig(out / 'luminosidade_temperatura_overlay_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: luminosidade_temperatura_overlay_chart.png")
        return 'luminosidade_temperatura_overlay_chart.png'
    except Exception as e:
        print(f"Erro ao gerar gráfico luminosidade + temperatura: {e}")
        return None


def _chart_heat_index(df: pd.DataFrame, hi_data: dict, out: Path) -> str | None:
    try:
        hi_series = hi_data['series']

        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(df['timestamp'], df['temperatura(C)'], color='#94a3b8',
                linewidth=1.5, alpha=0.6, label='Temperatura Real')
        ax.plot(df['timestamp'], hi_series, color='#dc2626',
                linewidth=2, alpha=0.85, label='Índice de Calor')
        ax.fill_between(df['timestamp'], hi_series, df['temperatura(C)'],
                        alpha=0.10, color='#dc2626')
        ax.axhline(y=32, color='#f59e0b', linestyle=':', linewidth=1, alpha=0.6, label='Cautela (32°C)')
        ax.axhline(y=41, color='#dc2626', linestyle=':', linewidth=1, alpha=0.6, label='Perigo (41°C)')
        ax.set_xlabel('Timestamp', fontsize=11)
        ax.set_ylabel('Temperatura (°C)', fontsize=11)
        ax.set_title('Índice de Calor (Sensação Térmica)', fontsize=15,
                     fontweight='bold', color='#1e293b', pad=12)
        ax.legend(fontsize=9, loc='upper left', framealpha=0.9)
        ax.grid(True, alpha=0.6, linewidth=0.5)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.tick_params(axis='x', rotation=45)
        for label in ax.get_xticklabels():
            label.set_ha('right')
        fig.tight_layout()
        fig.savefig(out / 'indice_calor_chart.png', dpi=150, facecolor='#ffffff', edgecolor='none')
        plt.close(fig)
        print("Grafico gerado: indice_calor_chart.png")
        return 'indice_calor_chart.png'
    except Exception as e:
        print(f"Erro ao gerar gráfico de índice de calor: {e}")
        return None