# RideSync

RideSync is a real-time group ride tracking application. This repository is organised as a small monorepo so the web client and API can evolve independently while sharing one development workflow.

## Structure

- `frontend/` — React, Vite, and TypeScript web application.
- `backend/` — FastAPI service.
- `docker-compose.yml` — local multi-service development environment.

## Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop (optional, for containerised development)

## Run locally

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

In a second terminal, start the backend:

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Alternatively, copy `.env.example` to `.env` and run:

```bash
docker compose up --build
```

## Milestone status

Milestone 1 establishes the project foundation only. No ride, user, map, or real-time business logic has been implemented.
