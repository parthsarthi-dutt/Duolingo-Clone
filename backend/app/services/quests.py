"""Daily quests. Progress is read from today's activity row; rewards pay out once."""

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import clock
from ..models import DailyActivity, Quest, QuestCompletion, User
from ..schemas import QuestOut, QuestRewardOut, QuestsOut
from . import activity

_METRIC_COLUMNS = {
    "xp": "xp_earned",
    "lessons": "lessons_completed",
    "perfect_lessons": "perfect_lessons",
}


def _target(quest: Quest, user: User) -> int:
    # The XP quest doubles as the daily-goal indicator, so it follows the learner's goal.
    return quest.target if quest.target is not None else user.daily_goal_xp


def _progress(quest: Quest, day: DailyActivity | None) -> int:
    return getattr(day, _METRIC_COLUMNS[quest.metric]) if day else 0


def _completed_ids(db: Session, user: User, today: date) -> set[int]:
    return set(
        db.scalars(
            select(QuestCompletion.quest_id).where(
                QuestCompletion.user_id == user.id, QuestCompletion.quest_date == today
            )
        )
    )


def _hours_until_reset(now: datetime) -> int:
    midnight = datetime.combine(now.date() + timedelta(days=1), datetime.min.time())
    return max(1, round((midnight - now).total_seconds() / 3600))


def list_quests(db: Session, user: User) -> QuestsOut:
    now = clock.now_for(user)
    day = activity.get_day(db, user, now.date())
    done = _completed_ids(db, user, now.date())
    quests = []
    for quest in db.scalars(select(Quest).order_by(Quest.id)):
        target = _target(quest, user)
        quests.append(
            QuestOut(
                key=quest.key,
                title=quest.title.format(target=target),
                icon=quest.icon,
                progress=min(_progress(quest, day), target),
                target=target,
                completed=quest.id in done or _progress(quest, day) >= target,
                reward_gems=quest.reward_gems,
            )
        )
    return QuestsOut(hours_left=_hours_until_reset(now), quests=quests)


def award_completed(db: Session, user: User, now: datetime) -> list[QuestRewardOut]:
    """Pay out any quest whose target was just reached. Called after a lesson."""
    today = now.date()
    day = activity.get_day(db, user, today)
    done = _completed_ids(db, user, today)
    rewards = []
    for quest in db.scalars(select(Quest).order_by(Quest.id)):
        target = _target(quest, user)
        if quest.id in done or _progress(quest, day) < target:
            continue
        db.add(
            QuestCompletion(
                user_id=user.id, quest_id=quest.id, quest_date=today, completed_at=now
            )
        )
        user.gems += quest.reward_gems
        rewards.append(
            QuestRewardOut(title=quest.title.format(target=target), reward_gems=quest.reward_gems)
        )
    return rewards
