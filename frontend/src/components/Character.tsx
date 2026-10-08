/**
 * The cast that "speaks" exercise prompts. Original flat illustrations,
 * selected by the `character` key stored on each exercise.
 */

interface Look {
  skin: string;
  hair: string;
  top: string;
  topShade: string;
  legs: string;
  hairStyle: "bun" | "short" | "long";
}

const PEOPLE: Record<string, Look> = {
  ana: {
    skin: "#FFD0B0",
    hair: "#FFB800",
    top: "#FF4B4B",
    topShade: "#D93B3B",
    legs: "#FFD0B0",
    hairStyle: "bun",
  },
  leo: {
    skin: "#F3B58E",
    hair: "#3C3C3C",
    top: "#D97A00",
    topShade: "#A85D00",
    legs: "#7A4A1E",
    hairStyle: "short",
  },
  mia: {
    skin: "#B9794F",
    hair: "#2B2B2B",
    top: "#FF86D0",
    topShade: "#E060B0",
    legs: "#49C0F8",
    hairStyle: "long",
  },
};

const SHADOW = "rgb(var(--line))";

function Person({ look }: { look: Look }) {
  return (
    <>
      <ellipse cx="60" cy="151" rx="32" ry="8" fill={SHADOW} />
      {/* legs + shoes */}
      <rect x="45" y="116" width="11" height="28" rx="5" fill={look.legs} />
      <rect x="64" y="116" width="11" height="28" rx="5" fill={look.legs} />
      <rect x="39" y="140" width="19" height="9" rx="4.5" fill={look.topShade} />
      <rect x="62" y="140" width="19" height="9" rx="4.5" fill={look.topShade} />
      {look.hairStyle === "long" && (
        <path d="M33 38c0-18 12-30 27-30s27 12 27 30v34c0 5-6 7-9 3L60 52 42 75c-3 4-9 2-9-3z" fill={look.hair} />
      )}
      {/* torso */}
      <path
        d="M31 82c0-15 11-24 29-24s29 9 29 24l3 30c1 9-11 14-32 14s-33-5-32-14z"
        fill={look.top}
      />
      {/* crossed arms */}
      <path
        d="M34 88q26 20 50 4M86 88q-26 20-50 4"
        fill="none"
        stroke={look.topShade}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="35" cy="92" r="6.5" fill={look.skin} />
      <circle cx="85" cy="92" r="6.5" fill={look.skin} />
      {/* head */}
      <circle cx="60" cy="38" r="25" fill={look.skin} />
      {look.hairStyle === "bun" && (
        <>
          <circle cx="60" cy="9" r="9" fill={look.hair} />
          <path d="M35 34c0-15 11-24 25-24s25 9 25 24c-8-7-16-9-25-9s-17 2-25 9z" fill={look.hair} />
          <rect x="35" y="27" width="50" height="6" rx="3" fill={look.top} />
        </>
      )}
      {look.hairStyle === "short" && (
        <path d="M34 36c-2-17 10-27 26-27s28 10 26 27c-5-9-11-13-17-13-10 0-22 3-35 13z" fill={look.hair} />
      )}
      {look.hairStyle === "long" && (
        <path d="M35 36c0-16 11-26 25-26s25 10 25 26c-7-10-16-14-25-14s-18 4-25 14z" fill={look.hair} />
      )}
      {/* face */}
      <circle cx="51" cy="40" r="3.2" fill="#3C3C3C" />
      <circle cx="69" cy="40" r="3.2" fill="#3C3C3C" />
      <path d="M52 49q8 7 16 0" fill="none" stroke="#3C3C3C" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="45" cy="47" r="3.5" fill="#FF7878" opacity=".45" />
      <circle cx="75" cy="47" r="3.5" fill="#FF7878" opacity=".45" />
    </>
  );
}

function Bear() {
  const fur = "#A8653A";
  const furShade = "#8A4F2A";
  const light = "#D9A06B";
  return (
    <>
      <ellipse cx="60" cy="151" rx="36" ry="8" fill={SHADOW} />
      <ellipse cx="60" cy="110" rx="37" ry="40" fill={fur} />
      <ellipse cx="60" cy="118" rx="22" ry="24" fill={light} opacity=".55" />
      <ellipse cx="40" cy="146" rx="14" ry="8" fill={furShade} />
      <ellipse cx="80" cy="146" rx="14" ry="8" fill={furShade} />
      {/* scarf */}
      <path d="M30 78q30 18 60 0l3 12q-33 18-66 0z" fill="#49C0F8" />
      <path d="M70 90l14-4 4 22-12 3z" fill="#1CB0F6" />
      {/* crossed arms */}
      <path
        d="M30 104q30 22 60 6M90 104q-30 22-60 6"
        fill="none"
        stroke={furShade}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* head */}
      <circle cx="39" cy="22" r="10" fill={fur} />
      <circle cx="81" cy="22" r="10" fill={fur} />
      <circle cx="39" cy="22" r="5" fill={light} />
      <circle cx="81" cy="22" r="5" fill={light} />
      <circle cx="60" cy="46" r="29" fill={fur} />
      <ellipse cx="60" cy="56" rx="13" ry="11" fill={light} />
      <ellipse cx="60" cy="51" rx="5" ry="3.5" fill="#3C3C3C" />
      <path d="M54 59q6 5 12 0" fill="none" stroke="#3C3C3C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 40l10 3M76 40l-10 3" stroke="#3C3C3C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="45" r="3" fill="#3C3C3C" />
      <circle cx="70" cy="45" r="3" fill="#3C3C3C" />
    </>
  );
}

export function Character({
  name,
  size = 150,
  className,
}: {
  name: string | null;
  size?: number;
  className?: string;
}) {
  const look = PEOPLE[name ?? ""];
  return (
    <svg
      viewBox="0 0 120 160"
      width={(size * 120) / 160}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {look ? <Person look={look} /> : <Bear />}
    </svg>
  );
}
