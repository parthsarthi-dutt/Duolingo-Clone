"""Creates the schema and seeds the sample course, rivals and learner.

    python -m app.seed            # seed if the database is empty
    python -m app.seed --reset    # drop everything and seed again
"""

import argparse
import random
from datetime import timedelta

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from .. import clock
from ..config import settings
from ..database import Base, SessionLocal, engine
from ..models import (
    Achievement,
    AchievementTier,
    Course,
    DailyActivity,
    Exercise,
    ExerciseAnswer,
    ExerciseAttempt,
    ExerciseChoice,
    Lesson,
    LessonSession,
    Quest,
    SessionMode,
    SessionStatus,
    Skill,
    SkillKind,
    SkillProgress,
    Unit,
    User,
)
from ..services import achievements, leaderboard
from . import content
from .builder import ExerciseFactory, ExerciseSpec

_SEED = 20240

# Bump whenever models.py changes shape (see _schema_is_stale).
SCHEMA_VERSION = 2


def _to_exercise(spec: ExerciseSpec, order_index: int) -> Exercise:
    return Exercise(
        order_index=order_index,
        type=spec.type,
        instruction=spec.instruction,
        prompt_text=spec.prompt_text,
        prompt_language=spec.prompt_language,
        prompt_translation=spec.prompt_translation,
        character=spec.character,
        is_new_word=spec.is_new_word,
        choices=[
            ExerciseChoice(
                order_index=index,
                text=choice.text,
                language=choice.language,
                image=choice.image,
                is_correct=choice.is_correct,
                pair_key=choice.pair_key,
            )
            for index, choice in enumerate(spec.choices)
        ],
        answers=[
            ExerciseAnswer(text=text, is_primary=index == 0)
            for index, text in enumerate(spec.answers)
        ],
    )


def _to_lesson(specs: list[ExerciseSpec], order_index: int) -> Lesson:
    return Lesson(
        order_index=order_index,
        xp_reward=10,
        exercises=[_to_exercise(spec, index) for index, spec in enumerate(specs)],
    )


def _seed_course(db: Session) -> Course:
    rng = random.Random(_SEED)
    course = Course(title=content.COURSE_TITLE, language_code="es", source_language_code="en")
    for unit_index, unit_spec in enumerate(content.UNITS):
        factory = ExerciseFactory(unit_spec, rng)
        unit = Unit(
            section_index=1,
            order_index=unit_index,
            title=unit_spec.title,
            description=unit_spec.description,
            color=unit_spec.color,
        )
        for skill_index, skill_spec in enumerate(unit_spec.skills):
            is_chest = skill_spec.kind == "chest"
            skill = Skill(
                order_index=skill_index,
                title=skill_spec.title,
                kind=SkillKind.CHEST if is_chest else SkillKind.LESSON,
                icon=skill_spec.icon,
                reward_gems=skill_spec.reward_gems,
            )
            if skill_spec.kind == "review":
                skill.lessons = [_to_lesson(factory.review_lesson(), 0)]
            elif not is_chest:
                skill.lessons = [
                    _to_lesson(specs, index)
                    for index, specs in enumerate(factory.skill_lessons(skill_spec))
                ]
            unit.skills.append(skill)
        course.units.append(unit)
    db.add(course)
    db.flush()
    return course


def _seed_achievements_and_quests(db: Session) -> None:
    for key, title, description, metric, icon, color, thresholds in content.ACHIEVEMENTS:
        db.add(
            Achievement(
                key=key,
                title=title,
                description=description,
                metric=metric,
                icon=icon,
                color=color,
                tiers=[
                    AchievementTier(level=level, threshold=threshold)
                    for level, threshold in enumerate(thresholds, start=1)
                ],
            )
        )
    for key, title, metric, target, reward_gems, icon in content.QUESTS:
        db.add(
            Quest(
                key=key, title=title, metric=metric, target=target, reward_gems=reward_gems, icon=icon
            )
        )


def _seed_rivals(db: Session, course: Course) -> None:
    now = clock.utcnow()
    for index, (name, color) in enumerate(content.RIVALS):
        db.add(
            User(
                username=f"rival_{index + 1}",
                display_name=name,
                avatar_color=color,
                is_bot=True,
                created_at=now - timedelta(days=30 + index),
                course_id=course.id,
                hearts=settings.max_hearts,
                hearts_updated_at=now,
            )
        )
    db.flush()
    leaderboard.ensure_bot_activity(db, now.date())


def _seed_learner(db: Session, course: Course) -> User:
    """A learner who started two days ago: one skill finished, the next one begun."""
    now = clock.utcnow()
    today = now.date()
    user = User(
        **content.LEARNER,
        is_bot=False,
        created_at=now - timedelta(days=2),
        course_id=course.id,
        hearts=settings.max_hearts,
        hearts_updated_at=now,
        daily_goal_xp=20,
    )
    db.add(user)
    db.flush()

    first_skill, second_skill = course.units[0].skills[0], course.units[0].skills[1]
    # (lesson, days ago, had no mistakes)
    history = [
        (first_skill.lessons[0], 2, True),
        (first_skill.lessons[1], 2, False),
        (first_skill.lessons[2], 1, False),
        (second_skill.lessons[0], 1, False),
    ]
    for lesson, days_ago, perfect in history:
        finished_at = now - timedelta(days=days_ago)
        xp = lesson.xp_reward + (settings.perfect_lesson_bonus_xp if perfect else 0)
        session = LessonSession(
            user_id=user.id,
            skill_id=lesson.skill_id,
            lesson_id=lesson.id,
            mode=SessionMode.LESSON,
            status=SessionStatus.COMPLETED,
            exercise_ids=[exercise.id for exercise in lesson.exercises],
            started_at=finished_at - timedelta(minutes=4),
            completed_at=finished_at,
            xp_earned=xp,
            accuracy=100 if perfect else 88,
            attempts=[
                ExerciseAttempt(exercise_id=exercise.id, is_correct=True, created_at=finished_at)
                for exercise in lesson.exercises
            ],
        )
        db.add(session)
        day = db.scalar(
            select(DailyActivity).where(
                DailyActivity.user_id == user.id,
                DailyActivity.activity_date == finished_at.date(),
            )
        )
        if day is None:
            day = DailyActivity(
                user_id=user.id,
                activity_date=finished_at.date(),
                xp_earned=0,
                lessons_completed=0,
                perfect_lessons=0,
            )
            db.add(day)
        day.xp_earned += xp
        day.lessons_completed += 1
        day.perfect_lessons += 1 if perfect else 0
        user.total_xp += xp
        db.flush()

    db.add_all(
        [
            SkillProgress(
                user_id=user.id,
                skill_id=first_skill.id,
                lessons_completed=len(first_skill.lessons),
                completed_at=now - timedelta(days=1),
            ),
            SkillProgress(user_id=user.id, skill_id=second_skill.id, lessons_completed=1),
        ]
    )
    user.streak = user.longest_streak = 2
    user.last_active_date = today - timedelta(days=1)
    db.flush()
    achievements.sync_unlocks(db, user, now)
    return user


def seed_database(db: Session) -> None:
    course = _seed_course(db)
    _seed_achievements_and_quests(db)
    _seed_rivals(db, course)
    _seed_learner(db, course)
    db.commit()


def _schema_is_stale() -> bool:
    """True when the SQLite file was created by an older version of models.py.

    There are no migrations in this project: the database only holds seeded
    demo data, so a schema change bumps SCHEMA_VERSION and the file is rebuilt.
    """
    if engine.dialect.name != "sqlite":
        return False
    with engine.connect() as connection:
        if not inspect(connection).has_table(Course.__tablename__):
            return False
        return connection.exec_driver_sql("PRAGMA user_version").scalar() != SCHEMA_VERSION


def _create_schema() -> None:
    Base.metadata.create_all(engine)
    if engine.dialect.name == "sqlite":
        with engine.begin() as connection:
            connection.exec_driver_sql(f"PRAGMA user_version = {SCHEMA_VERSION}")


def seed_if_empty() -> None:
    if _schema_is_stale():
        Base.metadata.drop_all(engine)
    _create_schema()
    with SessionLocal() as db:
        if db.scalar(select(Course.id).limit(1)) is None:
            seed_database(db)


def reset_database() -> None:
    Base.metadata.drop_all(engine)
    seed_if_empty()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Duolingo clone database.")
    parser.add_argument("--reset", action="store_true", help="drop all tables first")
    args = parser.parse_args()
    if args.reset:
        reset_database()
        print("Database reset and seeded.")
    else:
        seed_if_empty()
        print("Database ready.")


if __name__ == "__main__":
    main()
