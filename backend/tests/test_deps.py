import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import User
from app.security import create_token

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _add_user(db: Session, email: str) -> User:
    user = User(email=email, password_hash="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def db() -> Session:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session):
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_get_current_user_valid_token_returns_200(client: TestClient, db: Session) -> None:
    user = _add_user(db, "valid@example.com")
    token = create_token(user.id)

    response = client.get("/api/outfits", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == []


def test_get_current_user_missing_header_returns_401(client: TestClient, db: Session) -> None:
    response = client.get("/api/outfits")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


def test_get_current_user_invalid_token_returns_401(client: TestClient, db: Session) -> None:
    response = client.get("/api/outfits", headers={"Authorization": "Bearer not-a-valid-token"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


def test_get_current_user_unknown_user_returns_401(client: TestClient, db: Session) -> None:
    token = create_token(999999)

    response = client.get("/api/outfits", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}
