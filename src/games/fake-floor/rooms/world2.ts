// World 2: Rainy Rooftops (Plan/05-fake-floor.md §5). Night rooftops in the rain. The tell: rain
// splashes on real floors, and fakes stay dry. Invisible floors arrive: the rain splashes on
// them too, so a wet patch of nothing is a floor. Rooms 1–3 have safety nets.
import type { RoomSource } from "../core/room";
import { build } from "./build";

export const WORLD_2: RoomSource[] = [
  {
    id: "2-01",
    name: "The Dry Tile",
    pebbles: 0,
    signs: ["In the rain, every real floor splashes. Find the dry one."],
    map: build([
      ".S.s.......................D..", //
      "####=====f=====##=======######",
    ], { nets: "all" }),
  },
  {
    id: "2-02",
    name: "Puddle Jumping",
    pebbles: 1,
    map: build([
      ".S....................................D.", //
      "####==f===ff==##==f==f==##=f====##..####",
    ], { nets: "all" }),
  },
  {
    // Invisible floors (Plan §3): raindrops splash on "nothing".
    id: "2-03",
    name: "Splash Zone",
    pebbles: 1,
    signs: ["Rain splashes on everything real. Even things you can't see."],
    map: build([
      ".S..s................................D..", //
      "#####iiiiii####==iiii==####...##########",
    ], { nets: "all" }),
  },
  {
    // Plan §5: "a wide gap with no floor at all, but the rain is splashing on something". With holes in it.
    id: "2-04",
    name: "Bridge of Nothing",
    pebbles: 1,
    map: build([
      ".S....................o........................D..", //
      "######iiiii.iiii..iii####ii..iiii#################",
    ]),
  },
  {
    id: "2-05",
    name: "Skylights",
    pebbles: 2,
    map: build([
      ".S.............................................D..", //
      "####==ii=f==##ccfcc###=i=i=f=i=##ff==ii###########",
    ]),
  },
  {
    // Up a fire escape that isn't there. A pebble waits on a ledge you'd only see in the rain.
    id: "2-06",
    name: "Fire Escape",
    pebbles: 2,
    map: build([
      ".......................h.................D..",
      "......................ii..........i.########",
      "................................i...........",
      ".............i.####==f===f=####.............",
      "...........i................................",
      ".........i..................................",
      ".S.....i....................................",
      "######......................................",
    ]),
  },
  {
    id: "2-07",
    name: "Downpour",
    pebbles: 2,
    env: { rain: "heavy" },
    map: build([
      ".S.......................................................D..", //
      "####==f=iii=f==##c=cfcc###iiffii=##=f=c=f=c####i..i..i######",
    ]),
  },
  {
    // Light rain: fewer splashes, so you have to watch longer (or spend a pebble).
    id: "2-08",
    name: "Drizzle",
    pebbles: 3,
    env: { rain: "light" },
    map: build([
      ".S..............................o..............D..", //
      "####=f===i=f##ii=f=ii##f==ff==f###iii.iii#########",
    ]),
  },
  {
    // One big gap, and a path through it that zigzags. Trust the rain.
    id: "2-09",
    name: "Leap of Faith",
    pebbles: 2,
    map: build([
      "...........................h............................",
      "..........................ii............................",
      "........................................................",
      "...........................ii...........................",
      "............ii..........ii....i..........i..............",
      ".S.......ii....ii.....i.........iii...ii...i.........D..",
      "#####.ii..........iii...............i........iiiiii#####",
    ]),
  },
  {
    id: "2-10",
    name: "Storm",
    pebbles: 3,
    env: { rain: "heavy" },
    signs: ["Storm warning: everything is wet.", "Almost everything."],
    map: build([
      "..................o.............................................................",
      ".................###c=ccfcc##.....................###iiff==.....................",
      ".Ss........##ii=f............i..i..i.####=ff=ii=f=.........##............s...D..",
      "####==f=i==..................................................c=f=c=i=f=#########",
    ]),
  },
];
