from fastapi import APIRouter, HTTPException

from ..schemas import (
    OutfitCreate,
    OutfitItemAdd,
    OutfitItemReplace,
    OutfitOut,
    OutfitUpdate,
)

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


@router.post("", response_model=OutfitOut, status_code=201)
def create_outfit(payload: OutfitCreate) -> OutfitOut:
    raise HTTPException(status_code=501, detail="outfit creation is implemented by ticket #1")


@router.get("", response_model=list[OutfitOut])
def list_outfits() -> list[OutfitOut]:
    raise HTTPException(status_code=501, detail="outfit listing is implemented by ticket #1")


@router.get("/{id}", response_model=OutfitOut)
def get_outfit(id: int) -> OutfitOut:
    raise HTTPException(status_code=501, detail="outfit retrieval is implemented by ticket #1")


@router.patch("/{id}", response_model=OutfitOut)
def update_outfit(id: int, payload: OutfitUpdate) -> OutfitOut:
    raise HTTPException(status_code=501, detail="outfit update is implemented by ticket #1")


@router.delete("/{id}", status_code=204)
def delete_outfit(id: int) -> None:
    raise HTTPException(status_code=501, detail="outfit deletion is implemented by ticket #1")


@router.post("/{id}/items", response_model=OutfitOut)
def add_outfit_item(id: int, payload: OutfitItemAdd) -> OutfitOut:
    raise HTTPException(status_code=501, detail="adding an outfit item is implemented by ticket #1")


@router.delete("/{id}/items/{item_id}", response_model=OutfitOut)
def remove_outfit_item(id: int, item_id: int) -> OutfitOut:
    raise HTTPException(
        status_code=501, detail="removing an outfit item is implemented by ticket #1"
    )


@router.put("/{id}/items/{item_id}", response_model=OutfitOut)
def replace_outfit_item(id: int, item_id: int, payload: OutfitItemReplace) -> OutfitOut:
    raise HTTPException(
        status_code=501, detail="replacing an outfit item is implemented by ticket #1"
    )
