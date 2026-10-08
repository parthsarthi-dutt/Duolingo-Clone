"use client";

import clsx from "clsx";

import { ClockIcon, CloseIcon, HeartIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Hearts, SessionMode } from "@/lib/types";

interface LessonHeaderProps {
  mode: SessionMode;
  solved: number;
  total: number;
  hearts: Hearts | null;
  /** Legendary: mistakes still allowed, out of `livesMax`. */
  livesLeft: number | null;
  livesMax: number | null;
  /** Timed: seconds remaining on the clock. */
  secondsLeft: number | null;
  /** Consecutive correct answers; shown as "N IN A ROW" while feedback is up. */
  combo: number;
  showCombo: boolean;
  onQuit: () => void;
}

const GOLD = "#FFC800";
const PURPLE = "#CE82FF";
const LOW_TIME = 15;

function formatClock(seconds: number): string {
  const safe = Math.max(seconds, 0);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/** What is at stake, shown at the right of the bar: hearts, challenge lives, or the clock. */
function Stakes({ mode, hearts, livesLeft, livesMax, secondsLeft }: LessonHeaderProps) {
  if (mode === "timed" && secondsLeft !== null) {
    const low = secondsLeft <= LOW_TIME;
    return (
      <div
        role="timer"
        aria-label={`${secondsLeft} seconds left`}
        className={clsx(
          "flex shrink-0 items-center gap-1.5 text-[17px] font-extrabold tabular-nums",
          low ? "animate-pulse text-cardinal" : "text-beetle",
        )}
      >
        <ClockIcon size={24} />
        {formatClock(secondsLeft)}
      </div>
    );
  }
  if (mode === "legendary" && livesMax !== null) {
    return (
      <div
        className="flex shrink-0 items-center gap-1"
        aria-label={`${livesLeft ?? 0} of ${livesMax} mistakes left`}
      >
        {Array.from({ length: livesMax }, (_, index) => (
          <HeartIcon key={index} size={22} empty={index >= (livesLeft ?? 0)} />
        ))}
      </div>
    );
  }
  const empty = hearts?.current === 0;
  return (
    <div className="flex shrink-0 items-center gap-2" aria-label={`${hearts?.current ?? 0} hearts`}>
      <HeartIcon size={26} empty={empty} />
      <span className={clsx("text-[17px] font-extrabold", empty ? "text-muted" : "text-heart")}>
        {hearts?.current ?? ""}
      </span>
    </div>
  );
}

export function LessonHeader(props: LessonHeaderProps) {
  const { mode, solved, total, combo, showCombo, onQuit } = props;
  // Legendary is gold throughout; a normal lesson turns gold on a long streak.
  const barColor =
    mode === "legendary" || combo >= 10 ? GOLD : mode === "timed" ? PURPLE : "rgb(var(--primary))";
  const percent = total > 0 ? (solved / total) * 100 : 0;
  return (
    <header className="mx-auto flex w-full max-w-lesson items-center gap-4 px-4 pt-6 md:gap-6 md:px-10 md:pt-[50px] xl:px-0">
      <button
        aria-label="Quit lesson"
        onClick={onQuit}
        className="shrink-0 text-muted transition-colors hover:text-ink-soft"
      >
        <CloseIcon size={20} />
      </button>
      <div className="relative flex-1">
        {showCombo && combo >= 2 && (
          <span
            className="absolute -top-6 -translate-x-1/2"
            style={{ left: `${Math.max(percent / 2, 8)}%` }}
          >
            <span
              className="label-caps block animate-rise-in whitespace-nowrap text-[13px]"
              style={{ color: barColor }}
            >
              {combo} in a row
            </span>
          </span>
        )}
        <ProgressBar value={solved} max={total} color={barColor} />
      </div>
      <Stakes {...props} />
    </header>
  );
}
