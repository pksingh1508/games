// Draws DeskOS 98 (Plan/12-cursor-escape.md §9): a teal desktop, grey bevelled windows with blue title
// bars, black maze walls on white, and every shape, hazard and lie the OS can come up with. The still
// parts of a level are drawn once (at the screen's real resolution); every frame adds what moves: pop-
// ups, dialogs, the scan line, your trail, the decoys and the cursor itself (always outlined, so it
// shows on anything). The truth is drawn too: the real cursor's tip glows, and sparks where it's near
// a wall, when the OS hides it.
import { blit, pixelSprite } from "@/engine/sprites";
import { CLIENT, DESK_H, DESK_W, MAX_BUTTON, MIN_BUTTON, SEPARATOR, TITLE, WIN } from "../core/constants";
import { type Rect } from "../core/geometry";
import { BAR_H, panelClose, type Hazard, type Panel, type ZoneMode } from "../core/level";
import { marqueeAt, OPEN_TICKS, scanLine, type World } from "../core/sim";
import { BROKEN, CURSOR_PALETTE, CURSORS, type CursorSprite } from "./sprites";

export const C = {
  desk: "#0F7F7F",
  deskDither: "#0C7272",
  face: "#C3C3C3",
  light: "#FFFFFF",
  shadow: "#7E7E7E",
  dark: "#111111",
  title: "#0A2A8A",
  titleEnd: "#1B5FBF",
  idle: "#7B7B9A",
  idleEnd: "#A8A8C0",
  paper: "#FFFFFF",
  wall: "#111111",
  ink: "#111111",
  link: "#0A2ACC",
  yellow: "#FFE14D",
  red: "#D62839",
  green: "#1FA14A",
  note: "#FFFBD6",
} as const;

/** VT323 (next/font's CSS variable), for the windows' titles and text. */
export function deskFont(): string {
  if (typeof document === "undefined") return "monospace";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-g-vt323").trim();
  return value || "monospace";
}

/** Everything the screen needs this frame, beyond the world. */
export interface Frame {
  world: World;
  /** Seconds, for things that move whether or not you do. */
  time: number;
  /** A crash just happened (seconds ago), to show where. */
  crashAge: number;
  reduceMotion: boolean;
  /** The boss's progress bar (0–100), or null. */
  uninstall: number | null;
  /** The window's closing animation (0–1), after you escape. */
  closing: number;
}

export class Renderer {
  private readonly g: CanvasRenderingContext2D;
  private still: HTMLCanvasElement;
  private stillKey = "";
  private k = 1;
  private font = "monospace";
  private fontReady = false;
  private shake = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    this.still = document.createElement("canvas");
    this.font = deskFont();
    if (typeof document !== "undefined" && document.fonts) {
      void document.fonts.load(`16px ${this.font}`).then(() => {
        this.fontReady = true;
        this.stillKey = "";
      });
    }
  }

  bump(amount: number) {
    this.shake = Math.max(this.shake, amount);
  }

  private resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(DESK_W, Math.round((this.canvas.clientWidth || DESK_W) * dpr));
    const h = Math.max(DESK_H, Math.round((this.canvas.clientHeight || DESK_H) * dpr));
    // (Both: another renderer may have sized this canvas already.)
    if (this.canvas.width !== w || this.canvas.height !== h || this.still.width !== w || this.still.height !== h) {
      this.canvas.width = this.still.width = w;
      this.canvas.height = this.still.height = h;
      this.stillKey = "";
    }
    this.k = Math.min(w / DESK_W, h / DESK_H);
  }

  draw(f: Frame) {
    this.resize();
    const { g, k } = this;
    const w = f.world;
    const key = `${w.course.src.id}:${this.canvas.width}:${this.fontReady}`;
    if (key !== this.stillKey) {
      this.drawStill(w);
      this.stillKey = key;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.still, 0, 0);
    this.shake = Math.max(0, this.shake - 0.5);
    const sx = this.shake > 0 && !f.reduceMotion ? Math.round(Math.sin(f.time * 80) * this.shake) / k : 0;
    g.setTransform(k, 0, 0, k, sx * k, 0);

    if (f.closing > 0) {
      this.drawClosing(f);
      return;
    }
    this.drawLive(f);
  }

  // -----------------------------------------------------------------------------------------------
  // The still parts.

  private drawStill(w: World) {
    const g = this.still.getContext("2d")!;
    const k = this.k;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = C.desk;
    g.fillRect(0, 0, this.still.width, this.still.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    // The desktop's dither.
    g.fillStyle = C.deskDither;
    for (let y = 0; y < DESK_H; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < DESK_W; x += 4) g.fillRect(x, y, 2, 2);
    const course = w.course;
    // The window.
    bevel(g, WIN.x, WIN.y, WIN.w, WIN.h, true);
    titleBar(g, TITLE.x - 1, TITLE.y - 1, TITLE.w + 2, TITLE.h + 1, true);
    g.fillStyle = C.light;
    g.font = `16px ${this.font}`;
    g.textBaseline = "middle";
    g.fillText(`${driveLabel(course.src.id)} ${course.src.name}`, TITLE.x + 6, TITLE.y + TITLE.h / 2 + 1);
    titleButton(g, MIN_BUTTON, "min");
    titleButton(g, MAX_BUTTON, "max");
    // The separator and its openings.
    g.fillStyle = C.face;
    g.fillRect(CLIENT.x - 1, SEPARATOR.y, CLIENT.w + 2, SEPARATOR.h);
    g.fillStyle = C.shadow;
    g.fillRect(CLIENT.x - 1, CLIENT.y - 1, CLIENT.w + 2, 1);
    g.fillStyle = C.paper;
    g.fillRect(CLIENT.x, CLIENT.y, CLIENT.w, CLIENT.h);
    for (const [a, b] of course.src.gaps) {
      g.fillStyle = C.paper;
      g.fillRect(a, SEPARATOR.y - 1, b - a, SEPARATOR.h + 2);
      // A torn edge: the title bar's blue fades into the opening.
      const grad = g.createLinearGradient(0, TITLE.y + TITLE.h - 6, 0, SEPARATOR.y + SEPARATOR.h);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(255,255,255,0.9)");
      g.fillStyle = grad;
      g.fillRect(a, TITLE.y + TITLE.h - 6, b - a, SEPARATOR.h + 7);
    }
    // Zones.
    for (const z of course.zones) zone(g, z.rect, z.mode, this.font);
    // Safe files (the antivirus spares what's inside them).
    for (const h of course.hazards) if (h.kind === "scan") for (const r of h.safe) safeFile(g, r, this.font);
    // Links.
    for (const link of course.links) {
      const cx = link.rect.x + link.rect.w / 2;
      const cy = link.rect.y + link.rect.h / 2;
      const halo = g.createRadialGradient(cx, cy, 4, cx, cy, link.reach);
      halo.addColorStop(0, "rgba(10,42,204,0.14)");
      halo.addColorStop(1, "rgba(10,42,204,0)");
      g.fillStyle = halo;
      g.beginPath();
      g.arc(cx, cy, link.reach, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = C.link;
      g.font = `14px ${this.font}`;
      g.textBaseline = "middle";
      g.textAlign = "center";
      g.fillText(link.text, cx, cy);
      g.fillRect(link.rect.x, link.rect.y + link.rect.h - 1, link.rect.w, 1);
      g.textAlign = "start";
    }
    // Walls.
    g.fillStyle = C.wall;
    for (const r of course.src.walls) g.fillRect(r.x, r.y, r.w, r.h);
    // Checkbox labels, icons (the parts that never change).
    g.font = `13px ${this.font}`;
    g.textBaseline = "middle";
    for (const c of course.checkboxes) {
      g.fillStyle = C.ink;
      g.fillText(c.label, c.rect.x + c.rect.w + 4, c.rect.y + c.rect.h / 2);
    }
    // The client area's own inset edge.
    g.fillStyle = C.shadow;
    g.fillRect(CLIENT.x - 1, CLIENT.y - 1, 1, CLIENT.h + 1);
    g.fillStyle = C.face;
    g.fillRect(CLIENT.x + CLIENT.w, CLIENT.y - 1, 1, CLIENT.h + 2);
  }

  // -----------------------------------------------------------------------------------------------
  // What moves.

  private drawLive(f: Frame) {
    const g = this.g;
    const w = f.world;
    const course = w.course;

    // Checkboxes (ticked when set off), icons (until used).
    course.checkboxes.forEach((c, i) => checkbox(g, c.rect, w.checked[i]!));
    course.hazards.forEach((h, i) => {
      if (h.kind === "icon" && !w.hz[i]!.done) icon(g, h.rect, h.label, this.font);
    });

    // The [X].
    const exit = w.exitRect();
    const shiver = w.exitShiver > 0 ? Math.sin(f.time * 90) : 0;
    titleButton(g, { x: exit.x + shiver, y: exit.y, w: exit.w, h: exit.h }, "close");
    if (course.src.exit?.shrink) {
      g.strokeStyle = `rgba(255,225,77,${0.5 + 0.5 * Math.sin(f.time * 7)})`;
      g.lineWidth = 1.5;
      g.strokeRect(exit.x - 2, exit.y - 2, exit.w + 4, exit.h + 4);
    }

    // Hazards.
    course.hazards.forEach((h, i) => this.hazard(h, i, f));

    // Panels: windows, ads, notifications.
    course.panels.forEach((p, i) => {
      const s = w.panels[i]!;
      if (!s.open) return;
      const r = w.panelRect(i);
      if (s.opening > 0) {
        // Opening: an outline zooming out from the middle (not solid yet).
        const k = 1 - s.opening / OPEN_TICKS;
        g.strokeStyle = C.dark;
        g.setLineDash([3, 2]);
        g.lineWidth = 1;
        g.strokeRect(r.x + (r.w * (1 - k)) / 2, r.y + (r.h * (1 - k)) / 2, r.w * k, r.h * k);
        g.setLineDash([]);
        return;
      }
      panel(g, p, r, this.font, w.grab === i);
    });

    // The boss's progress bar.
    if (f.uninstall !== null) uninstallBar(g, f.uninstall, this.font);

    // A solid trail: drawn solid, not fading (the tell).
    if (w.rules.trail > 0 && w.trail.length >= 6) {
      g.strokeStyle = C.dark;
      g.lineWidth = 2;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.beginPath();
      for (let i = 0; i < w.trail.length; i += 3) {
        if (i === 0) g.moveTo(w.trail[i]!, w.trail[i + 1]!);
        else g.lineTo(w.trail[i]!, w.trail[i + 1]!);
      }
      g.stroke();
    }

    // The decoys.
    for (let i = 0; i < w.decoys.length; i += 2) this.cursor(CURSORS.arrow, w.decoys[i]!, w.decoys[i + 1]!, 1, 0, false);

    // You.
    if (w.status === "crashed" && w.crash) {
      this.cursor(BROKEN, w.crash.x, w.crash.y, 1, 0, false);
      const a = Math.max(0, 1 - f.crashAge * 2.5);
      g.strokeStyle = `rgba(214,40,57,${a})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(w.crash.x, w.crash.y, 6 + f.crashAge * 30, 0, Math.PI * 2);
      g.stroke();
      return;
    }
    const fake = w.rules.fake;
    const scale = w.rules.scale;
    const sprite = CURSORS[w.mode];
    // Turned movement (invert, rotate): the arrow's drawn turned the same way (the tell).
    const turn = w.rules.turned ? turnOf(w.rules.m) : { angle: 0, mirror: false };
    if (fake) {
      // The fake one, where the OS says you are; the real one, invisible but for the glow and sparks.
      this.cursor(sprite, w.x + fake.dx, w.y + fake.dy, scale, turn.angle, turn.mirror);
      this.truth(w, f.time, true);
    } else {
      if (w.decoys.length) this.truth(w, f.time, false);
      this.cursor(sprite, w.x, w.y, scale, turn.angle, turn.mirror);
    }
  }

  private hazard(h: Hazard, i: number, f: Frame) {
    const g = this.g;
    const w = f.world;
    const s = w.hz[i]!;
    const t = w.tick;
    switch (h.kind) {
      case "chaser":
        if (h.shape === "spinner") spinner(g, s.x, s.y, h.r, f.time);
        else downloadBar(g, s.x - h.w / 2, s.y - h.h / 2, h.w, h.h, f.time, this.font);
        break;
      case "bin":
        recycleBin(g, h.at.x, h.at.y, h.core, h.reach, f.time);
        break;
      case "marquee": {
        const m = marqueeAt(h, t);
        const r = h.rect;
        const p = m.p;
        const w0 = r.w * p;
        const h0 = r.h * p;
        const x0 = h.corner === "tl" || h.corner === "bl" ? r.x : r.x + r.w - w0;
        const y0 = h.corner === "tl" || h.corner === "tr" ? r.y : r.y + r.h - h0;
        if (m.drawing || m.selected) {
          g.fillStyle = m.selected ? "rgba(10,42,138,0.35)" : "rgba(10,42,138,0.08)";
          g.fillRect(x0, y0, w0, h0);
          g.strokeStyle = C.title;
          g.lineWidth = 1;
          g.setLineDash([3, 3]);
          g.lineDashOffset = -f.time * 20;
          g.strokeRect(x0 + 0.5, y0 + 0.5, w0 - 1, h0 - 1);
          g.setLineDash([]);
        }
        break;
      }
      case "dialog":
        if (!s.done) dialog(g, h, s.flag, s.shiver > 0 ? Math.sin(f.time * 90) * 1.2 : 0, this.font);
        break;
      case "scan": {
        const line = scanLine(h, t);
        const phase = (t + h.offset) % h.period;
        if (line === null) {
          // Warming up at the starting edge.
          if (phase >= 0 && phase < 108 && t >= 0) {
            const a = 0.3 + 0.3 * Math.sin(f.time * 12);
            g.fillStyle = `rgba(31,161,74,${a})`;
            if (h.axis === "x") g.fillRect(h.from - 3, CLIENT.y, 6, CLIENT.h);
            else g.fillRect(CLIENT.x, h.from - 3, CLIENT.w, 6);
          }
          break;
        }
        const dir = Math.sign(h.to - h.from);
        if (h.axis === "x") {
          const grad = g.createLinearGradient(line - dir * 40, 0, line, 0);
          grad.addColorStop(0, "rgba(31,161,74,0)");
          grad.addColorStop(1, "rgba(31,161,74,0.35)");
          g.fillStyle = grad;
          g.fillRect(Math.min(line, line - dir * 40), CLIENT.y, 40, CLIENT.h);
          g.fillStyle = C.green;
          g.fillRect(line - 1.5, CLIENT.y, 3, CLIENT.h);
        } else {
          const grad = g.createLinearGradient(0, line - dir * 40, 0, line);
          grad.addColorStop(0, "rgba(31,161,74,0)");
          grad.addColorStop(1, "rgba(31,161,74,0.35)");
          g.fillStyle = grad;
          g.fillRect(CLIENT.x, Math.min(line, line - dir * 40), CLIENT.w, 40);
          g.fillStyle = C.green;
          g.fillRect(CLIENT.x, line - 1.5, CLIENT.w, 3);
        }
        break;
      }
      case "robot":
        if (!s.done) {
          const r = h.spots[s.n]!;
          const jig = s.shiver > 0 ? Math.sin(f.time * 90) : 0;
          checkbox(g, { x: r.x + jig, y: r.y, w: r.w, h: r.h }, false);
          g.fillStyle = C.ink;
          g.font = `13px ${this.font}`;
          g.textBaseline = "middle";
          g.fillText("I'm not a robot", r.x + r.w + 4 + jig, r.y + r.h / 2);
        }
        break;
      case "target":
        if (!s.done) {
          g.strokeStyle = C.red;
          g.lineWidth = 1;
          g.setLineDash([2, 2]);
          g.strokeRect(h.rect.x - 2.5, h.rect.y - 2.5, h.rect.w + 5, h.rect.h + 5);
          g.setLineDash([]);
          const sprite = CURSORS.arrow;
          const img = pixelSprite(sprite.rows, CURSOR_PALETTE);
          g.drawImage(img, h.rect.x + h.rect.w / 2 - 3, h.rect.y + 1, 6, 10);
        }
        break;
      case "icon":
        break;
    }
  }

  /** The real cursor, found: a glow at its tip (and sparks when it's near a wall, if the OS has hidden it). */
  private truth(w: World, time: number, sparks: boolean) {
    const g = this.g;
    const pulse = 0.55 + 0.25 * Math.sin(time * 6);
    const glow = g.createRadialGradient(w.x, w.y, 0, w.x, w.y, 7);
    glow.addColorStop(0, `rgba(255,225,77,${pulse})`);
    glow.addColorStop(1, "rgba(255,225,77,0)");
    g.fillStyle = glow;
    g.beginPath();
    g.arc(w.x, w.y, 7, 0, Math.PI * 2);
    g.fill();
    if (!sparks) return;
    // Sparks against any wall within 7 px.
    for (const r of w.course.walls) {
      const nx = Math.max(r.x, Math.min(w.x, r.x + r.w));
      const ny = Math.max(r.y, Math.min(w.y, r.y + r.h));
      const d = Math.hypot(nx - w.x, ny - w.y);
      if (d > 7) continue;
      g.fillStyle = C.yellow;
      for (let i = 0; i < 3; i++) {
        const a = time * 23 + i * 2.1;
        g.fillRect(nx + Math.cos(a) * 2 - 0.5, ny + Math.sin(a) * 2 - 0.5, 1.2, 1.2);
      }
    }
  }

  /** A cursor sprite with its hotspot at (x, y), turned and mirrored like your movement is. */
  private cursor(sprite: CursorSprite, x: number, y: number, scale: number, angle: number, mirror: boolean) {
    const g = this.g;
    const img = pixelSprite(sprite.rows, CURSOR_PALETTE);
    g.save();
    g.translate(x, y);
    if (angle) g.rotate(angle);
    g.scale(mirror ? -scale : scale, scale);
    blit(g, img, -sprite.hx, -sprite.hy);
    g.restore();
  }

  /** You escaped: the window shrinks into its taskbar button. */
  private drawClosing(f: Frame) {
    const g = this.g;
    const p = Math.min(1, f.closing);
    g.fillStyle = C.desk;
    g.fillRect(WIN.x - 1, WIN.y - 1, WIN.w + 2, WIN.h + 2);
    g.fillStyle = C.deskDither;
    for (let y = Math.floor(WIN.y / 4) * 4; y < WIN.y + WIN.h + 2; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < DESK_W; x += 4) if (x > WIN.x - 4 && x < WIN.x + WIN.w + 2) g.fillRect(x, y, 2, 2);
    const w = WIN.w * (1 - p);
    const h = WIN.h * (1 - p);
    const x = WIN.x + (WIN.w - w) / 2;
    const y = WIN.y + (WIN.h - h) / 2 + p * 160;
    g.strokeStyle = C.dark;
    g.lineWidth = 1;
    g.setLineDash([2, 2]);
    g.strokeRect(x, y, w, h);
    g.setLineDash([]);
  }
}

/** How the movement's matrix turns things: a rotation, and maybe a mirror first. */
export function turnOf(m: readonly [number, number, number, number]): { angle: number; mirror: boolean } {
  const det = m[0] * m[3] - m[1] * m[2];
  if (det < 0) return { angle: Math.atan2(-m[2], -m[0]), mirror: true };
  return { angle: Math.atan2(m[2], m[0]), mirror: false };
}

// -------------------------------------------------------------------------------------------------
// DeskOS 98's look.

const driveLabel = (id: string) => (id.startsWith("X") ? "" : `${id[0]}:\\`);

/** A raised (or sunken) bevelled box. */
export function bevel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, raised: boolean, fill: string = C.face) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  g.fillStyle = raised ? C.light : C.shadow;
  g.fillRect(x, y, w, 1);
  g.fillRect(x, y, 1, h);
  g.fillStyle = raised ? C.dark : C.light;
  g.fillRect(x, y + h - 1, w, 1);
  g.fillRect(x + w - 1, y, 1, h);
  g.fillStyle = raised ? C.shadow : C.dark;
  g.fillRect(x + 1, y + h - 2, w - 2, 1);
  g.fillRect(x + w - 2, y + 1, 1, h - 2);
}

function titleBar(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean) {
  const grad = g.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, active ? C.title : C.idle);
  grad.addColorStop(1, active ? C.titleEnd : C.idleEnd);
  g.fillStyle = grad;
  g.fillRect(x, y, w, h);
}

function titleButton(g: CanvasRenderingContext2D, r: Rect, kind: "min" | "max" | "close") {
  bevel(g, r.x, r.y, r.w, r.h, true);
  g.fillStyle = C.ink;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (kind === "min") g.fillRect(cx - 3, cy + 2, 6, 2);
  else if (kind === "max") {
    g.fillRect(cx - 4, cy - 4, 8, 2);
    g.fillRect(cx - 4, cy - 4, 1, 8);
    g.fillRect(cx + 3, cy - 4, 1, 8);
    g.fillRect(cx - 4, cy + 3, 8, 1);
  } else {
    const s = Math.max(1.5, Math.min(r.w, r.h) * 0.22);
    g.strokeStyle = C.ink;
    g.lineWidth = Math.max(1.2, r.w / 9);
    g.beginPath();
    g.moveTo(cx - s, cy - s);
    g.lineTo(cx + s, cy + s);
    g.moveTo(cx + s, cy - s);
    g.lineTo(cx - s, cy + s);
    g.stroke();
  }
}

function zone(g: CanvasRenderingContext2D, r: Rect, mode: ZoneMode, font: string) {
  switch (mode) {
    case "ibeam": {
      // A text box: lines of writing.
      g.fillStyle = C.note;
      g.fillRect(r.x, r.y, r.w, r.h);
      g.fillStyle = "#B9B39A";
      for (let y = r.y + 5; y < r.y + r.h - 3; y += 7) {
        let x = r.x + 4;
        let seed = Math.floor(y * 7 + r.x);
        while (x < r.x + r.w - 6) {
          seed = (seed * 9301 + 49297) % 233280;
          const word = 6 + (seed % 14);
          g.fillRect(x, y, Math.min(word, r.x + r.w - 4 - x), 2);
          x += word + 4;
        }
      }
      g.strokeStyle = "#D8D2B4";
      g.lineWidth = 1;
      g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      break;
    }
    case "resizeH":
    case "resizeV": {
      g.fillStyle = "#E4E4EC";
      g.fillRect(r.x, r.y, r.w, r.h);
      g.fillStyle = "#9A9AB4";
      const step = 16;
      for (let y = r.y + 4; y < r.y + r.h - 4; y += step) {
        for (let x = r.x + 4; x < r.x + r.w - 4; x += step) {
          if (mode === "resizeH") {
            g.fillRect(x + 1, y + 3, 6, 1);
            g.fillRect(x, y + 2, 1, 3);
            g.fillRect(x + 7, y + 2, 1, 3);
          } else {
            g.fillRect(x + 3, y + 1, 1, 6);
            g.fillRect(x + 2, y, 3, 1);
            g.fillRect(x + 2, y + 7, 3, 1);
          }
        }
      }
      break;
    }
    case "busy": {
      g.fillStyle = "#EDEDED";
      g.fillRect(r.x, r.y, r.w, r.h);
      g.strokeStyle = "#8A8A8A";
      g.setLineDash([2, 2]);
      g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      g.setLineDash([]);
      g.fillStyle = "#6A6A6A";
      g.font = `12px ${font}`;
      g.textBaseline = "middle";
      g.textAlign = "center";
      g.fillText("Loading…", r.x + r.w / 2, r.y + r.h / 2);
      g.textAlign = "start";
      break;
    }
    case "crosshair": {
      g.fillStyle = "#EEF3FF";
      g.fillRect(r.x, r.y, r.w, r.h);
      g.strokeStyle = "rgba(10,42,204,0.18)";
      g.lineWidth = 1;
      g.beginPath();
      for (let x = r.x + 4; x < r.x + r.w; x += 8) {
        g.moveTo(x + 0.5, r.y);
        g.lineTo(x + 0.5, r.y + r.h);
      }
      for (let y = r.y + 4; y < r.y + r.h; y += 8) {
        g.moveTo(r.x, y + 0.5);
        g.lineTo(r.x + r.w, y + 0.5);
      }
      g.stroke();
      break;
    }
    case "forbidden": {
      g.fillStyle = "#FFE3E5";
      g.fillRect(r.x, r.y, r.w, r.h);
      g.save();
      g.beginPath();
      g.rect(r.x, r.y, r.w, r.h);
      g.clip();
      g.strokeStyle = "rgba(214,40,57,0.45)";
      g.lineWidth = 2;
      g.beginPath();
      for (let d = -r.h; d < r.w; d += 8) {
        g.moveTo(r.x + d, r.y + r.h);
        g.lineTo(r.x + d + r.h, r.y);
      }
      g.stroke();
      g.restore();
      break;
    }
  }
}

function safeFile(g: CanvasRenderingContext2D, r: Rect, font: string) {
  // A folder icon (the antivirus spares what's inside it).
  g.fillStyle = "#FFE9A6";
  g.fillRect(r.x, r.y, r.w, r.h);
  g.strokeStyle = "#B88A00";
  g.lineWidth = 1;
  g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  g.fillStyle = "#E3B23C";
  g.fillRect(r.x + 2, r.y + 2, Math.min(10, r.w / 3), 3);
  g.fillStyle = "#7A5A00";
  g.font = `11px ${font}`;
  g.textBaseline = "bottom";
  g.textAlign = "center";
  g.fillText("safe", r.x + r.w / 2, r.y + r.h - 1);
  g.textAlign = "start";
}

function checkbox(g: CanvasRenderingContext2D, r: Rect, ticked: boolean) {
  bevel(g, r.x, r.y, r.w, r.h, false, C.paper);
  if (ticked) {
    g.strokeStyle = C.ink;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(r.x + 2, r.y + r.h / 2);
    g.lineTo(r.x + r.w / 2 - 0.5, r.y + r.h - 3);
    g.lineTo(r.x + r.w - 2, r.y + 2);
    g.stroke();
  }
}

function icon(g: CanvasRenderingContext2D, r: Rect, label: string, font: string) {
  // A program icon: a little window.
  g.fillStyle = C.face;
  g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = C.title;
  g.fillRect(r.x, r.y, r.w, 4);
  g.strokeStyle = C.dark;
  g.lineWidth = 1;
  g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  g.fillStyle = C.ink;
  g.font = `11px ${font}`;
  g.textBaseline = "top";
  g.textAlign = "center";
  g.fillText(label, r.x + r.w / 2, r.y + r.h + 1);
  g.textAlign = "start";
}

function panel(g: CanvasRenderingContext2D, p: Panel, r: Rect, font: string, held: boolean) {
  if (p.look === "toast") {
    // A notification balloon.
    g.fillStyle = C.note;
    g.fillRect(r.x, r.y, r.w, r.h);
    g.strokeStyle = C.dark;
    g.lineWidth = 1;
    g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    g.fillStyle = C.ink;
    g.font = `13px ${font}`;
    g.textBaseline = "top";
    g.fillText(p.title, r.x + 6, r.y + 3);
    g.font = `12px ${font}`;
    (p.text ?? []).forEach((line, i) => g.fillText(line, r.x + 6, r.y + 16 + i * 11));
    return;
  }
  const ad = p.look === "ad";
  bevel(g, r.x, r.y, r.w, r.h, true, ad ? C.yellow : C.face);
  const bar = { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: BAR_H - 2 };
  if (ad) {
    g.fillStyle = C.red;
    g.fillRect(bar.x, bar.y, bar.w, bar.h);
  } else titleBar(g, bar.x, bar.y, bar.w, bar.h, held || p.draggable === true);
  g.fillStyle = C.light;
  g.font = `12px ${font}`;
  g.textBaseline = "middle";
  g.fillText(p.title, bar.x + 3, bar.y + bar.h / 2 + 1, bar.w - 18);
  if (p.closeable) {
    const c = panelClose(r);
    titleButton(g, { x: c.x + 1, y: c.y + 1, w: c.w - 2, h: c.h - 2 }, "close");
  }
  // The body.
  const body = { x: r.x + 3, y: r.y + BAR_H + 1, w: r.w - 6, h: r.h - BAR_H - 4 };
  if (!ad) {
    g.fillStyle = C.paper;
    g.fillRect(body.x, body.y, body.w, body.h);
  }
  g.fillStyle = ad ? C.ink : "#333333";
  g.font = `${ad ? 16 : 12}px ${font}`;
  g.textBaseline = "top";
  g.textAlign = ad ? "center" : "start";
  const lines = p.text ?? (ad ? ["YOU WON!!!"] : []);
  lines.forEach((line, i) => g.fillText(line, ad ? r.x + r.w / 2 : body.x + 3, body.y + 3 + i * (ad ? 15 : 11), body.w - 4));
  g.textAlign = "start";
  if (p.order !== undefined) {
    g.fillStyle = C.red;
    g.font = `12px ${font}`;
    g.textBaseline = "bottom";
    g.fillText(`#${p.order}`, body.x + 2, body.y + body.h - 1);
  }
}

function dialog(g: CanvasRenderingContext2D, h: Extract<Hazard, { kind: "dialog" }>, swapped: boolean, jig: number, font: string) {
  const r = h.rect;
  bevel(g, r.x, r.y, r.w, r.h, true);
  titleBar(g, r.x + 2, r.y + 2, r.w - 4, 11, true);
  g.fillStyle = C.light;
  g.font = `12px ${font}`;
  g.textBaseline = "middle";
  g.fillText("Are you sure?", r.x + 5, r.y + 8);
  // The question icon.
  g.fillStyle = C.title;
  g.beginPath();
  g.arc(r.x + 14, r.y + 26, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = C.light;
  g.font = `13px ${font}`;
  g.textAlign = "center";
  g.fillText("?", r.x + 14, r.y + 27);
  g.textAlign = "start";
  g.fillStyle = C.ink;
  g.font = `13px ${font}`;
  g.fillText(h.text, r.x + 26, r.y + 26, r.w - 30);
  for (const [b, yes] of [
    [h.yes, true],
    [h.no, false],
  ] as const) {
    bevel(g, b.x + jig, b.y, b.w, b.h, true);
    g.fillStyle = C.ink;
    g.font = `12px ${font}`;
    g.textAlign = "center";
    g.fillText(yes !== swapped ? "Yes" : "No", b.x + b.w / 2 + jig, b.y + b.h / 2 + 1);
    g.textAlign = "start";
  }
}

function spinner(g: CanvasRenderingContext2D, x: number, y: number, r: number, time: number) {
  for (let i = 0; i < 8; i++) {
    const a = time * 6 + (i / 8) * Math.PI * 2;
    g.fillStyle = `rgba(10,42,138,${0.25 + (i / 8) * 0.75})`;
    g.beginPath();
    g.arc(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.28, 0, Math.PI * 2);
    g.fill();
  }
}

function downloadBar(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, font: string) {
  bevel(g, x, y, w, h, false, C.paper);
  const fill = ((time * 0.4) % 1) * (w - 4);
  g.fillStyle = C.green;
  for (let bx = x + 2; bx < x + 2 + fill; bx += 6) g.fillRect(bx, y + 2, 4, h - 4);
  g.fillStyle = C.ink;
  g.font = `10px ${font}`;
  g.textBaseline = "bottom";
  g.fillText("Downloading…", x, y - 1);
}

function recycleBin(g: CanvasRenderingContext2D, x: number, y: number, core: number, reach: number, time: number) {
  // The pull: rings drifting in.
  for (let i = 0; i < 3; i++) {
    const p = 1 - ((time * 0.6 + i / 3) % 1);
    g.strokeStyle = `rgba(17,17,17,${0.18 * (1 - p)})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x, y, core + (reach - core) * p, 0, Math.PI * 2);
    g.stroke();
  }
  // The bin.
  g.fillStyle = "#DADADA";
  g.fillRect(x - core * 0.7, y - core * 0.6, core * 1.4, core * 1.5);
  g.fillStyle = C.face;
  g.fillRect(x - core * 0.85, y - core * 0.85, core * 1.7, core * 0.3);
  g.strokeStyle = C.dark;
  g.lineWidth = 1;
  g.strokeRect(x - core * 0.7, y - core * 0.6, core * 1.4, core * 1.5);
  g.strokeRect(x - core * 0.85, y - core * 0.85, core * 1.7, core * 0.3);
  g.beginPath();
  for (let i = -1; i <= 1; i++) {
    g.moveTo(x + i * core * 0.35, y - core * 0.4);
    g.lineTo(x + i * core * 0.35, y + core * 0.75);
  }
  g.stroke();
}

function uninstallBar(g: CanvasRenderingContext2D, percent: number, font: string) {
  const r = { x: CLIENT.x + 120, y: CLIENT.y + CLIENT.h - 30, w: CLIENT.w - 240, h: 22 };
  bevel(g, r.x - 4, r.y - 16, r.w + 8, r.h + 20, true);
  g.fillStyle = C.ink;
  g.font = `13px ${font}`;
  g.textBaseline = "top";
  g.fillText(`Uninstalling Cursor… ${Math.floor(percent)}%`, r.x, r.y - 14);
  bevel(g, r.x, r.y, r.w, r.h - 4, false, C.paper);
  g.fillStyle = C.title;
  const fill = ((r.w - 4) * Math.min(100, percent)) / 100;
  for (let x = r.x + 2; x < r.x + 2 + fill; x += 8) g.fillRect(x, r.y + 2, Math.min(6, r.x + 2 + fill - x), r.h - 8);
}

