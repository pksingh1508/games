// Every level, in order (Plan/10-last-pixel.md §5): four worlds of ten, then the finale. They open one
// after another; the tab escape (4-10) is a bonus, so the finale opens once 4-09's done.
import type { LevelDef } from "../core/level";
import { FINALE } from "./finale";
import { WORLD_1 } from "./world-1";
import { WORLD_2 } from "./world-2";
import { WORLD_3 } from "./world-3";
import { WORLD_4 } from "./world-4";

export interface WorldInfo {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  about: string;
  levels: LevelDef[];
}

export const WORLDS: WorldInfo[] = [
  { id: 1, name: "Home Makeover", about: "Rollers, brushes and a sponge. Pix runs, then learns to blend in.", levels: WORLD_1 },
  { id: 2, name: "Garden Day", about: "Mower, snow shovel, pressure washer. Decoys among the fireflies, and a Pix that burrows.", levels: WORLD_2 },
  { id: 3, name: "Desktop Cleanup", about: "A screen in your screen. Under the HUD, a dead pixel, a second cursor.", levels: WORLD_3 },
  { id: 4, name: "Outside the Box", about: "Every tool. Pix leaves the canvas, and un-paints as it goes.", levels: WORLD_4 },
  { id: 5, name: "Pix's Revenge", about: "The finale.", levels: [FINALE] },
];

export const LEVELS: LevelDef[] = WORLDS.flatMap((w) => w.levels);
export const LEVEL_IDS = LEVELS.map((l) => l.id);
export const FINAL_LEVEL = FINALE.id;
export const BONUS_LEVEL = "4-10";

export function getLevel(id: string): LevelDef {
  const found = LEVELS.find((l) => l.id === id);
  if (!found) throw new Error(`no level ${id}`);
  return found;
}

/** "World 2 · 07", or "★ The finale". */
export const levelLabel = (id: string) => (id === FINAL_LEVEL ? "★" : id);

/** The level after this one (null at the very end): 4-09, then the bonus, then the finale. */
export function nextLevelId(id: string): string | null {
  const i = LEVEL_IDS.indexOf(id);
  return i >= 0 && i < LEVEL_IDS.length - 1 ? LEVEL_IDS[i + 1]! : null;
}

export const worldOf = (id: string): WorldInfo => WORLDS.find((w) => w.levels.some((l) => l.id === id)) ?? WORLDS[0]!;
