"""Tiered achievements. Each one tracks a single lifetime metric of the learner."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import (
    Achievement,
    DailyActivity,
    Skill,
    SkillKind,
    SkillProgress,
    User,
    UserAchievement,
)
from ..schemas import AchievementOut, AchievementUnlockOut


def metric_values(db: Session, user: User) -> dict[str, int]:
    lessons, perfect = db.execute(
        select(
            func.coalesce(func.sum(DailyActivity.lessons_completed), 0),
            func.coalesce(func.sum(DailyActivity.perfect_lessons), 0),
        ).where(DailyActivity.user_id == user.id)
    ).one()
    skills = db.scalar(
        select(func.count())
        .select_from(SkillProgress)
        .join(Skill, Skill.id == SkillProgress.skill_id)
        .where(
            SkillProgress.user_id == user.id,
            SkillProgress.completed_at.is_not(None),
            Skill.kind == SkillKind.LESSON,
        )
    )
    legendary = db.scalar(
        select(func.count())
        .select_from(SkillProgress)
        .where(SkillProgress.user_id == user.id, SkillProgress.legendary_at.is_not(None))
    )
    return {
        "streak": max(user.streak, user.longest_streak),
        "total_xp": user.total_xp,
        "lessons": int(lessons),
        "perfect_lessons": int(perfect),
        "skills": int(skills or 0),
        "legendary_skills": int(legendary or 0),
    }


def _level_reached(achievement: Achievement, value: int) -> int:
    return sum(1 for tier in achievement.tiers if value >= tier.threshold)


def list_achievements(db: Session, user: User) -> list[AchievementOut]:
    values = metric_values(db, user)
    result = []
    for achievement in db.scalars(select(Achievement).order_by(Achievement.id)):
        value = values[achievement.metric]
        level = _level_reached(achievement, value)
        max_level = len(achievement.tiers)
        maxed = level >= max_level
        # Show the tier being worked on (or the last one once everything is unlocked).
        target = achievement.tiers[min(level, max_level - 1)].threshold
        result.append(
            AchievementOut(
                key=achievement.key,
                title=achievement.title,
                description=achievement.description.format(target=target),
                icon=achievement.icon,
                color=achievement.color,
                level=level,
                max_level=max_level,
                progress=min(value, target),
                target=target,
                maxed=maxed,
            )
        )
    return result


def sync_unlocks(db: Session, user: User, now: datetime) -> list[AchievementUnlockOut]:
    """Persist newly reached tiers and return them so the UI can celebrate."""
    values = metric_values(db, user)
    owned = {
        row.achievement_id: row
        for row in db.scalars(select(UserAchievement).where(UserAchievement.user_id == user.id))
    }
    unlocked = []
    for achievement in db.scalars(select(Achievement).order_by(Achievement.id)):
        level = _level_reached(achievement, values[achievement.metric])
        row = owned.get(achievement.id)
        if level <= (row.level if row else 0):
            continue
        if row is None:
            db.add(
                UserAchievement(
                    user_id=user.id, achievement_id=achievement.id, level=level, unlocked_at=now
                )
            )
        else:
            row.level, row.unlocked_at = level, now
        unlocked.append(
            AchievementUnlockOut(
                key=achievement.key,
                title=achievement.title,
                level=level,
                icon=achievement.icon,
                color=achievement.color,
            )
        )
    return unlocked
