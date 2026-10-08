"""Turns a unit's vocabulary and sentences into concrete exercises.

Each skill gets three lessons that get progressively harder: recognition
first (pictures, tap-the-words), then production (typing, translating into
Spanish). A fixed random seed keeps the generated course identical on every
run.
"""

import itertools
import random
from dataclasses import dataclass, field

from ..models import ExerciseType
from ..services.grading import BLANK
from .content import Sentence, SkillSpec, UnitSpec, Word

CHARACTERS = ("ana", "leo", "oso", "mia")
_EDGE_PUNCTUATION = ".,!?¿¡"


@dataclass
class ChoiceSpec:
    text: str
    language: str | None = None
    image: str | None = None
    is_correct: bool = False
    pair_key: str | None = None


@dataclass
class ExerciseSpec:
    type: str
    instruction: str
    prompt_text: str | None = None
    prompt_language: str | None = None
    prompt_translation: str | None = None
    character: str | None = None
    is_new_word: bool = False
    choices: list[ChoiceSpec] = field(default_factory=list)
    answers: list[str] = field(default_factory=list)  # first one is the primary answer


def tokenize(sentence: str) -> list[str]:
    """Split into word-bank tiles: "Un café, por favor." -> Un / café / por / favor."""
    tokens = (word.strip(_EDGE_PUNCTUATION) for word in sentence.split())
    return [token for token in tokens if token]


class ExerciseFactory:
    """Builds exercises for one unit, drawing distractors from the whole unit."""

    def __init__(self, unit: UnitSpec, rng: random.Random):
        self.rng = rng
        self.words = [word for skill in unit.skills for word in skill.words]
        self.sentences = [sentence for skill in unit.skills for sentence in skill.sentences]
        self._characters = itertools.cycle(CHARACTERS)
        # Words that stay capitalised mid-sentence (names, countries, "I").
        self._proper = {"I", "I'm"} | {
            token
            for sentence in self.sentences
            for text in (sentence.es, sentence.en)
            for token in tokenize(text)[1:]
            if token[0].isupper()
        }

    # ---- multiple choice -------------------------------------------------

    def _other_words(self, word: Word, count: int, need_image: bool = False) -> list[Word]:
        pool = [
            other
            for other in self.words
            if other.es != word.es and other.en != word.en and (other.image or not need_image)
        ]
        return self.rng.sample(pool, count)

    def pick_word(self, word: Word, new: bool = False) -> ExerciseSpec:
        """Picture cards when artwork exists for enough options, otherwise a text list."""
        with_images = [w for w in self.words if w.image and w.es != word.es]
        if word.image and len(with_images) >= 2:
            return self.select_image(word, new)
        return self.select_meaning(word, new)

    def select_image(self, word: Word, new: bool = False) -> ExerciseSpec:
        options = [word, *self._other_words(word, 2, need_image=True)]
        self.rng.shuffle(options)
        return ExerciseSpec(
            type=ExerciseType.MULTIPLE_CHOICE,
            instruction=f"Which one of these is “{word.en}”?",
            is_new_word=new,
            choices=[
                ChoiceSpec(text=o.es, language="es", image=o.image, is_correct=o is word)
                for o in options
            ],
        )

    def select_meaning(self, word: Word, new: bool = False) -> ExerciseSpec:
        options = [word, *self._other_words(word, 2)]
        self.rng.shuffle(options)
        return ExerciseSpec(
            type=ExerciseType.MULTIPLE_CHOICE,
            instruction="Select the correct meaning",
            prompt_text=word.en,
            prompt_language="en",
            character=next(self._characters),
            is_new_word=new,
            choices=[ChoiceSpec(text=o.es, language="es", is_correct=o is word) for o in options],
        )

    # ---- translation -----------------------------------------------------

    def _direction(self, sentence: Sentence, to_spanish: bool):
        """(instruction, prompt, prompt language, answer language, accepted answers)."""
        if to_spanish:
            answers = [sentence.es, *sentence.alt_es]
            return "Write this in Spanish", sentence.en, "en", "es", answers
        answers = [sentence.en, *sentence.alt_en]
        return "Write this in English", sentence.es, "es", "en", answers

    def _distractor_tokens(self, taken: list[str], language: str, count: int) -> list[str]:
        used = {token.lower() for token in taken}
        pool: list[str] = []
        for sentence in self.sentences:
            for token in tokenize(sentence.es if language == "es" else sentence.en):
                tile = token if token in self._proper else token.lower()
                if tile.lower() not in used:
                    used.add(tile.lower())
                    pool.append(tile)
        return self.rng.sample(pool, min(count, len(pool)))

    def word_bank(self, sentence: Sentence, to_spanish: bool = False) -> ExerciseSpec:
        instruction, prompt, prompt_lang, answer_lang, answers = self._direction(
            sentence, to_spanish
        )
        tokens = tokenize(answers[0])
        tiles = tokens + self._distractor_tokens(tokens, answer_lang, count=max(2, 6 - len(tokens)))
        self.rng.shuffle(tiles)
        return ExerciseSpec(
            type=ExerciseType.WORD_BANK,
            instruction=instruction,
            prompt_text=prompt,
            prompt_language=prompt_lang,
            character=next(self._characters),
            choices=[ChoiceSpec(text=tile, language=answer_lang) for tile in tiles],
            answers=answers,
        )

    def type_answer(self, sentence: Sentence) -> ExerciseSpec:
        instruction, prompt, prompt_lang, _, answers = self._direction(sentence, to_spanish=False)
        return ExerciseSpec(
            type=ExerciseType.TYPE_ANSWER,
            instruction=instruction,
            prompt_text=prompt,
            prompt_language=prompt_lang,
            character=next(self._characters),
            answers=answers,
        )

    # ---- fill in the blank / match pairs ---------------------------------

    def fill_blank(self, sentence: Sentence) -> ExerciseSpec:
        correct = sentence.blank
        candidates = {s.blank for s in self.sentences} | {
            word.es for word in self.words if " " not in word.es
        }
        distractors = sorted(c for c in candidates if c.lower() != correct.lower())
        options = [correct, *self.rng.sample(distractors, 2)]
        self.rng.shuffle(options)
        return ExerciseSpec(
            type=ExerciseType.FILL_BLANK,
            instruction="Fill in the blank",
            prompt_text=sentence.es.replace(correct, BLANK, 1),
            prompt_language="es",
            prompt_translation=sentence.en,
            choices=[
                ChoiceSpec(text=option, language="es", is_correct=option == correct)
                for option in options
            ],
        )

    def match_pairs(self, words: list[Word]) -> ExerciseSpec:
        left = [ChoiceSpec(text=w.es, language="es", pair_key=w.es) for w in words]
        right = [ChoiceSpec(text=w.en, language="en", pair_key=w.es) for w in words]
        self.rng.shuffle(left)
        self.rng.shuffle(right)
        return ExerciseSpec(
            type=ExerciseType.MATCH_PAIRS,
            instruction="Tap the matching pairs",
            choices=[*left, *right],
        )

    # ---- lesson plans ----------------------------------------------------

    def skill_lessons(self, skill: SkillSpec) -> list[list[ExerciseSpec]]:
        w, s = list(skill.words), list(skill.sentences)
        introduce = [
            self.pick_word(w[0], new=True),
            self.pick_word(w[1], new=True),
            self.word_bank(s[0]),
            self.pick_word(w[2], new=True),
            self.match_pairs(w[:4]),
            self.word_bank(s[1]),
            self.fill_blank(s[0]),
            self.pick_word(w[3], new=True),
        ]
        practise = [
            self.pick_word(w[4], new=True),
            self.word_bank(s[2]),
            self.select_meaning(w[0]),
            self.fill_blank(s[1]),
            self.word_bank(s[0], to_spanish=True),
            self.match_pairs(w[1:5]),
            self.type_answer(s[1]),
            self.word_bank(s[3]),
        ]
        produce = [
            self.type_answer(s[0]),
            self.fill_blank(s[2]),
            self.word_bank(s[1], to_spanish=True),
            self.match_pairs(w[:5]),
            self.select_meaning(w[3]),
            self.type_answer(s[2]),
            self.word_bank(s[3], to_spanish=True),
            self.fill_blank(s[3]),
        ]
        return [introduce, practise, produce]

    def review_lesson(self) -> list[ExerciseSpec]:
        """One mixed lesson covering the whole unit (the trophy node)."""
        s = self.rng.sample(self.sentences, 7)
        w = self.rng.sample(self.words, 7)
        return [
            self.type_answer(s[0]),
            self.word_bank(s[1]),
            self.match_pairs(w[:5]),
            self.fill_blank(s[2]),
            self.pick_word(w[5]),
            self.word_bank(s[3], to_spanish=True),
            self.type_answer(s[4]),
            self.fill_blank(s[5]),
            self.select_meaning(w[6]),
            self.word_bank(s[6]),
        ]
