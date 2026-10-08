"""Answer checking for every exercise type. Pure functions, no database access."""

import re
import unicodedata
from dataclasses import dataclass

from ..models import Exercise, ExerciseType
from ..schemas import AnswerIn

BLANK = "___"


@dataclass(frozen=True)
class Grade:
    correct: bool
    correct_answer: str
    typo: bool = False


def normalize(text: str) -> str:
    """Lowercase, strip accents and punctuation, collapse whitespace."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    without_accents = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    without_punctuation = re.sub(r"[^\w\s]", " ", without_accents)
    return " ".join(without_punctuation.split())


def edit_distance(a: str, b: str) -> int:
    """Levenshtein distance (two-row dynamic programming)."""
    previous = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        row = [i]
        for j, char_b in enumerate(b, start=1):
            row.append(
                min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (char_a != char_b))
            )
        previous = row
    return previous[-1]


def primary_answer(exercise: Exercise) -> str:
    """The canonical translation for a word-bank or typed exercise."""
    primary = next((a for a in exercise.answers if a.is_primary), None)
    return (primary or exercise.answers[0]).text if exercise.answers else ""


def matching_pairs(exercise: Exercise) -> list[list[str]]:
    """The two texts of every pair in a match-pairs exercise."""
    pairs: dict[str | None, list[str]] = {}
    for choice in exercise.choices:
        pairs.setdefault(choice.pair_key, []).append(choice.text)
    return list(pairs.values())


def solution_text(exercise: Exercise) -> str:
    """The answer shown in the feedback bar and in lesson reviews."""
    if exercise.type in (ExerciseType.MULTIPLE_CHOICE, ExerciseType.FILL_BLANK):
        correct = next((c for c in exercise.choices if c.is_correct), None)
        if correct is None:
            return ""
        if exercise.type == ExerciseType.FILL_BLANK and exercise.prompt_text:
            return exercise.prompt_text.replace(BLANK, correct.text, 1)
        return correct.text
    if exercise.type in (ExerciseType.WORD_BANK, ExerciseType.TYPE_ANSWER):
        return primary_answer(exercise)
    if exercise.type == ExerciseType.MATCH_PAIRS:
        return ", ".join(" = ".join(pair) for pair in matching_pairs(exercise))
    return ""


def _matches_accepted(exercise: Exercise, text: str, allow_typo: bool) -> tuple[bool, bool]:
    """Returns (correct, typo)."""
    given = normalize(text)
    accepted = [normalize(answer.text) for answer in exercise.answers]
    if given in accepted:
        return True, False
    if allow_typo and given:
        # Forgive a single slip in longer answers, like the real app does.
        for answer in accepted:
            if len(answer) >= 6 and edit_distance(given, answer) == 1:
                return True, True
    return False, False


def _pairs_are_correct(exercise: Exercise, pairs: list[tuple[int, int]]) -> bool:
    key_by_id = {choice.id: choice.pair_key for choice in exercise.choices}
    used: set[int] = set()
    for first, second in pairs:
        if first == second or first in used or second in used:
            return False
        if first not in key_by_id or key_by_id[first] != key_by_id.get(second):
            return False
        used.update((first, second))
    return used == set(key_by_id)


def grade(exercise: Exercise, submission: AnswerIn) -> Grade:
    solution = solution_text(exercise)
    if submission.skipped:
        return Grade(correct=False, correct_answer=solution)

    if exercise.type in (ExerciseType.MULTIPLE_CHOICE, ExerciseType.FILL_BLANK):
        correct = any(
            choice.id == submission.choice_id and choice.is_correct
            for choice in exercise.choices
        )
        return Grade(correct=correct, correct_answer=solution)

    if exercise.type == ExerciseType.WORD_BANK:
        text_by_id = {choice.id: choice.text for choice in exercise.choices}
        chosen = [text_by_id[i] for i in submission.choice_ids or [] if i in text_by_id]
        correct, _ = _matches_accepted(exercise, " ".join(chosen), allow_typo=False)
        return Grade(correct=correct, correct_answer=solution)

    if exercise.type == ExerciseType.TYPE_ANSWER:
        correct, typo = _matches_accepted(exercise, submission.text or "", allow_typo=True)
        return Grade(correct=correct, correct_answer=solution, typo=typo)

    if exercise.type == ExerciseType.MATCH_PAIRS:
        return Grade(
            correct=_pairs_are_correct(exercise, submission.pairs or []),
            correct_answer=solution,
        )

    return Grade(correct=False, correct_answer=solution)
