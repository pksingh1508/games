// A level (Plan/12-cursor-escape.md §5, §12): a DeskOS 98 window with a maze in it. Everything is in
// desktop pixels. Walls are rectangles; zones change the cursor's shape (and its rules); hazards move
// on their own clocks; smaller windows (pop-ups, dialogs, ads) sit inside it, solid except their own [X];
// and the OS's sabotage runs on a timeline (or goes off when you touch a checkbox), always announced.
import { CLIENT, CLOSE_BUTTON, MAX_BUTTON, MIN_BUTTON, SEPARATOR, TITLE } from "./constants";
import type { Rect, Vec } from "./geometry";

export type Drive = "C" | "D" | "E" | "F" | "X";

/** What the cursor looks like, and so how it moves. */
export type Mode = "arrow" | "ibeam" | "resizeH" | "resizeV" | "hand" | "busy" | "crosshair" | "forbidden" | "grab";
export type ZoneMode = "ibeam" | "resizeH" | "resizeV" | "busy" | "crosshair" | "forbidden";

export interface Zone {
  rect: Rect;
  mode: ZoneMode;
}

/** A hyperlink: the hand over it, and a pull toward it from `reach` px away (px a tick at its strongest). */
export interface Link {
  rect: Rect;
  text: string;
  reach: number;
  pull: number;
}

export type Effect =
  | { type: "invert"; axes: "x" | "y" | "xy" }
  | { type: "rotate"; degrees: 90 | 180 | 270 }
  /** The share of the gap to your hand the cursor closes each tick (smaller is laggier). */
  | { type: "lag"; follow: number }
  | { type: "sensitivity"; multiplier: number }
  /** px a tick. */
  | { type: "drift"; vx: number; vy: number }
  | { type: "fakeCursor"; dx: number; dy: number }
  | { type: "decoys"; count: number }
  | { type: "largeCursor"; scale: number }
  /** Your trail stays solid this many ticks. */
  | { type: "solidTrail"; trail: number }
  | { type: "recentre" };

export type EffectType = Effect["type"];

/** Sabotage on the clock: from `at` (ticks after you first move) for `ticks`. */
export interface Timed {
  at: number;
  ticks: number;
  effect: Effect;
}

/** A settings checkbox: touch it and its effect starts (announced first, like everything). */
export interface Checkbox {
  rect: Rect;
  label: string;
  effect: Effect;
  ticks: number;
}

export type Motion =
  /** Bounces around inside `bounds` (px a tick). */
  | { kind: "bounce"; vx: number; vy: number; bounds: Rect }
  /** Back and forth along a path (px a tick), or round it. */
  | { kind: "path"; points: Vec[]; speed: number; loop: boolean }
  /** Slides in from `from` (an offset) at `at`, stays `stay` ticks, slides back out; `slide` ticks each way. */
  | { kind: "slide"; from: Vec; at: number; stay: number; slide: number };

/** A window inside the level: solid, except its [X] (and its title bar, if you can drag it). */
export interface Panel {
  id: string;
  rect: Rect;
  title: string;
  /** How it looks: a plain window, a pop-up ad, a notification, a CAPTCHA. */
  look: "window" | "ad" | "toast" | "captcha";
  /** Has an [X] (top right) that closes it. */
  closeable: boolean;
  /** Opens on the clock (ticks after you first move); otherwise it's open from the start, unless an icon opens it. */
  opensAt?: number;
  byIcon?: boolean;
  /** Opens when this other panel is closed. */
  after?: string;
  /** Ads that must be closed oldest first (Too Many Tabs). */
  order?: number;
  draggable?: boolean;
  motion?: Motion;
  /** Lines of text inside (drawn; never solid on their own). */
  text?: string[];
}

export type Hazard =
  /** A loading spinner (circle) or a download bar (rect) that chases you after `delay` ticks. */
  | { kind: "chaser"; shape: "spinner" | "download"; at: Vec; r: number; w: number; h: number; speed: number; delay: number }
  /** The Recycle Bin: its core deletes you, and it pulls from `reach` px away (px a tick at its strongest). */
  | { kind: "bin"; at: Vec; core: number; reach: number; pull: number }
  /** A selection box: grows from a corner over `draw` ticks, and selects (deletes) whatever's inside; every `period`. */
  | { kind: "marquee"; rect: Rect; corner: "tl" | "tr" | "bl" | "br"; period: number; draw: number; offset: number }
  /** "Are you sure?": solid, except its two buttons, which swap when you come near. Click the right one to close it. */
  | { kind: "dialog"; rect: Rect; text: string; yes: Rect; no: Rect; answer: "yes" | "no" }
  /** The antivirus: a line sweeping across (axis "x": a vertical line moving right), safe only inside `safe`. */
  | { kind: "scan"; axis: "x" | "y"; from: number; to: number; speed: number; period: number; offset: number; safe: Rect[] }
  /** A desktop icon: touch it and it opens a window. */
  | { kind: "icon"; rect: Rect; label: string; opens: string }
  /** "I'm not a robot": a checkbox that hops away (through `spots`) when you come near; tick it to close its window. */
  | { kind: "robot"; spots: Rect[]; panel: string }
  /** Things to click (all of a group closes its window): "Click all the cursors". */
  | { kind: "target"; rect: Rect; panel: string; label: string };

export interface ExitButton {
  /** It shrinks as you come near (Fitts's law; its border pulses). */
  shrink?: boolean;
  /** It hops along the title bar when you come near, once to each of these (x positions). */
  hops?: number[];
  /** It won't close while these panels are still open (or yet to open). */
  after?: string[];
}

/** Sabotage set off by closing a panel (announced like everything else). */
export interface Trigger {
  closed: string;
  effect: Effect;
  ticks: number;
}

export interface LevelSource {
  id: string;
  drive: Drive;
  /** The window's title (and the level's name). */
  name: string;
  /** What it brings in (the level select). */
  hint: string;
  start: Vec;
  /** Where "For your convenience" recentres you (default: the start). */
  home?: Vec;
  /** Openings in the bar between the client area and the title bar: [x from, x to] (desktop px). */
  gaps: Array<[number, number]>;
  walls: Rect[];
  zones?: Zone[];
  links?: Link[];
  panels?: Panel[];
  hazards?: Hazard[];
  sabotage?: Timed[];
  checkboxes?: Checkbox[];
  exit?: ExitButton;
  /** Medal times (ticks). */
  medals: { gold: number; silver: number; bronze: number };
  triggers?: Trigger[];
  /** The Uninstaller: its progress bar fills (% a second) and you're uninstalled at 100%; each panel you close takes `drop` % off. */
  boss?: { fill: number; drop: number };
}

/** The window's own frame, the bar under the title bar (except its openings) and the [_] [□] buttons. */
export function frameWalls(gaps: ReadonlyArray<[number, number]>): Rect[] {
  const walls: Rect[] = [
    // Everything outside the window's open area.
    { x: -200, y: -200, w: TITLE.x + 200, h: 800 },
    { x: TITLE.x + TITLE.w, y: -200, w: 400, h: 800 },
    { x: -200, y: -200, w: 1040, h: TITLE.y + 200 },
    { x: -200, y: CLIENT.y + CLIENT.h, w: 1040, h: 400 },
    MIN_BUTTON,
    MAX_BUTTON,
  ];
  // The separator, with its openings.
  let x: number = CLIENT.x;
  for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) {
    if (a > x) walls.push({ x, y: SEPARATOR.y, w: a - x, h: SEPARATOR.h });
    x = Math.max(x, b);
  }
  if (x < CLIENT.x + CLIENT.w) walls.push({ x, y: SEPARATOR.y, w: CLIENT.x + CLIENT.w - x, h: SEPARATOR.h });
  return walls;
}

export const EXIT_RECT: Rect = CLOSE_BUTTON;

/** A panel's title strip is this tall (its [X] in a notch at the right-hand end). */
export const BAR_H = 13;
export const NOTCH_W = 14;

/** A panel's [X]: a notch in its top right corner, open to the outside (reach the corner and click). */
export function panelClose(p: Rect): Rect {
  return { x: p.x + p.w - NOTCH_W, y: p.y, w: NOTCH_W, h: BAR_H };
}

/** A panel's title strip, less its [X] (where you grab a window you can drag). */
export function panelBar(p: Rect): Rect {
  return { x: p.x, y: p.y, w: p.w - NOTCH_W, h: BAR_H };
}

/**
 * The solid parts of a panel at (x, y). A window is solid all over, but for the notch its [X] sits in
 * (so it can block a corridor, and still be closed from outside), and for its title strip if you can
 * drag it (that's where you grab it). A notification is solid all over.
 */
export function panelSolids(p: Panel, x: number, y: number): Rect[] {
  const { w, h } = p.rect;
  if (p.draggable) return [{ x, y: y + BAR_H, w, h: h - BAR_H }];
  if (!p.closeable) return [{ x, y, w, h }];
  return [
    { x, y, w: w - NOTCH_W, h: BAR_H },
    { x, y: y + BAR_H, w, h: h - BAR_H },
  ];
}
