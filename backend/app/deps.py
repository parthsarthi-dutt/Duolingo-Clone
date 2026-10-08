"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .errors import api_error
from .models import User

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    authorization: str | None = Header(None),
) -> User:
    """Resolve the current user from a JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise api_error(401, "unauthorized", "Authentication token is required.")

    from .auth.service import verify_token

    token = authorization.removeprefix("Bearer ").strip()
    payload = verify_token(token)
    if payload is None:
        raise api_error(
            401, "invalid_token", "Invalid or expired authentication token."
        )
    user = db.scalar(select(User).where(User.id == payload["user_id"]))
    if user is None:
        raise api_error(
            401, "user_not_found", "Authenticated user no longer exists."
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
