// C:\ Desktop (Plan/12-cursor-escape.md §5): the basics. Walls, pop-ups, icons that open more pop-ups,
// and the first shapes with rules of their own: the I-beam over text, the hand over links, the resize
// arrows at window edges, the hourglass.
import type { Panel } from "../core/level";
import { at, cells, level, px, py } from "./dsl";
import { MAPS } from "./maps";

const FULL = cells(0, 0, 38, 21);

/** A pop-up ad, bouncing round `bounds`. */
const ad = (id: string, c: number, r: number, w: number, h: number, vx: number, vy: number, bounds = FULL, extra: Partial<Panel> = {}): Panel => ({
  id,
  rect: cells(c, r, w, h),
  title: "YOU WON!!!",
  look: "ad",
  closeable: true,
  motion: { kind: "bounce", vx, vy, bounds },
  ...extra,
});

/** A pop-up going up and down a channel (or back and forth). */
const patrol = (id: string, c: number, r0: number, r1: number, w: number, h: number, speed: number): Panel => ({
  id,
  rect: cells(c, r0, w, h),
  title: "Buy now!",
  look: "ad",
  closeable: false,
  motion: { kind: "path", points: [{ x: px(c), y: py(r0) }, { x: px(c), y: py(r1) }], speed, loop: false },
});

export const C_DRIVE = [
  level({
    id: "C-01",
    name: "My First Window",
    hint: "Reach the [X] (top right) and click it. Only the tip of the cursor touches things.",
    map: MAPS["C-01"]!,
    panels: [ad("ad", 15.5, 6, 6, 3, 0, 0.5, cells(14, 0, 10, 21))],
  }),
  level({
    id: "C-02",
    name: "Narrow Escape",
    hint: "Tight corridors. The clock is only for medals: take your time.",
    map: MAPS["C-02"]!,
  }),
  level({
    id: "C-03",
    name: "Shortcuts",
    hint: "Desktop icons open pop-ups when you touch them. The short way's lined with them.",
    map: MAPS["C-03"]!,
    hazards: [
      { kind: "icon", rect: { x: px(8), y: py(0) + 8, w: 18, h: 18 }, label: "Games", opens: "i1" },
      { kind: "icon", rect: { x: px(11), y: py(3) - 2, w: 18, h: 18 }, label: "Deals", opens: "i2" },
      { kind: "icon", rect: { x: px(14), y: py(0) + 8, w: 18, h: 18 }, label: "Music", opens: "i3" },
      { kind: "icon", rect: { x: px(17), y: py(3) - 2, w: 18, h: 18 }, label: "Prizes", opens: "i4" },
      { kind: "icon", rect: { x: px(20), y: py(0) + 8, w: 18, h: 18 }, label: "Chat", opens: "i5" },
      { kind: "icon", rect: { x: px(23), y: py(3) - 2, w: 18, h: 18 }, label: "Free", opens: "i6" },
      { kind: "icon", rect: { x: px(26), y: py(0) + 8, w: 18, h: 18 }, label: "News", opens: "i7" },
    ],
    panels: [
      ad("i1", 30, 0.5, 4, 2.5, -0.9, 0, cells(0, 0, 38, 5), { byIcon: true }),
      ad("i2", 1, 2, 4, 2.5, 1, 0, cells(0, 0, 38, 5), { byIcon: true }),
      ad("i3", 30, 2, 4, 2.5, -1.2, 0, cells(0, 0, 38, 5), { byIcon: true }),
      ad("i4", 2, 16.5, 5, 3, 1.1, 0, cells(0, 16, 38, 5), { byIcon: true }),
      ad("i5", 33.5, 6, 4, 3, 0, 1, cells(33, 0, 5, 21), { byIcon: true }),
      ad("i6", 30, 17, 5, 3, -1.3, 0, cells(0, 16, 38, 5), { byIcon: true }),
      ad("i7", 0.5, 8, 4, 3, 0, 1.2, cells(0, 0, 5, 21), { byIcon: true }),
    ],
  }),
  level({
    id: "C-04",
    name: "Pop-up Party",
    hint: "Five pop-ups, one room. (Their [X]s work, if you can catch one.)",
    map: MAPS["C-04"]!,
    panels: [
      ad("a1", 6, 8, 5, 3, 0.7, 0.45),
      ad("a2", 18, 14, 6, 3, -0.6, 0.5),
      ad("a3", 24, 2, 5, 3, 0.5, 0.65),
      ad("a4", 10, 16.5, 5, 3, 0.8, -0.3),
      ad("a5", 29, 6, 4, 3, -0.5, -0.6),
    ],
  }),
  level({
    id: "C-05",
    name: "Read Me",
    hint: "Over text you're an I-beam: thin enough for a narrow upright slot, too tall for a low one.",
    map: MAPS["C-05"]!,
  }),
  level({
    id: "C-06",
    name: "Click Here",
    hint: "Links pull you in. These ones are behind the walls.",
    map: MAPS["C-06"]!,
    links: [
      { rect: cells(10, 14, 4, 1), text: "click here", reach: 76, pull: 0.85 },
      { rect: cells(21, 14, 4, 1), text: "free stuff", reach: 76, pull: 0.85 },
      { rect: cells(13, 6, 4, 1), text: "win a prize", reach: 76, pull: 0.85 },
      { rect: cells(25, 6, 4, 1), text: "read more", reach: 76, pull: 0.85 },
    ],
  }),
  level({
    id: "C-07",
    name: "Window Manager",
    hint: "On a window's edge you can only go one way. Grab a window by its title bar to drag it; click to let go.",
    map: MAPS["C-07"]!,
    panels: [{ id: "notepad", rect: cells(29, 15, 5, 4), title: "Notepad", look: "window", closeable: false, draggable: true, text: ["Drag me by", "my title bar."] }],
  }),
  level({
    id: "C-08",
    name: "Loading…",
    hint: "The hourglass freezes you for a moment. Everything else keeps moving.",
    map: MAPS["C-08"]!,
    panels: [patrol("h1", 9, 0, 18.5, 4, 2.5, 0.8), patrol("h2", 19, 18.5, 0, 4, 2.5, 0.9), patrol("h3", 29, 0, 18.5, 4, 2.5, 1)],
  }),
  level({
    id: "C-09",
    name: "Spin Cycle",
    hint: "Spinners chase you, straight through the walls. Keep moving.",
    map: MAPS["C-09"]!,
    hazards: [
      { kind: "chaser", shape: "spinner", at: at(16, 3), r: 9, w: 0, h: 0, speed: 0.55, delay: 60 },
      { kind: "chaser", shape: "spinner", at: at(30, 17), r: 9, w: 0, h: 0, speed: 0.6, delay: 220 },
      { kind: "chaser", shape: "spinner", at: at(23, 10), r: 9, w: 0, h: 0, speed: 0.5, delay: 420 },
    ],
  }),
  level({
    id: "C-10",
    name: "My Computer",
    hint: "Everything so far. And the [X] shrinks as you come near.",
    map: MAPS["C-10"]!,
    links: [{ rect: cells(24, 10, 4, 1), text: "my files", reach: 80, pull: 0.8 }],
    panels: [ad("ad", 20, 1, 5, 3, 0.9, 0.3, cells(10, 0, 26, 6))],
    hazards: [{ kind: "chaser", shape: "spinner", at: at(33, 18), r: 9, w: 0, h: 0, speed: 0.55, delay: 240 }],
    exit: { shrink: true },
  }),
];
