"""Request / response models (the public API contract)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- learner -------------------------------------------------------------


class CourseOut(OrmModel):
    id: int
    title: str
    language_code: str


class HeartsOut(BaseModel):
    current: int
    max: int
    seconds_to_next: int | None  # None when full
    refill_cost: int


class StreakDayOut(BaseModel):
    date: date
    label: str
    active: bool
    is_today: bool


class StreakOut(BaseModel):
    count: int
    longest: int
    active_today: bool
    week: list[StreakDayOut]


class DailyGoalOut(BaseModel):
    target: int
    earned: int


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    joined_at: datetime
    course: CourseOut
    total_xp: int
    gems: int
    hearts: HeartsOut
    streak: StreakOut
    daily_goal: DailyGoalOut
    league: str
    today: date


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=40)
    avatar_color: str | None = Field(default=None, max_length=2000)
    daily_goal_xp: Literal[10, 20, 30, 50] | None = None


# ---- learning path -------------------------------------------------------


class SkillOut(BaseModel):
    id: int
    title: str
    kind: str
    icon: str
    status: Literal["completed", "current", "locked"]
    lessons_total: int
    lessons_completed: int
    reward_gems: int
    is_legendary: bool  # the Legendary challenge for this skill has been won


class UnitOut(BaseModel):
    id: int
    section_index: int
    order_index: int
    title: str
    description: str
    color: str
    skills: list[SkillOut]


class PathOut(BaseModel):
    course: CourseOut
    units: list[UnitOut]


class ChestClaimOut(BaseModel):
    gems_awarded: int
    user: UserOut


class GuidebookPhraseOut(BaseModel):
    text: str
    translation: str


class GuidebookWordOut(BaseModel):
    text: str
    translation: str
    image: str | None


class GuidebookOut(BaseModel):
    unit_id: int
    title: str
    description: str
    phrases: list[GuidebookPhraseOut]
    words: list[GuidebookWordOut]


# ---- lesson sessions -----------------------------------------------------


class ChoiceOut(OrmModel):
    id: int
    text: str
    language: str | None
    image: str | None
    pair_key: str | None  # only set for match-pairs exercises


class ExerciseOut(OrmModel):
    id: int
    type: str
    instruction: str
    prompt_text: str | None
    prompt_language: str | None
    prompt_translation: str | None
    character: str | None
    is_new_word: bool
    choices: list[ChoiceOut]


class SessionCreate(BaseModel):
    mode: Literal["lesson", "practice", "legendary", "timed"] = "lesson"
    skill_id: int | None = None


class SessionOut(BaseModel):
    id: int
    mode: str
    skill_id: int | None
    title: str
    lesson_number: int | None
    lessons_total: int | None
    xp_reward: int
    exercises: list[ExerciseOut]
    hearts: HeartsOut
    mistakes_allowed: int | None  # legendary: the challenge is lost after this many misses
    time_limit_seconds: int | None  # timed: seconds on the clock


class AnswerIn(BaseModel):
    exercise_id: int
    choice_id: int | None = None  # multiple_choice, fill_blank
    choice_ids: list[int] | None = None  # word_bank (tokens in order)
    text: str | None = Field(default=None, max_length=500)  # type_answer
    pairs: list[tuple[int, int]] | None = None  # match_pairs
    skipped: bool = False


class AnswerOut(BaseModel):
    correct: bool
    typo: bool
    correct_answer: str
    hearts: HeartsOut
    mistakes_left: int | None = None  # legendary only
    failed: bool = False  # the challenge just ended in defeat
    failure_reason: Literal["out_of_mistakes", "time_up"] | None = None


class ReviewItemOut(BaseModel):
    """One exercise of a finished session, for the "Review lesson" screen."""

    exercise_id: int
    type: str
    instruction: str
    prompt_text: str | None
    correct_answer: str
    attempts: int
    correct_first_try: bool


class QuestRewardOut(BaseModel):
    title: str
    reward_gems: int


class AchievementUnlockOut(BaseModel):
    key: str
    title: str
    level: int
    icon: str
    color: str


class SessionSummaryOut(BaseModel):
    session_id: int
    mode: str
    skill_id: int | None
    xp_earned: int
    accuracy: int
    perfect: bool
    skill_completed: bool
    legendary_available: bool  # the skill was just finished: offer the Legendary challenge
    became_legendary: bool
    lessons_completed: int | None
    lessons_total: int | None
    hearts_awarded: int
    streak_extended: bool
    daily_goal_reached: bool  # crossed the goal with this lesson
    completed_quests: list[QuestRewardOut]
    unlocked_achievements: list[AchievementUnlockOut]
    user: UserOut


# ---- leaderboard / quests / profile / shop -------------------------------


class LeaderboardEntryOut(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_color: str
    weekly_xp: int
    is_me: bool


class LeaderboardOut(BaseModel):
    league: str
    leagues: list[str]
    days_left: int
    promotion_slots: int
    my_rank: int
    my_weekly_xp: int
    entries: list[LeaderboardEntryOut]


class QuestOut(BaseModel):
    key: str
    title: str
    icon: str
    progress: int
    target: int
    completed: bool
    reward_gems: int


class QuestsOut(BaseModel):
    hours_left: int
    quests: list[QuestOut]


class AchievementOut(BaseModel):
    key: str
    title: str
    description: str
    icon: str
    color: str
    level: int  # tiers already unlocked
    max_level: int
    progress: int
    target: int  # threshold of the tier being worked on
    maxed: bool


class ProfileStatsOut(BaseModel):
    lessons_completed: int
    perfect_lessons: int
    skills_completed: int
    league_rank: int


class ProfileOut(BaseModel):
    user: UserOut
    stats: ProfileStatsOut
    achievements: list[AchievementOut]


class ShopItemOut(BaseModel):
    key: str
    title: str
    description: str
    icon: str
    price: int | None  # gems; None => not purchasable (placeholder)
    available: bool
    unavailable_reason: str | None


class PurchaseIn(BaseModel):
    item_key: str


class PurchaseOut(BaseModel):
    message: str
    user: UserOut


# ---- developer tools -----------------------------------------------------


class AdvanceDayIn(BaseModel):
    days: int = Field(default=1, ge=1, le=30)
