from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.rides import router as rides_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(rides_router, prefix="/api/v1")
