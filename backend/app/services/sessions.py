"""The lesson loop: start a session, grade answers, complete and reward.

The server is the source of truth: answers are graded here, hearts are
deducted here, and a session can only be completed once every exercise in it
has been answered correctly at least once.

Four modes share this loop and differ only in what is at stake:

    lesson     costs hearts on mistakes, moves the path forward
    practice   risk-free, earns a heart back
    legendary  extra-hard replay of a finished skill; three mistakes and it is lost
    timed      practice against the clock
"""

import random
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import clock
from ..config import settings
from ..errors import api_error
from ..models import (
    Exercise,
    ExerciseAttempt,
    ExerciseType,
    Lesson,
    LessonSession,
    SessionMode,
    SessionStatus,
    Skill,
    SkillKind,
    User,
)
from ..schemas import (
    AnswerIn,
    AnswerOut,
    ExerciseOut,
    ReviewItemOut,
    SessionCreate,
    SessionOut,
    SessionSummaryOut,
)
from . import achievements, activity, grading, hearts, path, quests, streak, users

# Extra seconds the server allows on a timed session to absorb network latency.
_TIME_GRACE = timedelta(seconds=3)

# Exercise types that make the learner produce language rather than recognise it.
_HARD_TYPES = (ExerciseType.TYPE_ANSWER, ExerciseType.WORD_BANK, ExerciseType.FILL_BLANK)


def _get_session(db: Session, user: User, session_id: int) -> LessonSession:
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise api_error(404, "session_not_found", "That lesson session does not exist.")
    return session


def _require_in_progress(session: LessonSession) -> None:
    if session.status != SessionStatus.IN_PROGRESS:
        raise api_error(409, "session_closed", "This lesson session has already ended.")


def _out_of_time(session: LessonSession, now: datetime) -> bool:
    return session.expires_at is not None and now > session.expires_at + _TIME_GRACE


# ---- choosing exercises ----------------------------------------------------


def _practice_exercises(db: Session, user: User, skill: Skill | None) -> list[Exercise]:
    """A random review set from one skill, or from everything learned so far."""
    if skill is not None:
        lessons: list[Lesson] = list(skill.lessons)
    else:
        lessons = []
        for state in path.skill_states(db, user):
            done = (
                len(state.skill.lessons)
                if state.status == path.COMPLETED
                else state.lessons_completed
            )
            lessons.extend(state.skill.lessons[:done])
        if not lessons:  # brand-new learner: fall back to the very first lesson
            first_skill = next(s for u in user.course.units for s in u.skills if s.lessons)
            lessons = first_skill.lessons[:1]
    pool = [exercise for lesson in lessons for exercise in lesson.exercises]
    return random.sample(pool, min(settings.practice_exercise_count, len(pool)))


def _legendary_exercises(skill: Skill) -> list[Exercise]:
    """The skill's hardest exercises: translating and typing, plus one round of pairs."""
    pool = [exercise for lesson in skill.lessons for exercise in lesson.exercises]
    hard = [exercise for exercise in pool if exercise.type in _HARD_TYPES]
    pairs = [exercise for exercise in pool if exercise.type == ExerciseType.MATCH_PAIRS]
    count = settings.legendary_exercise_count
    chosen = random.sample(hard, min(count - 1, len(hard)))
    if pairs:
        chosen.append(random.choice(pairs))
    random.shuffle(chosen)
    return chosen


# ---- start ------------------------------------------------------------------


def start(db: Session, user: User, request: SessionCreate) -> SessionOut:
    now = clock.now_for(user)
    hearts.sync(user, now)
    mode = SessionMode(request.mode)

    state = path.state_for(db, user, request.skill_id) if request.skill_id is not None else None
    skill = state.skill if state else None
    if state is not None:
        if skill.kind != SkillKind.LESSON:
            raise api_error(400, "not_a_lesson", "This node has no lessons.")
        if state.status == path.LOCKED:
            raise api_error(403, "skill_locked", "Complete all levels above to unlock this!")
        if mode == SessionMode.LESSON and state.status == path.COMPLETED:
            mode = SessionMode.PRACTICE  # a finished skill can only be reviewed
    elif mode in (SessionMode.LESSON, SessionMode.LEGENDARY):
        raise api_error(400, "skill_required", f"A skill_id is required for a {mode} session.")

    lesson: Lesson | None = None
    mistakes_allowed: int | None = None
    expires_at: datetime | None = None

    if mode == SessionMode.LESSON:
        if user.hearts <= 0:
            raise api_error(409, "no_hearts", "You ran out of hearts!")
        lesson = skill.lessons[state.lessons_completed]
        exercises = list(lesson.exercises)
        xp_reward = lesson.xp_reward
    elif mode == SessionMode.LEGENDARY:
        if state.status != path.COMPLETED:
            raise api_error(403, "skill_not_completed", "Finish this level before going Legendary.")
        if state.legendary:
            raise api_error(409, "already_legendary", "This level is already Legendary.")
        exercises = _legendary_exercises(skill)
        xp_reward = settings.legendary_xp
        mistakes_allowed = settings.legendary_mistakes_allowed
    elif mode == SessionMode.TIMED:
        skill = None  # timed practice always draws on everything learned so far
        exercises = _practice_exercises(db, user, None)
        xp_reward = settings.timed_xp
        expires_at = now + timedelta(seconds=settings.timed_seconds)
    else:
        exercises = _practice_exercises(db, user, skill)
        xp_reward = settings.practice_xp

    session = LessonSession(
        user_id=user.id,
        skill_id=skill.id if skill else None,
        lesson_id=lesson.id if lesson else None,
        mode=mode,
        status=SessionStatus.IN_PROGRESS,
        exercise_ids=[exercise.id for exercise in exercises],
        mistakes_allowed=mistakes_allowed,
        expires_at=expires_at,
        started_at=now,
    )
    db.add(session)
    db.flush()

    return SessionOut(
        id=session.id,
        mode=mode,
        skill_id=skill.id if skill else None,
        title=skill.title if skill else "Practice",
        lesson_number=lesson.order_index + 1 if lesson else None,
        lessons_total=len(skill.lessons) if skill else None,
        xp_reward=xp_reward,
        exercises=[ExerciseOut.model_validate(exercise) for exercise in exercises],
        hearts=hearts.snapshot(user, now),
        mistakes_allowed=mistakes_allowed,
        time_limit_seconds=settings.timed_seconds if expires_at else None,
    )


# ---- answer -----------------------------------------------------------------


def submit_answer(db: Session, user: User, session_id: int, submission: AnswerIn) -> AnswerOut:
    session = _get_session(db, user, session_id)
    _require_in_progress(session)
    if submission.exercise_id not in session.exercise_ids:
        raise api_error(400, "exercise_not_in_session", "That exercise is not part of this lesson.")

    now = clock.now_for(user)
    hearts.sync(user, now)
    exercise = db.get(Exercise, submission.exercise_id)

    if _out_of_time(session, now):
        # The clock ran out before this answer arrived: the attempt is lost.
        session.status = SessionStatus.FAILED
        session.completed_at = now
        db.flush()
        return AnswerOut(
            correct=False,
            typo=False,
            correct_answer=grading.solution_text(exercise),
            hearts=hearts.snapshot(user, now),
            failed=True,
            failure_reason="time_up",
        )

    costs_hearts = session.mode == SessionMode.LESSON  # every other mode is free of heart loss
    if costs_hearts and user.hearts <= 0:
        raise api_error(409, "no_hearts", "You ran out of hearts!")

    result = grading.grade(exercise, submission)
    session.attempts.append(
        ExerciseAttempt(
            exercise_id=exercise.id,
            is_correct=result.correct,
            answer=submission.model_dump(exclude={"exercise_id"}, exclude_none=True),
            created_at=now,
        )
    )
    if not result.correct and costs_hearts:
        hearts.lose(user, now)

    # Legendary: a fixed allowance of mistakes, independent of hearts.
    mistakes_left = None
    failed = False
    if session.mistakes_allowed is not None:
        mistakes = sum(1 for attempt in session.attempts if not attempt.is_correct)
        mistakes_left = max(session.mistakes_allowed - mistakes, 0)
        if mistakes_left == 0:
            failed = True
            session.status = SessionStatus.FAILED
            session.completed_at = now
    db.flush()

    return AnswerOut(
        correct=result.correct,
        typo=result.typo,
        correct_answer=result.correct_answer,
        hearts=hearts.snapshot(user, now),
        mistakes_left=mistakes_left,
        failed=failed,
        failure_reason="out_of_mistakes" if failed else None,
    )


# ---- complete ---------------------------------------------------------------


def complete(db: Session, user: User, session_id: int) -> SessionSummaryOut:
    session = _get_session(db, user, session_id)
    _require_in_progress(session)

    now = clock.now_for(user)
    if _out_of_time(session, now):
        raise api_error(409, "time_up", "Time's up!")

    solved = {attempt.exercise_id for attempt in session.attempts if attempt.is_correct}
    if not set(session.exercise_ids) <= solved:
        raise api_error(409, "session_incomplete", "Finish every exercise before completing.")

    today = now.date()
    total = len(session.attempts)
    mistakes = sum(1 for attempt in session.attempts if not attempt.is_correct)
    accuracy = round(100 * (total - mistakes) / total) if total else 100
    perfect = mistakes == 0

    # --- what this mode pays out ---
    skill_completed = became_legendary = False
    lessons_completed = lessons_total = None
    hearts_awarded = 0
    if session.mode == SessionMode.LESSON:
        lesson = session.lesson
        xp = lesson.xp_reward + (settings.perfect_lesson_bonus_xp if perfect else 0)
        progress = path.get_or_create_progress(db, user, lesson.skill_id)
        lessons_total = len(lesson.skill.lessons)
        # Guard against replaying an already-credited lesson from a stale tab.
        if progress.completed_at is None and progress.lessons_completed == lesson.order_index:
            progress.lessons_completed += 1
            if progress.lessons_completed >= lessons_total:
                progress.completed_at = now
                skill_completed = True
        lessons_completed = progress.lessons_completed
    elif session.mode == SessionMode.LEGENDARY:
        xp = settings.legendary_xp
        progress = path.get_or_create_progress(db, user, session.skill_id)
        became_legendary = progress.legendary_at is None
        progress.legendary_at = progress.legendary_at or now
    elif session.mode == SessionMode.TIMED:
        xp = settings.timed_xp
    else:
        xp = settings.practice_xp
        hearts_awarded = hearts.gain(user, now)  # "practice to earn hearts"

    # --- XP, daily totals, streak ---
    day = activity.get_or_create_day(db, user, today)
    goal_was_met = day.xp_earned >= user.daily_goal_xp
    user.total_xp += xp
    day.xp_earned += xp
    day.lessons_completed += 1
    day.perfect_lessons += 1 if perfect else 0
    streak_extended = streak.record_activity(user, today)

    session.status = SessionStatus.COMPLETED
    session.completed_at = now
    session.xp_earned = xp
    session.accuracy = accuracy
    db.flush()

    completed_quests = quests.award_completed(db, user, now)
    unlocked = achievements.sync_unlocks(db, user, now)
    db.flush()

    return SessionSummaryOut(
        session_id=session.id,
        mode=session.mode,
        skill_id=session.skill_id,
        xp_earned=xp,
        accuracy=accuracy,
        perfect=perfect,
        skill_completed=skill_completed,
        legendary_available=skill_completed,
        became_legendary=became_legendary,
        lessons_completed=lessons_completed,
        lessons_total=lessons_total,
        hearts_awarded=hearts_awarded,
        streak_extended=streak_extended,
        daily_goal_reached=not goal_was_met and day.xp_earned >= user.daily_goal_xp,
        completed_quests=completed_quests,
        unlocked_achievements=unlocked,
        user=users.summary(db, user),
    )


def abandon(db: Session, user: User, session_id: int) -> None:
    session = _get_session(db, user, session_id)
    if session.status == SessionStatus.IN_PROGRESS:
        session.status = SessionStatus.ABANDONED
        session.completed_at = clock.now_for(user)
        db.flush()


# ---- review -----------------------------------------------------------------


def review(db: Session, user: User, session_id: int) -> list[ReviewItemOut]:
    """Every exercise of a session with its solution and how the learner did."""
    session = _get_session(db, user, session_id)
    exercises = {
        exercise.id: exercise
        for exercise in db.scalars(select(Exercise).where(Exercise.id.in_(session.exercise_ids)))
    }
    items = []
    for exercise_id in session.exercise_ids:
        exercise = exercises[exercise_id]
        attempts = [attempt for attempt in session.attempts if attempt.exercise_id == exercise_id]
        items.append(
            ReviewItemOut(
                exercise_id=exercise.id,
                type=exercise.type,
                instruction=exercise.instruction,
                prompt_text=exercise.prompt_text,
                correct_answer=grading.solution_text(exercise),
                attempts=len(attempts),
                correct_first_try=bool(attempts) and attempts[0].is_correct,
            )
        )
    return items
