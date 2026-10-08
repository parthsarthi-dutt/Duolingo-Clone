from fastapi import APIRouter

from ..deps import CurrentUser, DbSession
from ..schemas import ProfileOut, ProfileStatsOut, UserOut, UserUpdate
from ..services import achievements, leaderboard, users

router = APIRouter(prefix="/api", tags=["learner"])


@router.get("/me", response_model=UserOut)
def get_me(db: DbSession, user: CurrentUser):
    """Learner summary: hearts (with regeneration applied), streak, XP, gems, daily goal."""
    result = users.summary(db, user)
    db.commit()  # persists lazily regenerated hearts
    return result


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: DbSession, user: CurrentUser):
    if payload.display_name is not None:
        user.display_name = payload.display_name.strip() or user.display_name
    if payload.avatar_color is not None:
        user.avatar_color = payload.avatar_color
    if payload.daily_goal_xp is not None:
        user.daily_goal_xp = payload.daily_goal_xp
    result = users.summary(db, user)
    db.commit()
    return result


@router.get("/profile", response_model=ProfileOut)
def get_profile(db: DbSession, user: CurrentUser):
    """Profile page data: summary, lifetime statistics and achievements."""
    values = achievements.metric_values(db, user)
    board = leaderboard.build(db, user)
    result = ProfileOut(
        user=users.summary(db, user),
        stats=ProfileStatsOut(
            lessons_completed=values["lessons"],
            perfect_lessons=values["perfect_lessons"],
            skills_completed=values["skills"],
            league_rank=board.my_rank,
        ),
        achievements=achievements.list_achievements(db, user),
    )
    db.commit()
    return result
