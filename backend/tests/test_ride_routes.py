from fastapi.testclient import TestClient

from app.main import app


def test_create_ride_returns_created_ride() -> None:
    with TestClient(app) as client:
        response = client.post("/api/v1/rides", json={"name": "Saturday morning ride"})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Saturday morning ride"
    assert body["id"]
    assert body["created_at"]


def test_join_and_leave_ride() -> None:
    with TestClient(app) as client:
        ride = client.post("/api/v1/rides", json={"name": "Saturday morning ride"}).json()
        joined = client.post(
            f"/api/v1/rides/{ride['id']}/participants",
            json={"display_name": "Akshay"},
        )
        left = client.delete(
            f"/api/v1/rides/{ride['id']}/participants/{joined.json()['id']}",
        )

    assert joined.status_code == 201
    assert joined.json()["ride_id"] == ride["id"]
    assert left.status_code == 200
    assert left.json() == {
        "participant_id": joined.json()["id"],
        "ride_id": ride["id"],
        "status": "left",
    }


def test_joining_a_missing_ride_returns_not_found() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/rides/00000000-0000-0000-0000-000000000000/participants",
            json={"display_name": "Akshay"},
        )

    assert response.status_code == 404
    assert response.json() == {"detail": "Ride not found."}


def test_leaving_a_missing_participant_returns_not_found() -> None:
    with TestClient(app) as client:
        ride = client.post("/api/v1/rides", json={"name": "Saturday morning ride"}).json()
        response = client.delete(
            f"/api/v1/rides/{ride['id']}/participants/00000000-0000-0000-0000-000000000000",
        )

    assert response.status_code == 404
    assert response.json() == {"detail": "Participant not found in this ride."}


def test_create_ride_rejects_an_empty_name() -> None:
    with TestClient(app) as client:
        response = client.post("/api/v1/rides", json={"name": ""})

    assert response.status_code == 422
