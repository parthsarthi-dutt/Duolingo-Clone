/**
 * The app's owl mascot, drawn from scratch as an inline SVG.
 * `mood` swaps the eyes, beak and wing pose.
 */

export type MascotMood = "default" | "happy" | "sad" | "cheer";

const BODY_GREEN = "#58CC02";

export type MascotTone = "green" | "super" | "gold";

const TONES: Record<MascotTone, { body: string; shade: string; belly: string }> = {
  green: { body: BODY_GREEN, shade: "#46A302", belly: "#89E219" },
  super: { body: "url(#mascot-super)", shade: "#7A5CFF", belly: "rgba(255,255,255,0.35)" },
  gold: { body: "#FFC800", shade: "#E5A000", belly: "#FFE46B" },
};

const ORANGE = "#FF9600";
const ORANGE_DARK = "#E07F00";
const PUPIL = "#3C3C3C";

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === "happy") {
    return (
      <g fill="none" stroke={PUPIL} strokeWidth="7" strokeLinecap="round">
        <path d="M60 88q14-18 28 0" />
        <path d="M112 88q14-18 28 0" />
      </g>
    );
  }
  const lookDown = mood === "sad" ? 8 : 0;
  return (
    <>
      <circle cx="79" cy={84 + lookDown} r="13" fill={PUPIL} />
      <circle cx="121" cy={84 + lookDown} r="13" fill={PUPIL} />
      <circle cx="74" cy={79 + lookDown} r="4.5" fill="#fff" />
      <circle cx="116" cy={79 + lookDown} r="4.5" fill="#fff" />
      {mood === "sad" && (
        <>
          {/* heavy eyelids */}
          <path d="M44 80a30 30 0 0 1 60 0q-30-12-60 0z" fill={BODY_GREEN} />
          <path d="M96 80a30 30 0 0 1 60 0q-30-12-60 0z" fill={BODY_GREEN} />
          <path d="M150 104c5 7 7 11 7 14a7 7 0 0 1-14 0c0-3 2-7 7-14z" fill="#84D8FF" />
        </>
      )}
    </>
  );
}

export function Mascot({
  mood = "default",
  size = 120,
  className,
  tone = "green",
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** "super" paints the body with the subscription gradient; "gold" is the Legendary look. */
  tone?: MascotTone;
}) {
  const wingsUp = mood === "cheer";
  const isSuper = tone === "super";
  const { body: GREEN, shade: GREEN_DARK, belly: BELLY } = TONES[tone];
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {isSuper && (
        <defs>
          <linearGradient id="mascot-super" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#26FF55" />
            <stop offset="0.5" stopColor="#268AFF" />
            <stop offset="1" stopColor="#FC55FF" />
          </linearGradient>
        </defs>
      )}
      {/* feet */}
      <rect x="62" y="172" width="32" height="16" rx="8" fill={ORANGE} />
      <rect x="106" y="172" width="32" height="16" rx="8" fill={ORANGE} />
      {/* wings: tucked at the sides, or thrown up in celebration */}
      {wingsUp ? (
        <>
          <path d="M44 112C24 104 8 80 10 52c18 6 34 24 40 46z" fill={GREEN_DARK} />
          <path d="M156 112c20-8 36-32 34-60-18 6-34 24-40 46z" fill={GREEN_DARK} />
        </>
      ) : (
        <>
          <path d="M40 96c-18 8-24 40-10 60 10-8 16-26 16-46z" fill={GREEN_DARK} />
          <path d="M160 96c18 8 24 40 10 60-10-8-16-26-16-46z" fill={GREEN_DARK} />
        </>
      )}
      {/* body with ear tufts */}
      <path
        d="M36 80c0-26 4-48 15-57 6-5 15 2 22 11 17-6 37-6 54 0 7-9 16-16 22-11 11 9 15 31 15 57v40c0 38-28 60-64 60s-64-22-64-60z"
        fill={GREEN}
      />
      {/* belly */}
      <ellipse cx="100" cy="142" rx="40" ry="31" fill={BELLY} />
      <path
        d="M80 132q6 6 12 0M108 132q6 6 12 0M94 148q6 6 12 0"
        fill="none"
        stroke={GREEN}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* face */}
      <circle cx="74" cy="82" r="30" fill="#fff" />
      <circle cx="126" cy="82" r="30" fill="#fff" />
      <Eyes mood={mood} />
      {/* beak */}
      {mood === "cheer" || mood === "happy" ? (
        <>
          <path d="M86 104q14-10 28 0-4 22-14 22t-14-22z" fill={ORANGE_DARK} />
          <path d="M86 104q14-10 28 0-6 8-14 8t-14-8z" fill={ORANGE} />
          <path d="M94 116q6-4 12 0-2 8-6 8t-6-8z" fill="#FF7878" />
        </>
      ) : (
        <>
          <path d="M87 104q13-10 26 0-4 15-13 15t-13-15z" fill={ORANGE} />
          <path d="M91 110q9 5 18 0-3 9-9 9t-9-9z" fill={ORANGE_DARK} />
        </>
      )}
    </svg>
  );
}
