from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

Category = Literal["oberteil", "hose", "kleid", "schuhe", "accessoire"]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class Register(BaseModel):
    email: str
    password: str


class Login(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    image_url: str
    created_at: datetime


class ItemUpdate(BaseModel):
    name: str | None = None
    category: Category | None = None


class OutfitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    items: list[ItemOut]
    created_at: datetime


class OutfitCreate(BaseModel):
    name: str
    item_ids: list[int]


class OutfitUpdate(BaseModel):
    name: str | None = None


class OutfitItemAdd(BaseModel):
    item_id: int


class OutfitItemReplace(BaseModel):
    new_item_id: int
