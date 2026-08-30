from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..rate_limit import RateLimit
from ..schemas import Login, Register, Token, UserOut
from ..security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

register_rate_limit = RateLimit()
login_rate_limit = RateLimit()


def _token_response(user: User) -> Token:
    return Token(
        access_token=create_token(user.id),
        token_type="bearer",
        user=UserOut(id=user.id, email=user.email),
    )


@router.post("/register", response_model=Token, status_code=201)
def register(
    payload: Register,
    db: Session = Depends(get_db),
    _: None = Depends(register_rate_limit),
) -> Token:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=Token)
def login(
    payload: Login,
    db: Session = Depends(get_db),
    _: None = Depends(login_rate_limit),
) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return _token_response(user)
