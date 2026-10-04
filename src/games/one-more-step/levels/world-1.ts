// World 1, Baby Steps: the shy door, crumbling floors, spikes. (Plan/01-one-more-step.md §5)
// Maps checked by the solver (levels/solutions.ts); see engine/types.ts for the legend.
import type { LevelDef } from "../engine/types";

export const WORLD_1: LevelDef[] = [
  {
    id: "1-1",
    world: 1,
    name: "One More Step",
    map: [
      "#########",
      "#P....E.#",
      "#########",
    ],
    narrator: [{ at: "start", text: "The exit is right there. Just walk." }, { at: "run", text: "…did the door just move?" }, { at: "cornered", text: "Nowhere to go. One more step!" }],
  },
  {
    id: "1-2",
    world: 1,
    name: "Round the Corner",
    map: [
      "########",
      "#P...E.#",
      "######.#",
      "######.#",
      "########",
    ],
    narrator: [{ at: "start", text: "It's only round the corner." }],
  },
  {
    id: "1-3",
    world: 1,
    name: "A Good Door",
    map: [
      "#######",
      "#.....#",
      "#P..E.#",
      "#.....#",
      "#######",
    ],
    door: "still",
    narrator: [{ at: "start", text: "This one's a good door. It stays." }],
  },
  {
    id: "1-4",
    world: 1,
    name: "Crumbs",
    map: [
      "##########",
      "#P~~~~~E.#",
      "##########",
    ],
    narrator: [{ at: "start", text: "Mind your step. The floor doesn't." }],
  },
  {
    id: "1-5",
    world: 1,
    name: "No Way Back",
    map: [
      "########",
      "#P~~~..#",
      "#.#~#..#",
      "#..~.E.#",
      "########",
    ],
    narrator: [{ at: "start", text: "No going back now." }],
  },
  {
    id: "1-6",
    world: 1,
    name: "Count the Dots",
    map: [
      "#########",
      "#P....xE#",
      "#########",
    ],
    door: "still",
    narrator: [{ at: "start", text: "Spikes. Count the dots." }],
  },
  {
    id: "1-7",
    world: 1,
    name: "Bad Timing",
    map: [
      "#########",
      "#P...EX.#",
      "#########",
    ],
    narrator: [{ at: "start", text: "Timing is everything." }],
  },
  {
    id: "1-8",
    world: 1,
    name: "All of It",
    map: [
      "#########",
      "#P.~~..x#",
      "#.#~##.##",
      "#...~E..#",
      "#########",
    ],
    narrator: [{ at: "start", text: "You know all of this now. Probably." }],
  },
];
