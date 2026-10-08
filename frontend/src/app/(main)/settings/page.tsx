"use client";

import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";

import { BoltIcon, FlameIcon } from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { DailyQuestsCard } from "@/components/layout/RailCards";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoading } from "@/components/ui/PageState";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api, auth } from "@/lib/api";
import { playSound, speak, useSpeechAvailability } from "@/lib/audio";
import { plural } from "@/lib/format";
import { refreshProgress, setUser, useUser } from "@/lib/hooks";
import { setPreference, usePreferences } from "@/lib/preferences";
import type { User } from "@/lib/types";

const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

const PLACEHOLDERS = ["Email address", "Password", "Notifications", "Privacy", "Linked accounts"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="pb-3 text-[24px] font-extrabold">{title}</h2>
      <div className="card px-5">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-line py-4 last:border-b-0">
      <div>
        <p className="text-[17px] font-extrabold">{label}</p>
        <p className="text-[15px] font-semibold text-ink-soft">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors",
          checked ? "bg-macaw" : "bg-line",
        )}
      >
        <span
          className={clsx(
            "absolute left-0 top-[3px] h-6 w-6 rounded-full bg-white transition-transform",
            checked ? "translate-x-[25px]" : "translate-x-[3px]",
          )}
        />
      </button>
    </div>
  );
}

import { AvatarEditor } from "@/components/ui/AvatarEditor";
import { UserAvatar } from "@/components/ui/UserAvatar";

function ProfileSection({ user }: { user: User }) {
  const { toast } = useToast();
  const [name, setName] = useState(user.display_name);
  const [saving, setSaving] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const trimmed = name.trim();

  useEffect(() => setName(user.display_name), [user.display_name]);

  async function save(overrides?: { avatar_color?: string }) {
    setSaving(true);
    try {
      setUser(await api.updateMe({ display_name: trimmed, ...overrides }));
      refreshProgress();
      if (!overrides?.avatar_color) toast({ title: "Profile updated" });
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "Could not save profile" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Profile">
      <div className="flex flex-col gap-6 py-5 sm:flex-row sm:items-start">
        {/* Avatar Area */}
        <div className="flex flex-col items-center gap-3">
          <UserAvatar avatarConfig={user.avatar_color} displayName={user.display_name} size={96} />
          <Button variant="outline" className="!text-macaw" onClick={() => setEditingAvatar(true)}>
            Edit avatar
          </Button>
        </div>
        
        {/* Name Area */}
        <div className="flex flex-1 flex-col gap-3">
          <label className="flex-1">
            <span className="label-caps mb-2 block text-[13px] text-muted">Name</span>
            <input
              value={name}
              maxLength={40}
              onChange={(event) => setName(event.target.value)}
              className="h-[48px] w-full rounded-xl border-2 border-line bg-surface px-4 text-[17px] font-semibold text-ink outline-none"
            />
          </label>
          <div className="self-end">
            <Button disabled={saving || !trimmed || trimmed === user.display_name} onClick={() => save()}>
              Save
            </Button>
          </div>
        </div>
      </div>
      <p className="border-t-2 border-line py-4 text-[15px] font-semibold text-ink-soft">
        Username: <span className="font-extrabold text-ink">{user.username}</span>
      </p>

      {editingAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <AvatarEditor
            initialConfig={user.avatar_color}
            displayName={user.display_name}
            onCancel={() => setEditingAvatar(false)}
            onSave={(config) => {
              setEditingAvatar(false);
              save({ avatar_color: config });
            }}
          />
        </div>
      )}
    </Section>
  );
}

function GoalSection({ user }: { user: User }) {
  const { toast } = useToast();

  async function choose(xp: number) {
    if (xp === user.daily_goal.target) return;
    try {
      setUser(await api.updateMe({ daily_goal_xp: xp }));
      refreshProgress();
      toast({ title: `Daily goal set to ${xp} XP`, icon: <BoltIcon size={28} /> });
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "Could not change your goal" });
    }
  }

  return (
    <Section title="Daily goal">
      <div role="radiogroup" className="flex flex-col gap-2 py-5">
        {GOALS.map((goal) => {
          const selected = goal.xp === user.daily_goal.target;
          return (
            <button
              key={goal.xp}
              role="radio"
              aria-checked={selected}
              onClick={() => choose(goal.xp)}
              className={clsx(
                "flex h-[52px] items-center justify-between rounded-xl border-2 border-b-4 px-4 text-[17px] font-extrabold",
                selected
                  ? "border-selected-line bg-selected-bg text-selected-ink"
                  : "border-line text-ink hover:bg-surface",
              )}
            >
              {goal.label}
              <span className={selected ? undefined : "text-muted"}>{goal.xp} XP per day</span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

const VOICE_STATUS = {
  available: "A Spanish voice is installed: words and sentences will be read aloud.",
  unavailable:
    "This browser has no Spanish voice, so words can't be read aloud (sound effects still work). Chrome and Edge include one.",
  unknown: "Looking for a Spanish voice...",
};

/** Lets the learner confirm that effects and the Spanish voice actually play on this device. */
function AudioCheck() {
  const voice = useSpeechAvailability("es");
  return (
    <div className="py-4">
      <p className="text-[17px] font-extrabold">Test audio</p>
      <p className="text-[15px] font-semibold text-ink-soft">{VOICE_STATUS[voice]}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="outline" className="!text-macaw" onClick={() => playSound("correct")}>
          Play sound effect
        </Button>
        <Button
          variant="outline"
          className="!text-macaw"
          disabled={voice === "unavailable"}
          onClick={() => speak("Hola, ¿cómo estás?", "es")}
        >
          Play Spanish voice
        </Button>
      </div>
    </div>
  );
}

function PreferencesSection() {
  const preferences = usePreferences();
  return (
    <Section title="Preferences">
      <AudioCheck />
      <Toggle
        label="Sound effects"
        description="Chimes for correct and incorrect answers"
        checked={preferences.sound}
        onChange={(value) => setPreference("sound", value)}
      />
      <Toggle
        label="Listening audio"
        description="Read Spanish words and sentences aloud"
        checked={preferences.speech}
        onChange={(value) => setPreference("speech", value)}
      />
      <Toggle
        label="Animations"
        description="Bounces, confetti and transitions"
        checked={preferences.motion}
        onChange={(value) => setPreference("motion", value)}
      />
      <Toggle
        label="Dark mode"
        description="Easier on the eyes at night"
        checked={preferences.theme === "dark"}
        onChange={(value) => setPreference("theme", value ? "dark" : "light")}
      />
    </Section>
  );
}

function AccountSection() {
  const { comingSoon } = useToast();
  return (
    <Section title="Account">
      {PLACEHOLDERS.map((label) => (
        <button
          key={label}
          onClick={() => comingSoon(label)}
          className="flex w-full items-center justify-between border-b-2 border-line py-4 text-left text-[17px] font-extrabold last:border-b-0"
        >
          {label}
          <span className="label-caps rounded-md bg-line px-2 py-0.5 text-[12px] text-ink-soft">
            Coming soon
          </span>
        </button>
      ))}
      <button
        onClick={() => auth.logout()}
        className="flex w-full items-center justify-between border-t-2 border-line py-4 text-left text-[17px] font-extrabold text-cardinal hover:brightness-125"
      >
        Log out
      </button>
    </Section>
  );
}

/** Lets a reviewer exercise day-based mechanics (streaks, heart regen, quests) instantly. */
function DeveloperSection({ user }: { user: User }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const today = new Date(`${user.today}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function run(action: () => Promise<User>, describe: (updated: User) => string) {
    setBusy(true);
    try {
      const updated = await action();
      setUser(updated);
      refreshProgress();
      toast({ title: describe(updated), icon: <FlameIcon size={28} active={updated.streak.count > 0} /> });
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "That didn't work" });
    } finally {
      setBusy(false);
    }
  }

  const streakLine = (updated: User) => `Streak: ${plural(updated.streak.count, "day")}`;

  return (
    <Section title="Developer tools">
      <p className="border-b-2 border-line py-4 text-[15px] font-semibold leading-6 text-ink-soft">
        Time-based mechanics normally take days to observe. These controls move this learner&apos;s
        clock so streaks, heart regeneration and daily quests can be tested right away.
        <span className="mt-2 block font-extrabold text-ink">App date: {today}</span>
      </p>
      <div className="flex flex-col gap-3 py-5">
        <Button
          variant="outline"
          className="!text-macaw"
          disabled={busy}
          onClick={() => run(() => api.advanceDay(1), (u) => `It's the next day. ${streakLine(u)}`)}
        >
          Go to tomorrow
        </Button>
        <Button
          variant="outline"
          className="!text-fox"
          disabled={busy}
          onClick={() => run(() => api.advanceDay(2), (u) => `You skipped a day. ${streakLine(u)}`)}
        >
          Skip a day (breaks the streak)
        </Button>
        <Button
          variant="outline"
          className="!text-cardinal"
          disabled={busy}
          onClick={() => setConfirmReset(true)}
        >
          Reset all progress
        </Button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <h2 className="text-center text-[23px] font-extrabold">Reset all progress?</h2>
        <p className="mt-3 text-center text-[17px] font-semibold text-ink-soft">
          This wipes XP, streak, hearts and completed lessons, and restores the sample learner.
        </p>
        <Button
          variant="danger"
          fullWidth
          className="mt-8"
          disabled={busy}
          onClick={async () => {
            await run(() => api.resetProgress(), () => "Progress reset to the sample learner");
            setConfirmReset(false);
          }}
        >
          Reset
        </Button>
        <Button variant="ghost" fullWidth className="mt-2" onClick={() => setConfirmReset(false)}>
          Cancel
        </Button>
      </Modal>
    </Section>
  );
}

export default function SettingsPage() {
  const { data: user } = useUser();
  return (
    <PageShell rail={<DailyQuestsCard />}>
      <h1 className="pt-6 text-[28px] font-extrabold">Settings</h1>
      {user ? (
        <>
          <ProfileSection user={user} />
          <GoalSection user={user} />
          <PreferencesSection />
          <AccountSection />
          <DeveloperSection user={user} />
        </>
      ) : (
        <PageLoading />
      )}
    </PageShell>
  );
}
