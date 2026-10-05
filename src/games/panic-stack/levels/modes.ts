// The Endless Tower and the Daily Stack (Plan/11-panic-stack.md §5 "Other modes"). Endless only brings in the
// liars and events you've already met in the locations (§10 rule 2: a liar is introduced calmly before it
// comes under pressure), so a new player's first tower is calm and it gets wilder as you learn. The Daily Stack
// is the same for everyone, so it opens after the Toy Room and only uses what the first three locations teach.
import { createRng, pick, randInt, shuffle } from "@/engine/rng";
import { EVENT_KINDS } from "../core/events";
import { ITEMS, type ItemId } from "../core/items";
import type { BeltKind, EventKind, LevelDef, LevelEvent, LocationId } from "../core/level";

const HONEST: ItemId[] = ["brick", "crate", "plate", "block", "loaf", "cargo", "anvil", "statue", "bowling"];

/** The level that has to be cleared before the Daily Stack opens. */
export const DAILY_AFTER = "3-6";
const DAILY_LIARS: ItemId[] = ["box", "jelly", "safe", "feather", "duck", "balloon"];
const DAILY_EVENTS: EventKind[] = ["earthquake", "wind", "conveyorRush", "cat", "fakePanic"];

/** Endless: honest things, plus the liars and the events you've met. */
export function endlessLevel(known: (what: string) => boolean): LevelDef {
  const liars = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].lie && known(id));
  const more: BeltKind[] = [...HONEST.flatMap((h) => [h, h, h]), ...liars.flatMap((l) => [l, l]), "xray"];
  const events = (["earthquake", "wind", "cat", "tilt", "lowGravity", "iceAge", "bird", "lightsOut", "fakePanic", "reskin", "conveyorRush"] as EventKind[]).filter((k) => known(k));
  return {
    id: "endless",
    name: "Endless Tower",
    location: "warehouse",
    time: 0,
    goal: 0,
    platform: 4,
    items: ["crate", "brick", "crate", "brick"],
    more,
    belt: 17,
    events: [],
    random: events.length ? { kinds: events, every: [22, 34] } : undefined,
    hint: "Stack forever. The camera follows you up. Three falls and it's over.",
  };
}

/** Endless for this save: liars you've found out, events you've been warned about. */
export function endlessFor(save: { seen: Readonly<Record<string, number>>; known: Readonly<Record<string, number>> }): LevelDef {
  return endlessLevel((what) => ((EVENT_KINDS as readonly string[]).includes(what) ? !!save.seen[what] : !!save.known[what]));
}

/** Today's Daily Stack: the same items and events for everyone (by the date's seed). */
export function dailyLevel(seed: number): LevelDef {
  const rng = createRng(seed);
  const location = pick(rng, ["kitchen", "warehouse", "toyroom"] as LocationId[]);
  const pool: BeltKind[] = [...HONEST.flatMap((h) => [h, h]), ...DAILY_LIARS];
  const items: BeltKind[] = ["crate", "brick", ...Array.from({ length: 46 }, () => pick(rng, pool))];
  const kinds = shuffle(rng, DAILY_EVENTS).slice(0, 4);
  const events: LevelEvent[] = kinds.map((kind, k) => ({ kind, at: 18 + k * 24 + randInt(rng, -4, 4) }));
  return {
    id: "daily",
    name: "Daily Stack",
    location,
    time: 120,
    goal: 0,
    platform: 4,
    items,
    more: pool,
    belt: 16,
    events,
    hint: "Two minutes. Build as high as you can; your height counts once it's held still for three seconds.",
  };
}
