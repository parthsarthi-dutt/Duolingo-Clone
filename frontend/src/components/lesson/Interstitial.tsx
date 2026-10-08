"use client";

import { useEffect } from "react";

import { Mascot } from "@/components/Mascot";

import type { Interstitial as InterstitialKind } from "./lesson-state";

const COMBO_CHEERS: Record<number, string> = { 5: "Amazing!", 10: "Unstoppable!" };
const AUTO_ADVANCE_MS = 1800;

/**
 * Between-exercise moments: the mascot pops up from the footer to cheer a
 * streak (auto-advances) or to announce the review of missed exercises.
 */
export function InterstitialScreen({
  interstitial,
  onContinue,
}: {
  interstitial: InterstitialKind;
  onContinue: () => void;
}) {
  const isCombo = interstitial.kind === "combo";

  useEffect(() => {
    if (!isCombo) return;
    const timer = window.setTimeout(onContinue, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [isCombo, onContinue]);

  const message = isCombo
    ? `${COMBO_CHEERS[interstitial.count] ?? "Great!"} ${interstitial.count} in a row!`
    : "Let's review the exercises you missed!";

  return (
    <div className="relative flex-1 overflow-hidden" onClick={isCombo ? onContinue : undefined}>
      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-exercise items-end gap-2 px-4">
        <Mascot size={150} mood={isCombo ? "cheer" : "default"} className="shrink-0 animate-peek" />
        <p
          role="status"
          className="relative mb-9 animate-rise-in rounded-2xl border-2 border-line px-5 py-3.5 text-[17px] font-bold"
        >
          <span className="absolute -left-[8px] top-1/2 -mt-[7px] h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-line bg-bg" />
          <span className="relative">{message}</span>
        </p>
      </div>
    </div>
  );
}
