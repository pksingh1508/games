// Daily Chaos (Plan/09-one-tap-chaos.md §5): one seeded run per calendar day, the same
// microgames and rules in the same order for everyone, wherever they play.
import { hashString } from "@/engine/rng";
import { BOSSES, MICROGAMES } from "../microgames";
import type { BossId, MicrogameId } from "../microgames/types";

/** Daily #1 was the day the cabinet opened. */
const FIRST_DAY = Date.UTC(2026, 9, 1);

/** The local calendar date, as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface Daily {
  key: string;
  number: number;
  seed: number;
}

export function dailyFor(date: Date): Daily {
  const key = dayKey(date);
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const number = Math.round((Date.UTC(y, m - 1, d) - FIRST_DAY) / 86_400_000) + 1;
  return { key, number, seed: hashString(`one-tap-chaos:daily:${key}`) };
}

const QUIPS: Partial<Record<MicrogameId | BossId, string>> = {
  dont: "(of course)",
  sleep: "(shhh)",
  loading: "(it was loading)",
  wait: "(patience!)",
  bigger: "(maths is hard)",
  "high-five": "(left hanging)",
  conductor: "(he flipped it)",
  liar: "(he lied)",
  "final-tap": "(so close)",
  mystery: "(???)",
};

export function instructionOf(id: MicrogameId | BossId): string {
  return id in BOSSES ? BOSSES[id as BossId].name : MICROGAMES[id as MicrogameId].instruction;
}

/** The share card (Plan §7). */
export function shareText({
  daily,
  score,
  bosses,
  diedTo,
  url,
}: {
  daily: Daily | null;
  score: number;
  bosses: number;
  diedTo: MicrogameId | BossId | null;
  url: string;
}): string {
  const lines = [daily ? `ONE TAP CHAOS · Daily #${daily.number}` : "ONE TAP CHAOS", `Score ${score} 🔥 · Bosses beaten: ${bosses}`];
  if (diedTo) lines.push(`Died to: “${instructionOf(diedTo)}” ${QUIPS[diedTo] ?? ""}`.trimEnd());
  lines.push(url);
  return lines.join("\n");
}
