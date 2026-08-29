from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class LocationUpdateMessage(BaseModel):
    """A location update sent by a connected participant."""

    type: Literal["location.update"]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy: float | None = Field(default=None, ge=0)


class ParticipantLocationMessage(BaseModel):
    """A participant location broadcast to other riders in a session."""

    type: Literal["participant.location"] = "participant.location"
    participant_id: UUID
    latitude: float
    longitude: float
    accuracy: float | None
    updated_at: datetime


class RideLocationSnapshotMessage(BaseModel):
    """The known active participant locations sent when joining a channel."""

    type: Literal["ride.location.snapshot"] = "ride.location.snapshot"
    locations: list[ParticipantLocationMessage]


class ParticipantLeftMessage(BaseModel):
    """Notification that a participant no longer shares a live location."""

    type: Literal["participant.left"] = "participant.left"
    participant_id: UUID
