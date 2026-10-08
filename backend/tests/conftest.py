"""Test setup: point the app at a throwaway SQLite file before it is imported."""

import os
import tempfile
from pathlib import Path

_TMP_DIR = Path(tempfile.mkdtemp(prefix="duo-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_TMP_DIR / 'test.db').as_posix()}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Exercise, ExerciseType  # noqa: E402
from app.seed.run import reset_database  # noqa: E402


@pytest.fixture()
def client():
    """A client against a freshly seeded database."""
    reset_database()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db():
    with SessionLocal() as session:
        yield session


def correct_submission(exercise_id: int) -> dict:
    """Builds the right answer for an exercise by reading the answer key from the DB."""
    with SessionLocal() as session:
        exercise = session.get(Exercise, exercise_id)
        payload: dict = {"exercise_id": exercise_id}
        if exercise.type in (ExerciseType.MULTIPLE_CHOICE, ExerciseType.FILL_BLANK):
            payload["choice_id"] = next(c.id for c in exercise.choices if c.is_correct)
        elif exercise.type == ExerciseType.WORD_BANK:
            primary = next(a for a in exercise.answers if a.is_primary).text
            remaining = list(exercise.choices)
            ids = []
            for word in primary.replace(",", " ").replace(".", " ").replace("?", " ").replace(
                "¿", " "
            ).split():
                tile = next(c for c in remaining if c.text == word)
                remaining.remove(tile)
                ids.append(tile.id)
            payload["choice_ids"] = ids
        elif exercise.type == ExerciseType.TYPE_ANSWER:
            payload["text"] = next(a for a in exercise.answers if a.is_primary).text
        elif exercise.type == ExerciseType.MATCH_PAIRS:
            by_key: dict[str, list[int]] = {}
            for choice in exercise.choices:
                by_key.setdefault(choice.pair_key, []).append(choice.id)
            payload["pairs"] = list(by_key.values())
        return payload


def wrong_submission(exercise_id: int) -> dict:
    return {"exercise_id": exercise_id, "skipped": True}


# ---- helpers that drive the API like the frontend does ----------------------


def current_skill(client) -> dict:
    path = client.get("/api/path").json()
    return next(s for u in path["units"] for s in u["skills"] if s["status"] == "current")


def start(client, **body) -> dict:
    response = client.post("/api/sessions", json=body)
    assert response.status_code == 201, response.text
    return response.json()


def answer(client, session: dict, payload: dict) -> dict:
    response = client.post(f"/api/sessions/{session['id']}/answers", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def play_perfectly(client, session: dict) -> dict:
    for exercise in session["exercises"]:
        assert answer(client, session, correct_submission(exercise["id"]))["correct"], exercise
    response = client.post(f"/api/sessions/{session['id']}/complete")
    assert response.status_code == 200, response.text
    return response.json()
