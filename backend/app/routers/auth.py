from fastapi import APIRouter, HTTPException

from ..schemas import Login, Register, Token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
def register(payload: Register) -> Token:
    raise HTTPException(status_code=501, detail="auth register is implemented by ticket #7")


@router.post("/login", response_model=Token)
def login(payload: Login) -> Token:
    raise HTTPException(status_code=501, detail="auth login is implemented by ticket #7")
