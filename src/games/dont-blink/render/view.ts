// The camera view (Plan/14-dont-blink.md §9 "Visuals", §12): the room as it is right now, through a CCTV
// camera: a green cast, film grain, a slow rolling band, static when you switch and a glitch when a fix snaps
// back. Your office is your own eyes: no grade at all. Kept cheap for phones (the canvas postfx lessons): each
// room is drawn once into its own buffer and only redrawn when something in it changes; the grain is one small
// noise tile; scanlines and the vignette are CSS. With Reduce flashing on, static and power cuts are drawn as a
// soft veil (the blur is CSS, on the canvas), never as flashing noise or black.
import { VIEW_H, VIEW_W } from "../core/constants";
import type { Game } from "../core/game";
import type { CameraId, ObjState } from "../core/types";
import { SCENES } from "../scenes";
import { drawScene } from "../scenes/render";
import type { VisitorPose } from "../scenes/visitor";

/** How the Visitor holds itself, by how far along its route it is: the closer, the less it hides its face. */
export const POSES: readonly VisitorPose[] = ["cover", "cover", "peek", "reach", "reach"];

type VisitorLook = { pose: VisitorPose; hat?: boolean } | null;

export function visitorIn(game: Pick<Game, "visitorRoom" | "visitorStep">, camera: CameraId): VisitorLook {
  if (game.visitorRoom !== camera || camera === "office") return null;
  return { pose: POSES[game.visitorStep] ?? "reach" };
}

function signature(camera: CameraId, states: ReadonlyMap<string, ObjState>, visitor: VisitorLook): string {
  let key = visitor ? `${visitor.pose}${visitor.hat ? "h" : ""}|` : "|";
  for (const o of SCENES[camera].objects) {
    const s = states.get(o.id) ?? o.base;
    key += `${s.x | 0},${s.y | 0},${s.visible ? 1 : 0},${s.variant},${(s.tint * 50) | 0};`;
  }
  return key;
}

function makeNoise(w: number, h: number, lo: number, hi: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  const img = g.createImageData(w, h);
  let seed = 1234567;
  for (let i = 0; i < w * h; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = lo + ((seed >> 8) % (hi - lo));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

/** Draw a room into a fresh canvas (the reference photo, the post-credits photo). */
export function paintRoom(camera: CameraId, scale: number, opts: { states?: ReadonlyMap<string, ObjState>; visitor?: VisitorLook } = {}): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(VIEW_W * scale);
  canvas.height = Math.round(VIEW_H * scale);
  const g = canvas.getContext("2d")!;
  g.scale(scale, scale);
  const states = opts.states ?? new Map(SCENES[camera].objects.map((o) => [o.id, o.base] as const));
  drawScene(g, SCENES[camera], { states, visitor: opts.visitor ?? null, t: 0 });
  return canvas;
}

export interface DrawOptions {
  reduceFlashing: boolean;
  /** Seconds, for the grain and the rolling band. */
  time: number;
}

export class ViewRenderer {
  private readonly g: CanvasRenderingContext2D;
  private readonly buffers = new Map<CameraId, { canvas: HTMLCanvasElement; key: string }>();
  private grain: HTMLCanvasElement | null = null;
  private staticNoise: HTMLCanvasElement | null = null;
  /** Lower quality (a slow device): one pixel per CSS pixel, and no grain. */
  low = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d", { alpha: false })!;
  }

  /** Fit the canvas to its box (CSS pixels). */
  resize(width: number, height: number) {
    const dpr = Math.min(this.low ? 1 : 2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    if (w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.buffers.clear();
  }

  /** The room as it is (cached until something in it changes). */
  private room(camera: CameraId, states: ReadonlyMap<string, ObjState>, visitor: VisitorLook): HTMLCanvasElement {
    const key = signature(camera, states, visitor);
    let buffer = this.buffers.get(camera);
    if (!buffer) {
      const canvas = document.createElement("canvas");
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      buffer = { canvas, key: "" };
      this.buffers.set(camera, buffer);
    }
    if (buffer.key !== key) {
      const g = buffer.canvas.getContext("2d")!;
      g.setTransform(buffer.canvas.width / VIEW_W, 0, 0, buffer.canvas.height / VIEW_H, 0, 0);
      drawScene(g, SCENES[camera], { states, visitor, t: 0 });
      buffer.key = key;
    }
    return buffer.canvas;
  }

  draw(game: Game, { reduceFlashing, time }: DrawOptions) {
    const g = this.g;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const k = W / VIEW_W;
    const camera = game.camera;
    const office = camera === "office";
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";

    // Switching: a burst of static (or, turning to or from your office, a quick dark sweep).
    if (game.static > 0 && !reduceFlashing) {
      this.static(time, office || game.from === "office");
      return;
    }

    const room = this.room(camera, game.states, visitorIn(game, camera));
    g.save();
    if (game.mirrored(camera)) {
      g.translate(W, 0);
      g.scale(-1, 1);
    }
    g.drawImage(room, 0, 0, W, H);
    g.restore();

    if (!office) {
      // The CCTV grade: a green cast, grain and a slow rolling band.
      g.fillStyle = "rgba(20, 64, 44, 0.2)";
      g.fillRect(0, 0, W, H);
      if (!this.low) {
        this.grain ??= makeNoise(320, 200, 0, 255);
        g.globalAlpha = 0.07;
        const ox = Math.floor(Math.random() * 60);
        const oy = Math.floor(Math.random() * 40);
        g.drawImage(this.grain, -ox * k, -oy * k, W + 60 * k, H + 40 * k);
        g.globalAlpha = 1;
      }
      const band = ((time * 36) % (VIEW_H + 60)) - 30;
      g.fillStyle = "rgba(220, 255, 235, 0.035)";
      g.fillRect(0, band * k, W, 22 * k);
    }

    // A fix snapping back: a little horizontal tear.
    if (game.fix > 0 && !reduceFlashing && !office) {
      for (let i = 0; i < 4; i++) {
        const y = Math.floor(((Math.sin(time * 91 + i * 7) + 1) / 2) * H);
        const h = Math.floor((6 + i * 5) * k);
        const dx = Math.floor((Math.sin(time * 53 + i) * 18) * k);
        g.drawImage(this.canvas, 0, y, W, h, dx, y, W, h);
      }
    }

    // A power cut: the feed drops out.
    const dark = game.flickerDark;
    if (dark > 0) {
      g.fillStyle = reduceFlashing ? `rgba(16, 22, 20, ${0.45 * dark})` : `rgba(0, 0, 0, ${dark})`;
      g.fillRect(0, 0, W, H);
    }

    // Static with Reduce flashing: a soft grey veil (the canvas is blurred too).
    if (game.static > 0 && reduceFlashing) {
      g.fillStyle = "rgba(96, 110, 104, 0.55)";
      g.fillRect(0, 0, W, H);
    }
  }

  private static(time: number, office: boolean) {
    const g = this.g;
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (office) {
      // Turning your head: a quick dark sweep, no static.
      g.fillStyle = "#050605";
      g.fillRect(0, 0, W, H);
      return;
    }
    this.staticNoise ??= makeNoise(240, 150, 30, 210);
    const ox = Math.floor(Math.random() * 40);
    const oy = Math.floor(Math.random() * 30);
    g.drawImage(this.staticNoise, ox, oy, 200, 120, 0, 0, W, H);
    for (let i = 0; i < 5; i++) {
      const y = Math.floor(((Math.sin(time * 70 + i * 13) + 1) / 2) * H);
      g.fillStyle = i % 2 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.18)";
      g.fillRect(0, y, W, Math.floor(H / 30));
    }
  }
}
