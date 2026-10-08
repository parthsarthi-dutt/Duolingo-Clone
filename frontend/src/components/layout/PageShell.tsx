"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { StatsBar } from "./StatsBar";

const FOOTER_LINKS = ["About", "Blog", "Store", "Efficacy", "Careers", "Investors", "Terms", "Privacy"];

function FooterLinks() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-4 px-6 pt-1">
      {FOOTER_LINKS.map((label) => (
        <li key={label} className="label-caps text-[13px] text-muted">
          {label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The standard two-column page: main content plus a right rail that starts
 * with the stats bar. On narrow screens the rail disappears and the stats bar
 * pins to the top of the content instead.
 */
export function PageShell({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [railTop, setRailTop] = useState(0);

  // A rail taller than the viewport sticks by its bottom edge (like the real app),
  // which needs a negative `top` equal to the overflow.
  useEffect(() => {
    const element = railRef.current;
    if (!element) return;
    const update = () => setRailTop(Math.min(0, window.innerHeight - element.offsetHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1056px] justify-center gap-12 px-4 md:px-6">
      <div className="w-full min-w-0 max-w-[592px] pb-28 md:pb-10">
        <div className="sticky top-0 z-30 -mx-4 border-b-2 border-line bg-bg px-2 py-1 md:-mx-6 md:px-4 lg:hidden">
          <StatsBar />
        </div>
        {children}
      </div>
      <aside className="hidden w-[368px] shrink-0 lg:block">
        <div ref={railRef} className="sticky flex flex-col gap-6 pb-8" style={{ top: railTop }}>
          <StatsBar className="mt-[22px]" />
          {rail}
          <FooterLinks />
        </div>
      </aside>
    </div>
  );
}
