"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  AvatarRing,
  BoltIcon,
  BookIcon,
  ChevronRightIcon,
  CrownIcon,
  FlagIcon,
  FlameIcon,
  LeagueBadge,
  PencilIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { RailCard } from "@/components/layout/RailCards";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { capitalize, formatJoined, initial } from "@/lib/format";
import { useProfile } from "@/lib/hooks";
import { BADGE_COLORS } from "@/lib/theme";
import type { Achievement, Profile } from "@/lib/types";

const BADGE_ICONS: Record<string, ReactNode> = {
  flame: <FlameIcon size={40} />,
  bolt: <BoltIcon size={40} />,
  book: <BookIcon size={44} />,
  target: <TargetIcon size={40} />,
  trophy: <TrophyIcon size={44} />,
  crown: <CrownIcon size={46} />,
};

function StatTile({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="card flex items-start gap-3 px-5 py-4">
      <span className="mt-0.5 flex w-7 shrink-0 justify-center">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[19px] font-extrabold leading-6">{value}</p>
        <p className="text-[16px] font-semibold text-muted">{label}</p>
      </div>
    </div>
  );
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  const color = BADGE_COLORS[achievement.color] ?? BADGE_COLORS.green;
  // The badge shows the tier being worked towards, like the real app.
  const displayLevel = Math.min(achievement.level + 1, achievement.max_level);
  return (
    <li className="flex items-center gap-5 border-b-2 border-line px-5 py-5 last:border-b-0">
      <div
        className="flex h-[94px] w-[78px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl text-white"
        style={{ backgroundColor: color.base, boxShadow: `0 4px 0 ${color.shadow}` }}
      >
        {BADGE_ICONS[achievement.icon]}
        <span className="label-caps text-[11px] text-black/45">
          {achievement.maxed ? "Max level" : `Level ${displayLevel}`}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[19px] font-extrabold">{achievement.title}</h3>
          <span className="text-[16px] font-semibold text-muted">
            {achievement.progress}/{achievement.target}
          </span>
        </div>
        <ProgressBar
          value={achievement.progress}
          max={achievement.target}
          color="#FFC800"
          className="my-3"
        />
        <p className="text-[17px] font-semibold text-ink-soft">{achievement.description}</p>
      </div>
    </li>
  );
}

import { UserAvatar } from "@/components/ui/UserAvatar";

function ProfileBody({ profile }: { profile: Profile }) {
  const { comingSoon } = useToast();
  const { user, stats, achievements } = profile;
  return (
    <div className="pt-6">
      <div className="relative flex h-[222px] items-end justify-center overflow-hidden rounded-2xl bg-surface">
        <span className="-mb-10 block rounded-full border-4 border-dashed border-macaw bg-selected-ink/20 shadow-[0_0_0_8px_rgb(var(--surface))]">
          <UserAvatar avatarConfig={user.avatar_color} displayName={user.display_name} size={180} />
        </span>
        <Link
          href="/settings"
          aria-label="Edit profile"
          className="tile absolute right-4 top-4 flex h-[46px] w-[46px] items-center justify-center text-ink"
        >
          <PencilIcon size={20} />
        </Link>
      </div>

      <div className="flex items-end justify-between gap-4 border-b-2 border-line pb-6 pt-6">
        <div className="min-w-0">
          <h1 className="truncate text-[25px] font-extrabold">{user.display_name}</h1>
          <p className="text-[16px] font-semibold text-muted">{user.username}</p>
          <p className="mt-2 text-[16px] font-semibold text-ink-soft">
            Joined {formatJoined(user.joined_at)}
          </p>
          <p className="mt-2 flex gap-5">
            {["0 Following", "0 Followers"].map((label) => (
              <button
                key={label}
                onClick={() => comingSoon("Following other learners")}
                className="text-[16px] font-extrabold text-macaw"
              >
                {label}
              </button>
            ))}
          </p>
        </div>
        <FlagIcon size={26} className="mb-1 shrink-0" />
      </div>

      <h2 className="pb-4 pt-8 text-[24px] font-extrabold">Statistics</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          icon={<FlameIcon size={26} active={user.streak.count > 0} />}
          value={user.streak.count}
          label="Day streak"
        />
        <StatTile icon={<BoltIcon size={26} />} value={user.total_xp} label="Total XP" />
        <StatTile
          icon={<LeagueBadge league={user.league} size={28} />}
          value={`${capitalize(user.league)} · #${stats.league_rank}`}
          label="Current league"
        />
        <StatTile
          icon={<span className="text-bee"><StarIcon size={26} /></span>}
          value={stats.lessons_completed}
          label="Lessons completed"
        />
      </div>

      <h2 className="pb-4 pt-8 text-[24px] font-extrabold">Achievements</h2>
      <ul className="card">
        {achievements.map((achievement) => (
          <AchievementRow key={achievement.key} achievement={achievement} />
        ))}
      </ul>
    </div>
  );
}

function FriendsCards() {
  const { comingSoon } = useToast();
  const rows = ["Find friends", "Invite friends"];
  return (
    <>
      <section className="card overflow-hidden">
        <div className="flex border-b-2 border-line">
          <span className="label-caps flex-1 border-b-2 border-macaw py-4 text-center text-[15px] text-macaw">
            Following
          </span>
          <span className="label-caps flex-1 py-4 text-center text-[15px] text-ink-soft">
            Followers
          </span>
        </div>
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <AvatarRing letter="+" size={64} />
          <p className="mt-4 text-[17px] font-semibold leading-7 text-ink-soft">
            Learning is more fun and effective when you connect with others.
          </p>
        </div>
      </section>
      <RailCard title="Add friends">
        <ul>
          {rows.map((label) => (
            <li key={label}>
              <button
                onClick={() => comingSoon("Friends and social features")}
                className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-[17px] font-extrabold hover:bg-surface"
              >
                {label}
                <ChevronRightIcon size={20} className="text-ink-soft" />
              </button>
            </li>
          ))}
        </ul>
      </RailCard>
    </>
  );
}

export default function ProfilePage() {
  const { data: profile, error, mutate } = useProfile();
  return (
    <PageShell rail={<FriendsCards />}>
      {profile ? (
        <ProfileBody profile={profile} />
      ) : error ? (
        <PageError message={error.message} onRetry={() => void mutate()} />
      ) : (
        <PageLoading />
      )}
    </PageShell>
  );
}
