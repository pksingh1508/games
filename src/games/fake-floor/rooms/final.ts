// ★ The Floor (Plan/05-fake-floor.md §5): the floor itself is a creature, flipping tiles between
// real and fake in patterns. It breathes; a wave rolls along it; a checkerboard trades places.
// Every tell at once: grout, rain, lantern shadows, dust. And a shimmer before each flip.
import type { RoomSource } from "../core/room";
import { build } from "./build";

export const FINAL: RoomSource[] = [
  {
    id: "6-01",
    name: "The Floor",
    pebbles: 3,
    signs: ["The floor is awake.", "It's watching you. It always was."],
    flips: {
      // Breathing: all together, 1.7 s in, 0.8 s out.
      1: { period: 150, solid: 100, offset: 0 },
      // A wave rolling right, a little slower than you can walk.
      2: { period: 120, solid: 70, offset: 0, wave: -10 },
      // A checkerboard: neighbours swap every 0.75 s.
      3: { period: 90, solid: 45, offset: 0 },
      4: { period: 90, solid: 45, offset: 45 },
      // The last wave: narrower.
      5: { period: 100, solid: 56, offset: 0, wave: -10 },
    },
    map: build([
      "........L.........L...........L...........L...........L...........L...........L...........",
      "..........................................................................................",
      "..........................................................................................",
      "..........................................................................................",
      "..........................................................................................",
      ".S.s...............................##3434343434##f=i=mm=i=f.....................s.....D...",
      "#####11111111##=fi=m=##222222222222........................##5555555555555555#############",
    ]),
  },
];
