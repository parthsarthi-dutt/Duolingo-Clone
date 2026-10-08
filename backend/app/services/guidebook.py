"""A unit's guidebook: its key phrases and vocabulary.

Nothing extra is stored for this. The guidebook is derived from the unit's
own exercises, so it can never drift out of sync with what the lessons teach.
"""

from sqlalchemy.orm import Session

from ..errors import api_error
from ..models import ExerciseType, Unit, User
from ..schemas import GuidebookOut, GuidebookPhraseOut, GuidebookWordOut
from . import grading


def build(db: Session, user: User, unit_id: int) -> GuidebookOut:
    unit = db.get(Unit, unit_id)
    if unit is None or unit.course_id != user.course_id:
        raise api_error(404, "unit_not_found", "That unit does not exist.")
    learning = unit.course.language_code

    phrases: dict[str, str] = {}  # sentence -> translation (dicts keep first-seen order)
    words: dict[str, str] = {}  # word -> translation
    images: dict[str, str] = {}  # word -> illustration key

    exercises = (
        exercise for skill in unit.skills for lesson in skill.lessons for exercise in lesson.exercises
    )
    for exercise in exercises:
        if exercise.type == ExerciseType.MATCH_PAIRS:
            by_pair: dict[str | None, dict[str | None, str]] = {}
            for choice in exercise.choices:
                by_pair.setdefault(choice.pair_key, {})[choice.language] = choice.text
            for pair in by_pair.values():
                word = pair.get(learning)
                translation = next((text for lang, text in pair.items() if lang != learning), None)
                if word and translation:
                    words.setdefault(word, translation)
        elif exercise.type == ExerciseType.MULTIPLE_CHOICE:
            for choice in exercise.choices:
                if choice.image:
                    images.setdefault(choice.text, choice.image)
        elif exercise.prompt_language == learning and exercise.prompt_text and exercise.answers:
            # word-bank and typed translations out of the learning language
            phrases.setdefault(exercise.prompt_text, grading.primary_answer(exercise))

    return GuidebookOut(
        unit_id=unit.id,
        title=unit.title,
        description=unit.description,
        phrases=[GuidebookPhraseOut(text=text, translation=tr) for text, tr in phrases.items()],
        words=[
            GuidebookWordOut(text=text, translation=tr, image=images.get(text))
            for text, tr in words.items()
        ],
    )
