"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { SESSION_MODES, type SessionMode } from "@/lib/types";

/**
 * /lesson?skill=12                 next lesson of a skill
 * /lesson?skill=12&mode=practice   review a finished skill
 * /lesson?skill=12&mode=legendary  Legendary challenge for a finished skill
 * /lesson?mode=practice            mixed practice (earns a heart back)
 * /lesson?mode=timed               mixed practice against the clock
 */
function LessonRoute() {
  const params = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const requested = params.get("mode") as SessionMode | null;
  const mode: SessionMode = requested && SESSION_MODES.includes(requested) ? requested : "lesson";
  const skill = Number(params.get("skill"));
  const skillId = Number.isInteger(skill) && skill > 0 ? skill : undefined;
  // A new key remounts the player, so no state leaks between sessions or retries.
  return (
    <LessonPlayer
      key={`${mode}:${skillId ?? ""}:${attempt}`}
      mode={mode}
      skillId={skillId}
      onRetry={() => setAttempt((count) => count + 1)}
    />
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonRoute />
    </Suspense>
  );
}
