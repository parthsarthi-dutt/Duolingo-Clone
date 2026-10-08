"use client";

import { PageShell } from "@/components/layout/PageShell";
import { DailyQuestsCard, LeagueCard, SuperCard } from "@/components/layout/RailCards";
import { LearnPath } from "@/components/learn/LearnPath";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { usePath } from "@/lib/hooks";

export default function LearnPage() {
  const { data: path, error, mutate } = usePath();
  return (
    <PageShell
      rail={
        <>
          <SuperCard />
          <LeagueCard />
          <DailyQuestsCard />
        </>
      }
    >
      {path ? (
        <LearnPath path={path} />
      ) : error ? (
        <PageError message={error.message} onRetry={() => void mutate()} />
      ) : (
        <PageLoading />
      )}
    </PageShell>
  );
}
