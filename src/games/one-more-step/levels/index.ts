// Every level, in order (Plan/01-one-more-step.md §5): five worlds of eight, then the finale. Par is the
// solver's shortest solution plus a little (levels/solutions.ts); they open one after another.
import type { LevelDef } from "../engine/types";
import { FINALE } from "./finale";
import { SOLUTIONS } from "./solutions";
import { WORLD_1 } from "./world-1";
import { WORLD_2 } from "./world-2";
import { WORLD_3 } from "./world-3";
import { WORLD_4 } from "./world-4";
import { WORLD_5 } from "./world-5";

export interface WorldInfo {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  /** "Oh no, the door is alive." */
  feel: string;
  levels: LevelDef[];
}

export const WORLDS: WorldInfo[] = [
  { id: 1, name: "Baby Steps", feel: "Oh no, the door is alive.", levels: WORLD_1 },
  { id: 2, name: "Catch the Door", feel: "Herd it. Trap it. Holes make good walls.", levels: WORLD_2 },
  { id: 3, name: "Echoes", feel: "You, a few steps behind you.", levels: WORLD_3 },
  { id: 4, name: "Mirror, Mirror", feel: "Two bodies, one brain.", levels: WORLD_4 },
  { id: 5, name: "Liar's Floor", feel: "Everything you learned is now suspect.", levels: WORLD_5 },
  { id: 6, name: "The Last Step", feel: "One more step.", levels: [FINALE] },
];

export const LEVELS: LevelDef[] = WORLDS.flatMap((w) => w.levels);
export const LEVEL_IDS = LEVELS.map((l) => l.id);
export const FINAL_LEVEL = FINALE.id;

export function getLevel(id: string): LevelDef {
  const found = LEVELS.find((l) => l.id === id);
  if (!found) throw new Error(`no level ${id}`);
  return found;
}

export const nextLevelId = (id: string): string | null => {
  const i = LEVEL_IDS.indexOf(id);
  return i >= 0 && i < LEVEL_IDS.length - 1 ? LEVEL_IDS[i + 1]! : null;
};

export const worldOf = (id: string): WorldInfo => WORLDS.find((w) => w.levels.some((l) => l.id === id)) ?? WORLDS[0]!;

/** Par: the shortest solution, plus a quarter (at least two steps). */
export const parFor = (optimal: number) => optimal + Math.max(2, Math.ceil(optimal * 0.25));

/** The solver's shortest solution (steps), and par. */
export function stepsOf(id: string): { optimal: number; par: number } {
  const optimal = SOLUTIONS[id]?.steps ?? 99;
  return { optimal, par: parFor(optimal) };
}
