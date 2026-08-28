from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_ride_service
from app.api.v1.schemas.rides import (
    CreateRideRequest,
    JoinRideRequest,
    LeaveRideResponse,
    ParticipantResponse,
    RideResponse,
)
from app.services.ride_service import (
    InMemoryRideService,
    ParticipantNotFoundError,
    RideNotFoundError,
)

router = APIRouter(prefix="/rides", tags=["rides"])
RideService = Annotated[InMemoryRideService, Depends(get_ride_service)]


@router.post("", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
async def create_ride(
    request: CreateRideRequest,
    ride_service: RideService,
) -> RideResponse:
    """Create a new ride session."""
    return ride_service.create_ride(request.name)


@router.post(
    "/{ride_id}/participants",
    response_model=ParticipantResponse,
    status_code=status.HTTP_201_CREATED,
)
async def join_ride(
    ride_id: UUID,
    request: JoinRideRequest,
    ride_service: RideService,
) -> ParticipantResponse:
    """Add a participant to a ride session."""
    try:
        return ride_service.join_ride(ride_id, request.display_name)
    except RideNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.") from error


@router.delete(
    "/{ride_id}/participants/{participant_id}",
    response_model=LeaveRideResponse,
)
async def leave_ride(
    ride_id: UUID,
    participant_id: UUID,
    ride_service: RideService,
) -> LeaveRideResponse:
    """Remove a participant from a ride session."""
    try:
        ride_service.leave_ride(ride_id, participant_id)
    except RideNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.") from error
    except ParticipantNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in this ride.",
        ) from error

    return LeaveRideResponse(participant_id=participant_id, ride_id=ride_id)
