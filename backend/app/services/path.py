"""Learning-path progression: which nodes are completed, current or locked.

Progression is linear: the first node that is not completed is "current";
everything after it is locked.
"""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import clock
from ..errors import api_error
from ..models import Skill, SkillKind, SkillProgress, User
from ..schemas import ChestClaimOut, CourseOut, PathOut, SkillOut, UnitOut
from . import users

COMPLETED, CURRENT, LOCKED = "completed", "current", "locked"


@dataclass
class SkillState:
    skill: Skill
    status: str
    lessons_completed: int
    legendary: bool = False


def get_progress(db: Session, user: User, skill_id: int) -> SkillProgress | None:
    return db.scalar(
        select(SkillProgress).where(
            SkillProgress.user_id == user.id, SkillProgress.skill_id == skill_id
        )
    )


def get_or_create_progress(db: Session, user: User, skill_id: int) -> SkillProgress:
    progress = get_progress(db, user, skill_id)
    if progress is None:
        progress = SkillProgress(user_id=user.id, skill_id=skill_id, lessons_completed=0)
        db.add(progress)
        db.flush()
    return progress


def skill_states(db: Session, user: User) -> list[SkillState]:
    """Every node of the learner's course, in path order, with its status."""
    progress_by_skill = {
        row.skill_id: row
        for row in db.scalars(select(SkillProgress).where(SkillProgress.user_id == user.id))
    }
    states: list[SkillState] = []
    next_is_current = True
    for unit in user.course.units:
        for skill in unit.skills:
            progress = progress_by_skill.get(skill.id)
            done = progress.lessons_completed if progress else 0
            if progress and progress.completed_at:
                status = COMPLETED
            elif next_is_current:
                status, next_is_current = CURRENT, False
            else:
                status = LOCKED
            states.append(
                SkillState(
                    skill=skill,
                    status=status,
                    lessons_completed=done,
                    legendary=bool(progress and progress.legendary_at),
                )
            )
    return states


def state_for(db: Session, user: User, skill_id: int) -> SkillState:
    for state in skill_states(db, user):
        if state.skill.id == skill_id:
            return state
    raise api_error(404, "skill_not_found", "That skill does not exist.")


def build_path(db: Session, user: User) -> PathOut:
    by_unit: dict[int, list[SkillOut]] = {}
    for state in skill_states(db, user):
        skill = state.skill
        by_unit.setdefault(skill.unit_id, []).append(
            SkillOut(
                id=skill.id,
                title=skill.title,
                kind=skill.kind,
                icon=skill.icon,
                status=state.status,
                lessons_total=len(skill.lessons),
                lessons_completed=state.lessons_completed,
                reward_gems=skill.reward_gems,
                is_legendary=state.legendary,
            )
        )
    return PathOut(
        course=CourseOut.model_validate(user.course),
        units=[
            UnitOut(
                id=unit.id,
                section_index=unit.section_index,
                order_index=unit.order_index,
                title=unit.title,
                description=unit.description,
                color=unit.color,
                skills=by_unit.get(unit.id, []),
            )
            for unit in user.course.units
        ],
    )


def claim_chest(db: Session, user: User, skill_id: int) -> ChestClaimOut:
    state = state_for(db, user, skill_id)
    if state.skill.kind != SkillKind.CHEST:
        raise api_error(400, "not_a_chest", "This node is not a chest.")
    if state.status == LOCKED:
        raise api_error(403, "skill_locked", "Complete all levels above to unlock this!")
    if state.status == COMPLETED:
        raise api_error(409, "already_claimed", "You already opened this chest.")

    progress = get_or_create_progress(db, user, skill_id)
    progress.completed_at = clock.now_for(user)
    user.gems += state.skill.reward_gems
    db.flush()
    return ChestClaimOut(gems_awarded=state.skill.reward_gems, user=users.summary(db, user))
