"""Core auth operations: password hashing, JWT creation / verification, Google OAuth exchange."""

import hashlib
import hmac
import os
import time
from urllib.parse import urlencode

import jwt  # PyJWT

from .config import auth_settings

# ---------------------------------------------------------------------------
# Password hashing (PBKDF2-SHA256, stdlib only — no extra dependency needed)
# ---------------------------------------------------------------------------

_PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    """Hash *password* with a random salt using PBKDF2-SHA256."""
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ITERATIONS)
    return f"{salt.hex()}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Return ``True`` when *password* matches *stored_hash*."""
    salt_hex, key_hex = stored_hash.split("$")
    salt = bytes.fromhex(salt_hex)
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, _PBKDF2_ITERATIONS
    )
    return hmac.compare_digest(key.hex(), key_hex)


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------


def create_token(user_id: int) -> str:
    """Issue a signed JWT for *user_id*."""
    now = int(time.time())
    payload = {
        "user_id": user_id,
        "iat": now,
        "exp": now + auth_settings.jwt_expiry_hours * 3600,
    }
    return jwt.encode(
        payload, auth_settings.jwt_secret, algorithm=auth_settings.jwt_algorithm
    )


def verify_token(token: str) -> dict | None:
    """Decode and validate a JWT.  Returns the payload dict, or ``None`` on failure."""
    try:
        return jwt.decode(
            token,
            auth_settings.jwt_secret,
            algorithms=[auth_settings.jwt_algorithm],
        )
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ---------------------------------------------------------------------------
# Google OAuth helpers
# ---------------------------------------------------------------------------

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def google_login_url() -> str:
    """Build the Google OAuth2 authorization URL."""
    params = {
        "client_id": auth_settings.google_client_id,
        "redirect_uri": auth_settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"{_GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_google_code(code: str) -> dict:
    """Exchange a Google authorization *code* for user info.

    Returns a dict with ``email``, ``name`` and ``id`` from Google.
    Raises ``ValueError`` on any failure.
    """
    import httpx

    with httpx.Client(timeout=10) as client:
        token_resp = client.post(
            _GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": auth_settings.google_client_id,
                "client_secret": auth_settings.google_client_secret,
                "redirect_uri": auth_settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise ValueError(f"Google token exchange failed: {token_resp.text}")
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise ValueError("No access_token in Google response")

        info_resp = client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if info_resp.status_code != 200:
            raise ValueError(f"Google userinfo failed: {info_resp.text}")
        return info_resp.json()
