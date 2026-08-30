from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user as deps_get_current_user
from ..models import ClothingItem, Outfit, OutfitItem, User
from ..schemas import (
    ItemOut,
    OutfitCreate,
    OutfitItemAdd,
    OutfitItemReplace,
    OutfitOut,
    OutfitUpdate,
)

router = APIRouter(prefix="/api/outfits", tags=["outfits"])

Db = Annotated[Session, Depends(get_db)]


def get_current_user(request: Request, db: Db) -> User:
    return deps_get_current_user(request, db)


CurrentUser = Annotated[User, Depends(get_current_user)]


def _image_url(image_path: str) -> str:
    return f"/api/uploads/{Path(image_path).name}"


def _item_out(item: ClothingItem) -> ItemOut:
    return ItemOut(
        id=item.id,
        name=item.name,
        category=item.category,
        image_url=_image_url(item.image_path),
        created_at=item.created_at,
    )


def _outfit_out(outfit: Outfit) -> OutfitOut:
    items = sorted(outfit.items, key=lambda oi: oi.id)
    return OutfitOut(
        id=outfit.id,
        name=outfit.name,
        items=[_item_out(oi.item) for oi in items],
        created_at=outfit.created_at,
    )


def _owned_item(db: Session, owner_id: int, item_id: int) -> ClothingItem | None:
    return db.execute(
        select(ClothingItem).where(
            ClothingItem.id == item_id,
            ClothingItem.owner_id == owner_id,
        )
    ).scalar_one_or_none()


def _owned_outfit(db: Session, owner_id: int, outfit_id: int) -> Outfit:
    outfit = db.execute(select(Outfit).where(Outfit.id == outfit_id)).scalar_one_or_none()
    if outfit is None:
        raise HTTPException(status_code=404, detail="Outfit nicht gefunden")
    if outfit.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Zugriff verweigert")
    return outfit


@router.post("", response_model=OutfitOut, status_code=201)
def create_outfit(payload: OutfitCreate, current_user: CurrentUser, db: Db) -> OutfitOut:
    for item_id in payload.item_ids:
        if _owned_item(db, current_user.id, item_id) is None:
            raise HTTPException(
                status_code=422,
                detail="Kleidungsstück gehört nicht dem angemeldeten Nutzer",
            )
    outfit = Outfit(owner_id=current_user.id, name=payload.name)
    db.add(outfit)
    db.flush()
    for item_id in payload.item_ids:
        db.add(OutfitItem(outfit_id=outfit.id, item_id=item_id))
    db.commit()
    return _outfit_out(outfit)


@router.get("", response_model=list[OutfitOut])
def list_outfits(current_user: CurrentUser, db: Db) -> list[OutfitOut]:
    outfits = (
        db.execute(select(Outfit).where(Outfit.owner_id == current_user.id).order_by(Outfit.id))
        .scalars()
        .all()
    )
    return [_outfit_out(o) for o in outfits]


@router.get("/{id}", response_model=OutfitOut)
def get_outfit(id: int, current_user: CurrentUser, db: Db) -> OutfitOut:
    outfit = _owned_outfit(db, current_user.id, id)
    return _outfit_out(outfit)


@router.patch("/{id}", response_model=OutfitOut)
def update_outfit(id: int, payload: OutfitUpdate, current_user: CurrentUser, db: Db) -> OutfitOut:
    outfit = _owned_outfit(db, current_user.id, id)
    if payload.name is not None:
        outfit.name = payload.name
    db.commit()
    return _outfit_out(outfit)


@router.delete("/{id}", status_code=204)
def delete_outfit(id: int, current_user: CurrentUser, db: Db) -> None:
    outfit = _owned_outfit(db, current_user.id, id)
    db.delete(outfit)
    db.commit()


@router.post("/{id}/items", response_model=OutfitOut)
def add_outfit_item(
    id: int, payload: OutfitItemAdd, current_user: CurrentUser, db: Db
) -> OutfitOut:
    outfit = _owned_outfit(db, current_user.id, id)
    if _owned_item(db, current_user.id, payload.item_id) is None:
        raise HTTPException(
            status_code=422,
            detail="Kleidungsstück gehört nicht dem angemeldeten Nutzer",
        )
    db.add(OutfitItem(outfit_id=outfit.id, item_id=payload.item_id))
    db.commit()
    return _outfit_out(outfit)


@router.delete("/{id}/items/{item_id}", response_model=OutfitOut)
def remove_outfit_item(id: int, item_id: int, current_user: CurrentUser, db: Db) -> OutfitOut:
    outfit = _owned_outfit(db, current_user.id, id)
    deleted = db.execute(
        delete(OutfitItem).where(
            OutfitItem.outfit_id == outfit.id,
            OutfitItem.item_id == item_id,
        )
    ).rowcount
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht im Outfit")
    db.commit()
    return _outfit_out(outfit)


@router.put("/{id}/items/{item_id}", response_model=OutfitOut)
def replace_outfit_item(
    id: int, item_id: int, payload: OutfitItemReplace, current_user: CurrentUser, db: Db
) -> OutfitOut:
    outfit = _owned_outfit(db, current_user.id, id)
    link = db.execute(
        select(OutfitItem).where(
            OutfitItem.outfit_id == outfit.id,
            OutfitItem.item_id == item_id,
        )
    ).scalar_one_or_none()
    if link is None:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht im Outfit")
    if _owned_item(db, current_user.id, payload.new_item_id) is None:
        raise HTTPException(
            status_code=422,
            detail="Kleidungsstück gehört nicht dem angemeldeten Nutzer",
        )
    link.item_id = payload.new_item_id
    db.commit()
    return _outfit_out(outfit)
