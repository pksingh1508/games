// E:\ Internet (Plan/12-cursor-escape.md §5): pop-up ads (close them at their top-right corner), links
// that pull, download bars that chase you, notifications sliding in across your way, dialogs whose
// buttons swap, a CAPTCHA, and an [X] that won't stay put.
import { seconds } from "../core/constants";
import type { Hazard, Panel } from "../core/level";
import { at, cells, level, px, py } from "./dsl";
import { MAPS } from "./maps";

const s = seconds;

const ad = (id: string, c: number, r: number, w: number, h: number, motion?: Panel["motion"], extra: Partial<Panel> = {}): Panel => ({
  id,
  rect: cells(c, r, w, h),
  title: "!!! WINNER !!!",
  look: "ad",
  closeable: true,
  motion,
  ...extra,
});

const bounce = (vx: number, vy: number, c: number, r: number, w: number, h: number): Panel["motion"] => ({ kind: "bounce", vx, vy, bounds: cells(c, r, w, h) });

/** A notification that slides in (from the right) across the way, stays, and goes. */
const toast = (id: string, c: number, r: number, w: number, h: number, when: number, stay: number, text: string[]): Panel => ({
  id,
  rect: cells(c, r, w, h),
  title: "New notification",
  look: "toast",
  closeable: false,
  motion: { kind: "slide", from: { x: 0, y: -h * 16 - 8 }, at: when, stay, slide: s(0.5) },
  text,
});

/** "Are you sure?" across a corridor you're climbing: its buttons face down, at you. */
function dialog(c: number, r: number, w: number, text: string, answer: "yes" | "no"): Hazard {
  const rect = cells(c, r, w, 3);
  const bw = Math.min(30, (rect.w - 12) / 2);
  return {
    kind: "dialog",
    rect,
    text,
    yes: { x: rect.x + 4, y: rect.y + rect.h - 14, w: bw, h: 14 },
    no: { x: rect.x + rect.w - 4 - bw, y: rect.y + rect.h - 14, w: bw, h: 14 },
    answer,
  };
}

const download = (c: number, r: number, speed: number, delay: number): Hazard => ({ kind: "chaser", shape: "download", at: at(c, r), r: 0, w: 46, h: 10, speed, delay });

export const E_DRIVE = [
  level({
    id: "E-01",
    name: "Homepage",
    hint: "Links pull. On the internet, everything's a link.",
    map: MAPS["E-01"]!,
    links: [
      { rect: cells(9, 18, 3, 1), text: "Home", reach: 72, pull: 0.9 },
      { rect: cells(26, 16.5, 3, 1), text: "News", reach: 72, pull: 0.9 },
      { rect: cells(14, 11, 3, 1), text: "Sports", reach: 72, pull: 0.9 },
      { rect: cells(24, 10, 3, 1), text: "Weather", reach: 72, pull: 0.9 },
      { rect: cells(22, 2, 3, 1), text: "Shop", reach: 72, pull: 0.9 },
      { rect: cells(30, 4.5, 3, 1), text: "Log in", reach: 72, pull: 0.9 },
    ],
  }),
  level({
    id: "E-02",
    name: "Pop-up Blocker (Off)",
    hint: "Pop-ups across the way. Close them at their top-right corner.",
    map: MAPS["E-02"]!,
    panels: [
      ad("b1", 24, 9, 4, 4),
      ad("b2", 17, 9, 4, 4),
      ad("b3", 10, 9, 4, 4),
      ad("f1", 10, 16.5, 5, 2.5, bounce(0.8, 0, 1, 16, 34, 4)),
      ad("f2", 26, 2.5, 5, 2.5, bounce(-0.9, 0, 8, 2, 30, 4)),
    ],
  }),
  level({
    id: "E-03",
    name: "Download Speed",
    hint: "Downloads chase you. They're slower than you are. Mostly.",
    map: MAPS["E-03"]!,
    hazards: [download(16, 9, 0.6, 30), download(30, 18, 0.65, 160), download(24, 2, 0.7, 320)],
  }),
  level({
    id: "E-04",
    name: "Cookie Banner",
    hint: "Notifications slide in across the way. And the dialog wants your cookies: say no.",
    map: MAPS["E-04"]!,
    panels: [
      toast("n1", 18, 15, 5, 5, s(1.6), s(2.2), ["Your files are", "worried."]),
      toast("n2", 27, 15, 5, 5, s(4.4), s(2.2), ["Update now?"]),
      toast("n3", 16, 6, 5, 4, s(7.5), s(2.5), ["Free trial!"]),
      toast("n4", 22, 1, 5, 3, s(11), s(2.5), ["Rate us!"]),
    ],
    hazards: [dialog(33, 9, 4, "Accept cookies?", "no")],
  }),
  level({
    id: "E-05",
    name: "Are You Sure?",
    hint: "The buttons swap when you come near (they shiver first).",
    map: MAPS["E-05"]!,
    hazards: [dialog(30, 8, 7, "Delete the cursor?", "no"), dialog(1, 1, 6, "Keep the cursor?", "yes")],
  }),
  level({
    id: "E-06",
    name: "Captcha",
    hint: "Prove you're not a robot: tick the box (it runs), and click every cursor.",
    map: MAPS["E-06"]!,
    panels: [{ id: "gate", rect: cells(32, 0, 4, 4), title: "Verify", look: "captcha", closeable: false, text: ["Are you", "human?"] }],
    hazards: [
      { kind: "robot", spots: [cells(14, 9, 0.7, 0.7), cells(20, 7, 0.7, 0.7), cells(6, 10, 0.7, 0.7)], panel: "gate" },
      { kind: "target", rect: { x: px(16) + 2, y: py(18) + 2, w: 12, h: 12 }, panel: "gate", label: "cursor" },
      { kind: "target", rect: { x: px(27) + 2, y: py(8) + 2, w: 12, h: 12 }, panel: "gate", label: "cursor" },
      { kind: "target", rect: { x: px(18) + 2, y: py(1) + 2, w: 12, h: 12 }, panel: "gate", label: "cursor" },
    ],
  }),
  level({
    id: "E-07",
    name: "Too Many Tabs",
    hint: "The [X] won't close while tabs are open. Close them oldest first (#1 to #5).",
    map: MAPS["E-07"]!,
    links: [
      { rect: cells(16, 10, 3, 1), text: "open in new tab", reach: 80, pull: 0.85 },
      { rect: cells(28, 14, 3, 1), text: "more tabs", reach: 80, pull: 0.85 },
    ],
    panels: [
      ad("t1", 26, 15, 4, 3, undefined, { order: 1, title: "Tab 1" }),
      ad("t2", 13, 2, 4, 3, undefined, { order: 2, title: "Tab 2" }),
      ad("t3", 2, 15, 4, 3, undefined, { order: 3, title: "Tab 3" }),
      ad("t4", 14, 15, 4, 3, undefined, { order: 4, title: "Tab 4" }),
      ad("t5", 25, 1, 4, 3, undefined, { order: 5, title: "Tab 5" }),
    ],
    exit: { after: ["t1", "t2", "t3", "t4", "t5"] },
  }),
  level({
    id: "E-08",
    name: "Buffering",
    hint: "Loading zones freeze you. The spinners don't wait for you.",
    map: MAPS["E-08"]!,
    hazards: [
      { kind: "chaser", shape: "spinner", at: at(20, 9), r: 9, w: 0, h: 0, speed: 0.5, delay: 90 },
      { kind: "chaser", shape: "spinner", at: at(34, 3), r: 9, w: 0, h: 0, speed: 0.45, delay: 300 },
    ],
  }),
  level({
    id: "E-09",
    name: "404",
    hint: "The [X]'s not where it should be. Well, it was a second ago.",
    map: MAPS["E-09"]!,
    exit: { hops: [px(18) - 4, px(5) - 4] },
  }),
  level({
    id: "E-10",
    name: "Dark Web",
    hint: "All of the internet at once.",
    map: MAPS["E-10"]!,
    links: [{ rect: cells(14, 17.5, 3, 1), text: "unsubscribe", reach: 74, pull: 0.9 }],
    panels: [
      toast("n1", 15, 8, 5, 4, s(5), s(2.5), ["You have (3)", "new viruses"]),
      ad("f1", 20, 1.5, 5, 2.5, bounce(-0.9, 0, 8, 1, 30, 4)),
    ],
    hazards: [download(24, 18, 0.6, 100), dialog(30, 10, 7, "Install toolbar?", "no")],
  }),
];
