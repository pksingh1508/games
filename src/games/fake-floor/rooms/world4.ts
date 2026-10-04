// World 4: Hall of Mirrors (Plan/05-fake-floor.md §5). The betrayal world: mimic floors fake the old
// tells. A mimic under a lantern has a shadow, but it's painted on: it doesn't swing. A mimic in the
// rain splashes, but between the gusts, out of time with the rain you hear. Rooms 1–3 have nets.
import type { Env, RoomSource } from "../core/room";
import { build } from "./build";

/** The hall has a leaking glass roof in some rooms, chandeliers in others. */
const RAIN: Partial<Env> = { rain: "steady", lantern: false };
const BOTH: Partial<Env> = { rain: "steady", lantern: true };

export const WORLD_4: RoomSource[] = [
  {
    // Plan §5: a sign, then the first mimic, over a safety net.
    id: "4-01",
    name: "Betrayal",
    pebbles: 1,
    signs: ["Things are not what they seem... even the clues."],
    map: build(
      [
        "........L..........L..........",
        "..............................",
        "..............................",
        "..............................",
        ".S.s.......................D..",
        "####===f======##====m==#######",
      ],
      { nets: "all" },
    ),
  },
  {
    id: "4-02",
    name: "Off-Beat",
    pebbles: 1,
    env: RAIN,
    signs: ["Listen to the rain. Real splashes keep its time."],
    map: build([
      ".S.s.............................D..", //
      "####==f=====##===m===##=m==f=#######",
    ], { nets: "all" }),
  },
  {
    id: "4-03",
    name: "Still Life",
    pebbles: 1,
    map: build(
      [
        "........L.........L.........L.......L...",
        "........................................",
        "........................................",
        "........................................",
        ".S...................................D..",
        "####=m==f=m=##==mm==f=##=m=f==m=########",
      ],
      { nets: "all" },
    ),
  },
  {
    id: "4-04",
    name: "Reflections",
    pebbles: 2,
    env: RAIN,
    map: build([
      ".S......................o......................D..", //
      "####=m=f=ii=##f==m=mm=###ii=m=f=i##=mf==m=########",
    ]),
  },
  {
    // Up and down under three chandeliers. A pebble on a ledge you'd jump to from the top.
    id: "4-05",
    name: "Chandelier",
    pebbles: 2,
    map: build([
      "..........L.............L.............L...........",
      "...................h..............................",
      "...................%%.............................",
      "......................o...........................",
      "......................##m==f=m==..................",
      ".S..........##=mm==f==..........##.............D..",
      "####==m=f==m......................=f=mm==m########",
    ]),
  },
  {
    id: "4-06",
    name: "Smoke and Mirrors",
    pebbles: 2,
    env: { dust: true },
    map: build([
      "........L...........L...........L...........L.......",
      "....................................................",
      "....................................................",
      "....................................................",
      ".S...............................................D..",
      "####=ii=m=ii##m=ii=f=m###ii=mm=ii##=m=ii=f=#########",
    ]),
  },
  {
    // Rain and chandeliers: a mimic fakes both at once.
    id: "4-07",
    name: "Funhouse",
    pebbles: 2,
    env: BOTH,
    map: build([
      ".........L............L.............L............L......",
      "........................................................",
      "........................................................",
      "........................................................",
      ".S...................................................D..",
      "####=m=f=m=i=##mm==ff==###=m=ii=m=##f=mm=i=m=###########",
    ]),
  },
  {
    // The key, and back: floors that hold you once, among the mimics.
    id: "4-08",
    name: "Double Take",
    pebbles: 2,
    map: build([
      ".........L...........L.............L..........L.....",
      "....................................................",
      "....................................................",
      "....................................................",
      ".S.D.............................................k..",
      "#####=r=m==r=f=##m=r==m=r==####=rm=f==r=m###########",
    ]),
  },
  {
    // Mimics everywhere and two pebbles. A pebble hides behind you, on nothing.
    id: "4-09",
    name: "Trust Nothing",
    pebbles: 2,
    env: BOTH,
    map: build([
      "..L.......L.............L.............L...............",
      "......................................................",
      "......................................................",
      "......................................................",
      "........................##f=m=im=f....................",
      "h..S..........##=m==mm==..........##...............D..",
      "ii####m=mf=m==......................=mm=f==m##########",
    ]),
  },
  {
    id: "4-10",
    name: "Mirror, Mirror",
    pebbles: 3,
    env: BOTH,
    signs: ["Mirror, mirror, on the floor: which of you is real?", "Look closer. Then look again."],
    map: build([
      "..........L...........L...........L...........L...........L...........L.........",
      "................................................................................",
      "................................................................................",
      "...........................o....................................................",
      "...........................##=i=m=ff=m=.........................................",
      ".S.s...........##mm==f=cc=m............###c=m=ii=f=m##................s.....D...",
      "#####=m=f=c=m=i.......................................=m=f=mm=c=f=##############",
    ]),
  },
];
