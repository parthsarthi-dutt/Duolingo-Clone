"""Auth-specific configuration, loaded from environment variables."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AuthSettings:
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 72

    # Google OAuth (optional — leave blank to disable)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)


def load_auth_settings() -> AuthSettings:
    return AuthSettings(
        jwt_secret=os.getenv("JWT_SECRET", "dev-secret-change-in-production"),
        jwt_expiry_hours=int(os.getenv("JWT_EXPIRY_HOURS", "72")),
        google_client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        google_client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
        google_redirect_uri=os.getenv(
            "GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback"
        ),
    )


auth_settings = load_auth_settings()
