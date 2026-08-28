from uuid import uuid4

import pytest

from app.services.ride_service import (
    InMemoryRideService,
    ParticipantNotFoundError,
    RideNotFoundError,
)


@pytest.fixture
def ride_service() -> InMemoryRideService:
    return InMemoryRideService()


def test_create_ride_returns_a_new_ride(ride_service: InMemoryRideService) -> None:
    ride = ride_service.create_ride("Saturday morning ride")

    assert ride.name == "Saturday morning ride"
    assert ride.id
    assert ride.created_at.tzinfo is not None


def test_join_ride_adds_a_participant(ride_service: InMemoryRideService) -> None:
    ride = ride_service.create_ride("Saturday morning ride")

    participant = ride_service.join_ride(ride.id, "Akshay")

    assert participant.ride_id == ride.id
    assert participant.display_name == "Akshay"
    assert participant.joined_at.tzinfo is not None


def test_joining_a_missing_ride_fails(ride_service: InMemoryRideService) -> None:
    with pytest.raises(RideNotFoundError):
        ride_service.join_ride(uuid4(), "Akshay")


def test_leave_ride_removes_an_existing_participant(ride_service: InMemoryRideService) -> None:
    ride = ride_service.create_ride("Saturday morning ride")
    participant = ride_service.join_ride(ride.id, "Akshay")

    ride_service.leave_ride(ride.id, participant.id)

    with pytest.raises(ParticipantNotFoundError):
        ride_service.leave_ride(ride.id, participant.id)


def test_leaving_a_missing_ride_fails(ride_service: InMemoryRideService) -> None:
    with pytest.raises(RideNotFoundError):
        ride_service.leave_ride(uuid4(), uuid4())
