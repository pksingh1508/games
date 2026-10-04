// Draws a moment of a run (Plan/07-glitch-run.md §9, §12): the world first, onto its own canvas, then
// the screen's lies on top of it (the glitches' presentation layer: tearing, pixelation, inversion,
// noise, the frozen frame), and last the truth layer: the runner's shadow, always at its real
// position. Canvas 2D only (no WebGL), sized to the screen's real pixels. Every effect is cheap: no
// full-screen filters (the RGB split is drawn into the line art itself; the scanlines are the play
// screen's CSS), and if frames still run long, the quality steps down by itself (fewer pixels, then
// no noise).
import { GROUND_ROW, RUNNER_W, RUNNER_X, ROWS, TILE, VIEW_H, VIEW_W } from "../core/constants";
import { SCAN_SPAN, scanScreenX, type Run } from "../core/run";
import { BAR, BIT, HIDDEN, isSolid, PATCH, SOLID, SPIKES, type Track } from "../core/track";
import type { Look } from "../glitches/present";
import { AMBER, checker, CYAN, drawBar, drawBit, drawDebugger, drawExit, drawPatch, drawRunner, drawSpikes, GRID, INK, PANEL, PINK, VIOLET, VOID, WHITE, type Pose } from "./art";
import { Particles } from "./particles";

/** The runner at a tick (the screen can show an old one: Audio Desync, Ghost Double). */
export interface Snapshot {
  tick: number;
  x: number;
  y: number;
  h: number;
  sliding: boolean;
  grounded: boolean;
  vy: number;
  clip: number;
  status: "run" | "dead" | "won";
}

export interface Frame {
  /** What the screen shows (an old moment under Audio Desync), and the tick before it. */
  shown: Snapshot;
  shownPrev: Snapshot;
  /** The truth (for the shadow). */
  live: Snapshot;
  livePrev: Snapshot;
  /** Ghost Double: the copy, a moment behind. */
  ghost: Snapshot | null;
  run: Run;
  look: Look;
  /** Seconds, for things that move whether or not you do. */
  time: number;
  alpha: number;
  /** 0–1: how close The Debugger is (its chases), and how charged its next scan is. */
  debugger: number;
  charge: number;
  panic: boolean;
  reduceMotion: boolean;
  /** The last stage's finale: how far the deletion behind you has come (0 at the screen's left edge, 1 just behind you; null: none), and how white the screen has gone (0–1). */
  deleting: number | null;
  whiteout: number;
  /** A line from The Debugger's console (the finale), or null. */
  caption: string | null;
  /** What the exit says ("EXIT", or "/root" at the end of everything). */
  exitLabel: string;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (a: number, b: number) => {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
};

/** Quality steps: the most device pixels per CSS pixel, and whether noise is drawn. */
const QUALITY = [
  { dpr: 2, noise: true },
  { dpr: 1.5, noise: true },
  { dpr: 1, noise: false },
] as const;

export class Renderer {
  readonly g: CanvasRenderingContext2D;
  readonly fx = new Particles();
  private scene: HTMLCanvasElement;
  private sg: CanvasRenderingContext2D;
  private small: HTMLCanvasElement;
  private frozen: HTMLCanvasElement;
  private noise: CanvasPattern;
  private vignette: HTMLCanvasElement;
  private holding = false;
  /** Canvas pixels per screen unit (480 × 272). */
  private k = 1;
  private shake = 0;
  /** 0 is the best; see QUALITY. */
  quality = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    this.scene = document.createElement("canvas");
    this.sg = this.scene.getContext("2d")!;
    this.small = document.createElement("canvas");
    this.frozen = document.createElement("canvas");
    this.noise = this.g.createPattern(makeNoise(), "repeat")!;
    this.vignette = makeVignette();
    this.resize();
  }

  /** Frames are running long: fewer pixels (then no noise). False when it can't go any lower. */
  degrade(): boolean {
    if (this.quality >= QUALITY.length - 1) return false;
    this.quality++;
    return true;
  }

  private resize() {
    const dpr = Math.min(QUALITY[this.quality]!.dpr, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
    const w = Math.max(VIEW_W, Math.round((this.canvas.clientWidth || VIEW_W) * dpr));
    const h = Math.max(VIEW_H, Math.round((this.canvas.clientHeight || VIEW_H) * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = this.scene.width = this.frozen.width = w;
      this.canvas.height = this.scene.height = this.frozen.height = h;
    }
    this.k = Math.min(w / VIEW_W, h / VIEW_H);
  }

  /** A hit: shake (never with reduce motion). */
  bump(amount: number) {
    this.shake = Math.max(this.shake, amount);
  }

  draw(f: Frame) {
    this.resize();
    const { g } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const look = f.look;
    this.shake = Math.max(0, this.shake - 0.4);

    // A frozen screen (Frame Skip, Not Responding): the last picture stays; only the truth moves.
    if (look.hold !== "none") {
      if (!this.holding) {
        this.frozen.getContext("2d")!.drawImage(this.canvas, 0, 0);
        this.holding = true;
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(this.frozen, 0, 0);
      if (look.hold === "skip") this.drawShadow(f);
      return;
    }
    this.holding = false;

    this.drawScene(f);

    // The screen's lies. (The scene covers the screen unless it's turned or shaking.)
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    if (look.flip > 0 || (this.shake > 0 && !f.reduceMotion)) {
      g.fillStyle = INK;
      g.fillRect(0, 0, W, H);
    }
    let src: HTMLCanvasElement = this.scene;
    if (look.pixel > 1) {
      const sw = Math.max(1, Math.round(VIEW_W / look.pixel));
      const sh = Math.max(1, Math.round(VIEW_H / look.pixel));
      if (this.small.width !== sw || this.small.height !== sh) {
        this.small.width = sw;
        this.small.height = sh;
      }
      const s = this.small.getContext("2d")!;
      s.imageSmoothingEnabled = true;
      s.drawImage(this.scene, 0, 0, sw, sh);
      src = this.small;
    }
    g.save();
    this.screenTransform(f);
    g.imageSmoothingEnabled = look.pixel <= 1;
    const tear = Math.round(look.tear * this.k);
    if (tear !== 0) {
      // The top half is honest; the bottom half slides sideways (wrapping round).
      const half = Math.round(H / 2);
      const sh = src.height / 2;
      g.drawImage(src, 0, 0, src.width, sh, 0, 0, W, half);
      g.drawImage(src, 0, sh, src.width, src.height - sh, tear, half, W, H - half);
      g.drawImage(src, 0, sh, src.width, src.height - sh, tear - Math.sign(tear) * W, half, W, H - half);
      g.fillStyle = PINK;
      g.globalAlpha = 0.7;
      g.fillRect(0, half - 1, W, 2);
      g.globalAlpha = 1;
    } else g.drawImage(src, 0, 0, W, H);
    g.restore();

    if (look.invert > 0) {
      g.globalCompositeOperation = "difference";
      g.globalAlpha = look.invert;
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
    if (look.tint > 0) {
      g.globalCompositeOperation = "hue";
      g.globalAlpha = look.tint;
      g.fillStyle = VIOLET;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
    if (look.dejaVu > 0) this.drawTape(f, W, H);
    // Noise: bands of static across the screen (more of them, the worse it gets).
    if (look.noise > 0.01 && QUALITY[this.quality]!.noise) {
      const frame = Math.floor(f.time * 30);
      this.noise.setTransform(new DOMMatrix([1, 0, 0, 1, Math.floor(hash(frame, 1) * 128), Math.floor(hash(frame, 2) * 128)]));
      g.fillStyle = this.noise;
      g.globalAlpha = Math.min(0.75, 0.3 + look.noise);
      const bands = 1 + Math.round(look.noise * 8);
      for (let i = 0; i < bands; i++) g.fillRect(0, hash(frame, i + 3) * H, W, (3 + hash(i, frame) * 18) * this.k);
      g.globalAlpha = 1;
    }
    if (f.panic) {
      g.globalAlpha = 0.75 + Math.sin(f.time * 6) * 0.25;
      g.drawImage(this.vignette, 0, 0, W, H);
      g.globalAlpha = 1;
    }

    // The truth layer.
    this.drawShadow(f);
  }

  /** Upside Down (turned about the middle), and a shake on a hard hit. */
  private screenTransform(f: Frame) {
    const { g } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (f.look.flip > 0) {
      g.translate(W / 2, H / 2);
      g.rotate(Math.PI * f.look.flip);
      g.translate(-W / 2, -H / 2);
    }
    if (this.shake > 0 && !f.reduceMotion) g.translate(Math.sin(f.time * 90) * this.shake * this.k, Math.cos(f.time * 70) * this.shake * this.k);
  }



  /** The world, at the moment the screen is showing. */
  private drawScene(f: Frame) {
    const g = this.sg;
    const k = this.k;
    const W = this.scene.width;
    const H = this.scene.height;
    const look = f.look;
    const x = lerp(f.shownPrev.x, f.shown.x, f.alpha);
    const camX = x - RUNNER_X;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = INK;
    g.fillRect(0, 0, W, H);
    g.setTransform(k, 0, 0, k, (W - VIEW_W * k) / 2, (H - VIEW_H * k) / 2);
    this.drawBackground(g, camX, f.time);
    // The finale: the ground behind you goes (the front follows you in from the left edge).
    const deleteX = f.deleting === null ? null : camX + lerp(-TILE, RUNNER_X - 34, f.deleting);
    g.save();
    g.translate(-camX, 0);
    this.drawTrack(g, f.run.track, camX, f.time, look, deleteX);
    if (f.run.config.finishCol !== null) drawExit(g, f.run.config.finishCol * TILE + RUNNER_W, GROUND_ROW * TILE, f.exitLabel, f.time);
    if (deleteX !== null) this.drawCrumbs(g, deleteX, f.time);
    this.fx.draw(g);
    g.restore();
    this.drawScans(g, f);
    // The white void: everything's been reformatted, except you (and its eye).
    const blank = f.whiteout > 0.5;
    if (f.whiteout > 0) {
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = f.whiteout;
      g.fillStyle = VOID;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
    if (f.caption) {
      g.font = "bold 10px ui-monospace, Menlo, monospace";
      g.textAlign = "center";
      g.fillStyle = blank ? INK : WHITE;
      const cursor = Math.floor(f.time * 2) % 2 ? "_" : " ";
      g.fillText(`${f.caption}${cursor}`, VIEW_W / 2, 58);
      g.textAlign = "start";
    }
    // The runner (and the ghost).
    if (f.ghost && f.shown.status !== "dead") this.drawFigure(g, f.ghost, f.ghost, 1, camX + 22, f.time, look, 0.9, blank);
    if (f.shown.status !== "dead") this.drawFigure(g, f.shown, f.shownPrev, f.alpha, camX, f.time, look, 1, blank);
    if (f.debugger > 0) drawDebugger(g, -26 + f.debugger * 40 + Math.sin(f.time * 1.3) * 3, 112 + Math.sin(f.time * 0.9) * 10, 64, f.time, f.charge);
  }

  /** Bits of deleted ground, falling away behind the deletion's front. */
  private drawCrumbs(g: CanvasRenderingContext2D, front: number, time: number) {
    for (let i = 0; i < 14; i++) {
      const life = (time * 1.4 + i / 14) % 1;
      const x = front - 4 - hash(i, 1) * 30 - life * 18;
      const y = GROUND_ROW * TILE + hash(i, 2) * 40 + life * life * 110;
      const size = 3 + hash(i, 3) * 4;
      g.globalAlpha = 1 - life;
      g.fillStyle = PANEL;
      g.fillRect(x, y, size, size);
      g.strokeStyle = CYAN;
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
    g.globalAlpha = 1;
  }

  private drawBackground(g: CanvasRenderingContext2D, camX: number, time: number) {
    // A grid, far away (it scrolls slower than the track).
    g.strokeStyle = GRID;
    g.lineWidth = 1;
    const gx = -((camX * 0.4) % 36);
    g.beginPath();
    for (let x = gx; x < VIEW_W; x += 36) {
      g.moveTo(x, 0);
      g.lineTo(x, VIEW_H);
    }
    for (let y = 0; y < VIEW_H; y += 36) {
      g.moveTo(0, y);
      g.lineTo(VIEW_W, y);
    }
    g.stroke();
    // Data falling in the distance.
    g.fillStyle = "rgba(0,245,212,0.07)";
    g.font = "9px ui-monospace, Menlo, monospace";
    for (let i = 0; i < 18; i++) {
      const col = Math.floor(camX * 0.2 / 27) + i;
      const sx = col * 27 - camX * 0.2;
      const fall = (time * (14 + hash(col, 7) * 20) + hash(col, 3) * VIEW_H) % (VIEW_H + 60);
      for (let j = 0; j < 5; j++) g.fillText(hash(col, j) > 0.5 ? "1" : "0", sx, fall - j * 11);
    }
  }

  private drawTrack(g: CanvasRenderingContext2D, track: Track, camX: number, time: number, look: Look, deleteX: number | null) {
    const c0 = Math.floor(camX / TILE) - 1;
    const c1 = c0 + Math.ceil(VIEW_W / TILE) + 2;
    /** Deleted (the finale): whole columns behind the front, and a ragged edge at it. */
    const gone = (c: number, r: number) => deleteX !== null && (c + 1) * TILE <= deleteX + hash(c, r) * TILE;
    for (let c = c0; c <= c1; c++) {
      for (let r = 0; r < ROWS; r++) {
        const cell = track.cell(c, r);
        if (cell === 0 || gone(c, r)) continue;
        const x = c * TILE;
        const y = r * TILE;
        if (cell === SOLID) {
          if (look.missing) checker(g, x, y, TILE, TILE);
          else {
            g.fillStyle = PANEL;
            g.fillRect(x, y, TILE, TILE);
          }
        } else if (cell === BAR) {
          drawBar(g, x, y, TILE, TILE, time, look.missing);
        } else if (cell === SPIKES) {
          drawSpikes(g, x, y, TILE, !isSolid(track.cell(c, r + 1)) && isSolid(track.cell(c, r - 1)), look.missing);
        } else if (cell === BIT) {
          drawBit(g, x + TILE / 2, y + TILE / 2, hash(c, r) > 0.5, time);
        } else if (cell === PATCH) {
          drawPatch(g, x + TILE / 2, y + TILE / 2, time);
        } else if (cell === HIDDEN && look.reveal > 0) {
          g.globalAlpha = look.reveal;
          g.fillStyle = "rgba(179,136,255,0.25)";
          g.fillRect(x, y, TILE, TILE);
          g.strokeStyle = VIOLET;
          g.setLineDash([3, 3]);
          g.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
          g.setLineDash([]);
          g.globalAlpha = 1;
        }
      }
    }
    // Neon edges: every edge of data that meets the open air.
    if (look.missing) return;
    g.lineWidth = 1.5;
    g.beginPath();
    for (let c = c0; c <= c1; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (track.cell(c, r) !== SOLID || gone(c, r)) continue;
        const x = c * TILE;
        const y = r * TILE;
        const open = (dc: number, dr: number) => {
          const v = track.cell(c + dc, r + dr);
          return (v !== SOLID && v !== BAR) || gone(c + dc, r + dr);
        };
        if (open(0, -1)) {
          g.moveTo(x, y + 0.75);
          g.lineTo(x + TILE, y + 0.75);
        }
        if (open(-1, 0) && r < ROWS) {
          g.moveTo(x + 0.75, y);
          g.lineTo(x + 0.75, y + TILE);
        }
        if (open(1, 0)) {
          g.moveTo(x + TILE - 0.75, y);
          g.lineTo(x + TILE - 0.75, y + TILE);
        }
        if (open(0, 1) && r < ROWS - 1) {
          g.moveTo(x, y + TILE - 0.75);
          g.lineTo(x + TILE, y + TILE - 0.75);
        }
      }
    }
    // The RGB split: pink and pale copies of the edges, pulled apart as the screen breaks.
    if (look.rgb > 0.3) {
      const d = Math.min(5, look.rgb);
      g.save();
      g.globalAlpha = 0.6;
      g.strokeStyle = PINK;
      g.translate(-d, 0);
      g.stroke();
      g.strokeStyle = "#B8FFF4";
      g.translate(d * 2, 0);
      g.stroke();
      g.restore();
    }
    g.strokeStyle = CYAN;
    g.stroke();
  }

  private drawScans(g: CanvasRenderingContext2D, f: Frame) {
    const scans = f.run.config.scans ?? [];
    const tick = f.shown.tick + f.alpha;
    for (const s of scans) {
      const sx = scanScreenX(f.run.config, s, tick);
      if (sx < -6 || sx > VIEW_W + 2) continue;
      const [top, bottom] = SCAN_SPAN[s.kind];
      g.fillStyle = "rgba(230,241,255,0.18)";
      g.fillRect(sx - 6, top, 15, bottom - top);
      g.fillStyle = WHITE;
      g.fillRect(sx, top, 3, bottom - top);
      // The gap you go through, marked.
      g.fillStyle = AMBER;
      if (s.kind === "low") g.fillRect(sx - 4, top - 2, 11, 2);
      if (s.kind === "high") g.fillRect(sx - 4, bottom, 11, 2);
    }
  }

  private drawFigure(g: CanvasRenderingContext2D, s: Snapshot, prev: Snapshot, alpha: number, camX: number, time: number, look: Look, opacity: number, blank = false) {
    const x = lerp(prev.x, s.x, alpha) - camX;
    const y = lerp(prev.y, s.y, alpha);
    const pose: Pose = s.sliding ? "slide" : !s.grounded ? (s.vy < 0 ? "jump" : "fall") : "run";
    const feetX = x + RUNNER_W / 2;
    const feetY = y + s.h;
    g.save();
    g.globalAlpha = opacity * (s.clip > 0 ? 0.45 + 0.35 * Math.sin(time * 60) : 1);
    // Cyan and pink copies come apart as the screen breaks.
    const split = 1 + look.rgb;
    g.translate(feetX, feetY);
    g.save();
    g.translate(-split, 0);
    g.globalAlpha *= 0.7;
    drawRunner(g, pose, time, CYAN);
    g.restore();
    g.save();
    g.translate(split, 0);
    g.globalAlpha *= 0.7;
    drawRunner(g, pose, time, PINK);
    g.restore();
    drawRunner(g, pose, time, blank ? INK : WHITE, look.swap);
    if (s.clip > 0) {
      // Clipping: little blocks of nothing round you.
      g.fillStyle = CYAN;
      for (let i = 0; i < 5; i++) g.fillRect(-10 + hash(Math.floor(time * 30), i) * 20, -22 + hash(i, Math.floor(time * 30)) * 22, 3, 2);
    }
    g.restore();
  }

  /** The runner's shadow: always under where you really are (the main truth anchor). */
  private drawShadow(f: Frame) {
    const { g } = this;
    if (f.live.status === "dead" || f.look.notResponding) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const k = this.k;
    const shownX = lerp(f.shownPrev.x, f.shown.x, f.alpha);
    const liveX = lerp(f.livePrev.x, f.live.x, f.alpha);
    const liveY = lerp(f.livePrev.y, f.live.y, f.alpha);
    // On the screen: where you really are, against the camera the screen is showing.
    const sx = RUNNER_X + (liveX - shownX) + RUNNER_W / 2;
    const feet = liveY + f.live.h;
    // The surface under you.
    const col = Math.floor((liveX + RUNNER_W / 2) / TILE);
    let surface = -1;
    for (let r = Math.max(0, Math.floor(feet / TILE)); r < ROWS; r++) {
      if (isSolid(f.run.track.cell(col, r))) {
        surface = r * TILE;
        break;
      }
    }
    g.save();
    g.setTransform(k, 0, 0, k, (W - VIEW_W * k) / 2, (H - VIEW_H * k) / 2);
    if (f.look.flip > 0) {
      g.translate(VIEW_W / 2, VIEW_H / 2);
      g.rotate(Math.PI * f.look.flip);
      g.translate(-VIEW_W / 2, -VIEW_H / 2);
    }
    const y = surface >= 0 ? surface : GROUND_ROW * TILE + 40;
    const height = Math.max(0, y - feet);
    const w = Math.max(6, 14 - height * 0.08);
    // Light on the dark screen; dark in the white void.
    const tone = f.whiteout > 0.5 ? "7,7,13" : "230,241,255";
    g.fillStyle = `rgba(${tone},${surface >= 0 ? 0.55 : 0.25})`;
    g.beginPath();
    g.ellipse(sx, y - 1, w, 2.4, 0, 0, Math.PI * 2);
    g.fill();
    // A thin line up to you, so it's easy to find in the chaos.
    g.strokeStyle = `rgba(${tone},0.35)`;
    g.lineWidth = 1;
    g.setLineDash([2, 3]);
    g.beginPath();
    g.moveTo(sx, y - 2);
    g.lineTo(sx, Math.min(y - 2, feet));
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  /** Déjà vu: an old tape's colours, tracking lines, "PLAY". */
  private drawTape(f: Frame, W: number, H: number) {
    const { g } = this;
    const a = f.look.dejaVu;
    g.globalCompositeOperation = "color";
    g.globalAlpha = 0.45 * a;
    g.fillStyle = "#C8A060";
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 0.5 * a;
    g.fillStyle = "#ffffff";
    const band = ((f.time * 90) % (H + 40)) - 20;
    g.fillRect(0, band, W, 3 * this.k);
    g.globalAlpha = a;
    g.fillStyle = WHITE;
    g.font = `bold ${Math.round(12 * this.k)}px ui-monospace, Menlo, monospace`;
    g.textAlign = "right";
    // Under the HUD's top right corner.
    g.fillText("▶ PLAY  (again)", W - 14 * this.k, 56 * this.k);
    g.globalAlpha = 1;
  }
}

/** Kernel Panic's pink edges, drawn small (a soft gradient scales up without a seam). */
function makeVignette(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 192;
  c.height = 108;
  const g = c.getContext("2d")!;
  const v = g.createRadialGradient(96, 54, 30, 96, 54, 134);
  v.addColorStop(0, "rgba(255,46,136,0)");
  v.addColorStop(1, "rgba(255,46,136,0.36)");
  g.fillStyle = v;
  g.fillRect(0, 0, 192, 108);
  return c;
}

function makeNoise(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(hash(i, 99) * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = hash(i, 5) > 0.7 ? 160 : 0;
  }
  g.putImageData(img, 0, 0);
  return c;
}
