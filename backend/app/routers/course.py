from fastapi import APIRouter

from ..deps import CurrentUser, DbSession
from ..schemas import ChestClaimOut, GuidebookOut, PathOut
from ..services import guidebook, path

router = APIRouter(prefix="/api", tags=["course"])


@router.get("/path", response_model=PathOut)
def get_path(db: DbSession, user: CurrentUser):
    """The learning path: units and their nodes with completed / current / locked status."""
    return path.build_path(db, user)


@router.get("/units/{unit_id}/guidebook", response_model=GuidebookOut)
def get_guidebook(unit_id: int, db: DbSession, user: CurrentUser):
    """Key phrases and vocabulary taught in a unit."""
    return guidebook.build(db, user, unit_id)


@router.post("/skills/{skill_id}/claim", response_model=ChestClaimOut)
def claim_chest(skill_id: int, db: DbSession, user: CurrentUser):
    """Open a reward chest on the path and collect its gems."""
    result = path.claim_chest(db, user, skill_id)
    db.commit()
    return result
