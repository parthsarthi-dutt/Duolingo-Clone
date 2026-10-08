"""Developer tools for exercising time-based mechanics without waiting.

These exist so streaks, heart regeneration and daily quests can be
demonstrated and tested; a production deployment would not expose them.
"""

from fastapi import APIRouter

from ..database import SessionLocal
from ..deps import CurrentUser, DbSession, get_current_user
from ..schemas import AdvanceDayIn, UserOut
from ..seed.run import reset_database
from ..services import users

router = APIRouter(prefix="/api/dev", tags=["developer tools"])


@router.post("/advance-day", response_model=UserOut)
def advance_day(payload: AdvanceDayIn, db: DbSession, user: CurrentUser):
    """Move this learner's clock forward. 1 day keeps a streak alive; 2+ breaks it."""
    user.day_offset += payload.days
    result = users.summary(db, user)
    db.commit()
    return result


@router.post("/reset", response_model=UserOut)
def reset_progress():
    """Wipe everything and re-seed the sample course and learner."""
    reset_database()
    with SessionLocal() as db:
        result = users.summary(db, get_current_user(db))
        db.commit()
    return result
