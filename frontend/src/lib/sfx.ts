/**
 * Sound effects, synthesised from scratch with the Web Audio API (no audio files).
 *
 * Every effect is a short melody of "bell" notes: a sine fundamental plus a
 * couple of quieter harmonics, struck instantly and left to ring out. The
 * pitches sit between 500 Hz and 3 kHz on purpose: small laptop and phone
 * speakers barely reproduce anything lower.
 *
 * This module is pure (it only needs an audio context to draw into), so the
 * same code can render to speakers or to an offline buffer for testing.
 */

export type Sound =
  | "correct" // right answer: bright rising major third
  | "wrong" // wrong answer: soft falling tritone
  | "match" // one pair matched
  | "tap" // selecting something that is not read aloud
  | "complete" // lesson finished
  | "reward" // chest opened, streak extended, purchase
  | "fail"; // challenge lost / time ran out

interface Note {
  hz: number;
  /** Seconds after the effect starts. */
  at: number;
  /** Seconds until the note has rung out. */
  ring: number;
  /** Loudness relative to the other notes (default 1). */
  level?: number;
}

interface Patch {
  notes: Note[];
  /** Level of each harmonic, starting with the fundamental. More harmonics = harder mallet. */
  harmonics: number[];
  volume: number;
}

// Note frequencies (equal temperament).
const C5 = 523.25;
const F_SHARP_5 = 739.99;
const A_SHARP_5 = 932.33;
const C_SHARP_6 = 1108.73;
const F_SHARP_6 = 1479.98;
const A_SHARP_6 = 1864.66;
const C_SHARP_7 = 2217.46;

const SOFT = [1, 0.16, 0.05];
const HARD = [1, 0.32, 0.12];

// `ring` is the time a note takes to fade to silence; notes overlap and ring
// into each other, which is what makes these read as chimes rather than beeps.
const PATCHES: Record<Sound, Patch> = {
  correct: {
    notes: [
      { hz: F_SHARP_6, at: 0, ring: 0.6 },
      { hz: A_SHARP_6, at: 0.12, ring: 0.6 },
    ],
    harmonics: SOFT,
    volume: 0.38,
  },
  wrong: {
    notes: [
      { hz: F_SHARP_5, at: 0, ring: 0.5, level: 0.32 },
      { hz: C5, at: 0.12, ring: 0.65 },
    ],
    harmonics: HARD,
    volume: 0.5,
  },
  match: {
    notes: [{ hz: A_SHARP_6, at: 0, ring: 0.3 }],
    harmonics: SOFT,
    volume: 0.22,
  },
  tap: {
    notes: [{ hz: 620, at: 0, ring: 0.06 }],
    harmonics: [1],
    volume: 0.14,
  },
  complete: {
    notes: [
      { hz: F_SHARP_5, at: 0, ring: 0.45 },
      { hz: A_SHARP_5, at: 0.11, ring: 0.45 },
      { hz: C_SHARP_6, at: 0.22, ring: 0.5 },
      { hz: F_SHARP_6, at: 0.33, ring: 0.7 },
      { hz: A_SHARP_6, at: 0.5, ring: 1.1, level: 0.8 },
      { hz: C_SHARP_7, at: 0.5, ring: 1.1, level: 0.45 },
    ],
    harmonics: SOFT,
    volume: 0.3,
  },
  reward: {
    notes: [
      { hz: C_SHARP_6, at: 0, ring: 0.35 },
      { hz: F_SHARP_6, at: 0.07, ring: 0.35 },
      { hz: A_SHARP_6, at: 0.14, ring: 0.4 },
      { hz: C_SHARP_7, at: 0.21, ring: 0.8 },
    ],
    harmonics: SOFT,
    volume: 0.3,
  },
  fail: {
    notes: [
      { hz: A_SHARP_5, at: 0, ring: 0.4, level: 0.8 },
      { hz: F_SHARP_5, at: 0.17, ring: 0.45, level: 0.9 },
      { hz: C5, at: 0.34, ring: 0.8 },
    ],
    harmonics: HARD,
    volume: 0.42,
  },
};

const ATTACK = 0.004; // seconds: fast enough to sound struck, slow enough not to click
const SILENCE = 0.0005;

/**
 * Schedule one effect on `context`, routed into `output`, starting at
 * `when` (in context time). Returns the effect's length in seconds.
 */
export function scheduleSound(
  context: BaseAudioContext,
  output: AudioNode,
  sound: Sound,
  when: number,
): number {
  const patch = PATCHES[sound];
  let length = 0;
  for (const note of patch.notes) {
    const start = when + note.at;
    const end = start + note.ring;
    length = Math.max(length, note.at + note.ring);
    patch.harmonics.forEach((harmonicLevel, index) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const peak = patch.volume * (note.level ?? 1) * harmonicLevel;
      oscillator.type = "sine";
      oscillator.frequency.value = note.hz * (index + 1);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(peak, start + ATTACK);
      // Higher harmonics die away faster, as they do on a real bar or bell.
      envelope.gain.exponentialRampToValueAtTime(SILENCE, start + note.ring / (index + 1));
      oscillator.connect(envelope).connect(output);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    });
  }
  return length;
}

export const SOUNDS = Object.keys(PATCHES) as Sound[];
