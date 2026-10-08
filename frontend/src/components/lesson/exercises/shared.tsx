"use client";

import clsx from "clsx";
import { useEffect, type ReactNode } from "react";

import { Character } from "@/components/Character";
import { SpeakerIcon } from "@/components/icons";
import { speak, useSpeechAvailability } from "@/lib/audio";
import type { AnswerResult, Exercise, Submission } from "@/lib/types";

/** Contract shared by every exercise type. */
export interface ExerciseProps {
  exercise: Exercise;
  submission: Submission | null;
  onChange: (submission: Submission | null) => void;
  /** Auto-check without pressing CHECK (used by match pairs). */
  onSubmit: (submission: Submission) => void;
  /** Input is frozen while an answer is being checked or feedback is showing. */
  locked: boolean;
  result: AnswerResult | null;
}

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "done";

const OPTION_STYLES: Record<OptionState, string> = {
  idle: "border-line bg-bg text-ink hover:bg-surface",
  selected: "border-selected-line bg-selected-bg text-selected-ink",
  correct: "border-correct-line bg-correct-bg text-correct-ink",
  wrong: "border-wrong-line bg-wrong-bg text-wrong-ink animate-shake",
  done: "border-line bg-bg text-muted opacity-50",
};

const KEY_STYLES: Record<OptionState, string> = {
  idle: "border-line text-muted",
  selected: "border-selected-line text-selected-ink",
  correct: "border-correct-line text-correct-ink",
  wrong: "border-wrong-line text-wrong-ink",
  done: "border-line text-muted",
};

export const optionClass = (state: OptionState) =>
  clsx(
    "rounded-xl border-2 border-b-4 transition-[background-color,border-color,color] duration-100",
    "active:mt-[2px] active:border-b-2 disabled:cursor-default disabled:active:mt-0 disabled:active:border-b-4",
    OPTION_STYLES[state],
  );

/** The little numbered box showing an option's keyboard shortcut. */
export function KeyHint({ label, state }: { label: string | number; state: OptionState }) {
  return (
    <span
      className={clsx(
        "hidden h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border-2 text-[15px] font-extrabold sm:flex",
        KEY_STYLES[state],
      )}
    >
      {label}
    </span>
  );
}

/** Pressing 1-9 picks the matching option. */
export function useNumberKeys(count: number, enabled: boolean, onPick: (index: number) => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLTextAreaElement || event.metaKey || event.ctrlKey) return;
      const digit = event.key === "0" ? 10 : Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= count) onPick(digit - 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [count, enabled, onPick]);
}

/** A character "saying" the prompt in a speech bubble; Spanish prompts can be replayed. */
export function PromptBubble({
  exercise,
  children,
}: {
  exercise: Exercise;
  children?: ReactNode;
}) {
  // The replay button only makes sense if this browser has a voice for the language.
  const canHear = useSpeechAvailability("es") !== "unavailable";
  const speakable = exercise.prompt_language === "es" && !children && canHear;

  // Read Spanish prompts aloud as the exercise appears.
  useEffect(() => {
    if (speakable) speak(exercise.prompt_text, exercise.prompt_language);
  }, [speakable, exercise.prompt_text, exercise.prompt_language]);

  return (
    <div className="flex items-center gap-2">
      <Character name={exercise.character} size={148} className="shrink-0" />
      <div className="relative mb-3 rounded-xl border-2 border-line px-3.5 py-2.5">
        <span className="absolute -left-[8px] top-1/2 -mt-[7px] h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-line bg-bg" />
        <div className="relative flex items-center gap-2.5 text-[19px] font-semibold leading-7">
          {speakable && (
            <button
              aria-label="Listen"
              onClick={() => speak(exercise.prompt_text, exercise.prompt_language)}
              className="shrink-0 text-macaw transition-transform hover:scale-110 active:scale-95"
            >
              <SpeakerIcon size={24} />
            </button>
          )}
          {children ?? (
            <span>
              {(exercise.prompt_text ?? "").split(" ").map((word, index) => (
                <span key={index}>
                  {index > 0 && " "}
                  <span className="border-b-2 border-dotted border-muted pb-0.5">{word}</span>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
