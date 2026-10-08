"use client";

import clsx from "clsx";

import { playSound, speak } from "@/lib/audio";
import type { Choice } from "@/lib/types";

import { PromptBubble, type ExerciseProps } from "./shared";

const TILE =
  "tile h-[46px] px-4 text-[19px] font-bold text-ink disabled:cursor-default disabled:active:mt-0 disabled:active:border-b-4";

/** Build the translation by tapping word tiles; tap a placed tile to put it back. */
export function WordBank({ exercise, submission, onChange, locked }: ExerciseProps) {
  const picked = submission?.choice_ids ?? [];
  const byId = new Map(exercise.choices.map((choice) => [choice.id, choice]));

  function add(choice: Choice) {
    if (!speak(choice.text, choice.language)) playSound("tap");
    onChange({ choice_ids: [...picked, choice.id] });
  }

  function remove(id: number) {
    const rest = picked.filter((pickedId) => pickedId !== id);
    onChange(rest.length ? { choice_ids: rest } : null);
  }

  return (
    <div>
      <PromptBubble exercise={exercise} />

      {/* Answer lines: one ruled row per 60px, like a notebook. */}
      <div
        aria-label="Your answer"
        className="flex min-h-[62px] flex-wrap content-start gap-x-2 border-t-2 border-line"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 58px, rgb(var(--line)) 58px 60px)",
        }}
      >
        {picked.map((id) => (
          <button
            key={id}
            disabled={locked}
            onClick={() => remove(id)}
            className={clsx(TILE, "mb-[8px] mt-[6px] animate-pop")}
          >
            {byId.get(id)?.text}
          </button>
        ))}
      </div>

      <div aria-label="Word bank" className="mt-10 flex flex-wrap justify-center gap-2">
        {exercise.choices.map((choice) => {
          const used = picked.includes(choice.id);
          return used ? (
            // An empty slot keeps the bank from reflowing when a tile is used.
            <span
              key={choice.id}
              aria-hidden="true"
              className="h-[46px] select-none rounded-xl bg-line px-4 text-[19px] font-bold text-transparent"
            >
              {choice.text}
            </span>
          ) : (
            <button key={choice.id} disabled={locked} onClick={() => add(choice)} className={TILE}>
              {choice.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
