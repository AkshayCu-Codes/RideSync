from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import Lock
from uuid import UUID, uuid4

from app.api.v1.schemas.rides import ParticipantResponse, RideResponse


class RideNotFoundError(Exception):
    """Raised when a requested ride session does not exist."""


class ParticipantNotFoundError(Exception):
    """Raised when a requested participant does not belong to a ride session."""


@dataclass
class _Ride:
    id: UUID
    name: str
    created_at: datetime
    participants: dict[UUID, "_Participant"] = field(default_factory=dict)


@dataclass
class _Participant:
    id: UUID
    ride_id: UUID
    display_name: str
    joined_at: datetime


class InMemoryRideService:
    """Thread-safe temporary ride-session store for local development."""

    def __init__(self) -> None:
        self._rides: dict[UUID, _Ride] = {}
        self._lock = Lock()

    def create_ride(self, name: str) -> RideResponse:
        """Create and retain a new ride session."""
        ride = _Ride(id=uuid4(), name=name, created_at=datetime.now(UTC))

        with self._lock:
            self._rides[ride.id] = ride

        return RideResponse(id=ride.id, name=ride.name, created_at=ride.created_at)

    def join_ride(self, ride_id: UUID, display_name: str) -> ParticipantResponse:
        """Add a participant to an existing ride session."""
        participant = _Participant(
            id=uuid4(),
            ride_id=ride_id,
            display_name=display_name,
            joined_at=datetime.now(UTC),
        )

        with self._lock:
            ride = self._get_ride(ride_id)
            ride.participants[participant.id] = participant

        return ParticipantResponse(
            id=participant.id,
            ride_id=participant.ride_id,
            display_name=participant.display_name,
            joined_at=participant.joined_at,
        )

    def leave_ride(self, ride_id: UUID, participant_id: UUID) -> None:
        """Remove a participant from an existing ride session."""
        with self._lock:
            ride = self._get_ride(ride_id)
            if participant_id not in ride.participants:
                raise ParticipantNotFoundError
            del ride.participants[participant_id]

    def has_participant(self, ride_id: UUID, participant_id: UUID) -> bool:
        """Return whether the participant currently belongs to the ride session."""
        with self._lock:
            ride = self._get_ride(ride_id)
            return participant_id in ride.participants

    def _get_ride(self, ride_id: UUID) -> _Ride:
        try:
            return self._rides[ride_id]
        except KeyError as error:
            raise RideNotFoundError from error
