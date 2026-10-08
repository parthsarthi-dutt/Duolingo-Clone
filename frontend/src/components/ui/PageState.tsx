"use client";

import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";

/** Centered spinner-ish placeholder while a page's data loads. */
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
      <Mascot size={96} className="animate-bounce-soft" />
      <p className="label-caps text-[15px] text-muted">Loading...</p>
    </div>
  );
}

export function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center" role="alert">
      <Mascot size={110} mood="sad" />
      <h2 className="text-[23px] font-extrabold">Something went wrong</h2>
      <p className="max-w-[360px] text-[17px] font-semibold text-ink-soft">{message}</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}
