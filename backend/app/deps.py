from fastapi import Request
from sqlalchemy.orm import Session

from .models import User


def get_current_user(request: Request, db: Session) -> User:
    raise NotImplementedError("get_current_user is implemented by the auth ticket")
