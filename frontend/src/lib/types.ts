/** Mirrors the backend's response models (backend/app/schemas.py). */

export interface Course {
  id: number;
  title: string;
  language_code: string;
}

export interface Hearts {
  current: number;
  max: number;
  seconds_to_next: number | null;
  refill_cost: number;
}

export interface StreakDay {
  date: string;
  label: string;
  active: boolean;
  is_today: boolean;
}

export interface Streak {
  count: number;
  longest: number;
  active_today: boolean;
  week: StreakDay[];
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  joined_at: string;
  course: Course;
  total_xp: number;
  gems: number;
  hearts: Hearts;
  streak: Streak;
  daily_goal: { target: number; earned: number };
  league: string;
  today: string;
}

export type SkillStatus = "completed" | "current" | "locked";
export type SkillIcon = "star" | "book" | "dumbbell" | "trophy" | "chest";

export interface Skill {
  id: number;
  title: string;
  kind: "lesson" | "chest";
  icon: SkillIcon;
  status: SkillStatus;
  lessons_total: number;
  lessons_completed: number;
  reward_gems: number;
  is_legendary: boolean;
}

export interface Unit {
  id: number;
  section_index: number;
  order_index: number;
  title: string;
  description: string;
  color: string;
  skills: Skill[];
}

export interface Path {
  course: Course;
  units: Unit[];
}

export type ExerciseType =
  | "multiple_choice"
  | "word_bank"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export interface Choice {
  id: number;
  text: string;
  language: string | null;
  image: string | null;
  pair_key: string | null;
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  instruction: string;
  prompt_text: string | null;
  prompt_language: string | null;
  prompt_translation: string | null;
  character: string | null;
  is_new_word: boolean;
  choices: Choice[];
}

/**
 * lesson: costs hearts, moves the path forward · practice: risk-free, earns a heart
 * legendary: extra-hard replay with limited mistakes · timed: practice against the clock
 */
export type SessionMode = "lesson" | "practice" | "legendary" | "timed";

export const SESSION_MODES: SessionMode[] = ["lesson", "practice", "legendary", "timed"];

export interface LessonSession {
  id: number;
  mode: SessionMode;
  skill_id: number | null;
  title: string;
  lesson_number: number | null;
  lessons_total: number | null;
  xp_reward: number;
  exercises: Exercise[];
  hearts: Hearts;
  mistakes_allowed: number | null; // legendary
  time_limit_seconds: number | null; // timed
}

export type FailureReason = "out_of_mistakes" | "time_up";

/** What the learner submits for an exercise; which field is used depends on its type. */
export interface Submission {
  choice_id?: number;
  choice_ids?: number[];
  text?: string;
  pairs?: [number, number][];
  skipped?: boolean;
}

export interface AnswerResult {
  correct: boolean;
  typo: boolean;
  correct_answer: string;
  hearts: Hearts;
  mistakes_left: number | null;
  failed: boolean;
  failure_reason: FailureReason | null;
}

export interface ReviewItem {
  exercise_id: number;
  type: ExerciseType;
  instruction: string;
  prompt_text: string | null;
  correct_answer: string;
  attempts: number;
  correct_first_try: boolean;
}

export interface Guidebook {
  unit_id: number;
  title: string;
  description: string;
  phrases: { text: string; translation: string }[];
  words: { text: string; translation: string; image: string | null }[];
}

export interface AchievementUnlock {
  key: string;
  title: string;
  level: number;
  icon: string;
  color: string;
}

export interface SessionSummary {
  session_id: number;
  mode: SessionMode;
  skill_id: number | null;
  xp_earned: number;
  accuracy: number;
  perfect: boolean;
  skill_completed: boolean;
  legendary_available: boolean;
  became_legendary: boolean;
  lessons_completed: number | null;
  lessons_total: number | null;
  hearts_awarded: number;
  streak_extended: boolean;
  daily_goal_reached: boolean;
  completed_quests: { title: string; reward_gems: number }[];
  unlocked_achievements: AchievementUnlock[];
  user: User;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_color: string;
  weekly_xp: number;
  is_me: boolean;
}

export interface Leaderboard {
  league: string;
  leagues: string[];
  days_left: number;
  promotion_slots: number;
  my_rank: number;
  my_weekly_xp: number;
  entries: LeaderboardEntry[];
}

export interface Quest {
  key: string;
  title: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  reward_gems: number;
}

export interface Quests {
  hours_left: number;
  quests: Quest[];
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  max_level: number;
  progress: number;
  target: number;
  maxed: boolean;
}

export interface Profile {
  user: User;
  stats: {
    lessons_completed: number;
    perfect_lessons: number;
    skills_completed: number;
    league_rank: number;
  };
  achievements: Achievement[];
}

export interface ShopItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  price: number | null;
  available: boolean;
  unavailable_reason: string | null;
}
