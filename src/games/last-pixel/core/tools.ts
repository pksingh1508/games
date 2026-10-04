// The clean-up tools (Plan/10-last-pixel.md §3 "Phase 1"). A stroke is stamped every half cell along the
// pointer's path (so a fast flick leaves no gaps), and a tool's strength is paint per cell travelled: how
// much a cell gets depends on the path, never on how fast the hand moved.
//
//   Roller   wide; its edges only part-paint, so strokes want to overlap ("slower at the edges")
//   Brush    small and precise                 Sponge   wipes a little at a time; circling and scrubbing
//   Scratch  speckled, a couple of goes                  clean much faster
//   Mower    drives itself: momentum and a turning circle; it heads for your pointer while you hold on;
//            the stripes follow the way it went
//   Shovel   clears snow into a load; push it off the drive, or it's left as a pile where you let go
//   Washer   a narrow, powerful jet in a fine mist           Eraser   classic
import { FULL, HZ } from "./constants";
import type { Coverage } from "./coverage";
import { clamp, type Vec } from "./geometry";
import type { Task, ToolId } from "./level";
import { hash01 } from "./picture";

export interface ToolDef {
  id: ToolId;
  task: Task;
  name: string;
  /** The footprint's radius (half the deck or blade for the mower and shovel), cells. */
  radius: number;
  /** Inside this radius, `strength`; out to `radius`, `rim`. Per cell travelled. */
  core: number;
  strength: number;
  rim: number;
  /** Circling and scrubbing multiply the strength by up to 1 + this. */
  swirl?: number;
  /** Each cell takes its own share of a stamp (a speckled reveal). */
  grit?: boolean;
  kind: "stroke" | "mower" | "shovel";
}

/** Enough to fill a cell in one stamp. */
const INSTANT = 640;

export const TOOLS: Record<ToolId, ToolDef> = {
  roller: { id: "roller", task: "paint", name: "Paint roller", radius: 5.5, core: 3.8, strength: INSTANT, rim: 30, kind: "stroke" },
  brush: { id: "brush", task: "paint", name: "Brush", radius: 2.2, core: 2.2, strength: INSTANT, rim: 0, kind: "stroke" },
  sponge: { id: "sponge", task: "wipe", name: "Sponge", radius: 4.8, core: 4.8, strength: 17, rim: 0, swirl: 1.6, kind: "stroke" },
  scratch: { id: "scratch", task: "scratch", name: "Scratch coin", radius: 3.2, core: 3.2, strength: 46, rim: 0, grit: true, kind: "stroke" },
  mower: { id: "mower", task: "mow", name: "Lawn mower", radius: 4, core: 4, strength: INSTANT, rim: 0, kind: "mower" },
  shovel: { id: "shovel", task: "shovel", name: "Snow shovel", radius: 4.6, core: 4.6, strength: INSTANT, rim: 0, kind: "shovel" },
  washer: { id: "washer", task: "wash", name: "Pressure washer", radius: 3.6, core: 2.3, strength: INSTANT, rim: 9, kind: "stroke" },
  eraser: { id: "eraser", task: "erase", name: "Eraser", radius: 3, core: 3, strength: INSTANT, rim: 0, kind: "stroke" },
};

/** Which tools can do a task. */
export const TOOLS_FOR: Record<Task, ToolId[]> = {
  paint: ["roller", "brush"],
  wipe: ["sponge"],
  scratch: ["scratch"],
  mow: ["mower"],
  shovel: ["shovel"],
  wash: ["washer"],
  erase: ["eraser"],
};

const STEP = 0.5;
/** The mower's top speed (cells a second), and its tightest turn (radius, cells). */
export const MOWER_MAX = 28;
const MOWER_TURN = 3.4;
/** The shovel's load: once it carries this many cells of snow, it can't take more. */
export const SHOVEL_CAP = 260;
/** Less than this is just brushed aside; more is left as a pile when you let go. */
const PILE_MIN = 12;

export interface Mower {
  x: number;
  y: number;
  heading: number;
  speed: number;
}

/** What a tick of the tool did (for sounds and particles). */
export interface ToolTick {
  /** Paint added, in cells' worth. */
  added: number;
  /** The shovel tipped its load off the drive. */
  dumped: boolean;
  /** The shovel left a pile (cells). */
  pile: number;
  /** The shovel's full. */
  full: boolean;
}

const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

export class Painter {
  tool: ToolDef;
  /** The stroke's last point (null between strokes). */
  private last: Vec | null = null;
  private dir: Vec | null = null;
  private swirl = 0;
  private strokes = 0;
  mower: Mower;
  /** The shovel's load (cells of snow), and which way the blade faces. */
  load = 0;
  blade: Vec = { x: 1, y: 0 };
  /** Where it stamped this tick (sub-sampled): digging Pix out, particles. */
  readonly touched: Vec[] = [];

  constructor(
    readonly tools: readonly ToolId[],
    private readonly w: number,
    private readonly h: number,
    mowerStart: Vec = { x: 4, y: h - 4 },
  ) {
    this.tool = TOOLS[tools[0]!];
    this.mower = { x: mowerStart.x, y: mowerStart.y, heading: 0, speed: 0 };
  }

  select(id: ToolId) {
    if (!this.tools.includes(id) || this.tool.id === id) return;
    this.tool = TOOLS[id];
    this.last = null;
    this.dir = null;
  }

  /**
   * One tick: the pointer's path since the last tick while the button's down (oldest first), whether it
   * went down or up this tick.
   */
  apply(cov: Coverage, path: readonly Vec[], down: boolean, pressed: boolean, released: boolean): ToolTick {
    this.touched.length = 0;
    const out: ToolTick = { added: 0, dumped: false, pile: 0, full: false };
    const tool = this.tool;
    if (tool.kind === "mower") {
      this.drive(cov, path.length ? path[path.length - 1]! : null, down, out);
      return out;
    }
    if (pressed && path.length) {
      this.strokes++;
      this.last = null;
      this.dir = null;
      this.swirl = 0;
    }
    if (down) {
      for (const p of path) {
        if (!this.last) {
          this.last = { x: p.x, y: p.y };
          if (tool.kind === "shovel") this.dumpCheck(cov, p, out);
          else this.stamp(cov, p.x, p.y, STEP, out);
          continue;
        }
        this.segment(cov, this.last, p, out);
        this.last = { x: p.x, y: p.y };
      }
    }
    if (released || !down) {
      if (tool.kind === "shovel" && this.last && this.load > 0) this.letGo(cov, this.last, out);
      this.last = null;
      this.dir = null;
    }
    return out;
  }

  private segment(cov: Coverage, a: Vec, b: Vec, out: ToolTick) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-6) return;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    if (this.dir) {
      // Turning (circling, scrubbing back and forth) builds up the sponge's swirl.
      const turn = Math.abs(angleDiff(Math.atan2(uy, ux), Math.atan2(this.dir.y, this.dir.x)));
      this.swirl += turn;
    }
    this.dir = { x: ux, y: uy };
    if (this.tool.kind === "shovel") this.blade = { x: this.blade.x * 0.6 + ux * 0.4, y: this.blade.y * 0.6 + uy * 0.4 };
    const steps = Math.max(1, Math.ceil(len / STEP));
    const step = len / steps;
    for (let k = 1; k <= steps; k++) {
      const x = a.x + ux * step * k;
      const y = a.y + uy * step * k;
      this.swirl *= 0.95;
      if (this.tool.kind === "shovel") this.push(cov, x, y, out);
      else this.stamp(cov, x, y, step, out);
    }
  }

  /** One stamp of a stroke tool: paint per cell travelled, times `travel`. */
  private stamp(cov: Coverage, cx: number, cy: number, travel: number, out: ToolTick) {
    const t = this.tool;
    const boost = t.swirl ? 1 + Math.min(t.swirl, this.swirl * 0.9) : 1;
    const r = t.radius;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(this.w - 1, Math.floor(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(this.h - 1, Math.floor(cy + r));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > r) continue;
        let amt = (d <= t.core ? t.strength : t.rim) * travel * boost;
        if (t.grit) amt *= 0.35 + 1.3 * hash01(x, y, this.strokes);
        if (amt > 0) out.added += cov.add(y * this.w + x, amt, t.task) / FULL;
      }
    }
    if (this.touched.length < 64) this.touched.push({ x: cx, y: cy });
  }

  // -- The mower -------------------------------------------------------------------------------------

  private drive(cov: Coverage, target: Vec | null, down: boolean, out: ToolTick) {
    const m = this.mower;
    if (down && target) {
      const dx = target.x - m.x;
      const dy = target.y - m.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.3) {
        const diff = angleDiff(Math.atan2(dy, dx), m.heading);
        // A turning circle: the faster it goes, the wider it turns (it can still pivot slowly).
        const maxTurn = Math.max(2.2, m.speed / MOWER_TURN) / HZ;
        m.heading += clamp(diff, -maxTurn, maxTurn);
        const facing = Math.cos(diff);
        const want = facing > 0 ? Math.min(MOWER_MAX, d * 3.5) * facing : 2;
        m.speed += (want - m.speed) * 0.1;
      } else m.speed *= 0.85;
    } else m.speed *= 0.92;
    if (m.speed < 0.05) m.speed = 0;
    const travel = m.speed / HZ;
    const steps = Math.max(1, Math.ceil(travel / STEP));
    const cos = Math.cos(m.heading);
    const sin = Math.sin(m.heading);
    // The stripes follow the way it went: rightwards and downwards one shade, back the other.
    const variant = Math.abs(cos) >= Math.abs(sin) ? (cos >= 0 ? 0 : 1) : sin >= 0 ? 0 : 1;
    for (let k = 1; k <= steps; k++) {
      if (travel > 0) {
        m.x = clamp(m.x + (cos * travel) / steps, 0, this.w);
        m.y = clamp(m.y + (sin * travel) / steps, 0, this.h);
      }
      if (travel > 0 || k === 1) this.deck(cov, m.x, m.y, -sin, cos, variant, out);
    }
  }

  private deck(cov: Coverage, x: number, y: number, px: number, py: number, variant: number, out: ToolTick) {
    const half = this.tool.radius;
    for (let t = -half; t <= half; t += STEP) {
      for (const a of [-1, -0.5, 0, 0.5, 1]) {
        const cx = Math.floor(x + px * t + py * a);
        const cy = Math.floor(y + py * t - px * a);
        if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) continue;
        out.added += cov.add(cy * this.w + cx, FULL, "mow", variant) / FULL;
      }
    }
    if (this.touched.length < 64) this.touched.push({ x, y });
  }

  // -- The shovel ------------------------------------------------------------------------------------

  /** Off the drive (or the canvas), the load goes with it. */
  private dumpCheck(cov: Coverage, p: Vec, out: ToolTick): boolean {
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    const offDrive = x < 0 || y < 0 || x >= this.w || y >= this.h || cov.taskAt(y * this.w + x) !== "shovel";
    if (offDrive && this.load > 0) {
      if (this.load >= PILE_MIN) out.dumped = true;
      this.load = 0;
    }
    return offDrive;
  }

  private push(cov: Coverage, cx: number, cy: number, out: ToolTick) {
    // The blade scrapes wherever it goes (it digs Pix out of the lawn's snow too).
    if (this.touched.length < 64) this.touched.push({ x: cx, y: cy });
    if (this.dumpCheck(cov, { x: cx, y: cy }, out)) return;
    if (this.load >= SHOVEL_CAP) {
      out.full = true;
      return;
    }
    const b = this.blade;
    const n = Math.hypot(b.x, b.y) || 1;
    const ux = b.x / n;
    const uy = b.y / n;
    const half = this.tool.radius;
    let cleared = 0;
    for (let t = -half; t <= half; t += STEP) {
      for (const a of [0, 0.5]) {
        const x = Math.floor(cx - uy * t + ux * a);
        const y = Math.floor(cy + ux * t + uy * a);
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
        const i = y * this.w + x;
        const before = cov.amount[i]!;
        if (before >= FULL) continue;
        cleared += cov.add(i, FULL, "shovel") / FULL;
      }
    }
    this.load += cleared;
    out.added += cleared;
  }

  /** Let go on the drive: the load's left there, as a pile to clear again. */
  private letGo(cov: Coverage, at: Vec, out: ToolTick) {
    if (this.load >= PILE_MIN) {
      const r = clamp(Math.sqrt(this.load / Math.PI) * 0.8, 1, 5);
      let pile = 0;
      for (let y = Math.floor(at.y - r); y <= Math.ceil(at.y + r); y++) {
        for (let x = Math.floor(at.x - r); x <= Math.ceil(at.x + r); x++) {
          if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
          if (Math.hypot(x + 0.5 - at.x, y + 0.5 - at.y) > r) continue;
          const i = y * this.w + x;
          if (cov.taskAt(i) !== "shovel" || cov.amount[i]! === 0) continue;
          cov.set(i, 0);
          pile++;
        }
      }
      out.pile = pile;
    }
    this.load = 0;
  }
}
