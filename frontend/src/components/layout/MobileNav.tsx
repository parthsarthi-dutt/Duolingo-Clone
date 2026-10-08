"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MoreNavIcon } from "@/components/icons";

import { NAV_ITEMS, NavIcon } from "./Sidebar";

/** Bottom tab bar shown on phones instead of the sidebar. */
export function MobileNav() {
  const pathname = usePathname();
  const tabs = [...NAV_ITEMS, { href: "/settings", label: "More", Icon: MoreNavIcon }];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[76px] items-center justify-around border-t-2 border-line bg-bg px-1 md:hidden"
    >
      {tabs.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-[50px] w-[46px] items-center justify-center rounded-xl border-2",
              active ? "border-selected-line bg-selected-bg" : "border-transparent",
            )}
          >
            <NavIcon item={item} />
          </Link>
        );
      })}
    </nav>
  );
}
