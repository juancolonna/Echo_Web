import json
import os
import redis
import pika
from pathlib import Path
from services.micro_analysis import analyze_micro_data
from messaging.connection import connect_rabbitmq

def callback(ch, method, properties, body):
    job = json.loads(body)
    job_id = job["jobId"]
    csv_path = job["csvPath"]

    base_job_id = job_id.replace("_micro", "") if "_micro" in job_id else job_id
    charts_dir = f'/app/uploads/jobs/{base_job_id}'

    print(f"[MICRO WORKER] Processing job {job_id}, CSV: {os.path.basename(csv_path)}")

    try:
        result = analyze_micro_data(csv_path, job_id, charts_dir=charts_dir)
        if "jobId" not in result:
            result["jobId"] = job_id
    except Exception as e:
        print(f"[MICRO WORKER] Error processing {job_id}: {e}")
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
    print(f"[MICRO WORKER] Completed job {job_id}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    print("Starting Micro Worker...")
    connection = connect_rabbitmq()
    channel = connection.channel()
    channel.queue_declare(queue='micro-jobs', durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='micro-jobs', on_message_callback=callback)
    print("Micro worker ready. Waiting for messages...")
    channel.start_consuming()

if __name__ == "__main__":
    main()