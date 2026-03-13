import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from utils.chart_generator import generate_time_series_charts, generate_advanced_charts
from metpy.calc import heat_index
from metpy.units import units as munits

_PERIOD_LABELS = ['Madrugada', 'Manhã', 'Tarde', 'Noite']


def _attach_periodo(df: pd.DataFrame) -> None:
    """Adiciona coluna 'periodo' ao df in-place, baseada na hora do timestamp."""
    hour = df['timestamp'].dt.hour
    conditions = [
        (hour >= 0)  & (hour < 6),
        (hour >= 6)  & (hour < 12),
        (hour >= 12) & (hour < 18),
        (hour >= 18) & (hour < 24),
    ]
    df['periodo'] = np.select(conditions, _PERIOD_LABELS, default='Desconhecido')


def analyze_micro_data(csv_path: str, job_id: str, charts_dir: str | None = None) -> dict:
    print(f"Analisando dados micro: {csv_path}")

    try:
        df = pd.read_csv(csv_path)

        if 'timestamp' not in df.columns:
            raise ValueError("Coluna 'timestamp' nao encontrada no CSV")

        df['timestamp'] = pd.to_datetime(
            df['timestamp'],
            format="%Y_%m_%d_%H_%M_%S",
            errors="raise"
        )

        # ── Mudança 4: periodo calculado uma única vez aqui ──
        _attach_periodo(df)

        stats = calculate_statistics(df)
        derived = calculate_derived_metrics(df)

        actual_charts_dir = Path(charts_dir) if charts_dir else Path(f'/app/uploads/jobs/{job_id}')
        actual_charts_dir.mkdir(parents=True, exist_ok=True)

        # ── Mudança 3: gráficos gerados em paralelo ──
        with ThreadPoolExecutor(max_workers=2) as ex:
            f_ts  = ex.submit(generate_time_series_charts, df, str(actual_charts_dir))
            f_adv = ex.submit(generate_advanced_charts,    df, derived, str(actual_charts_dir))
            chart_filenames = f_ts.result() + f_adv.result()

        sample_df = df.head(10).copy()
        sample_df['timestamp'] = sample_df['timestamp'].dt.strftime("%Y-%m-%dT%H:%M:%S")

        result = {
            'jobId': job_id,
            'type': 'micro',
            'status': 'completed',
            'total_readings': len(df),
            'time_range': {
                'start': df['timestamp'].min().isoformat(),
                'end':   df['timestamp'].max().isoformat(),
                'duration_hours': (
                    df['timestamp'].max() - df['timestamp'].min()
                ).total_seconds() / 3600,
            },
            'statistics':      stats,
            'derived_metrics': derived,
            'charts':          chart_filenames,
            'raw_data_sample': sample_df.to_dict('records'),
        }

        print(f"Analise micro concluida: {len(df)} leituras")
        return result

    except Exception as e:
        print(f"Erro na analise micro: {str(e)}")
        raise


def calculate_statistics(df: pd.DataFrame) -> dict:
    metrics = [
        'temperatura(C)', 'umidade(%)', 'pressao(Pa)',
        'gas(ohms)', 'luminosidade(%)'
    ]

    stats = {}

    for metric in metrics:
        if metric in df.columns:
            stats[metric] = {
                'mean':   float(df[metric].mean()),
                'median': float(df[metric].median()),
                'std':    float(df[metric].std()),
                'min':    float(df[metric].min()),
                'max':    float(df[metric].max()),
                'q25':    float(df[metric].quantile(0.25)),
                'q75':    float(df[metric].quantile(0.75)),
            }

    return stats


def calculate_derived_metrics(df: pd.DataFrame) -> dict:
    """Calculate derived micrometeorological metrics from raw sensor data."""
    derived: dict = {}
    has_temp = 'temperatura(C)' in df.columns
    has_hum  = 'umidade(%)'     in df.columns

    T  = df['temperatura(C)'] if has_temp else None
    RH = df['umidade(%)']     if has_hum  else None

    # ── Ponto de Orvalho ──
    if has_temp and has_hum:
        a, b = 17.62, 243.12
        RH_clip = np.clip(RH, 1e-6, 100)
        alpha = (a * T) / (b + T) + np.log(RH_clip / 100.0)
        Td = (b * alpha) / (a - alpha)
        derived['ponto_de_orvalho'] = {
            'label':  'Ponto de Orvalho',
            'unit':   '°C',
            'mean':   round(float(Td.mean()), 2),
            'min':    round(float(Td.min()),  2),
            'max':    round(float(Td.max()),  2),
            # ── Mudança 5: round vetorizado ──
            'series': np.round(Td.values, 2).tolist(),
        }

    # ── Déficit de Pressão de Vapor (VPD) ──
    if has_temp and has_hum:
        es  = 6.112 * np.exp((17.62 * T) / (T + 243.12))
        ea  = es * (RH / 100.0)
        VPD = es - ea
        derived['vpd'] = {
            'label':  'Déficit de Pressão de Vapor',
            'unit':   'hPa',
            'mean':   round(float(VPD.mean()), 4),
            'min':    round(float(VPD.min()),  4),
            'max':    round(float(VPD.max()),  4),
            # ── Mudança 5: round vetorizado ──
            'series': np.round(VPD.values, 4).tolist(),
        }

    # ── Índice de Calor (Heat Index) ──
    if has_temp and has_hum:
        T_metpy  = T.values  * munits.degC
        RH_metpy = RH.values * munits.percent

        hi_metpy = heat_index(T_metpy, RH_metpy, mask_undefined=True)
        hi_series = pd.Series(hi_metpy.to('degC').magnitude)
        hi_series = hi_series.fillna(T.reset_index(drop=True))

        # ── Mudança 5: round vetorizado ──
        hi_vals   = np.round(hi_series.values, 2)
        hi_series = pd.Series(hi_vals)

        derived['indice_de_calor'] = {
            'label':  'Índice de Calor',
            'unit':   '°C',
            'mean':   round(float(hi_series.mean()), 2),
            'min':    round(float(hi_series.min()),  2),
            'max':    round(float(hi_series.max()),  2),
            'series': hi_vals.tolist(),
        }

    # ── Amplitude Térmica por dia ──
    if has_temp and 'timestamp' in df.columns:
        daily = df.groupby(df['timestamp'].dt.date)['temperatura(C)'].agg(['min', 'max'])
        daily['amplitude'] = daily['max'] - daily['min']
        derived['amplitude_termica'] = {
            'label': 'Amplitude Térmica Diária',
            'unit':  '°C',
            'mean':  round(float(daily['amplitude'].mean()), 2),
            'min':   round(float(daily['amplitude'].min()),  2),
            'max':   round(float(daily['amplitude'].max()),  2),
            'per_day': {str(k): round(float(v), 2) for k, v in daily['amplitude'].items()},
        }

    # ── Perfil Diurno (média por hora) ──
    if 'timestamp' in df.columns:
        diurnal_metrics = ['temperatura(C)', 'umidade(%)', 'luminosidade(%)']
        available = [m for m in diurnal_metrics if m in df.columns]
        if available:
            hourly = df.groupby(df['timestamp'].dt.hour)[available].mean()
            derived['perfil_diurno'] = {
                'label': 'Perfil Diurno (média por hora)',
                'hours': list(range(24)),
                'data': {
                    col: [round(float(hourly[col].get(h, 0)), 2) for h in range(24)]
                    for col in available
                },
            }

    # ── Matriz de Correlação ──
    corr_cols = [c for c in ['temperatura(C)', 'umidade(%)', 'pressao(Pa)',
                              'gas(ohms)', 'luminosidade(%)'] if c in df.columns]
    if len(corr_cols) >= 2:
        corr = df[corr_cols].corr()
        derived['correlacao'] = {
            'label':   'Matriz de Correlação',
            'columns': corr_cols,
            'matrix':  [[round(float(corr.iloc[i, j]), 3) for j in range(len(corr_cols))]
                         for i in range(len(corr_cols))],
        }

    # ── Médias por Período do Dia ──
    # ── Mudança 4: usa df['periodo'] já calculado em _attach_periodo, sem df.copy() ──
    if 'periodo' in df.columns:
        period_metrics = [c for c in ['temperatura(C)', 'umidade(%)', 'pressao(Pa)',
                                       'gas(ohms)', 'luminosidade(%)'] if c in df.columns]
        if period_metrics:
            period_stats = df.groupby('periodo')[period_metrics].mean()
            derived['medias_por_periodo'] = {
                'label':   'Médias por Período do Dia',
                'periods': _PERIOD_LABELS,
                'data': {
                    col: {p: round(float(period_stats.loc[p, col]), 2)
                          for p in _PERIOD_LABELS if p in period_stats.index}
                    for col in period_metrics
                },
            }

    return derived