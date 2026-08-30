from typing import Annotated, get_args

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import storage
from ..db import get_db
from ..deps import get_current_user
from ..models import ClothingItem, User
from ..schemas import Category, ItemOut, ItemUpdate

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])

VALID_CATEGORIES = frozenset(get_args(Category))


def _get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Resolve the current user, wiring in the ``get_db`` dependency.

    The auth ticket's ``deps.get_current_user(request, db)`` is not yet wired
    with ``Depends(get_db)`` in the skeleton stub, so a plain
    ``Depends(get_current_user)`` fails at route registration. This local shim
    keeps the shared contract while staying inside this ticket's own files.
    """
    return get_current_user(request, db)


def _to_item_out(item: ClothingItem) -> ItemOut:
    return ItemOut(
        id=item.id,
        name=item.name,
        category=item.category,
        image_url=f"/api/uploads/{item.image_path}",
        created_at=item.created_at,
    )


def _get_owned_item(db: Session, item_id: int, current_user: User) -> ClothingItem:
    item = db.get(ClothingItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Zugriff auf fremdes Kleidungsstück verweigert")
    return item


@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(
    name: Annotated[str, Form()],
    category: Annotated[str, Form()],
    image: Annotated[UploadFile, File()],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(_get_current_user)],
) -> ItemOut:
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="Ungültige Kategorie")
    filename = storage.save_image(image)
    item = ClothingItem(
        owner_id=current_user.id,
        name=name,
        category=category,
        image_path=filename,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_item_out(item)


@router.get("/items", response_model=list[ItemOut])
def list_items(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(_get_current_user)],
    category: str | None = None,
) -> list[ItemOut]:
    stmt = select(ClothingItem).where(ClothingItem.owner_id == current_user.id)
    if category is not None:
        stmt = stmt.where(ClothingItem.category == category)
    items = db.scalars(stmt.order_by(ClothingItem.id)).all()
    return [_to_item_out(item) for item in items]


@router.patch("/items/{id}", response_model=ItemOut)
def update_item(
    id: int,
    payload: ItemUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(_get_current_user)],
) -> ItemOut:
    item = _get_owned_item(db, id, current_user)
    if payload.name is not None:
        item.name = payload.name
    if payload.category is not None:
        item.category = payload.category
    db.commit()
    db.refresh(item)
    return _to_item_out(item)


@router.delete("/items/{id}", status_code=204)
def delete_item(
    id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(_get_current_user)],
) -> None:
    item = _get_owned_item(db, id, current_user)
    storage.delete_image(item.image_path)
    db.delete(item)
    db.commit()
