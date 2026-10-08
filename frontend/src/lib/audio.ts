"use client";

import { useSyncExternalStore } from "react";

import { getPreferences } from "./preferences";
import { scheduleSound, type Sound } from "./sfx";

/**
 * Audio for the app: synthesised sound effects (see sfx.ts) and spoken
 * Spanish through the browser's speech synthesis. No audio files are shipped.
 */

// ---------------------------------------------------------------------------
// Sound effects
// ---------------------------------------------------------------------------

let engine: { context: AudioContext; output: GainNode } | null = null;

function getEngine() {
  if (!engine) {
    const context = new AudioContext();
    const output = context.createGain();
    output.gain.value = 0.9;
    output.connect(context.destination);
    engine = { context, output };
  }
  return engine;
}

export function playSound(sound: Sound) {
  if (typeof window === "undefined" || !getPreferences().sound) return;
  try {
    const { context, output } = getEngine();
    if (context.state !== "running") void context.resume();
    scheduleSound(context, output, sound, context.currentTime + 0.01);
  } catch {
    // Audio is a nicety: never let it break the lesson.
  }
}

/**
 * Browsers keep audio suspended until the user interacts with the page.
 * Called on the first tap or key press so later sounds (which often fire
 * after a network round-trip, outside the gesture) play without delay.
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    void getEngine().context.resume();
  } catch {
    // Web Audio unavailable: sound effects simply stay silent.
  }
  loadVoices();
}

// ---------------------------------------------------------------------------
// Speech
// ---------------------------------------------------------------------------

/** Languages that are read aloud, with acceptable locales in order of preference. */
const SPOKEN_LOCALES: Record<string, string[]> = { es: ["es-es", "es-mx", "es-us", "es-419"] };

/** Voices the platform marks as higher quality tend to carry one of these words. */
const GOOD_VOICE = /natural|neural|online|google|premium|enhanced/i;

type Availability = "unknown" | "available" | "unavailable";

let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let voiceListening = false;
const availabilityListeners = new Set<() => void>();

const hasSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window;

function refreshVoices() {
  voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) voicesLoaded = true;
  availabilityListeners.forEach((listener) => listener());
}

/** Voice lists arrive asynchronously (and late, for network voices), so keep listening. */
function loadVoices() {
  if (!hasSpeech() || voiceListening) return;
  voiceListening = true;
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  refreshVoices();
  // Some browsers never fire `voiceschanged`: after a grace period, trust what we have.
  window.setTimeout(() => {
    voicesLoaded = true;
    refreshVoices();
  }, 2500);
}

function pickVoice(language: string): SpeechSynthesisVoice | null {
  const locales = SPOKEN_LOCALES[language];
  if (!locales) return null;
  const candidates = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language));
  if (candidates.length === 0) return null;
  const score = (voice: SpeechSynthesisVoice) => {
    const locale = voice.lang.toLowerCase().replace("_", "-");
    const localeRank = locales.indexOf(locale);
    return (localeRank === -1 ? locales.length : localeRank) * 2 + (GOOD_VOICE.test(voice.name) ? 0 : 1);
  };
  return candidates.reduce((best, voice) => (score(voice) < score(best) ? voice : best));
}

function speechAvailability(language: string): Availability {
  if (!hasSpeech() || !SPOKEN_LOCALES[language]) return "unavailable";
  if (pickVoice(language)) return "available";
  return voicesLoaded ? "unavailable" : "unknown";
}

/** Whether this browser can read `language` aloud (it needs an installed voice for it). */
export function useSpeechAvailability(language: string): Availability {
  return useSyncExternalStore(
    (listener) => {
      availabilityListeners.add(listener);
      loadVoices();
      return () => {
        availabilityListeners.delete(listener);
      };
    },
    () => speechAvailability(language),
    () => "unknown" as Availability,
  );
}

let latestRequest = 0;
let lastSpoken = { text: "", at: 0 };
// Holding a reference stops the utterance being garbage-collected mid-sentence
// (a long-standing Chrome bug that cuts speech off).
const keepAlive: { utterance: SpeechSynthesisUtterance | null } = { utterance: null };

/**
 * Read `text` aloud if it is in the language being learned. English is never
 * spoken. Returns true when speech is expected to play, so callers can fall
 * back to a click sound when it will not.
 */
export function speak(
  text: string | null | undefined,
  language: string | null | undefined,
  options: { slow?: boolean } = {},
): boolean {
  const spoken = language ?? "";
  if (!text || !hasSpeech() || !SPOKEN_LOCALES[spoken] || !getPreferences().speech) return false;
  loadVoices();
  if (speechAvailability(spoken) === "unavailable") return false;

  // Ignore an identical request that arrives straight after the last one
  // (React StrictMode runs effects twice in development; double taps).
  const now = performance.now();
  if (text === lastSpoken.text && now - lastSpoken.at < 400) return true;
  lastSpoken = { text, at: now };

  const request = ++latestRequest;
  const synth = window.speechSynthesis;

  const start = () => {
    if (request !== latestRequest) return; // a newer request replaced this one
    const voice = pickVoice(spoken);
    if (!voice) return; // no voice for this language: stay silent rather than mispronounce
    const utterance = new SpeechSynthesisUtterance(text.replace(/_+/g, " "));
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = options.slow ? 0.6 : 0.9;
    keepAlive.utterance = utterance;
    synth.resume(); // un-stick the queue if a previous utterance left it paused
    synth.speak(utterance);
  };

  if (synth.speaking || synth.pending) {
    // Chrome drops an utterance queued in the same tick as cancel(), so wait a beat.
    synth.cancel();
    window.setTimeout(start, 90);
  } else if (voicesLoaded) {
    start();
  } else {
    window.setTimeout(start, 300); // first use: give the voice list a moment to arrive
  }
  return true;
}

export function stopSpeaking() {
  if (!hasSpeech()) return;
  latestRequest++;
  window.speechSynthesis.cancel();
}
