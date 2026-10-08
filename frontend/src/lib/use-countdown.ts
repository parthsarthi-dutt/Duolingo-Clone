"use client";

import { useEffect, useState } from "react";

/**
 * Counts down from a server-provided number of seconds.
 * Calls `onElapsed` once when it reaches zero (e.g. to re-fetch regenerated hearts).
 */
export function useCountdown(seconds: number | null, onElapsed?: () => void): number | null {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds === null) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const left = seconds - Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(left, 0));
      if (left <= 0) {
        window.clearInterval(timer);
        onElapsed?.();
      }
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return remaining;
}
