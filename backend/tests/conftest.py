import os
from collections.abc import Callable, Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Settings require DATABASE_URL; provide a dummy one so tests never touch the main database.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-bytes-long")

from app.core.config import settings  # noqa: E402
from app.core.database import get_db  # noqa: E402
from app.core.security import create_access_token, hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402
from app.models.enums import Role  # noqa: E402

TEST_PASSWORD = "password123"


@pytest.fixture(scope="session")
def test_engine():
    if not settings.test_database_url:
        pytest.skip("TEST_DATABASE_URL is not set")
    engine = create_engine(settings.test_database_url, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(test_engine) -> Generator[Session]:
    # Todo el test va dentro de una transacción que se deshace al final:
    # los commit() del código solo cierran un savepoint, así la BD de test queda limpia
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def anon_client(db_session: Session) -> Generator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def make_user(db_session: Session) -> Callable[..., User]:
    # Fixture "fábrica": devuelve una función para crear tantos usuarios como haga falta
    def _make_user(role: Role = Role.ADMIN, is_active: bool = True) -> User:
        user = User(
            email=f"{role}-{uuid4().hex[:8]}@test.com",
            full_name=f"Test {role}",
            password_hash=hash_password(TEST_PASSWORD),
            role=role,
            is_active=is_active,
        )
        db_session.add(user)
        db_session.flush()
        return user

    return _make_user


def client_for(user: User) -> TestClient:
    return TestClient(app, headers={"Authorization": f"Bearer {create_access_token(user.id)}"})


@pytest.fixture
def client(anon_client: TestClient, make_user: Callable[..., User]) -> TestClient:
    """Cliente autenticado como admin (puede hacer de todo)."""
    return client_for(make_user(Role.ADMIN))


@pytest.fixture
def operator_client(anon_client: TestClient, make_user: Callable[..., User]) -> TestClient:
    return client_for(make_user(Role.OPERATOR))


@pytest.fixture
def engineer_client(anon_client: TestClient, make_user: Callable[..., User]) -> TestClient:
    return client_for(make_user(Role.ENGINEER))


@pytest.fixture
def part(client: TestClient) -> dict:
    supplier = client.post("/suppliers", json={"name": "Metalex"}).json()
    payload = {"supplier_id": supplier["id"], "reference": "BRK-001", "lot": "L-100"}
    return client.post("/parts", json=payload).json()
