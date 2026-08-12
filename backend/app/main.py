from fastapi import FastAPI

app = FastAPI(title="RideSync API", version="0.1.0")


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Provide a minimal liveness endpoint for local tooling and containers."""
    return {"status": "ok"}
