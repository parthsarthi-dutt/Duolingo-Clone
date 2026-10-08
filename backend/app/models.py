"""Database schema.

Two groups of tables:

* Course content (seeded, read-only at runtime):
    courses -> units -> skills -> lessons -> exercises -> choices / answers
* Learner state (written as the learner plays):
    users, skill_progress, lesson_sessions -> exercise_attempts,
    daily_activity, achievements / achievement_tiers / user_achievements,
    quests / quest_completions
"""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class SkillKind(StrEnum):
    LESSON = "lesson"
    CHEST = "chest"


class ExerciseType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    WORD_BANK = "word_bank"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class SessionMode(StrEnum):
    LESSON = "lesson"  # the next lesson of a skill: costs hearts, moves the path forward
    PRACTICE = "practice"  # risk-free review: earns a heart back
    LEGENDARY = "legendary"  # extra-hard replay of a finished skill with limited mistakes
    TIMED = "timed"  # practice against the clock


class SessionStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    FAILED = "failed"  # a challenge that ran out of mistakes or time


# --------------------------------------------------------------------------
# Course content
# --------------------------------------------------------------------------


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(80))
    language_code: Mapped[str] = mapped_column(String(8))  # language being learned
    source_language_code: Mapped[str] = mapped_column(String(8))  # learner's language

    units: Mapped[list[Unit]] = relationship(
        back_populates="course", order_by="Unit.order_index", cascade="all, delete-orphan"
    )


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = (UniqueConstraint("course_id", "order_index"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    section_index: Mapped[int] = mapped_column(Integer, default=1)
    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(255), default="")
    color: Mapped[str] = mapped_column(String(20), default="green")  # theme key used by the UI

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list[Skill]] = relationship(
        back_populates="unit", order_by="Skill.order_index", cascade="all, delete-orphan"
    )


class Skill(Base):
    """One node on the learning path: a set of lessons, or a reward chest."""

    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("unit_id", "order_index"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"))
    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    kind: Mapped[str] = mapped_column(String(20), default=SkillKind.LESSON)
    icon: Mapped[str] = mapped_column(String(20), default="star")
    reward_gems: Mapped[int] = mapped_column(Integer, default=0)  # chests only

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list[Lesson]] = relationship(
        back_populates="skill", order_by="Lesson.order_index", cascade="all, delete-orphan"
    )


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("skill_id", "order_index"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    order_index: Mapped[int] = mapped_column(Integer)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list[Exercise]] = relationship(
        back_populates="lesson", order_by="Exercise.order_index", cascade="all, delete-orphan"
    )


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (UniqueConstraint("lesson_id", "order_index"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    order_index: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(30))
    instruction: Mapped[str] = mapped_column(String(255))  # "Write this in English"
    prompt_text: Mapped[str | None] = mapped_column(Text)  # sentence shown / spoken
    prompt_language: Mapped[str | None] = mapped_column(String(8))
    prompt_translation: Mapped[str | None] = mapped_column(Text)  # helper line for fill-blank
    character: Mapped[str | None] = mapped_column(String(20))  # speaker illustration key
    is_new_word: Mapped[bool] = mapped_column(Boolean, default=False)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
    choices: Mapped[list[ExerciseChoice]] = relationship(
        back_populates="exercise",
        order_by="ExerciseChoice.order_index",
        cascade="all, delete-orphan",
    )
    answers: Mapped[list[ExerciseAnswer]] = relationship(
        back_populates="exercise", order_by="ExerciseAnswer.id", cascade="all, delete-orphan"
    )


class ExerciseChoice(Base):
    """A selectable item: an option, a word-bank token, or one half of a pair."""

    __tablename__ = "exercise_choices"

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(String(255))
    language: Mapped[str | None] = mapped_column(String(8))
    image: Mapped[str | None] = mapped_column(String(40))
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    pair_key: Mapped[str | None] = mapped_column(String(80))  # match-pairs: equal keys match

    exercise: Mapped[Exercise] = relationship(back_populates="choices")


class ExerciseAnswer(Base):
    """An accepted free-form answer (word bank / typed translation)."""

    __tablename__ = "exercise_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(Text)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    exercise: Mapped[Exercise] = relationship(back_populates="answers")


# --------------------------------------------------------------------------
# Learner state
# --------------------------------------------------------------------------


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("hearts >= 0", name="ck_users_hearts_non_negative"),
        CheckConstraint("gems >= 0", name="ck_users_gems_non_negative"),
        CheckConstraint("total_xp >= 0", name="ck_users_xp_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    display_name: Mapped[str] = mapped_column(String(80))
    avatar_color: Mapped[str] = mapped_column(String(20), default="#1CB0F6")
    is_bot: Mapped[bool] = mapped_column(Boolean, default=False)  # seeded leaderboard rival
    created_at: Mapped[datetime] = mapped_column(DateTime)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"))

    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=0)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime)  # regen timer anchor
    streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date)
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=20)
    league: Mapped[str] = mapped_column(String(20), default="bronze")
    day_offset: Mapped[int] = mapped_column(Integer, default=0)  # simulated days, see clock.py

    course: Mapped[Course | None] = relationship()


class SkillProgress(Base):
    """How far a learner is through one path node."""

    __tablename__ = "skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    legendary_at: Mapped[datetime | None] = mapped_column(DateTime)  # Legendary challenge won

    skill: Mapped[Skill] = relationship()


class LessonSession(Base):
    """One run through a lesson (or a practice set). Graded server-side."""

    __tablename__ = "lesson_sessions"
    __table_args__ = (Index("ix_lesson_sessions_user_status", "user_id", "status"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"))
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"))
    mode: Mapped[str] = mapped_column(String(20), default=SessionMode.LESSON)
    status: Mapped[str] = mapped_column(String(20), default=SessionStatus.IN_PROGRESS)
    exercise_ids: Mapped[list[int]] = mapped_column(JSON)  # exercises that must be answered
    mistakes_allowed: Mapped[int | None] = mapped_column(Integer)  # legendary only
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)  # timed only
    started_at: Mapped[datetime] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[int | None] = mapped_column(Integer)  # 0-100

    skill: Mapped[Skill | None] = relationship()
    lesson: Mapped[Lesson | None] = relationship()
    attempts: Mapped[list[ExerciseAttempt]] = relationship(
        back_populates="session", order_by="ExerciseAttempt.id", cascade="all, delete-orphan"
    )


class ExerciseAttempt(Base):
    __tablename__ = "exercise_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answer: Mapped[dict | None] = mapped_column(JSON)  # what the learner submitted
    created_at: Mapped[datetime] = mapped_column(DateTime)

    session: Mapped[LessonSession] = relationship(back_populates="attempts")


class DailyActivity(Base):
    """Per-learner, per-day totals. Drives streaks, daily goal, quests and the weekly league."""

    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint("user_id", "activity_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    activity_date: Mapped[date] = mapped_column(Date, index=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    perfect_lessons: Mapped[int] = mapped_column(Integer, default=0)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(160))  # "{target}" is the tier threshold
    metric: Mapped[str] = mapped_column(String(30))  # see services/achievements.py
    icon: Mapped[str] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(20))

    tiers: Mapped[list[AchievementTier]] = relationship(
        back_populates="achievement",
        order_by="AchievementTier.level",
        cascade="all, delete-orphan",
    )


class AchievementTier(Base):
    __tablename__ = "achievement_tiers"
    __table_args__ = (UniqueConstraint("achievement_id", "level"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE")
    )
    level: Mapped[int] = mapped_column(Integer)
    threshold: Mapped[int] = mapped_column(Integer)

    achievement: Mapped[Achievement] = relationship(back_populates="tiers")


class UserAchievement(Base):
    """Highest tier a learner has unlocked for an achievement."""

    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE")
    )
    level: Mapped[int] = mapped_column(Integer, default=0)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime)


class Quest(Base):
    """A daily quest definition. Progress is derived from `daily_activity`."""

    __tablename__ = "quests"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(120))  # "{target}" is substituted
    metric: Mapped[str] = mapped_column(String(30))  # xp | lessons | perfect_lessons
    target: Mapped[int | None] = mapped_column(Integer)  # NULL => learner's daily XP goal
    reward_gems: Mapped[int] = mapped_column(Integer, default=0)
    icon: Mapped[str] = mapped_column(String(20), default="bolt")


class QuestCompletion(Base):
    """Marks a quest as rewarded for a given day so gems are granted once."""

    __tablename__ = "quest_completions"
    __table_args__ = (UniqueConstraint("user_id", "quest_id", "quest_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id", ondelete="CASCADE"))
    quest_date: Mapped[date] = mapped_column(Date)
    completed_at: Mapped[datetime] = mapped_column(DateTime)
