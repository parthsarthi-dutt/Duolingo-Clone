import { initial } from "@/lib/format";

export interface AvatarConfig {
  bg: string;
  body: string;
  clothing: string;
  glasses: string;
  glassesColor: string;
}

export function UserAvatar({
  avatarConfig,
  displayName,
  size = 48,
}: {
  avatarConfig: string | null;
  displayName: string;
  size?: number;
}) {
  let config: AvatarConfig | null = null;
  if (avatarConfig && avatarConfig.startsWith("{")) {
    try {
      config = JSON.parse(avatarConfig);
    } catch {}
  }

  if (config) {
    const isSquare = config.glasses === "square";
    // Render the vector graphics based on config
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-2xl shrink-0 overflow-hidden">
        {/* Background */}
        <rect width="100" height="100" fill={config.bg || "#e5e5e5"} />
        
        {/* Shoulders / Clothing */}
        <path d="M 15 100 C 15 70, 85 70, 85 100" fill={config.clothing || "#a87ffb"} />
        
        {/* Ears */}
        <circle cx="20" cy="45" r="8" fill={config.body || "#704838"} />
        <circle cx="80" cy="45" r="8" fill={config.body || "#704838"} />
        
        {/* Head */}
        <rect x="25" y="15" width="50" height="50" rx="16" fill={config.body || "#704838"} />
        
        {/* Neck */}
        <rect x="42" y="60" width="16" height="15" fill={config.body || "#704838"} />
        
        {/* Collar */}
        <path d="M 38 75 Q 50 85 62 75 L 62 85 Q 50 90 38 85 Z" fill={config.clothing || "#a87ffb"} filter="brightness(0.9)" />
        
        {/* Eyes */}
        <circle cx="40" cy="42" r="10" fill="#fff" />
        <circle cx="60" cy="42" r="10" fill="#fff" />
        <circle cx="43" cy="43" r="4" fill="#333" />
        <circle cx="57" cy="43" r="4" fill="#333" />

        {/* Nose */}
        <path d="M 50 45 L 45 55 Q 50 58 52 52 Z" fill="#000" opacity="0.15" />

        {/* Smile */}
        <path d="M 45 60 Q 50 65 58 58" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

        {/* Glasses */}
        {config.glasses && config.glasses !== "none" && (
           <g stroke={config.glassesColor || "#333"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
             {isSquare ? (
                <>
                  <rect x="26" y="28" width="22" height="20" rx="4" />
                  <rect x="52" y="28" width="22" height="20" rx="4" />
                </>
             ) : (
                <>
                  <circle cx="40" cy="42" r="13" />
                  <circle cx="60" cy="42" r="13" />
                </>
             )}
             <line x1="26" y1="38" x2="16" y2="38" />
             <line x1="74" y1="38" x2="84" y2="38" />
             <line x1="53" y1="38" x2="47" y2="38" />
           </g>
        )}
      </svg>
    );
  }

  // Fallback to solid color circle if avatar_color is a hex code or missing
  const color = avatarConfig && !avatarConfig.startsWith("{") ? avatarConfig : "rgb(var(--primary))";
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.42,
      }}
    >
      {initial(displayName)}
    </span>
  );
}
