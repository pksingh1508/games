// Draws a moment of Super Happy Jump! (Plan/04-dont-trust-the-game.md §9) on the 480 × 272 canvas. The level's
// still parts (sky, ground, signs, the cells a flag decides) are painted once into a layer and repainted only when a
// flag changes; the moving parts (coins that spin and the one that doesn't, paper spikes in the wind, the saw, the
// portal, wobbling credits, the hero) are drawn every frame on top.
import { pixelText, textWidth } from "@/engine/pixel-font";
import { createCamera, followCamera, shakeCamera, shakeOffset, type Camera } from "@/engine/platformer/camera";
import { HEIGHT, TILE, WIDTH } from "../core/constants";
import { CELL, cellAt, levelHeight, levelWidth, type Level } from "../core/level";
import { sawPosition, type World, type WorldEvent } from "../core/world";
import { CREDITS_SCALE } from "../levels";
import { heroSprite, LOOKS, type HeroFrame, type Look } from "./art";

export interface Frame {
  world: World;
  /** The hero one tick ago (smooth motion on fast screens). */
  prev: { x: number; y: number };
  alpha: number;
  /** Seconds, for animations. */
  time: number;
  /** The Options menu's brightness (0–1); 1 elsewhere. */
  brightness: number;
  /** Show the whole level (the safe frame's off). */
  zoom: boolean;
  /** The game is breaking: occasional tears in the picture (0–1). Never with Reduce flashing. */
  glitch: number;
  reducedMotion: boolean;
  reduceFlashing: boolean;
  /** Draw the hero (not during the death puff). */
  hero: boolean;
}

const fill = (g: CanvasRenderingContext2D, colour: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = colour;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};

const textCache = new Map<string, HTMLCanvasElement>();

/** Pixel text as a cached sprite (credits lines are drawn every frame). */
function textSprite(text: string, colour: string, scale: number): HTMLCanvasElement {
  const id = `${text}|${colour}|${scale}`;
  const hit = textCache.get(id);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = Math.max(1, textWidth(text, scale));
  c.height = 5 * scale;
  pixelText(c.getContext("2d")!, text, 0, 0, colour, scale);
  textCache.set(id, c);
  return c;
}

export class Renderer {
  readonly g: CanvasRenderingContext2D;
  private layer: HTMLCanvasElement | null = null;
  private layerKey = "";
  readonly camera: Camera = createCamera();
  private puffs: Array<{ x: number; y: number; t: number }> = [];
  private flattenedAt = new Map<string, number>();

  constructor(
    readonly canvas: HTMLCanvasElement,
    private level: Level,
  ) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.g = canvas.getContext("2d")!;
    this.g.imageSmoothingEnabled = false;
    this.snapCamera(level.spawn.x, level.spawn.y);
  }

  setLevel(level: Level) {
    this.level = level;
    this.layer = null;
    this.puffs = [];
    this.snapCamera(level.spawn.x, level.spawn.y);
  }

  /** Bounds the camera keeps to: the safe frame, or the whole level. */
  private bounds(zoom: boolean): { x: number; y: number; w: number; h: number } {
    const f = this.level.frame;
    if (f && !zoom) return f;
    return { x: 0, y: 0, w: levelWidth(this.level), h: levelHeight(this.level) };
  }

  snapCamera(x: number, y: number) {
    const b = this.bounds(false);
    this.camera.x = Math.max(b.x, Math.min(b.x + b.w - WIDTH, x - WIDTH / 2));
    this.camera.y = Math.max(b.y, Math.min(b.y + b.h - HEIGHT, y - HEIGHT / 2));
  }

  onEvents(events: readonly WorldEvent[], w: World) {
    for (const e of events) {
      if (e.type === "die") {
        this.puffs.push({ x: e.x, y: e.y, t: 0 });
        shakeCamera(this.camera, 3);
      }
      if (e.type === "door" && e.kind === "fake") this.flattenedAt.set(e.id, w.tick);
      if (e.type === "land" && e.impact > 4.5) shakeCamera(this.camera, 1.5);
    }
  }

  draw(f: Frame) {
    const { world: w } = f;
    const g = this.g;
    const look = LOOKS[this.level.theme];
    const key = `${w.flags.easy}${w.flags.hard}${w.flags.squeezed}${w.flags.fixed}${w.flags.open}`;
    if (!this.layer || key !== this.layerKey) {
      this.layer = paintLayer(this.level, w, look);
      this.layerKey = key;
    }

    // Camera: follow the hero inside the bounds (or show everything, zoomed out).
    const hx = f.prev.x + (w.p.x - f.prev.x) * f.alpha;
    const hy = f.prev.y + (w.p.y - f.prev.y) * f.alpha;
    const b = this.bounds(f.zoom);
    const view = { w: WIDTH, h: HEIGHT };
    followCamera(this.camera, { x: hx + w.p.w / 2, y: hy + w.p.h / 2 }, view, { w: b.w, h: b.h }, { deadX: 36, deadY: 28, lerp: 0.18 });
    this.camera.x = Math.max(b.x, Math.min(b.x + Math.max(0, b.w - WIDTH), this.camera.x));
    this.camera.y = Math.max(b.y, Math.min(b.y + Math.max(0, b.h - HEIGHT), this.camera.y));
    if (b.w < WIDTH) this.camera.x = b.x - (WIDTH - b.w) / 2;
    if (b.h < HEIGHT) this.camera.y = b.y - (HEIGHT - b.h) / 2;
    const shake = shakeOffset(this.camera, f.reducedMotion);

    g.setTransform(1, 0, 0, 1, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, look.skyTop);
    sky.addColorStop(1, look.skyBottom);
    g.fillStyle = sky;
    g.fillRect(0, 0, WIDTH, HEIGHT);
    const zoomed = f.zoom && (b.w > WIDTH || b.h > HEIGHT);
    let scale = 1;
    let ox: number;
    let oy: number;
    if (zoomed) {
      scale = Math.min(WIDTH / b.w, HEIGHT / b.h);
      ox = Math.round((WIDTH - b.w * scale) / 2);
      oy = Math.round((HEIGHT - b.h * scale) / 2);
      g.setTransform(scale, 0, 0, scale, ox - b.x * scale, oy - b.y * scale);
    } else {
      ox = -Math.round(this.camera.x) + shake.x;
      oy = -Math.round(this.camera.y) + shake.y;
      if (this.level.theme === "tutorial") this.drawTutorialSky(f.time);
      g.setTransform(1, 0, 0, 1, ox, oy);
    }

    g.drawImage(this.layer, 0, 0);
    this.drawHidden(w, f.brightness);
    this.drawPaper(w, f.time, f.reducedMotion);
    this.drawThings(w, f);
    if (f.hero && w.status === "play") this.drawHero(w, hx, hy, f.time);
    this.drawPuffs();

    if (zoomed && this.level.frame) {
      // The safe frame's edge, so you can see what was hiding outside it.
      const fr = this.level.frame;
      g.strokeStyle = "#ff6fa8";
      g.lineWidth = 2 / scale;
      g.setLineDash([6 / scale, 4 / scale]);
      g.strokeRect(fr.x, fr.y, fr.w, fr.h);
      g.setLineDash([]);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);

    if (f.brightness < 1) {
      g.fillStyle = `rgba(4, 2, 10, ${(0.9 * (1 - f.brightness)).toFixed(3)})`;
      g.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (f.glitch > 0 && !f.reduceFlashing) this.tear(f.time, f.glitch);
  }

  // -- Parts --------------------------------------------------------------------------------------------------

  private drawTutorialSky(time: number) {
    const g = this.g;
    // The happy sun (it stays in the sky while the level scrolls), and clouds drifting slower than the ground.
    const sx = 410;
    const sy = 46;
    g.fillStyle = "#ffd23f";
    g.beginPath();
    g.arc(sx, sy, 22, 0, Math.PI * 2);
    g.fill();
    fill(g, "#2d1b4e", sx - 8, sy - 6, 3, 4);
    fill(g, "#2d1b4e", sx + 5, sy - 6, 3, 4);
    g.strokeStyle = "#2d1b4e";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(sx, sy + 2, 8, 0.2 * Math.PI, 0.8 * Math.PI);
    g.stroke();
    fill(g, "#ff8fc0", sx - 14, sy + 2, 4, 2);
    fill(g, "#ff8fc0", sx + 10, sy + 2, 4, 2);
    const drift = (-this.camera.x * 0.2 + time * 4) % 600;
    for (const [cx, cy] of [
      [60, 40],
      [250, 70],
      [520, 30],
    ] as const) {
      const x = ((cx + drift + 600) % 700) - 80;
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.ellipse(x, cy, 26, 9, 0, 0, Math.PI * 2);
      g.ellipse(x + 14, cy - 6, 15, 9, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  /** The Options menu's hidden platforms: they fade in as the brightness goes up. */
  private drawHidden(w: World, brightness: number) {
    const alpha = Math.max(0, Math.min(1, (brightness - 0.55) / 0.35));
    if (alpha <= 0) return;
    const g = this.g;
    g.globalAlpha = alpha;
    const L = w.level;
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        if (cellAt(L, c, r) !== CELL.hidden) continue;
        fill(g, "#8d7bc4", c * TILE, r * TILE, TILE, TILE);
        fill(g, "#c7b8ff", c * TILE, r * TILE, TILE, 3);
        fill(g, "#5b4a86", c * TILE, r * TILE + TILE - 2, TILE, 2);
      }
    }
    g.globalAlpha = 1;
  }

  /** Paper spikes: like the real ones, but white and pink, and their tips flutter in the wind. */
  private drawPaper(w: World, time: number, reduced: boolean) {
    const g = this.g;
    const L = w.level;
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        if (cellAt(L, c, r) !== CELL.paper) continue;
        for (let k = 0; k < 3; k++) {
          const sway = reduced ? 1 : Math.round(Math.sin(time * 7 + c * 1.7 + k * 2.1) * 1.6);
          const bx = c * TILE + k * 5 + 1;
          const by = r * TILE + TILE;
          g.fillStyle = k % 2 ? "#ffe3f0" : "#ffffff";
          g.beginPath();
          g.moveTo(bx, by);
          g.lineTo(bx + 2.5 + sway, by - 11);
          g.lineTo(bx + 5, by);
          g.closePath();
          g.fill();
          g.strokeStyle = "#e7a6c6";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(bx + 2.5, by);
          g.lineTo(bx + 2.5 + sway, by - 11);
          g.stroke();
        }
      }
    }
  }

  private drawThings(w: World, f: Frame) {
    const g = this.g;
    const L = w.level;
    const t = f.time;

    // Real coins spin; taken ones are gone.
    L.coins.forEach((c, i) => {
      if (w.coins[i]) return;
      const spin = f.reducedMotion ? 1 : Math.abs(Math.cos(t * 5 + i));
      const cw = Math.max(2, Math.round(10 * spin));
      const x = c.x + (10 - cw) / 2;
      fill(g, "#d9a21b", x, c.y, cw, 12);
      fill(g, "#ffc93c", x + 1, c.y + 1, Math.max(1, cw - 2), 10);
      if (cw > 5) fill(g, "#fff3b0", x + 2, c.y + 2, 2, 5);
    });
    // The coin that doesn't spin: always face-on, with four tiny points.
    for (const c of L.fakeCoins) {
      fill(g, "#d9a21b", c.x, c.y, 10, 12);
      fill(g, "#ffc93c", c.x + 1, c.y + 1, 8, 10);
      fill(g, "#fff3b0", c.x + 2, c.y + 2, 2, 5);
      fill(g, "#d9a21b", c.x + 4, c.y - 2, 2, 2);
      fill(g, "#d9a21b", c.x + 4, c.y + 12, 2, 2);
      fill(g, "#d9a21b", c.x - 2, c.y + 5, 2, 2);
      fill(g, "#d9a21b", c.x + 10, c.y + 5, 2, 2);
    }

    // Doors.
    for (const d of L.doors) {
      const { x, y } = d.rect;
      if (d.kind === "fake") {
        const flatAt = this.flattenedAt.get(d.id);
        if (w.flattened.has(d.id)) {
          const k = flatAt === undefined ? 1 : Math.min(1, (w.tick - flatAt) / 12);
          if (k < 1) {
            g.save();
            g.translate(x + 16, y + 32);
            g.rotate((Math.PI / 2) * k);
            drawCardboard(g, -16, -32);
            g.restore();
          } else {
            fill(g, "#b5895a", x - 14, y + 28, 30, 4);
            fill(g, "#8a6440", x - 14, y + 31, 30, 1);
          }
        } else drawCardboard(g, x, y);
        continue;
      }
      if (d.kind === "frame" && !w.flags.fixed) {
        drawFrame(g, x, y, t);
        continue;
      }
      drawDoor(g, x, y, d.kind === "locked" && !w.flags.open ? "locked" : d.kind === "locked" ? "open" : "door", L.theme);
    }

    // The checkpoints: little flags.
    for (const k of L.checkpoints) {
      const on = w.respawnAt.x === k.x + 3 && w.respawnAt.y === k.y + 2;
      fill(g, "#2d1b4e", k.x + 3, k.y - 8, 1, 24);
      fill(g, on ? "#7cf2b5" : "#ffffff", k.x + 4, k.y - 8, 7, 5);
    }

    // The gap at the end of the loading bar, and the blocks.
    const notch = L.notch;
    if (notch && !w.blocks.some((bl) => bl.loaded)) {
      g.strokeStyle = "#7af0ff";
      g.lineWidth = 1;
      g.setLineDash([2, 2]);
      g.strokeRect(notch.x + 0.5, notch.y + 0.5, notch.w - 1, notch.h - 1);
      g.setLineDash([]);
    }
    for (const bl of w.blocks) {
      fill(g, "#0b3b4a", bl.x, bl.y, bl.w, bl.h);
      fill(g, "#4fe3ff", bl.x + 1, bl.y + 1, bl.w - 2, bl.h - 2);
      fill(g, "#bff6ff", bl.x + 1, bl.y + 1, bl.w - 2, 2);
      pixelText(g, "1%", bl.x + 4, bl.y + 6, "#0b3b4a");
    }

    // Saws: a loading spinner with teeth.
    L.saws.forEach((saw, i) => {
      const at = sawPosition(w, i);
      const spin = f.reducedMotion ? 0 : t * 9;
      g.fillStyle = "#3a3560";
      g.beginPath();
      g.arc(at.x, at.y, saw.radius, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 8; k++) {
        const a = spin + (k * Math.PI) / 4;
        const ox = Math.cos(a) * (saw.radius - 2);
        const oy = Math.sin(a) * (saw.radius - 2);
        g.fillStyle = k === 0 ? "#ffffff" : `rgba(233, 231, 255, ${0.3 + k * 0.09})`;
        g.fillRect(Math.round(at.x + ox - 1), Math.round(at.y + oy - 1), 3, 3);
        g.fillStyle = "#e9e7ff";
        g.fillRect(Math.round(at.x + Math.cos(a + 0.4) * (saw.radius + 1)), Math.round(at.y + Math.sin(a + 0.4) * (saw.radius + 1)), 1, 1);
      }
    });

    // Portals shimmer.
    for (const p of L.portals) {
      for (let k = 0; k < 4; k++) {
        const phase = (t * 1.6 + k / 4) % 1;
        const inset = Math.round(phase * Math.min(p.rect.w, p.rect.h) * 0.45);
        g.strokeStyle = ["#ff6fa8", "#7af0ff", "#ffd23f", "#b48cff"][k]!;
        g.globalAlpha = 1 - phase;
        g.lineWidth = 2;
        g.strokeRect(p.rect.x + inset + 1, p.rect.y + inset + 1, p.rect.w - inset * 2 - 2, p.rect.h - inset * 2 - 2);
      }
      g.globalAlpha = 1;
    }

    // Levers, stickers, buttons.
    for (const lv of L.levers) {
      fill(g, "#5a5580", lv.rect.x + 3, lv.rect.y + 11, 10, 5);
      const on = f.zoom;
      g.strokeStyle = on ? "#7cf2b5" : "#ff6fa8";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(lv.rect.x + 8, lv.rect.y + 12);
      g.lineTo(lv.rect.x + (on ? 13 : 3), lv.rect.y + 3);
      g.stroke();
      fill(g, on ? "#7cf2b5" : "#ff6fa8", lv.rect.x + (on ? 11 : 1), lv.rect.y + 1, 4, 4);
    }
    for (const s of L.stickers) {
      if (w.taken.has(s.id)) continue;
      drawStar(g, s.rect.x + 6, s.rect.y + 6, 6, "#ffd23f", t);
    }
    for (const bt of L.buttons) {
      const r = bt.rect;
      if (bt.id === "more-games") {
        // The More Games sign, hiding in the dark with the platforms.
        g.globalAlpha = Math.max(0, Math.min(1, (f.brightness - 0.55) / 0.35));
        fill(g, "#ffd23f", r.x - 4, r.y - 2, r.w + 8, r.h + 2);
        fill(g, "#2d1b4e", r.x - 3, r.y - 1, r.w + 6, r.h);
        pixelText(g, "MORE", r.x + (r.w - textWidth("MORE")) / 2, r.y + 4, "#ffd23f");
        pixelText(g, "GAMES", r.x + (r.w - textWidth("GAMES")) / 2, r.y + 12, "#ffd23f");
        fill(g, "#ffd23f", r.x + r.w / 2 - 1, r.y + r.h, 2, 2);
        g.globalAlpha = 1;
        continue;
      }
      const quit = bt.id === "quit";
      fill(g, quit ? "#7e1f48" : "#1f5e4a", r.x, r.y + 2, r.w, r.h - 2);
      fill(g, quit ? "#ff6fa8" : "#7cf2b5", r.x + 1, r.y, r.w - 2, r.h - 4);
      const label = quit ? "QUIT" : "STAY";
      pixelText(g, label, r.x + (r.w - textWidth(label, 2)) / 2, r.y + 8, "#2d1b4e", 2);
    }

    // The credits: every line a ledge; the one you stand on wobbles.
    L.names.forEach((n, i) => {
      const sprite = textSprite(n.text, "#ffffff", CREDITS_SCALE);
      const wob = i === w.standing && !f.reducedMotion ? Math.round(Math.sin(t * 16) * 1.5) : 0;
      const x = n.col * TILE + (n.cols * TILE - sprite.width) / 2;
      g.drawImage(sprite, Math.round(x + wob), n.row * TILE - sprite.height - 3 + (i === w.standing ? 1 : 0));
    });
  }

  private drawHero(w: World, x: number, y: number, time: number) {
    const p = w.p;
    let frame: HeroFrame;
    if (!p.grounded) frame = p.vy < 0 ? "jump" : "fall";
    else if (Math.abs(p.vx) > 0.4) frame = (["run0", "run1", "run2", "run3"] as const)[Math.floor(p.x / 6) % 4]!;
    else frame = time % 3.4 < 0.14 ? "blink" : "idle";
    const sprite = heroSprite(frame, p.facing < 0);
    this.g.drawImage(sprite, Math.round(x - 1), Math.round(y));
  }

  private drawPuffs() {
    const g = this.g;
    this.puffs = this.puffs.filter((p) => p.t < 18);
    for (const p of this.puffs) {
      p.t++;
      const r = 3 + p.t * 0.9;
      g.globalAlpha = Math.max(0, 1 - p.t / 18);
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        fill(g, k % 2 ? "#ff8fc0" : "#2d1b4e", p.x + Math.cos(a) * r - 1.5, p.y + Math.sin(a) * r - 1.5, 3, 3);
      }
      g.globalAlpha = 1;
    }
  }

  /** Tears: a few horizontal strips of the picture shifted sideways for a frame. */
  private tear(time: number, amount: number) {
    const g = this.g;
    const k = Math.floor(time * 12);
    if ((k * 7919) % 100 >= amount * 22) return;
    for (let i = 0; i < 3; i++) {
      const y = ((k * 131 + i * 977) % (HEIGHT - 12)) | 0;
      const h = 2 + ((k + i * 3) % 7);
      const dx = (((k * 37 + i * 11) % 13) - 6) * 2;
      g.drawImage(this.canvas, 0, y, WIDTH, h, dx, y, WIDTH, h);
    }
  }
}

function drawCardboard(g: CanvasRenderingContext2D, x: number, y: number) {
  fill(g, "#8a6440", x, y, 16, 32);
  fill(g, "#c8a06a", x + 1, y + 1, 14, 30);
  for (let k = 3; k < 30; k += 4) fill(g, "#b5895a", x + 1, y + k, 14, 1);
  fill(g, "#6b4a2c", x + 10, y + 15, 2, 2);
  pixelText(g, "EXIT", x + 1, y + 4, "#7e1f48");
}

function drawDoor(g: CanvasRenderingContext2D, x: number, y: number, state: "door" | "locked" | "open", theme: string) {
  const plain = theme === "console" || theme === "error";
  fill(g, plain ? "#6f6f80" : "#2d1b4e", x, y, 16, 32);
  if (state === "open") {
    fill(g, "#1a0f2e", x + 2, y + 2, 12, 30);
    fill(g, "#fff3b0", x + 3, y + 3, 4, 28);
    return;
  }
  fill(g, plain ? "#a8a8b8" : "#c2306f", x + 2, y + 2, 12, 30);
  fill(g, plain ? "#c9c9d6" : "#e0558f", x + 3, y + 3, 10, 2);
  fill(g, "#ffd23f", x + 10, y + 16, 2, 2);
  if (state === "locked") {
    fill(g, "#3a3a46", x + 5, y + 12, 6, 5);
    fill(g, "#3a3a46", x + 6, y + 9, 4, 1);
    fill(g, "#3a3a46", x + 6, y + 9, 1, 3);
    fill(g, "#3a3a46", x + 9, y + 9, 1, 3);
    fill(g, "#ffd23f", x + 7, y + 14, 2, 2);
  }
}

/** An empty door frame with a broken-image icon: "door.png not found". */
function drawFrame(g: CanvasRenderingContext2D, x: number, y: number, t: number) {
  g.strokeStyle = "#ff6fa8";
  g.lineWidth = 2;
  g.setLineDash([3, 2]);
  g.strokeRect(x + 1, y + 1, 14, 31);
  g.setLineDash([]);
  const flick = Math.floor(t * 3) % 2;
  fill(g, flick ? "#ff6fa8" : "#c2306f", x + 4, y + 10, 8, 7);
  fill(g, "#160b24", x + 5, y + 11, 6, 5);
  fill(g, "#7cf2b5", x + 6, y + 14, 2, 1);
  fill(g, "#ffd23f", x + 9, y + 12, 1, 1);
}

function drawStar(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, colour: string, t: number) {
  g.save();
  g.translate(cx, cy);
  g.rotate(Math.sin(t * 2) * 0.2);
  g.fillStyle = colour;
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI) / 5 - Math.PI / 2;
    const rr = k % 2 ? r * 0.45 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
  g.restore();
}

/** The level's still parts, for the current flags. */
function paintLayer(level: Level, w: World, look: Look): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = levelWidth(level);
  c.height = levelHeight(level);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  // The tutorial's sky stays behind (the sun and clouds go between it and the ground); the rest paint theirs in.
  if (level.theme !== "tutorial") {
    const sky = g.createLinearGradient(0, 0, 0, c.height);
    sky.addColorStop(0, look.skyTop);
    sky.addColorStop(1, look.skyBottom);
    g.fillStyle = sky;
    g.fillRect(0, 0, c.width, c.height);
  }
  backdrop(g, level, look);

  for (let r = 0; r < level.rows; r++) {
    for (let col = 0; col < level.cols; col++) {
      const cell = cellAt(level, col, r);
      const x = col * TILE;
      const y = r * TILE;
      const above = cellAt(level, col, r - 1);
      switch (cell) {
        case CELL.solid:
          block(g, x, y, look, above === CELL.air || above === CELL.paper || above === CELL.spike);
          break;
        case CELL.plain:
          fill(g, look.ground, x, y, TILE, TILE);
          if (above !== CELL.plain) fill(g, look.groundTop, x, y, TILE, 2);
          break;
        case CELL.ledge:
          fill(g, look.ledge, x, y, TILE, 4);
          fill(g, look.groundDark, x, y + 4, TILE, 1);
          break;
        case CELL.spike:
          for (let k = 0; k < 3; k++) {
            const bx = x + k * 5 + 1;
            g.fillStyle = "#5c6178";
            g.beginPath();
            g.moveTo(bx, y + TILE);
            g.lineTo(bx + 2.5, y + 5);
            g.lineTo(bx + 5, y + TILE);
            g.closePath();
            g.fill();
            fill(g, "#c9cde0", bx + 2, y + 7, 1, 6);
          }
          break;
        case CELL.easy:
          if (w.flags.easy) {
            fill(g, "#7e1f48", x, y, TILE, TILE);
            fill(g, "#c2306f", x + 1, y + 1, TILE - 2, TILE - 2);
          }
          break;
        case CELL.hard:
          if (w.flags.hard) {
            fill(g, "#ffd23f", x, y, TILE, 5);
            fill(g, "#b8860b", x, y + 5, TILE, 2);
            fill(g, "#b8860b", x + 7, y, 2, 5);
          }
          break;
        case CELL.bar:
          fill(g, "#e9e7ff", x, y, TILE, TILE);
          fill(g, "#3fd2ff", x + 1, y + 2, TILE - 2, TILE - 4);
          fill(g, "#8ff0ff", x + 1, y + 2, TILE - 2, 2);
          break;
        case CELL.dot:
          g.fillStyle = "#e9e7ff";
          g.beginPath();
          g.arc(x + 8, y + 4, 4, 0, Math.PI * 2);
          g.fill();
          break;
        case CELL.digit:
        case CELL.bonk:
          fill(g, "#3a3a46", x, y, TILE, TILE);
          fill(g, "#555564", x + 1, y + 1, TILE - 2, 2);
          break;
        case CELL.wall:
        case CELL.wallLow: {
          if (cell === CELL.wallLow && w.flags.squeezed) {
            // Squeezed: the bottom of the wall folded up like an accordion.
            fill(g, "#3b2a55", x, y, TILE, 4);
            fill(g, "#5b3f80", x, y, TILE, 1);
            break;
          }
          fill(g, "#3b2a55", x, y, TILE, TILE);
          fill(g, "#5b3f80", x + ((r % 2) * 8), y, 8, 1);
          fill(g, "#241838", x, y + 8, TILE, 1);
          break;
        }
        case CELL.name:
          fill(g, look.ledge, x, y, TILE, 2);
          break;
        default:
          break;
      }
    }
  }
  if (w.flags.easy) {
    const e = findCells(level, CELL.easy);
    if (e) pixelText(g, "EASY? NAH.", e.x + (e.w - textWidth("EASY? NAH.", 1)) / 2, e.y + e.h / 2 - 20, "#ffffff");
  }
  if (w.flags.hard) {
    const h = findCells(level, CELL.hard);
    if (h) pixelText(g, "HARD MODE", h.x + (h.w - textWidth("HARD MODE", 1)) / 2, h.y - 9, "#ffd23f");
  }
  for (const s of level.signs) pixelText(g, s.text, s.x, s.y, s.colour ?? look.ink, s.scale ?? 1);
  if (level.notch) pixelText(g, "99%", level.notch.x - 30, level.notch.y - 12, "#7af0ff");
  return c;
}

function findCells(level: Level, kind: number): { x: number; y: number; w: number; h: number } | null {
  let c0 = Infinity;
  let r0 = Infinity;
  let c1 = -1;
  let r1 = -1;
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (cellAt(level, c, r) !== kind) continue;
      c0 = Math.min(c0, c);
      r0 = Math.min(r0, r);
      c1 = Math.max(c1, c);
      r1 = Math.max(r1, r);
    }
  }
  return c1 < 0 ? null : { x: c0 * TILE, y: r0 * TILE, w: (c1 - c0 + 1) * TILE, h: (r1 - r0 + 1) * TILE };
}

function block(g: CanvasRenderingContext2D, x: number, y: number, look: Look, top: boolean) {
  fill(g, look.ground, x, y, TILE, TILE);
  fill(g, look.groundDark, x, y + TILE - 2, TILE, 2);
  fill(g, look.groundDark, x + TILE - 1, y, 1, TILE);
  if (top) {
    fill(g, look.groundTop, x, y, TILE, 4);
    fill(g, "#ffffff", x + 2, y + 1, 3, 1);
  }
}

/** Each scene's scenery. */
function backdrop(g: CanvasRenderingContext2D, level: Level, look: Look) {
  const W = levelWidth(level);
  const H = levelHeight(level);
  switch (level.theme) {
    case "tutorial": {
      // Rolling hills along the bottom.
      g.fillStyle = "#b7ebd2";
      for (let x = -40; x < W + 80; x += 150) {
        g.beginPath();
        g.ellipse(x, H - 40, 110, 70, 0, Math.PI, 0);
        g.fill();
      }
      g.fillStyle = "#6fd39e";
      for (let x = 30; x < W + 80; x += 170) {
        g.beginPath();
        g.ellipse(x, H - 30, 90, 46, 0, Math.PI, 0);
        g.fill();
      }
      break;
    }
    case "options":
      g.strokeStyle = "rgba(141, 123, 196, 0.08)";
      for (let x = 0; x < W; x += 32) g.strokeRect(x + 0.5, 0.5, 32, H);
      break;
    case "loading":
      for (let k = 0; k < 40; k++) fill(g, "rgba(233, 231, 255, 0.35)", (k * 97) % W, (k * 53) % (H - 60), 1, 1);
      break;
    case "error":
      g.fillStyle = "rgba(58, 58, 70, 0.05)";
      g.fillRect(0, 0, W, 20);
      break;
    case "secret": {
      for (let x = 0; x < W; x += 12) fill(g, "rgba(255, 233, 199, 0.05)", x, 0, 6, H);
      // A sofa, a lamp, and a desk with a computer showing the address bar.
      fill(g, "#a14d6a", 60, 196, 90, 28);
      fill(g, "#c2607f", 60, 182, 90, 16);
      fill(g, "#a14d6a", 52, 186, 12, 38);
      fill(g, "#a14d6a", 146, 186, 12, 38);
      fill(g, "#ffd23f", 190, 150, 18, 12);
      fill(g, "#7a4b3a", 198, 162, 2, 62);
      fill(g, "#5a3a2e", 300, 176, 110, 8);
      fill(g, "#2d1b4e", 330, 140, 50, 34);
      fill(g, "#b8f0ff", 333, 143, 44, 28);
      pixelText(g, "?ROOM=", 336, 148, "#2d1b4e");
      pixelText(g, "405", 344, 158, "#c2306f", 2);
      break;
    }
    case "void":
      for (let k = 0; k < 60; k++) fill(g, k % 3 ? "rgba(255, 111, 168, 0.25)" : "rgba(122, 240, 255, 0.2)", (k * 131) % W, (k * 71) % (H - 40), (k % 5) + 1, 1);
      break;
    case "console":
      for (let y = 20; y < H - 40; y += 18) fill(g, "rgba(139, 139, 154, 0.08)", 0, y, W, 1);
      break;
    case "credits":
      for (let k = 0; k < 140; k++) fill(g, k % 7 ? "rgba(255, 255, 255, 0.55)" : "#ffd23f", (k * 173) % W, (k * 89) % H, k % 11 ? 1 : 2, k % 11 ? 1 : 2);
      break;
  }
  void look;
}
