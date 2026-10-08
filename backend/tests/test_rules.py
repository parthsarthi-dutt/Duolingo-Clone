"""Unit tests for the pure gamification rules (no HTTP, no database)."""

from datetime import date, datetime, timedelta
from types import SimpleNamespace

from app.config import settings
from app.services import grading, hearts, streak

NOW = datetime(2026, 1, 10, 12, 0, 0)
REGEN = timedelta(minutes=settings.heart_regen_minutes)


def learner(**overrides):
    defaults = dict(
        hearts=settings.max_hearts,
        hearts_updated_at=NOW,
        streak=0,
        longest_streak=0,
        last_active_date=None,
    )
    return SimpleNamespace(**{**defaults, **overrides})


# ---- hearts ---------------------------------------------------------------


def test_losing_first_heart_starts_the_regen_timer():
    user = learner(hearts_updated_at=NOW - timedelta(days=3))
    hearts.lose(user, NOW)
    assert user.hearts == settings.max_hearts - 1
    assert user.hearts_updated_at == NOW
    assert hearts.snapshot(user, NOW).seconds_to_next == REGEN.total_seconds()


def test_hearts_regenerate_one_per_interval_and_keep_the_remainder():
    user = learner(hearts=1, hearts_updated_at=NOW)
    later = NOW + 2 * REGEN + timedelta(minutes=30)
    hearts.sync(user, later)
    assert user.hearts == 3
    # 30 minutes of the next interval are already banked
    assert hearts.snapshot(user, later).seconds_to_next == (REGEN - timedelta(minutes=30)).total_seconds()


def test_hearts_never_exceed_the_cap_or_drop_below_zero():
    user = learner(hearts=4, hearts_updated_at=NOW)
    hearts.sync(user, NOW + 50 * REGEN)
    assert user.hearts == settings.max_hearts
    assert hearts.snapshot(user, NOW).seconds_to_next is None

    empty = learner(hearts=0)
    hearts.lose(empty, NOW)
    assert empty.hearts == 0


def test_gain_reports_only_hearts_actually_added():
    assert hearts.gain(learner(hearts=5), NOW) == 0
    user = learner(hearts=2)
    assert hearts.gain(user, NOW) == 1
    assert user.hearts == 3


# ---- streak ---------------------------------------------------------------

TODAY = date(2026, 1, 10)


def test_first_ever_lesson_starts_a_streak():
    user = learner()
    assert streak.record_activity(user, TODAY) is True
    assert (user.streak, user.longest_streak, user.last_active_date) == (1, 1, TODAY)


def test_streak_grows_once_per_day():
    user = learner(streak=4, longest_streak=4, last_active_date=TODAY - timedelta(days=1))
    assert streak.record_activity(user, TODAY) is True
    assert user.streak == 5
    assert streak.record_activity(user, TODAY) is False  # second lesson the same day
    assert user.streak == 5


def test_missing_a_day_resets_the_streak_but_keeps_the_record():
    user = learner(streak=9, longest_streak=9, last_active_date=TODAY - timedelta(days=2))
    assert streak.current(user, TODAY) == 0
    streak.record_activity(user, TODAY)
    assert (user.streak, user.longest_streak) == (1, 9)


def test_streak_is_still_alive_the_day_after_practising():
    user = learner(streak=3, last_active_date=TODAY - timedelta(days=1))
    assert streak.current(user, TODAY) == 3
    assert streak.is_active_today(user, TODAY) is False


# ---- grading --------------------------------------------------------------


def test_normalize_ignores_case_accents_and_punctuation():
    assert grading.normalize("¿Cómo  estás?") == "como estas"
    assert grading.normalize("A coffee, please.") == grading.normalize("a COFFEE please")


def test_edit_distance():
    assert grading.edit_distance("coffee", "coffee") == 0
    assert grading.edit_distance("coffee", "cofee") == 1
    assert grading.edit_distance("tea", "ten") == 1
    assert grading.edit_distance("house", "mouse") == 1
    assert grading.edit_distance("abc", "") == 3
