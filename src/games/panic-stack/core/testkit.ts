// Helpers for the tests (and the bot): a plain level to stack on, and running the simulation for a while.
import type { LevelDef } from "./level";
import type { Sim, SimEvent, TickInput } from "./sim";

export const TEST_LEVEL: LevelDef = {
  id: "test",
  name: "Test",
  location: "kitchen",
  time: 0,
  goal: 3,
  platform: 4,
  items: [],
  more: ["brick"],
  belt: 12,
  events: [],
  hint: "",
};

export const idle = (): TickInput => ({ aim: null, commands: [] });

/** Run `ticks` ticks with no input (or the input a function gives), collecting the events. */
export function run(sim: Sim, ticks: number, input: (t: number) => TickInput = idle): SimEvent[] {
  const out: SimEvent[] = [];
  for (let t = 0; t < ticks; t++) out.push(...sim.step(input(t)));
  return out;
}
