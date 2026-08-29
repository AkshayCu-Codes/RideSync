from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status

from app.api.dependencies import get_ride_connection_manager, get_ride_service
from app.api.v1.schemas.rides import (
    CreateRideRequest,
    JoinRideRequest,
    LeaveRideResponse,
    ParticipantResponse,
    RideResponse,
)
from app.realtime.protocol import LocationUpdateMessage, RideLocationSnapshotMessage
from app.realtime.ride_connection_manager import RideConnectionManager
from app.services.ride_service import (
    InMemoryRideService,
    ParticipantNotFoundError,
    RideNotFoundError,
)

router = APIRouter(prefix="/rides", tags=["rides"])
RideService = Annotated[InMemoryRideService, Depends(get_ride_service)]
RideConnectionManagerDependency = Annotated[
    RideConnectionManager, Depends(get_ride_connection_manager)
]


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
    connection_manager: RideConnectionManagerDependency,
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

    await connection_manager.disconnect_participant(ride_id, participant_id)
    return LeaveRideResponse(participant_id=participant_id, ride_id=ride_id)


@router.websocket("/{ride_id}/participants/{participant_id}/location")
async def share_location(
    websocket: WebSocket,
    ride_id: UUID,
    participant_id: UUID,
    ride_service: RideService,
    connection_manager: RideConnectionManagerDependency,
) -> None:
    """Receive a participant's locations and broadcast them within their ride session."""
    try:
        if not ride_service.has_participant(ride_id, participant_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except RideNotFoundError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    snapshot = await connection_manager.connect(ride_id, participant_id, websocket)
    await websocket.send_json(
        RideLocationSnapshotMessage(locations=[location.to_message() for location in snapshot]).model_dump(
            mode="json"
        )
    )

    try:
        while True:
            payload = await websocket.receive_json()
            try:
                location = LocationUpdateMessage.model_validate(payload)
            except ValueError:
                await websocket.send_json({"type": "error", "detail": "Invalid location update."})
                continue

            if not ride_service.has_participant(ride_id, participant_id):
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return

            await connection_manager.update_location(
                ride_id=ride_id,
                participant_id=participant_id,
                latitude=location.latitude,
                longitude=location.longitude,
                accuracy=location.accuracy,
            )
    except WebSocketDisconnect:
        pass
    finally:
        await connection_manager.disconnect(ride_id, participant_id)
