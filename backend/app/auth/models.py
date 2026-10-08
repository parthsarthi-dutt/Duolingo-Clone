"""Auth-specific database model.

Keeps a separate ``auth_accounts`` table linked to the existing ``users``
table so that the core User model stays untouched.
"""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from ..models import User


class AuthAccount(Base):
    """Credentials for a learner.  One user ↔ one auth account."""

    __tablename__ = "auth_accounts"
    __table_args__ = (UniqueConstraint("user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str | None] = mapped_column(
        String(255)
    )  # None for OAuth-only accounts
    oauth_provider: Mapped[str | None] = mapped_column(String(20))  # "google" | None
    oauth_id: Mapped[str | None] = mapped_column(
        String(255)
    )  # provider's user identifier

    user: Mapped[User] = relationship()
