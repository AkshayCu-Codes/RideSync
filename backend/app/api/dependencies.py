from functools import lru_cache

from app.realtime.ride_connection_manager import RideConnectionManager
from app.services.ride_service import InMemoryRideService


@lru_cache
def get_ride_service() -> InMemoryRideService:
    """Provide the process-local ride session service."""
    return InMemoryRideService()


@lru_cache
def get_ride_connection_manager() -> RideConnectionManager:
    """Provide the process-local WebSocket connection manager."""
    return RideConnectionManager()
