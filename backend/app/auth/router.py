"""Authentication API endpoints.

All routes live under ``/api/auth`` and are self-contained: they do not
modify any existing business logic.
"""

import random
import time

from fastapi import APIRouter
from sqlalchemy import select

from .. import clock
from ..config import settings
from ..deps import DbSession
from ..errors import api_error
from ..models import Course, User
from .config import auth_settings
from .models import AuthAccount
from .schemas import (
    AuthResponse,
    GoogleCallbackRequest,
    LoginRequest,
    ProvidersResponse,
    RegisterRequest,
)
from .service import (
    create_token,
    exchange_google_code,
    google_login_url,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

_AVATAR_COLORS = (
    "#1CB0F6",
    "#CE82FF",
    "#FF4B4B",
    "#FF9600",
    "#58CC02",
    "#FF86D0",
    "#00CD9C",
)


def _create_user(db: DbSession, display_name: str, email: str) -> User:
    """Create a fresh learner attached to the first available course."""
    now = clock.utcnow()
    course = db.scalar(select(Course).limit(1))
    username = email.split("@")[0][:30] + "_" + str(int(time.time()) % 100_000)
    user = User(
        username=username,
        display_name=display_name.strip() or username,
        avatar_color=random.choice(_AVATAR_COLORS),
        is_bot=False,
        created_at=now,
        course_id=course.id if course else None,
        hearts=settings.max_hearts,
        hearts_updated_at=now,
        daily_goal_xp=20,
        gems=500,
    )
    db.add(user)
    db.flush()
    return user


# ── Providers ──────────────────────────────────────────────────────────────


@router.get("/providers", response_model=ProvidersResponse)
def get_providers():
    """Which sign-in methods are available."""
    return ProvidersResponse(email=True, google=auth_settings.google_enabled)


# ── Email / password ──────────────────────────────────────────────────────


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: DbSession):
    """Create a new account with email and password."""
    existing = db.scalar(
        select(AuthAccount).where(AuthAccount.email == payload.email)
    )
    if existing:
        raise api_error(
            409, "email_taken", "An account with this email already exists."
        )

    user = _create_user(db, payload.display_name, payload.email)

    db.add(
        AuthAccount(
            user_id=user.id,
            email=payload.email,
            password_hash=hash_password(payload.password),
        )
    )
    db.commit()
    return AuthResponse(
        token=create_token(user.id),
        user_id=user.id,
        display_name=user.display_name,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: DbSession):
    """Sign in with email and password."""
    account = db.scalar(
        select(AuthAccount).where(AuthAccount.email == payload.email)
    )
    if account is None or account.password_hash is None:
        raise api_error(401, "invalid_credentials", "Incorrect email or password.")
    if not verify_password(payload.password, account.password_hash):
        raise api_error(401, "invalid_credentials", "Incorrect email or password.")

    user = db.scalar(select(User).where(User.id == account.user_id))
    return AuthResponse(
        token=create_token(user.id),
        user_id=user.id,
        display_name=user.display_name,
    )


# ── Google OAuth ──────────────────────────────────────────────────────────


@router.get("/google")
def google_auth_url():
    """Return the Google OAuth authorization URL the frontend should redirect to."""
    if not auth_settings.google_enabled:
        raise api_error(
            404, "google_disabled", "Google OAuth is not configured on this server."
        )
    return {"url": google_login_url()}


@router.post("/google/callback", response_model=AuthResponse)
def google_callback(payload: GoogleCallbackRequest, db: DbSession):
    """Exchange a Google authorization code for a JWT."""
    if not auth_settings.google_enabled:
        raise api_error(
            404, "google_disabled", "Google OAuth is not configured on this server."
        )

    try:
        info = exchange_google_code(payload.code)
    except (ValueError, Exception) as exc:
        raise api_error(400, "google_exchange_failed", str(exc))

    google_id = str(info.get("id", ""))
    email = info.get("email", "")
    name = info.get("name", email.split("@")[0])

    if not email:
        raise api_error(400, "google_no_email", "Google did not return an email.")

    # Already linked via Google?
    account = db.scalar(
        select(AuthAccount).where(
            AuthAccount.oauth_provider == "google",
            AuthAccount.oauth_id == google_id,
        )
    )
    if account:
        user = db.scalar(select(User).where(User.id == account.user_id))
        return AuthResponse(
            token=create_token(user.id),
            user_id=user.id,
            display_name=user.display_name,
        )

    # Same email registered with password? Link the Google provider.
    account = db.scalar(
        select(AuthAccount).where(AuthAccount.email == email)
    )
    if account:
        account.oauth_provider = "google"
        account.oauth_id = google_id
        db.commit()
        user = db.scalar(select(User).where(User.id == account.user_id))
        return AuthResponse(
            token=create_token(user.id),
            user_id=user.id,
            display_name=user.display_name,
        )

    # Brand-new user via Google.
    user = _create_user(db, name, email)
    db.add(
        AuthAccount(
            user_id=user.id,
            email=email,
            oauth_provider="google",
            oauth_id=google_id,
        )
    )
    db.commit()
    return AuthResponse(
        token=create_token(user.id),
        user_id=user.id,
        display_name=user.display_name,
    )
