"use client";

import clsx from "clsx";
import { Fragment } from "react";

import { AvatarRing, LeagueBadge, MedalIcon } from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { DailyQuestsCard, SuperCard } from "@/components/layout/RailCards";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { capitalize, initial, plural } from "@/lib/format";
import { useLeaderboard } from "@/lib/hooks";
import type { Leaderboard, LeaderboardEntry } from "@/lib/types";

import { UserAvatar } from "@/components/ui/UserAvatar";

function Rank({ rank }: { rank: number }) {
  if (rank <= 3) return <MedalIcon place={rank as 1 | 2 | 3} size={34} />;
  return <span className="text-[17px] font-extrabold text-primary">{rank}</span>;
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li
      className={clsx(
        "flex h-[64px] items-center gap-4 rounded-xl px-4",
        entry.is_me ? "bg-surface text-primary" : "text-ink",
      )}
    >
      <span className="flex w-9 shrink-0 justify-center">
        <Rank rank={entry.rank} />
      </span>
      <span className="relative shrink-0">
        <UserAvatar avatarConfig={entry.avatar_color} displayName={entry.display_name} size={48} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[17px] font-extrabold">{entry.display_name}</span>
      <span className={clsx("text-[17px] font-semibold", !entry.is_me && "text-ink-soft")}>
        {entry.weekly_xp} XP
      </span>
    </li>
  );
}

function League({ board }: { board: Leaderboard }) {
  const tier = board.leagues.indexOf(board.league);
  const upcoming = board.leagues.slice(tier + 1, tier + 4);
  return (
    <div className="pt-6">
      <div className="flex items-end justify-center gap-4 sm:gap-6">
        <LeagueBadge league={board.league} size={92} />
        {upcoming.map((league) => (
          <LeagueBadge key={league} league={league} locked size={62} className="mb-2" />
        ))}
      </div>
      <h1 className="mt-5 text-center text-[25px] font-extrabold">
        {capitalize(board.league)} League
      </h1>
      <p className="mt-2 text-center text-[17px] font-semibold text-ink-soft">
        Top {board.promotion_slots} advance to the next league
      </p>
      <p className="mt-1 text-center text-[17px] font-extrabold text-bee">
        {plural(board.days_left, "day")}
      </p>
      <ol className="mt-5 border-t-2 border-line pt-2">
        {board.entries.map((entry) => (
          <Fragment key={entry.user_id}>
            <Row entry={entry} />
            {entry.rank === board.promotion_slots && (
              <li className="label-caps flex items-center justify-center gap-3 py-3 text-[14px] text-primary">
                <span>▲</span> Promotion zone <span>▲</span>
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: board, error, mutate } = useLeaderboard();
  return (
    <PageShell
      rail={
        <>
          <DailyQuestsCard />
          <SuperCard />
        </>
      }
    >
      {board ? (
        <League board={board} />
      ) : error ? (
        <PageError message={error.message} onRetry={() => void mutate()} />
      ) : (
        <PageLoading />
      )}
    </PageShell>
  );
}
