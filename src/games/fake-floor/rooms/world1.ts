// World 1: The Showroom (Plan/05-fake-floor.md §5). A clean, bright floor showroom over a dark
// basement. The tell: a fake tile's grout lines don't line up with its neighbours'. Teaches fake
// floors, crumbling floors and pebbles; rooms 1–3 have safety nets.
import type { RoomSource } from "../core/room";
import { build } from "./build";

export const WORLD_1: RoomSource[] = [
  {
    // The very first tile is fake (Plan §4, "Welcome Mat"): you fall in the first second, onto a net.
    id: "1-01",
    name: "Welcome Mat",
    pebbles: 0,
    signs: ["Welcome to the Showroom! Please try our floors."],
    map: build([
      ".Ss.........................D.", //
      "###f======##========##====####",
    ], { nets: "all" }),
  },
  {
    id: "1-02",
    name: "Grout Expectations",
    pebbles: 0,
    signs: ["See the lines between the tiles? On a fake tile, they don't line up."],
    map: build([
      ".Ss...................................D.", //
      "###====f====##===f=f===##==f=====#######",
    ], { nets: "all" }),
  },
  {
    // Plan §5: "a row of 5 identical tiles and 3 pebbles. Two are fake."
    id: "1-03",
    name: "Pebble Pusher",
    pebbles: 3,
    signs: ["Throw a pebble at a tile. Tok: it's real. Silence: it isn't."],
    map: build([
      ".S..s.......o...............D.", //
      "######=f==f####==f==##########",
    ], { nets: "all" }),
  },
  {
    id: "1-04",
    name: "Crumble Zone",
    pebbles: 1,
    signs: ["Cracked tiles hold you for a moment. Keep moving."],
    map: build([
      ".S.s..................................D.", //
      "####cccccc###cccccccccc##..cccc#########",
    ], { nets: "....nnnnnn" }),
  },
  {
    id: "1-05",
    name: "Showroom Floor",
    pebbles: 2,
    map: build([
      ".S.............................o................D.", //
      "####===f====##==ff===f##f=====###====f=#==f==#####",
    ]),
  },
  {
    // Up a staircase of bridges and back down. A hidden pebble waits on a ledge over a fake.
    id: "1-06",
    name: "Steps",
    pebbles: 2,
    map: build([
      "..........................h.....................",
      "..........................%%....................",
      "................................................",
      "......................##........................",
      "...............##==f=f..f=f==...................",
      ".S......##=f===..............##===f=##.......D..",
      "####==f=..............................=f==######",
    ]),
  },
  {
    id: "1-07",
    name: "Checkerboard",
    pebbles: 2,
    map: build([
      ".S.......................................D..", //
      "####=f=f=f=f=f##=f=f==f=f=##=ff=ff=f=#######",
    ]),
  },
  {
    id: "1-08",
    name: "Clearance Sale",
    pebbles: 2,
    signs: ["Everything must go!"],
    map: build([
      ".S.s...........................................D..", //
      "####ccfccfc###==cfc=c=##ccffccc###c=f=cc##########",
    ]),
  },
  {
    // One fake in sixty columns, right where you've stopped looking. A pebble hides in a hole at the start.
    id: "1-09",
    name: "Odd One Out",
    pebbles: 1,
    map: build(
      [
        "....S....................o...............................D..", //
        "#h#####========##========##========##========##====f===#####",
        ".%..........................................................",
      ],
      { floorRow: 12 },
    ),
  },
  {
    id: "1-10",
    name: "Grand Opening",
    pebbles: 3,
    signs: ["Grand opening! Every floor is real.*", "*Not every floor."],
    map: build([
      "..................................o.............................................",
      "...........................##==f==##cccc##......................................",
      ".Ss.................##f=c==...............===ff===##c=f=c=f=##............s..D..",
      "####==f==c==##=f=f=f..........................................==f====f==########",
    ]),
  },
];
