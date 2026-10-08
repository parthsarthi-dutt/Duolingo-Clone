"use client";

import { ArrowLeftIcon, GuidebookIcon } from "@/components/icons";
import { unitColor } from "@/lib/theme";
import type { Unit } from "@/lib/types";

/** The coloured header that names the unit currently scrolled into view. */
export function UnitBanner({ unit, onGuidebook }: { unit: Unit; onGuidebook: () => void }) {
  const color = unitColor(unit.color);
  return (
    <header
      className="flex h-[90px] items-center justify-between gap-3 rounded-[13px] px-4 text-white transition-colors duration-300"
      style={{ backgroundColor: color.base }}
    >
      <div className="min-w-0">
        <p className="label-caps flex items-center gap-2 text-[13px] text-white/70">
          <ArrowLeftIcon size={16} />
          Section {unit.section_index}, Unit {unit.order_index + 1}
        </p>
        <h1 className="mt-1.5 truncate text-[20px] font-extrabold leading-tight">{unit.title}</h1>
      </div>
      <button
        onClick={onGuidebook}
        aria-label={`Guidebook for ${unit.title}`}
        className="label-caps flex h-[50px] shrink-0 items-center gap-3 rounded-xl border-2 border-b-4 px-3 text-[15px] transition-[filter] hover:brightness-105 active:mt-[2px] active:border-b-2"
        style={{ borderColor: color.shadow, backgroundColor: color.base }}
      >
        <GuidebookIcon size={26} style={{ color: color.base }} />
        <span className="hidden pr-1 sm:inline">Guidebook</span>
      </button>
    </header>
  );
}
