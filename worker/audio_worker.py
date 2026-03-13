import json
import os
import shutil
import redis
import pika
from pathlib import Path
from services.audio_analysis import process_single_audio
from messaging.connection import connect_rabbitmq

TMP_BASE  = Path("/app/tmp")
JOBS_BASE = Path("/app/uploads/jobs")

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

# ── Modo benchmark ────────────────────────────────────────────────────────────
# Quando BENCHMARK_MODE=true, o diretório de áudios do job é removido imediatamente
# após a publicação do resultado, e os TTLs do Redis são reduzidos.
# Em produção (padrão), nada muda: os arquivos permanecem para o usuário acessar
# e os TTLs longos garantem a consistência do fluxo _full.
BENCHMARK_MODE = os.getenv("BENCHMARK_MODE", "false").lower() == "true"

# TTL do resultado completo no Redis:
#   produção → 3600s (1h) — usado pelo _full aggregator e cliente
#   benchmark → 5 minutos        — suficiente para o poll do benchmark receber o resultado
_COMPLETE_RESULT_TTL = 300 if BENCHMARK_MODE else 3600

if BENCHMARK_MODE:
    print("[AUDIO WORKER] BENCHMARK_MODE ativo — arquivos de job removidos após conclusão, TTLs reduzidos.")
# ─────────────────────────────────────────────────────────────────────────────


def _cleanup_job_dir(job_id: str) -> None:
    """Remove o diretório de áudios extraídos do job. Chamado apenas em BENCHMARK_MODE."""
    # job_id pode ser "{uuid}_full" — usa o uuid base para localizar o diretório
    base_id  = job_id.replace("_full", "")
    job_dir  = JOBS_BASE / base_id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)
        print(f"[AUDIO WORKER] [benchmark] Diretório removido: {job_dir}")


# ── Aggregator para jobs normais (top_n) ─────────────────────────────────────

def _aggregate_and_publish(job_id: str, top_n: int, ch) -> None:
    """
    Coleta top_n resultados, cruza com ar_all, monta payload final e publica.

    Métricas de tempo no payload (modelo M/M/c — Opção 1):
      queue_wait_time_ms   — Wq: tempo que o job esperou na fila batch-jobs
                             até o coordenador ficar livre.
      service_time_ms      — S: tempo que o coordenador ficou bloqueado
                             (= coordinator_setup_ms). É o S do modelo M/M/c.
      coordinator_setup_ms — mesmo valor de S, nomeado explicitamente para
                             clareza na seção experimental.

    Os audio workers processam de forma assíncrona e NÃO entram em S;
    o coordenador já estava livre para o próximo job enquanto eles rodavam.
    """
    keys  = [f"job:{job_id}:result:{idx}" for idx in range(top_n)]
    raws  = redis_client.mget(keys)

    computed: dict[int, dict] = {}
    for idx, raw in enumerate(raws):
        if raw is not None:
            computed[idx] = json.loads(raw)["data"]

    ar_all_raw = redis_client.get(f"job:{job_id}:ar_all")
    if ar_all_raw is None:
        raise Exception(f"ar_all key missing for job {job_id}")
    ar_ranking: list[dict] = json.loads(ar_all_raw)

    final_results: list[dict] = []
    for rank_idx, entry in enumerate(ar_ranking):
        if rank_idx < top_n and rank_idx in computed:
            data = computed[rank_idx]
            data["acoustic_richness"] = entry["ar"]
            data["indices_computed"]  = True
        else:
            data = {
                "filename":          entry["filename"],
                "filepath":          entry["filepath"],
                "Ht":                entry.get("ht") or 0.0,
                "M":                 entry.get("m")  or 0.0,
                "acoustic_richness": entry["ar"],
                "indices_computed":  False,
            }
        final_results.append(data)

    all_ar   = [e["ar"] for e in ar_ranking]
    top_dur  = sum(r.get("duration_seconds", 0.0) for r in final_results if r.get("indices_computed"))

    summary = {
        "total_files":          len(ar_ranking),
        "total_files_computed": top_n,
        "total_duration":       top_dur,
        "ar_range": {
            "min":  all_ar[-1],
            "max":  all_ar[0],
            "mean": sum(all_ar) / len(all_ar),
        },
    }

    # ── Recupera métricas de tempo gravadas pelo coordenador ──────────────────
    queue_wait_raw        = redis_client.get(f"job:{job_id}:queue_wait_ms")
    coordinator_setup_raw = redis_client.get(f"job:{job_id}:coordinator_setup_ms")
    # ─────────────────────────────────────────────────────────────────────────

    final_result = {
        "jobId":   job_id,
        "status":  "completed",
        "type":    "batch_complete",
        "results": final_results,
        "summary": summary,
    }
    if queue_wait_raw is not None:
        final_result["queue_wait_time_ms"] = float(queue_wait_raw)
    if coordinator_setup_raw is not None:
        final_result["service_time_ms"]      = float(coordinator_setup_raw)
        final_result["coordinator_setup_ms"] = float(coordinator_setup_raw)

    ch.basic_publish(
        exchange='',
        routing_key='analysis-results',
        body=json.dumps(final_result),
        properties=pika.BasicProperties(delivery_mode=2),
    )
    print(f"[AUDIO WORKER] Job {job_id} aggregated and published "
          f"({top_n} computed / {len(ar_ranking)} total).")

    # Persiste resultado completo — TTL reduzido em BENCHMARK_MODE
    redis_client.set(
        f"job:{job_id}:complete_result",
        json.dumps(final_result),
        ex=_COMPLETE_RESULT_TTL,
    )

    # Limpeza das chaves de controle
    keys_to_delete = [
        f"job:{job_id}:total",
        f"job:{job_id}:count",
        f"job:{job_id}:queue_wait_ms",
        f"job:{job_id}:coordinator_setup_ms",
        f"job:{job_id}:ar_all",
    ] + [f"job:{job_id}:result:{i}" for i in range(top_n)]
    redis_client.delete(*keys_to_delete)

    # ── Limpeza de disco em BENCHMARK_MODE ────────────────────────────────────
    # Removido após publicação e persistência no Redis — os tempos já foram
    # registrados, o resultado já está na fila analysis-results e no Redis.
    # Em produção isso não acontece: os arquivos ficam para servir áudio e
    # espectrogramas ao usuário.
    if BENCHMARK_MODE:
        _cleanup_job_dir(job_id)
    # ─────────────────────────────────────────────────────────────────────────


# ── Aggregator para jobs _full (compute-all) ──────────────────────────────────

def _aggregate_and_publish_full(full_job_id: str, total: int, ch) -> None:
    """
    Coleta os 'total' novos resultados computados, recupera o batch_complete original
    e publica um batch_enriched com todos os arquivos tendo indices_computed=True.
    """
    original_job_id = redis_client.get(f"job:{full_job_id}:original_job_id")
    if not original_job_id:
        raise Exception(f"original_job_id missing for {full_job_id}")

    keys = [f"job:{full_job_id}:result:{idx}" for idx in range(total)]
    raws = redis_client.mget(keys)

    new_computed: dict[int, dict] = {}
    for idx, raw in enumerate(raws):
        if raw is not None:
            new_computed[idx] = json.loads(raw)["data"]

    original_raw = redis_client.get(f"job:{original_job_id}:complete_result")
    if not original_raw:
        raise Exception(
            f"complete_result not found for {original_job_id}. "
            "O resultado original pode ter expirado (TTL 1h)."
        )
    original_result: dict = json.loads(original_raw)

    enriched: list[dict] = []
    new_idx = 0
    for entry in original_result["results"]:
        if not entry.get("indices_computed", True):
            if new_idx in new_computed:
                data = new_computed[new_idx]
                data["acoustic_richness"] = entry["acoustic_richness"]
                data["indices_computed"]  = True
                enriched.append(data)
                new_idx += 1
            else:
                enriched.append(entry)
        else:
            enriched.append(entry)

    enriched.sort(key=lambda x: x["acoustic_richness"], reverse=True)

    all_ar   = [r["acoustic_richness"] for r in enriched]
    tot_dur  = sum(r.get("duration_seconds", 0.0) for r in enriched)

    summary = {
        "total_files":          len(enriched),
        "total_files_computed": len(enriched),
        "total_duration":       tot_dur,
        "ar_range": {
            "min":  all_ar[-1],
            "max":  all_ar[0],
            "mean": sum(all_ar) / len(all_ar),
        },
    }

    final_result = {
        "jobId":   full_job_id,
        "status":  "completed",
        "type":    "batch_enriched",
        "results": enriched,
        "summary": summary,
    }

    ch.basic_publish(
        exchange='',
        routing_key='analysis-results',
        body=json.dumps(final_result),
        properties=pika.BasicProperties(delivery_mode=2),
    )
    print(f"[AUDIO WORKER] {full_job_id} enriched and published ({len(enriched)} total).")

    keys_to_delete = [
        f"job:{full_job_id}:total",
        f"job:{full_job_id}:count",
        f"job:{full_job_id}:original_job_id",
        f"job:{original_job_id}:complete_result",
    ] + [f"job:{full_job_id}:result:{i}" for i in range(total)]
    redis_client.delete(*keys_to_delete)

    # ── Limpeza de disco em BENCHMARK_MODE ────────────────────────────────────
    if BENCHMARK_MODE:
        _cleanup_job_dir(full_job_id)  # remove /app/uploads/jobs/{original_uuid}/
    # ─────────────────────────────────────────────────────────────────────────


# ── Callback principal ────────────────────────────────────────────────────────

def callback(ch, method, properties, body):
    job        = json.loads(body)
    job_id     = job["jobId"]
    idx        = job["index"]
    audio_path = job["audioPath"]
    ar         = job.get("ar", 0.0)

    print(f"[AUDIO WORKER] Processing job {job_id}, audio {idx}: {os.path.basename(audio_path)}")

    result = process_single_audio(audio_path)
    if result is None:
        result = {
            "filename":          os.path.basename(audio_path),
            "filepath":          audio_path,
            "duration_seconds":  0.0,
            "sample_rate":       0,
            "num_samples":       0,
            "Ht":                0.0,
            "M":                 0.0,
            "ACI":               0.0,
            "NDSI":              0.0,
            "BI":                0.0,
            "ADI":               0.0,
            "Hf":                0.0,
            "H":                 0.0,
            "error":             "Failed to process audio",
        }

    result["acoustic_richness"] = ar

    redis_client.set(
        f"job:{job_id}:result:{idx}",
        json.dumps({"index": idx, "data": result}),
        ex=3600,
    )

    count = redis_client.incr(f"job:{job_id}:count")
    total = redis_client.get(f"job:{job_id}:total")

    print(f"[AUDIO WORKER] Completed job {job_id}, audio {idx} ({count}/{total})")

    if total is not None and count == int(total):
        print(f"[AUDIO WORKER] Last worker for job {job_id} — aggregating results...")
        try:
            if job_id.endswith("_full"):
                _aggregate_and_publish_full(job_id, int(total), ch)
            else:
                _aggregate_and_publish(job_id, int(total), ch)
        except Exception as e:
            print(f"[AUDIO WORKER] Aggregation failed for job {job_id}: {e}")
            ch.basic_publish(
                exchange='',
                routing_key='analysis-results',
                body=json.dumps({"jobId": job_id, "status": "failed", "error": str(e)}),
                properties=pika.BasicProperties(delivery_mode=2),
            )

    ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    print("Starting Audio Worker...")
    connection = connect_rabbitmq()
    channel = connection.channel()
    channel.queue_declare(queue='audio-jobs', durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='audio-jobs', on_message_callback=callback)
    print("Audio worker ready. Waiting for messages...")
    channel.start_consuming()


if __name__ == "__main__":
    main()