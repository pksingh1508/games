// Every level, in order (Plan/11-panic-stack.md §5): six locations of six. Levels 1–2 of a location bring in
// its new things calmly, 3–4 add events, 5–6 tighten the clock and raise the line. They open one by one.
import type { BeltKind, EventKind, LevelDef, LocationId } from "../core/level";
import { BAKERY } from "./bakery";
import { KITCHEN } from "./kitchen";
import { MUSEUM } from "./museum";
import { SPACE } from "./space";
import { TOYROOM } from "./toyroom";
import { WAREHOUSE } from "./warehouse";

export interface LocationInfo {
  id: LocationId;
  number: number;
  name: string;
  /** What's new here. */
  about: string;
  levels: LevelDef[];
}

export const LOCATIONS: LocationInfo[] = [
  { id: "kitchen", number: 1, name: "The Kitchen", about: "Plates, loaves, a box that isn't quite square, jelly, and the first earthquakes.", levels: KITCHEN },
  { id: "warehouse", number: 2, name: "The Warehouse", about: "Crates, anvils, a very light safe, a very heavy feather, wind and the conveyor rush.", levels: WAREHOUSE },
  { id: "toyroom", number: 3, name: "The Toy Room", about: "Toy blocks, a duck that doesn't bounce, balloons, the cat, and alarms that might be lying.", levels: TOYROOM },
  { id: "museum", number: 4, name: "The Museum", about: "Statues, priceless vases, power cuts, pigeons, and builders shrinking the floor.", levels: MUSEUM },
  { id: "bakery", number: 5, name: "The Bakery", about: "Cakes that squash, ice that melts, and the freezer door stuck open.", levels: BAKERY },
  { id: "space", number: 6, name: "Space Station", about: "Low gravity, a paperweight that pulls, tilting thrusters, textures that won't load, and everything at once.", levels: SPACE },
];

export const LEVELS: LevelDef[] = LOCATIONS.flatMap((l) => l.levels);
export const LEVEL_IDS = LEVELS.map((l) => l.id);
export const FINAL_LEVEL = "6-6";

export function getLevel(id: string): LevelDef {
  const found = LEVELS.find((l) => l.id === id);
  if (!found) throw new Error(`no level ${id}`);
  return found;
}

export const locationOf = (id: string): LocationInfo => LOCATIONS.find((l) => l.levels.some((v) => v.id === id))!;

export const nextLevelId = (id: string): string | null => LEVEL_IDS[LEVEL_IDS.indexOf(id) + 1] ?? null;

/** What a level brings in for the first time, in campaign order (for its start card). */
export function newIn(id: string): { items: BeltKind[]; events: EventKind[] } {
  const items = new Set<BeltKind>();
  const events = new Set<EventKind>();
  for (const l of LEVELS) {
    const fresh = { items: [...new Set(l.items)].filter((k) => !items.has(k)), events: [...new Set([...l.events.map((e) => e.kind), ...(l.random?.kinds ?? [])])].filter((k) => !events.has(k)) };
    if (l.id === id) return fresh;
    fresh.items.forEach((k) => items.add(k));
    fresh.events.forEach((k) => events.add(k));
  }
  return { items: [], events: [] };
}
