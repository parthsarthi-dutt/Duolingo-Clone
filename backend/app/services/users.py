"""Builds the learner summary that most screens render from."""

from sqlalchemy.orm import Session

from .. import clock
from ..models import User
from ..schemas import CourseOut, DailyGoalOut, UserOut
from . import activity, hearts, streak


def summary(db: Session, user: User) -> UserOut:
    now = clock.now_for(user)
    today = now.date()
    hearts.sync(user, now)
    day = activity.get_day(db, user, today)
    return UserOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_color=user.avatar_color,
        joined_at=user.created_at,
        course=CourseOut.model_validate(user.course),
        total_xp=user.total_xp,
        gems=user.gems,
        hearts=hearts.snapshot(user, now),
        streak=streak.snapshot(db, user, today),
        daily_goal=DailyGoalOut(target=user.daily_goal_xp, earned=day.xp_earned if day else 0),
        league=user.league,
        today=today,
    )
