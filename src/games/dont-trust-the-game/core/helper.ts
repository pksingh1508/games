// HELPER's tell, as plain functions (Plan/04-dont-trust-the-game.md §3, §14 "HELPER's tell is correct on every
// single line"). When a line is a lie, the eyes glance sideways a moment after it starts, and again every few
// seconds while it's up; when it's true they look straight at you, always. The voice goes slightly off-key on
// lies (a second, optional tell). The Helper component draws exactly what these say.

export type Eyes = "straight" | "glance";

/** When the eyes glance (ms after the line starts): a beat in, then every few seconds. */
export const GLANCE = { first: 350, length: 700, every: 4200 } as const;

/** The glances during the first `ms` of a line: none at all for the truth. */
export function glances(lie: boolean, ms: number): Array<[number, number]> {
  if (!lie) return [];
  const out: Array<[number, number]> = [];
  for (let start: number = GLANCE.first; start < ms; start += GLANCE.every) out.push([start, start + GLANCE.length]);
  return out;
}

/** Where HELPER is looking, `ms` after starting a line. */
export function eyesAt(lie: boolean, ms: number): Eyes {
  if (!lie || ms < GLANCE.first) return "straight";
  return (ms - GLANCE.first) % GLANCE.every < GLANCE.length ? "glance" : "straight";
}

export type TextSpeed = "slow" | "normal" | "fast" | "instant";

const CPS: Record<TextSpeed, number> = { slow: 18, normal: 36, fast: 72, instant: Infinity };

/** How many characters are showing `ms` into a line. */
export const charsShown = (text: string, ms: number, speed: TextSpeed) => (speed === "instant" ? text.length : Math.min(text.length, Math.floor((ms / 1000) * CPS[speed])));

/** How long a line stays up: typing, then time to read it (and see the glance at least once). */
export function lineMs(text: string, speed: TextSpeed): number {
  const typing = speed === "instant" ? 0 : (text.length / CPS[speed]) * 1000;
  return Math.round(typing + Math.max(2600, text.length * 55));
}

/** HELPER's babble: one chirp per syllable-ish (every third letter), off-key when it lies. */
export function babble(text: string, lie: boolean): Array<{ at: number; hz: number }> {
  const notes: Array<{ at: number; hz: number }> = [];
  const letters = text.replace(/[^a-z0-9]/gi, "");
  const scale = [0, 2, 4, 7, 9, 12];
  for (let i = 0; i < letters.length; i += 3) {
    const code = letters.charCodeAt(i);
    const semis = scale[code % scale.length]! + (lie && i % 2 === 0 ? 0.6 : 0);
    notes.push({ at: (i / 3) * 0.075, hz: 520 * 2 ** (semis / 12) });
  }
  return notes;
}
