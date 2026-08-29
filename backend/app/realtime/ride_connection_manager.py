import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from fastapi import WebSocket

from app.realtime.protocol import ParticipantLeftMessage, ParticipantLocationMessage


@dataclass(frozen=True)
class ParticipantLocation:
    """The latest server-observed location for an active participant."""

    participant_id: UUID
    latitude: float
    longitude: float
    accuracy: float | None
    updated_at: datetime

    def to_message(self) -> ParticipantLocationMessage:
        return ParticipantLocationMessage(
            participant_id=self.participant_id,
            latitude=self.latitude,
            longitude=self.longitude,
            accuracy=self.accuracy,
            updated_at=self.updated_at,
        )


class RideConnectionManager:
    """Maintains active, process-local WebSocket ride channels."""

    def __init__(self) -> None:
        self._connections: dict[UUID, dict[UUID, WebSocket]] = {}
        self._locations: dict[UUID, dict[UUID, ParticipantLocation]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self, ride_id: UUID, participant_id: UUID, websocket: WebSocket
    ) -> list[ParticipantLocation]:
        """Accept and register a participant connection, returning the current snapshot."""
        await websocket.accept()

        async with self._lock:
            ride_connections = self._connections.setdefault(ride_id, {})
            ride_connections[participant_id] = websocket
            return [
                location
                for other_participant_id, location in self._locations.get(ride_id, {}).items()
                if other_participant_id != participant_id
            ]

    async def update_location(
        self,
        ride_id: UUID,
        participant_id: UUID,
        latitude: float,
        longitude: float,
        accuracy: float | None,
    ) -> None:
        """Store and broadcast a participant's latest location to other riders."""
        location = ParticipantLocation(
            participant_id=participant_id,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            updated_at=datetime.now(UTC),
        )

        async with self._lock:
            self._locations.setdefault(ride_id, {})[participant_id] = location
            recipients = [
                websocket
                for recipient_id, websocket in self._connections.get(ride_id, {}).items()
                if recipient_id != participant_id
            ]

        await self._send_to_all(recipients, location.to_message().model_dump(mode="json"))

    async def disconnect(self, ride_id: UUID, participant_id: UUID) -> None:
        """Remove a participant connection and notify the remaining riders."""
        async with self._lock:
            was_connected = participant_id in self._connections.get(ride_id, {})
            self._connections.get(ride_id, {}).pop(participant_id, None)
            self._locations.get(ride_id, {}).pop(participant_id, None)

            if not self._connections.get(ride_id):
                self._connections.pop(ride_id, None)
            if not self._locations.get(ride_id):
                self._locations.pop(ride_id, None)

            recipients = list(self._connections.get(ride_id, {}).values())

        if was_connected:
            event = ParticipantLeftMessage(participant_id=participant_id)
            await self._send_to_all(recipients, event.model_dump(mode="json"))

    async def disconnect_participant(self, ride_id: UUID, participant_id: UUID) -> None:
        """Close the participant's active socket when they leave a ride through HTTP."""
        async with self._lock:
            websocket = self._connections.get(ride_id, {}).get(participant_id)

        if websocket:
            await websocket.close(code=1000)
        await self.disconnect(ride_id, participant_id)

    async def _send_to_all(self, recipients: list[WebSocket], message: dict[str, object]) -> None:
        if recipients:
            await asyncio.gather(
                *(websocket.send_json(message) for websocket in recipients),
                return_exceptions=True,
            )
