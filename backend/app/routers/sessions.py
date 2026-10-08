from fastapi import APIRouter, status

from ..deps import CurrentUser, DbSession
from ..schemas import (
    AnswerIn,
    AnswerOut,
    ReviewItemOut,
    SessionCreate,
    SessionOut,
    SessionSummaryOut,
)
from ..services import sessions

router = APIRouter(prefix="/api/sessions", tags=["lesson sessions"])


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def start_session(payload: SessionCreate, db: DbSession, user: CurrentUser):
    """Start a lesson, practice set, Legendary challenge or timed practice. Returns the exercises."""
    result = sessions.start(db, user, payload)
    db.commit()
    return result


@router.post("/{session_id}/answers", response_model=AnswerOut)
def submit_answer(session_id: int, payload: AnswerIn, db: DbSession, user: CurrentUser):
    """Grade one answer. A wrong answer in a lesson costs a heart."""
    result = sessions.submit_answer(db, user, session_id, payload)
    db.commit()
    return result


@router.post("/{session_id}/complete", response_model=SessionSummaryOut)
def complete_session(session_id: int, db: DbSession, user: CurrentUser):
    """Finish a session: award XP, advance the skill, update streak, quests and achievements."""
    result = sessions.complete(db, user, session_id)
    db.commit()
    return result


@router.get("/{session_id}/review", response_model=list[ReviewItemOut])
def review_session(session_id: int, db: DbSession, user: CurrentUser):
    """The exercises of a session with their solutions and whether each was right first time."""
    return sessions.review(db, user, session_id)


@router.post("/{session_id}/abandon", status_code=status.HTTP_204_NO_CONTENT)
def abandon_session(session_id: int, db: DbSession, user: CurrentUser):
    """Quit a lesson early. No rewards are granted."""
    sessions.abandon(db, user, session_id)
    db.commit()
