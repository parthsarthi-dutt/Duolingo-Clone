"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState, type ComponentType } from "react";

import { HeartsModal } from "@/components/HeartsModal";
import { CrownIcon, RetryIcon, SparkIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { playSound, speak, stopSpeaking } from "@/lib/audio";
import { refreshProgress, setUser, useUser } from "@/lib/hooks";
import type {
  Exercise as ExerciseData,
  ExerciseType,
  LessonSession,
  SessionMode,
  Submission,
} from "@/lib/types";

import { ExitModal } from "./ExitModal";
import { FillBlank } from "./exercises/FillBlank";
import { MatchPairs } from "./exercises/MatchPairs";
import { MultipleChoice } from "./exercises/MultipleChoice";
import type { ExerciseProps } from "./exercises/shared";
import { TypeAnswer } from "./exercises/TypeAnswer";
import { WordBank } from "./exercises/WordBank";
import { InterstitialScreen } from "./Interstitial";
import { LessonComplete } from "./LessonComplete";
import { AnswerFooter, FeedbackFooter, PlainFooter } from "./LessonFooter";
import { LessonHeader } from "./LessonHeader";
import { canCheck, initialLessonState, isLastExercise, lessonReducer } from "./lesson-state";

const EXERCISES: Record<ExerciseType, ComponentType<ExerciseProps>> = {
  multiple_choice: MultipleChoice,
  word_bank: WordBank,
  match_pairs: MatchPairs,
  fill_blank: FillBlank,
  type_answer: TypeAnswer,
};

/** Where "quit" and "done" lead: challenges started from the practice hub return there. */
const HOME: Record<SessionMode, string> = {
  lesson: "/learn",
  practice: "/learn",
  legendary: "/learn",
  timed: "/practice",
};

// React StrictMode mounts effects twice in development; share the request so
// only one session is created per visit.
const pendingStarts = new Map<string, Promise<LessonSession>>();

function startSessionOnce(mode: SessionMode, skillId?: number): Promise<LessonSession> {
  const key = `${mode}:${skillId ?? ""}`;
  let pending = pendingStarts.get(key);
  if (!pending) {
    pending = api.startSession(mode, skillId);
    pendingStarts.set(key, pending);
    const forget = () => window.setTimeout(() => pendingStarts.delete(key), 500);
    pending.then(forget, forget);
  }
  return pending;
}

/** Exercises whose correct answer is a Spanish sentence (worth reading back). */
function answerIsSpanish(exercise: ExerciseData): boolean {
  if (exercise.type === "fill_blank") return exercise.prompt_language === "es";
  const translates = exercise.type === "word_bank" || exercise.type === "type_answer";
  return translates && exercise.prompt_language === "en";
}

function Badge({ kind }: { kind: "new" | "retry" | "legendary" }) {
  if (kind === "legendary") {
    return (
      <p className="label-caps mb-2 flex items-center gap-2 text-[15px] text-bee">
        <CrownIcon size={24} /> Legendary
      </p>
    );
  }
  return kind === "new" ? (
    <p className="label-caps mb-2 flex items-center gap-2 text-[15px] text-beetle">
      <SparkIcon size={24} /> New word
    </p>
  ) : (
    <p className="label-caps mb-2 flex items-center gap-2 text-[15px] text-fox">
      <RetryIcon size={24} /> Previous mistake
    </p>
  );
}

/** Counts a timed session down. Returns the whole seconds left (null when there is no clock). */
function useCountdownClock(
  limitSeconds: number | null | undefined,
  running: boolean,
  onElapsed: () => void,
): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    if (!limitSeconds) return;
    deadline.current ??= Date.now() + limitSeconds * 1000;
    if (!running) return;
    const tick = () => {
      const left = Math.ceil(((deadline.current ?? 0) - Date.now()) / 1000);
      setSecondsLeft(Math.max(left, 0));
      if (left <= 0) onElapsed();
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [limitSeconds, running, onElapsed]);

  return secondsLeft;
}

interface LessonPlayerProps {
  mode: SessionMode;
  skillId?: number;
  /** Start the same session again from scratch (after losing a challenge). */
  onRetry: () => void;
}

export function LessonPlayer({ mode, skillId, onRetry }: LessonPlayerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: user } = useUser();
  const [state, dispatch] = useReducer(lessonReducer, initialLessonState);
  const [exitOpen, setExitOpen] = useState(false);
  const [heartsOpen, setHeartsOpen] = useState(false);
  const speakTimer = useRef<number | undefined>(undefined);

  const { phase, session, queue, position, submission, result, checking, hearts } = state;
  const current = queue[position];
  const costsHearts = session?.mode === "lesson";
  const home = HOME[session?.mode ?? mode];

  // Leaving the lesson silences anything still being read out.
  useEffect(
    () => () => {
      window.clearTimeout(speakTimer.current);
      stopSpeaking();
    },
    [],
  );

  // ---- start ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    startSessionOnce(mode, skillId).then(
      (started) => !cancelled && dispatch({ type: "loaded", session: started }),
      (error: ApiError) =>
        !cancelled && dispatch({ type: "failed", code: error.code, message: error.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [mode, skillId]);

  // ---- the clock (timed practice) --------------------------------------------
  const onTimeUp = useCallback(() => dispatch({ type: "timed_out" }), []);
  const clockRunning = phase === "answering" || phase === "feedback" || phase === "interstitial";
  const secondsLeft = useCountdownClock(session?.time_limit_seconds, clockRunning, onTimeUp);

  // Losing a challenge: sad trombone, and tell the server the attempt is over.
  useEffect(() => {
    if (phase !== "lost" || !session) return;
    window.clearTimeout(speakTimer.current);
    playSound("fail");
    void api.abandonSession(session.id).catch(() => {});
  }, [phase, session]);

  // ---- check / continue ----------------------------------------------------
  const check = useCallback(
    async (answer: Submission) => {
      if (!session || !current || phase !== "answering" || checking) return;
      dispatch({ type: "check_started" });
      try {
        const graded = await api.submitAnswer(session.id, current.exercise.id, answer);
        if (graded.failure_reason !== "time_up") {
          playSound(graded.correct ? "correct" : "wrong");
        }
        if (graded.correct && answerIsSpanish(current.exercise)) {
          // Hearing the sentence you just built reinforces it; wait for the chime to finish.
          speakTimer.current = window.setTimeout(() => speak(graded.correct_answer, "es"), 650);
        }
        dispatch({ type: "checked", result: graded });
        if (!graded.correct && costsHearts && graded.hearts.current === 0) setHeartsOpen(true);
      } catch (error) {
        dispatch({ type: "check_failed" });
        if (error instanceof ApiError && error.code === "no_hearts") setHeartsOpen(true);
        else toast({ title: error instanceof ApiError ? error.message : "Could not check answer" });
      }
    },
    [session, current, phase, checking, costsHearts, toast],
  );

  const finish = useCallback(async () => {
    if (!session) return;
    dispatch({ type: "finish_started" });
    try {
      const summary = await api.completeSession(session.id);
      setUser(summary.user);
      refreshProgress();
      dispatch({ type: "finished", summary });
    } catch (error) {
      if (error instanceof ApiError && error.code === "time_up") {
        dispatch({ type: "timed_out" });
        return;
      }
      dispatch({
        type: "failed",
        code: error instanceof ApiError ? error.code : "request_failed",
        message: error instanceof ApiError ? error.message : "Could not finish the lesson.",
      });
    }
  }, [session]);

  const dismissInterstitial = useCallback(() => dispatch({ type: "continued" }), []);

  const proceed = useCallback(() => {
    window.clearTimeout(speakTimer.current); // don't talk over the next exercise
    if (phase === "feedback" && costsHearts && hearts?.current === 0) {
      setHeartsOpen(true); // can't go on without hearts
      return;
    }
    const lost = state.lostReason !== null;
    if (phase === "feedback" && !lost && isLastExercise(state)) void finish();
    else dispatch({ type: "continued" });
  }, [phase, costsHearts, hearts, state, finish]);

  // Enter checks the answer, then continues.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || exitOpen || heartsOpen) return;
      if (phase === "answering" && canCheck(submission) && submission) {
        event.preventDefault();
        void check(submission);
      } else if (phase === "feedback") {
        event.preventDefault();
        proceed();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [phase, submission, check, proceed, exitOpen, heartsOpen]);

  // ---- leaving -------------------------------------------------------------
  const leave = useCallback(
    (destination: string) => {
      const stillOpen = phase !== "complete" && phase !== "lost";
      if (session && stillOpen) void api.abandonSession(session.id).catch(() => {});
      refreshProgress();
      router.push(destination);
    },
    [session, phase, router],
  );

  // ---- screens -------------------------------------------------------------
  if (phase === "loading" || phase === "finishing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5" role="status">
        <Mascot size={120} mood="happy" className="animate-bounce-soft" />
        <p className="label-caps text-[17px] text-muted">
          {phase === "loading" ? "Loading..." : "Wrapping up..."}
        </p>
      </div>
    );
  }

  if (phase === "failed") {
    const outOfHearts = state.errorCode === "no_hearts";
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <Mascot size={120} mood="sad" />
        <h1 className="text-[25px] font-extrabold">
          {outOfHearts ? "You ran out of hearts!" : "This lesson can't be opened"}
        </h1>
        <p className="max-w-[380px] text-[17px] font-semibold text-ink-soft">
          {outOfHearts
            ? "Refill your hearts or practice to earn one back."
            : state.errorMessage}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {outOfHearts && (
            <Button variant="blue" onClick={() => router.replace("/lesson?mode=practice")}>
              Practice to earn hearts
            </Button>
          )}
          <Button variant={outOfHearts ? "outline" : "primary"} onClick={() => router.push(home)}>
            Back to learn
          </Button>
        </div>
      </div>
    );
  }

  if (!session) return null;
  const total = session.exercises.length;

  if (phase === "lost") {
    const timeUp = state.lostReason === "time_up";
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <Mascot size={132} mood="sad" className="animate-rise-in" />
        <h1 className="text-[28px] font-extrabold">{timeUp ? "Time's up!" : "Challenge failed"}</h1>
        <p className="max-w-[400px] text-[17px] font-semibold leading-7 text-ink-soft">
          {timeUp
            ? `You finished ${state.solved} of ${total} before the clock ran out. Faster next time!`
            : "That was the last mistake allowed. Legendary takes a few tries: give it another go!"}
        </p>
        <div className="mt-4 flex w-full max-w-[320px] flex-col gap-2">
          <Button variant={timeUp ? "primary" : "gold"} fullWidth onClick={onRetry}>
            Try again
          </Button>
          <Button variant="ghost" fullWidth onClick={() => leave(home)}>
            Quit
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "complete" && state.summary) {
    return (
      <div className="flex min-h-dvh flex-col">
        <LessonComplete summary={state.summary} onDone={() => router.push(home)} />
      </div>
    );
  }

  const Exercise = current ? EXERCISES[current.exercise.type] : null;
  const isMatching = current?.exercise.type === "match_pairs";
  // A word is only "new" the first time through, i.e. in a real lesson.
  const badge = current?.isRetry
    ? "retry"
    : session.mode === "legendary"
      ? "legendary"
      : session.mode === "lesson" && current?.exercise.is_new_word
        ? "new"
        : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <LessonHeader
        mode={session.mode}
        solved={state.solved}
        total={total}
        hearts={hearts}
        livesLeft={state.livesLeft}
        livesMax={session.mistakes_allowed}
        secondsLeft={secondsLeft}
        combo={state.combo}
        showCombo={phase === "feedback" && Boolean(result?.correct)}
        onQuit={() => setExitOpen(true)}
      />

      {phase === "interstitial" && state.interstitials[0] ? (
        <>
          <InterstitialScreen
            interstitial={state.interstitials[0]}
            onContinue={dismissInterstitial}
          />
          <PlainFooter
            onContinue={state.interstitials[0].kind === "review" ? dismissInterstitial : undefined}
          />
        </>
      ) : (
        <>
          <main className="flex flex-1 items-center py-6">
            {current && Exercise && (
              <div key={position} className="mx-auto w-full max-w-exercise animate-rise-in px-4">
                {badge && <Badge kind={badge} />}
                <h1 className="mb-4 text-[25px] font-extrabold leading-tight sm:text-[32px]">
                  {current.exercise.instruction}
                </h1>
                <Exercise
                  exercise={current.exercise}
                  submission={submission}
                  onChange={(next) => dispatch({ type: "answer_changed", submission: next })}
                  onSubmit={(answer) => void check(answer)}
                  locked={phase !== "answering" || checking}
                  result={result}
                />
              </div>
            )}
          </main>

          {phase === "feedback" && result ? (
            <FeedbackFooter result={result} praiseIndex={position} onContinue={proceed} />
          ) : (
            <AnswerFooter
              canCheck={canCheck(submission)}
              checking={checking}
              showCheck={!isMatching}
              onCheck={() => submission && void check(submission)}
              onSkip={() => void check({ skipped: true })}
            />
          )}
        </>
      )}

      <ExitModal open={exitOpen} onStay={() => setExitOpen(false)} onLeave={() => leave(home)} />

      {user && (
        <HeartsModal
          open={heartsOpen}
          user={user}
          onRefilled={(refreshed) => {
            dispatch({ type: "hearts_changed", hearts: refreshed.hearts });
            setHeartsOpen(false);
          }}
          onPractice={() => leave("/lesson?mode=practice")}
          onDismiss={() => leave("/learn")}
        />
      )}
    </div>
  );
}
