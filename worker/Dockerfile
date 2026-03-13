FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install \
    --no-cache-dir \
    --default-timeout=1000 \
    --retries 10 \
    -r requirements.txt

COPY . .

ENV PYTHONPATH=/app

CMD ["python", "-u", "main.py"]
