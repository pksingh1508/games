// Which floors come when, in Endless and the Daily Door (Plan/13-wrong-door.md §5 "Floor types": each kind
// has the floors it "usually appears" on), what's lying around to pick up, and which curse a cursed door
// brings. All from the run's seed, so the same seed is the same hotel on every device.
import { createRng, hashString, pick, type Rng } from "@/engine/rng";
import type { Archetype, Floor, ItemKind } from "../logic/types";

/** Where each kind of floor can turn up (inclusive). The Lucky Floor comes once per thirteen. */
const WINDOWS: Record<Exclude<Archetype, "plainSigns" | "final" | "montyHall">, readonly [number, number]> = {
  knightsKnaves: [2, Infinity],
  doorman: [3, Infinity],
  sound: [3, Infinity],
  sequence: [4, Infinity],
  anomaly: [5, Infinity],
  mirror: [6, Infinity],
  memory: [7, Infinity],
  dark: [8, Infinity],
  shifting: [9, Infinity],
  liarsBanquet: [10, Infinity],
};

/** How often each comes up, once it can. */
const WEIGHT: Record<keyof typeof WINDOWS, number> = {
  knightsKnaves: 3,
  doorman: 2,
  sound: 2,
  sequence: 1.5,
  anomaly: 1.5,
  mirror: 1.5,
  memory: 1,
  dark: 1.5,
  shifting: 1.5,
  liarsBanquet: 1.5,
};

/**
 * The kinds of floor for floors 1…`count` of a run with this seed. A Daily Door (`final`) ends on the Final
 * Floor at 13. The Lucky Floor comes once in every block of thirteen, somewhere from 5 to 11 of it; the same
 * kind never comes twice in a row, and newer kinds get a turn soon after they open.
 */
export function plan(seed: number, count: number, { final }: { final: boolean }): Archetype[] {
  const rng = createRng(`plan:${seed}`);
  const out: Archetype[] = [];
  let luckyAt = 0;
  for (let n = 1; n <= count; n++) {
    const block = Math.floor((n - 1) / 13);
    if ((n - 1) % 13 === 0) luckyAt = block * 13 + 5 + Math.floor(rng() * 7);
    if (n === 1) out.push("plainSigns");
    else if (final && n === 13) out.push("final");
    else if (n === luckyAt) out.push("montyHall");
    else out.push(pickKind(rng, n, out));
  }
  return out;
}

function pickKind(rng: Rng, n: number, before: readonly Archetype[]): Archetype {
  const prev = before[before.length - 1];
  const open = (Object.keys(WINDOWS) as Array<keyof typeof WINDOWS>).filter((k) => n >= WINDOWS[k][0] && n <= WINDOWS[k][1] && k !== prev);
  // A kind that has just opened and hasn't been seen yet comes first.
  const fresh = open.filter((k) => WINDOWS[k][0] >= n - 2 && !before.includes(k));
  if (fresh.length) return pick(rng, fresh);
  const total = open.reduce((s, k) => s + WEIGHT[k] / (1 + before.filter((b) => b === k).length), 0);
  let r = rng() * total;
  for (const k of open) {
    r -= WEIGHT[k] / (1 + before.filter((b) => b === k).length);
    if (r <= 0) return k;
  }
  return open[open.length - 1]!;
}

/** What's lying on this floor (on this visit), given what you already carry. */
export function itemFor(seed: number, floor: number, visit: number, carrying: ReadonlySet<ItemKind>, archetype: Archetype): ItemKind | null {
  if (floor === 1 || archetype === "montyHall" || archetype === "final") return null;
  const rng = createRng(`item:${seed}:${floor}:${visit}`);
  if (rng() > 0.32) return null;
  // Tools you keep aren't found twice.
  const kinds: Array<[ItemKind, number]> = [
    ["luckyKey", 2],
    ["truthCoin", 2],
    ["crowbar", 1.5],
    ["stethoscope", carrying.has("stethoscope") ? 0 : 1.5],
    ["lantern", carrying.has("lantern") || floor < 6 ? 0 : 1.5],
    ["chalk", carrying.has("chalk") ? 0 : 1.2],
  ];
  const total = kinds.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of kinds) {
    r -= w;
    if (r <= 0 && w > 0) return k;
  }
  return null;
}

export type Curse = "noKnock" | "silentDoorman" | "scrambled";

/** The curse on a floor: one that doesn't break it (a floor that needs knocks can't take them away). */
export function curseFor(floor: Floor, seed: number): Curse {
  const options: Curse[] = ["scrambled"];
  if (!floor.windRule && !floor.lucky) options.push("noKnock");
  if (floor.doorman && floor.archetype !== "doorman" && !floor.lucky) options.push("silentDoorman");
  return pick(createRng(`curse:${seed}:${floor.number}`), options);
}

/** The Daily Door's day: the UTC date, so it's the same hotel for everyone, wherever they are. */
export function dailyFor(date: Date): { key: string; number: number; seed: number } {
  const key = date.toISOString().slice(0, 10);
  const number = Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(2026, 9, 1)) / 86_400_000) + 1;
  return { key, number, seed: hashString(`wrong-door:daily:${key}`) };
}
