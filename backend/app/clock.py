"""Time helpers.

Every learner carries a `day_offset` so streak / heart / quest logic can be
exercised without waiting for real days to pass (see the /api/dev endpoints).
All timestamps are naive UTC.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Protocol


class HasDayOffset(Protocol):
    day_offset: int


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def now_for(user: HasDayOffset) -> datetime:
    """Current time as this learner experiences it."""
    return utcnow() + timedelta(days=user.day_offset)


def today_for(user: HasDayOffset) -> date:
    return now_for(user).date()


def week_start(day: date) -> date:
    """Monday of the week containing `day`."""
    return day - timedelta(days=day.weekday())
