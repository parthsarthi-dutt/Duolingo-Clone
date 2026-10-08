"""Hearts: lost on mistakes, regenerated lazily over time.

Regeneration is computed on read from `hearts_updated_at` (the moment the
current regen interval started) rather than by a background job.
"""

from datetime import datetime, timedelta

from ..config import settings
from ..models import User
from ..schemas import HeartsOut


def _interval() -> timedelta:
    return timedelta(minutes=settings.heart_regen_minutes)


def sync(user: User, now: datetime) -> None:
    """Credit any hearts that regenerated since the last sync."""
    if user.hearts >= settings.max_hearts:
        return
    gained = int((now - user.hearts_updated_at) / _interval())
    if gained <= 0:
        return
    user.hearts = min(settings.max_hearts, user.hearts + gained)
    # Keep the remainder of the running interval so partial progress isn't lost.
    user.hearts_updated_at += gained * _interval()


def lose(user: User, now: datetime) -> None:
    sync(user, now)
    if user.hearts <= 0:
        return
    if user.hearts >= settings.max_hearts:
        user.hearts_updated_at = now  # regen timer starts with the first lost heart
    user.hearts -= 1


def gain(user: User, now: datetime, amount: int = 1) -> int:
    """Add hearts up to the cap; returns how many were actually added."""
    sync(user, now)
    added = min(amount, settings.max_hearts - user.hearts)
    user.hearts += max(added, 0)
    return max(added, 0)


def refill(user: User, now: datetime) -> None:
    user.hearts = settings.max_hearts
    user.hearts_updated_at = now


def snapshot(user: User, now: datetime) -> HeartsOut:
    seconds_to_next = None
    if user.hearts < settings.max_hearts:
        remaining = user.hearts_updated_at + _interval() - now
        seconds_to_next = max(int(remaining.total_seconds()), 0)
    return HeartsOut(
        current=user.hearts,
        max=settings.max_hearts,
        seconds_to_next=seconds_to_next,
        refill_cost=settings.heart_refill_cost,
    )
