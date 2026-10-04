// F:\ System32 (Plan/12-cursor-escape.md §5): the OS stops pretending. It hides you behind a fake cursor
// (the real one's tip glows, and sparks near walls), surrounds you with decoys (only yours moves exactly
// with your hand), freezes you, scans for you (hide in the safe folders), selects you, and pulls you
// into the Recycle Bin.
import { seconds } from "../core/constants";
import type { Hazard } from "../core/level";
import { at, cells, level } from "./dsl";
import { MAPS } from "./maps";

const s = seconds;

/** The antivirus: a line sweeping right across the window every `period`, first sweep starting at `first`. */
const scan = (axis: "x" | "y", speed: number, period: number, first: number): Hazard => ({
  kind: "scan",
  axis,
  from: axis === "x" ? 16 : 32,
  to: axis === "x" ? 624 : 368,
  speed,
  period,
  // The first warm-up starts at `first` (until then it's resting).
  offset: period - first,
  safe: [],
});

const spinner = (c: number, r: number, speed: number, delay: number): Hazard => ({ kind: "chaser", shape: "spinner", at: at(c, r), r: 9, w: 0, h: 0, speed, delay });

export const F_DRIVE = [
  level({
    id: "F-01",
    name: "Who's There?",
    hint: "The cursor you can see isn't you. Yours is invisible: its tip glows, and it sparks near walls.",
    map: MAPS["F-01"]!,
    sabotage: [{ at: s(1.2), ticks: s(16), effect: { type: "fakeCursor", dx: 24, dy: 18 } }],
  }),
  level({
    id: "F-02",
    name: "Double Click",
    hint: "Two more of you. Only one cursor moves exactly with your hand.",
    map: MAPS["F-02"]!,
    sabotage: [{ at: s(1.2), ticks: s(14), effect: { type: "decoys", count: 2 } }],
  }),
  level({
    id: "F-03",
    name: "Hall of Mirrors",
    hint: "Four copies of you, mirrored and turned. Wiggle: yours is the one that wiggles right.",
    map: MAPS["F-03"]!,
    sabotage: [{ at: s(1.2), ticks: s(16), effect: { type: "decoys", count: 4 } }],
  }),
  level({
    id: "F-04",
    name: "Not Responding",
    hint: "Loading zones freeze you; spinners don't wait; the selection box deletes whatever's inside when it closes.",
    map: MAPS["F-04"]!,
    hazards: [
      spinner(20, 3, 0.45, 120),
      spinner(34, 18, 0.5, 300),
      { kind: "marquee", rect: cells(16, 9, 9, 4), corner: "tl", period: s(4), draw: s(1.6), offset: 0 },
    ],
  }),
  level({
    id: "F-05",
    name: "Antivirus",
    hint: "The scan deletes anything that isn't in a safe folder. Hide as it passes.",
    map: MAPS["F-05"]!,
    hazards: [scan("x", 2.6, s(5.5), s(2))],
  }),
  level({
    id: "F-06",
    name: "Quarantine",
    hint: "Scans both ways now. And selection boxes.",
    map: MAPS["F-06"]!,
    hazards: [scan("x", 2.4, s(7), s(2)), scan("y", 1.6, s(7), s(5.5)), { kind: "marquee", rect: cells(20, 15, 8, 5), corner: "br", period: s(5), draw: s(1.8), offset: s(1) }],
  }),
  level({
    id: "F-07",
    name: "Ghost in the Shell",
    hint: "Invisible, and leaving a solid trail.",
    map: MAPS["F-07"]!,
    sabotage: [
      { at: s(1.2), ticks: s(15), effect: { type: "fakeCursor", dx: -26, dy: 14 } },
      { at: s(1.5), ticks: s(14), effect: { type: "solidTrail", trail: s(3) } },
    ],
  }),
  level({
    id: "F-08",
    name: "Registry Editor",
    hint: "The Recycle Bin pulls. The decoys copy you. Left is right.",
    map: MAPS["F-08"]!,
    hazards: [{ kind: "bin", at: at(19, 11), core: 11, reach: 90, pull: 1 }],
    sabotage: [
      { at: s(1.2), ticks: s(10), effect: { type: "decoys", count: 3 } },
      { at: s(6), ticks: s(9), effect: { type: "invert", axes: "x" } },
    ],
  }),
  level({
    id: "F-09",
    name: "Which One?",
    hint: "Four cursors, a narrow path, and one of them is you.",
    map: MAPS["F-09"]!,
    sabotage: [{ at: s(1.2), ticks: s(30), effect: { type: "decoys", count: 3 } }],
  }),
  level({
    id: "F-10",
    name: "Kernel",
    hint: "The scan, the decoys, the bin, and everything inside out.",
    map: MAPS["F-10"]!,
    hazards: [scan("x", 2.4, s(6.5), s(2.5)), { kind: "bin", at: at(26, 4), core: 10, reach: 80, pull: 0.9 }],
    sabotage: [
      { at: s(1.2), ticks: s(8), effect: { type: "decoys", count: 3 } },
      { at: s(9.5), ticks: s(8), effect: { type: "invert", axes: "xy" } },
    ],
  }),
];
