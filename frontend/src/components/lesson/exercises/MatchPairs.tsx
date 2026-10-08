"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import { playSound, speak } from "@/lib/audio";
import type { Choice } from "@/lib/types";

import { KeyHint, optionClass, useNumberKeys, type ExerciseProps, type OptionState } from "./shared";

const FLASH_MS = 450;

/**
 * Tap a word, then its translation. A wrong pair just shakes (no heart lost);
 * once every pair is matched the exercise submits itself.
 */
export function MatchPairs({ exercise, onSubmit, locked }: ExerciseProps) {
  const half = exercise.choices.length / 2;
  const left = exercise.choices.slice(0, half);
  const right = exercise.choices.slice(half);
  const ordered = [...left, ...right];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pairs, setPairs] = useState<[number, number][]>([]);
  const [flash, setFlash] = useState<{ ids: number[]; kind: "correct" | "wrong" } | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const matchedIds = new Set(pairs.flat());
  const columnOf = (choice: Choice) => (left.includes(choice) ? "left" : "right");

  const tap = useCallback(
    (choice: Choice) => {
      if (locked || matchedIds.has(choice.id) || flash?.kind === "wrong") return;
      const spoken = speak(choice.text, choice.language);
      const selected = exercise.choices.find((c) => c.id === selectedId);

      if (!selected || columnOf(selected) === columnOf(choice)) {
        if (!spoken) playSound("tap");
        setSelectedId(selected?.id === choice.id ? null : choice.id);
        return;
      }

      setSelectedId(null);
      if (selected.pair_key === choice.pair_key) {
        const nextPairs: [number, number][] = [...pairs, [selected.id, choice.id]];
        playSound("match");
        setPairs(nextPairs);
        setFlash({ ids: [selected.id, choice.id], kind: "correct" });
        flashTimer.current = window.setTimeout(() => {
          setFlash(null);
          if (nextPairs.length === half) onSubmit({ pairs: nextPairs });
        }, FLASH_MS);
      } else {
        playSound("wrong");
        setFlash({ ids: [selected.id, choice.id], kind: "wrong" });
        flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locked, selectedId, pairs, flash, exercise.choices, half, onSubmit],
  );
  useNumberKeys(ordered.length, !locked, (index) => tap(ordered[index]));

  const stateOf = (choice: Choice): OptionState => {
    if (flash?.ids.includes(choice.id)) return flash.kind;
    if (matchedIds.has(choice.id)) return "done";
    return choice.id === selectedId ? "selected" : "idle";
  };

  const renderColumn = (column: Choice[], firstKey: number) => (
    <div className="flex flex-1 flex-col gap-2.5">
      {column.map((choice, index) => {
        const state = stateOf(choice);
        return (
          <button
            key={choice.id}
            disabled={locked || state === "done"}
            onClick={() => tap(choice)}
            className={clsx(optionClass(state), "flex min-h-[58px] w-full items-center px-3 sm:px-4")}
          >
            <KeyHint label={(firstKey + index) % 10} state={state} />
            <span className="flex-1 px-1 text-center text-[17px] font-bold sm:pr-[34px]">
              {choice.text}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mt-8 flex gap-4 sm:gap-8">
      {renderColumn(left, 1)}
      {renderColumn(right, half + 1)}
    </div>
  );
}
