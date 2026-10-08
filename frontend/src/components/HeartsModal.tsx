"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";

import { CheckIcon, GemIcon, HeartIcon, InfinityHeartIcon, SuperBadge } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { setUser } from "@/lib/hooks";
import type { User } from "@/lib/types";

type Option = "super" | "refill" | "practice";

const SUPER_GRADIENT = "linear-gradient(90deg,#26FF55 0%,#268AFF 52%,#FC55FF 100%)";

function OptionRow({
  selected,
  onSelect,
  icon,
  title,
  trailing,
  gradient = false,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  trailing: ReactNode;
  gradient?: boolean;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="relative block w-full rounded-2xl p-[2px] text-left"
      style={{
        background: gradient
          ? SUPER_GRADIENT
          : selected
            ? "rgb(var(--macaw))"
            : "rgb(var(--line))",
      }}
    >
      {gradient && (
        <span className="absolute -top-[2px] left-0 rounded-br-lg rounded-tl-2xl">
          <SuperBadge className="!rounded-none !rounded-br-lg !rounded-tl-xl !skew-x-0 !text-[11px]" />
        </span>
      )}
      <span className="flex h-[72px] items-center gap-3 rounded-[14px] bg-bg px-5">
        {icon}
        <span className="flex-1 text-[17px] font-extrabold text-ink">{title}</span>
        {trailing}
      </span>
      {selected && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg bg-macaw text-bg">
          <CheckIcon size={14} strokeWidth={8} />
        </span>
      )}
    </button>
  );
}

interface HeartsModalProps {
  open: boolean;
  user: User;
  title?: string;
  /** Hearts were bought back: the caller can carry on. */
  onRefilled: (user: User) => void;
  onPractice: () => void;
  /** "No thanks": give up on the lesson / close. */
  onDismiss: () => void;
}

/** Shown when the learner has no hearts left: refill with gems, practice, or (mock) Super. */
export function HeartsModal({
  open,
  user,
  title = "You ran out of hearts!",
  onRefilled,
  onPractice,
  onDismiss,
}: HeartsModalProps) {
  const { toast, comingSoon } = useToast();
  const [option, setOption] = useState<Option>("super");
  const [busy, setBusy] = useState(false);
  const cost = user.hearts.refill_cost;
  const canAfford = user.gems >= cost;

  async function confirm() {
    if (option === "super") return comingSoon("Super");
    if (option === "practice") return onPractice();
    setBusy(true);
    try {
      const result = await api.purchase("heart_refill");
      setUser(result.user);
      toast({ title: "Hearts refilled!", icon: <HeartIcon size={28} /> });
      onRefilled(result.user);
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "Could not refill hearts" });
    } finally {
      setBusy(false);
    }
  }

  const confirmLabel = {
    super: "Try 4 weeks free",
    refill: canAfford ? "Refill hearts" : "Not enough gems",
    practice: "Practice to earn hearts",
  }[option];

  return (
    <Modal open={open} className="!max-w-[424px]" labelledBy="hearts-modal-title">
      <div className="flex justify-end">
        <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-gem">
          <GemIcon size={22} /> {user.gems}
        </span>
      </div>
      <h2 id="hearts-modal-title" className="mb-6 mt-4 text-center text-[23px] font-extrabold">
        {title}
      </h2>
      <div role="radiogroup" className="flex flex-col gap-4">
        <OptionRow
          gradient
          selected={option === "super"}
          onSelect={() => setOption("super")}
          icon={<InfinityHeartIcon size={26} />}
          title="Unlimited Hearts"
          trailing={
            <span
              className="label-caps bg-clip-text text-[14px] text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg,#FC55FF,#FF4B9A)" }}
            >
              Get Super
            </span>
          }
        />
        <OptionRow
          selected={option === "refill"}
          onSelect={() => setOption("refill")}
          icon={<HeartIcon size={26} />}
          title="Refill"
          trailing={
            <span
              className={clsx(
                "flex items-center gap-1 text-[15px] font-extrabold",
                canAfford ? "text-gem" : "text-muted",
              )}
            >
              <GemIcon size={18} /> {cost}
            </span>
          }
        />
        <OptionRow
          selected={option === "practice"}
          onSelect={() => setOption("practice")}
          icon={<HeartIcon size={26} empty />}
          title="Practice"
          trailing={<span className="label-caps text-[14px] text-primary">+1 heart</span>}
        />
      </div>
      <Button
        variant="blue"
        fullWidth
        className="mt-8"
        disabled={busy || (option === "refill" && !canAfford)}
        onClick={confirm}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" fullWidth className="mt-2" onClick={onDismiss}>
        No thanks
      </Button>
    </Modal>
  );
}
