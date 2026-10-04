// Draws a moment of a room (Plan/05-fake-floor.md §9, §12). Back to front: the far background
// (parallax 0.3), the back wall and its shadows, the painted layer (World 5), rock, floors, things,
// pebbles, you, the rain, the darkness, then words and signs on top. Everything lands on whole
// pixels of the 480 × 272 canvas, which the page scales up.
import { pixelText, textWidth, wrapPixelText } from "@/engine/pixel-font";
import type { Runner } from "@/engine/platformer/runner";
import { NET_TICKS, TILE, VIEW_H, VIEW_W } from "../core/constants";
import { cellAt, ROCK, type Look, type Room } from "../core/room";
import { floorSolid, handOf, lobTo, ticksToFlip, type GameEvent, type World } from "../core/world";
import { restCamera } from "../play/camera";
import { Effects } from "./effects";
import { drawCracks, drawEnds, drawReturnCrack, floorTile } from "./floors";
import { lanternAt, lanternAtRest, Lighting, nearestLantern, shadowOffset } from "./lighting";
import { E } from "./palette";
import { buildScene, FAR_PARALLAX, type Scene } from "./scene";
import { CHANDELIER, INSPECTOR, KEY, LANTERN, PEBBLE, PEBBLE_PILE, sprite, type InspectorFrame } from "./sprites";
import { Weather } from "./weather";

export interface Frame {
  world: World;
  /** The player one tick ago (smooth motion on fast screens). */
  prev: { x: number; y: number };
  alpha: number;
  /** Seconds, for things that move whether or not you do (lanterns, rain). */
  time: number;
  /** Camera x (already smoothed). */
  cam: number;
  looking: boolean;
  /** Ticks since your last throw (the arm stays out a moment). */
  sinceThrow: number;
  /** Where a pebble would go, in room coordinates (null: not aiming). */
  aim: { x: number; y: number } | null;
  highContrast: boolean;
  /** Draw the inspector (not once you've fallen out of sight). */
  hero: boolean;
}

const px = (g: CanvasRenderingContext2D, colour: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = colour;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Which frame the inspector shows: stateless, so the title's attract mode animates the same way. */
export function inspectorFrame(p: Runner, time: number, { looking = false, throwing = false } = {}): InspectorFrame {
  if (throwing) return "throw";
  if (!p.grounded) return p.vy < 0 ? "jump" : "fall";
  if (Math.abs(p.vx) > 0.35) return (["run0", "run1", "run2", "run3"] as const)[Math.floor(p.x / 5) % 4]!;
  if (looking) return "peer";
  return time % 3.4 < 0.12 ? "blink" : "idle";
}

/** The inspector with its feet at the bottom of the hitbox. */
export function drawInspector(g: CanvasRenderingContext2D, frame: InspectorFrame, facing: number, x: number, y: number, squashX = 1, squashY = 1) {
  const art = sprite(INSPECTOR[frame]!, `insp:${frame}`, facing < 0);
  const w = Math.round(12 * squashX);
  const h = Math.round(14 * squashY);
  g.drawImage(art, Math.round(x - 1 + (12 - w) / 2), Math.round(y + 14 - h), w, h);
}

/** Door colours per world. */
const DOOR: Record<Look, { wood: string; dark: string; light: string; frame: string }> = {
  1: { wood: E.umber, dark: E.cocoa, light: E.brown, frame: E.white },
  2: { wood: E.dusk, dark: E.night, light: E.slate, frame: E.steel },
  3: { wood: E.umber, dark: E.cocoa, light: E.brown, frame: E.cocoa },
  4: { wood: E.slate, dark: E.dusk, light: E.steel, frame: E.white },
  5: { wood: E.rust, dark: E.umber, light: E.clay, frame: E.amber },
  6: { wood: E.plum, dark: E.ink, light: E.orchid, frame: E.pink },
};

const LIGHT_TINT: Partial<Record<Look, string>> = {
  3: "rgba(254, 174, 52, 0.14)",
  4: "rgba(192, 203, 220, 0.12)",
  5: "rgba(254, 231, 97, 0.12)",
  6: "rgba(181, 80, 136, 0.12)",
};

export class Renderer {
  readonly g: CanvasRenderingContext2D;
  readonly fx: Effects;
  readonly weather = new Weather();
  private readonly lighting = new Lighting();
  private scene: Scene | null = null;
  private room: Room | null = null;
  private time = 0;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly reducedMotion: () => boolean,
  ) {
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.g = canvas.getContext("2d")!;
    this.g.imageSmoothingEnabled = false;
    this.fx = new Effects(reducedMotion);
  }

  setRoom(room: Room) {
    this.room = room;
    this.scene = buildScene(room);
    this.weather.setRoom(room);
    this.fx.clear();
  }

  /** What happened this tick: dust, debris, words. */
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
          this.fx.sparkle(feet.x, p.y, E.white, 4);
          break;
        case "tok":
          if (!e.soft) this.fx.say(e.x, e.y - 12, "TOK", E.cream);
          this.fx.dust(e.x, e.y, 2, 0.8);
          break;
        case "tink":
          this.fx.say(e.x, e.y - 12, "TINK", E.cyan);
          this.fx.sparkle(e.x, e.y, E.cyan, 8);
          break;
        case "fwip":
          this.fx.say(e.x, e.y - 12, "...", E.steel, 34);
          break;
        case "crumble": {
          const f = w.room.floors[e.floor]!;
          if (e.phase === "shake") this.fx.dust(f.x + 8, f.y, 3, 1, E.tan);
          else this.fx.debris(f.x + 8, f.y + 8, E.brown, 10);
          break;
        }
        case "crack": {
          const f = w.room.floors[e.floor]!;
          this.fx.dust(f.x + 8, f.y + 2, 2, 0.6, E.steel);
          break;
        }
        case "pickup": {
          const pick = w.room.pickups[e.index]!;
          this.fx.sparkle(pick.x + 4, pick.y + 2, e.hidden ? E.yellow : E.mist, e.hidden ? 12 : 6);
          this.fx.say(pick.x + 4, pick.y - 12, e.hidden ? "+1 HIDDEN!" : "+1", e.hidden ? E.yellow : E.white);
          break;
        }
        case "key": {
          const key = w.room.key!;
          this.fx.sparkle(key.x + 5, key.y + 5, E.amber, 12);
          this.fx.say(key.x + 5, key.y - 10, "KEY!", E.amber);
          break;
        }
        case "locked":
          this.fx.say(w.room.exit.x + 6, w.room.exit.y - 10, "LOCKED", E.mist);
          break;
        case "net":
          this.fx.say(e.x, e.y - 22, "LOL", E.yellow, 60);
          this.fx.dust(e.x, e.y, 6, 2, E.cream);
          break;
        case "netReturn":
          this.fx.dust(feet.x, feet.y, 5, 1.4);
          break;
        case "win":
          this.fx.confetti(w.room.exit.x + 6, w.room.exit.y + 4);
          break;
        default:
          break;
      }
    }
  }

  /** Per tick: weather and particles. */
  tick(w: World, cam: number, time: number, highContrast: boolean) {
    this.fx.tick();
    this.weather.tick(w, cam, time, highContrast);
    // A crumbling floor sheds a little dust while it shakes.
    w.room.floors.forEach((f, i) => {
      if (f.kind === "crumble" && w.fs.phase[i] === 1 && w.fs.t[i]! % 6 === 0) this.fx.dust(f.x + 3 + (w.fs.t[i]! % 10), f.y + TILE, 1, 0.3, E.tan);
    });
  }

  draw(f: Frame) {
    const { g } = this;
    const w = f.world;
    const room = w.room;
    if (!this.scene || this.room !== room) this.setRoom(room);
    const scene = this.scene!;
    this.time = f.time;
    const cam = Math.round(f.cam);

    g.save();
    if (this.fx.shake > 0 && !this.reducedMotion()) g.translate(Math.round(Math.sin(f.time * 90) * this.fx.shake), Math.round(Math.cos(f.time * 73) * this.fx.shake));

    // Far background, back wall, the painting's middle layer.
    g.drawImage(scene.far, -Math.round(f.cam * FAR_PARALLAX), 0);
    if (scene.wall) g.drawImage(scene.wall, cam, 0, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);
    if (scene.mid) g.drawImage(scene.mid, -Math.round(f.cam * room.env.parallax), 0);

    g.save();
    g.translate(-cam, 0);
    if (room.env.lantern) this.shadows(w, f, cam);
    this.painted(w, f, cam);
    g.restore();

    g.drawImage(scene.rock, cam, 0, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);

    g.save();
    g.translate(-cam, 0);
    this.floors(w, f, cam);
    this.nets(w);
    this.things(w, f);
    for (const s of w.stones) if (s.state !== "gone") g.drawImage(sprite(PEBBLE, "pebble"), Math.round(s.x) - 2, Math.round(s.y) - 3);
    if (f.hero) this.hero(w, f);
    this.weather.drawRain(g);
    this.fx.draw(g);
    g.restore();

    // The darkness (lantern rooms), then what shines through it.
    if (room.env.lantern && room.env.dark > 0) {
      const lights: Array<{ x: number; y: number; r: number }> = room.lanterns.map((l) => {
        const at = lanternAt(l, f.time, this.reducedMotion());
        return { x: at.x - cam, y: at.y, r: f.highContrast ? 170 : 150 };
      });
      const p = w.p;
      lights.push({ x: lerp(f.prev.x, p.x, f.alpha) + p.w / 2 - cam, y: lerp(f.prev.y, p.y, f.alpha) + 4, r: 46 });
      this.lighting.draw(g, room.env.dark, lights, LIGHT_TINT[room.env.look] ?? "rgba(255,255,255,0.08)");
    }

    g.save();
    g.translate(-cam, 0);
    // The Floor's eyes shine in the dark.
    if (scene.eyes.length) this.eyes(scene, w, f);
    if (room.env.lantern) this.lanterns(room, f.time);
    this.weather.drawDust(g);
    this.fx.drawWords(g);
    if (f.aim) this.aim(w, f.aim, f.time);
    this.signs(w, f, cam);
    g.restore();
    g.restore();
  }

  // -------------------------------------------------------------------------------------------

  /** Floors cast shadows on the back wall: real ones swing with the lantern, painted-on ones don't. */
  private shadows(w: World, f: Frame, cam: number) {
    const { g } = this;
    const room = w.room;
    const alpha = f.highContrast ? 0.9 : 0.72;
    g.fillStyle = `rgba(24, 20, 37, ${alpha})`;
    for (let i = 0; i < room.floors.length; i++) {
      const fl = room.floors[i]!;
      if (fl.x < cam - 32 || fl.x > cam + VIEW_W + 32) continue;
      const lantern = nearestLantern(room, fl.x);
      if (!lantern) return;
      let from: { x: number; y: number } | null = null;
      let x = fl.x;
      switch (fl.kind) {
        case "solid":
        case "crumble":
        case "returnTrip":
        case "flip":
          if (floorSolid(w, i)) from = lanternAt(lantern, f.time, this.reducedMotion());
          break;
        case "mimic":
          from = lanternAtRest(lantern);
          break;
        case "painted":
          from = lanternAtRest(lantern);
          x = this.paintedX(w, i, f.cam);
          break;
        default:
          break;
      }
      if (!from) continue;
      const drop = fl.kind === "crumble" ? w.fs.drop[i]! : 0;
      const { dx, dy } = shadowOffset(fl.x, fl.y, from.x, from.y, f.highContrast);
      g.fillRect(Math.round(x + dx), Math.round(fl.y + dy + drop), TILE, TILE);
    }
  }

  /** The Floor's eyes, in its rock: they follow you, and blink. */
  private eyes(scene: Scene, w: World, f: Frame) {
    const { g } = this;
    const p = w.p;
    const px0 = lerp(f.prev.x, p.x, f.alpha) + p.w / 2;
    const py0 = lerp(f.prev.y, p.y, f.alpha) + 5;
    scene.eyes.forEach((eye, i) => {
      if (eye.x < f.cam - 20 || eye.x > f.cam + VIEW_W + 20) return;
      const r = eye.size;
      const blink = (f.time + i * 1.37) % 4.3 < 0.16;
      g.fillStyle = E.ink;
      g.fillRect(eye.x - r - 1, eye.y - r + 1, r * 2 + 3, r * 2 - 1);
      if (blink) {
        px(g, E.pink, eye.x - r, eye.y, r * 2 + 1, 1);
        return;
      }
      for (let y = -r + 1; y < r; y++) {
        const half = Math.floor(Math.sqrt(r * r - y * y));
        px(g, E.mist, eye.x - half, eye.y + y, half * 2 + 1, 1);
      }
      const dx = px0 - eye.x;
      const dy = py0 - eye.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const reach = r - 2;
      px(g, E.ink, Math.round(eye.x + (dx / d) * reach) - 1, Math.round(eye.y + (dy / d) * reach) - 1, 3, 3);
      px(g, E.hot, Math.round(eye.x + (dx / d) * reach), Math.round(eye.y + (dy / d) * reach), 1, 1);
    });
  }

  /** Where a painted floor appears: it lines up at its rest camera, and slides from there. */
  private paintedX(w: World, i: number, cam: number): number {
    const fl = w.room.floors[i]!;
    if (this.reducedMotion()) return fl.x;
    return fl.x + (1 - w.room.env.parallax) * (cam - restCamera(w.room, i));
  }

  private isFloorish(room: Room, c: number, r: number): boolean {
    const v = cellAt(room, c, r);
    if (v < 0) return false;
    const kind = room.floors[v]!.kind;
    return kind !== "invisible";
  }

  /** World 5: floors that are only paint, on the background. */
  private painted(w: World, f: Frame, cam: number) {
    const { g } = this;
    const room = w.room;
    for (let i = 0; i < room.floors.length; i++) {
      const fl = room.floors[i]!;
      if (fl.kind !== "painted" || fl.x < cam - 64 || fl.x > cam + VIEW_W + 64) continue;
      const x = Math.round(this.paintedX(w, i, f.cam));
      g.drawImage(floorTile(room.env.look, "aligned", f.highContrast), x, fl.y);
      drawEnds(g, x, fl.y, !this.isFloorish(room, fl.c - 1, fl.r) && cellAt(room, fl.c - 1, fl.r) !== ROCK, !this.isFloorish(room, fl.c + 1, fl.r) && cellAt(room, fl.c + 1, fl.r) !== ROCK);
      if (this.reducedMotion()) {
        // Reduced motion: no sliding, so painted floors wear a faint picture frame instead.
        g.save();
        g.strokeStyle = f.highContrast ? E.ink : "rgba(24, 20, 37, 0.65)";
        g.setLineDash([2, 2]);
        g.strokeRect(x + 1.5, fl.y + 1.5, TILE - 3, TILE - 3);
        g.restore();
      }
    }
  }

  private floors(w: World, f: Frame, cam: number) {
    const { g } = this;
    const room = w.room;
    const look = room.env.look;
    const grout = room.env.grout;
    const hc = f.highContrast;
    const tone = { 1: E.umber, 2: E.dusk, 3: E.cocoa, 4: E.slate, 5: E.umber, 6: E.plum }[look];
    for (let i = 0; i < room.floors.length; i++) {
      const fl = room.floors[i]!;
      if (fl.kind === "painted" || fl.x < cam - TILE || fl.x > cam + VIEW_W) continue;
      const leftOpen = !this.isFloorish(room, fl.c - 1, fl.r) && cellAt(room, fl.c - 1, fl.r) !== ROCK;
      const rightOpen = !this.isFloorish(room, fl.c + 1, fl.r) && cellAt(room, fl.c + 1, fl.r) !== ROCK;
      switch (fl.kind) {
        case "solid":
        case "mimic":
          g.drawImage(floorTile(look, "aligned", hc), fl.x, fl.y);
          drawEnds(g, fl.x, fl.y, leftOpen, rightOpen);
          break;
        case "fake":
          g.drawImage(floorTile(look, grout ? "offset" : "aligned", hc), fl.x, fl.y);
          drawEnds(g, fl.x, fl.y, leftOpen, rightOpen);
          break;
        case "crumble": {
          const phase = w.fs.phase[i]!;
          const drop = w.fs.drop[i]!;
          if (phase === 2 && drop >= VIEW_H) break;
          const jitter = phase === 1 && !this.reducedMotion() ? (Math.floor(w.fs.t[i]! / 2) % 2 ? 1 : -1) : 0;
          if (phase === 2) g.globalAlpha = Math.max(0, 1 - drop / 120);
          g.drawImage(floorTile(look, "aligned", hc), fl.x + jitter, fl.y + drop);
          drawCracks(g, fl.x + jitter, fl.y + drop, fl.c + fl.r, hc ? E.ink : tone);
          drawEnds(g, fl.x + jitter, fl.y + drop, leftOpen, rightOpen);
          g.globalAlpha = 1;
          break;
        }
        case "returnTrip": {
          const turned = w.fs.crossed[i] === 2;
          g.drawImage(floorTile(look, turned && grout ? "offset" : "aligned", hc), fl.x, fl.y);
          if (turned) drawReturnCrack(g, fl.x, fl.y, hc ? E.ink : tone);
          drawEnds(g, fl.x, fl.y, leftOpen, rightOpen);
          break;
        }
        case "flip": {
          const solid = w.fs.phase[i] === 0;
          const soon = fl.flip ? ticksToFlip(fl.flip, w.tick) : 99;
          const wobble = soon < 30 && !this.reducedMotion() ? (Math.floor(soon / 3) % 2 ? 1 : 0) : 0;
          g.drawImage(floorTile(look, solid || !grout ? "aligned" : "offset", hc), fl.x, fl.y + wobble);
          drawEnds(g, fl.x, fl.y + wobble, leftOpen, rightOpen);
          if (soon < 30) {
            // The shimmer before a flip: a bright line sweeps across.
            const sweep = Math.floor((1 - soon / 30) * (TILE + 6)) - 3;
            g.globalAlpha = 0.75;
            for (let k = 0; k < TILE; k++) px(g, E.white, fl.x + Math.max(0, Math.min(TILE - 1, sweep - Math.floor(k / 3))), fl.y + wobble + k, 1, 1);
            g.globalAlpha = 1;
          }
          break;
        }
        case "invisible": {
          const glow = w.fs.reveal[i]!;
          if (glow > 0) {
            const a = Math.min(1, glow / 60);
            g.fillStyle = `rgba(44, 232, 245, ${0.22 * a})`;
            g.fillRect(fl.x, fl.y, TILE, TILE);
            g.strokeStyle = `rgba(44, 232, 245, ${0.9 * a})`;
            g.lineWidth = 1;
            g.strokeRect(fl.x + 0.5, fl.y + 0.5, TILE - 1, TILE - 1);
            px(g, `rgba(255,255,255,${a})`, fl.x + 2, fl.y + 2, 3, 1);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  /** Safety nets: a rope mesh at the bottom of the pit. */
  private nets(w: World) {
    const { g } = this;
    const room = w.room;
    const sagAt = w.net > 0 && w.caught ? w.caught.x + 5 : null;
    const sagBy = w.net > 0 ? Math.max(0, 8 - w.net / 3) : 0;
    for (let c = 0; c < room.cols; c++) {
      if (!room.nets[c]) continue;
      const x0 = c * TILE;
      for (let x = x0; x < x0 + TILE; x++) {
        const sag = sagAt !== null ? Math.max(0, sagBy - Math.abs(x - sagAt) / 6) : 0;
        const y = VIEW_H - 8 + Math.round(sag + Math.sin(x / 9) * 0.5);
        px(g, E.cream, x, y, 1, 1);
        if ((x + Math.floor(y / 2)) % 4 === 0) px(g, E.tan, x, y + 1, 1, 6);
      }
      if (!room.nets[c - 1]) {
        px(g, E.umber, x0 - 1, VIEW_H - 14, 3, 14);
        px(g, E.brown, x0, VIEW_H - 14, 1, 14);
      }
      if (!room.nets[c + 1]) {
        px(g, E.umber, x0 + TILE - 2, VIEW_H - 14, 3, 14);
        px(g, E.brown, x0 + TILE - 1, VIEW_H - 14, 1, 14);
      }
    }
  }

  /** Pebbles to pick up, the key, signposts, the door. */
  private things(w: World, f: Frame) {
    const { g } = this;
    const room = w.room;
    const time = f.time;
    room.pickups.forEach((pick, i) => {
      if (w.taken & (1 << i)) return;
      if (pick.hidden) {
        g.drawImage(sprite(PEBBLE, "pebble"), pick.x + 2, pick.y + 4);
        // A glint every few seconds: that's all you get.
        const phase = (time + i * 0.7) % 2.6;
        if (phase < 0.3) {
          g.globalAlpha = 1 - phase * 3;
          px(g, E.white, pick.x + 2, pick.y + 2, 5, 1);
          px(g, E.white, pick.x + 4, pick.y, 1, 5);
          g.globalAlpha = 1;
        }
      } else {
        const bob = Math.round(Math.sin(time * 3 + i) * 1);
        g.drawImage(sprite(PEBBLE_PILE, "pile"), pick.x, pick.y + 2 + bob);
      }
    });
    if (room.key && !w.key) {
      const bob = Math.round(Math.sin(time * 2.5) * 2);
      g.drawImage(sprite(KEY, "key"), room.key.x - 1, room.key.y + 1 + bob);
    }
    for (const s of room.signs) {
      px(g, E.umber, s.x - 1, s.y - 10, 2, 10);
      px(g, E.ink, s.x - 8, s.y - 17, 16, 9);
      px(g, E.brown, s.x - 7, s.y - 16, 14, 7);
      px(g, E.tan, s.x - 7, s.y - 16, 14, 1);
      for (const ly of [-14, -12]) px(g, E.umber, s.x - 5, s.y + ly, 10, 1);
    }
    this.door(w);
  }

  private door(w: World) {
    const { g } = this;
    const room = w.room;
    const look = room.env.look;
    const c = DOOR[look];
    const x = room.exit.x - 2;
    const y = room.exit.y - 1;
    const open = w.status === "won";
    // Frame and an EXIT sign.
    px(g, E.ink, x - 1, y - 1, 18, 26);
    px(g, c.frame, x, y, 16, 25);
    px(g, E.ink, x + 2, y + 2, 12, 23);
    if (open) {
      px(g, E.yellow, x + 3, y + 3, 10, 22);
      px(g, E.white, x + 5, y + 5, 6, 20);
      px(g, c.wood, x + 3, y + 3, 3, 22);
    } else {
      px(g, c.wood, x + 3, y + 3, 10, 22);
      px(g, c.light, x + 3, y + 3, 10, 1);
      px(g, c.dark, x + 7, y + 4, 1, 21);
      px(g, c.dark, x + 4, y + 11, 8, 1);
      px(g, E.amber, x + 10, y + 14, 2, 2);
      if (room.key && !w.key) {
        // A padlock.
        px(g, E.ink, x + 5, y + 12, 6, 6);
        px(g, E.amber, x + 6, y + 13, 4, 4);
        px(g, E.ink, x + 6, y + 9, 1, 3);
        px(g, E.ink, x + 9, y + 9, 1, 3);
        px(g, E.ink, x + 6, y + 9, 4, 1);
        px(g, E.ink, x + 7, y + 14, 2, 2);
      }
    }
    px(g, E.ink, x + 1, y - 9, 14, 7);
    px(g, E.moss, x + 2, y - 8, 12, 5);
    pixelText(g, "EXIT", x + 1 + Math.floor((14 - textWidth("EXIT")) / 2), y - 8, E.white);
  }

  private hero(w: World, f: Frame) {
    const { g } = this;
    const p = w.p;
    if (w.net > 0 && w.caught) {
      // Bounced out of the net, in an arc back to safe ground.
      const u = w.net / NET_TICKS;
      const from = w.caught;
      const to = w.safe;
      if (u < 0.25) {
        const sink = Math.sin((u / 0.25) * Math.PI) * 5;
        drawInspector(g, "fall", p.facing, from.x, from.y + sink, 1.2, 0.8);
      } else {
        const k = (u - 0.25) / 0.75;
        const top = Math.min(from.y, to.y) - 60;
        const x = lerp(from.x, to.x, k);
        const y = (1 - k) * (1 - k) * from.y + 2 * (1 - k) * k * top + k * k * to.y;
        drawInspector(g, k < 0.5 ? "jump" : "fall", to.x < from.x ? -1 : 1, x, y);
      }
      return;
    }
    const x = lerp(f.prev.x, p.x, f.alpha);
    const y = lerp(f.prev.y, p.y, f.alpha);
    const frame = inspectorFrame(p, f.time, { looking: f.looking, throwing: f.sinceThrow < 12 });
    drawInspector(g, frame, p.facing, x, y, this.fx.squashX, this.fx.squashY);
    if (f.looking && p.grounded) {
      // A little "look" mark above the hat.
      const dir = p.facing;
      const bx = Math.round(x + 5 + dir * 9);
      const by = Math.round(y - 9);
      px(g, E.white, bx - 1, by, 3, 1);
      px(g, E.white, bx + dir * 2, by - 1, 1, 3);
    }
  }

  private lanterns(room: Room, time: number) {
    const { g } = this;
    const look = room.env.look;
    for (const l of room.lanterns) {
      const at = lanternAt(l, time, this.reducedMotion());
      // The chain.
      const steps = Math.ceil(l.len / 3);
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        px(g, k % 2 ? E.steel : E.slate, l.x + (at.x - l.x) * t, at.y * t, 1, 2);
      }
      if (look === 4) g.drawImage(sprite(CHANDELIER, "chandelier"), Math.round(at.x) - 7, Math.round(at.y) - 4);
      else g.drawImage(sprite(LANTERN, "lantern"), Math.round(at.x) - 4, Math.round(at.y) - 3);
    }
  }

  /** The throw: a dotted arc to where the pebble would land. */
  private aim(w: World, aim: { x: number; y: number }, time: number) {
    const { g } = this;
    const from = handOf(w, aim.x);
    const { vx, vy, ticks } = lobTo(from, aim.x, aim.y);
    let x = from.x;
    let y = from.y;
    let v = vy;
    g.fillStyle = "rgba(255, 255, 255, 0.85)";
    const offset = Math.floor(time * 20) % 4;
    for (let k = 0; k < ticks; k++) {
      v += 0.2;
      x += vx;
      y += v;
      if ((k + offset) % 4 === 0) g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    const ax = Math.round(aim.x);
    const ay = Math.round(aim.y);
    px(g, E.ink, ax - 4, ay - 1, 9, 3);
    px(g, E.ink, ax - 1, ay - 4, 3, 9);
    px(g, E.white, ax - 3, ay, 7, 1);
    px(g, E.white, ax, ay - 3, 1, 7);
  }

  /** A sign's words, when you're close enough to read them. */
  private signs(w: World, f: Frame, cam: number) {
    const { g } = this;
    const p = w.p;
    const cx = lerp(f.prev.x, p.x, f.alpha) + p.w / 2;
    for (const s of w.room.signs) {
      if (Math.abs(cx - s.x) > 56 || Math.abs(p.y + p.h - s.y) > 40) continue;
      const lines = wrapPixelText(s.text, 168);
      const width = Math.max(...lines.map((l) => textWidth(l))) + 10;
      const height = lines.length * 7 + 7;
      const bx = Math.round(Math.max(cam + 4, Math.min(cam + VIEW_W - width - 4, s.x - width / 2)));
      const by = Math.round(s.y - 24 - height);
      px(g, E.ink, bx - 1, by - 1, width + 2, height + 2);
      px(g, E.cream, bx, by, width, height);
      px(g, E.ink, Math.round(s.x) - 2, by + height + 1, 5, 1);
      px(g, E.ink, Math.round(s.x) - 1, by + height + 2, 3, 1);
      px(g, E.cream, Math.round(s.x) - 1, by + height, 3, 1);
      lines.forEach((line, k) => pixelText(g, line, bx + 5, by + 4 + k * 7, E.cocoa));
    }
  }
}

