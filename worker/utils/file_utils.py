import re
from pathlib import Path
from typing import List, Optional
from zipfile import ZipFile

UPLOADS_DIR = Path("/app/uploads")
JOBS_DIR = UPLOADS_DIR / "jobs"

MAX_FILES = 1000
MAX_TOTAL_SIZE = 5_000_000_000  # 5GB

FILENAME_PATTERN = re.compile(r"record-(\d{4})_(\d{2})_(\d{2})_\d{2}_\d{2}_\d{2}\.wav")

def _validate_zip(zipf: ZipFile):
    infos = zipf.infolist()
    if len(infos) > MAX_FILES:
        raise ValueError(f"ZIP contains too many files (max: {MAX_FILES})")
    total_size = sum(i.file_size for i in infos)
    if total_size > MAX_TOTAL_SIZE:
        raise ValueError(f"ZIP size exceeds limit (max: {MAX_TOTAL_SIZE} bytes)")

def _audio_sort_key(name: str):
    match = FILENAME_PATTERN.search(name)
    if not match:
        raise ValueError(f"Invalid filename pattern: {name}")
    return tuple(map(int, match.groups()))

def extract_audio_files_from_zip(
    zip_path: str,
    job_id: str,
    extract_to: Optional[Path] = None
) -> List[str]:
    zip_path = Path(zip_path)
    if not zip_path.exists():
        raise FileNotFoundError(f"ZIP not found: {zip_path}")

    if extract_to is None:
        base_dir = JOBS_DIR / job_id
    else:
        base_dir = extract_to / job_id

    base_dir.mkdir(parents=True, exist_ok=True)

    extracted_files = []

    with ZipFile(zip_path) as zipf:
        _validate_zip(zipf)
        all_names = zipf.namelist()

        # Extrai CSVs
        csv_files = [name for name in all_names if name.lower().endswith(".csv")]
        for name in csv_files:
            filename = Path(name).name
            output_path = base_dir / filename
            with zipf.open(name) as source, open(output_path, "wb") as target:
                target.write(source.read())
            print(f"Extracted CSV: {filename}")

        # Extrai WAVs
        audio_files = [name for name in all_names if name.lower().endswith(".wav")]
        if not audio_files:
            raise ValueError("ZIP contains no WAV audio files")

        audio_files = sorted(audio_files, key=_audio_sort_key)
        print(f"Extracting {len(audio_files)} audio files...")
        for name in audio_files:
            filename = Path(name).name
            output_path = base_dir / filename
            with zipf.open(name) as source, open(output_path, "wb") as target:
                target.write(source.read())
            extracted_files.append(str(output_path))
            print(f"  Extracted: {filename}")

    print(f"{len(extracted_files)} audio files extracted to {base_dir}")
    return extracted_files

def find_csv_for_job(job_id: str) -> Optional[str]:
    job_dir = JOBS_DIR / job_id
    if not job_dir.exists():
        return None
    csv_files = list(job_dir.glob("*.csv"))
    return str(csv_files[0]) if csv_files else None