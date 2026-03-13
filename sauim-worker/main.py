"""
Sauim de Coleira (Saguinus bicolor) detection worker.
Separate service to avoid dependency conflicts with the main audio worker.
Uses only the sauim-detector CLI from:
  https://github.com/juancolonna/Sauim

Listens on 'sauim-detection' RabbitMQ queue.
"""
import json
import os
import subprocess
import time
import pika


def connect_rabbitmq():
    """Connect to RabbitMQ with retries."""
    host = os.environ.get("RABBITMQ_HOST", "rabbitmq")
    max_retries = 30

    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=host,
                    heartbeat=600,
                    blocked_connection_timeout=300,
                )
            )
            print(f"Connected to RabbitMQ at {host}")
            return connection
        except pika.exceptions.AMQPConnectionError:
            print(f"RabbitMQ not ready (attempt {attempt + 1}/{max_retries}), retrying in 5s...")
            time.sleep(5)

    raise RuntimeError("Could not connect to RabbitMQ")


def parse_detections_file(label_path: str) -> list[dict]:
    """
    Parse an Audacity-format label file produced by sauim-detector.
    Each line: start_time\tend_time\tlabel
    """
    detections = []
    if not os.path.exists(label_path):
        return detections

    with open(label_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) >= 3:
                detections.append({
                    "start": round(float(parts[0]), 2),
                    "end": round(float(parts[1]), 2),
                    "label": parts[2],
                })

    return detections


def detect_sauim(audio_path: str) -> dict:
    """
    Run Sauim de Coleira detection on a .wav file using the sauim-detector CLI.
    The CLI handles all model loading (embeddings + OCSVM) internally.

    Command: sauim-detector <audio_path>
    Output:  <basename>_detections.txt (Audacity label format)
    """
    filename = os.path.basename(audio_path)
    start_time = time.time()

    print(f"[SAUIM] Processing: {filename}")

    # Run the sauim-detector CLI — it loads models and writes _detections.txt
    result = subprocess.run(
        ["sauim-detector", audio_path],
        capture_output=True,
        text=True,
        timeout=600,  # 10 minutes max
    )

    print(f"[SAUIM] CLI stdout: {result.stdout.strip()}")
    if result.stderr:
        print(f"[SAUIM] CLI stderr: {result.stderr.strip()}")

    if result.returncode != 0:
        raise RuntimeError(f"sauim-detector failed (code {result.returncode}): {result.stderr}")

    # Parse the output detections file
    base, _ = os.path.splitext(audio_path)
    label_path = base + "_detections.txt"
    detections = parse_detections_file(label_path)

    # Clean up the detections file (don't leave artifacts in the uploads dir)
    if os.path.exists(label_path):
        os.remove(label_path)

    elapsed = time.time() - start_time
    detected = len(detections) > 0

    print(f"[SAUIM] {filename}: {len(detections)} detections in {elapsed:.1f}s")

    return {
        "filename": filename,
        "detected": detected,
        "total_detections": len(detections),
        "detections": detections,
        "processing_time": round(elapsed, 2),
    }


def callback(ch, method, properties, body):
    """Process a sauim detection job from the queue."""
    job = None
    try:
        job = json.loads(body)
        job_id = job.get("jobId")
        audio_path = job.get("audioPath")

        if not job_id or not audio_path:
            raise ValueError("Missing jobId or audioPath")

        print(f"\n[SAUIM] Processing job {job_id}")
        print(f"Audio: {audio_path}")

        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        detection_result = detect_sauim(audio_path)

        result = {
            "jobId": job_id,
            "status": "completed",
            "type": "sauim_detection",
            **detection_result,
        }

        ch.basic_publish(
            exchange='',
            routing_key='analysis-results',
            body=json.dumps(result),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        print(f"[SAUIM] Job {job_id} completed — {detection_result['total_detections']} detections")

    except Exception as e:
        print(f"[SAUIM] Error processing job: {e}")

        error_result = {
            "jobId": job.get("jobId") if job else "unknown",
            "status": "failed",
            "type": "sauim_detection",
            "error": str(e),
        }

        ch.basic_publish(
            exchange='',
            routing_key='analysis-results',
            body=json.dumps(error_result),
            properties=pika.BasicProperties(delivery_mode=2)
        )

    finally:
        ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    """Start the Sauim detection worker."""
    print("=" * 50)
    print("🐒 Sauim de Coleira Detection Worker")
    print("   Saguinus bicolor vocalization detector")
    print("=" * 50)
    print("Connecting to RabbitMQ...")

    connection = connect_rabbitmq()
    channel = connection.channel()

    channel.queue_declare(queue='sauim-detection', durable=True)
    channel.queue_declare(queue='analysis-results', durable=True)

    channel.basic_qos(prefetch_count=1)

    channel.basic_consume(
        queue='sauim-detection',
        on_message_callback=callback
    )

    print("Sauim worker ready. Waiting for detection jobs...")
    channel.start_consuming()


if __name__ == "__main__":
    main()
