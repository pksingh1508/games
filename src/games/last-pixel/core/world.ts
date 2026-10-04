// A level, played (Plan/10-last-pixel.md §2–§3): the clean-up, the switch, the hunt. Deterministic: the same
// inputs make the same game, so the tests can play every level through.
//
//   clean    your tool covers the job; the clock starts with your first stroke. The last cell won't go.
//   wake     the last cell is Pix: a tiny "!", the music cuts. It can't be caught yet.
//   hunt     it dashes off, and you catch it: tap it, net it, bait it, freeze it. It tries its tricks one at
//            a time (each lasts until you see through it); after 30 s it tires, at 60 s it gives up.
//   finish   (caught, but it un-painted a trail) paint the rest.
//   done     100%.
// The finale (Pix's Revenge) starts finished: Pix un-paints a big part of it (revenge), dives into the gaps,
// and is the last pixel again once you've repainted; caught, it gets away twice more, with new tricks.
import { createRng, type Rng } from "@/engine/rng";
import {
  ASSIST_CATCH,
  ASSIST_SPEED,
  BAIT_TICKS,
  BEAT_TICKS,
  BLINK_TICKS,
  CATCH_CELLS,
  CATCH_PX,
  CATCH_PX_TOUCH,
  FREEZE_TICKS,
  FULL,
  GIVE_UP_TICKS,
  HZ,
  MIMIC_TOUCH,
  NET_NOTICE,
  NOTICE_R,
  seconds,
  SHIMMER_EVERY,
  SHIMMER_TICKS,
  STAR_HUNT_TICKS,
  STUN_TICKS,
  TIRED_SPEED,
  TIRED_TICKS,
  TRICK_GAP,
  WAKE_DASH,
  WAKE_TICKS,
} from "./constants";
import { Coverage } from "./coverage";
import { clamp, dist, inRect, onCanvas, type Rect, type Vec } from "./geometry";
import type { HuntKit, LevelDef, PixDef, Scene, ToolId, Trick } from "./level";
import { keepOn, mover, roam, travel, type Decoy, type MoveContext, type Mover } from "./pix";
import { Painter, type ToolTick } from "./tools";

/** A place in the page Pix can escape to (a data-pix-spot), in cells from the canvas's corner. */
export interface Spot {
  id: string;
  x: number;
  y: number;
}

/** Where things are around the canvas, in cells (the runtime measures them; tests make them up). */
export interface Layout {
  /** HUD panels over the canvas (Pix hides under them). */
  hud: Rect[];
  spots: Spot[];
  /** Where a "dead pixel" could sit (off the canvas is best). */
  dead: Vec[];
  /** Screen px per cell (the catch radius is partly in px). */
  cellPx: number;
}

export function defaultLayout(w: number, h: number): Layout {
  return {
    hud: [
      { x: w / 2 - 14, y: 1, w: 28, h: 6 },
      { x: w / 2 - 22, y: h - 8, w: 44, h: 7 },
      { x: w - 8, y: 1, w: 7, h: 6 },
    ],
    spots: [
      { id: "logo", x: 9, y: -5 },
      { id: "percent", x: w / 2 + 9, y: 3 },
      { id: "pause", x: w - 4.5, y: 4 },
    ],
    dead: [
      { x: w + 12, y: h * 0.3 },
      { x: -12, y: h * 0.62 },
    ],
    cellPx: 8,
  };
}

export type Phase = "clean" | "revenge" | "wake" | "hunt" | "escaped" | "finish" | "done";

export type PixMode = "asleep" | "wake" | "free" | "stunned" | "burrow" | "hud" | "dead" | "mimic" | "dom" | "tab" | "frenzy" | "caught";

export type SimEvent =
  | { type: "start" }
  | { type: "wake"; x: number; y: number }
  | { type: "hunt"; round: number }
  | { type: "caught"; by: "click" | "net"; ticks: number }
  | { type: "escaped"; round: number }
  | { type: "decoy"; x: number; y: number }
  | { type: "miss"; x: number; y: number }
  | { type: "relocate" }
  | { type: "dodge" }
  | { type: "trick"; trick: Trick }
  | { type: "exposed"; trick: Trick }
  | { type: "net"; caught: boolean }
  | { type: "slip" }
  | { type: "bait" }
  | { type: "freeze" }
  | { type: "tired" }
  | { type: "gaveUp" }
  | { type: "unpaint" }
  | { type: "dive" }
  | { type: "notYet" }
  | { type: "dumped" }
  | { type: "pile"; cells: number }
  | { type: "done" };

export type Command =
  /** The button or a finger went down: a catch attempt (and a stroke starts). */
  | { type: "press"; at: Vec }
  | { type: "release" }
  | { type: "tool"; tool: ToolId }
  /** A net let go after `ticks` of drawing. */
  | { type: "net"; rect: Rect; ticks: number }
  | { type: "bait"; at: Vec }
  | { type: "freeze" }
  /** The game was paused (a real dead pixel would still be there). */
  | { type: "paused" }
  /** The tab was hidden / shown again. */
  | { type: "hidden" }
  | { type: "visible" };

export interface Input {
  /** Your cursor (cells; off the canvas is fine), or null: no mouse over the page, no finger down. */
  pointer: Vec | null;
  /** The button (or a finger) is down. */
  down: boolean;
  /** Pointer positions since the last tick, oldest first (smooth strokes). Empty: just `pointer`. */
  path?: readonly Vec[];
  /** A net being drawn (it doesn't paint). */
  net?: { rect: Rect; ticks: number } | null;
  commands?: readonly Command[];
}

export const STILL: Input = { pointer: null, down: false };

export interface WorldOptions {
  /** Hunt assist: Pix slower, its shimmer twice as often, a bigger catch radius. */
  assist?: boolean;
  /** Fingers: a bigger catch radius. */
  touch?: boolean;
  seed?: number | string;
  layout?: Layout;
}

export interface PixState extends Mover {
  mode: PixMode;
  modeTicks: number;
  /** A trick's destination, and whether it's there. */
  dest: Vec | null;
  arrived: boolean;
  /** Running off when it wakes. */
  dash: Vec | null;
  /** The next trick (index), and how long until it starts. */
  trick: number;
  trickWait: number;
  /** The HUD panel it's under, and the ones it's used. */
  hud: number;
  usedHud: number[];
  spot: string | null;
  /** Paused while it was a "dead pixel": it's seen through when the game carries on. */
  outed: boolean;
  /** The tab was hidden while it was in the tab's icon. */
  lookedAway: boolean;
  trailLeft: number;
  lastCell: number;
  tired: boolean;
  gaveUp: boolean;
}

export interface LevelResult {
  /** From the first stroke to 100%. */
  ticks: number;
  /** The clean-up: first stroke to the switch. */
  cleanTicks: number;
  /** The hunt (all rounds). */
  huntTicks: number;
  caughtBy: "click" | "net";
  netCatches: number;
  /** The dead pixel seen through by pausing (Not My Monitor). */
  outed: boolean;
  /** Caught in the tab escape (Tab Hunter). */
  tabbed: boolean;
  assisted: boolean;
}

const HIDDEN: readonly PixMode[] = ["burrow", "hud", "dead", "mimic", "dom", "tab"];
const ESCAPE_TICKS = seconds(1.4);
/** Dashing (waking up, hopping away): at least this fast (cells a second). */
const DASH_SPEED = 32;
/** The finale's un-painting run: how fast Pix goes, and how wide a swathe. */
const FRENZY_SPEED = 44;
const FRENZY_R = 2.6;

/** The progress the way the HUD shows it: more decimals the closer you get, never rounded up to 100%. */
export function formatProgress(p: number): string {
  if (p >= 1) return "100%";
  const pct = Math.max(0, p) * 100;
  const places = p < 0.9 ? 0 : p < 0.99 ? 1 : p < 0.999 ? 2 : 3;
  const k = 10 ** places;
  return `${(Math.floor(pct * k) / k).toFixed(places)}%`;
}

export class World {
  readonly scene: Scene;
  readonly cov: Coverage;
  readonly painter: Painter;
  readonly w: number;
  readonly h: number;
  phase: Phase;
  /** The clock has started (your first stroke). */
  started = false;
  /** Ticks since the first stroke. */
  tick = 0;
  phaseTicks = 0;
  cleanTicks = 0;
  huntTicks = 0;
  roundTicks = 0;
  /** The finale's round (0-based); everyone else's is 0. */
  round = 0;
  def: PixDef;
  pix: PixState;
  /** Pix is up and about (the progress counts it as the one cell left). */
  pixAlive = false;
  decoys: Decoy[] = [];
  nets: number;
  baits: number;
  freezes: number;
  bait: Vec | null = null;
  baitTicks = 0;
  frozen = 0;
  /** A net being drawn right now (for drawing it, and for Pix to notice). */
  net: { rect: Rect; ticks: number } | null = null;
  layout: Layout;
  netCatches = 0;
  outed = false;
  caughtBy: "click" | "net" = "click";
  revengeLeft: number;
  readonly events: SimEvent[] = [];
  /** The tool's last tick (sounds, particles). */
  toolTick: ToolTick = { added: 0, dumped: false, pile: 0, full: false };
  private readonly rng: Rng;
  private pointer: Vec | null = null;
  private lastPointer: Vec | null = null;
  private down = false;
  private slipped = false;
  private unpaints = 0;

  constructor(
    readonly level: LevelDef,
    readonly options: WorldOptions = {},
  ) {
    this.scene = level.scene();
    this.w = this.scene.w;
    this.h = this.scene.h;
    this.cov = new Coverage(this.w, this.h, this.scene.region, this.scene.tasks);
    this.painter = new Painter(level.tools, this.w, this.h, level.mower);
    this.rng = createRng(`${level.id}:${options.seed ?? 0}`);
    this.layout = options.layout ?? defaultLayout(this.w, this.h);
    this.def = level.pix;
    this.nets = level.hunt.net;
    this.baits = level.hunt.bait;
    this.freezes = level.hunt.freeze;
    this.revengeLeft = level.revenge ?? 0;
    this.pix = this.newPix(this.w / 2, this.h / 2, "asleep");
    this.phase = "clean";
    if (this.revengeLeft > 0) {
      // The finale: everything's done, and Pix is wide awake in the middle of it.
      this.cov.fill();
      this.cov.guard = false;
      this.phase = "revenge";
      this.pix.mode = "frenzy";
      this.pixAlive = true;
    }
  }

  get kit(): HuntKit {
    return this.level.hunt;
  }

  get rounds(): number {
    return 1 + (this.level.rounds?.length ?? 0);
  }

  /** What the progress bar shows (0–1): Pix, while it's about, is the one cell left. */
  get progress(): number {
    const { covered, total } = this.cov;
    if (this.phase === "done") return 1;
    return total ? Math.max(0, covered - (this.pixAlive ? 1 : 0)) / total : 1;
  }

  /** Your cursor as of the last tick (cells), or null. */
  get cursor(): Vec | null {
    return this.pointer;
  }

  setLayout(layout: Layout) {
    this.layout = layout;
  }

  catchRadius(): number {
    const px = this.options.touch ? CATCH_PX_TOUCH : CATCH_PX;
    return Math.max(CATCH_CELLS, px / Math.max(0.5, this.layout.cellPx)) * (this.options.assist ? ASSIST_CATCH : 1);
  }

  /** Pix's speed right now (cells a second). */
  speed(): number {
    return this.def.speed * (this.pix.tired ? TIRED_SPEED : 1) * (this.options.assist ? ASSIST_SPEED : 1);
  }

  /** Camouflage's tell: the shimmer (every 2 s; every second with the assist, or tired). */
  shimmering(): boolean {
    if (!this.def.camo) return false;
    const every = this.options.assist || this.pix.tired ? SHIMMER_EVERY / 2 : SHIMMER_EVERY;
    return this.roundTicks % every < SHIMMER_TICKS;
  }

  /** The real Pix blinks on the beat. */
  blinking(): boolean {
    return this.roundTicks % BEAT_TICKS < BLINK_TICKS;
  }

  /** Pix is on the canvas, where you can see (or nearly see) it. */
  onCanvas(): boolean {
    const p = this.pix;
    return p.x >= 0 && p.y >= 0 && p.x < this.w && p.y < this.h;
  }

  /** Pix can be tapped right now. */
  catchable(): boolean {
    const p = this.pix;
    if (this.phase !== "hunt") return false;
    // Mid-dash (it's just woken, or hopped away) it's too quick to tap.
    if (p.mode === "free" && p.dash) return false;
    if (p.mode === "free" || p.mode === "stunned" || p.mode === "dead" || p.mode === "dom" || p.mode === "mimic") return true;
    return p.mode === "hud" && !p.arrived;
  }

  /** The level's result, once it's done. */
  result(): LevelResult {
    return {
      ticks: this.tick,
      cleanTicks: this.cleanTicks,
      huntTicks: this.huntTicks,
      caughtBy: this.caughtBy,
      netCatches: this.netCatches,
      outed: this.outed,
      tabbed: (this.def.tricks ?? []).includes("tab"),
      assisted: !!this.options.assist,
    };
  }

  /** Stars (§7): 100%, the clean-up in time, Pix caught in under 10 seconds (a round). */
  stars(): [boolean, boolean, boolean] {
    const done = this.phase === "done";
    return [done, done && this.cleanTicks <= this.level.target, done && !this.options.assist && this.huntTicks <= STAR_HUNT_TICKS * this.rounds];
  }

  // -----------------------------------------------------------------------------------------------

  step(input: Input): SimEvent[] {
    const ev = this.events;
    ev.length = 0;
    const commands = input.commands ?? [];
    for (const c of commands) if (c.type === "tool") this.painter.select(c.tool);
    const press = commands.find((c): c is Extract<Command, { type: "press" }> => c.type === "press");
    const released = commands.some((c) => c.type === "release");
    this.lastPointer = this.pointer;
    this.pointer = input.pointer ? { x: input.pointer.x, y: input.pointer.y } : null;
    if (!this.started) {
      if (!press) return ev;
      this.started = true;
      ev.push({ type: "start" });
    }
    if (this.phase === "done") return ev;
    this.tick++;
    this.phaseTicks++;
    this.net = input.net ?? null;
    if (!this.net) this.slipped = false;

    // A catch attempt, a net let go, the hunt tools: before anything moves, so what you saw is what you get.
    if (this.phase === "hunt") {
      for (const c of commands) {
        if (this.phase !== "hunt") break;
        if (c.type === "press") this.tryCatch(c.at);
        else if (c.type === "net") this.letGoOfNet(c.rect);
        else if (c.type === "bait") this.placeBait(c.at);
        else if (c.type === "freeze") this.freeze();
        else if (c.type === "paused" && this.pix.mode === "dead" && this.pix.arrived) this.pix.outed = true;
        else if (c.type === "hidden" && this.pix.mode === "tab" && this.pix.arrived) this.pix.lookedAway = true;
        else if (c.type === "visible" && this.pix.mode === "tab" && this.pix.lookedAway) this.fallBackIn();
      }
    } else if (press && (this.phase === "revenge" || this.phase === "wake" || this.phase === "escaped")) {
      if (dist(press.at, this.pix) <= this.catchRadius()) ev.push({ type: "notYet" });
    }

    // The tool (a net being drawn doesn't paint).
    const path = input.path && input.path.length ? input.path : input.pointer ? [input.pointer] : [];
    const painting = input.down && !input.net;
    this.toolTick = this.painter.apply(this.cov, painting ? path : [], painting, !!press && !input.net, released || (this.down && !painting));
    this.down = painting;
    if (this.toolTick.dumped) ev.push({ type: "dumped" });
    if (this.toolTick.pile) ev.push({ type: "pile", cells: this.toolTick.pile });

    switch (this.phase) {
      case "clean":
        if (this.cov.total > 0 && this.cov.covered >= this.cov.total - 1) this.wake();
        break;
      case "revenge":
        this.frenzy();
        break;
      case "wake":
        if (this.phaseTicks >= WAKE_TICKS) this.beginHunt();
        break;
      case "escaped":
        if (this.phaseTicks >= ESCAPE_TICKS) {
          this.round++;
          this.def = this.level.rounds![this.round - 1]!;
          this.beginHunt();
        }
        break;
      case "hunt":
        this.hunt();
        break;
      case "finish":
        if (this.cov.covered >= this.cov.total) this.finish();
        break;
    }
    return ev;
  }

  // -- The switch ----------------------------------------------------------------------------------

  private wake() {
    const c = this.cov;
    let i = c.survivor >= 0 && c.amount[c.survivor]! < FULL ? c.survivor : -1;
    if (i < 0) i = c.remaining()[0] ?? Math.floor(c.size / 2);
    const x = i % this.w;
    const y = (i - x) / this.w;
    c.guard = false;
    c.set(i, FULL);
    this.pixAlive = true;
    this.cleanTicks = this.tick;
    this.pix = this.newPix(x + 0.5, y + 0.5, "wake");
    this.phase = "wake";
    this.phaseTicks = 0;
    this.events.push({ type: "wake", x, y });
  }

  private beginHunt() {
    const p = this.pix;
    const def = this.def;
    this.phase = "hunt";
    this.phaseTicks = 0;
    this.roundTicks = 0;
    p.mode = "free";
    p.modeTicks = 0;
    p.tired = p.gaveUp = false;
    p.trick = 0;
    p.trickWait = def.tricks?.length ? seconds(0.9) : 0;
    p.usedHud = [];
    p.trailLeft = def.trail ?? 0;
    p.lastCell = -1;
    // It runs off, away from where you are.
    p.dash = this.dashFrom(this.pointer ?? { x: p.x + (this.rng() - 0.5), y: p.y + (this.rng() - 0.5) }, WAKE_DASH);
    this.decoys = [];
    for (let k = 0; k < (def.decoys ?? 0); k++) {
      const a = (k / (def.decoys ?? 1)) * Math.PI * 2 + this.rng();
      const r = 8 + this.rng() * 14;
      const m = mover(clamp(p.dash.x + Math.cos(a) * r, 2, this.w - 2), clamp(p.dash.y + Math.sin(a) * r, 2, this.h - 2));
      this.decoys.push({ ...m, alive: true, blinkAt: Math.round(10 + this.rng() * 40) });
    }
    this.events.push({ type: "hunt", round: this.round });
  }

  // -- The hunt ------------------------------------------------------------------------------------

  private hunt() {
    const p = this.pix;
    this.huntTicks++;
    this.roundTicks++;
    if (!p.tired && this.roundTicks >= TIRED_TICKS) {
      p.tired = true;
      this.events.push({ type: "tired" });
    }
    if (!p.gaveUp && this.roundTicks >= GIVE_UP_TICKS) this.giveUp();

    // Seen through?
    if (p.outed && p.mode === "dead") {
      p.outed = false;
      this.outed = true;
      const back = this.nearestOnCanvas(p, 4);
      p.x = back.x;
      p.y = back.y;
      this.expose("dead");
    }
    if (p.mode === "burrow") {
      const reach = this.painter.tool.radius + 1.2;
      if (this.painter.touched.some((t) => dist(t, p) <= reach)) this.expose("burrow");
    }
    if (p.mode === "hud" && p.arrived) {
      const r = this.layout.hud[p.hud];
      if (!r || !inRect(p, { x: r.x + 0.3, y: r.y + 0.3, w: r.w - 0.6, h: r.h - 0.6 })) this.expose("hud");
    }
    if (p.mode === "mimic" && this.pointer && dist(this.pointer, p) < MIMIC_TOUCH) this.expose("mimic");

    this.movePix();
    this.moveDecoys();
    this.trail();

    if (p.mode === "free" && !p.gaveUp && p.trickWait > 0 && --p.trickWait === 0) this.nextTrick();
    if (this.frozen > 0) this.frozen--;
    if (this.baitTicks > 0 && --this.baitTicks === 0) this.bait = null;
  }

  private context(flee: boolean): MoveContext {
    return {
      w: this.w,
      h: this.h,
      rng: this.rng,
      pointer: flee ? this.pointer : null,
      notice: NOTICE_R * (this.options.assist ? 0.8 : 1),
      juke: !this.pix.tired,
      onJuke: () => this.events.push({ type: "dodge" }),
    };
  }

  private movePix() {
    const p = this.pix;
    p.modeTicks++;
    if (this.frozen > 0 || p.gaveUp) {
      p.vx = p.vy = 0;
      return;
    }
    const speed = this.speed();
    const bounds = { w: this.w, h: this.h };
    switch (p.mode) {
      case "free": {
        if (p.dash) {
          // A dash is quick: under a second, however far.
          if (travel(p, p.dash, Math.max(speed * 3, DASH_SPEED), bounds)) p.dash = null;
          return;
        }
        if (this.bait) {
          // It can't resist: it rushes over.
          if (dist(p, this.bait) > 1.2) travel(p, this.bait, Math.max(speed * 2, 16), bounds);
          else p.vx = p.vy = 0;
          return;
        }
        if (this.net && this.net.ticks > NET_NOTICE && inRect(p, this.net.rect)) {
          // It's seen the net coming: out of it, fast.
          if (!this.slipped) {
            this.slipped = true;
            this.events.push({ type: "slip" });
          }
          travel(p, this.outOf(this.net.rect, p), speed * 2.4, bounds);
          return;
        }
        roam(p, this.context(!!this.def.flee), speed, !!this.def.flee, !!this.def.camo && !this.def.flee);
        return;
      }
      case "stunned":
        p.vx = p.vy = 0;
        if (p.modeTicks >= STUN_TICKS) {
          p.mode = "free";
          p.modeTicks = 0;
          p.trickWait = p.trick < (this.def.tricks?.length ?? 0) ? TRICK_GAP : 0;
        }
        return;
      case "burrow":
        roam(p, this.context(false), speed * 0.6, false, false);
        return;
      case "hud":
      case "dead":
      case "dom":
      case "tab":
        if (!p.arrived && p.dest) {
          if (travel(p, p.dest, speed * (p.mode === "hud" ? 1.6 : 2), p.mode === "hud" ? bounds : null)) {
            p.arrived = true;
            if (p.mode === "tab") this.events.push({ type: "trick", trick: "tab" });
          }
        } else p.vx = p.vy = 0;
        return;
      case "mimic": {
        if (this.pointer && this.lastPointer) {
          const dx = this.pointer.x - this.lastPointer.x;
          const dy = this.pointer.y - this.lastPointer.y;
          const style = this.def.mimic ?? "mirrorX";
          const [mx, my] = style === "mirrorX" ? [-dx, dy] : style === "mirrorY" ? [dx, -dy] : [dy, dx];
          const x0 = p.x;
          const y0 = p.y;
          p.x += mx;
          p.y += my;
          keepOn(p, this.w, this.h);
          p.vx = (p.x - x0) * HZ;
          p.vy = (p.y - y0) * HZ;
        } else roam(p, this.context(false), speed * 0.5, false, false);
        return;
      }
      default:
        return;
    }
  }

  private moveDecoys() {
    if (this.frozen > 0 || !this.decoys.length) return;
    const ctx = this.context(!!this.def.flee);
    ctx.onJuke = () => {};
    const speed = this.speed();
    for (const d of this.decoys) {
      if (!d.alive) continue;
      roam(d, ctx, speed, !!this.def.flee, false);
      if (this.roundTicks >= d.blinkAt + BLINK_TICKS) d.blinkAt = this.roundTicks + Math.round(14 + this.rng() * 40);
    }
  }

  /** A decoy's blinking now. */
  decoyBlinking(d: Decoy): boolean {
    return this.roundTicks >= d.blinkAt && this.roundTicks < d.blinkAt + BLINK_TICKS;
  }

  /** The repaint trail: cells it runs over come undone (until it's used up its trail). */
  private trail() {
    const p = this.pix;
    if (p.trailLeft <= 0 || !this.onCanvas() || p.mode === "burrow" || p.mode === "stunned" || p.mode === "caught") return;
    const cell = Math.floor(p.y) * this.w + Math.floor(p.x);
    if (cell === p.lastCell) return;
    p.lastCell = cell;
    if (!this.cov.region[cell] || this.cov.amount[cell]! < FULL) return;
    this.cov.set(cell, 0);
    p.trailLeft--;
    if (this.unpaints++ % 5 === 0) this.events.push({ type: "unpaint" });
  }

  // -- Catching ------------------------------------------------------------------------------------

  private tryCatch(at: Vec) {
    const r = this.catchRadius();
    let best = Infinity;
    let who = -2;
    if (this.catchable()) {
      const d = dist(at, this.pix);
      if (d <= r) {
        best = d;
        who = -1;
      }
    }
    this.decoys.forEach((dc, k) => {
      if (!dc.alive) return;
      const d = dist(at, dc);
      if (d <= r && d < best) {
        best = d;
        who = k;
      }
    });
    if (who === -1) {
      this.caught("click");
      return;
    }
    if (who >= 0) {
      const dc = this.decoys[who]!;
      dc.alive = false;
      this.events.push({ type: "decoy", x: dc.x, y: dc.y });
      return;
    }
    this.events.push({ type: "miss", x: at.x, y: at.y });
    const p = this.pix;
    // A camouflaged Pix that doesn't run: tap close and miss, and it hops off somewhere else.
    if (this.def.camo && !this.def.flee && p.mode === "free" && !p.gaveUp && dist(at, p) < 6) {
      p.dash = this.dashFrom(at, 26);
      this.events.push({ type: "relocate" });
    }
  }

  private letGoOfNet(rect: Rect) {
    if (this.nets <= 0) return;
    this.nets--;
    for (const d of this.decoys) {
      if (d.alive && inRect(d, rect)) {
        d.alive = false;
        this.events.push({ type: "decoy", x: d.x, y: d.y });
      }
    }
    const got = this.catchable() && this.onCanvas() && inRect(this.pix, rect);
    this.events.push({ type: "net", caught: got });
    if (got) this.caught("net");
  }

  private placeBait(at: Vec) {
    if (this.baits <= 0) return;
    this.baits--;
    this.bait = { x: clamp(at.x, 0.5, this.w - 0.5), y: clamp(at.y, 0.5, this.h - 0.5) };
    this.baitTicks = BAIT_TICKS;
    this.events.push({ type: "bait" });
  }

  private freeze() {
    if (this.freezes <= 0) return;
    this.freezes--;
    this.frozen = FREEZE_TICKS;
    this.events.push({ type: "freeze" });
  }

  private caught(by: "click" | "net") {
    const p = this.pix;
    p.mode = "caught";
    p.vx = p.vy = 0;
    for (const d of this.decoys) d.alive = false;
    this.caughtBy = by;
    if (by === "net") this.netCatches++;
    this.events.push({ type: "caught", by, ticks: this.roundTicks });
    this.bait = null;
    this.frozen = 0;
    if (this.round < this.rounds - 1) {
      // The finale: not yet.
      this.phase = "escaped";
      this.phaseTicks = 0;
      p.mode = "wake";
      this.events.push({ type: "escaped", round: this.round });
      return;
    }
    this.pixAlive = false;
    if (this.cov.covered < this.cov.total) {
      this.phase = "finish";
      this.phaseTicks = 0;
    } else this.finish();
  }

  private finish() {
    this.phase = "done";
    this.phaseTicks = 0;
    this.events.push({ type: "done" });
  }

  // -- Tricks --------------------------------------------------------------------------------------

  private nextTrick() {
    const tricks = this.def.tricks ?? [];
    const p = this.pix;
    while (p.trick < tricks.length) {
      const trick = tricks[p.trick++]!;
      if (this.startTrick(trick)) return;
    }
  }

  /** Start a trick; false when there's nowhere to do it (no HUD over the canvas, no page spot). */
  private startTrick(trick: Trick): boolean {
    const p = this.pix;
    p.arrived = false;
    p.dest = null;
    p.dash = null;
    p.modeTicks = 0;
    switch (trick) {
      case "burrow":
        break;
      case "mimic":
        break;
      case "hud": {
        let best = -1;
        let bestD = Infinity;
        this.layout.hud.forEach((r, k) => {
          if (p.usedHud.includes(k) || onCanvas(r, this.w, this.h) < 0.3) return;
          const c = this.hudSpot(r);
          if (!c) return;
          const d = dist(c, p);
          if (d < bestD) {
            bestD = d;
            best = k;
          }
        });
        if (best < 0) return false;
        p.hud = best;
        p.usedHud.push(best);
        p.dest = this.hudSpot(this.layout.hud[best]!);
        break;
      }
      case "dead": {
        const spots = this.layout.dead;
        if (!spots.length) return false;
        const from = this.pointer ?? p;
        p.dest = [...spots].sort((a, b) => dist(b, from) - dist(a, from))[0]!;
        break;
      }
      case "dom": {
        const want = this.def.spots ?? ["percent", "logo", "pause"];
        const spot = want.map((id) => this.layout.spots.find((s) => s.id === id)).find(Boolean);
        if (!spot) return false;
        p.spot = spot.id;
        p.dest = { x: spot.x, y: spot.y };
        break;
      }
      case "tab":
        p.dest = { x: this.w / 2, y: -3 };
        p.lookedAway = false;
        break;
    }
    p.mode = trick;
    this.events.push({ type: "trick", trick });
    return true;
  }

  /** Where under a panel Pix sits: the middle of the part over the canvas. */
  private hudSpot(r: Rect): Vec | null {
    const x0 = Math.max(0, r.x);
    const y0 = Math.max(0, r.y);
    const x1 = Math.min(this.w, r.x + r.w);
    const y1 = Math.min(this.h, r.y + r.h);
    if (x1 - x0 < 2 || y1 - y0 < 2) return null;
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  }

  private expose(trick: Trick) {
    const p = this.pix;
    p.mode = "stunned";
    p.modeTicks = 0;
    p.arrived = false;
    p.dest = null;
    this.events.push({ type: "exposed", trick });
  }

  private fallBackIn() {
    const p = this.pix;
    p.x = this.w / 2;
    p.y = 4;
    this.expose("tab");
  }

  /** 60 seconds: it gives up, comes out of wherever it was, and sits still. */
  private giveUp() {
    const p = this.pix;
    p.gaveUp = true;
    for (const d of this.decoys) d.alive = false;
    if (p.mode === "hud") {
      const r = this.layout.hud[p.hud];
      if (r) p.y = r.y + r.h + 2 < this.h ? r.y + r.h + 2 : Math.max(1, r.y - 2);
    }
    if (!this.onCanvas() || p.mode === "dead" || p.mode === "tab") {
      const back = this.nearestOnCanvas(p, 5);
      p.x = back.x;
      p.y = back.y;
    }
    if (HIDDEN.includes(p.mode) || p.mode === "stunned") p.mode = "free";
    p.dash = null;
    this.bait = null;
    keepOn(p, this.w, this.h);
    this.events.push({ type: "gaveUp" });
  }

  // -- The finale's revenge ------------------------------------------------------------------------

  private frenzy() {
    const p = this.pix;
    if (!p.dest || travel(p, p.dest, FRENZY_SPEED, { w: this.w, h: this.h })) {
      // Long dashes from side to side.
      p.dest = { x: 3 + this.rng() * (this.w - 6), y: 3 + this.rng() * (this.h - 6) };
      if (dist(p.dest, p) < this.w / 3) p.dest = { x: this.w - p.dest.x, y: this.h - p.dest.y };
    }
    const r = FRENZY_R;
    for (let y = Math.floor(p.y - r); y <= Math.ceil(p.y + r); y++) {
      for (let x = Math.floor(p.x - r); x <= Math.ceil(p.x + r); x++) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h || this.revengeLeft <= 0) continue;
        if (Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) > r) continue;
        const i = y * this.w + x;
        if (!this.cov.region[i] || this.cov.amount[i]! < FULL) continue;
        this.cov.set(i, 0);
        this.revengeLeft--;
      }
    }
    if (this.phaseTicks % 6 === 0) this.events.push({ type: "unpaint" });
    if (this.revengeLeft <= 0) {
      // Into the gaps it made: it's just one of the unpainted cells now.
      p.mode = "asleep";
      this.pixAlive = false;
      this.cov.guard = true;
      this.cov.survivor = -1;
      this.phase = "clean";
      this.phaseTicks = 0;
      this.events.push({ type: "dive" });
    }
  }

  // -- Helpers -------------------------------------------------------------------------------------

  private newPix(x: number, y: number, mode: PixMode): PixState {
    return {
      ...mover(x, y),
      mode,
      modeTicks: 0,
      dest: null,
      arrived: false,
      dash: null,
      trick: 0,
      trickWait: 0,
      hud: -1,
      usedHud: [],
      spot: null,
      outed: false,
      lookedAway: false,
      trailLeft: 0,
      lastCell: -1,
      tired: false,
      gaveUp: false,
    };
  }

  /** Where to dash to, about `reach` away: the heading that ends furthest from `from` (your cursor). */
  private dashFrom(from: Vec, reach: number): Vec {
    const p = this.pix;
    const inset = 5;
    let best: Vec = { x: p.x, y: p.y };
    let bestScore = -Infinity;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + this.rng() * 0.2;
      const to = { x: clamp(p.x + Math.cos(a) * reach, inset, this.w - inset), y: clamp(p.y + Math.sin(a) * reach, inset, this.h - inset) };
      const score = dist(to, from) + dist(to, p) * 0.5;
      if (score > bestScore) {
        bestScore = score;
        best = to;
      }
    }
    return best;
  }

  private nearestOnCanvas(at: Vec, inset: number): Vec {
    return { x: clamp(at.x, inset, this.w - inset), y: clamp(at.y, inset, this.h - inset) };
  }

  /** The nearest point just outside a rect (from p, inside it), on the canvas. */
  private outOf(r: Rect, p: Vec): Vec {
    const options: Vec[] = [
      { x: r.x - 2, y: p.y },
      { x: r.x + r.w + 2, y: p.y },
      { x: p.x, y: r.y - 2 },
      { x: p.x, y: r.y + r.h + 2 },
    ].filter((o) => o.x >= 0.5 && o.y >= 0.5 && o.x <= this.w - 0.5 && o.y <= this.h - 0.5);
    if (!options.length) return p;
    return options.sort((a, b) => dist(a, p) - dist(b, p))[0]!;
  }
}
