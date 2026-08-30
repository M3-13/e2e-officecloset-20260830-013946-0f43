from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_only_configured_origin_without_credentials() -> None:
    with TestClient(app) as client:
        response = client.get(
            "/api/health",
            headers={"Origin": "http://localhost:5173"},
        )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-credentials" not in response.headers


def test_cors_rejects_unconfigured_origin() -> None:
    with TestClient(app) as client:
        response = client.get(
            "/api/health",
            headers={"Origin": "http://evil.example.com"},
        )

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
