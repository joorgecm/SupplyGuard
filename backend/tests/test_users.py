from fastapi.testclient import TestClient

from app.models.enums import Role
from tests.conftest import client_for


def create_user(client: TestClient, email: str = "ana@test.com", **extra) -> dict:
    payload = {
        "full_name": "Ana Garcia",
        "email": email,
        "password": "password123",
        "role": "operator",
        **extra,
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 201
    return response.json()


def test_create_user_and_login_with_it(client: TestClient, anon_client: TestClient):
    user = create_user(client)

    assert user["role"] == "operator"
    assert user["is_active"] is True
    assert "password" not in user and "password_hash" not in user
    login = anon_client.post(
        "/auth/token", data={"username": "ana@test.com", "password": "password123"}
    )
    assert login.status_code == 200


def test_create_user_with_duplicate_email_returns_409(client: TestClient):
    create_user(client, "ana@test.com")

    response = client.post(
        "/users",
        json={"full_name": "X", "email": "ANA@test.com", "password": "password1", "role": "admin"},
    )

    assert response.status_code == 409


def test_create_user_with_invalid_data_returns_422(client: TestClient):
    base = {"full_name": "Ana", "email": "ana@test.com", "password": "password123", "role": "admin"}

    assert client.post("/users", json={**base, "password": "short"}).status_code == 422
    assert client.post("/users", json={**base, "email": "nope"}).status_code == 422
    assert client.post("/users", json={**base, "role": "boss"}).status_code == 422


def test_get_user_and_missing_user(client: TestClient):
    user = create_user(client)

    assert client.get(f"/users/{user['id']}").json() == user
    assert client.get("/users/999999").status_code == 404


def test_list_users_filters_by_role_and_active(client: TestClient):
    operator = create_user(client, "op@test.com", role="operator")
    engineer = create_user(client, "eng@test.com", role="engineer")
    client.patch(f"/users/{engineer['id']}", json={"is_active": False})

    operator_ids = [u["id"] for u in client.get("/users", params={"role": "operator"}).json()]
    active_ids = [u["id"] for u in client.get("/users", params={"active": True}).json()]

    assert operator["id"] in operator_ids and engineer["id"] not in operator_ids
    assert operator["id"] in active_ids and engineer["id"] not in active_ids


def test_update_user_changes_role_and_password(client: TestClient, anon_client: TestClient):
    user = create_user(client)

    response = client.patch(
        f"/users/{user['id']}", json={"role": "engineer", "password": "newpassword1"}
    )

    assert response.status_code == 200
    assert response.json()["role"] == "engineer"
    assert response.json()["full_name"] == "Ana Garcia"
    login = anon_client.post(
        "/auth/token", data={"username": "ana@test.com", "password": "newpassword1"}
    )
    assert login.status_code == 200


def test_update_user_rejects_null_fields(client: TestClient):
    user = create_user(client)

    assert client.patch(f"/users/{user['id']}", json={"role": None}).status_code == 422


def test_admin_cannot_deactivate_or_demote_themselves(anon_client: TestClient, make_user):
    admin = make_user(Role.ADMIN)
    client = client_for(admin)

    assert client.patch(f"/users/{admin.id}", json={"is_active": False}).status_code == 400
    assert client.patch(f"/users/{admin.id}", json={"role": "operator"}).status_code == 400
    assert client.patch(f"/users/{admin.id}", json={"full_name": "New Name"}).status_code == 200


def test_users_endpoints_are_admin_only(
    anon_client: TestClient, operator_client: TestClient, make_user
):
    engineer_client = client_for(make_user(Role.ENGINEER))

    assert anon_client.get("/users").status_code == 401
    assert operator_client.get("/users").status_code == 403
    assert engineer_client.get("/users").status_code == 403
    assert engineer_client.post("/users", json={}).status_code == 403
