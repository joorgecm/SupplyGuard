from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.core.config import settings
from app.models.enums import Role
from tests.conftest import TEST_PASSWORD, client_for


def login(client: TestClient, email: str, password: str = TEST_PASSWORD):
    # OAuth2 envía las credenciales como formulario (data=), no como JSON
    return client.post("/auth/token", data={"username": email, "password": password})


def test_login_returns_token_that_identifies_the_user(anon_client: TestClient, make_user):
    user = make_user(Role.ENGINEER)

    response = login(anon_client, user.email)

    assert response.status_code == 200
    token = response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"
    me = anon_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["id"] == user.id
    assert me.json()["role"] == "engineer"
    assert "password_hash" not in me.json()


def test_login_email_is_case_insensitive(anon_client: TestClient, make_user):
    user = make_user()

    assert login(anon_client, user.email.upper()).status_code == 200


def test_login_with_wrong_password_returns_401(anon_client: TestClient, make_user):
    user = make_user()

    assert login(anon_client, user.email, "wrong-password").status_code == 401


def test_login_with_unknown_email_returns_401(anon_client: TestClient):
    assert login(anon_client, "nobody@test.com").status_code == 401


def test_inactive_user_cannot_login(anon_client: TestClient, make_user):
    user = make_user(is_active=False)

    assert login(anon_client, user.email).status_code == 401


def test_me_without_token_returns_401(anon_client: TestClient):
    assert anon_client.get("/auth/me").status_code == 401


def test_me_with_invalid_token_returns_401(anon_client: TestClient):
    response = anon_client.get("/auth/me", headers={"Authorization": "Bearer not-a-token"})

    assert response.status_code == 401


def test_expired_token_returns_401(anon_client: TestClient, make_user):
    user = make_user()
    expired = jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    response = anon_client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})

    assert response.status_code == 401


def test_token_of_deactivated_user_stops_working(anon_client: TestClient, make_user, db_session):
    user = make_user()
    client = client_for(user)
    assert client.get("/auth/me").status_code == 200

    user.is_active = False
    db_session.flush()

    assert client.get("/auth/me").status_code == 401
