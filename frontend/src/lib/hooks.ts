"use client";

import useSWR, { mutate } from "swr";

import { keys } from "./api";
import type { Leaderboard, Path, Profile, Quests, ShopItem, User } from "./types";

export const useUser = () => useSWR<User>(keys.me);
export const usePath = () => useSWR<Path>(keys.path);
export const useLeaderboard = () => useSWR<Leaderboard>(keys.leaderboard);
export const useQuests = () => useSWR<Quests>(keys.quests);
export const useProfile = () => useSWR<Profile>(keys.profile);
export const useShop = () => useSWR<ShopItem[]>(keys.shop);

/** Most mutations return the fresh learner summary: drop it straight into the cache. */
export function setUser(user: User) {
  void mutate(keys.me, user, { revalidate: false });
}

/** Re-fetch everything that depends on learner progress (after a lesson, a purchase, ...). */
export function refreshProgress() {
  for (const key of Object.values(keys)) {
    void mutate(key);
  }
}
