import numpy as np
from maad import features


def compute_acoustic_indices(
    Sxx,
    fn,
    flim_bioPh=(1000, 10000),     # mantido por compatibilidade
    flim_antroPh=(0, 1000),       # mantido por compatibilidade
    flim_BI=(2000, 15000),        # mantido por compatibilidade
    fmin_ADI=0,                   # mantido por compatibilidade
    fmax_ADI=20000,
    bin_step_ADI=1000,            # mantido por compatibilidade
    dB_threshold=-50,
    s=None,
):
    """
    V2: cálculo fiel ao pipeline original via maad.features,
    preservando assinatura antiga para não quebrar chamadas existentes.

    Retorna dicionário com:
      Hf, BI, NDSI, ADI, ACI
    e, se s for fornecido:
      Ht, M, H
    """
    Sxx = np.asarray(Sxx, dtype=np.float64)
    fn = np.asarray(fn, dtype=np.float64)

    # Mesmas funções do pipeline de referência
    _, _, ACI = features.acoustic_complexity_index(Sxx)
    NDSI, _, _, _ = features.soundscape_index(
        Sxx,
        fn,
        flim_bioPh=flim_bioPh,
        flim_antroPh=flim_antroPh,
    )
    ADI = features.acoustic_diversity_index(
        Sxx,
        fn,
        fmin=fmin_ADI,
        fmax=fmax_ADI,
        bin_step=bin_step_ADI,
        dB_threshold=dB_threshold,
    )
    BI = features.bioacoustics_index(Sxx, fn, flim=flim_BI)
    Hf, _ = features.frequency_entropy(Sxx)

    result = {
        "ACI": float(ACI),
        "NDSI": float(NDSI),
        "ADI": float(ADI),
        "BI": float(BI),
        "Hf": float(Hf),
    }

    if s is not None:
        s = np.asarray(s, dtype=np.float64)
        Ht = features.temporal_entropy(s)
        M = features.temporal_median(s)
        H = Hf * Ht
        result.update(
            {
                "Ht": float(Ht),
                "M": float(M),
                "H": float(H),
            }
        )

    return result