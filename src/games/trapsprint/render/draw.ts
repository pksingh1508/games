// Draws a moment of a level (Plan/06-trapsprint.md §9): the scene, every trap in its current state
// with its tell, coins, springs, flags, the door, your ghost, you, and the effects on top.
// Everything lands on whole pixels of the 480 × 272 canvas, which the page scales up.
import type { Runner } from "@/engine/platformer/runner";
import { pixelSprite } from "@/engine/sprites";
import { HEIGHT, TILE, WIDTH } from "../core/constants";
import type { Level } from "../core/level";
import { anchorOf, followerPosition, ghostPosition, squeezeWalls, trapRect, triggerArea, type GameEvent, type World } from "../core/world";
import { COIN, flagCloth, PAL, RUNNER, SIDE_SPRING, SKULL, SPRING, STALACTITE, sawBlade, silhouette, spikeBall, sprite } from "./art";
import { Effects } from "./effects";
import { pixelText, textWidth } from "./font";
import { buildScene, cloud, hash, paintGround, spikeTile, THEMES, type Scene, type ZoneLook } from "./scene";

export interface Frame {
  world: World;
  /** The runner one tick ago (smooth motion on fast screens). */
  prev: { x: number; y: number };
  alpha: number;
  /** Seconds, for animations that run whether or not the clock does. */
  time: number;
  /** The best run's ghost, racing you. */
  ghost: World | null;
  ghostPrev: { x: number; y: number } | null;
  markers: ReadonlyArray<{ x: number; y: number }>;
  /** Assist: show where traps trigger. */
  reveal: boolean;
  /** Draw the runner (not while the death puff plays). */
  hero: boolean;
}

const px = (g: CanvasRenderingContext2D, colour: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = colour;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};

/** Your best run's ghost: white, with the outline kept so it shows on a pale sky. */
const GHOST_PALETTE = Object.fromEntries(Object.keys(PAL).map((k) => [k, k === "k" ? "#4a5170" : "#ffffff"]));

/** Which runner frame to show: stateless, so ghosts and replays animate the same way. */
export function runnerFrame(p: Runner, time: number): keyof typeof RUNNER {
  if (!p.grounded) return p.vy < 0 ? "jump" : "fall";
  if (Math.abs(p.vx) > 0.4) return (["run0", "run1", "run2", "run3"] as const)[Math.floor(p.x / 6) % 4]!;
  return time % 3.2 < 0.12 ? "blink" : "idle";
}

/** The runner (or a ghost of it) with its feet at the bottom of the hitbox. */
export function drawRunner(
  g: CanvasRenderingContext2D,
  p: Runner,
  x: number,
  y: number,
  time: number,
  { colour, ghost = false, squashX = 1, squashY = 1 }: { colour?: string; ghost?: boolean; squashX?: number; squashY?: number } = {},
) {
  const frame = runnerFrame(p, time);
  const flip = p.facing < 0;
  const art = ghost
    ? pixelSprite(RUNNER[frame]!, GHOST_PALETTE, { key: `ts:ghost:${frame}`, flip })
    : colour
      ? silhouette(RUNNER[frame]!, colour, `runner:${frame}`, flip)
      : sprite(RUNNER[frame]!, `runner:${frame}`, flip);
  const w = Math.round(12 * squashX);
  const h = Math.round(14 * squashY);
  g.drawImage(art, Math.round(x - 1 + (12 - w) / 2), Math.round(y + 14 - h), w, h);
}

// ---------------------------------------------------------------------------------------------
// Doors
// ---------------------------------------------------------------------------------------------

const doorCache = new Map<string, HTMLCanvasElement>();

/** A wooden door, 16 × 26 (the bottom 2 px are for wheels). */
function doorArt(wheels: boolean): HTMLCanvasElement {
  const id = wheels ? "wheels" : "plain";
  const hit = doorCache.get(id);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 26;
  const g = c.getContext("2d")!;
  px(g, PAL.k, 1, 1, 14, 23);
  px(g, PAL.k, 2, 0, 12, 1);
  px(g, PAL.u, 2, 2, 12, 22);
  px(g, "#c47a4e", 2, 1, 12, 1);
  px(g, "#c47a4e", 2, 2, 1, 22);
  for (const x of [5, 9]) px(g, PAL.v, x, 3, 1, 21);
  px(g, PAL.v, 3, 8, 10, 1);
  px(g, PAL.v, 3, 17, 10, 1);
  px(g, PAL.k, 2, 5, 2, 1);
  px(g, PAL.k, 2, 19, 2, 1);
  px(g, PAL.y, 11, 12, 2, 2);
  px(g, PAL.m, 11, 12, 1, 1);
  // A little lit window.
  px(g, PAL.k, 6, 3, 4, 4);
  px(g, PAL.y, 7, 4, 2, 2);
  if (wheels) {
    for (const wx of [3, 10]) {
      px(g, PAL.k, wx, 22, 4, 4);
      px(g, PAL["1"], wx + 1, 23, 2, 2);
    }
  }
  doorCache.set(id, c);
  return c;
}

function drawDoor(g: CanvasRenderingContext2D, x: number, y: number, { shadow, wheels, faded = 0 }: { shadow: boolean; wheels: boolean; faded?: number }) {
  // The real thing casts a shadow; the painted one doesn't (its tell).
  if (shadow) {
    g.fillStyle = "rgba(26, 28, 44, 0.45)";
    g.fillRect(Math.round(x) - 3, Math.round(y) + 23, 18, 2);
    g.fillRect(Math.round(x) - 1, Math.round(y) + 25, 14, 1);
  }
  g.globalAlpha = 1 - faded;
  g.drawImage(doorArt(wheels), Math.round(x) - 2, Math.round(y) - 1);
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------------------------------------
// Belts
// ---------------------------------------------------------------------------------------------

function belt(g: CanvasRenderingContext2D, x: number, y: number, dir: number, time: number, dim: boolean) {
  px(g, PAL["3"], x, y, TILE, TILE);
  px(g, PAL.k, x, y - 1, TILE, 1);
  px(g, PAL.k, x, y, TILE, 4);
  px(g, PAL.k, x, y + TILE - 1, TILE, 1);
  // Rollers.
  for (const rx of [4, 12]) {
    px(g, PAL.k, x + rx - 3, y + 7, 6, 6);
    px(g, PAL["2"], x + rx - 2, y + 8, 4, 4);
    const spoke = Math.floor(time * 8 * dir) % 2 === 0;
    px(g, PAL["1"], x + rx - (spoke ? 1 : 0), y + 9 + (spoke ? 0 : 1), spoke ? 2 : 1, spoke ? 1 : 2);
  }
  // Moving arrow lights on the belt.
  const shift = (((time * 24 * dir) % 8) + 8) % 8;
  const lit = dim ? "#4a3d26" : PAL.y;
  g.save();
  g.beginPath();
  g.rect(x, y, TILE, 4);
  g.clip();
  for (let ax = -8; ax < TILE + 8; ax += 8) {
    const bx = x + Math.round(ax + shift);
    if (dir > 0) {
      px(g, lit, bx, y, 1, 1);
      px(g, lit, bx + 1, y + 1, 1, 2);
      px(g, lit, bx, y + 3, 1, 1);
    } else {
      px(g, lit, bx + 1, y, 1, 1);
      px(g, lit, bx, y + 1, 1, 2);
      px(g, lit, bx + 1, y + 3, 1, 1);
    }
  }
  g.restore();
}

// ---------------------------------------------------------------------------------------------
// The renderer
// ---------------------------------------------------------------------------------------------

export class Renderer {
  readonly g: CanvasRenderingContext2D;
  readonly fx: Effects;
  private scene: Scene | null = null;
  private level: Level | null = null;
  /** When each spring was last used (seconds), to squash it for a moment. */
  private bounced = new Map<string, number>();
  private time = 0;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly reducedMotion: () => boolean,
  ) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.g = canvas.getContext("2d")!;
    this.g.imageSmoothingEnabled = false;
    this.fx = new Effects(reducedMotion);
  }

  setLevel(level: Level) {
    this.level = level;
    this.scene = buildScene(level);
    this.bounced.clear();
  }

  get zone(): ZoneLook {
    return (this.scene?.zone ?? 1) as ZoneLook;
  }

  /** React to what happened this tick: dust, debris, squashes. */
  onEvents(w: World, events: readonly GameEvent[]) {
    const p = w.p;
    const feet = { x: p.x + p.w / 2, y: p.y + p.h };
    for (const e of events) {
      switch (e.type) {
        case "jump":
          this.fx.jump(feet.x, feet.y);
          break;
        case "land":
          this.fx.land(feet.x, feet.y, e.impact);
          break;
        case "bonk":
          this.fx.sparkle(feet.x, p.y, PAL.w, 4);
          this.fx.kick(1.5);
          break;
        case "spring": {
          const at = w.level.springs.findIndex((s) => Math.abs(s.x + s.w / 2 - feet.x) < 14 && Math.abs(s.y - feet.y) < 20);
          if (e.sideways) {
            const i = w.level.traps.findIndex((t) => t.kind === "sidewaysSpring" && Math.abs(t.rect.x + 8 - feet.x) < 16);
            this.bounced.set(`side:${i}`, this.time);
          } else if (at >= 0) this.bounced.set(`spring:${at}`, this.time);
          this.fx.dust(feet.x, feet.y, 3);
          break;
        }
        case "coin": {
          const coin = w.level.coins[e.index]!;
          this.fx.sparkle(coin.x + 4, coin.y + 5, PAL.y, 8);
          break;
        }
        case "checkpoint": {
          const flag = w.level.checkpoints[e.index]!;
          this.fx.sparkle(flag.x + 6, flag.y + 4, PAL.l, 10);
          break;
        }
        case "die":
          this.fx.death(e.x, e.y);
          break;
        case "win":
          this.fx.confetti(w.exit.x + w.exit.w / 2, w.exit.y + 6);
          break;
        case "trap": {
          const i = w.level.traps.findIndex((t) => t.id === e.id);
          const r = trapRect(w, i);
          if (e.kind === "crusher" && e.phase === "rest") {
            this.fx.debris(r.x + r.w / 2, r.y + r.h, THEMES[this.zone].light, 10);
            this.fx.kick(3);
          } else if (e.kind === "stalactite" && e.phase === "done") {
            this.fx.debris(r.x + 8, r.y + 12, PAL["1"], 12);
            this.fx.kick(2);
          } else if (e.kind === "victoryBanner" && e.phase === "rest") {
            this.fx.debris(r.x + r.w / 2, r.y + r.h, PAL.y, 10);
            this.fx.kick(2);
          } else if (e.kind === "fakeSpikes") {
            // (Painted spikes never fire.)
          } else if (e.kind === "coinBait" && e.phase === "fire") {
            this.fx.sparkle(r.x + 8, r.y + 8, PAL.w, 8);
          } else if (e.kind === "fakeDoor") {
            this.fx.sparkle(r.x + 8, r.y, PAL.w, 10);
            this.fx.sparkle(w.exit.x + 6, w.exit.y + 10, PAL.y, 12);
          } else if (e.kind === "dropFloor" && e.phase === "fire") {
            this.fx.debris(r.x + r.w / 2, r.y, THEMES[this.zone].fill, 6);
          } else if (e.kind === "invisibleBlock") {
            this.fx.sparkle(r.x + r.w / 2, r.y + r.h, PAL.c, 10);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  /** Per tick: particles move, cracks trickle dust. */
  tick(w: World | null) {
    this.fx.tick();
    if (!w) return;
    // The crusher's tell: dust trickling from its cracks now and then.
    w.level.traps.forEach((def, i) => {
      if (def.kind !== "crusher" || w.traps[i]!.phase !== "idle") return;
      const a = anchorOf(w, i);
      if (hash(Math.floor(this.time * 60), i) < 0.04) this.fx.trickle(a.x + 3 + Math.floor(hash(i, Math.floor(this.time * 7)) * (a.w - 6)), a.y + a.h);
    });
  }

  /** Paint one frame. */
  draw(f: Frame) {
    const { g } = this;
    const w = f.world;
    if (!this.scene || this.level !== w.level) this.setLevel(w.level);
    const scene = this.scene!;
    this.time = f.time;

    g.save();
    const shake = this.fx.shake;
    if (shake > 0 && !this.reducedMotion()) {
      g.translate(Math.round(Math.sin(f.time * 90) * shake), Math.round(Math.cos(f.time * 73) * shake));
    }

    g.drawImage(scene.background, 0, 0);
    this.ambient(f.time, scene.zone);
    this.belts(w, f.time);
    g.drawImage(scene.tiles, 0, 0);

    if (f.markers.length) {
      g.globalAlpha = 0.55;
      const skull = sprite(SKULL, "skull");
      for (const m of f.markers) g.drawImage(skull, Math.round(m.x) - 3, Math.round(m.y) - 3);
      g.globalAlpha = 1;
    }

    this.items(w, f.time);
    for (let i = 0; i < w.traps.length; i++) this.trap(w, i, f.time, f.alpha);
    this.door(w);

    // The ghost of your best run.
    if (f.ghost && f.ghost.status === "play") {
      const gp = f.ghostPrev ?? f.ghost.p;
      g.globalAlpha = 0.6;
      drawRunner(g, f.ghost.p, lerp(gp.x, f.ghost.p.x, f.alpha), lerp(gp.y, f.ghost.p.y, f.alpha), f.time, { ghost: true });
      g.globalAlpha = 1;
    }
    this.ghostTrap(w, f.time);

    if (f.hero && w.status !== "dead") {
      drawRunner(g, w.p, lerp(f.prev.x, w.p.x, f.alpha), lerp(f.prev.y, w.p.y, f.alpha), f.time, { squashX: this.fx.squashX, squashY: this.fx.squashY });
    }

    this.fx.draw(g);
    if (f.reveal) this.reveal(w, f.time);
    g.restore();
  }

  /** Moving bits of the backgrounds: drifting clouds, factory lights, torch flames. */
  private ambient(time: number, zone: ZoneLook) {
    const { g } = this;
    const seed = this.level ? this.level.id.length * 37 + this.level.id.charCodeAt(this.level.id.length - 1) : 0;
    if (zone === 1) {
      for (let i = 0; i < 4; i++) {
        const speed = 3 + i * 1.5;
        const x = ((hash(seed, i) * WIDTH + time * speed) % (WIDTH + 80)) - 60;
        cloud(g, Math.round(x), 22 + Math.floor(hash(i, seed) * 70), 0.8 + hash(seed, i, 3) * 0.6);
      }
    } else if (zone === 2) {
      for (let i = 0; i < 6; i++) {
        const on = Math.floor(time * 2 + i * 0.7) % 3 === 0;
        px(g, on ? PAL.o : "#5a3a30", 20 + i * 80 + (seed % 30), 44, 3, 3);
      }
    } else {
      for (const tx of [156, 324, 32, 448]) {
        px(g, PAL["3"], tx - 1, 112, 3, 10);
        px(g, PAL.k, tx - 3, 110, 7, 3);
        const flick = Math.floor(time * 10 + tx) % 3;
        px(g, PAL.o, tx - 2, 104 + flick % 2, 5, 6 - (flick % 2));
        px(g, PAL.y, tx - 1, 106, 3, 4);
        px(g, PAL.m, tx, 107 + (flick === 2 ? 1 : 0), 1, 2);
        g.fillStyle = "rgba(255, 205, 117, 0.08)";
        g.fillRect(tx - 14, 94, 28, 30);
      }
    }
  }

  private belts(w: World, time: number) {
    const level = w.level;
    level.grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell === "conveyorRight") belt(this.g, c * TILE, r * TILE, 1, time, false);
        else if (cell === "conveyorLeft") belt(this.g, c * TILE, r * TILE, -1, time, false);
      }),
    );
    level.traps.forEach((def, i) => {
      if (def.kind !== "conveyorFlip") return;
      const a = anchorOf(w, i);
      // Its tell: the arrow lights flicker now and then.
      const dim = (time + i * 0.37) % 1.4 < 0.12;
      for (let x = a.x; x < a.x + a.w; x += TILE) belt(this.g, x, a.y, w.traps[i]!.flag, time, dim);
    });
  }

  private items(w: World, time: number) {
    const { g } = this;
    const level = w.level;
    const spin = Math.floor(time * 8) % 4;
    level.coins.forEach((coin, i) => {
      if (w.coins & (1 << i)) return;
      const bob = Math.round(Math.sin(time * 3 + i) * 1);
      g.drawImage(sprite(COIN[spin]!, `coin:${spin}`), coin.x, coin.y + bob);
    });
    level.springs.forEach((spring, i) => {
      const squashed = time - (this.bounced.get(`spring:${i}`) ?? -9) < 0.12;
      g.drawImage(sprite(SPRING[squashed ? 1 : 0]!, `spring:${squashed ? 1 : 0}`), spring.x, spring.y - 2);
    });
    level.checkpoints.forEach((flag, i) => {
      this.flagPole(flag.x + 1, flag.y, flagCloth(Math.floor(time * 7 + i), { gold: w.checkpoint >= i }));
    });
  }

  private flagPole(x: number, y: number, cloth: HTMLCanvasElement) {
    const { g } = this;
    px(g, PAL.k, x, y, 2, 24);
    px(g, PAL["1"], x, y, 1, 24);
    px(g, PAL.y, x - 1, y - 2, 4, 3);
    g.drawImage(cloth, x + 2, y);
    px(g, PAL.k, x - 2, y + 23, 6, 1);
  }

  private door(w: World) {
    if (w.exit.hidden) return;
    const runaway = w.level.traps.some((t) => t.kind === "runawayDoor");
    drawDoor(this.g, w.exit.x, w.exit.y, { shadow: true, wheels: runaway });
  }

  private trap(w: World, i: number, time: number, alpha: number) {
    const { g } = this;
    const def = w.level.traps[i]!;
    const s = w.traps[i]!;
    const a = anchorOf(w, i);
    const r = trapRect(w, i);
    const jitter = s.phase === "warn" && !this.reducedMotion() ? (Math.floor(time * 40) % 2 ? 1 : -1) : 0;

    switch (def.kind) {
      case "popSpikes":
      case "returnTrap": {
        if (s.phase !== "fire") break;
        // Up out of the floor in two ticks.
        const rise = Math.min(1, (s.t + alpha) / 2);
        g.save();
        g.beginPath();
        g.rect(a.x, a.y, a.w, a.h);
        g.clip();
        for (let x = a.x; x < a.x + a.w; x += TILE) g.drawImage(spikeTile("up"), x, a.y + a.h - TILE + Math.round((1 - rise) * 10));
        g.restore();
        break;
      }
      case "fakeSpikes":
        for (let x = a.x; x < a.x + a.w; x += TILE) g.drawImage(spikeTile("up", true), x, a.y + a.h - TILE);
        break;
      case "jumpPunisher": {
        if (s.phase !== "fire") break;
        const drop = Math.min(1, (s.t + alpha) / 2);
        g.save();
        g.beginPath();
        g.rect(a.x, a.y, a.w, a.h);
        g.clip();
        for (let x = a.x; x < a.x + a.w; x += TILE) g.drawImage(spikeTile("down"), x, a.y - Math.round((1 - drop) * 10));
        g.restore();
        break;
      }
      case "dropFloor":
        if (s.phase === "done") break;
        paintGround(g, this.zone, r.x + jitter, Math.round(r.y), r.w, r.h);
        // The hairline seam.
        px(g, PAL.k, r.x + jitter, r.y + 2, 1, r.h - 2);
        px(g, PAL.k, r.x + r.w - 1 + jitter, r.y + 2, 1, r.h - 2);
        break;
      case "risingFloor": {
        paintGround(g, this.zone, r.x, Math.round(r.y), r.w, r.h);
        for (const cx of [r.x + 6, r.x + r.w - 10]) {
          px(g, PAL["3"], cx, r.y + r.h, 4, HEIGHT - (r.y + r.h));
          px(g, PAL["1"], cx + 1, r.y + r.h, 1, HEIGHT - (r.y + r.h));
          px(g, PAL.k, cx - 1, r.y + r.h, 6, 2);
        }
        break;
      }
      case "crusher":
        this.press(a, r, s.phase, jitter);
        break;
      case "invisibleBlock": {
        if (s.flag) {
          g.fillStyle = "rgba(115, 239, 247, 0.28)";
          g.fillRect(r.x, r.y, r.w, r.h);
          g.strokeStyle = PAL.c;
          g.lineWidth = 1;
          g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
          px(g, PAL.w, r.x + 2, r.y + 2, 3, 1);
          px(g, PAL.w, r.x + 2, r.y + 2, 1, 3);
        } else {
          // Its tell: a faint sparkle every three seconds.
          const phase = (time + i * 0.9) % 3;
          if (phase < 0.25) {
            const sx = r.x + 3 + Math.floor(hash(i, Math.floor(time / 3)) * (r.w - 6));
            const sy = r.y + 3 + Math.floor(hash(Math.floor(time / 3), i) * (r.h - 6));
            g.globalAlpha = 0.85 - phase * 3;
            px(g, PAL.w, sx - 2, sy, 5, 1);
            px(g, PAL.w, sx, sy - 2, 1, 5);
            g.globalAlpha = 1;
          }
        }
        break;
      }
      case "stalactite":
        if (s.phase === "done") break;
        g.drawImage(sprite(STALACTITE, "stalactite"), r.x + jitter, Math.round(r.y));
        break;
      case "saw": {
        if (s.phase === "idle" || s.phase === "done") break;
        const blade = sawBlade(Math.floor(time * 30));
        if (s.phase === "warn") {
          // Peeking out of its slot, rattling.
          const peek = (def.dir ?? 1) > 0 ? -6 : 6;
          g.drawImage(blade, a.x + peek + jitter, a.y);
        } else g.drawImage(blade, Math.round(r.x), r.y);
        break;
      }
      case "wallSqueeze": {
        if (s.phase === "idle") break;
        for (const [k, wall] of squeezeWalls(w, i).entries()) {
          px(g, PAL["2"], wall.x, wall.y, wall.w, wall.h);
          px(g, PAL["1"], wall.x + 1, wall.y + 1, wall.w - 2, 1);
          px(g, PAL.k, wall.x, wall.y, wall.w, 1);
          px(g, PAL.k, wall.x, wall.y + wall.h - 1, wall.w, 1);
          // Hazard stripes on the leading edge.
          const edge = k === 0 ? wall.x + wall.w - 4 : wall.x;
          for (let y = wall.y; y < wall.y + wall.h; y += 4) px(g, (y / 4) % 2 ? PAL.y : PAL.k, edge, y, 4, 2);
        }
        break;
      }
      case "fakeCheckpoint": {
        const launched = s.phase !== "idle";
        if (launched) g.drawImage(sprite(SPRING[s.t < 6 ? 1 : 0]!, `spring:${s.t < 6 ? 1 : 0}`), a.x + 1, a.y + 8);
        // Same place a real flag would be, but its cloth never moves (the tell).
        this.flagPole(a.x + 5, a.y - 8 - (launched ? 6 : 0), flagCloth(0, { still: true }));
        break;
      }
      case "coinBait": {
        if (s.phase === "idle") {
          // It spins backwards (the tell).
          const back = (4 - (Math.floor(time * 8) % 4)) % 4;
          const bob = Math.round(Math.sin(time * 3 + i) * 1);
          g.drawImage(sprite(COIN[back]!, `coin:${back}`), a.x + 4, a.y + 3 + bob);
        } else {
          const show = Math.min(1, (s.t + alpha) / 2);
          g.globalAlpha = show;
          const around: Array<[number, number, "up" | "down" | "left" | "right"]> = [
            [-1, -1, "down"],
            [0, -1, "down"],
            [1, -1, "down"],
            [-1, 1, "up"],
            [0, 1, "up"],
            [1, 1, "up"],
            [-1, 0, "right"],
            [1, 0, "left"],
          ];
          for (const [dx, dy, dir] of around) g.drawImage(spikeTile(dir), a.x + dx * TILE, a.y + dy * TILE);
          g.globalAlpha = 1;
        }
        break;
      }
      case "sidewaysSpring": {
        const squashed = time - (this.bounced.get(`side:${i}`) ?? -9) < 0.15;
        g.drawImage(sprite(SIDE_SPRING[squashed ? 1 : 0]!, `side:${squashed ? 1 : 0}`, (def.dir ?? 1) < 0), a.x + 1, a.y + 7);
        break;
      }
      case "victoryBanner":
        this.banner(w, a, r, s.phase, jitter);
        break;
      case "follower": {
        const pos = followerPosition(w, i);
        const ball = spikeBall();
        g.drawImage(ball, Math.round(pos.x) - 7, Math.round(pos.y) - 7);
        if (pos.awake) {
          px(g, PAL.w, pos.x - 3, pos.y - 2, 2, 2);
          px(g, PAL.w, pos.x + 1, pos.y - 2, 2, 2);
          px(g, PAL.k, pos.x - 2 + (w.p.x > pos.x ? 1 : 0), pos.y - 1, 1, 1);
          px(g, PAL.k, pos.x + 1 + (w.p.x > pos.x ? 1 : 0), pos.y - 1, 1, 1);
        } else {
          // Asleep: closed eyes, and Zs.
          px(g, PAL.k, pos.x - 3, pos.y - 1, 2, 1);
          px(g, PAL.k, pos.x + 1, pos.y - 1, 2, 1);
          const z = (time * 0.8) % 1;
          g.globalAlpha = 1 - z;
          pixelText(g, "Z", pos.x + 5 + z * 4, pos.y - 10 - z * 10, PAL.w);
          g.globalAlpha = 1;
        }
        break;
      }
      case "fakeDoor": {
        const peeled = s.phase !== "idle";
        drawDoor(g, a.x + 2, a.y - 8, { shadow: false, wheels: false, faded: peeled ? 0.65 : 0 });
        if (peeled) {
          // Just paint: a curled corner.
          px(g, "#e9d2b0", a.x + 11, a.y - 8, 3, 3);
          px(g, PAL.k, a.x + 11, a.y - 5, 3, 1);
        }
        break;
      }
      case "runawayDoor":
        break;
    }
  }

  /** A press (factory), a stone block (castle): the head comes down, the rod stays up top. */
  private press(a: { x: number; y: number; w: number; h: number }, r: { x: number; y: number; w: number; h: number }, phase: string, jitter: number) {
    const { g } = this;
    const zone = this.zone;
    const t = THEMES[zone];
    const x = r.x + jitter;
    const y = Math.round(r.y);
    if (y > a.y) {
      const cx = a.x + a.w / 2 - 3;
      px(g, PAL.k, cx, a.y, 6, y - a.y);
      px(g, PAL["1"], cx + 1, a.y, 2, y - a.y);
      px(g, PAL["2"], cx + 3, a.y, 2, y - a.y);
    }
    px(g, t.line, x, y, r.w, r.h);
    px(g, t.fill, x + 1, y + 1, r.w - 2, r.h - 2);
    px(g, t.light, x + 1, y + 1, r.w - 2, 1);
    px(g, t.dark, x + 1, y + r.h - 6, r.w - 2, 1);
    // Teeth along the bottom.
    for (let tx = 1; tx < r.w - 1; tx += 4) {
      px(g, PAL["1"], x + tx, y + r.h - 5, 3, 2);
      px(g, PAL["1"], x + tx + 1, y + r.h - 3, 1, 2);
    }
    if (zone === 3) {
      // A grumpy face on the castle's blocks.
      const cx = x + r.w / 2;
      const angry = phase !== "idle";
      px(g, PAL.w, cx - 9, y + 8, 6, 5);
      px(g, PAL.w, cx + 3, y + 8, 6, 5);
      px(g, PAL.k, cx - 7, y + 10, 2, 2);
      px(g, PAL.k, cx + 5, y + 10, 2, 2);
      px(g, PAL.k, cx - 10, y + (angry ? 6 : 7), 7, 1);
      px(g, PAL.k, cx + 3, y + (angry ? 6 : 7), 7, 1);
    } else {
      for (const [bx, by] of [
        [3, 3],
        [r.w - 5, 3],
      ] as const) {
        px(g, t.dark, x + bx, y + by, 2, 2);
      }
      for (let sx = 2; sx < r.w - 2; sx += 6) px(g, PAL.y, x + sx, y + 8, 3, 2);
    }
  }

  private banner(w: World, a: { x: number; y: number; w: number; h: number }, r: { x: number; y: number; w: number; h: number }, phase: string, jitter: number) {
    const { g } = this;
    const x = r.x;
    const y = Math.round(r.y);
    // The ropes up to the ceiling: you can see them (the tell). They fray, then snap.
    if (phase === "idle" || phase === "warn") {
      let top = a.y;
      const col = Math.floor((a.x + 4) / TILE);
      for (let row = Math.floor(a.y / TILE) - 1; row >= 0; row--) {
        if (w.level.grid[row]?.[col] === "ground") {
          top = (row + 1) * TILE;
          break;
        }
        top = row * TILE;
      }
      for (const rx of [a.x + 4, a.x + a.w - 5]) {
        for (let ry = top; ry < a.y + 2; ry += 2) px(this.g, (ry / 2) % 2 ? "#c8a26a" : "#8f6a3a", rx + (phase === "warn" ? jitter : 0), ry, 1, 2);
      }
    }
    px(g, PAL.k, x, y, r.w, r.h);
    px(g, PAL.r, x + 1, y + 1, r.w - 2, r.h - 3);
    px(g, PAL.y, x + 1, y + 1, r.w - 2, 1);
    px(g, PAL.y, x + 1, y + r.h - 4, r.w - 2, 1);
    for (let sx = x + 1; sx < x + r.w - 1; sx += 4) px(g, PAL.r, sx, y + r.h - 2, 2, 1);
    const text = r.w >= 62 ? "LEVEL COMPLETE!" : "COMPLETE!";
    pixelText(g, text, x + Math.floor((r.w - textWidth(text)) / 2), y + 5, PAL.w);
  }

  /** "Your Own Ghost": your best run, in red, with a spike ball. */
  private ghostTrap(w: World, time: number) {
    const pos = ghostPosition(w);
    if (!pos) return;
    const { g } = this;
    g.globalAlpha = pos.armed ? 0.85 : 0.35;
    // Which way it's going, from where it was a tick ago.
    const before = w.tick > 0 && w.ghost ? w.ghost[(w.tick - 1) * 2]! : pos.x;
    const moving = pos.x - before;
    const p = { ...w.p, x: pos.x - 5, y: pos.y - 7, grounded: true, vx: moving, vy: 0, facing: (moving < 0 ? -1 : 1) as 1 | -1 };
    // Spikes poking out all round it: touching it is the trap.
    g.drawImage(spikeBall("red"), Math.round(pos.x) - 7, Math.round(pos.y) - 7);
    drawRunner(g, p, p.x, p.y, time, { colour: PAL.h });
    g.globalAlpha = 1;
  }

  /** Assist: faint outlines where traps trigger. */
  private reveal(w: World, time: number) {
    const { g } = this;
    g.save();
    g.setLineDash([3, 2]);
    g.lineDashOffset = -Math.floor(time * 12);
    g.lineWidth = 1;
    w.level.traps.forEach((_, i) => {
      if (w.traps[i]!.phase !== "idle") return;
      const area = triggerArea(w, i);
      if (!area) return;
      g.fillStyle = "rgba(228, 59, 92, 0.1)";
      g.fillRect(area.x, area.y, area.w, area.h);
      g.strokeStyle = "rgba(228, 59, 92, 0.75)";
      g.strokeRect(area.x + 0.5, area.y + 0.5, area.w - 1, area.h - 1);
    });
    g.restore();
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
