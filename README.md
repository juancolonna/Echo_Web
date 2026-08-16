# EchoSystem / Echo_Web

EchoSystem (EchoWeb) — An integrated platform for bioacoustic and micrometeorological monitoring. This repository implements a web platform (EchoWeb) plus processing workers to upload, process and analyze field recordings (audio + micrometeorological data), compute acoustic indices, generate spectrograms, annotate events, and publish results.

## What it does

- Web-based pipeline to ingest ZIP archives from field devices (EchoLogger) containing .wav recordings and CSV sensor logs.
- Automatic audio processing (acoustic indices: ACI, NDSI, BI, H, ADI), spectrogram generation and synchronized playback/annotation.
- Micrometeorological analysis (derived variables such as dew point, vapor pressure deficit, heat index) using established libraries.
- Worker-based architecture (audio-worker, micro-worker, spectrogram_worker, etc.) to process items from queues in parallel.
- Tools for organizing, exporting and publishing analytical reports derived from processed data.

## Stack

- Languages: TypeScript (frontend & backend), Python (workers), CSS.
- Frontend: Next.js (React) app in `frontend/`.
- Backend: Node/Express + TypeScript code in `backend/`.
- Workers: Python-based processing code and dependencies in `worker/`.
- Notable libraries:
  - Backend: `express`, `prisma`, `fluent-ffmpeg`, `multer`, `sharp`
  - Frontend: `next`, `react`, `plotly.js`
  - Workers: `librosa`, `soundfile`, `scikit-maad`, `metpy`, `numpy`, `scipy`

## How it fits together

- Users upload ZIP files containing WAV audio and CSV sensor logs via the frontend.
- Backend accepts uploads, extracts ZIPs (worker-coordinator role), enqueues audio files and metadata.
- Worker processes (Python) consume queues:
  - `audio_worker`: computes acoustic indices per audio file
  - `spectrogram_worker`: generates spectrogram images / data for visualization
  - `micro_worker`: processes micrometeorological CSV and computes derived metrics (MetPy)
- Results are stored and served by the backend API to the frontend for interactive visualization and report generation.

## Quickstart — development (recommended)

Prerequisites
- Git
- Node.js (>=16/18 recommended) and npm/yarn
- Python 3.10+ (for workers) and pip
- Docker & Docker Compose (if you prefer container-based setup)
- (Optional) MySQL (the examples use MySQL in compose), Redis/RabbitMQ as needed by `compose.yml`

Using Docker Compose (recommended for a local full stack)

1. Copy and adapt environment examples:
   - `cp .env.example .env`
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
   Edit values (database password, ports, FRONTEND_URL) as needed.

2. Start with Docker Compose:

```bash
docker compose -f compose.yml up --build
```

This will build and start the frontend, backend and supporting services defined in `compose.yml`.

Running components locally (without Docker)

1. Backend

```bash
cd backend
npm install
cp .env.example .env  # then edit backend/.env
npm run start
```

The backend uses nodemon + tsx in development and listens on the port set in backend/.env (PORT).

2. Frontend

```bash
cd frontend
npm install
cp .env.example .env  # then edit frontend/.env
npm run dev
```

The Next.js dev server runs on port 3000 by default (the repo uses NEXT_PUBLIC_API / NEXT_PUBLIC_DOCKER_API variables to route to the backend).

3. Workers

- Install Python deps and run workers manually (or build the worker Docker image).

```bash
cd worker
python -m pip install -r requirements.txt
python main.py
# or run audio_worker.py / micro_worker.py / spectrogram_worker.py depending on your queue setup
```

Worker containers are provided via `worker/Dockerfile` if you prefer running them in Docker.

## Environment variables

- See `.env.example` (root) for Docker-compose level ports and database credentials.
- See `backend/.env.example` for backend-specific settings (PORT, DATABASE_URL, SESSION_SECRET, FRONTEND_URL, RABBITMQ_URL).
- See `frontend/.env.example` for frontend runtime variables (NEXT_PUBLIC_API).

## Processing pipeline notes

- Uploads: users upload ZIP files. The backend/worker-coordinator extracts archives and enqueues audio files.
- Audio indices: `audio_worker` performs computationally intensive acoustic index calculations (ACI, NDSI, BI, H, ADI).
- Micrometeorological: `micro_worker` uses MetPy and related libraries to derive metrics (dew point, vapor-pressure deficit, heat index).
- Scalability: the architecture is worker-driven and can scale `audio_worker` instances to increase throughput; experiments showed `audio_worker` is the main bottleneck.

## Development tips

- Backend dev: `npm run start` (backend) will run a TypeScript dev server with automatic reload.
- Frontend dev: `npm run dev` (frontend) to run Next.js with Hot Module Reloading.
- If using Docker Compose, ensure env vars (ports, DB credentials) match across frontend/backend .env files.
- Worker dependencies include scientific Python packages (librosa, numba, scipy, metpy). Use a virtualenv or Docker to manage complex binary deps.

## Acknowledgments & authors

Project and paper authors: Alcir H. C. Figueiredo, Pedro L. B. Mendes, Marcelo Gordo, Juan G. Colonna.

## License

MIT License
