import json
import os
import time
from datetime import datetime
from pathlib import Path

import pandas as pd
import pika
import redis
from maad import features
from utils.file_utils import extract_audio_files_from_zip, find_csv_for_job

TMP_BASE  = Path("/app/tmp")
JOBS_BASE = Path("/app/uploads/jobs")

TOP_N = 20  # Número máximo de arquivos a processar por job, se houver ranking AR.

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)


def _calc_queue_wait_ms(job: dict, now_ms: float) -> float | None:
    """
    Wq = instante em que o coordenador desempacotou a mensagem − instante de enfileiramento.

    Recebe `now_ms` como parâmetro para garantir que a medição acontece no início
    do callback, antes de qualquer trabalho de coordenação.
    """
    enqueued_at = job.get("enqueuedAt")
    if not enqueued_at:
        return None
    try:
        normalized  = enqueued_at.replace("Z", "+00:00")
        enqueued_ts = datetime.fromisoformat(normalized).timestamp() * 1000  # ms
        return now_ms - enqueued_ts
    except Exception:
        return None


def _build_ar_ranking(audio_files: list[str], csv_path: str | None) -> list[dict]:
    csv_lookup: dict[str, dict] = {}
    if csv_path:
        try:
            df = pd.read_csv(csv_path)
            if {'audio', 'median', 'entropy'}.issubset(df.columns):
                for _, row in df.iterrows():
                    stem = Path(str(row['audio'])).name
                    csv_lookup[stem] = {
                        'ht': float(row['entropy']),
                        'm':  float(row['median']),
                    }
                print(f"[COORD] CSV loaded — {len(csv_lookup)} entries for AR pre-ranking")
            else:
                print("[COORD] Warning: CSV missing required columns — skipping AR pre-ranking")
        except Exception as e:
            print(f"[COORD] Warning: could not read CSV for AR pre-ranking: {e}")

    entries_with_data: list[dict] = []
    entries_no_data:   list[dict] = []

    for filepath in audio_files:
        stem  = Path(filepath).stem
        entry = {
            'filename': Path(filepath).name,
            'filepath': filepath,
            'ht':       None,
            'm':        None,
            'ar':       0.0,
        }
        if stem in csv_lookup:
            entry['ht'] = csv_lookup[stem]['ht']
            entry['m']  = csv_lookup[stem]['m']
            entries_with_data.append(entry)
        else:
            entries_no_data.append(entry)

    if entries_with_data:
        ht_list = [e['ht'] for e in entries_with_data]
        m_list  = [e['m']  for e in entries_with_data]
        ar_list = features.acoustic_richness_index(ht_list, m_list)
        for entry, ar in zip(entries_with_data, ar_list):
            entry['ar'] = float(ar)
        entries_with_data.sort(key=lambda x: x['ar'], reverse=True)
        print(f"[COORD] AR pre-ranking complete — "
              f"AR range: {entries_with_data[-1]['ar']:.4f} – {entries_with_data[0]['ar']:.4f}")

    return entries_with_data + entries_no_data


def callback(ch, method, properties, body):
    job = None
    try:
        job    = json.loads(body)
        job_id = job.get("jobId")
        if not job_id:
            raise ValueError("Missing jobId")

        if method.routing_key == "batch-jobs":
            handle_batch_job(ch, job)
        elif method.routing_key == "compute-all-jobs":
            handle_compute_all_job(ch, job)
        else:
            print(f"Warning: unexpected queue {method.routing_key}, ignoring")

        print(f"[COORD] Job {job_id} distributed successfully")

    except Exception as e:
        print(f"[COORD] Error processing job: {e}")
        error_result = {
            "jobId":  job.get("jobId") if job else "unknown",
            "status": "failed",
            "error":  str(e),
        }
        ch.basic_publish(
            exchange='',
            routing_key='analysis-results',
            body=json.dumps(error_result),
            properties=pika.BasicProperties(delivery_mode=2),
        )
    finally:
        ch.basic_ack(delivery_tag=method.delivery_tag)


def handle_batch_job(ch, job):
    job_id     = job["jobId"]
    audio_path = job["audioPath"]

    coord_start_ms = time.time() * 1000
    queue_wait_ms  = _calc_queue_wait_ms(job, coord_start_ms)
    # ─────────────────────────────────────────────────────────────────────────

    print(f"\n[BATCH COORD] Processing job {job_id}")
    print(f"Archive: {audio_path}")

    audio_files = extract_audio_files_from_zip(audio_path, job_id, extract_to=None)
    total_files = len(audio_files)

    if os.path.exists(audio_path):
        os.remove(audio_path)
        print(f"[COORD] Removed archive: {audio_path}")

    csv_path   = find_csv_for_job(job_id)
    ar_ranking = _build_ar_ranking(audio_files, csv_path)

    has_ranking = any(e['ht'] is not None for e in ar_ranking)
    #top_n       = min(total_files, total_files) if has_ranking else total_files
    top_n       = min(TOP_N, total_files) if has_ranking else total_files
    top_files   = ar_ranking[:top_n]

    if has_ranking:
        print(f"[COORD] Dispatching top {top_n}/{total_files} files")
    else:
        print(f"[COORD] No CSV data — falling back to full processing ({total_files} files)")

    pipe = redis_client.pipeline()
    pipe.set(f"job:{job_id}:total",   top_n,                  ex=600)
    pipe.set(f"job:{job_id}:count",   0,                      ex=600)
    pipe.set(f"job:{job_id}:ar_all",  json.dumps(ar_ranking), ex=600)
    if queue_wait_ms is not None:
        pipe.set(f"job:{job_id}:queue_wait_ms", queue_wait_ms, ex=600)
    pipe.execute()

    ch.basic_publish(
        exchange='',
        routing_key='analysis-results',
        body=json.dumps({
            "jobId":            job_id,
            "status":           "processing",
            "type":             "batch_started",
            "total_files":      total_files,
            "files_to_compute": top_n,
        }),
        properties=pika.BasicProperties(delivery_mode=2),
    )

    for idx, entry in enumerate(top_files):
        ch.basic_publish(
            exchange='',
            routing_key='audio-jobs',
            body=json.dumps({
                "jobId":            job_id,
                "index":            idx,
                "audioPath":        entry["filepath"],
                "originalFilename": entry["filename"],
                "ar":               entry["ar"],
            }),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        print(f"  Published audio {idx+1}/{top_n}: {entry['filename']} (AR={entry['ar']:.4f})")

    # S medido após o último dispatch — coordenador livre a partir daqui.
    coordinator_setup_ms = time.time() * 1000 - coord_start_ms
    redis_client.set(f"job:{job_id}:coordinator_setup_ms", coordinator_setup_ms, ex=600)

    print(f"[COORD] Job {job_id} — {top_n} sub-jobs dispatched, coordinator free. "
          f"(Wq={queue_wait_ms:.0f} ms, S={coordinator_setup_ms:.0f} ms)")


def handle_compute_all_job(ch, job):
    """
    Recebe a lista de arquivos sem índices computados e os despacha para audio-jobs
    sob o fullJobId ({originalJobId}_full).
    """
    original_job_id = job["jobId"]
    full_job_id     = job["fullJobId"]
    files           = job["files"]   # [{filepath, filename, ar}]
    total           = len(files)

    print(f"\n[COMPUTE-ALL COORD] Job {full_job_id} — {total} files to compute")

    pipe = redis_client.pipeline()
    pipe.set(f"job:{full_job_id}:total",            total,           ex=3600)
    pipe.set(f"job:{full_job_id}:count",            0,               ex=3600)
    pipe.set(f"job:{full_job_id}:original_job_id",  original_job_id, ex=3600)
    pipe.execute()

    ch.basic_publish(
        exchange='',
        routing_key='analysis-results',
        body=json.dumps({
            "jobId":            full_job_id,
            "status":           "processing",
            "type":             "compute_all_started",
            "files_to_compute": total,
        }),
        properties=pika.BasicProperties(delivery_mode=2),
    )

    for idx, entry in enumerate(files):
        ch.basic_publish(
            exchange='',
            routing_key='audio-jobs',
            body=json.dumps({
                "jobId":            full_job_id,
                "index":            idx,
                "audioPath":        entry["filepath"],
                "originalFilename": entry["filename"],
                "ar":               entry["ar"],
            }),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        print(f"  Published audio {idx+1}/{total}: {entry['filename']} (AR={entry['ar']:.4f})")

    print(f"[COMPUTE-ALL COORD] {full_job_id} — {total} sub-jobs dispatched.")