import os
import time
from typing import List, Dict, Optional
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from maad import sound, features
from utils.indice_calculator import compute_acoustic_indices

def safe_float(value, default=0.0):
    """Convert values to float safely."""
    try:
        if isinstance(value, (tuple, list, np.ndarray)):
            return float(value[0]) if len(value) > 0 else default
        return float(value)
    except (TypeError, ValueError, IndexError):
        return default


def process_single_audio(audio_path: str) -> Optional[Dict]:
    """Process a single audio file in parallel."""
    if not os.path.exists(audio_path):
        return None

    try:
        # Pipeline fiel ao original
        s, fs = sound.load(audio_path, detrend=True)

        if s.ndim > 1:
            s = np.mean(s, axis=1)

        s = s.astype(np.float64)
        Sxx_power, tn, fn, ext = sound.spectrogram(s, fs, nperseg=2048)

        # ✅ V2 acoplada: um único cálculo centralizado
        idx = compute_acoustic_indices(
            Sxx_power,
            fn,
            s=s,
            flim_bioPh=(1000, 10000),
            flim_antroPh=(0, 1000),
            flim_BI=(2000, 15000),
            fmin_ADI=0,
            fmax_ADI=10000,   # igual ao seu original_indices
            bin_step_ADI=1000,
            dB_threshold=-47, # igual ao seu original_indices
        )

        return {
            "filename": os.path.basename(audio_path),
            "filepath": audio_path,
            "duration_seconds": float(len(s) / fs),
            "sample_rate": int(fs),
            "num_samples": int(len(s)),
            # mesmo formato de retorno atual:
            "Ht": float(idx["Ht"]),
            "M": float(idx["M"]),
            "ACI": float(idx["ACI"]),
            "NDSI": float(idx["NDSI"]),
            "BI": float(idx["BI"]),
            "ADI": float(idx["ADI"]),
            "Hf": float(idx["Hf"]),
            "H": float(idx["H"]),
        }

    except Exception as e:
        print(f"Error processing {audio_path}: {e}")
        return None


def generate_spectrogram_image(Sxx, tn, fn, audio_path: str) -> dict:
    """Generate clean spectrogram image (no axes) + metadata for frontend rendering."""
    audio_dir = Path(audio_path).parent
    filename = Path(audio_path).stem
    output_path = audio_dir / f"{filename}_spectrogram.png"

    Sxx_db = 10 * np.log10(Sxx + 1e-10)
    vmin = float(np.percentile(Sxx_db, 5))
    vmax = float(np.percentile(Sxx_db, 95))

    fig = plt.figure(figsize=(14, 4), dpi=100)
    ax = plt.Axes(fig, [0, 0, 1, 1])
    fig.add_axes(ax)

    ax.imshow(
        Sxx_db,
        aspect='auto',
        origin='lower',
        cmap='viridis',
        extent=[tn[0], tn[-1], fn[0], fn[-1]],
        vmin=vmin,
        vmax=vmax
    )

    ax.set_axis_off()
    plt.savefig(output_path, dpi=100, bbox_inches=None, pad_inches=0, facecolor='#0a0a0f')
    plt.close(fig)

    return {
        "path": str(output_path),
        "vmin_db": round(vmin, 1),
        "vmax_db": round(vmax, 1),
    }