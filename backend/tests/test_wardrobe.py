from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings
from app.db import Base, get_db
from app.main import app
from app.models import User
from app.routers.wardrobe import _get_current_user
from app.storage import MAX_UPLOAD_SIZE_BYTES


def _jpeg_bytes(exif: bool = True) -> bytes:
    img = Image.new("RGB", (20, 20), color=(200, 30, 30))
    buf = BytesIO()
    if exif:
        exif_data = Image.Exif()
        exif_data[0x010F] = "TestMake"
        exif_data[0x0110] = "TestModel"
        img.save(buf, format="JPEG", exif=exif_data)
    else:
        img.save(buf, format="JPEG")
    return buf.getvalue()


def _png_bytes() -> bytes:
    img = Image.new("RGBA", (20, 20), color=(0, 128, 0, 255))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _webp_bytes() -> bytes:
    img = Image.new("RGB", (20, 20), color=(0, 0, 200))
    buf = BytesIO()
    img.save(buf, format="WEBP")
    return buf.getvalue()


def _gif_bytes() -> bytes:
    img = Image.new("P", (20, 20))
    buf = BytesIO()
    img.save(buf, format="GIF")
    return buf.getvalue()


@pytest.fixture()
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def session_factory(engine):
    return sessionmaker(bind=engine)


@pytest.fixture()
def make_user(session_factory):
    def _make(email: str = "a@example.com") -> User:
        db = session_factory()
        try:
            user = User(email=email, password_hash="x")
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        finally:
            db.close()

    return _make


@pytest.fixture()
def current_user_holder():
    return {}


@pytest.fixture()
def client(session_factory, current_user_holder, tmp_path, monkeypatch):
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    get_settings.cache_clear()

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    def override_get_current_user() -> User:
        return current_user_holder["user"]

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[_get_current_user] = override_get_current_user

    yield TestClient(app)

    app.dependency_overrides.clear()
    get_settings.cache_clear()


def _create_item(client: TestClient, name: str = "Bluse", category: str = "oberteil"):
    return client.post(
        "/api/wardrobe/items",
        data={"name": name, "category": category},
        files={"image": ("bluse.jpg", _jpeg_bytes(), "image/jpeg")},
    )


def test_create_item_returns_201_with_image_url(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()
    response = _create_item(client)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Bluse"
    assert data["category"] == "oberteil"
    assert data["image_url"].startswith("/api/uploads/")
    assert "created_at" in data


def test_list_items_returns_only_own_items(client, make_user, current_user_holder):
    user = make_user("a@example.com")
    other = make_user("b@example.com")

    current_user_holder["user"] = user
    _create_item(client, "Bluse", "oberteil")
    _create_item(client, "Hose", "hose")

    current_user_holder["user"] = other
    _create_item(client, "Fremdes Kleid", "kleid")

    current_user_holder["user"] = user
    response = client.get("/api/wardrobe/items")

    assert response.status_code == 200
    names = {item["name"] for item in response.json()}
    assert names == {"Bluse", "Hose"}


def test_list_items_filters_by_category(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()
    _create_item(client, "Bluse", "oberteil")
    _create_item(client, "Hose", "hose")
    _create_item(client, "Kleid", "kleid")

    response = client.get("/api/wardrobe/items", params={"category": "oberteil"})

    assert response.status_code == 200
    items = response.json()
    assert [item["name"] for item in items] == ["Bluse"]


def test_update_item_changes_name_and_category(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()
    item = _create_item(client).json()

    response = client.patch(
        f"/api/wardrobe/items/{item['id']}",
        json={"name": "Neue Bluse", "category": "kleid"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Neue Bluse"
    assert data["category"] == "kleid"
    assert data["id"] == item["id"]


def test_delete_item_removes_row_and_image(client, make_user, current_user_holder, tmp_path):
    current_user_holder["user"] = make_user()
    item = _create_item(client).json()
    filename = item["image_url"].split("/")[-1]
    stored = tmp_path / "uploads" / filename
    assert stored.is_file()

    response = client.delete(f"/api/wardrobe/items/{item['id']}")

    assert response.status_code == 204
    assert not stored.exists()
    remaining = client.get("/api/wardrobe/items").json()
    assert remaining == []


def test_foreign_access_is_forbidden(client, make_user, current_user_holder):
    owner = make_user("a@example.com")
    intruder = make_user("b@example.com")

    current_user_holder["user"] = owner
    item = _create_item(client).json()

    current_user_holder["user"] = intruder
    patch_response = client.patch(f"/api/wardrobe/items/{item['id']}", json={"name": "geklaut"})
    delete_response = client.delete(f"/api/wardrobe/items/{item['id']}")

    assert patch_response.status_code == 403
    assert delete_response.status_code == 403


def test_update_missing_item_returns_404(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    response = client.patch("/api/wardrobe/items/999", json={"name": "x"})

    assert response.status_code == 404


def test_invalid_image_returns_400(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    response = client.post(
        "/api/wardrobe/items",
        data={"name": "Kaputt", "category": "oberteil"},
        files={"image": ("kaputt.jpg", b"kein bild", "image/jpeg")},
    )

    assert response.status_code == 400


def test_unsupported_format_returns_400(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    response = client.post(
        "/api/wardrobe/items",
        data={"name": "Gif", "category": "oberteil"},
        files={"image": ("bild.gif", _gif_bytes(), "image/gif")},
    )

    assert response.status_code == 400


def test_invalid_category_returns_400(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    response = client.post(
        "/api/wardrobe/items",
        data={"name": "Bluse", "category": "unsinn"},
        files={"image": ("bluse.jpg", _jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 400


def test_oversized_image_returns_413(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()
    big = b"x" * (MAX_UPLOAD_SIZE_BYTES + 1)

    response = client.post(
        "/api/wardrobe/items",
        data={"name": "Riesig", "category": "oberteil"},
        files={"image": ("riesig.jpg", big, "image/jpeg")},
    )

    assert response.status_code == 413


def test_exif_metadata_is_stripped(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    response = client.post(
        "/api/wardrobe/items",
        data={"name": "Mit EXIF", "category": "oberteil"},
        files={"image": ("mit-exif.jpg", _jpeg_bytes(exif=True), "image/jpeg")},
    )
    assert response.status_code == 201
    image_url = response.json()["image_url"]

    served = client.get(image_url)
    assert served.status_code == 200

    img = Image.open(BytesIO(served.content))
    assert "exif" not in img.info
    assert len(img.getexif()) == 0


def test_serve_upload_unknown_file_returns_404(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    response = client.get("/api/uploads/gibt-es-nicht.jpg")

    assert response.status_code == 404


def test_accepts_png_and_webp(client, make_user, current_user_holder):
    current_user_holder["user"] = make_user()

    png = client.post(
        "/api/wardrobe/items",
        data={"name": "Png", "category": "schuhe"},
        files={"image": ("bild.png", _png_bytes(), "image/png")},
    )
    webp = client.post(
        "/api/wardrobe/items",
        data={"name": "Webp", "category": "schuhe"},
        files={"image": ("bild.webp", _webp_bytes(), "image/webp")},
    )

    assert png.status_code == 201
    assert webp.status_code == 201
