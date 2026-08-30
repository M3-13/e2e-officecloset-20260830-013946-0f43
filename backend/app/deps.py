from fastapi import HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from .models import User
from .security import decode_token

_INVALID_CREDENTIALS = "Invalid authentication credentials"


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=_INVALID_CREDENTIALS,
    )


def get_current_user(request: Request, db: Session) -> User:
    auth_header = request.headers.get("Authorization")
    if auth_header is None:
        raise _unauthorized()

    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _unauthorized()

    try:
        payload = decode_token(token)
    except JWTError:
        raise _unauthorized() from None

    sub = payload.get("sub")
    if sub is None:
        raise _unauthorized()

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise _unauthorized() from None

    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized()

    return user
