"use client";

import { useState, type ReactNode } from "react";
import { mutate } from "swr";

import { FreezeIcon, GemIcon, HeartIcon, InfinityHeartIcon, SuperBadge } from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { DailyQuestsCard, SuperCard } from "@/components/layout/RailCards";
import { Button } from "@/components/ui/Button";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api, keys } from "@/lib/api";
import { playSound } from "@/lib/audio";
import { setUser, useShop } from "@/lib/hooks";
import type { ShopItem } from "@/lib/types";

const ITEM_ICONS: Record<string, ReactNode> = {
  heart: <HeartIcon size={64} />,
  infinity: <InfinityHeartIcon size={64} />,
  freeze: <FreezeIcon size={72} />,
};

const SECTIONS: { title: string; keys: string[] }[] = [
  { title: "Hearts", keys: ["heart_refill", "unlimited_hearts"] },
  { title: "Power-ups", keys: ["streak_freeze"] },
];

function ItemRow({ item }: { item: ShopItem }) {
  const { toast, comingSoon } = useToast();
  const [buying, setBuying] = useState(false);
  const isPlaceholder = item.price === null || item.key !== "heart_refill";

  async function buy() {
    if (isPlaceholder) return comingSoon(item.title);
    setBuying(true);
    try {
      const result = await api.purchase(item.key);
      setUser(result.user);
      void mutate(keys.shop);
      playSound("reward");
      toast({ title: result.message, icon: <HeartIcon size={28} /> });
    } catch (error) {
      toast({ title: error instanceof ApiError ? error.message : "Purchase failed" });
    } finally {
      setBuying(false);
    }
  }

  return (
    <li className="flex flex-col gap-4 border-t-2 border-line py-6 sm:flex-row sm:items-center sm:gap-6">
      <span className="flex w-[84px] shrink-0 justify-center">{ITEM_ICONS[item.icon]}</span>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 text-[19px] font-extrabold">
          {item.title}
          {item.price === null && <SuperBadge />}
        </h3>
        <p className="mt-1 text-[17px] font-semibold leading-6 text-ink-soft">{item.description}</p>
        {!item.available && item.unavailable_reason && (
          <p className="mt-1 text-[15px] font-bold text-muted">{item.unavailable_reason}</p>
        )}
      </div>
      <Button
        variant="outline"
        disabled={buying || (!isPlaceholder && !item.available)}
        onClick={buy}
        className="min-w-[150px] shrink-0 !text-ink"
      >
        {item.price === null ? (
          <span className="text-macaw">Free trial</span>
        ) : (
          <>
            Get for: <GemIcon size={18} /> <span className="text-gem">{item.price}</span>
          </>
        )}
      </Button>
    </li>
  );
}

export default function ShopPage() {
  const { data: items, error, mutate: retry } = useShop();
  return (
    <PageShell
      rail={
        <>
          <SuperCard />
          <DailyQuestsCard />
        </>
      }
    >
      {items ? (
        <div className="pt-6">
          {SECTIONS.map((section) => (
            <section key={section.title} className="mb-6">
              <h2 className="pb-4 text-[24px] font-extrabold">{section.title}</h2>
              <ul>
                {items
                  .filter((item) => section.keys.includes(item.key))
                  .map((item) => (
                    <ItemRow key={item.key} item={item} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : error ? (
        <PageError message={error.message} onRetry={() => void retry()} />
      ) : (
        <PageLoading />
      )}
    </PageShell>
  );
}
