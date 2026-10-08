"""Streak rules: one qualifying activity per calendar day keeps the streak alive."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..clock import week_start
from ..models import DailyActivity, User
from ..schemas import StreakDayOut, StreakOut

_DAY_LABELS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"]


def current(user: User, today: date) -> int:
    """The streak as of `today`; a fully missed day means it is already lost."""
    if user.last_active_date is None:
        return 0
    if (today - user.last_active_date).days > 1:
        return 0
    return user.streak


def is_active_today(user: User, today: date) -> bool:
    return user.last_active_date == today


def record_activity(user: User, today: date) -> bool:
    """Count today's first completed lesson. Returns True if the streak grew."""
    if is_active_today(user, today):
        return False
    user.streak = current(user, today) + 1
    user.longest_streak = max(user.longest_streak, user.streak)
    user.last_active_date = today
    return True


def snapshot(db: Session, user: User, today: date) -> StreakOut:
    monday = week_start(today)
    week_days = [monday + timedelta(days=i) for i in range(7)]
    active_days = set(
        db.scalars(
            select(DailyActivity.activity_date).where(
                DailyActivity.user_id == user.id,
                DailyActivity.activity_date >= monday,
                DailyActivity.lessons_completed > 0,
            )
        )
    )
    return StreakOut(
        count=current(user, today),
        longest=user.longest_streak,
        active_today=is_active_today(user, today),
        week=[
            StreakDayOut(
                date=day,
                label=_DAY_LABELS[day.weekday()],
                active=day in active_days,
                is_today=day == today,
            )
            for day in week_days
        ],
    )
