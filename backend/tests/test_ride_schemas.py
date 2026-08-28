from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from app.api.v1.schemas.rides import (
    CreateRideRequest,
    JoinRideRequest,
    LeaveRideResponse,
    ParticipantResponse,
    RideResponse,
)


def test_create_ride_request_accepts_a_valid_name() -> None:
    request = CreateRideRequest(name="Saturday morning ride")

    assert request.name == "Saturday morning ride"


@pytest.mark.parametrize("name", ["", "x" * 101])
def test_create_ride_request_rejects_invalid_names(name: str) -> None:
    with pytest.raises(ValidationError):
        CreateRideRequest(name=name)


def test_join_ride_request_accepts_a_valid_display_name() -> None:
    request = JoinRideRequest(display_name="Akshay")

    assert request.display_name == "Akshay"


@pytest.mark.parametrize("display_name", ["", "x" * 51])
def test_join_ride_request_rejects_invalid_display_names(display_name: str) -> None:
    with pytest.raises(ValidationError):
        JoinRideRequest(display_name=display_name)


def test_ride_contract_responses_serialize_expected_fields() -> None:
    ride_id = uuid4()
    participant_id = uuid4()
    created_at = datetime(2026, 8, 28, 9, 0, tzinfo=UTC)
    joined_at = datetime(2026, 8, 28, 9, 5, tzinfo=UTC)

    ride = RideResponse(id=ride_id, name="Saturday morning ride", created_at=created_at)
    participant = ParticipantResponse(
        id=participant_id,
        ride_id=ride_id,
        display_name="Akshay",
        joined_at=joined_at,
    )
    leave = LeaveRideResponse(participant_id=participant_id, ride_id=ride_id)

    assert ride.model_dump(mode="json") == {
        "id": str(ride_id),
        "name": "Saturday morning ride",
        "created_at": "2026-08-28T09:00:00Z",
    }
    assert participant.model_dump(mode="json")["display_name"] == "Akshay"
    assert leave.model_dump(mode="json")["status"] == "left"


def test_schema_identifiers_are_uuids() -> None:
    assert RideResponse.model_fields["id"].annotation is UUID
