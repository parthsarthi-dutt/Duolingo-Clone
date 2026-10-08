"""Runtime configuration, read once from environment variables."""

import os
from dataclasses import dataclass
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _load_env_file(path: Path) -> None:
    """Apply KEY=VALUE lines from backend/.env without overriding real environment variables."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.strip().partition("=")
        if separator and key and not key.startswith("#"):
            os.environ.setdefault(key.strip(), value.strip())


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: list[str]
    cors_origin_regex: str | None

    # Hearts
    max_hearts: int = 5
    heart_regen_minutes: int = 240
    heart_refill_cost: int = 450

    # XP
    perfect_lesson_bonus_xp: int = 5
    practice_xp: int = 5
    practice_exercise_count: int = 8

    # Legendary challenge: an extra-hard replay of a finished skill
    legendary_xp: int = 40
    legendary_exercise_count: int = 10
    legendary_mistakes_allowed: int = 3

    # Timed practice: a practice set against the clock
    timed_xp: int = 20
    timed_seconds: int = 120

    # Leaderboard
    league_promotion_slots: int = 5


def load_settings() -> Settings:
    _load_env_file(BACKEND_DIR / ".env")
    default_db = f"sqlite:///{(BACKEND_DIR / 'duolingo.db').as_posix()}"
    return Settings(
        database_url=os.getenv("DATABASE_URL", default_db),
        cors_origins=_split(
            os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        ),
        cors_origin_regex=os.getenv("CORS_ORIGIN_REGEX") or None,
        heart_regen_minutes=int(os.getenv("HEART_REGEN_MINUTES", "240")),
    )


settings = load_settings()
