from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..schemas import ItemOut, ItemUpdate

router = APIRouter(prefix="/api/wardrobe", tags=["wardrobe"])


@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(
    name: Annotated[str, Form()],
    category: Annotated[str, Form()],
    image: Annotated[UploadFile, File()],
) -> ItemOut:
    raise HTTPException(status_code=501, detail="wardrobe creation is implemented by ticket #8")


@router.get("/items", response_model=list[ItemOut])
def list_items(category: str | None = None) -> list[ItemOut]:
    raise HTTPException(status_code=501, detail="wardrobe listing is implemented by ticket #8")


@router.patch("/items/{id}", response_model=ItemOut)
def update_item(id: int, payload: ItemUpdate) -> ItemOut:
    raise HTTPException(status_code=501, detail="wardrobe update is implemented by ticket #8")


@router.delete("/items/{id}", status_code=204)
def delete_item(id: int) -> None:
    raise HTTPException(status_code=501, detail="wardrobe deletion is implemented by ticket #8")
