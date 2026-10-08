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

/**
 * Pick one option. Rendered as picture cards when every option has artwork
 * ("Which one of these is coffee?"), otherwise as a list under a prompt bubble.
 */
export function MultipleChoice({ exercise, submission, onChange, locked, result }: ExerciseProps) {
  const { choices } = exercise;
  const asCards = choices.every((choice) => choice.image);
  const selectedId = submission?.choice_id ?? null;

  const pick = useCallback(
    (choice: Choice) => {
      // The word itself is the feedback when it can be read aloud; otherwise a soft click.
      if (!speak(choice.text, choice.language)) playSound("tap");
      onChange({ choice_id: choice.id });
    },
    [onChange],
  );
  useNumberKeys(choices.length, !locked, (index) => pick(choices[index]));

  const stateOf = (choice: Choice): OptionState => {
    if (choice.id !== selectedId) return "idle";
    return result?.correct ? "correct" : "selected";
  };

  if (asCards) {
    return (
      <div role="radiogroup" className="mt-8 grid grid-cols-3 gap-2 sm:mt-16">
        {choices.map((choice, index) => {
          const state = stateOf(choice);
          return (
            <button
              key={choice.id}
              role="radio"
              aria-checked={choice.id === selectedId}
              disabled={locked}
              onClick={() => pick(choice)}
              className={clsx(
                optionClass(state),
                "flex h-[190px] flex-col px-3 pb-3 pt-4 sm:h-[252px] sm:px-6 sm:pb-6 sm:pt-7",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/vocab/${choice.image}.svg`}
                alt=""
                className="mx-auto min-h-0 w-[82%] flex-1 object-contain sm:w-[130px]"
                draggable={false}
              />
              <span className="mt-3 flex w-full items-center justify-between gap-2">
                <span className="text-[17px] font-bold">{choice.text}</span>
                <KeyHint label={index + 1} state={state} />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {exercise.prompt_text && <PromptBubble exercise={exercise} />}
      <div role="radiogroup" className="mt-2 flex flex-col gap-2">
        {choices.map((choice, index) => {
          const state = stateOf(choice);
          return (
            <button
              key={choice.id}
              role="radio"
              aria-checked={choice.id === selectedId}
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
