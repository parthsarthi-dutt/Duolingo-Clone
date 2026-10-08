"use client";

import { PromptBubble, type ExerciseProps } from "./shared";

/** Free-text translation. Enter submits (handled by the lesson's key listener). */
export function TypeAnswer({ exercise, submission, onChange, locked }: ExerciseProps) {
  const target = exercise.prompt_language === "es" ? "English" : "Spanish";
  return (
    <div>
      <PromptBubble exercise={exercise} />
      <textarea
        autoFocus
        value={submission?.text ?? ""}
        disabled={locked}
        onChange={(event) => {
          const text = event.target.value;
          onChange(text.trim() ? { text } : null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault(); // no line breaks: Enter checks
        }}
        placeholder={`Type in ${target}`}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        lang={target === "English" ? "en" : "es"}
        className="mt-2 h-[150px] w-full resize-none rounded-xl border-2 border-line bg-surface p-3.5 text-[19px] font-semibold text-ink outline-none placeholder:text-muted focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
