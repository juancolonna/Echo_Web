from messaging.connection import connect_rabbitmq
from messaging.consumer import callback

def main():
    print("Starting Python Worker (Coordinator)...")
    connection = connect_rabbitmq()
    channel = connection.channel()

    channel.queue_declare(queue='batch-jobs',        durable=True)
    channel.queue_declare(queue='micro-jobs',         durable=True)
    channel.queue_declare(queue='analysis-results',   durable=True)
    channel.queue_declare(queue='spectrogram-jobs',   durable=True)
    channel.queue_declare(queue='audio-jobs',         durable=True)
    channel.queue_declare(queue='compute-all-jobs',   durable=True)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='batch-jobs',       on_message_callback=callback)
    channel.basic_consume(queue='compute-all-jobs', on_message_callback=callback)

    print("Coordinator ready. Waiting for messages...")
    channel.start_consuming()

if __name__ == "__main__":
    main()