"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  BoltIcon,
  ChestIcon,
  LeagueBadge,
  StarIcon,
  SuperBadge,
  TargetIcon,
} from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { capitalize } from "@/lib/format";
import { useLeaderboard, useQuests } from "@/lib/hooks";
import type { Quest } from "@/lib/types";

function RailCard({
  title,
  action,
  children,
}: {
  title?: string;
  action?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <section className="card px-[18px] py-5">
      {title && (
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-extrabold">{title}</h2>
          {action && (
            <Link href={action.href} className="label-caps text-[14px] text-macaw hover:brightness-125">
              {action.label}
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/** Subscription upsell. Purchases are out of scope, so the button is a placeholder. */
export function SuperCard() {
  const { comingSoon } = useToast();
  return (
    <RailCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SuperBadge />
          <h2 className="mt-3 text-[19px] font-extrabold">Try Super for free</h2>
          <p className="mt-2 text-[16px] font-semibold leading-6 text-ink-soft">
            No ads, personalized practice, and unlimited Legendary!
          </p>
        </div>
        <Mascot tone="super" mood="happy" size={96} className="-mr-1 -mt-1 shrink-0" />
      </div>
      <Button variant="super" fullWidth className="mt-5" onClick={() => comingSoon("Super")}>
        Start my free month
      </Button>
    </RailCard>
  );
}

export function LeagueCard() {
  const { data: board } = useLeaderboard();
  if (!board) return null;
  const { my_rank: rank, promotion_slots: slots, my_weekly_xp: xp } = board;
  const message =
    rank <= slots
      ? `Keep it up to stay in the top ${slots}!`
      : rank <= slots + 2
        ? `You're almost at the top ${slots}!`
        : `You've earned ${xp} XP this week so far`;
  return (
    <RailCard
      title={`${capitalize(board.league)} League`}
      action={{ label: "View league", href: "/leaderboard" }}
    >
      <div className="flex items-center gap-5 pl-1">
        <LeagueBadge league={board.league} size={62} />
        <div>
          <p className="text-[17px] font-extrabold">
            You&apos;re ranked <span className="text-primary">#{rank}</span>
          </p>
          <p className="mt-1 text-[16px] font-semibold leading-6 text-ink-soft">{message}</p>
        </div>
      </div>
    </RailCard>
  );
}

const QUEST_ICONS: Record<string, ReactNode> = {
  bolt: <BoltIcon size={46} />,
  book: <span className="text-fox"><StarIcon size={46} /></span>,
  target: <TargetIcon size={44} />,
};

export function QuestRow({ quest }: { quest: Quest }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex w-[46px] shrink-0 justify-center">
        {QUEST_ICONS[quest.icon] ?? QUEST_ICONS.bolt}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-[17px] font-extrabold">{quest.title}</p>
        <div className="flex items-center">
          <ProgressBar
            value={quest.progress}
            max={quest.target}
            color="#FFC800"
            height={18}
            label={`${quest.progress} / ${quest.target}`}
          />
          <ChestIcon size={34} tone={quest.completed ? "opened" : "ready"} className="-ml-2 shrink-0" />
        </div>
      </div>
    </div>
  );
}

/** The daily XP goal, shown as the first daily quest. */
export function DailyQuestsCard() {
  const { data } = useQuests();
  if (!data) return null;
  return (
    <RailCard title="Daily Quests" action={{ label: "View all", href: "/quests" }}>
      <div className="pb-2 pl-2 pt-1">
        <QuestRow quest={data.quests[0]} />
      </div>
    </RailCard>
  );
}

export { RailCard };
