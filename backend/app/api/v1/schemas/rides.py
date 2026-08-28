from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CreateRideRequest(BaseModel):
    """Input required to create a ride session."""

    name: str = Field(min_length=1, max_length=100, examples=["Saturday morning ride"])


class RideResponse(BaseModel):
    """A created ride session returned to API clients."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class JoinRideRequest(BaseModel):
    """Input required for a rider to join a ride session."""

    display_name: str = Field(min_length=1, max_length=50, examples=["Akshay"])


class ParticipantResponse(BaseModel):
    """A participant registered in a ride session."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ride_id: UUID
    display_name: str
    joined_at: datetime


class LeaveRideResponse(BaseModel):
    """Confirmation returned after a participant leaves a ride session."""

    participant_id: UUID
    ride_id: UUID
    status: str = "left"
