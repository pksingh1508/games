// One level, simulated (Plan/12-cursor-escape.md §3, §12): 120 ticks a second, deterministic, pure (no
// DOM). Each tick takes your hand's movement and runs it through the pipeline: sabotage (invert,
// rotate, speed) → the cursor's shape (axis locks, half speed, freezes) → pulls and pushes (links,
// the Recycle Bin, restricted zones) → lag → a swept collision check along the whole move. Touch
// anything solid and you crash; click the [X] and you've escaped. The clock starts when you first move.
import {
  ASSIST_TIP_R,
  BUSY_TICKS,
  CLIENT,
  CLOSE_BUTTON,
  CROSSHAIR_SPEED,
  DIALOG_NEAR,
  DIALOG_SHIVER,
  FORBIDDEN_PUSH,
  HZ,
  IBEAM_HALF,
  TIP_R,
  TITLE,
  WARN_TICKS,
  seconds,
} from "./constants";
import { MISS, circleHitsRect, inRect, rectsOverlap, segmentSegment2, sweepCircle, sweepHalfBox, sweepRoundRect, type Rect, type Vec } from "./geometry";
import { frameWalls, panelBar, panelClose, panelSolids, type Checkbox, type Effect, type Hazard, type LevelSource, type Link, type Mode, type Panel, type Timed, type Trigger, type Zone } from "./level";
import { NO_RULES, rulesOf, soften, type Rules } from "./sabotage";

export interface Input {
  /** The hand's movement this tick (desktop px, before any sabotage). */
  dx: number;
  dy: number;
  click: boolean;
}

export const STILL: Input = { dx: 0, dy: 0, click: false };

export type CrashCause = "wall" | "window" | "toast" | "spinner" | "download" | "bin" | "marquee" | "dialog" | "scan" | "trail" | "uninstalled";

export type SimEvent =
  | { type: "start" }
  | { type: "mode"; mode: Mode }
  | { type: "freeze" }
  | { type: "warn"; effect: Effect; ticks: number }
  | { type: "begin"; effect: Effect }
  | { type: "end"; effect: Effect }
  | { type: "open"; panel: string }
  | { type: "close"; panel: string }
  | { type: "wrongOrder"; panel: string }
  | { type: "locked" }
  | { type: "grab" }
  | { type: "drop" }
  | { type: "swap" }
  | { type: "hop" }
  | { type: "check"; label: string }
  | { type: "click"; hit: boolean }
  | { type: "found" }
  | { type: "crash"; cause: CrashCause; x: number; y: number }
  | { type: "win" };

export interface WorldOptions {
  /** Gentler sabotage (comfort). */
  steady?: boolean;
  /** A forgiving hitbox: just the very tip (assist). */
  assist?: boolean;
}

/** A level, ready to play: the window's frame added to its walls, defaults filled in. */
export interface Course {
  src: LevelSource;
  walls: Rect[];
  zones: Zone[];
  links: Link[];
  panels: Panel[];
  hazards: Hazard[];
  checkboxes: Checkbox[];
  sabotage: Timed[];
  triggers: Trigger[];
  home: Vec;
  /** Dialogs' solid parts, by hazard index. */
  dialogSolids: Map<number, Rect[]>;
}

export function compile(src: LevelSource): Course {
  const hazards = src.hazards ?? [];
  const dialogSolids = new Map<number, Rect[]>();
  hazards.forEach((h, i) => {
    if (h.kind === "dialog") dialogSolids.set(i, dialogBody(h.rect, [h.yes, h.no]));
  });
  return {
    src,
    walls: [...frameWalls(src.gaps), ...src.walls],
    zones: src.zones ?? [],
    links: src.links ?? [],
    panels: src.panels ?? [],
    hazards,
    checkboxes: src.checkboxes ?? [],
    sabotage: [...(src.sabotage ?? [])].sort((a, b) => a.at - b.at),
    triggers: src.triggers ?? [],
    home: src.home ?? src.start,
    dialogSolids,
  };
}

/** A dialog is solid except its buttons (which sit along its bottom edge). */
function dialogBody(r: Rect, buttons: Rect[]): Rect[] {
  const top = Math.min(...buttons.map((b) => b.y));
  const out: Rect[] = [{ x: r.x, y: r.y, w: r.w, h: top - r.y }];
  let x = r.x;
  for (const b of [...buttons].sort((p, q) => p.x - q.x)) {
    if (b.x > x) out.push({ x, y: top, w: b.x - x, h: r.y + r.h - top });
    x = b.x + b.w;
  }
  if (x < r.x + r.w) out.push({ x, y: top, w: r.x + r.w - x, h: r.y + r.h - top });
  return out;
}

/** Windows open with a short zoom (and aren't solid until they've opened). */
export const OPEN_TICKS = seconds(0.4);
/** The scan line glows at its starting edge this long before it sweeps. */
export const SCAN_WARM = seconds(0.9);
/** Things that hop away (the robot checkbox, a runaway [X]) shiver this long first, when you come this close. */
export const HOP_SHIVER = seconds(0.3);
export const HOP_NEAR = 30;
/** Your newest bit of trail (this long, px) isn't solid yet. */
export const TRAIL_SAFE = 14;
/** Identity Crisis: this far, this quickly, after the decoys appear. */
export const FOUND_PX = 60;
export const FOUND_TICKS = seconds(1);

export interface PanelState {
  open: boolean;
  /** Opening (not solid yet): ticks left. */
  opening: number;
  /** Closed by you: it stays closed. */
  closed: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Along a path: px travelled, and which way. */
  s: number;
  dir: number;
}

interface HazardState {
  x: number;
  y: number;
  /** Dialogs, robots: done with (closed, ticked). Targets: clicked. Icons: used. */
  done: boolean;
  /** Dialogs: swapped. */
  flag: boolean;
  /** Shivering before a swap or a hop (ticks left). */
  shiver: number;
  /** Dialogs: ready to swap again (you went away). Robots: which spot. */
  n: number;
}

/** Decoys move with your hand, turned: mirrored, upside down, sideways. */
const DECOY_TURNS: Array<[number, number, number, number]> = [
  [-1, 0, 0, 1],
  [1, 0, 0, -1],
  [0, -1, 1, 0],
  [-1, 0, 0, -1],
  [0, 1, -1, 0],
];
const DECOY_SPOTS: Array<[number, number]> = [
  [30, 0],
  [-30, 0],
  [0, 26],
  [0, -26],
  [30, 26],
];

export class World {
  tick = 0;
  status: "ready" | "run" | "crashed" | "won" = "ready";
  x: number;
  y: number;
  /** Where your hand has the cursor going (ahead of it, under lag). */
  hx: number;
  hy: number;
  mode: Mode = "arrow";
  busy = 0;
  busyZone = -1;
  grab = -1;
  grabLock = false;
  panels: PanelState[];
  hz: HazardState[];
  /** The main [X]: which spot it has hopped to, and its shiver. */
  exitSpot = 0;
  exitShiver = 0;
  schedule: Timed[];
  checked: boolean[];
  /** x, y, tick of each point of a solid trail. */
  trail: number[] = [];
  /** x, y of each decoy. */
  decoys: number[] = [];
  rules: Rules = NO_RULES;
  crash: { x: number; y: number; cause: CrashCause } | null = null;
  /** The Uninstaller's progress (%). */
  uninstall = 0;
  /** Identity Crisis: px moved since the decoys appeared (−1: not watching). */
  foundDist = -1;
  foundUntil = 0;
  readonly events: SimEvent[] = [];

  constructor(
    readonly course: Course,
    readonly options: WorldOptions = {},
  ) {
    this.x = this.hx = course.src.start.x;
    this.y = this.hy = course.src.start.y;
    this.panels = course.panels.map((p) => ({
      open: p.motion?.kind !== "slide" && p.opensAt === undefined && !p.byIcon && p.after === undefined,
      opening: 0,
      closed: false,
      x: p.rect.x,
      y: p.rect.y,
      vx: p.motion?.kind === "bounce" ? p.motion.vx : 0,
      vy: p.motion?.kind === "bounce" ? p.motion.vy : 0,
      s: 0,
      dir: 1,
    }));
    this.hz = course.hazards.map((h) => ({ x: h.kind === "chaser" || h.kind === "bin" ? h.at.x : 0, y: h.kind === "chaser" || h.kind === "bin" ? h.at.y : 0, done: false, flag: false, shiver: 0, n: 0 }));
    this.schedule = course.sabotage.map((s) => ({ ...s }));
    this.checked = course.checkboxes.map(() => false);
    this.mode = this.modeAt(this.x, this.y);
  }

  clone(): World {
    const w = Object.create(World.prototype) as World;
    Object.assign(w, this);
    (w as { events: SimEvent[] }).events = [];
    w.panels = this.panels.map((p) => ({ ...p }));
    w.hz = this.hz.map((h) => ({ ...h }));
    w.schedule = this.schedule.slice();
    w.checked = this.checked.slice();
    w.trail = this.trail.slice();
    w.decoys = this.decoys.slice();
    return w;
  }

  // ---------------------------------------------------------------------------------------------
  // Where things are.

  /** The hitbox's size: the arrow's tip circle (bigger with a large cursor, smaller with the assist). */
  get radius(): number {
    return (this.options.assist ? ASSIST_TIP_R : TIP_R) * this.rules.scale;
  }

  /** The [X] you're trying to click, where it is now (it can hop, and shrink as you come near). */
  exitRect(): Rect {
    const src = this.course.src.exit;
    const x = this.exitSpot === 0 ? CLOSE_BUTTON.x : src!.hops![this.exitSpot - 1]!;
    const r = { x, y: CLOSE_BUTTON.y, w: CLOSE_BUTTON.w, h: CLOSE_BUTTON.h };
    if (src?.shrink) {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const d = Math.hypot(this.x - cx, this.y - cy);
      const k = 0.35 + 0.65 * Math.max(0, Math.min(1, (d - 10) / 90));
      return { x: cx - (r.w * k) / 2, y: cy - (r.h * k) / 2, w: r.w * k, h: r.h * k };
    }
    return r;
  }

  /** A panel's solid parts right now (none: not there, or still opening). */
  panelSolidAt(i: number): Rect[] {
    const s = this.panels[i]!;
    if (!s.open || s.opening > 0) return [];
    return panelSolids(this.course.panels[i]!, s.x, s.y);
  }

  panelRect(i: number): Rect {
    const p = this.course.panels[i]!;
    const s = this.panels[i]!;
    return { x: s.x, y: s.y, w: p.rect.w, h: p.rect.h };
  }

  /** The cursor's shape at a point. */
  modeAt(x: number, y: number): Mode {
    if (this.grab >= 0) return "grab";
    const course = this.course;
    for (let i = 0; i < course.panels.length; i++) {
      const p = course.panels[i]!;
      if (p.draggable && this.panels[i]!.open && !this.grabLock && inRect(x, y, panelBar(this.panelRect(i)))) return "grab";
    }
    for (const link of course.links) if (inRect(x, y, link.rect)) return "hand";
    for (const z of course.zones) if (inRect(x, y, z.rect)) return z.mode;
    return "arrow";
  }

  private zoneIndex(mode: Mode, x: number, y: number): number {
    const zones = this.course.zones;
    for (let i = 0; i < zones.length; i++) if (zones[i]!.mode === mode && inRect(x, y, zones[i]!.rect)) return i;
    return -1;
  }

  // ---------------------------------------------------------------------------------------------

  step(input: Input): SimEvent[] {
    const ev = this.events;
    ev.length = 0;
    if (this.status === "ready") {
      if (input.dx === 0 && input.dy === 0 && !input.click) return ev;
      this.status = "run";
      ev.push({ type: "start" });
    }
    if (this.status !== "run") return ev;
    const t = this.tick;
    this.timeline(t);
    this.moveThings(t);
    const boss = this.course.src.boss;
    if (boss) {
      this.uninstall += boss.fill / HZ;
      if (this.uninstall >= 100) {
        this.uninstall = 100;
        this.crashAt(this.x, this.y, "uninstalled");
        return ev;
      }
    }

    // The shape here, and what it does.
    const was = this.mode;
    let mode = this.modeAt(this.x, this.y);
    if (mode === "grab" && this.grab < 0) {
      this.grab = this.panels.findIndex((s, i) => this.course.panels[i]!.draggable && s.open && inRect(this.x, this.y, panelBar(this.panelRect(i))));
      ev.push({ type: "grab" });
    }
    if (mode === "busy") {
      const zone = this.zoneIndex("busy", this.x, this.y);
      if (zone !== this.busyZone) {
        this.busyZone = zone;
        this.busy = BUSY_TICKS;
        ev.push({ type: "freeze" });
      }
    } else this.busyZone = -1;
    if (this.busy > 0) mode = "busy";
    if (this.grabLock && !this.inAnyBar(this.x, this.y)) this.grabLock = false;
    this.mode = mode;
    if (mode !== was) ev.push({ type: "mode", mode });

    // The pipeline: hand → sabotage → shape → pulls → lag.
    const r = this.rules;
    const x0 = this.x;
    const y0 = this.y;
    if (r.follow >= 1) {
      this.hx = x0;
      this.hy = y0;
    }
    let nx = x0;
    let ny = y0;
    if (this.busy > 0) {
      this.busy--;
    } else {
      let mx = r.m[0] * input.dx + r.m[1] * input.dy + r.driftX;
      let my = r.m[2] * input.dx + r.m[3] * input.dy + r.driftY;
      const pull = this.pulls(x0, y0, mode);
      mx += pull.x;
      my += pull.y;
      if (mode === "crosshair") {
        mx *= CROSSHAIR_SPEED;
        my *= CROSSHAIR_SPEED;
      } else if (mode === "resizeH") my = 0;
      else if (mode === "resizeV") mx = 0;
      this.hx += mx;
      this.hy += my;
      nx = r.follow >= 1 ? this.hx : x0 + (this.hx - x0) * r.follow;
      ny = r.follow >= 1 ? this.hy : y0 + (this.hy - y0) * r.follow;
    }

    // A window you're dragging comes along (unless it bumps into something).
    if (this.grab >= 0 && (nx !== x0 || ny !== y0)) this.drag(nx - x0, ny - y0);

    // The swept check, along the whole move.
    if (this.collide(x0, y0, nx - x0, ny - y0, mode)) return ev;
    this.x = nx;
    this.y = ny;
    this.trailAndDecoys(t, x0, y0);
    if (this.foundDist >= 0) {
      this.foundDist += Math.hypot(nx - x0, ny - y0);
      if (this.foundDist >= FOUND_PX && t <= this.foundUntil) {
        ev.push({ type: "found" });
        this.foundDist = -1;
      } else if (t > this.foundUntil) this.foundDist = -1;
    }
    if (this.afterMove(t, x0, y0)) return ev;
    if (input.click) this.click(t);
    this.tick++;
    return ev;
  }

  // ---------------------------------------------------------------------------------------------

  /** The sabotage timeline: announcements a second ahead, then on, then off (each announced). */
  private timeline(t: number) {
    const ev = this.events;
    let changed = t === 0;
    for (const s of this.schedule) {
      if (t === s.at - WARN_TICKS) ev.push({ type: "warn", effect: s.effect, ticks: WARN_TICKS });
      if (t === s.at) {
        changed = true;
        ev.push({ type: "begin", effect: s.effect });
        if (s.effect.type === "recentre") {
          this.x = this.hx = this.course.home.x;
          this.y = this.hy = this.course.home.y;
          this.trail.length = 0;
        }
        if (s.effect.type === "decoys") {
          this.decoys.length = 0;
          for (let i = 0; i < s.effect.count; i++) {
            const [ox, oy] = DECOY_SPOTS[i % DECOY_SPOTS.length]!;
            this.decoys.push(clampX(this.x + ox), clampY(this.y + oy));
          }
          this.foundDist = 0;
          this.foundUntil = t + FOUND_TICKS;
        }
        if (s.effect.type === "solidTrail") this.trail.length = 0;
      }
      if (s.effect.type !== "recentre" && t === s.at + s.ticks) {
        changed = true;
        ev.push({ type: "end", effect: s.effect });
      }
    }
    if (!changed) return;
    const active: Effect[] = [];
    for (const s of this.schedule) if (s.effect.type !== "recentre" && s.at <= t && t < s.at + s.ticks) active.push(s.effect);
    this.rules = rulesOf(this.options.steady ? active.map(soften) : active);
    if (this.rules.decoys === 0) this.decoys.length = 0;
    if (this.rules.trail === 0) this.trail.length = 0;
  }

  /** Windows open (on the clock) and move; chasers chase; dialogs, robots and the [X] react to you coming near. */
  private moveThings(t: number) {
    const course = this.course;
    for (let i = 0; i < course.panels.length; i++) {
      const p = course.panels[i]!;
      const s = this.panels[i]!;
      if (s.closed) continue;
      if (p.opensAt !== undefined && t === p.opensAt && !s.open) {
        s.open = true;
        s.opening = OPEN_TICKS;
        this.events.push({ type: "open", panel: p.id });
      }
      if (s.opening > 0) s.opening--;
      const m = p.motion;
      if (!m || this.grab === i) continue;
      if (m.kind === "bounce") {
        if (!s.open) continue;
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < m.bounds.x || s.x + p.rect.w > m.bounds.x + m.bounds.w) {
          s.vx = -s.vx;
          s.x = Math.max(m.bounds.x, Math.min(m.bounds.x + m.bounds.w - p.rect.w, s.x));
        }
        if (s.y < m.bounds.y || s.y + p.rect.h > m.bounds.y + m.bounds.h) {
          s.vy = -s.vy;
          s.y = Math.max(m.bounds.y, Math.min(m.bounds.y + m.bounds.h - p.rect.h, s.y));
        }
      } else if (m.kind === "path") {
        if (!s.open) continue;
        const at = pathPoint(m.points, s.s, m.loop);
        s.x = at.x;
        s.y = at.y;
        s.s += m.speed;
      } else {
        const k = t - m.at;
        const wasOpen = s.open;
        if (k < 0 || k >= m.slide * 2 + m.stay) s.open = false;
        else {
          s.open = true;
          const f = k < m.slide ? 1 - k / m.slide : k < m.slide + m.stay ? 0 : (k - m.slide - m.stay) / m.slide;
          s.x = p.rect.x + m.from.x * f;
          s.y = p.rect.y + m.from.y * f;
        }
        if (s.open && !wasOpen) this.events.push({ type: "open", panel: p.id });
      }
    }
    for (let i = 0; i < course.hazards.length; i++) {
      const h = course.hazards[i]!;
      const s = this.hz[i]!;
      if (h.kind === "chaser") {
        if (t < h.delay) continue;
        const dx = this.x - s.x;
        const dy = this.y - s.y;
        const d = Math.hypot(dx, dy);
        if (d > h.speed) {
          s.x += (dx / d) * h.speed;
          s.y += (dy / d) * h.speed;
        }
      } else if (h.kind === "dialog" && !s.done) {
        const near = Math.min(rectDist(this.x, this.y, h.yes), rectDist(this.x, this.y, h.no));
        if (s.shiver > 0) {
          if (--s.shiver === 0) {
            s.flag = !s.flag;
            this.events.push({ type: "swap" });
          }
        } else if (s.n === 0 && near < DIALOG_NEAR) {
          s.shiver = DIALOG_SHIVER;
          s.n = 1;
        } else if (s.n === 1 && near > DIALOG_NEAR + 24) s.n = 0;
      } else if (h.kind === "robot" && !s.done) {
        if (s.shiver > 0) {
          if (--s.shiver === 0) {
            s.n++;
            this.events.push({ type: "hop" });
          }
        } else if (s.n < h.spots.length - 1 && rectDist(this.x, this.y, h.spots[s.n]!) < HOP_NEAR) s.shiver = HOP_SHIVER;
      }
    }
    const hops = course.src.exit?.hops;
    if (hops && this.exitSpot < hops.length) {
      if (this.exitShiver > 0) {
        if (--this.exitShiver === 0) {
          this.exitSpot++;
          this.events.push({ type: "hop" });
        }
      } else if (rectDist(this.x, this.y, this.exitRect()) < HOP_NEAR) this.exitShiver = HOP_SHIVER;
    }
  }

  /** Links pull you in; the Recycle Bin pulls you in; restricted zones push you out. */
  private pulls(x: number, y: number, mode: Mode): Vec {
    let px = 0;
    let py = 0;
    for (const link of this.course.links) {
      const cx = link.rect.x + link.rect.w / 2;
      const cy = link.rect.y + link.rect.h / 2;
      const d = rectDist(x, y, link.rect);
      if (d >= link.reach) continue;
      const k = link.pull * (1 - d / link.reach);
      const len = Math.hypot(cx - x, cy - y);
      if (len > 0.5) {
        px += ((cx - x) / len) * k;
        py += ((cy - y) / len) * k;
      }
    }
    for (let i = 0; i < this.course.hazards.length; i++) {
      const h = this.course.hazards[i]!;
      if (h.kind !== "bin") continue;
      const dx = h.at.x - x;
      const dy = h.at.y - y;
      const d = Math.hypot(dx, dy);
      if (d >= h.reach || d < 0.5) continue;
      const k = h.pull * (1 - d / h.reach);
      px += (dx / d) * k;
      py += (dy / d) * k;
    }
    if (mode === "forbidden") {
      const z = this.course.zones[this.zoneIndex("forbidden", x, y)];
      if (z) {
        const left = x - z.rect.x;
        const right = z.rect.x + z.rect.w - x;
        const up = y - z.rect.y;
        const down = z.rect.y + z.rect.h - y;
        const least = Math.min(left, right, up, down);
        if (least === left) px -= FORBIDDEN_PUSH;
        else if (least === right) px += FORBIDDEN_PUSH;
        else if (least === up) py -= FORBIDDEN_PUSH;
        else py += FORBIDDEN_PUSH;
      }
    }
    return { x: px, y: py };
  }

  private inAnyBar(x: number, y: number): boolean {
    for (let i = 0; i < this.course.panels.length; i++) if (this.course.panels[i]!.draggable && this.panels[i]!.open && inRect(x, y, panelBar(this.panelRect(i)))) return true;
    return false;
  }

  /** The window you're holding moves with you, unless that would push it into something: then you let go. */
  private drag(dx: number, dy: number) {
    const i = this.grab;
    const s = this.panels[i]!;
    const moved = panelSolids(this.course.panels[i]!, s.x + dx, s.y + dy);
    const blocked = moved.some(
      (m) =>
        this.course.walls.some((w) => rectsOverlap(w, m)) ||
        this.panels.some((_, j) => j !== i && this.panelSolidAt(j).some((other) => rectsOverlap(other, m))),
    );
    if (blocked) {
      this.grab = -1;
      this.grabLock = true;
      this.events.push({ type: "drop" });
      return;
    }
    s.x += dx;
    s.y += dy;
  }

  /** The swept check: crash at the first thing the hitbox touches along the move. True if it crashed. */
  private collide(x: number, y: number, dx: number, dy: number, mode: Mode): boolean {
    const ibeam = mode === "ibeam";
    const rad = this.radius;
    const hw = IBEAM_HALF.w * this.rules.scale;
    const hh = IBEAM_HALF.h * this.rules.scale;
    let best = MISS;
    let cause: CrashCause = "wall";
    const test = (r: Rect, c: CrashCause) => {
      const t = ibeam ? sweepHalfBox(x, y, dx, dy, hw, hh, r) : sweepRoundRect(x, y, dx, dy, rad, r);
      if (t < best) {
        best = t;
        cause = c;
      }
    };
    for (const w of this.course.walls) test(w, "wall");
    for (let i = 0; i < this.panels.length; i++) {
      if (i === this.grab) continue;
      const cause = this.course.panels[i]!.look === "toast" ? "toast" : "window";
      for (const solid of this.panelSolidAt(i)) test(solid, cause);
    }
    const hazards = this.course.hazards;
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i]!;
      const s = this.hz[i]!;
      if (h.kind === "dialog") {
        if (!s.done) for (const body of this.course.dialogSolids.get(i)!) test(body, "wall");
      } else if (h.kind === "chaser") {
        if (h.shape === "spinner") {
          const t = sweepCircle(x, y, dx, dy, s.x, s.y, h.r + (ibeam ? hw : rad));
          if (t < best) {
            best = t;
            cause = "spinner";
          }
        } else test({ x: s.x - h.w / 2, y: s.y - h.h / 2, w: h.w, h: h.h }, "download");
      } else if (h.kind === "bin") {
        const t = sweepCircle(x, y, dx, dy, h.at.x, h.at.y, h.core + (ibeam ? hw : rad));
        if (t < best) {
          best = t;
          cause = "bin";
        }
      }
    }
    // Your own trail.
    if (this.rules.trail > 0 && this.trail.length >= 6) {
      const tr = this.trail;
      let length = Math.hypot(x - tr[tr.length - 3]!, y - tr[tr.length - 2]!);
      for (let k = tr.length - 3; k >= 3; k -= 3) {
        const ax = tr[k]!;
        const ay = tr[k + 1]!;
        const bx = tr[k - 3]!;
        const by = tr[k - 2]!;
        length += Math.hypot(ax - bx, ay - by);
        if (length < TRAIL_SAFE) continue;
        if (segmentSegment2(x, y, x + dx, y + dy, ax, ay, bx, by) < rad * rad) {
          if (1 < best) {
            best = 1;
            cause = "trail";
          }
          break;
        }
      }
    }
    if (best === MISS) return false;
    const at = Math.min(1, best);
    return this.crashAt(x + dx * at, y + dy * at, cause);
  }

  private crashAt(x: number, y: number, cause: CrashCause): true {
    this.status = "crashed";
    this.crash = { x, y, cause };
    this.events.push({ type: "crash", cause, x, y });
    return true;
  }

  private trailAndDecoys(t: number, x0: number, y0: number) {
    const r = this.rules;
    if (r.trail > 0) {
      const tr = this.trail;
      const n = tr.length;
      if (n === 0 || Math.hypot(this.x - tr[n - 3]!, this.y - tr[n - 2]!) >= 1.5) tr.push(this.x, this.y, t);
      let drop = 0;
      while (drop < tr.length && tr[drop + 2]! < t - r.trail) drop += 3;
      if (drop) tr.splice(0, drop);
    }
    if (this.decoys.length) {
      const dx = this.x - x0;
      const dy = this.y - y0;
      for (let i = 0; i < this.decoys.length; i += 2) {
        const m = DECOY_TURNS[(i / 2) % DECOY_TURNS.length]!;
        this.decoys[i] = clampX(this.decoys[i]! + m[0] * dx + m[1] * dy);
        this.decoys[i + 1] = clampY(this.decoys[i + 1]! + m[2] * dx + m[3] * dy);
      }
    }
  }

  /** What happens because of where you are now: selection boxes, the scan line, icons, checkboxes. */
  private afterMove(t: number, x0: number, y0: number): boolean {
    const course = this.course;
    const rad = this.radius;
    for (let i = 0; i < course.hazards.length; i++) {
      const h = course.hazards[i]!;
      const s = this.hz[i]!;
      if (h.kind === "marquee") {
        const phase = (t + h.offset) % h.period;
        if (phase === h.draw - 1 && circleHitsRect(this.x, this.y, rad, h.rect)) return this.crashAt(this.x, this.y, "marquee");
      } else if (h.kind === "scan") {
        const line = scanLine(h, t);
        const prev = scanLine(h, t - 1);
        if (line === null) continue;
        const safe = h.safe.some((r) => inRect(this.x, this.y, r));
        if (safe) continue;
        const c = h.axis === "x" ? this.x : this.y;
        const c0 = h.axis === "x" ? x0 : y0;
        const p0 = prev ?? line;
        const lo = Math.min(p0, line);
        const hi = Math.max(p0, line);
        if ((hi >= c - rad && lo <= c + rad) || (c0 - line) * (c - line) < 0) return this.crashAt(this.x, this.y, "scan");
      } else if (h.kind === "icon" && !s.done && circleHitsRect(this.x, this.y, rad, h.rect)) {
        s.done = true;
        const j = course.panels.findIndex((p) => p.id === h.opens);
        if (j >= 0 && !this.panels[j]!.open && !this.panels[j]!.closed) {
          this.panels[j]!.open = true;
          this.panels[j]!.opening = OPEN_TICKS;
          this.events.push({ type: "open", panel: h.opens });
        }
      }
    }
    for (let i = 0; i < course.checkboxes.length; i++) {
      const c = course.checkboxes[i]!;
      if (this.checked[i] || !circleHitsRect(this.x, this.y, rad, c.rect)) continue;
      this.checked[i] = true;
      this.events.push({ type: "check", label: c.label });
      this.schedule.push({ at: t + WARN_TICKS, ticks: c.ticks, effect: c.effect });
      this.events.push({ type: "warn", effect: c.effect, ticks: WARN_TICKS });
    }
    return false;
  }

  private click(t: number) {
    const ev = this.events;
    const x = this.x;
    const y = this.y;
    void t;
    if (this.grab >= 0) {
      this.grab = -1;
      this.grabLock = true;
      ev.push({ type: "drop" });
      return;
    }
    const exit = this.exitRect();
    if (this.exitShiver === 0 && pointIn(x, y, exit, this.options.assist ? 3 : 0)) {
      const waiting = this.course.src.exit?.after?.some((id) => {
        const j = this.course.panels.findIndex((p) => p.id === id);
        return j >= 0 && !this.panels[j]!.closed;
      });
      if (waiting) {
        ev.push({ type: "locked" });
        return;
      }
      this.status = "won";
      ev.push({ type: "win" });
      return;
    }
    const course = this.course;
    for (let i = 0; i < course.panels.length; i++) {
      const p = course.panels[i]!;
      const s = this.panels[i]!;
      if (!p.closeable || !s.open || s.opening > 0) continue;
      if (!pointIn(x, y, panelClose(this.panelRect(i)), this.options.assist ? 2 : 0)) continue;
      if (p.order !== undefined && course.panels.some((q, j) => q.order !== undefined && q.order < p.order! && this.panels[j]!.open)) {
        ev.push({ type: "wrongOrder", panel: p.id });
        return;
      }
      this.closePanel(i);
      return;
    }
    for (let i = 0; i < course.hazards.length; i++) {
      const h = course.hazards[i]!;
      const s = this.hz[i]!;
      if (h.kind === "dialog" && !s.done && s.shiver === 0) {
        const onYes = inRect(x, y, h.yes);
        const onNo = inRect(x, y, h.no);
        if (!onYes && !onNo) continue;
        // Swapped: the labels have traded places.
        const label = onYes !== s.flag ? "yes" : "no";
        if (label === h.answer) {
          s.done = true;
          ev.push({ type: "close", panel: `dialog-${i}` });
        } else this.crashAt(x, y, "dialog");
        return;
      }
      if (h.kind === "robot" && !s.done && s.shiver === 0 && pointIn(x, y, h.spots[s.n]!, 2)) {
        s.done = true;
        ev.push({ type: "check", label: "I'm not a robot" });
        this.groupDone(h.panel);
        return;
      }
      if (h.kind === "target" && !s.done && pointIn(x, y, h.rect, 2)) {
        s.done = true;
        ev.push({ type: "check", label: h.label });
        this.groupDone(h.panel);
        return;
      }
    }
    ev.push({ type: "click", hit: false });
  }

  private closePanel(i: number) {
    const s = this.panels[i]!;
    const id = this.course.panels[i]!.id;
    s.open = false;
    s.closed = true;
    if (this.grab === i) this.grab = -1;
    this.events.push({ type: "close", panel: id });
    // What closing it sets off: the next window, the next sabotage, the boss's bar going back.
    this.course.panels.forEach((p, j) => {
      const next = this.panels[j]!;
      if (p.after === id && !next.open && !next.closed) {
        next.open = true;
        next.opening = OPEN_TICKS;
        this.events.push({ type: "open", panel: p.id });
      }
    });
    for (const trig of this.course.triggers) {
      if (trig.closed !== id) continue;
      this.schedule.push({ at: this.tick + WARN_TICKS, ticks: trig.ticks, effect: trig.effect });
      this.events.push({ type: "warn", effect: trig.effect, ticks: WARN_TICKS });
    }
    if (this.course.src.boss) this.uninstall = Math.max(0, this.uninstall - this.course.src.boss.drop);
  }

  /** All the robots and targets for a panel are done: it closes. */
  private groupDone(panel: string) {
    const course = this.course;
    const all = course.hazards.every((h, i) => !((h.kind === "robot" || h.kind === "target") && h.panel === panel) || this.hz[i]!.done);
    if (!all) return;
    const j = course.panels.findIndex((p) => p.id === panel);
    if (j >= 0 && this.panels[j]!.open) this.closePanel(j);
  }
}

// -----------------------------------------------------------------------------------------------

const clampX = (x: number) => Math.max(CLIENT.x + 4, Math.min(CLIENT.x + CLIENT.w - 4, x));
const clampY = (y: number) => Math.max(TITLE.y + 4, Math.min(CLIENT.y + CLIENT.h - 4, y));

/** How far a point is from a rect (0 inside). */
export function rectDist(x: number, y: number, r: Rect): number {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/** The point's inside the rect, grown by `slack` (the assist makes buttons easier to hit). */
const pointIn = (x: number, y: number, r: Rect, slack: number) => x >= r.x - slack && x <= r.x + r.w + slack && y >= r.y - slack && y <= r.y + r.h + slack;

/** A point `s` px along a path (back and forth, or round and round). */
export function pathPoint(points: Vec[], s: number, loop: boolean): Vec {
  const lengths: number[] = [];
  let total = 0;
  const n = loop ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(l);
    total += l;
  }
  if (total === 0) return points[0]!;
  let d = loop ? s % total : s % (total * 2);
  if (!loop && d > total) d = total * 2 - d;
  for (let i = 0; i < n; i++) {
    const l = lengths[i]!;
    if (d <= l || i === n - 1) {
      const a = points[i]!;
      const b = points[(i + 1) % points.length]!;
      const f = l === 0 ? 0 : Math.min(1, d / l);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    d -= l;
  }
  return points[0]!;
}

/** The scan line's position at a tick (null: it's warming up or resting). */
export function scanLine(h: Extract<Hazard, { kind: "scan" }>, t: number): number | null {
  if (t < 0) return null;
  const phase = (t + h.offset) % h.period;
  if (phase < SCAN_WARM) return null;
  const travelled = (phase - SCAN_WARM) * h.speed;
  if (travelled > Math.abs(h.to - h.from)) return null;
  return h.from + Math.sign(h.to - h.from) * travelled;
}

/** The selection box's corner-to-corner progress (0–1) and whether it's drawing right now. */
export function marqueeAt(h: Extract<Hazard, { kind: "marquee" }>, t: number): { p: number; drawing: boolean; selected: boolean } {
  const phase = (t + h.offset) % h.period;
  if (phase < h.draw) return { p: (phase + 1) / h.draw, drawing: true, selected: false };
  return { p: 1, drawing: false, selected: phase < h.draw + seconds(0.35) };
}
