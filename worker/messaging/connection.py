import sys
import time

import pika

def connect_rabbitmq(host="rabbitmq", max_retries=5):
    """
    Establish connection to RabbitMQ with retry logic.
    """
    retry = 0

    while retry < max_retries:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=host,
                    heartbeat=600,
                    blocked_connection_timeout=300
                )
            )
            print("Connected to RabbitMQ")
            return connection
        except Exception as e:
            retry += 1
            print(f"Connection attempt {retry}/{max_retries} failed: {e}")
            if retry >= max_retries:
                print("Failed to connect to RabbitMQ after maximum retries")
                sys.exit(1)
            time.sleep(5)