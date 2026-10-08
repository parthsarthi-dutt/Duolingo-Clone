"use client";

import clsx from "clsx";
import useSWR from "swr";

import { CheckIcon, CrossIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { reviewKey } from "@/lib/api";
import type { ReviewItem } from "@/lib/types";

/** "Review lesson": every exercise of the finished session with its solution. */
export function ReviewModal({
  sessionId,
  open,
  onClose,
}: {
  sessionId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { data, error } = useSWR<ReviewItem[]>(open ? reviewKey(sessionId) : null);
  const firstTry = data?.filter((item) => item.correct_first_try).length ?? 0;

  return (
    <Modal open={open} onClose={onClose} className="!max-w-[600px]" labelledBy="review-title">
      <h2 id="review-title" className="text-[25px] font-extrabold">
        Lesson review
      </h2>
      {data && (
        <p className="mt-1 text-[17px] font-semibold text-ink-soft">
          {firstTry} of {data.length} right first time
        </p>
      )}
      {error && (
        <p className="mt-4 text-[17px] font-semibold text-ink-soft">
          The review could not be loaded. Please try again.
        </p>
      )}
      {!data && !error && <p className="label-caps mt-4 text-[15px] text-muted">Loading...</p>}

      <ol className="mt-5 flex flex-col gap-3">
        {data?.map((item) => (
          <li key={item.exercise_id} className="card flex gap-4 px-4 py-3">
            <span
              className={clsx(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface",
                item.correct_first_try ? "text-correct-ink" : "text-wrong-ink",
              )}
              aria-label={item.correct_first_try ? "Right first time" : "Missed at first"}
            >
              {item.correct_first_try ? (
                <CheckIcon size={24} strokeWidth={8} />
              ) : (
                <CrossIcon size={22} strokeWidth={9} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-muted">{item.instruction}</p>
              {item.prompt_text && (
                <p className="text-[17px] font-extrabold">{item.prompt_text.replace(/_+/g, "___")}</p>
              )}
              <p className="text-[17px] font-semibold text-correct-ink">{item.correct_answer}</p>
            </div>
          </li>
        ))}
      </ol>

      <Button fullWidth className="mt-6" onClick={onClose}>
        Done
      </Button>
    </Modal>
  );
}
