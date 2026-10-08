"use client";

import clsx from "clsx";
import type { ComponentType, ReactNode } from "react";

import {
  BookIcon,
  CheckIcon,
  ChestIcon,
  CrownIcon,
  DumbbellIcon,
  FastForwardIcon,
  StarIcon,
  TrophyIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { LEGENDARY, ON_GOLD, type Swatch } from "@/lib/theme";
import type { Skill } from "@/lib/types";

const SKILL_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  star: StarIcon,
  book: BookIcon,
  dumbbell: DumbbellIcon,
  trophy: TrophyIcon,
};

const RING_SIZE = 98;
const RING_STROKE = 8;

/** Circular progress around the current node: lessons done within the skill. */
function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      className="pointer-events-none absolute left-1/2 top-[-16.5px] -translate-x-1/2 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke="rgb(var(--line))"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

/** Speech-bubble label floating above a node ("START", "OPEN", "JUMP HERE?"). */
function Bubble({
  children,
  color,
  bounce = false,
  lift,
}: {
  children: ReactNode;
  color: string;
  bounce?: boolean;
  lift: number;
}) {
  return (
    // Positioning and animation live on separate elements: both use `transform`.
    <div
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
      style={{ bottom: `calc(100% + ${lift}px)` }}
    >
      <div
        className={clsx(
          "label-caps relative whitespace-nowrap rounded-[10px] border-2 border-line bg-bg px-3.5 py-2 text-[15px]",
          bounce && "animate-bounce-soft",
        )}
        style={{ color }}
      >
        {children}
        <span className="absolute left-1/2 top-full -ml-1.5 -mt-[6px] h-3 w-3 rotate-45 border-b-2 border-r-2 border-line bg-bg" />
      </div>
    </div>
  );
}

interface PopoverAction {
  label: string;
  onClick: () => void;
}

interface PopoverProps {
  title: string;
  message: string;
  action?: PopoverAction;
  /** A second, gold call to action: the Legendary challenge. */
  legendaryAction?: PopoverAction;
  color?: Swatch; // omitted => neutral "locked" styling
  /** Text colour for light backgrounds such as gold. */
  ink?: string;
  arrowOffset: number;
  gap: number;
}

/** The card that opens under a node with its call to action. */
export function NodePopover({
  title,
  message,
  action,
  legendaryAction,
  color,
  ink = "#fff",
  arrowOffset,
  gap,
}: PopoverProps) {
  const locked = !color;
  const textStyle = locked ? undefined : { color: ink };
  return (
    <div
      className="absolute left-1/2 z-[22] w-[296px] max-w-[calc(100vw-32px)] -translate-x-1/2"
      style={{ top: `calc(100% + ${gap}px)` }}
    >
      {/* The pop animation uses `transform`, so it can't share the centring element. */}
      <div className="relative origin-top animate-pop">
        <span
          className={clsx(
            "absolute -top-[7px] h-4 w-4 rotate-45 rounded-[3px]",
            locked && "border-l-2 border-t-2 border-line bg-surface",
          )}
          style={{
            left: `calc(50% + ${arrowOffset}px - 8px)`,
            backgroundColor: color?.base,
          }}
        />
        <div
          className={clsx("relative rounded-2xl p-4", locked && "border-2 border-line bg-surface")}
          style={{ backgroundColor: color?.base }}
        >
          <h3 className={clsx("text-[19px] font-extrabold", locked && "text-muted")} style={textStyle}>
            {title}
          </h3>
          <p
            className={clsx("mt-1 text-[17px] font-semibold", locked && "text-muted")}
            style={textStyle}
          >
            {message}
          </p>
          {action ? (
            <Button
              variant="white"
              fullWidth
              className="mt-4"
              style={{ color: ink === "#fff" ? color?.base : ink }}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ) : (
            <Button fullWidth disabled className="mt-4 !translate-y-0">
              Locked
            </Button>
          )}
          {legendaryAction && (
            <Button variant="gold" fullWidth className="mt-2" onClick={legendaryAction.onClick}>
              <CrownIcon size={22} /> {legendaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PathNodeProps {
  skill: Skill;
  color: Swatch;
  /** Horizontal shift in px that makes the path wind. */
  offset: number;
  isOpen: boolean;
  onToggle: () => void;
  onStart: () => void;
  onPractice: () => void;
  onLegendary: () => void;
}

export function PathNode({
  skill,
  color: unitSwatch,
  offset,
  isOpen,
  onToggle,
  onStart,
  onPractice,
  onLegendary,
}: PathNodeProps) {
  const { status } = skill;
  const isChest = skill.kind === "chest";
  const locked = status === "locked";
  const current = status === "current";
  const legendary = skill.is_legendary;
  // A Legendary skill trades its unit colour for gold and its tick for a crown.
  const color = legendary ? LEGENDARY : unitSwatch;
  const Icon = legendary
    ? CrownIcon
    : status === "completed"
      ? CheckIcon
      : (SKILL_ICONS[skill.icon] ?? StarIcon);

  let popover: ReactNode = null;
  if (isOpen && locked) {
    popover = (
      <NodePopover
        title={skill.title}
        message="Complete all levels above to unlock this!"
        arrowOffset={offset}
        gap={13}
      />
    );
  } else if (isOpen && current && !isChest) {
    popover = (
      <NodePopover
        title={skill.title}
        message={`Lesson ${skill.lessons_completed + 1} of ${skill.lessons_total}`}
        action={{ label: "Start +10 XP", onClick: onStart }}
        color={color}
        arrowOffset={offset}
        gap={26}
      />
    );
  } else if (isOpen && !isChest && legendary) {
    popover = (
      <NodePopover
        title={skill.title}
        message="Legendary level! Practice to keep it fresh."
        action={{ label: "Practice +5 XP", onClick: onPractice }}
        color={color}
        ink={ON_GOLD}
        arrowOffset={offset}
        gap={13}
      />
    );
  } else if (isOpen && !isChest) {
    popover = (
      <NodePopover
        title={skill.title}
        message="You completed this level! Practice it, or prove you're a legend."
        action={{ label: "Practice +5 XP", onClick: onPractice }}
        legendaryAction={{ label: "Legendary +40 XP", onClick: onLegendary }}
        color={color}
        arrowOffset={offset}
        gap={13}
      />
    );
  }

  return (
    <div data-path-node className="relative">
      <div className="relative flex h-[65px] justify-center" style={{ transform: `translateX(${offset}px)` }}>
        <div className="relative">
          {current && !isChest && (
            <ProgressRing
              value={skill.lessons_completed}
              max={skill.lessons_total}
              color={color.base}
            />
          )}
          {current && !isOpen && (
            <Bubble color={color.base} bounce lift={isChest ? 8 : 4}>
              {isChest ? "Open" : "Start"}
            </Bubble>
          )}
          {isChest ? (
            <button
              id={current ? "current-node" : undefined}
              aria-label={`${skill.title} (${status})`}
              onClick={current ? onStart : onToggle}
              className="relative z-10 block transition-transform hover:scale-105 active:scale-95"
            >
              <ChestIcon
                size={66}
                tone={locked ? "locked" : status === "completed" ? "opened" : "ready"}
              />
            </button>
          ) : (
            <button
              id={current ? "current-node" : undefined}
              aria-label={`${skill.title} (${status})`}
              aria-expanded={isOpen}
              onClick={onToggle}
              className={clsx(
                "relative z-10 flex h-[57px] w-[70px] items-center justify-center rounded-[50%]",
                "transition-transform duration-75 active:translate-y-2 active:!shadow-none",
                locked ? "bg-line text-muted" : "text-white",
              )}
              style={
                locked
                  ? { boxShadow: "0 8px 0 rgb(var(--line-shadow))" }
                  : { backgroundColor: color.base, boxShadow: `0 8px 0 ${color.shadow}` }
              }
            >
              {/* glossy highlight */}
              {!locked && (
                <span className="absolute left-[14px] top-[7px] h-[14px] w-[26px] -rotate-[24deg] rounded-full bg-white/20" />
              )}
              <Icon size={42} />
            </button>
          )}
        </div>
      </div>
      {popover}
    </div>
  );
}

/** Decorative shortcut shown at the top of units that are still locked. */
export function JumpNode({ color, onClick }: { color: Swatch; onClick: () => void }) {
  return (
    <div className="relative flex h-[65px] justify-center">
      <div className="relative">
        <Bubble color={color.base} lift={4}>
          Jump here?
        </Bubble>
        <button
          aria-label="Jump to this unit"
          onClick={onClick}
          className="relative z-10 flex h-[57px] w-[70px] items-center justify-center rounded-[50%] text-white transition-transform duration-75 active:translate-y-2 active:!shadow-none"
          style={{ backgroundColor: color.base, boxShadow: `0 8px 0 ${color.shadow}` }}
        >
          <FastForwardIcon size={42} />
        </button>
      </div>
    </div>
  );
}
