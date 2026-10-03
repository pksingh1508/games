// Every level, in play order (Plan/06-trapsprint.md §5): three zones of ten, then Remix, the same
// thirty mirrored with meaner traps (it opens once 3-10 is cleared).
import { parseLevel, type Level, type LevelSource } from "../core/level";
import { ZONE_1 } from "./zone1";
import { ZONE_2 } from "./zone2";
import { ZONE_3 } from "./zone3";

export type ZoneId = 1 | 2 | 3 | "R";

export interface Zone {
  id: ZoneId;
  name: string;
  /** One line for the level select. */
  blurb: string;
  levels: string[];
}

const SOURCES: LevelSource[] = [...ZONE_1, ...ZONE_2, ...ZONE_3];
const BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export const MAIN_LEVELS = SOURCES.map((s) => s.id);
export const REMIX_LEVELS = MAIN_LEVELS.map((id) => `R${id}`);
export const ALL_LEVELS = [...MAIN_LEVELS, ...REMIX_LEVELS];

export const ZONES: Zone[] = [
  { id: 1, name: "Green Lies", blurb: "Grassland. Pop spikes, drop floors, doors with wheels.", levels: ZONE_1.map((l) => l.id) },
  { id: 2, name: "Factory of Fails", blurb: "Belts, presses, saws and walls that close in.", levels: ZONE_2.map((l) => l.id) },
  { id: 3, name: "Castle Gotcha", blurb: "Trap chains, fake flags and something that follows you.", levels: ZONE_3.map((l) => l.id) },
  { id: "R", name: "Remix", blurb: "Every level mirrored. Shorter warnings, faster traps.", levels: REMIX_LEVELS },
];

export const isRemixId = (id: string) => id.startsWith("R");
export const baseId = (id: string) => id.replace(/^R/, "");

export function hasLevel(id: string): boolean {
  return BY_ID.has(baseId(id));
}

export function levelSource(id: string): LevelSource {
  const source = BY_ID.get(baseId(id));
  if (!source) throw new Error(`No level ${id}`);
  return source;
}

const parsed = new Map<string, Level>();

/** A level ready to play (parsed once). */
export function getLevel(id: string): Level {
  let level = parsed.get(id);
  if (!level) {
    level = parseLevel(levelSource(id), { remix: isRemixId(id) });
    parsed.set(id, level);
  }
  return level;
}

export function zoneOf(id: string): Zone {
  return ZONES.find((z) => z.levels.includes(id))!;
}

/** The level after this one in play order (null after the last). */
export function nextLevelId(id: string): string | null {
  const i = ALL_LEVELS.indexOf(id);
  return i >= 0 && i < ALL_LEVELS.length - 1 ? ALL_LEVELS[i + 1]! : null;
}

/** The next level inside the same zone (for zone speedruns). */
export function nextInZone(id: string): string | null {
  const zone = zoneOf(id);
  const i = zone.levels.indexOf(id);
  return zone.levels[i + 1] ?? null;
}

/**
 * Levels open one after another: a level is open once the one before it is cleared. Remix opens
 * when 3-10 is cleared.
 */
export function isUnlocked(id: string, cleared: (id: string) => boolean): boolean {
  if (id === MAIN_LEVELS[0]) return true;
  if (id === REMIX_LEVELS[0]) return cleared(MAIN_LEVELS[MAIN_LEVELS.length - 1]!);
  const i = ALL_LEVELS.indexOf(id);
  return i > 0 && cleared(ALL_LEVELS[i - 1]!);
}

/** "1-07", or "R 1-07" for Remix. */
export const levelLabel = (id: string) => (isRemixId(id) ? `R ${baseId(id)}` : id);
