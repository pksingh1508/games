// D:\ Control Panel (Plan/12-cursor-escape.md §5): the OS goes into your mouse settings. Left becomes
// right, up becomes down, the pointer speeds up and slows down, lags, drifts, grows, leaves a solid trail
// and gets moved "for your convenience". Every change is announced a second before, and again after.
import { seconds } from "../core/constants";
import type { Panel } from "../core/level";
import { cells, level, px, py } from "./dsl";
import { MAPS } from "./maps";

const s = seconds;
const FULL = cells(0, 0, 38, 21);
const box = (c: number, r: number) => ({ x: px(c) + 3, y: py(r) + 3, w: 10, h: 10 });

const ad = (id: string, c: number, r: number, w: number, h: number, vx: number, vy: number, bounds = FULL): Panel => ({
  id,
  rect: cells(c, r, w, h),
  title: "Tip of the day",
  look: "ad",
  closeable: true,
  motion: { kind: "bounce", vx, vy, bounds },
  text: ["Did you know?"],
});

export const D_DRIVE = [
  level({
    id: "D-01",
    name: "Mouse Properties",
    hint: "Touch a setting's checkbox and it changes (a second after it tells you).",
    map: MAPS["D-01"]!,
    checkboxes: [
      { rect: box(31, 18), label: "Swap left and right", effect: { type: "invert", axes: "x" }, ticks: s(7) },
      { rect: box(18, 13), label: "Extra speed", effect: { type: "sensitivity", multiplier: 2.5 }, ticks: s(6) },
      { rect: box(6, 8), label: "Smooth pointer", effect: { type: "lag", follow: 0.14 }, ticks: s(6) },
      { rect: box(26, 3), label: "Pointer trails", effect: { type: "solidTrail", trail: s(3) }, ticks: s(6) },
    ],
  }),
  level({
    id: "D-02",
    name: "Swap Buttons",
    hint: "Left and right swap. The arrow's drawn mirrored while they are.",
    map: MAPS["D-02"]!,
    sabotage: [{ at: s(1.5), ticks: s(13), effect: { type: "invert", axes: "x" } }],
  }),
  level({
    id: "D-03",
    name: "Upside Down",
    hint: "Up and down swap. Then the OS helps.",
    map: MAPS["D-03"]!,
    sabotage: [
      { at: s(1.5), ticks: s(9), effect: { type: "invert", axes: "y" } },
      { at: s(6.5), ticks: 0, effect: { type: "recentre" } },
    ],
  }),
  level({
    id: "D-04",
    name: "Pointer Speed",
    hint: "Two doorways, two speed settings: fastest, then slowest.",
    map: MAPS["D-04"]!,
    checkboxes: [
      { rect: box(4, 19), label: "", effect: { type: "sensitivity", multiplier: 2.6 }, ticks: s(7) },
      { rect: box(2, 4), label: "", effect: { type: "sensitivity", multiplier: 0.4 }, ticks: s(9) },
    ],
    panels: [ad("tip", 20, 0.6, 5, 2.2, -0.45, 0.25, cells(0, 0, 38, 4))],
  }),
  level({
    id: "D-05",
    name: "Precision",
    hint: "Crosshair corridors are half speed. Then the pointer starts to lag.",
    map: MAPS["D-05"]!,
    sabotage: [{ at: s(1.2), ticks: s(16), effect: { type: "lag", follow: 0.12 } }],
  }),
  level({
    id: "D-06",
    name: "Accessibility",
    hint: "Your cursor's about to get much bigger. Find room.",
    map: MAPS["D-06"]!,
    sabotage: [{ at: s(2), ticks: s(9), effect: { type: "largeCursor", scale: 3 } }],
  }),
  level({
    id: "D-07",
    name: "Pointer Trails",
    hint: "Your trail's solid. Don't cross your own path.",
    map: MAPS["D-07"]!,
    sabotage: [{ at: s(1.2), ticks: s(16), effect: { type: "solidTrail", trail: s(4) } }],
    panels: [ad("t1", 9.5, 4, 5, 3, 0, 0.6, cells(9, 0, 6, 21)), ad("t2", 25.5, 12, 5, 3, 0, -0.7, cells(25, 0, 6, 21))],
  }),
  level({
    id: "D-08",
    name: "Rotation",
    hint: "A quarter turn. Then a half. Then three quarters.",
    map: MAPS["D-08"]!,
    sabotage: [
      { at: s(1.2), ticks: s(6), effect: { type: "rotate", degrees: 90 } },
      { at: s(8.4), ticks: s(6), effect: { type: "rotate", degrees: 180 } },
      { at: s(15.6), ticks: s(6), effect: { type: "rotate", degrees: 270 } },
    ],
  }),
  level({
    id: "D-09",
    name: "Drift",
    hint: "The pointer drifts on its own. Restricted zones push you out.",
    map: MAPS["D-09"]!,
    sabotage: [{ at: s(1.2), ticks: s(16), effect: { type: "drift", vx: 0.45, vy: 0 } }],
  }),
  level({
    id: "D-10",
    name: "Control Freak",
    hint: "All the settings. Some of them twice.",
    map: MAPS["D-10"]!,
    sabotage: [
      { at: s(1.5), ticks: s(8), effect: { type: "invert", axes: "y" } },
      { at: s(10.5), ticks: s(7), effect: { type: "lag", follow: 0.15 } },
      { at: s(14), ticks: s(6), effect: { type: "solidTrail", trail: s(3) } },
    ],
    checkboxes: [
      { rect: box(21, 16), label: "Extra speed", effect: { type: "sensitivity", multiplier: 2.4 }, ticks: s(5) },
      { rect: box(9, 7), label: "Drift fix", effect: { type: "drift", vx: 0, vy: 0.4 }, ticks: s(5) },
    ],
  }),
];
