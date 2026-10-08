"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import { CheckIcon, CrossIcon, ReportIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { AnswerResult } from "@/lib/types";

const PRAISE = ["Correct!", "Excellent!", "Great job!", "Nicely done!", "Nice!", "Amazing!"];

function FooterShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <footer className={clsx("border-t-2", className)}>
      <div className="mx-auto flex min-h-[100px] w-full max-w-lesson flex-col justify-center gap-4 px-4 py-4 md:min-h-[140px] md:flex-row md:items-center md:justify-between md:px-10">
        {children}
      </div>
    </footer>
  );
}

/** SKIP / CHECK while answering. */
export function AnswerFooter({
  canCheck,
  checking,
  showCheck = true,
  onCheck,
  onSkip,
}: {
  canCheck: boolean;
  checking: boolean;
  showCheck?: boolean;
  onCheck: () => void;
  onSkip: () => void;
}) {
  return (
    <FooterShell className="border-line">
      <Button
        variant="outline"
        disabled={checking}
        onClick={onSkip}
        className="hidden w-[150px] md:inline-flex"
      >
        Skip
      </Button>
      {showCheck && (
        <Button disabled={!canCheck || checking} onClick={onCheck} className="w-full md:w-[150px]">
          Check
        </Button>
      )}
    </FooterShell>
  );
}

/** The signature feedback bar: green praise or the red correct solution, then CONTINUE. */
export function FeedbackFooter({
  result,
  praiseIndex,
  onContinue,
}: {
  result: AnswerResult;
  praiseIndex: number;
  onContinue: () => void;
}) {
  const { toast } = useToast();
  const { correct } = result;
  const tone = correct ? "text-correct-ink" : "text-wrong-ink";
  const thanks = () => toast({ title: "Thanks for your feedback!" });

  let title = PRAISE[praiseIndex % PRAISE.length];
  let detail: string | null = null;
  if (!correct) {
    title = "Correct solution:";
    detail = result.correct_answer;
  } else if (result.typo) {
    title = "You have a typo.";
    detail = result.correct_answer;
  }

  return (
    <FooterShell
      className={clsx("animate-slide-up border-transparent", correct ? "bg-correct-bg" : "bg-wrong-bg")}
    >
      <div className="flex items-center gap-4" role="status" aria-live="assertive">
        <span
          className={clsx(
            "hidden h-20 w-20 shrink-0 animate-pop items-center justify-center rounded-full bg-bg md:flex",
            tone,
          )}
        >
          {correct ? <CheckIcon size={50} strokeWidth={8} /> : <CrossIcon size={46} strokeWidth={9} />}
        </span>
        <div className="min-w-0">
          <h2 className={clsx("text-[24px] font-extrabold leading-tight", tone)}>{title}</h2>
          {detail && <p className={clsx("mt-0.5 text-[17px] font-semibold", tone)}>{detail}</p>}
          <div className={clsx("mt-2 flex flex-wrap gap-x-6 gap-y-1", tone)}>
            {["Too easy", "Too difficult", "Report"].map((label) => (
              <button
                key={label}
                onClick={thanks}
                className="label-caps flex items-center gap-1.5 text-[14px] opacity-90 hover:opacity-100"
              >
                {label === "Report" && <ReportIcon size={16} />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button
        autoFocus
        variant={correct ? "primary" : "danger"}
        onClick={onContinue}
        className="w-full shrink-0 md:w-[150px]"
      >
        Continue
      </Button>
    </FooterShell>
  );
}

/** A lone CONTINUE (or nothing) under interstitial and completion screens. */
export function PlainFooter({
  label = "Continue",
  variant = "primary",
  onContinue,
  secondary,
}: {
  label?: string;
  variant?: "primary" | "blue";
  onContinue?: () => void;
  secondary?: ReactNode;
}) {
  return (
    <FooterShell className="border-line">
      <div className="hidden md:block">{secondary}</div>
      {onContinue && (
        <Button autoFocus variant={variant} onClick={onContinue} className="w-full md:w-[150px]">
          {label}
        </Button>
      )}
    </FooterShell>
  );
}
