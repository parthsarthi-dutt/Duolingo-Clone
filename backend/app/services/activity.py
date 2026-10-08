"""Access to the per-day activity rows."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import DailyActivity, User


def get_day(db: Session, user: User, day: date) -> DailyActivity | None:
    return db.scalar(
        select(DailyActivity).where(
            DailyActivity.user_id == user.id, DailyActivity.activity_date == day
        )
    )


def get_or_create_day(db: Session, user: User, day: date) -> DailyActivity:
    row = get_day(db, user, day)
    if row is None:
        row = DailyActivity(
            user_id=user.id,
            activity_date=day,
            xp_earned=0,
            lessons_completed=0,
            perfect_lessons=0,
        )
        db.add(row)
        db.flush()
    return row
