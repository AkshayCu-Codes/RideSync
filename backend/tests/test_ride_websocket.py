import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app


def create_participant(client: TestClient, name: str) -> tuple[str, str]:
    ride = client.post("/api/v1/rides", json={"name": name}).json()
    participant = client.post(
        f"/api/v1/rides/{ride['id']}/participants",
        json={"display_name": name},
    ).json()
    return ride["id"], participant["id"]


def test_websocket_broadcasts_location_to_other_ride_participants() -> None:
    with TestClient(app) as client:
        ride_id, first_participant_id = create_participant(client, "First rider")
        second_participant = client.post(
            f"/api/v1/rides/{ride_id}/participants",
            json={"display_name": "Second rider"},
        ).json()

        with client.websocket_connect(
            f"/api/v1/rides/{ride_id}/participants/{first_participant_id}/location"
        ) as first_socket:
            assert first_socket.receive_json() == {"type": "ride.location.snapshot", "locations": []}

            with client.websocket_connect(
                f"/api/v1/rides/{ride_id}/participants/{second_participant['id']}/location"
            ) as second_socket:
                assert second_socket.receive_json() == {
                    "type": "ride.location.snapshot",
                    "locations": [],
                }
                first_socket.send_json(
                    {
                        "type": "location.update",
                        "latitude": 53.3498,
                        "longitude": -6.2603,
                        "accuracy": 12.5,
                    }
                )

                message = second_socket.receive_json()

    assert message["type"] == "participant.location"
    assert message["participant_id"] == first_participant_id
    assert message["latitude"] == 53.3498
    assert message["longitude"] == -6.2603
    assert message["accuracy"] == 12.5
    assert message["updated_at"]


def test_websocket_rejects_participants_not_in_the_ride() -> None:
    with TestClient(app) as client:
        ride_id, _ = create_participant(client, "First rider")

        with pytest.raises(WebSocketDisconnect), client.websocket_connect(
            f"/api/v1/rides/{ride_id}/participants/00000000-0000-0000-0000-000000000000"
        ):
            pass


def test_websocket_returns_an_error_for_invalid_location_coordinates() -> None:
    with TestClient(app) as client:
        ride_id, participant_id = create_participant(client, "First rider")

        with client.websocket_connect(
            f"/api/v1/rides/{ride_id}/participants/{participant_id}/location"
        ) as websocket:
            websocket.receive_json()
            websocket.send_json(
                {"type": "location.update", "latitude": 91, "longitude": -6.2603}
            )

            assert websocket.receive_json() == {
                "type": "error",
                "detail": "Invalid location update.",
            }
