import uuid

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import engine
from app.deps import get_current_user
from app.main import app
from app.models import Base, User
from app.routers.auth import login_rate_limit, register_rate_limit
from app.security import create_token, decode_token, hash_password, verify_password


def _unique_email(prefix: str = "user") -> str:
    return f"{prefix}-{uuid.uuid4().hex}@example.com"


@pytest.fixture(autouse=True)
def _clean_state() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        session.query(User).delete()
        session.commit()
    register_rate_limit.reset()
    login_rate_limit.reset()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_register_returns_token_and_user(client) -> None:
    email = _unique_email()
    response = client.post("/api/auth/register", json={"email": email, "password": "geheim123"})

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == email
    assert isinstance(body["user"]["id"], int)


def test_register_duplicate_email_returns_409(client) -> None:
    email = _unique_email()
    first = client.post("/api/auth/register", json={"email": email, "password": "geheim123"})
    assert first.status_code == 201

    second = client.post("/api/auth/register", json={"email": email, "password": "anderes123"})

    assert second.status_code == 409
    assert "detail" in second.json()


def test_login_with_correct_credentials_returns_token(client) -> None:
    email = _unique_email()
    password = "geheim123"
    client.post("/api/auth/register", json={"email": email, "password": password})

    response = client.post("/api/auth/login", json={"email": email, "password": password})

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == email


def test_login_with_wrong_password_returns_401(client) -> None:
    email = _unique_email()
    client.post("/api/auth/register", json={"email": email, "password": "richtig123"})

    response = client.post("/api/auth/login", json={"email": email, "password": "falsch123"})

    assert response.status_code == 401


def test_login_with_unknown_email_returns_401(client) -> None:
    response = client.post("/api/auth/login", json={"email": _unique_email(), "password": "egal"})

    assert response.status_code == 401


def test_register_stores_hashed_password(client) -> None:
    email = _unique_email()
    password = "geheim123"
    client.post("/api/auth/register", json={"email": email, "password": password})

    with Session(engine) as session:
        user = session.query(User).filter(User.email == email).one()

    assert user.password_hash != password
    assert verify_password(password, user.password_hash)
    assert not verify_password("falsch", user.password_hash)


def test_register_rate_limited_after_five_requests(client) -> None:
    for _ in range(5):
        response = client.post(
            "/api/auth/register",
            json={"email": _unique_email(), "password": "geheim123"},
        )
        assert response.status_code == 201

    response = client.post(
        "/api/auth/register",
        json={"email": _unique_email(), "password": "geheim123"},
    )

    assert response.status_code == 429


def test_login_rate_limited_after_five_requests(client) -> None:
    for _ in range(5):
        response = client.post(
            "/api/auth/login",
            json={"email": "missing@example.com", "password": "egal"},
        )
        assert response.status_code == 401

    response = client.post(
        "/api/auth/login",
        json={"email": "missing@example.com", "password": "egal"},
    )

    assert response.status_code == 429


def test_jwt_roundtrip() -> None:
    token = create_token(42)
    payload = decode_token(token)

    assert payload["sub"] == "42"
    assert isinstance(payload["exp"], int)


def test_hash_and_verify() -> None:
    hashed = hash_password("secret")

    assert hashed != "secret"
    assert verify_password("secret", hashed)
    assert not verify_password("other", hashed)


def _make_request(token: str | None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if token is not None:
        headers.append((b"authorization", f"Bearer {token}".encode("latin-1")))
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "root_path": "",
        "headers": headers,
        "client": ("127.0.0.1", 50000),
        "server": ("testserver", 80),
    }
    return Request(scope)


def test_get_current_user_returns_user_for_valid_token() -> None:
    email = _unique_email()
    with Session(engine) as session:
        user = User(email=email, password_hash="x")
        session.add(user)
        session.commit()
        session.refresh(user)
        token = create_token(user.id)

    with Session(engine) as session:
        current = get_current_user(_make_request(token), session)

    assert current.id == user.id
    assert current.email == email


def test_get_current_user_missing_token_raises_401() -> None:
    with Session(engine) as session, pytest.raises(HTTPException) as exc_info:
        get_current_user(_make_request(None), session)

    assert exc_info.value.status_code == 401
