import clsx from "clsx";
import type { ReactNode } from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  /** Any CSS colour for the filled part. */
  color?: string;
  height?: number;
  /** Text centred on the bar, e.g. "10 / 20". */
  label?: ReactNode;
  className?: string;
}

/** The rounded bar with a glossy highlight used for lessons, quests and achievements. */
export function ProgressBar({
  value,
  max,
  color = "rgb(var(--primary))",
  height = 16,
  label,
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={clsx("relative w-full overflow-hidden rounded-full bg-line", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
        style={{
          width: `${percent}%`,
          minWidth: percent > 0 ? height : 0,
          backgroundColor: color,
        }}
      >
        <div
          className="mx-2 rounded-full bg-white/25"
          style={{ height: height * 0.3, transform: `translateY(${height * 0.25}px)` }}
        />
      </div>
      {label !== undefined && (
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center text-[13px] font-extrabold",
            percent >= 50 ? "text-black/40" : "text-ink-soft/70",
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
