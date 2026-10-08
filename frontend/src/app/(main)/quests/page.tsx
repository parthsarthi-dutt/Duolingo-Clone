"use client";

import Link from "next/link";

import { BoltIcon, ChestIcon, ClockIcon, GemIcon, LockIcon } from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { QuestRow, RailCard } from "@/components/layout/RailCards";
import { Mascot } from "@/components/Mascot";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { plural } from "@/lib/format";
import { useQuests } from "@/lib/hooks";
import type { Quests } from "@/lib/types";

function WelcomeBanner() {
  return (
    <section className="relative mt-6 flex min-h-[200px] items-center overflow-hidden rounded-2xl bg-[#8F5FCF] px-6 py-8">
      <div className="max-w-[340px] text-[#201347]">
        <h1 className="text-[23px] font-extrabold">Welcome!</h1>
        <p className="mt-3 text-[16px] font-semibold leading-6">
          Complete quests to earn rewards! Quests refresh every day.
        </p>
      </div>
      <div className="absolute bottom-2 right-4 hidden sm:block" aria-hidden="true">
        <ChestIcon size={44} className="absolute -left-6 -top-3 -rotate-12" />
        <Mascot size={132} mood="happy" />
      </div>
    </section>
  );
}

function QuestList({ data }: { data: Quests }) {
  return (
    <>
      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-[24px] font-extrabold">Daily Quests</h2>
        <p className="label-caps flex items-center gap-1.5 text-[15px] text-fox">
          <ClockIcon size={18} /> {plural(data.hours_left, "hour")}
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {data.quests.map((quest) => (
          <li key={quest.key} className="card px-6 py-5">
            <QuestRow quest={quest} />
            <p className="mt-3 flex items-center justify-end gap-1.5 text-[14px] font-extrabold text-ink-soft">
              {quest.completed ? (
                <span className="text-primary">Completed</span>
              ) : (
                <>
                  Reward: <GemIcon size={16} /> <span className="text-gem">{quest.reward_gems}</span>
                </>
              )}
            </p>
          </li>
        ))}
        <li className="card flex items-center gap-6 px-7 py-6 text-muted">
          <LockIcon size={40} className="text-ink-soft" />
          <span className="text-[17px] font-extrabold">More quests unlock soon</span>
        </li>
      </ul>
    </>
  );
}

function MonthlyChallengeCard() {
  return (
    <RailCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold leading-7">Monthly challenges unlock soon!</h2>
          <p className="mt-2 text-[16px] font-semibold leading-6 text-ink-soft">
            Complete each month&apos;s challenge to earn exclusive badges
          </p>
        </div>
        <span className="mt-1 flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full border-[6px] border-[#FFE46B] bg-bee">
          <BoltIcon size={40} dim />
        </span>
      </div>
      <Link
        href="/learn"
        className="label-caps mt-5 flex h-[46px] items-center justify-center rounded-2xl border-2 border-b-4 border-line text-[15px] text-macaw hover:bg-surface active:translate-y-[2px] active:border-b-2"
      >
        Start a lesson
      </Link>
    </RailCard>
  );
}

export default function QuestsPage() {
  const { data, error, mutate } = useQuests();
  return (
    <PageShell rail={<MonthlyChallengeCard />}>
      <WelcomeBanner />
      {data ? (
        <QuestList data={data} />
      ) : error ? (
        <PageError message={error.message} onRetry={() => void mutate()} />
      ) : (
        <PageLoading />
      )}
    </PageShell>
  );
}
