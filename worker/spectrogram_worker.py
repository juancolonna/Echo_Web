import json
import os
import numpy as np
import pika
from pathlib import Path
from maad import sound
from services.audio_analysis import generate_spectrogram_image
from messaging.connection import connect_rabbitmq

def callback(ch, method, properties, body):
    job = json.loads(body)
    job_id = job["jobId"]
    audio_path = job["audioPath"]

    print(f"[SPECTROGRAM WORKER] Processing job {job_id}, audio: {os.path.basename(audio_path)}")

    try:
        s, fs = sound.load(audio_path, detrend=True)
        if s.ndim > 1:
            s = np.mean(s, axis=1)
        s = s.astype(np.float64)
        Sxx, tn, fn, _ = sound.spectrogram(s, fs, nperseg=2048)
        spectrogram_result = generate_spectrogram_image(Sxx, tn, fn, audio_path)

        result = {
            "jobId": job_id,
            "status": "completed",
            "type": "spectrogram",
            "spectrogram_path": spectrogram_result["path"],
            "spectrogram_vmin_db": spectrogram_result["vmin_db"],
            "spectrogram_vmax_db": spectrogram_result["vmax_db"],
        }
    except Exception as e:
        print(f"[SPECTROGRAM WORKER] Error processing {job_id}: {e}")
        result = {
            "jobId": job_id,
            "status": "failed",
            "error": str(e)
        }

    ch.basic_publish(
        exchange='',
        routing_key='analysis-results',
        body=json.dumps(result),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"[SPECTROGRAM WORKER] Completed job {job_id}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    print("Starting Spectrogram Worker...")
    connection = connect_rabbitmq()
    channel = connection.channel()
    channel.queue_declare(queue='spectrogram-jobs', durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='spectrogram-jobs', on_message_callback=callback)
    print("Spectrogram worker ready. Waiting for messages...")
    channel.start_consuming()

if __name__ == "__main__":
    main()