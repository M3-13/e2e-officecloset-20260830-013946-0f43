import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import ClothingItem, User
from app.routers.outfits import get_current_user

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


def _add_item(db: Session, owner_id: int, name: str, category: str = "kleid") -> ClothingItem:
    item = ClothingItem(
        owner_id=owner_id,
        name=name,
        category=category,
        image_path=f"uploads/{name}.jpg",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


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


def test_create_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    item = _add_item(db, owner.id, "Abendkleid")
    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/outfits", json={"name": "Gala", "item_ids": [item.id]})

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Gala"
    assert [i["id"] for i in data["items"]] == [item.id]
    assert data["items"][0]["category"] == "kleid"
    assert data["items"][0]["image_url"] == "/api/uploads/Abendkleid.jpg"
    assert "created_at" in data


def test_create_outfit_rejects_foreign_item(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    other = _add_user(db, "other@example.com")
    foreign = _add_item(db, other.id, "Fremdes Teil")
    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/outfits", json={"name": "Gala", "item_ids": [foreign.id]})

    assert response.status_code == 422


def test_list_outfits_returns_only_own(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    other = _add_user(db, "other@example.com")
    app.dependency_overrides[get_current_user] = lambda: owner
    client.post("/api/outfits", json={"name": "Own", "item_ids": []})

    app.dependency_overrides[get_current_user] = lambda: other
    client.post("/api/outfits", json={"name": "Other", "item_ids": []})

    app.dependency_overrides[get_current_user] = lambda: owner
    response = client.get("/api/outfits")

    assert response.status_code == 200
    assert [o["name"] for o in response.json()] == ["Own"]


def test_get_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    item = _add_item(db, owner.id, "Abendkleid")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Gala", "item_ids": [item.id]}).json()[
        "id"
    ]

    response = client.get(f"/api/outfits/{outfit_id}")

    assert response.status_code == 200
    assert response.json()["name"] == "Gala"
    assert [i["id"] for i in response.json()["items"]] == [item.id]


def test_rename_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Alt", "item_ids": []}).json()["id"]

    response = client.patch(f"/api/outfits/{outfit_id}", json={"name": "Neu"})

    assert response.status_code == 200
    assert response.json()["name"] == "Neu"


def test_delete_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Weg", "item_ids": []}).json()["id"]

    response = client.delete(f"/api/outfits/{outfit_id}")

    assert response.status_code == 204
    assert client.get(f"/api/outfits/{outfit_id}").status_code == 404


def test_add_item_to_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    item = _add_item(db, owner.id, "Schuhe", category="schuhe")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Gala", "item_ids": []}).json()["id"]

    response = client.post(f"/api/outfits/{outfit_id}/items", json={"item_id": item.id})

    assert response.status_code == 200
    assert [i["id"] for i in response.json()["items"]] == [item.id]


def test_add_foreign_item_rejected(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    other = _add_user(db, "other@example.com")
    foreign = _add_item(db, other.id, "Fremd")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Gala", "item_ids": []}).json()["id"]

    response = client.post(f"/api/outfits/{outfit_id}/items", json={"item_id": foreign.id})

    assert response.status_code == 422


def test_remove_item_from_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    item = _add_item(db, owner.id, "Teil")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Gala", "item_ids": [item.id]}).json()[
        "id"
    ]

    response = client.delete(f"/api/outfits/{outfit_id}/items/{item.id}")

    assert response.status_code == 200
    assert response.json()["items"] == []


def test_replace_item_in_outfit(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    old = _add_item(db, owner.id, "Alt")
    new = _add_item(db, owner.id, "Neu", category="hose")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Gala", "item_ids": [old.id]}).json()[
        "id"
    ]

    response = client.put(
        f"/api/outfits/{outfit_id}/items/{old.id}",
        json={"new_item_id": new.id},
    )

    assert response.status_code == 200
    assert [i["id"] for i in response.json()["items"]] == [new.id]


def test_replace_with_foreign_item_rejected(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    other = _add_user(db, "other@example.com")
    old = _add_item(db, owner.id, "Alt")
    foreign = _add_item(db, other.id, "Fremd")
    app.dependency_overrides[get_current_user] = lambda: owner
    outfit_id = client.post("/api/outfits", json={"name": "Gala", "item_ids": [old.id]}).json()[
        "id"
    ]

    response = client.put(
        f"/api/outfits/{outfit_id}/items/{old.id}",
        json={"new_item_id": foreign.id},
    )

    assert response.status_code == 422


def test_foreign_outfit_access_forbidden(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    other = _add_user(db, "other@example.com")
    app.dependency_overrides[get_current_user] = lambda: other
    outfit_id = client.post("/api/outfits", json={"name": "Geheim", "item_ids": []}).json()["id"]

    app.dependency_overrides[get_current_user] = lambda: owner

    assert client.get(f"/api/outfits/{outfit_id}").status_code == 403
    assert client.patch(f"/api/outfits/{outfit_id}", json={"name": "Hack"}).status_code == 403
    assert client.delete(f"/api/outfits/{outfit_id}").status_code == 403


def test_get_nonexistent_outfit_404(client: TestClient, db: Session) -> None:
    owner = _add_user(db, "owner@example.com")
    app.dependency_overrides[get_current_user] = lambda: owner

    assert client.get("/api/outfits/999").status_code == 404
