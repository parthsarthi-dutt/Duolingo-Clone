"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { mutate } from "swr";

import { HeartsModal } from "@/components/HeartsModal";
import { ArrowUpIcon, ChestIcon, GemIcon, LockIcon } from "@/components/icons";
import { Mascot, type MascotMood } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api, keys } from "@/lib/api";
import { playSound } from "@/lib/audio";
import { setUser, useUser } from "@/lib/hooks";
import { PATH_WAVE, unitColor } from "@/lib/theme";
import type { Path, Skill, Unit } from "@/lib/types";

import { GuidebookModal } from "./GuidebookModal";
import { JumpNode, PathNode } from "./PathNode";
import { UnitBanner } from "./UnitBanner";

const MASCOT_MOODS: MascotMood[] = ["default", "happy", "cheer"];

/** Winding offset for a node; odd units mirror the wave and the last node re-centres. */
function nodeOffset(unitIndex: number, nodeIndex: number, nodeCount: number): number {
  if (nodeIndex === nodeCount - 1) return 0;
  const direction = unitIndex % 2 === 0 ? 1 : -1;
  return PATH_WAVE[nodeIndex % PATH_WAVE.length] * direction;
}

function UnitDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 pb-12 pt-14">
      <hr className="flex-1 border-t-2 border-line" />
      <h2 className="text-center text-[17px] font-extrabold text-muted">{title}</h2>
      <hr className="flex-1 border-t-2 border-line" />
    </div>
  );
}

function NextSectionCard({ sectionIndex, onJump }: { sectionIndex: number; onJump: () => void }) {
  return (
    <section className="card mt-24 px-8 py-8 text-center">
      <span className="label-caps inline-block rounded-md bg-line px-2 py-0.5 text-[13px] text-muted">
        Up next
      </span>
      <h2 className="mt-4 flex items-center justify-center gap-3 text-[23px] font-extrabold text-ink-soft">
        <LockIcon size={22} /> Section {sectionIndex}
      </h2>
      <p className="mx-auto mt-4 max-w-[300px] text-[17px] font-semibold leading-7 text-muted">
        Learn words, phrases, and grammar concepts for basic interactions
      </p>
      <Button variant="outline" fullWidth className="mt-6 !text-macaw" onClick={onJump}>
        Jump here?
      </Button>
    </section>
  );
}

export function LearnPath({ path }: { path: Path }) {
  const router = useRouter();
  const { data: user } = useUser();
  const { toast, comingSoon } = useToast();

  const [openSkillId, setOpenSkillId] = useState<number | null>(null);
  const [activeUnit, setActiveUnit] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [heartsModalOpen, setHeartsModalOpen] = useState(false);
  const [chestReward, setChestReward] = useState<number | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<Unit | null>(null);
  const unitRefs = useRef<(HTMLElement | null)[]>([]);
  const didAutoScroll = useRef(false);

  // The banner shows whichever unit has scrolled up underneath it.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let active = 0;
      unitRefs.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= 180) active = index;
      });
      setActiveUnit(active);
      setShowScrollTop(window.scrollY > 500);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [path.units.length]);

  // Bring the current node into view on first load if it is below the fold.
  useEffect(() => {
    if (didAutoScroll.current) return;
    didAutoScroll.current = true;
    const node = document.getElementById("current-node");
    if (node && node.getBoundingClientRect().top > window.innerHeight - 160) {
      node.scrollIntoView({ block: "center" });
    }
  }, []);

  // Clicking anywhere outside a node closes its popover.
  useEffect(() => {
    if (openSkillId === null) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest("[data-path-node]")) setOpenSkillId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openSkillId]);

  function startLesson(skill: Skill) {
    if (user && user.hearts.current <= 0) {
      setOpenSkillId(null);
      setHeartsModalOpen(true);
      return;
    }
    router.push(`/lesson?skill=${skill.id}`);
  }

  async function openChest(skill: Skill) {
    try {
      const result = await api.claimChest(skill.id);
      setUser(result.user);
      void mutate(keys.path);
      playSound("reward");
      setChestReward(result.gems_awarded);
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "Could not open the chest" });
    }
  }

  function renderUnit(unit: Unit, unitIndex: number) {
    const color = unitColor(unit.color);
    const allLocked = unit.skills.every((skill) => skill.status === "locked");
    const firstIsCurrent = unit.skills[0]?.status === "current";
    const mascotOnRight = unitIndex % 2 === 0;
    return (
      <section
        key={unit.id}
        ref={(element) => {
          unitRefs.current[unitIndex] = element;
        }}
        aria-label={unit.title}
      >
        {unitIndex > 0 && <UnitDivider title={unit.title} />}
        <div
          className={clsx(
            "relative flex flex-col gap-[25px]",
            // Leave room for the bouncing START bubble above a first node.
            unitIndex === 0 && (firstIsCurrent ? "pt-[82px]" : "pt-6"),
            unitIndex > 0 && (firstIsCurrent || allLocked) && "pt-[52px]",
          )}
        >
          {allLocked && unitIndex > 0 && (
            <JumpNode color={color} onClick={() => comingSoon("Jumping ahead to a later unit")} />
          )}
          {unit.skills.map((skill, nodeIndex) => (
            <PathNode
              key={skill.id}
              skill={skill}
              color={color}
              offset={nodeOffset(unitIndex, nodeIndex, unit.skills.length)}
              isOpen={openSkillId === skill.id}
              onToggle={() => setOpenSkillId(openSkillId === skill.id ? null : skill.id)}
              onStart={() => (skill.kind === "chest" ? openChest(skill) : startLesson(skill))}
              onPractice={() => router.push(`/lesson?skill=${skill.id}&mode=practice`)}
              onLegendary={() => router.push(`/lesson?skill=${skill.id}&mode=legendary`)}
            />
          ))}
          {/* the mascot keeps the learner company beside the path */}
          <div
            aria-hidden="true"
            className={clsx(
              "pointer-events-none absolute hidden sm:block",
              allLocked && "opacity-30 grayscale",
            )}
            style={{
              top: (firstIsCurrent && unitIndex === 0 ? 82 : 24) + (allLocked && unitIndex > 0 ? 280 : 160),
              [mascotOnRight ? "left" : "right"]: "calc(50% + 76px)",
            }}
          >
            <div className="relative">
              <span className="absolute bottom-0 left-1/2 h-8 w-[104px] -translate-x-1/2 rounded-[50%] bg-line" />
              <Mascot size={112} mood={MASCOT_MOODS[unitIndex % MASCOT_MOODS.length]} className="relative" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const lastUnit = path.units[path.units.length - 1];

  return (
    <div className="relative">
      {/* Stacking order on the path: nodes 10 < bubbles 20 < popovers 22 < this banner 25 */}
      <div className="sticky top-[60px] z-[25] bg-bg pb-px pt-4 lg:top-0 lg:pt-6">
        <UnitBanner
          unit={path.units[activeUnit] ?? path.units[0]}
          onGuidebook={() => setGuidebookUnit(path.units[activeUnit] ?? path.units[0])}
        />
      </div>

      {path.units.map(renderUnit)}

      <NextSectionCard
        sectionIndex={(lastUnit?.section_index ?? 1) + 1}
        onJump={() => comingSoon(`Section ${(lastUnit?.section_index ?? 1) + 1}`)}
      />

      {showScrollTop && (
        <div className="pointer-events-none sticky bottom-24 z-20 flex justify-end md:bottom-6">
          <button
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="tile pointer-events-auto flex h-[50px] w-[50px] animate-fade-in items-center justify-center text-macaw"
          >
            <ArrowUpIcon size={22} />
          </button>
        </div>
      )}

      {user && (
        <HeartsModal
          open={heartsModalOpen}
          user={user}
          title="You need hearts to start new lessons!"
          onRefilled={() => setHeartsModalOpen(false)}
          onPractice={() => router.push("/lesson?mode=practice")}
          onDismiss={() => setHeartsModalOpen(false)}
        />
      )}

      <GuidebookModal unit={guidebookUnit} onClose={() => setGuidebookUnit(null)} />

      <Modal open={chestReward !== null} onClose={() => setChestReward(null)}>
        <div className="flex flex-col items-center text-center">
          <ChestIcon size={120} tone="opened" className="animate-pop" />
          <h2 className="mt-4 text-[25px] font-extrabold">You opened a chest!</h2>
          <p className="mt-2 flex items-center gap-2 text-[19px] font-extrabold text-gem">
            <GemIcon size={26} /> +{chestReward} gems
          </p>
          <Button fullWidth className="mt-8" onClick={() => setChestReward(null)}>
            Continue
          </Button>
        </div>
      </Modal>
    </div>
  );
}
