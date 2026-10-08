"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { mutate } from "swr";

import { BoltIcon, CheckIcon, FlagIcon, FlameIcon, GemIcon, HeartIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api, keys } from "@/lib/api";
import { formatCountdown } from "@/lib/format";
import { setUser, useUser } from "@/lib/hooks";
import type { User } from "@/lib/types";
import { useCountdown } from "@/lib/use-countdown";

function Stat({
  label,
  icon,
  value,
  valueClass,
  align = "center",
  children,
}: {
  label: string;
  icon: ReactNode;
  value?: ReactNode;
  valueClass?: string;
  align?: "left" | "center" | "right";
  children: ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        aria-label={label}
        className="flex h-[50px] items-center gap-2.5 rounded-xl px-2.5 hover:bg-surface"
      >
        {icon}
        {value !== undefined && (
          <span className={clsx("text-[15px] font-extrabold", valueClass)}>{value}</span>
        )}
      </button>
      {/* Hover / focus popover */}
      <div
        className={clsx(
          "invisible absolute top-full z-40 w-[320px] max-w-[calc(100vw-24px)] pt-1 opacity-0 transition-opacity duration-150",
          "group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
          align === "left" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "right" && "right-0",
        )}
      >
        <div className="card bg-bg p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">{children}</div>
      </div>
    </div>
  );
}

export function WeekStrip({ user, className }: { user: User; className?: string }) {
  return (
    <div className={clsx("flex justify-between gap-1", className)}>
      {user.streak.week.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-2">
          <span
            className={clsx(
              "text-[15px] font-extrabold",
              day.active ? "text-fox" : day.is_today ? "text-ink" : "text-muted",
            )}
          >
            {day.label}
          </span>
          <span
            className={clsx(
              "flex h-[30px] w-[30px] items-center justify-center rounded-full",
              day.active ? "bg-fox text-bg" : "bg-line",
            )}
          >
            {day.active && <CheckIcon size={20} strokeWidth={6} />}
          </span>
        </div>
      ))}
    </div>
  );
}

function HeartsPanel({ user }: { user: User }) {
  const router = useRouter();
  const { toast } = useToast();
  const [buying, setBuying] = useState(false);
  const { current, max, refill_cost } = user.hearts;
  const remaining = useCountdown(user.hearts.seconds_to_next, () => void mutate(keys.me));
  const full = current >= max;

  async function refill() {
    setBuying(true);
    try {
      const result = await api.purchase("heart_refill");
      setUser(result.user);
      void mutate(keys.shop);
      toast({ title: "Hearts refilled!", icon: <HeartIcon size={28} /> });
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "Could not refill hearts" });
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="text-center">
      <h3 className="text-[19px] font-extrabold">Hearts</h3>
      <div className="my-3 flex justify-center gap-1.5">
        {Array.from({ length: max }, (_, index) => (
          <HeartIcon key={index} size={30} empty={index >= current} />
        ))}
      </div>
      <p className="text-[17px] font-extrabold">
        {full
          ? "You have full hearts"
          : remaining !== null
            ? `Next heart in ${formatCountdown(remaining)}`
            : "Hearts are regenerating"}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-ink-soft">
        {full ? "Keep on learning" : "Hearts refill over time, or practice to earn one back."}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          variant="outline"
          fullWidth
          disabled={full || buying || user.gems < refill_cost}
          onClick={refill}
          className="justify-between !text-ink"
        >
          <span className="flex items-center gap-2">
            <HeartIcon size={22} /> Refill hearts
          </span>
          <span className="flex items-center gap-1 text-gem">
            <GemIcon size={18} /> {refill_cost}
          </span>
        </Button>
        <Button
          variant="outline"
          fullWidth
          disabled={full}
          onClick={() => router.push("/lesson?mode=practice")}
          className="!text-macaw"
        >
          Practice to earn hearts
        </Button>
      </div>
    </div>
  );
}

/** Streak / XP / gems / hearts strip. Each stat opens a small detail popover. */
export function StatsBar({ className }: { className?: string }) {
  const { data: user } = useUser();
  const { comingSoon } = useToast();

  if (!user) {
    return <div className={clsx("h-[50px]", className)} aria-hidden="true" />;
  }

  const { streak, daily_goal: goal, hearts } = user;
  const noHearts = hearts.current === 0;

  return (
    <div className={clsx("flex h-[50px] items-center justify-between", className)}>
      <Stat label={`${user.course.title} course`} icon={<FlagIcon size={26} />} align="left">
        <h3 className="label-caps mb-3 text-[13px] text-muted">My courses</h3>
        <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
          <FlagIcon size={26} />
          <span className="text-[17px] font-extrabold">{user.course.title}</span>
        </div>
        <button
          onClick={() => comingSoon("More languages")}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[17px] font-extrabold text-ink-soft hover:bg-surface"
        >
          <span className="flex h-[26px] w-[34px] items-center justify-center rounded-md border-2 border-line text-muted">
            +
          </span>
          Add a new course
        </button>
      </Stat>

      <Stat
        label={`${streak.count} day streak`}
        icon={<FlameIcon size={28} active={streak.active_today} />}
        value={streak.count}
        valueClass={streak.active_today ? "text-fox" : "text-muted"}
      >
        <div className="flex items-center gap-3">
          <FlameIcon size={44} active={streak.active_today} />
          <div>
            <h3 className="text-[19px] font-extrabold">{streak.count} day streak</h3>
            <p className="text-[15px] font-semibold text-ink-soft">
              {streak.active_today
                ? "You extended your streak today!"
                : streak.count > 0
                  ? "Do a lesson today to extend your streak!"
                  : "Do a lesson today to start a new streak!"}
            </p>
          </div>
        </div>
        <WeekStrip user={user} className="mt-4" />
      </Stat>

      <Stat
        label={`${user.total_xp} total XP`}
        icon={<BoltIcon size={26} />}
        value={user.total_xp}
        valueClass="text-bee"
      >
        <h3 className="text-[19px] font-extrabold">Daily goal</h3>
        <div className="mt-3 flex items-center gap-3">
          <BoltIcon size={30} />
          <ProgressBar
            value={goal.earned}
            max={goal.target}
            color="#FFC800"
            height={18}
            label={`${Math.min(goal.earned, goal.target)} / ${goal.target} XP`}
          />
        </div>
        <p className="mt-3 text-[15px] font-semibold text-ink-soft">
          {goal.earned >= goal.target
            ? "Goal reached. Nice work today!"
            : `${goal.target - goal.earned} XP to go today.`}{" "}
          You have earned {user.total_xp} XP in total.
        </p>
        <Link href="/settings" className="label-caps mt-3 inline-block text-[14px] text-macaw">
          Edit goal
        </Link>
      </Stat>

      <Stat label={`${user.gems} gems`} icon={<GemIcon size={26} />} value={user.gems} valueClass="text-gem">
        <div className="flex items-center gap-4">
          <GemIcon size={56} />
          <div>
            <h3 className="text-[19px] font-extrabold">Gems</h3>
            <p className="text-[15px] font-semibold text-ink-soft">You have {user.gems} gems</p>
            <Link href="/shop" className="label-caps mt-2 inline-block text-[14px] text-macaw">
              Go to shop
            </Link>
          </div>
        </div>
      </Stat>

      <Stat
        label={`${hearts.current} hearts`}
        icon={<HeartIcon size={26} empty={noHearts} />}
        value={hearts.current}
        valueClass={noHearts ? "text-muted" : "text-heart"}
        align="right"
      >
        <HeartsPanel user={user} />
      </Stat>
    </div>
  );
}
