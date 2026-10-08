"""Legendary challenge, timed practice, guidebook and lesson review."""

from datetime import timedelta

from app.config import settings
from app.database import SessionLocal
from app.models import LessonSession

from .conftest import (
    answer,
    correct_submission,
    current_skill,
    play_perfectly,
    start,
    wrong_submission,
)


def completed_skill(client) -> dict:
    path = client.get("/api/path").json()
    return next(s for u in path["units"] for s in u["skills"] if s["status"] == "completed")


def skill_by_id(client, skill_id: int) -> dict:
    path = client.get("/api/path").json()
    return next(s for u in path["units"] for s in u["skills"] if s["id"] == skill_id)


# ---- legendary --------------------------------------------------------------


def test_legendary_is_offered_when_a_lesson_finishes_the_skill(client):
    skill = current_skill(client)
    first = play_perfectly(client, start(client, skill_id=skill["id"]))
    assert first["skill_completed"] is False and first["legendary_available"] is False
    last = play_perfectly(client, start(client, skill_id=skill["id"]))
    assert last["skill_completed"] is True and last["legendary_available"] is True
    assert last["skill_id"] == skill["id"]


def test_legendary_needs_a_completed_skill(client):
    unfinished = client.post(
        "/api/sessions", json={"mode": "legendary", "skill_id": current_skill(client)["id"]}
    )
    assert unfinished.status_code == 403
    assert unfinished.json()["detail"]["code"] == "skill_not_completed"
    assert client.post("/api/sessions", json={"mode": "legendary"}).status_code == 400


def test_legendary_is_made_of_hard_exercises_and_does_not_touch_hearts(client):
    session = start(client, mode="legendary", skill_id=completed_skill(client)["id"])
    assert session["mode"] == "legendary"
    assert session["mistakes_allowed"] == settings.legendary_mistakes_allowed
    assert len(session["exercises"]) == settings.legendary_exercise_count
    types = [exercise["type"] for exercise in session["exercises"]]
    assert "multiple_choice" not in types
    assert types.count("match_pairs") == 1

    miss = answer(client, session, wrong_submission(session["exercises"][0]["id"]))
    assert miss["mistakes_left"] == settings.legendary_mistakes_allowed - 1
    assert miss["failed"] is False
    assert miss["hearts"]["current"] == settings.max_hearts


def test_winning_legendary_awards_xp_and_gilds_the_skill(client):
    skill = completed_skill(client)
    assert skill["is_legendary"] is False
    summary = play_perfectly(client, start(client, mode="legendary", skill_id=skill["id"]))

    assert summary["mode"] == "legendary"
    assert summary["xp_earned"] == settings.legendary_xp
    assert summary["became_legendary"] is True
    assert summary["user"]["total_xp"] == 45 + settings.legendary_xp
    assert "legend" in [a["key"] for a in summary["unlocked_achievements"]]
    assert skill_by_id(client, skill["id"])["is_legendary"] is True

    again = client.post("/api/sessions", json={"mode": "legendary", "skill_id": skill["id"]})
    assert again.status_code == 409 and again.json()["detail"]["code"] == "already_legendary"


def test_three_mistakes_lose_the_legendary_challenge(client):
    skill = completed_skill(client)
    session = start(client, mode="legendary", skill_id=skill["id"])
    exercise_id = session["exercises"][0]["id"]

    results = [answer(client, session, wrong_submission(exercise_id)) for _ in range(3)]
    assert [r["mistakes_left"] for r in results] == [2, 1, 0]
    assert [r["failed"] for r in results] == [False, False, True]
    assert results[-1]["failure_reason"] == "out_of_mistakes"

    closed = client.post(
        f"/api/sessions/{session['id']}/answers", json=correct_submission(exercise_id)
    )
    assert closed.status_code == 409 and closed.json()["detail"]["code"] == "session_closed"
    assert client.post(f"/api/sessions/{session['id']}/complete").status_code == 409
    assert skill_by_id(client, skill["id"])["is_legendary"] is False
    assert client.get("/api/me").json()["total_xp"] == 45  # nothing was earned

    # ...but the challenge can be attempted again
    assert start(client, mode="legendary", skill_id=skill["id"])["mode"] == "legendary"


# ---- timed practice ---------------------------------------------------------


def expire(session_id: int) -> None:
    """Move a session's deadline into the past, as if the learner had run out the clock."""
    with SessionLocal() as db:
        session = db.get(LessonSession, session_id)
        session.expires_at -= timedelta(seconds=settings.timed_seconds + 60)
        db.commit()


def test_timed_practice_beaten_in_time_awards_xp(client):
    session = start(client, mode="timed")
    assert session["mode"] == "timed"
    assert session["time_limit_seconds"] == settings.timed_seconds
    assert session["mistakes_allowed"] is None

    miss = answer(client, session, wrong_submission(session["exercises"][0]["id"]))
    assert miss["failed"] is False
    assert miss["hearts"]["current"] == settings.max_hearts  # mistakes only cost time

    summary = play_perfectly(client, session)
    assert summary["xp_earned"] == settings.timed_xp
    assert summary["hearts_awarded"] == 0
    assert summary["user"]["total_xp"] == 45 + settings.timed_xp


def test_timed_practice_fails_once_the_clock_runs_out(client):
    session = start(client, mode="timed")
    expire(session["id"])

    late = answer(client, session, correct_submission(session["exercises"][0]["id"]))
    assert late["failed"] is True and late["failure_reason"] == "time_up"
    assert late["correct"] is False

    closed = client.post(f"/api/sessions/{session['id']}/complete")
    assert closed.status_code == 409
    assert client.get("/api/me").json()["total_xp"] == 45


def test_timed_practice_cannot_be_completed_late(client):
    session = start(client, mode="timed")
    for exercise in session["exercises"]:
        answer(client, session, correct_submission(exercise["id"]))
    expire(session["id"])
    late = client.post(f"/api/sessions/{session['id']}/complete")
    assert late.status_code == 409 and late.json()["detail"]["code"] == "time_up"


# ---- guidebook --------------------------------------------------------------


def test_guidebook_lists_the_units_phrases_and_words(client):
    unit = client.get("/api/path").json()["units"][0]
    book = client.get(f"/api/units/{unit['id']}/guidebook").json()

    assert book["title"] == "Order at a café"
    phrases = {p["text"]: p["translation"] for p in book["phrases"]}
    assert phrases["Un café, por favor."] == "A coffee, please."
    words = {w["text"]: w for w in book["words"]}
    assert words["café"]["translation"] == "coffee"
    assert words["café"]["image"] == "coffee"
    assert words["gracias"]["image"] is None  # no artwork for abstract words
    assert len(book["words"]) == 20  # five words in each of the four skills
    assert len(phrases) == len(book["phrases"])  # no duplicates

    assert client.get("/api/units/9999/guidebook").status_code == 404


# ---- review -----------------------------------------------------------------


def test_review_shows_every_exercise_with_its_solution_and_result(client):
    session = start(client, skill_id=current_skill(client)["id"])
    missed = session["exercises"][0]["id"]
    answer(client, session, wrong_submission(missed))
    summary = play_perfectly(client, session)

    review = client.get(f"/api/sessions/{summary['session_id']}/review").json()
    assert [item["exercise_id"] for item in review] == [e["id"] for e in session["exercises"]]
    assert all(item["correct_answer"] for item in review)

    by_id = {item["exercise_id"]: item for item in review}
    assert by_id[missed]["correct_first_try"] is False and by_id[missed]["attempts"] == 2
    others = [item for item in review if item["exercise_id"] != missed]
    assert all(item["correct_first_try"] and item["attempts"] == 1 for item in others)

    pairs = next(item for item in review if item["type"] == "match_pairs")
    assert " = " in pairs["correct_answer"]  # e.g. "pan = bread, queso = cheese"
