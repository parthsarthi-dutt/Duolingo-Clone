import type {
  AnswerResult,
  Exercise,
  FailureReason,
  Hearts,
  LessonSession,
  SessionSummary,
  Submission,
} from "@/lib/types";

/**
 * The lesson loop as a pure state machine:
 *
 *   loading -> answering -> feedback -> (interstitial) -> answering -> ...
 *                                   \-> finishing -> complete
 *                                   \-> lost          (challenge modes only)
 *
 * A missed exercise is appended to the end of the queue, so a lesson only
 * finishes once everything has been answered correctly.
 */

export type Phase =
  | "loading"
  | "failed" // the session could not be started or saved
  | "answering"
  | "feedback"
  | "interstitial"
  | "finishing"
  | "complete"
  | "lost"; // a Legendary challenge ran out of mistakes, or the clock ran out

export interface QueueItem {
  exercise: Exercise;
  isRetry: boolean;
}

export type Interstitial = { kind: "combo"; count: number } | { kind: "review" };

export interface LessonState {
  phase: Phase;
  session: LessonSession | null;
  queue: QueueItem[];
  position: number;
  submission: Submission | null;
  result: AnswerResult | null;
  checking: boolean;
  hearts: Hearts | null;
  /** Legendary: mistakes still allowed. Null in every other mode. */
  livesLeft: number | null;
  lostReason: FailureReason | null;
  solved: number; // exercises answered correctly: drives the progress bar
  combo: number; // consecutive correct answers
  interstitials: Interstitial[]; // screens to show before the next exercise
  reviewIntroShown: boolean;
  summary: SessionSummary | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export type LessonAction =
  | { type: "loaded"; session: LessonSession }
  | { type: "failed"; code: string; message: string }
  | { type: "answer_changed"; submission: Submission | null }
  | { type: "check_started" }
  | { type: "check_failed" }
  | { type: "checked"; result: AnswerResult }
  | { type: "hearts_changed"; hearts: Hearts }
  | { type: "continued" }
  | { type: "timed_out" }
  | { type: "finish_started" }
  | { type: "finished"; summary: SessionSummary };

export const initialLessonState: LessonState = {
  phase: "loading",
  session: null,
  queue: [],
  position: 0,
  submission: null,
  result: null,
  checking: false,
  hearts: null,
  livesLeft: null,
  lostReason: null,
  solved: 0,
  combo: 0,
  interstitials: [],
  reviewIntroShown: false,
  summary: null,
  errorCode: null,
  errorMessage: null,
};

/** Streak lengths that earn a mid-lesson cheer from the mascot. */
const COMBO_MILESTONES = [5, 10];

export const isLastExercise = (state: LessonState) => state.position >= state.queue.length - 1;

/** Phases in which the session is over, one way or another. */
const isOver = (phase: Phase) => phase === "complete" || phase === "lost" || phase === "failed";

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case "loaded":
      return {
        ...initialLessonState,
        phase: "answering",
        session: action.session,
        queue: action.session.exercises.map((exercise) => ({ exercise, isRetry: false })),
        hearts: action.session.hearts,
        livesLeft: action.session.mistakes_allowed,
      };

    case "failed":
      return { ...state, phase: "failed", errorCode: action.code, errorMessage: action.message };

    case "answer_changed":
      return state.phase === "answering" && !state.checking
        ? { ...state, submission: action.submission }
        : state;

    case "check_started":
      return { ...state, checking: true };

    case "check_failed":
      return { ...state, checking: false };

    case "checked": {
      const { result } = action;
      if (result.failure_reason === "time_up") {
        // The server's clock ran out first: there is no answer to show feedback for.
        return { ...state, phase: "lost", checking: false, lostReason: "time_up" };
      }
      const current = state.queue[state.position];
      return {
        ...state,
        phase: "feedback",
        checking: false,
        result,
        hearts: result.hearts,
        livesLeft: result.mistakes_left ?? state.livesLeft,
        // Out of mistakes: show the correct solution first, then the "lost" screen.
        lostReason: result.failed ? result.failure_reason : null,
        solved: state.solved + (result.correct ? 1 : 0),
        combo: result.correct ? state.combo + 1 : 0,
        // A miss comes back at the end of the lesson.
        queue: result.correct
          ? state.queue
          : [...state.queue, { exercise: current.exercise, isRetry: true }],
      };
    }

    case "hearts_changed":
      return { ...state, hearts: action.hearts };

    case "timed_out":
      return isOver(state.phase) || state.phase === "finishing"
        ? state
        : { ...state, phase: "lost", checking: false, lostReason: "time_up" };

    case "continued": {
      if (state.phase === "interstitial") {
        const [, ...rest] = state.interstitials;
        return { ...state, interstitials: rest, phase: rest.length ? "interstitial" : "answering" };
      }
      if (state.phase !== "feedback") return state;
      if (state.lostReason) return { ...state, phase: "lost" };
      if (isLastExercise(state)) return state;

      const next = state.queue[state.position + 1];
      const interstitials: Interstitial[] = [];
      if (state.result?.correct && COMBO_MILESTONES.includes(state.combo)) {
        interstitials.push({ kind: "combo", count: state.combo });
      }
      const startsReview = next.isRetry && !state.reviewIntroShown;
      if (startsReview) interstitials.push({ kind: "review" });

      return {
        ...state,
        phase: interstitials.length ? "interstitial" : "answering",
        position: state.position + 1,
        submission: null,
        result: null,
        interstitials,
        reviewIntroShown: state.reviewIntroShown || startsReview,
      };
    }

    case "finish_started":
      return { ...state, phase: "finishing" };

    case "finished":
      return { ...state, phase: "complete", summary: action.summary };

    default:
      return state;
  }
}

/** Whether the current answer is complete enough to be checked. */
export function canCheck(submission: Submission | null): boolean {
  if (!submission) return false;
  return (
    submission.choice_id !== undefined ||
    (submission.choice_ids?.length ?? 0) > 0 ||
    (submission.text?.trim().length ?? 0) > 0 ||
    (submission.pairs?.length ?? 0) > 0
  );
}
