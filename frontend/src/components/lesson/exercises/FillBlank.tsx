"use client";

import clsx from "clsx";
import { useCallback } from "react";

import { playSound, speak } from "@/lib/audio";
import type { Choice } from "@/lib/types";

import {
  KeyHint,
  PromptBubble,
  optionClass,
  useNumberKeys,
  type ExerciseProps,
  type OptionState,
} from "./shared";

const BLANK = "___";

/** A sentence with one missing word; pick the option that completes it. */
export function FillBlank({ exercise, submission, onChange, locked, result }: ExerciseProps) {
  const { choices } = exercise;
  const selected = choices.find((choice) => choice.id === submission?.choice_id) ?? null;
  const [before, after = ""] = (exercise.prompt_text ?? "").split(BLANK);

  const pick = useCallback(
    (choice: Choice) => {
      if (!speak(choice.text, choice.language)) playSound("tap");
      onChange({ choice_id: choice.id });
    },
    [onChange],
  );
  useNumberKeys(choices.length, !locked, (index) => pick(choices[index]));

  const stateOf = (choice: Choice): OptionState => {
    if (choice.id !== selected?.id) return "idle";
    return result?.correct ? "correct" : "selected";
  };

  return (
    <div>
      <PromptBubble exercise={exercise}>
        <span>
          {before}
          <span
            className={clsx(
              "mx-1 inline-block min-w-[72px] border-b-2 px-1 text-center align-baseline",
              selected ? "border-selected-line text-selected-ink" : "border-muted",
              result?.correct && "!border-correct-line !text-correct-ink",
            )}
          >
            {selected ? selected.text : " "}
          </span>
          {after}
        </span>
      </PromptBubble>
      {exercise.prompt_translation && (
        <p className="mb-4 mt-1 text-[17px] font-semibold text-ink-soft">
          {exercise.prompt_translation}
        </p>
      )}
      <div role="radiogroup" className="flex flex-col gap-2">
        {choices.map((choice, index) => {
          const state = stateOf(choice);
          return (
            <button
              key={choice.id}
              role="radio"
              aria-checked={choice.id === selected?.id}
              disabled={locked}
              onClick={() => pick(choice)}
              className={clsx(optionClass(state), "flex min-h-[58px] w-full items-center px-4")}
            >
              <KeyHint label={index + 1} state={state} />
              <span className="flex-1 px-2 text-center text-[17px] font-bold sm:pr-[38px]">
                {choice.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
