"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { ClockIcon, HeartIcon, SuperBadge, TargetIcon } from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { DailyQuestsCard, LeagueCard, SuperCard } from "@/components/layout/RailCards";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/lib/hooks";

function Glyph({ children, color }: { children: ReactNode; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-[72px] w-[72px] shrink-0" style={{ color }} aria-hidden="true">
      {children}
    </svg>
  );
}

const MIC = (
  <Glyph color="#00CD9C">
    <rect x="22" y="6" width="20" height="32" rx="10" fill="currentColor" />
    <path d="M14 30a18 18 0 0 0 36 0M32 48v10M22 58h20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </Glyph>
);
const HEADPHONES = (
  <Glyph color="#FF4B4B">
    <path d="M10 40V32a22 22 0 0 1 44 0v8" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <rect x="6" y="36" width="14" height="22" rx="6" fill="currentColor" />
    <rect x="44" y="36" width="14" height="22" rx="6" fill="currentColor" />
  </Glyph>
);
const CARDS = (
  <Glyph color="#1CB0F6">
    <rect x="20" y="8" width="34" height="44" rx="6" fill="currentColor" opacity=".5" transform="rotate(10 37 30)" />
    <rect x="10" y="12" width="34" height="44" rx="6" fill="currentColor" />
    <path d="M27 24l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff" opacity=".85" />
  </Glyph>
);

const STOPWATCH = (
  <Glyph color="#CE82FF">
    <rect x="27" y="4" width="10" height="7" rx="2" fill="currentColor" />
    <circle cx="32" cy="36" r="23" fill="currentColor" />
    <circle cx="32" cy="36" r="16" fill="rgb(var(--bg))" />
    <path d="M32 26v11l7 5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </Glyph>
);

/** A practice mode the brief lists as out of scope: shown, but clearly a placeholder. */
function PlaceholderCard({
  title,
  description,
  art,
  feature,
}: {
  title: string;
  description: string;
  art: ReactNode;
  feature: string;
}) {
  const { comingSoon } = useToast();
  return (
    <button
      onClick={() => comingSoon(feature)}
      className="tile flex w-full items-center justify-between gap-4 px-4 py-5 text-left hover:bg-surface"
    >
      <span>
        <span className="flex items-center gap-2 text-[19px] font-extrabold">
          {title} <SuperBadge />
        </span>
        <span className="mt-2 block text-[16px] font-semibold text-ink-soft">{description}</span>
      </span>
      {art}
    </button>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const { data: user } = useUser();
  const heartsFull = user ? user.hearts.current >= user.hearts.max : false;

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
      <h1 className="pb-5 pt-6 text-[24px] font-extrabold">Today&apos;s Review</h1>

      <section
        className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(160deg,#0B3A5A 0%,#1B2A6B 55%,#5A2A8A 100%)" }}
      >
        <div className="relative z-10 max-w-[330px]">
          <p className="label-caps flex items-center gap-2 text-[13px] text-white/80">
            <HeartIcon size={20} /> {heartsFull ? "Keep your skills sharp" : "Earn a heart back"}
          </p>
          <h2 className="mt-2 text-[25px] font-extrabold">Practice</h2>
          <p className="mt-3 text-[17px] font-semibold leading-6 text-white/90">
            Review what you&apos;ve learned in a mixed session. Mistakes don&apos;t cost hearts, and
            finishing {heartsFull ? "earns XP" : "refills one heart"}.
          </p>
        </div>
        <Button
          variant="white"
          className="relative z-10 mt-6 w-fit !text-[#1B2A6B]"
          onClick={() => router.push("/lesson?mode=practice")}
        >
          Start +5 XP
        </Button>
        <div className="absolute -bottom-6 -right-4 hidden sm:block" aria-hidden="true">
          <TargetIcon size={210} className="opacity-90" />
          <Mascot size={150} mood="cheer" className="absolute bottom-4 right-8" />
        </div>
      </section>

      <h2 className="pb-4 pt-9 text-[24px] font-extrabold">Challenges</h2>
      <section className="tile flex items-center justify-between gap-4 px-4 py-5">
        <div>
          <h3 className="text-[19px] font-extrabold">Timed practice</h3>
          <p className="mt-2 text-[16px] font-semibold text-ink-soft">
            Race the clock: finish a practice set in 2 minutes. Mistakes only cost time.
          </p>
          <Button
            variant="blue"
            className="mt-4"
            onClick={() => router.push("/lesson?mode=timed")}
          >
            <ClockIcon size={20} /> Start +20 XP
          </Button>
        </div>
        {STOPWATCH}
      </section>

      <h2 className="pb-4 pt-9 text-[24px] font-extrabold">Conversation</h2>
      <div className="flex flex-col gap-4">
        <PlaceholderCard
          title="Speak"
          description="Improve your speaking skills with these phrases"
          art={MIC}
          feature="Speaking exercises (speech recognition)"
        />
        <PlaceholderCard
          title="Listen"
          description="Boost your listening skills with an audio-only session"
          art={HEADPHONES}
          feature="Listening sessions"
        />
      </div>

      <h2 className="pb-4 pt-9 text-[24px] font-extrabold">Your collections</h2>
      <PlaceholderCard
        title="Words"
        description="Review your Spanish vocabulary at any time"
        art={CARDS}
        feature="The word collection"
      />
    </PageShell>
  );
}
