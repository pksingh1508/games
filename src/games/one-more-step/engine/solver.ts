// The level solver (Plan/01-one-more-step.md §12 "Solver"): a breadth-first search over the real rules,
// from the level's start, trying every action in a fixed order. The first win it reaches is a shortest
// solution, and its length is the level's optimal step count (par is a little more). Solutions are written
// one letter per action (U R D L, and "." to wait), so they're easy to store and to replay in tests.
import { initialState } from "./course";
import { step, stateKey } from "./rules";
import type { Action, Course, State } from "./types";

export const ACTIONS: ReadonlyArray<{ letter: string; action: Action }> = [
  { letter: "U", action: { type: "move", dir: "up" } },
  { letter: "R", action: { type: "move", dir: "right" } },
  { letter: "D", action: { type: "move", dir: "down" } },
  { letter: "L", action: { type: "move", dir: "left" } },
  { letter: ".", action: { type: "wait" } },
];

export const actionOf = (letter: string): Action => {
  const found = ACTIONS.find((a) => a.letter === letter);
  if (!found) throw new Error(`no action "${letter}"`);
  return found.action;
};

export interface Solution {
  /** One letter per action. */
  moves: string;
  steps: number;
  /** How many states it looked at (to keep levels small enough to prove). */
  states: number;
}

export function solve(c: Course, { maxStates = 1_500_000 }: { maxStates?: number } = {}): Solution | null {
  const start = initialState(c);
  const states: Array<State | null> = [start];
  const parent: number[] = [-1];
  const via: number[] = [-1];
  const seen = new Set<string>([stateKey(c, start)]);
  for (let head = 0; head < states.length; head++) {
    const s = states[head]!;
    // Expanded: only the path back is needed from here on.
    states[head] = null;
    for (let a = 0; a < ACTIONS.length; a++) {
      const { state } = step(c, s, ACTIONS[a]!.action);
      if (state.status === "won") {
        let moves = ACTIONS[a]!.letter;
        for (let i = head; parent[i]! >= 0; i = parent[i]!) moves = ACTIONS[via[i]!]!.letter + moves;
        return { moves, steps: moves.length, states: states.length };
      }
      if (state.status !== "play") continue;
      const key = stateKey(c, state);
      if (seen.has(key)) continue;
      seen.add(key);
      states.push(state);
      parent.push(head);
      via.push(a);
      if (states.length > maxStates) return null;
    }
  }
  return null;
}

/** Play a solution from the start; returns the state it ends in. */
export function replay(c: Course, moves: string): State {
  let s = initialState(c);
  for (const letter of moves) s = step(c, s, actionOf(letter)).state;
  return s;
}
