"use client";

import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Character } from "@/components/Character";
import { BoltIcon, CrownIcon, FlameIcon, HeartIcon, TargetIcon } from "@/components/icons";
import { WeekStrip } from "@/components/layout/StatsBar";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { playSound } from "@/lib/audio";
import { getPreferences } from "@/lib/preferences";
import type { SessionMode, SessionSummary } from "@/lib/types";

import { PlainFooter } from "./LessonFooter";
import { ReviewModal } from "./ReviewModal";

const TITLES: Record<SessionMode, string> = {
  lesson: "Lesson Complete!",
  practice: "Practice Complete!",
  legendary: "Legendary!",
  timed: "You beat the clock!",
};

function accuracyLabel(accuracy: number): string {
  if (accuracy === 100) return "Perfect!";
  if (accuracy >= 90) return "Great!";
  return "Good!";
}

function StatCard({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div
      className="w-[150px] animate-pop rounded-2xl p-0.5 sm:w-[162px]"
      style={{ backgroundColor: color }}
    >
      <p className="label-caps py-0.5 text-center text-[12px] text-[#131F24]">{label}</p>
      <div
        className="flex h-[66px] items-center justify-center gap-2 rounded-[14px] bg-bg text-[19px] font-extrabold"
        style={{ color }}
      >
        {children}
      </div>
    </div>
  );
}

function Sparkle({ className, color }: { className: string; color: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`absolute h-7 w-7 animate-sparkle ${className}`} aria-hidden="true">
      <path
        d="M12 1v6M12 17v6M1 12h6M17 12h6M4.5 4.5l3.5 3.5M16 16l3.5 3.5M4.5 19.5 8 16M16 8l3.5-3.5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CelebrationScreen({ summary }: { summary: SessionSummary }) {
  const legendary = summary.mode === "legendary";
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <div className="relative animate-rise-in">
        <Sparkle className="-top-6 right-2" color="#FFC800" />
        <Sparkle className="-left-4 top-6 [animation-delay:0.5s]" color="#CE82FF" />
        <div className="flex items-end justify-center px-6">
          <Mascot
            size={150}
            mood="cheer"
            tone={legendary ? "gold" : "green"}
            className="-mb-1 -mr-3"
          />
          <Character name="leo" size={230} className="-mb-3" />
        </div>
        <span className="block h-1.5 rounded-full bg-line" />
      </div>
      <h1 className="mt-6 flex items-center gap-2 text-[30px] font-extrabold text-bee">
        {legendary && <CrownIcon size={34} />}
        {TITLES[summary.mode]}
      </h1>
      {summary.skill_completed && (
        <p className="mt-1 text-[17px] font-bold text-ink-soft">You finished this level!</p>
      )}
      {summary.became_legendary && (
        <p className="mt-1 text-[17px] font-bold text-ink-soft">This level is now Legendary.</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <StatCard label="Total XP" color="#FFC800">
          <BoltIcon size={26} /> {summary.xp_earned}
        </StatCard>
        <StatCard label={accuracyLabel(summary.accuracy)} color="#93D333">
          <TargetIcon size={26} /> {summary.accuracy}%
        </StatCard>
        {summary.hearts_awarded > 0 && (
          <StatCard label="Hearts" color="#FF4B4B">
            <HeartIcon size={24} /> +{summary.hearts_awarded}
          </StatCard>
        )}
      </div>
    </div>
  );
}

function StreakScreen({ summary }: { summary: SessionSummary }) {
  const { streak } = summary.user;
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <FlameIcon size={132} className="animate-flicker" />
      <p className="mt-2 animate-pop text-[104px] font-black leading-none text-[#FFAB33]">
        {streak.count}
      </p>
      <p className="mt-1 text-[25px] font-extrabold text-[#FFAB33]">day streak</p>
      <div className="card mt-8 w-full max-w-[340px] animate-rise-in">
        <WeekStrip user={summary.user} className="px-6 pb-3 pt-4" />
        <p className="border-t-2 border-line px-4 py-3 text-[17px] font-semibold leading-7 text-ink-soft">
          Practicing daily grows your streak, but skipping a day resets it!
        </p>
      </div>
    </div>
  );
}

/** Shown after the last lesson of a skill: an invitation to the extra-hard challenge. */
function LegendaryOfferScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center"
      style={{ background: "radial-gradient(circle at 50% 34%, rgba(255,200,0,0.20), transparent 46%)" }}
    >
      <div className="relative animate-rise-in">
        <Sparkle className="-right-6 top-2" color="#fff" />
        <Sparkle className="-left-8 bottom-10 [animation-delay:0.6s]" color="#fff" />
        <Mascot size={170} mood="cheer" tone="gold" className="relative z-10 animate-bounce-soft" />
        <span className="mx-auto -mt-5 block h-9 w-[150px] rounded-[50%] bg-bee shadow-[0_8px_0_#E5A000]" />
      </div>
      <h1 className="mt-8 text-[25px] font-extrabold">Prove you&apos;re a legend</h1>
      <p className="mt-3 max-w-[380px] text-[17px] font-semibold leading-7 text-ink-soft">
        Complete this extra-hard challenge and level up to Legendary!
      </p>
      <Button variant="gold" className="mt-6 w-full max-w-[360px]" onClick={onStart}>
        <CrownIcon size={22} /> Start +40 XP
      </Button>
    </div>
  );
}

type Screen = "celebration" | "streak" | "legendary";

/**
 * End-of-lesson flow: celebration with XP and accuracy, the streak screen when
 * today's lesson extended it, then (after finishing a skill) the Legendary
 * offer. Rewards earned along the way are announced as toasts on exit.
 */
export function LessonComplete({ summary, onDone }: { summary: SessionSummary; onDone: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("celebration");
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    playSound("complete");
    if (!getPreferences().motion) return;
    const burst = (originX: number, angle: number) =>
      confetti({
        particleCount: 70,
        spread: 70,
        angle,
        origin: { x: originX, y: 0.7 },
        colors: ["#58CC02", "#FFC800", "#1CB0F6", "#FF4B4B", "#CE82FF"],
        disableForReducedMotion: true,
      });
    burst(0.15, 60);
    burst(0.85, 120);
  }, []);

  function announceRewards() {
    if (summary.daily_goal_reached) {
      toast({
        title: "Daily goal reached!",
        description: `You earned ${summary.user.daily_goal.earned} XP today.`,
        icon: <BoltIcon size={30} />,
      });
    }
    for (const quest of summary.completed_quests) {
      toast({
        title: "Quest complete!",
        description: `${quest.title} · +${quest.reward_gems} gems`,
        icon: <span className="text-2xl">🎁</span>,
      });
    }
    for (const achievement of summary.unlocked_achievements) {
      toast({
        title: "Achievement unlocked!",
        description: `${achievement.title} · Level ${achievement.level}`,
        icon: <span className="text-2xl">🏆</span>,
      });
    }
  }

  /** The screens still to come after `from`, in order. */
  function nextScreen(from: Screen): Screen | null {
    if (from === "celebration" && summary.streak_extended) return "streak";
    if (from !== "legendary" && summary.legendary_available) return "legendary";
    return null;
  }

  function finish() {
    announceRewards();
    onDone();
  }

  function next() {
    const upcoming = nextScreen(screen);
    if (!upcoming) return finish();
    if (upcoming === "streak") playSound("reward");
    setScreen(upcoming);
  }

  function startLegendary() {
    announceRewards();
    router.push(`/lesson?skill=${summary.skill_id}&mode=legendary`);
  }

  if (screen === "legendary") {
    return (
      <>
        <LegendaryOfferScreen onStart={startLegendary} />
        <PlainFooter label="No thanks" variant="blue" onContinue={finish} />
      </>
    );
  }

  return (
    <>
      {screen === "celebration" ? (
        <CelebrationScreen summary={summary} />
      ) : (
        <StreakScreen summary={summary} />
      )}
      <PlainFooter
        variant={screen === "streak" ? "blue" : "primary"}
        onContinue={next}
        secondary={
          <Button variant="outline" onClick={() => setReviewOpen(true)}>
            Review lesson
          </Button>
        }
      />
      <ReviewModal
        sessionId={summary.session_id}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </>
  );
}
