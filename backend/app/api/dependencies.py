from functools import lru_cache

from app.services.ride_service import InMemoryRideService


@lru_cache
def get_ride_service() -> InMemoryRideService:
    """Provide the process-local ride session service."""
    return InMemoryRideService()
