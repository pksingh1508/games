// A careful player, for the tests and QA (Plan/13-wrong-door.md §10): it only uses what you could know.
// It reads the plaque and every clue on show, asks Mr. Hinges the double question when two doors are left,
// knocks when the wind can settle it, goes back when something's changed, believes the last plaque, and on
// the Lucky Floor always switches. If the floors are fair, it never opens a wrong door except by luck.
import { candidates } from "../logic/solver";
import type { DoorId, Floor } from "../logic/types";
import { can, knowledgeOf, type Choice, type RunState } from "./state";

export type Move =
  | { type: "knock"; door: DoorId }
  | { type: "ask"; door: DoorId }
  | { type: "flicker" }
  | { type: "choose"; choice: Choice }
  | { type: "decide"; switching: boolean };

export function nextMove(run: RunState, floor: Floor): Move {
  if (floor.final) return { type: "choose", choice: floor.final.way };
  if (floor.anomaly) return { type: "choose", choice: floor.anomaly.changed ? "back" : 1 };
  if (floor.lucky) return run.play.lucky ? { type: "decide", switching: true } : { type: "choose", choice: 1 };
  const k = knowledgeOf(run, floor);
  const left = candidates(floor, k);
  if (left.length === 1) {
    if (floor.shuffle && !run.play.shuffled) return { type: "flicker" };
    return { type: "choose", choice: left[0]! };
  }
  const allowed = can(run, floor);
  if (left.length === 2 && allowed.ask) return { type: "ask", door: left[0]! };
  const unknocked = left.filter((d) => run.play.knocks[d] === undefined);
  if (allowed.knock && unknocked.length) return { type: "knock", door: unknocked[0]! };
  // Out of clues: a guess (fair floors never get here).
  if (floor.shuffle && !run.play.shuffled) return { type: "flicker" };
  return { type: "choose", choice: left[0] ?? 1 };
}
