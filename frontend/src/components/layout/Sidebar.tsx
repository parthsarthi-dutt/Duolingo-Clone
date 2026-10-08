"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";

import {
  AvatarRing,
  HomeNavIcon,
  MoreNavIcon,
  PracticeNavIcon,
  QuestNavIcon,
  ShieldNavIcon,
  ShopNavIcon,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { initial } from "@/lib/format";
import { useUser } from "@/lib/hooks";
import { auth } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  Icon?: ComponentType<{ size?: number }>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/learn", label: "Learn", Icon: HomeNavIcon },
  { href: "/practice", label: "Practice", Icon: PracticeNavIcon },
  { href: "/leaderboard", label: "Leaderboards", Icon: ShieldNavIcon },
  { href: "/quests", label: "Quests", Icon: QuestNavIcon },
  { href: "/shop", label: "Shop", Icon: ShopNavIcon },
  { href: "/profile", label: "Profile" }, // drawn as the learner's avatar
];

const ITEM =
  "label-caps flex h-[52px] w-full items-center justify-center gap-5 rounded-xl border-2 px-3 text-[15px] transition-colors xl:justify-start";
const IDLE = "border-transparent text-ink-soft hover:bg-surface";
const ACTIVE = "border-selected-line bg-selected-bg text-macaw";

export function NavIcon({ item }: { item: NavItem }) {
  const { data: user } = useUser();
  if (item.Icon) return <item.Icon size={32} />;
  return <AvatarRing letter={initial(user?.display_name ?? "")} size={32} />;
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { comingSoon } = useToast();
  const menuItem =
    "label-caps block w-full px-5 py-3 text-left text-[15px] text-ink-soft hover:bg-surface";

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={clsx(ITEM, pathname === "/settings" ? ACTIVE : IDLE)}
      >
        <MoreNavIcon size={32} />
        <span className="hidden xl:inline">More</span>
      </button>
      {open && (
        <div className="absolute left-full top-0 z-40 w-[288px] pl-2">
          <div role="menu" className="card animate-fade-in overflow-hidden bg-bg py-2">
            <Link role="menuitem" href="/settings" className={menuItem} onClick={() => setOpen(false)}>
              Settings
            </Link>
            <button role="menuitem" className={menuItem} onClick={() => comingSoon("The help center")}>
              Help
            </button>
            <button
              role="menuitem"
              className={menuItem}
              onClick={() => {
                setOpen(false);
                auth.logout();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Left navigation: full labels on wide screens, an icon rail on tablets. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col gap-2 border-r-2 border-line bg-bg px-4 md:flex xl:w-[256px]"
    >
      <Link href="/learn" className="flex h-[88px] items-center justify-center xl:justify-start xl:pl-4">
        <span className="hidden text-[32px] font-black lowercase leading-none tracking-[-1.5px] text-owl xl:inline">
          duolingo
        </span>
        <span className="text-[34px] font-black leading-none text-owl xl:hidden">d</span>
      </Link>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(ITEM, active ? ACTIVE : IDLE)}
          >
            <NavIcon item={item} />
            <span className="hidden xl:inline">{item.label}</span>
          </Link>
        );
      })}
      <MoreMenu />
    </nav>
  );
}
