"use client";

import { useSyncExternalStore } from "react";

import { PREFERENCES_KEY } from "./boot";

/** Device-level preferences. They live in localStorage, not on the server. */
export interface Preferences {
  theme: "dark" | "light";
  sound: boolean; // sound effects
  speech: boolean; // text-to-speech for Spanish prompts
  motion: boolean; // animations
}

const DEFAULTS: Preferences = { theme: "dark", sound: true, speech: true, motion: true };

let cached: Preferences | null = null;
const listeners = new Set<() => void>();

function read(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  if (cached === null) {
    try {
      cached = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}") };
    } catch {
      cached = DEFAULTS;
    }
  }
  return cached as Preferences;
}

function applyToDocument(preferences: Preferences) {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.motion = preferences.motion ? "on" : "off";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPreferences(): Preferences {
  return read();
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  cached = { ...read(), [key]: value };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(cached));
  applyToDocument(cached);
  listeners.forEach((listener) => listener());
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}
