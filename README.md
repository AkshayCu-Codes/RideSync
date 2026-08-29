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

The frontend is served at `http://localhost:5176` by default.

Before starting it, copy `.env.example` to `.env` and set the Google Maps values. Create a browser key in Google Cloud, enable the **Maps JavaScript API**, and restrict the key to your development and production HTTP referrers. Create and provide a Google Maps Map ID; it is required for the modern Advanced Marker used for the current-location pin.

In a second terminal, start the backend:

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API liveness endpoint is available at `http://localhost:8000/health`. Backend settings are read from environment variables. For local browser access, set `BACKEND_CORS_ORIGINS` to a comma-separated list of permitted frontend origins; production deployments should use only their explicit HTTPS origins.

Alternatively, copy `.env.example` to `.env` and run:

```bash
docker compose up --build
```

## Milestone status

Milestone 5 adds real-time location sharing: joined riders publish browser geolocation over a ride-scoped WebSocket channel and see other active participants on the map. Session state, live locations, and WebSocket connections are intentionally process-local; database persistence, authentication, and horizontally scalable WebSocket infrastructure have not yet been implemented.

## Progress

### Milestone 3 — Google Maps location view

The frontend displays a full-screen Google Map, requests browser geolocation, and marks the rider's current location.

![RideSync Google Maps location view](docs/images/milestone-3-map.png.png)

### Milestone 4 — Ride session workflow

Riders can create a session, join it with a display name, leave it, and share a join link through the map overlay. The browser share sheet supports WhatsApp and other installed sharing apps; a clipboard fallback is used where native sharing is unavailable. The React client communicates with the versioned FastAPI ride-session API; state remains in memory while persistence and real-time updates are deferred to later milestones.

![RideSync ride session controls](docs/images/milestone-4-ride-session.png)

### Milestone 5 — Real-time location sharing

Joined riders share their current browser location with active participants in the same ride. New participants receive a snapshot of current locations, and the client reconnects after transient connection loss.
