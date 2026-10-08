import type { ReactNode, SVGProps } from "react";

/**
 * Hand-drawn icon set. Every icon is an inline SVG so it scales crisply,
 * follows the theme where it uses CSS variables, and needs no network request.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, viewBox, children, ...rest }: IconProps & { viewBox: string }) {
  const [, , width, height] = viewBox.split(" ").map(Number);
  return (
    <svg
      viewBox={viewBox}
      width={(size * width) / height}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ---- stats ----------------------------------------------------------------

export function FlameIcon({ active = true, ...props }: IconProps & { active?: boolean }) {
  return (
    <Svg viewBox="0 0 25 30" {...props}>
      <path
        d="M11.5 1.5c.6-.7 1.6-.7 2.2 0l6.5 8c2.5 3.1 3.6 5.9 3.6 8.8C23.8 24.3 18.9 29 12.6 29S1.4 24.3 1.4 18.3V8.2c0-1 1.1-1.7 2-1.1l2.8 1.7c.5.3 1 .2 1.4-.2z"
        fill={active ? "#FF9600" : "rgb(var(--line))"}
      />
      <path
        d="M11.7 15.2c.5-.6 1.3-.6 1.8 0l2.4 3c.8 1 1.2 2 1.2 3.1 0 2.4-2 4.3-4.5 4.3s-4.5-1.9-4.5-4.3c0-1.1.4-2.1 1.2-3.1z"
        fill={active ? "#FFC800" : "rgb(var(--muted))"}
      />
    </Svg>
  );
}

export function GemIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 28" {...props}>
      <path
        d="M4.1 5.7 10.7 1.4a2.4 2.4 0 0 1 2.6 0l6.6 4.3a2.4 2.4 0 0 1 1.1 2v12.6a2.4 2.4 0 0 1-1.1 2l-6.6 4.3a2.4 2.4 0 0 1-2.6 0l-6.6-4.3a2.4 2.4 0 0 1-1.1-2V7.7c0-.8.4-1.6 1.1-2z"
        fill="#1CB0F6"
      />
      <path
        d="M12 1c.5 0 .9.1 1.3.4l6.6 4.3c.7.4 1.1 1.2 1.1 2v12.6c0 .8-.4 1.6-1.1 2l-6.6 4.3c-.4.3-.8.4-1.3.4z"
        fill="#1899D6"
        opacity=".55"
      />
      <path
        d="m6.9 8.3 3-1.9a1 1 0 0 1 1.6.8v2.3c0 .4-.2.7-.5.9L8 12.3a1 1 0 0 1-1.6-.8V9.2c0-.4.2-.7.5-.9z"
        fill="#fff"
        opacity=".75"
      />
    </Svg>
  );
}

export function HeartIcon({ empty = false, ...props }: IconProps & { empty?: boolean }) {
  return (
    <Svg viewBox="0 0 28 25" {...props}>
      <path
        d="M14 24c-.6 0-1.1-.2-1.6-.6C6 18.3 1.3 14.2 1.3 8.8 1.3 4.7 4.4 1.5 8.3 1.5c2.2 0 4.2 1 5.7 2.8 1.5-1.8 3.5-2.8 5.7-2.8 3.9 0 7 3.2 7 7.3 0 5.4-4.7 9.5-11.1 14.6-.5.4-1 .6-1.6.6z"
        fill={empty ? "rgb(var(--ink-soft))" : "#FF4B4B"}
      />
      <ellipse
        cx="8.3"
        cy="7.7"
        rx="2.7"
        ry="2"
        transform="rotate(-38 8.3 7.7)"
        fill={empty ? "rgb(var(--bg))" : "#fff"}
        opacity={empty ? 0.5 : 0.65}
      />
    </Svg>
  );
}

export function BoltIcon({ dim = false, ...props }: IconProps & { dim?: boolean }) {
  return (
    <Svg viewBox="0 0 24 28" {...props}>
      <path
        d="M14.2 1.5 4 14.8c-.7.9 0 2.1 1.1 2.1h4.2l-2 8.9c-.3 1.4 1.5 2.3 2.4 1.1L20 13.5c.7-.9 0-2.1-1.1-2.1h-4.3l1.8-8.8c.3-1.4-1.4-2.2-2.2-1.1z"
        fill={dim ? "rgb(var(--muted))" : "#FFC800"}
      />
      {!dim && (
        <path
          d="M13.4 4.3 6.7 13c-.4.5 0 1.2.6 1.2h1.2z"
          fill="#fff"
          opacity=".45"
        />
      )}
    </Svg>
  );
}

export function FlagIcon({ size = 26, ...props }: IconProps) {
  // Spain: the seeded course language.
  return (
    <Svg viewBox="0 0 34 26" size={size} {...props}>
      <defs>
        <clipPath id="flag-es-clip">
          <rect x="1" y="1" width="32" height="24" rx="6" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-es-clip)">
        <rect x="1" y="1" width="32" height="24" fill="#FFC800" />
        <rect x="1" y="1" width="32" height="6.5" fill="#FF4B4B" />
        <rect x="1" y="18.5" width="32" height="6.5" fill="#FF4B4B" />
        <rect x="7" y="9.5" width="5" height="7" rx="1.5" fill="#FF4B4B" />
        <rect x="5" y="9.5" width="1.5" height="7" rx=".7" fill="#fff" />
        <rect x="12.5" y="9.5" width="1.5" height="7" rx=".7" fill="#fff" />
      </g>
      <rect x="1" y="1" width="32" height="24" rx="6" fill="none" stroke="#fff" strokeWidth="2" />
    </Svg>
  );
}

// ---- path nodes (drawn in currentColor on top of the node) ------------------

export function StarIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="m21 6 4.7 9.6 10.6 1.5-7.7 7.5 1.8 10.5L21 30.2l-9.4 4.9 1.8-10.5-7.7-7.5 10.6-1.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ strokeWidth = 7, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="m10 22 8 8 14-17"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CrossIcon({ strokeWidth = 7, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="m12 12 18 18M30 12 12 30"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="M21 12.5C17.8 10.2 13.5 9 8.5 9 7.1 9 6 10.1 6 11.5v17C6 29.9 7.1 31 8.5 31c4.7 0 8.9 1.1 12.5 3.5 3.6-2.4 7.8-3.5 12.5-3.5 1.4 0 2.5-1.1 2.5-2.5v-17C36 10.1 34.9 9 33.5 9c-5 0-9.3 1.2-12.5 3.5z"
        fill="currentColor"
      />
      <path d="M21 14v18" stroke="#000" strokeOpacity=".22" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <g transform="rotate(-45 21 21)" fill="currentColor">
        <rect x="11" y="18" width="20" height="6" rx="2" />
        <rect x="7.5" y="11.5" width="7.5" height="19" rx="3.5" />
        <rect x="27" y="11.5" width="7.5" height="19" rx="3.5" />
        <rect x="3" y="15.5" width="5.5" height="11" rx="2.7" />
        <rect x="33.5" y="15.5" width="5.5" height="11" rx="2.7" />
      </g>
    </Svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="M12.5 11H8.2C7.5 11 7 11.5 7 12.2c0 4.1 2.4 7.3 6.3 8M29.5 11h4.3c.7 0 1.2.5 1.2 1.2 0 4.1-2.4 7.3-6.3 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12.5 8.5c0-.8.7-1.5 1.5-1.5h14c.8 0 1.5.7 1.5 1.5V17c0 4.7-3.8 8.5-8.5 8.5s-8.5-3.8-8.5-8.5z"
        fill="currentColor"
      />
      <path d="M19 24h4v6h-4z" fill="currentColor" />
      <rect x="13.5" y="29.5" width="15" height="5.5" rx="2.5" fill="currentColor" />
    </Svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="M7 15.5c0-1.3 1.5-2 2.5-1.1l6 5.1 4-8.3c.6-1.2 2.3-1.2 2.9 0l4 8.3 6-5.1c1-.9 2.5-.2 2.5 1.1L33.5 28c-.1.9-.9 1.5-1.7 1.5H10.2c-.9 0-1.6-.6-1.7-1.5z"
        fill="currentColor"
      />
      <rect x="9" y="31.5" width="24" height="4.5" rx="2.2" fill="currentColor" />
    </Svg>
  );
}

export function FastForwardIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 42 42" {...props}>
      <path
        d="M9 13.5c0-1.6 1.8-2.5 3.1-1.6l9.2 6.6v-5c0-1.6 1.8-2.5 3.1-1.6l10.5 7.5c1.1.8 1.1 2.4 0 3.2l-10.5 7.5c-1.3.9-3.1 0-3.1-1.6v-5l-9.2 6.6c-1.3.9-3.1 0-3.1-1.6z"
        fill="currentColor"
      />
    </Svg>
  );
}

type ChestTone = "locked" | "ready" | "opened";

const CHEST_TONES: Record<ChestTone, { wood: string; dark: string; band: string; lock: string }> = {
  locked: { wood: "#4F6B7B", dark: "#3E5665", band: "#6B8799", lock: "#8FA9B8" },
  ready: { wood: "#C47A2C", dark: "#9A5A17", band: "#FFC800", lock: "#FFE46B" },
  opened: { wood: "#C47A2C", dark: "#9A5A17", band: "#FFC800", lock: "#FFE46B" },
};

export function ChestIcon({ tone = "ready", ...props }: IconProps & { tone?: ChestTone }) {
  const c = CHEST_TONES[tone];
  const open = tone === "opened";
  return (
    <Svg viewBox="0 0 84 76" {...props}>
      {open && <ellipse cx="42" cy="34" rx="30" ry="10" fill="#FFE46B" opacity=".9" />}
      {/* body */}
      <rect x="6" y="36" width="72" height="34" rx="7" fill={c.wood} />
      <rect x="6" y="56" width="72" height="14" rx="7" fill={c.dark} opacity=".55" />
      <rect x="14" y="36" width="9" height="34" fill={c.band} />
      <rect x="61" y="36" width="9" height="34" fill={c.band} />
      {/* lid */}
      <g transform={open ? "rotate(-24 10 36) translate(0 -6)" : undefined}>
        <path d="M6 36V24c0-9.9 8.1-18 18-18h36c9.9 0 18 8.1 18 18v12z" fill={c.wood} />
        <path d="M6 36v-5h72v5z" fill={c.dark} opacity=".55" />
        <path d="M14 36V9.3C16.7 7.3 20 6 23 6v30zM61 36V6c3 0 6.3 1.3 9 3.3V36z" fill={c.band} />
      </g>
      {/* lock */}
      <rect x="34" y="30" width="16" height="18" rx="4" fill={c.lock} />
      <circle cx="42" cy="37" r="2.8" fill={c.dark} />
      <rect x="40.7" y="37" width="2.6" height="6" rx="1.3" fill={c.dark} />
    </Svg>
  );
}

// ---- lesson ---------------------------------------------------------------

export function CloseIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <path
        d="M4 4l16 16M20 4 4 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 30 26" {...props}>
      <path
        d="M3 9.5C3 8.7 3.7 8 4.5 8h4l6-5.2c1-.8 2.5-.1 2.5 1.2v18c0 1.3-1.5 2-2.5 1.2L8.5 18h-4C3.7 18 3 17.3 3 16.5z"
        fill="currentColor"
      />
      <path
        d="M21 8.5c1.3 1.2 2 2.8 2 4.5s-.7 3.3-2 4.5M24.5 4.5C27 6.7 28.3 9.7 28.3 13s-1.3 6.3-3.8 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SparkIcon(props: IconProps) {
  // "New word" badge
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="12" fill="#CE82FF" />
      <path
        d="M12 5.5c.4 2.8 1.7 4.1 4.5 4.5-2.8.4-4.1 1.7-4.5 4.5-.4-2.8-1.7-4.1-4.5-4.5 2.8-.4 4.1-1.7 4.5-4.5zM16.5 13.5c.2 1.5.9 2.3 2.5 2.5-1.6.2-2.3 1-2.5 2.5-.2-1.5-.9-2.3-2.5-2.5 1.6-.2 2.3-1 2.5-2.5z"
        fill="rgb(var(--bg))"
      />
    </Svg>
  );
}

export function RetryIcon(props: IconProps) {
  // "Previous mistake" badge
  return (
    <Svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="12" fill="#FF9600" />
      <path
        d="M7 11V9.5C7 8.1 8.1 7 9.5 7H16m0 0-2.2-2.2M16 7l-2.2 2.2M17 13v1.5c0 1.4-1.1 2.5-2.5 2.5H8m0 0 2.2 2.2M8 17l2.2-2.2"
        fill="none"
        stroke="rgb(var(--bg))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 28 28" {...props}>
      <circle cx="13" cy="15" r="11.5" fill="#58CC02" />
      <circle cx="13" cy="15" r="7.5" fill="#fff" />
      <circle cx="13" cy="15" r="3.8" fill="#58CC02" />
      <path d="m13 15 9-9" stroke="#3C3C3C" strokeWidth="2.2" strokeLinecap="round" />
      <path d="m20 3.5.8 3.7 3.7.8-3 3-3.2-1.3-1.3-3.2z" fill="#89E219" />
    </Svg>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 20 20" {...props}>
      <path
        d="M4 17V4.5m0 .5h9.5c.6 0 .9.7.5 1.2L12 8.5l2 2.3c.4.5.1 1.2-.5 1.2H4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---- navigation -----------------------------------------------------------

export function HomeNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <path d="M7 15h18v10.5c0 1.4-1.1 2.5-2.5 2.5h-13A2.5 2.5 0 0 1 7 25.5z" fill="#FFC800" />
      <path
        d="M14.3 4.6a2.6 2.6 0 0 1 3.4 0l11 9.3c1 .9.4 2.6-1 2.6H4.3c-1.4 0-2-1.7-1-2.6z"
        fill="#FF4B4B"
      />
      <circle cx="16" cy="19.5" r="3.3" fill="#B66E28" />
      <rect x="13.7" y="20" width="4.6" height="8" fill="#B66E28" />
    </Svg>
  );
}

export function PracticeNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <g transform="rotate(-28 16 16)">
        <rect x="8" y="13.5" width="16" height="5" rx="1.5" fill="#84D8FF" />
        <rect x="5" y="8" width="6.5" height="16" rx="3" fill="#1CB0F6" />
        <rect x="20.5" y="8" width="6.5" height="16" rx="3" fill="#1CB0F6" />
        <rect x="1.5" y="11.5" width="4.5" height="9" rx="2.2" fill="#1899D6" />
        <rect x="26" y="11.5" width="4.5" height="9" rx="2.2" fill="#1899D6" />
      </g>
    </Svg>
  );
}

export function ShieldNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <path
        d="M5 8c0-1.7 1.3-3 3-3h16c1.7 0 3 1.3 3 3v8.5c0 5.5-4.7 9.3-9.9 11.2-.7.3-1.5.3-2.2 0C9.7 25.8 5 22 5 16.5z"
        fill="#FFC800"
      />
      <path d="M9 9.5 20.5 5H24c1.7 0 3 1.3 3 3v1.2L9 16.5z" fill="#FFE46B" />
    </Svg>
  );
}

export function QuestNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <rect x="3" y="12" width="26" height="15" rx="3" fill="#FF9600" />
      <path d="M3 13c0-4.4 3.6-8 8-8h10c4.4 0 8 3.6 8 8v2H3z" fill="#FFC800" />
      <rect x="3" y="14" width="26" height="3" fill="#CC7800" opacity=".5" />
      <rect x="12.5" y="12.5" width="7" height="8" rx="2" fill="#FFE46B" />
      <circle cx="16" cy="15.8" r="1.4" fill="#CC7800" />
      <rect x="7" y="5.5" width="3" height="21.5" fill="#FFE46B" opacity=".55" />
      <rect x="22" y="5.5" width="3" height="21.5" fill="#FFE46B" opacity=".55" />
    </Svg>
  );
}

export function ShopNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <rect x="5" y="13" width="22" height="14" rx="2.5" fill="#DCE6EC" />
      <rect x="13" y="18" width="6" height="9" rx="1.5" fill="#FF4B4B" />
      <rect x="7.5" y="17" width="4" height="4.5" rx="1" fill="#1CB0F6" />
      <rect x="20.5" y="17" width="4" height="4.5" rx="1" fill="#1CB0F6" />
      <path d="M4 7.5C4 6.1 5.1 5 6.5 5h19C26.9 5 28 6.1 28 7.5V13H4z" fill="#FF4B4B" />
      <path d="M10 5h6v8h-6zM22 5h3.5C26.9 5 28 6.1 28 7.5V13h-6z" fill="#fff" />
      <path
        d="M4 13h6c0 1.7-1.3 3-3 3s-3-1.3-3-3zM16 13h6c0 1.7-1.3 3-3 3s-3-1.3-3-3z"
        fill="#FF4B4B"
      />
      <path
        d="M10 13h6c0 1.7-1.3 3-3 3s-3-1.3-3-3zM22 13h6c0 1.7-1.3 3-3 3s-3-1.3-3-3z"
        fill="#fff"
      />
    </Svg>
  );
}

export function MoreNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <circle cx="16" cy="16" r="14" fill="#CE82FF" />
      <circle cx="10" cy="16" r="2" fill="#fff" />
      <circle cx="16" cy="16" r="2" fill="#fff" />
      <circle cx="22" cy="16" r="2" fill="#fff" />
    </Svg>
  );
}

/** Dashed avatar ring with the learner's initial, as used for a profile without a photo. */
export function AvatarRing({
  letter,
  size = 32,
  color = "rgb(var(--muted))",
  children,
}: {
  letter: string;
  size?: number;
  color?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-extrabold"
      style={{
        width: size,
        height: size,
        color,
        fontSize: size * 0.42,
        border: `${Math.max(2, size / 16)}px dashed ${color}`,
      }}
    >
      {letter}
      {children}
    </span>
  );
}

// ---- misc -----------------------------------------------------------------

export function GuidebookIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 26 26" {...props}>
      <rect x="6" y="2" width="17" height="22" rx="3.5" fill="#fff" />
      <path
        d="M10.5 8h8M10.5 13h8M10.5 18h5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M3 7h5M3 13h5M3 19h5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 20 20" {...props}>
      <path
        d="M17 10H4m0 0 5-5m-5 5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 20 20" {...props}>
      <path
        d="M10 17V4m0 0L5 9m5-5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 20 20" {...props}>
      <path
        d="m7 4 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 24 28" {...props}>
      <path
        d="M7 12V8.5a5 5 0 0 1 10 0V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect x="2.5" y="11" width="19" height="15" rx="4" fill="currentColor" />
      <circle cx="12" cy="17.5" r="2" fill="rgb(var(--bg))" opacity=".55" />
      <rect x="11" y="17.5" width="2" height="4.5" rx="1" fill="rgb(var(--bg))" opacity=".55" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M10 6v4.3l2.7 1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 20 20" {...props}>
      <path d="m3 17 1-4.2L13.3 3.5a1.8 1.8 0 0 1 2.5 0l.7.7a1.8 1.8 0 0 1 0 2.5L7.2 16z" fill="currentColor" />
    </Svg>
  );
}

export function InfinityHeartIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 28 25" {...props}>
      <defs>
        <linearGradient id="super-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#26FF55" />
          <stop offset=".5" stopColor="#268AFF" />
          <stop offset="1" stopColor="#FC55FF" />
        </linearGradient>
      </defs>
      <path
        d="M14 24c-.6 0-1.1-.2-1.6-.6C6 18.3 1.3 14.2 1.3 8.8 1.3 4.7 4.4 1.5 8.3 1.5c2.2 0 4.2 1 5.7 2.8 1.5-1.8 3.5-2.8 5.7-2.8 3.9 0 7 3.2 7 7.3 0 5.4-4.7 9.5-11.1 14.6-.5.4-1 .6-1.6.6z"
        fill="url(#super-heart)"
      />
      <path
        d="M10.5 9.5c-1.4 0-2.5 1-2.5 2.3s1.1 2.3 2.5 2.3c2.3 0 4.7-4.6 7-4.6 1.4 0 2.5 1 2.5 2.3s-1.1 2.3-2.5 2.3c-2.3 0-4.7-4.6-7-4.6z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
      />
    </Svg>
  );
}

export function FreezeIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 25 30" {...props}>
      <path
        d="M11.5 1.5c.6-.7 1.6-.7 2.2 0l6.5 8c2.5 3.1 3.6 5.9 3.6 8.8C23.8 24.3 18.9 29 12.6 29S1.4 24.3 1.4 18.3V8.2c0-1 1.1-1.7 2-1.1l2.8 1.7c.5.3 1 .2 1.4-.2z"
        fill="#84D8FF"
      />
      <path
        d="M11.7 15.2c.5-.6 1.3-.6 1.8 0l2.4 3c.8 1 1.2 2 1.2 3.1 0 2.4-2 4.3-4.5 4.3s-4.5-1.9-4.5-4.3c0-1.1.4-2.1 1.2-3.1z"
        fill="#fff"
      />
    </Svg>
  );
}

const LEAGUE_FILLS: Record<string, [string, string]> = {
  bronze: ["#E8A772", "#C97F45"],
  silver: ["#D9E2E8", "#A9B8C2"],
  gold: ["#FFD43B", "#E5A000"],
  sapphire: ["#5CC8FF", "#1C8FD6"],
  ruby: ["#FF7A7A", "#D83A3A"],
  emerald: ["#7BE06B", "#3FA63A"],
  amethyst: ["#D7A0FF", "#A45FE0"],
  pearl: ["#FFD6EC", "#F09AC8"],
  obsidian: ["#6B7480", "#3A424D"],
  diamond: ["#A8F0FF", "#4FC3E0"],
};

/** League shield. `locked` draws the grey keyhole placeholder for leagues not reached yet. */
export function LeagueBadge({
  league = "bronze",
  locked = false,
  ...props
}: IconProps & { league?: string; locked?: boolean }) {
  const [light, dark] = locked
    ? ["rgb(var(--line))", "rgb(var(--muted))"]
    : (LEAGUE_FILLS[league] ?? LEAGUE_FILLS.bronze);
  return (
    <Svg viewBox="0 0 60 66" {...props}>
      <path
        d="M5 15C5 9.5 9.5 5 15 5h30c5.5 0 10 4.5 10 10v19c0 13-11 21.5-22.3 26.3-1.7.7-3.7.7-5.4 0C16 55.5 5 47 5 34z"
        fill={dark}
      />
      <path
        d="M5 15C5 9.5 9.5 5 15 5h30c5.5 0 10 4.5 10 10v15c0 13-11 21.5-22.3 26.3-1.7.7-3.7.7-5.4 0C16 51.5 5 43 5 30z"
        fill={light}
      />
      {locked ? (
        <>
          <circle cx="30" cy="25" r="6" fill={dark} />
          <path d="M26.5 27h7l2 12h-11z" fill={dark} />
        </>
      ) : (
        <path
          d="M39 14c-9 1-16.5 8-17 18l-3 6.5c-.5 1.1.9 2.1 1.8 1.3l4-3.8c7.2 1 14.7-6.5 15.7-20.5.1-.9-.6-1.6-1.5-1.5zm-4 7.5c-4.5 2.5-7.5 6-9.5 10.5"
          fill={dark}
          stroke={light}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

const MEDAL_FILLS = ["", "#FFC800", "#C6D4DD", "#E0935A"];
const MEDAL_SHADES = ["", "#E5A000", "#9FB2BE", "#B9703C"];

export function MedalIcon({ place, ...props }: IconProps & { place: 1 | 2 | 3 }) {
  return (
    <Svg viewBox="0 0 30 34" {...props}>
      <path d="M8 20h14v10.5c0 1-1.1 1.5-1.9.9L15 27.5l-5.1 3.9c-.8.6-1.9.1-1.9-.9z" fill={MEDAL_SHADES[place]} />
      <circle cx="15" cy="13" r="12" fill={MEDAL_FILLS[place]} />
      <circle cx="15" cy="13" r="8.5" fill={MEDAL_SHADES[place]} opacity=".45" />
      <text
        x="15"
        y="18"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="#fff"
        fontFamily="inherit"
      >
        {place}
      </text>
    </Svg>
  );
}

/** The gradient "SUPER" wordmark pill used on subscription placeholders. */
export function SuperBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block -skew-x-12 rounded-md px-2 py-[1px] text-[13px] font-black italic tracking-wider text-white ${className}`}
      style={{ background: "linear-gradient(90deg,#26FF55 0%,#268AFF 52%,#FC55FF 100%)" }}
    >
      SUPER
    </span>
  );
}
