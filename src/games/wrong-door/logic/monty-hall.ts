// The Lucky Floor (Plan/13-wrong-door.md §12 "Monty Hall: must follow the real rules"): three doors, no
// clues. You pick one; Mr. Hinges *always* opens a wrong door you didn't pick, and *always* offers to let
// you switch. Only then does switching win two times out of three.
import type { Rng } from "@/engine/rng";
import type { DoorId } from "./types";

/** The wrong door he opens: never yours, never the way up. When you picked the way up, either of the
 * other two (by `rng`). */
export function hostOpens(picked: DoorId, exit: DoorId, rng: Rng, doors = 3): DoorId {
  const options = Array.from({ length: doors }, (_, k) => k + 1).filter((d) => d !== picked && d !== exit);
  return options[Math.floor(rng() * options.length)]!;
}

/** The door you'd end on by switching: the one that's neither yours nor open. */
export function switchTo(picked: DoorId, opened: DoorId, doors = 3): DoorId {
  return Array.from({ length: doors }, (_, k) => k + 1).find((d) => d !== picked && d !== opened)!;
}

/** Play `rounds` Lucky Floors, always switching (or never): the share won. */
export function simulate(rounds: number, switching: boolean, rng: Rng): number {
  let wins = 0;
  for (let i = 0; i < rounds; i++) {
    const exit = 1 + Math.floor(rng() * 3);
    const picked = 1 + Math.floor(rng() * 3);
    const opened = hostOpens(picked, exit, rng);
    const final = switching ? switchTo(picked, opened) : picked;
    if (final === exit) wins++;
  }
  return wins / rounds;
}
