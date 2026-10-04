// Drawing a level (Plan/01-one-more-step.md §9): clean, flat shapes with soft shadows and rounded tiles, a
// palette per world. The logic is instant; the drawing tweens between the last state and this one over a
// short step (and replays what happened: dust when a tile crumbles, a poof when you're hurt), so it's
// always cosmetic. The tells are drawn here: Doory's feet twitch when you're two tiles away, spikes show
// two dots (now, and next tick), lazy spikes sleep, a basement hole glows with "B1", painted doors have no
// feet and no shadow, the echo wears its delay on its chest.
import { echoAt, gatesOpen, isBroken, spikesUp, waveIn } from "../engine/rules";
import { Cell, DIRS, manhattan, samePos, type Course, type GameEvent, type Pos, type State } from "../engine/types";

export interface Palette {
  bg: string;
  tileA: string;
  tileB: string;
  shadow: string;
  wall: string;
  wallTop: string;
  ink: string;
  blob: string;
  eye: string;
  accent: string;
  /** Words on the accent (Doory's EXIT sign). */
  onAccent: string;
  /** The spike wave's countdown. */
  danger: string;
  hole: string;
}

export const PALETTES: Record<number, Palette> = {
  1: { bg: "#E8F6EF", tileA: "#FFFFFF", tileB: "#F4FBF8", shadow: "#BFDCCF", wall: "#8FB8A7", wallTop: "#B6D9CA", ink: "#1F3A33", blob: "#1F3A33", eye: "#FFFFFF", accent: "#1E7D5E", onAccent: "#FFFFFF", danger: "#C0392F", hole: "#1F3A33" },
  2: { bg: "#FDEFE4", tileA: "#FFFFFF", tileB: "#FFF6EF", shadow: "#EBC9AF", wall: "#D59F7C", wallTop: "#E9BE9F", ink: "#3A2A1F", blob: "#2E3A3F", eye: "#FFFFFF", accent: "#C25E2E", onAccent: "#FFFFFF", danger: "#B8322A", hole: "#3A2A1F" },
  3: { bg: "#EFEAFB", tileA: "#FFFFFF", tileB: "#F7F4FE", shadow: "#CFC4EC", wall: "#9C8BD6", wallTop: "#BFB2EA", ink: "#2C2550", blob: "#2C2550", eye: "#FFFFFF", accent: "#6A4FD8", onAccent: "#FFFFFF", danger: "#C0392F", hole: "#2C2550" },
  4: { bg: "#E6F3FB", tileA: "#FFFFFF", tileB: "#F2F9FD", shadow: "#B9D9EC", wall: "#7FB2D3", wallTop: "#A9CDE6", ink: "#1D3448", blob: "#1D3448", eye: "#FFFFFF", accent: "#2C78B0", onAccent: "#FFFFFF", danger: "#C0392F", hole: "#1D3448" },
  5: { bg: "#0F201B", tileA: "#24443B", tileB: "#203D35", shadow: "#0A1512", wall: "#3D6457", wallTop: "#507D6E", ink: "#E8F6EF", blob: "#E8F6EF", eye: "#1F3A33", accent: "#7FE3B8", onAccent: "#0F201B", danger: "#FF8A7A", hole: "#050C0A" },
  6: { bg: "#FFF6E0", tileA: "#FFFFFF", tileB: "#FFFBF1", shadow: "#EAD7A8", wall: "#D9B66B", wallTop: "#ECD39C", ink: "#3A2E14", blob: "#1F3A33", eye: "#FFFFFF", accent: "#C58B00", onAccent: "#2A2008", danger: "#B8322A", hole: "#3A2E14" },
};

/** A step's animation (ms). */
export const STEP_MS = 120;

export interface Frame {
  course: Course;
  /** The state before this step, and after it. */
  from: State;
  to: State;
  events: readonly GameEvent[];
  /** 0 → 1 through the step. */
  t: number;
  /** Seconds (idle animation). */
  time: number;
  reduceMotion: boolean;
  coords: boolean;
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  colour: string;
  size: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - (1 - t) * (1 - t);

export class Renderer {
  private readonly g: CanvasRenderingContext2D;
  private cssW = 0;
  private cssH = 0;
  private dpr = 1;
  private puffs: Puff[] = [];
  private shake = 0;
  private seen: readonly GameEvent[] | null = null;
  /** Tile size and the grid's top-left (css px), as last drawn: for taps on the player. */
  layout = { tile: 32, ox: 0, oy: 0 };
  private family = "system-ui, sans-serif";

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    const fredoka = getComputedStyle(canvas).getPropertyValue("--font-g-fredoka").trim();
    if (fredoka) this.family = `${fredoka}, system-ui, sans-serif`;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
  }

  draw(f: Frame) {
    const { canvas, g } = this;
    const bw = Math.max(1, Math.round(this.cssW * this.dpr));
    const bh = Math.max(1, Math.round(this.cssH * this.dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const c = f.course;
    const pal = PALETTES[c.def.world] ?? PALETTES[1]!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = pal.bg;
    g.fillRect(0, 0, bw, bh);
    // The grid, as big as fits (a margin for Doory's sign above the top row).
    const tile = Math.floor(Math.min((this.cssW - 16) / c.w, (this.cssH - 24) / (c.h + 0.4)));
    const ox = Math.round((this.cssW - tile * c.w) / 2);
    const oy = Math.round((this.cssH - tile * c.h) / 2 + tile * 0.2);
    this.layout = { tile, ox, oy };
    if (f.events !== this.seen) {
      this.seen = f.events;
      this.react(f, tile, ox, oy);
    }
    let sx = 0;
    let sy = 0;
    if (this.shake > 0 && !f.reduceMotion) {
      sx = Math.sin(f.time * 90) * this.shake;
      sy = Math.cos(f.time * 70) * this.shake;
    }
    this.shake = Math.max(0, this.shake - 0.6);
    g.setTransform(this.dpr, 0, 0, this.dpr, (ox + sx) * this.dpr, (oy + sy) * this.dpr);
    // The tiles change at the middle of a step.
    const s = f.t < 0.5 ? f.from : f.to;
    this.tiles(f, c, s, tile, pal);
    if (c.def.fog) this.fog(f, c, tile, pal);
    this.creatures(f, c, tile, pal);
    if (f.coords) this.coords(c, tile, pal);
    this.drawPuffs(tile);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // -- What happened (puffs, shakes) ---------------------------------------------------------------

  private react(f: Frame, tile: number, ox: number, oy: number) {
    void ox;
    void oy;
    for (const e of f.events) {
      if (e.type === "crumble") this.dust(e.at, "#C9B79C", 10);
      if (e.type === "reveal") this.dust(e.at, "#F2A65A", 12);
      if (e.type === "die") {
        this.dust(e.at, PALETTES[f.course.def.world]?.blob ?? "#1F3A33", 18);
        this.shake = 5;
      }
      if (e.type === "sentinelFall") this.dust(e.at, "#9AA5A0", 14);
      if (e.type === "win") this.dust(e.at, "#FFD23F", 22);
    }
    void tile;
  }

  private dust(at: Pos, colour: string, n: number) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.6 + Math.random() * 1.6;
      this.puffs.push({ x: at.x + 0.5, y: at.y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, life: 1, colour, size: 0.06 + Math.random() * 0.08 });
    }
  }

  private drawPuffs(tile: number) {
    const g = this.g;
    this.puffs = this.puffs.filter((p) => (p.life -= 0.035) > 0);
    for (const p of this.puffs) {
      p.x += (p.vx / 60) * 1.6;
      p.y += (p.vy / 60) * 1.6;
      p.vy += 0.05;
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.colour;
      g.beginPath();
      g.arc(p.x * tile, p.y * tile, p.size * tile, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // -- Tiles ---------------------------------------------------------------------------------------

  private tiles(f: Frame, c: Course, s: State, tile: number, pal: Palette) {
    const g = this.g;
    const r = tile * 0.2;
    const pad = tile * 0.05;
    const open = gatesOpen(c, s);
    for (let y = 0; y < c.h; y++) {
      for (let x = 0; x < c.w; x++) {
        const i = y * c.w + x;
        const cell = c.cells[i]!;
        const px = x * tile + pad;
        const py = y * tile + pad;
        const size = tile - pad * 2;
        if (cell === Cell.Wall) {
          // Walls that border the floor stand up; the rest is just the room's outside.
          if (!this.bordersFloor(c, x, y)) continue;
          g.fillStyle = pal.wall;
          roundRect(g, px, py + tile * 0.08, size, size, r);
          g.fill();
          g.fillStyle = pal.wallTop;
          roundRect(g, px, py - tile * 0.04, size, size, r);
          g.fill();
          if (c.painted.some((p) => p.x === x && p.y === y)) this.paintedDoor(x, y, tile, pal);
          continue;
        }
        const hole = cell === Cell.Hole || cell === Cell.Basement || (cell === Cell.Crumble && isBroken(c, s, i));
        if (hole) {
          this.hole(x, y, tile, pal, cell === Cell.Basement, f.time);
          continue;
        }
        // A floor tile: the drop, then the face.
        g.fillStyle = pal.shadow;
        roundRect(g, px, py + tile * 0.08, size, size, r);
        g.fill();
        g.fillStyle = (x + y) % 2 ? pal.tileB : pal.tileA;
        roundRect(g, px, py, size, size, r);
        g.fill();
        const cx = x * tile + tile / 2;
        const cy = y * tile + tile / 2;
        switch (cell) {
          case Cell.Crumble:
          case Cell.Secret: {
            if (cell === Cell.Secret && isBroken(c, s, i)) break;
            g.strokeStyle = cell === Cell.Secret ? "#C9A27A" : "#B9A88E";
            g.lineWidth = Math.max(1, tile * 0.04);
            g.lineCap = "round";
            g.beginPath();
            g.moveTo(px + size * 0.2, py + size * 0.18);
            g.lineTo(px + size * 0.38, py + size * 0.42);
            g.lineTo(px + size * 0.3, py + size * 0.6);
            g.lineTo(px + size * 0.5, py + size * 0.82);
            g.moveTo(px + size * 0.62, py + size * 0.14);
            g.lineTo(px + size * 0.56, py + size * 0.4);
            g.lineTo(px + size * 0.78, py + size * 0.52);
            g.stroke();
            if (cell === Cell.Secret) {
              // The real exit's outline, faint, in the cracks.
              g.strokeStyle = "rgba(242,166,90,0.45)";
              g.lineWidth = Math.max(1, tile * 0.03);
              g.strokeRect(px + size * 0.3, py + size * 0.22, size * 0.4, size * 0.6);
            }
            break;
          }
          case Cell.Spikes:
          case Cell.Wave: {
            const up = spikesUp(c, s, { x, y });
            const lazy = cell === Cell.Spikes && c.lazy[i] === 1;
            this.spikes(px, py, size, up, pal, lazy);
            // The tell: what they are now, and next tick.
            if (cell === Cell.Spikes) {
              const next = lazy ? up : !up;
              for (const [k, on] of [up, next].entries()) {
                g.fillStyle = on ? pal.ink : "rgba(0,0,0,0)";
                g.strokeStyle = pal.ink;
                g.lineWidth = Math.max(1, tile * 0.025);
                g.beginPath();
                g.arc(px + size * (0.38 + k * 0.24), py + size * 0.9, size * 0.05, 0, Math.PI * 2);
                g.fill();
                g.stroke();
              }
            }
            if (lazy) {
              g.fillStyle = pal.accent;
              g.font = `700 ${Math.round(tile * 0.24)}px ${this.family}`;
              g.textAlign = "right";
              g.fillText("zZ", px + size * 0.98, py + size * 0.28);
            }
            if (cell === Cell.Wave) {
              g.fillStyle = pal.danger;
              g.font = `700 ${Math.round(tile * 0.24)}px ${this.family}`;
              g.textAlign = "right";
              g.fillText(String(waveIn(c, s)), px + size * 0.95, py + size * 0.3);
            }
            break;
          }
          case Cell.Conveyor: {
            const d = DIRS[c.belts[i]!]!;
            const shift = ((f.time * 1.2) % 1) * 0.34;
            g.save();
            g.translate(cx, cy);
            g.rotate({ up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI }[d]);
            g.strokeStyle = pal.accent;
            g.lineWidth = Math.max(2, tile * 0.07);
            g.lineCap = "round";
            g.lineJoin = "round";
            g.beginPath();
            for (let k = -1; k <= 1; k++) {
              const ax = (k * 0.34 + shift - 0.05) * size;
              if (Math.abs(ax) > size * 0.42) continue;
              g.moveTo(ax - size * 0.1, -size * 0.18);
              g.lineTo(ax + size * 0.06, 0);
              g.lineTo(ax - size * 0.1, size * 0.18);
            }
            g.stroke();
            g.restore();
            break;
          }
          case Cell.Plate: {
            const down = this.pressed(c, s, { x, y });
            g.fillStyle = down ? pal.accent : "#C9C3B6";
            roundRect(g, px + size * 0.2, py + size * (down ? 0.26 : 0.2), size * 0.6, size * 0.56, size * 0.1);
            g.fill();
            if (!down) {
              g.fillStyle = "#E3DED3";
              roundRect(g, px + size * 0.2, py + size * 0.16, size * 0.6, size * 0.5, size * 0.1);
              g.fill();
            }
            break;
          }
          case Cell.Gate: {
            g.strokeStyle = open ? "rgba(120,120,120,0.35)" : pal.ink;
            g.lineWidth = Math.max(2, tile * (open ? 0.03 : 0.07));
            g.beginPath();
            for (let k = 0; k < 4; k++) {
              const gx = px + size * (0.2 + k * 0.2);
              g.moveTo(gx, py + size * 0.12);
              g.lineTo(gx, py + size * (open ? 0.24 : 0.88));
            }
            g.moveTo(px + size * 0.12, py + size * 0.12);
            g.lineTo(px + size * 0.88, py + size * 0.12);
            g.stroke();
            break;
          }
        }
      }
    }
  }

  private bordersFloor(c: Course, x: number, y: number) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= c.w || ny >= c.h) continue;
        if (c.cells[ny * c.w + nx] !== Cell.Wall) return true;
      }
    }
    return false;
  }

  private pressed(c: Course, s: State, p: Pos) {
    const bodies: Array<Pos | null> = [s.player, echoAt(c, s), s.doors[0] ?? null, s.twin, ...s.sentinels];
    return bodies.some((b) => samePos(b, p));
  }

  private hole(x: number, y: number, tile: number, pal: Palette, basement: boolean, time: number) {
    const g = this.g;
    const cx = x * tile + tile / 2;
    const cy = y * tile + tile / 2 + tile * 0.04;
    if (basement) {
      // It glows from below: the way out.
      const glow = g.createRadialGradient(cx, cy, 0, cx, cy, tile * 0.5);
      glow.addColorStop(0, `rgba(255,214,120,${(0.75 + 0.2 * Math.sin(time * 3)).toFixed(3)})`);
      glow.addColorStop(1, "rgba(255,214,120,0)");
      g.fillStyle = glow;
      g.fillRect(x * tile, y * tile, tile, tile);
    }
    g.fillStyle = basement ? "#5A3A12" : pal.hole;
    g.globalAlpha = basement ? 0.85 : 0.88;
    g.beginPath();
    g.ellipse(cx, cy, tile * 0.42, tile * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    if (basement) {
      g.fillStyle = "#FFE7A8";
      g.font = `700 ${Math.round(tile * 0.24)}px ${this.family}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("B1", cx, cy + tile * 0.02);
      g.textBaseline = "alphabetic";
    }
  }

  private spikes(px: number, py: number, size: number, up: boolean, pal: Palette, lazy: boolean) {
    const g = this.g;
    if (!up) {
      // Down: three slots.
      g.fillStyle = "rgba(0,0,0,0.18)";
      for (let k = 0; k < 3; k++) {
        roundRect(g, px + size * (0.2 + k * 0.22), py + size * 0.5, size * 0.14, size * 0.08, size * 0.04);
        g.fill();
      }
      return;
    }
    g.fillStyle = lazy ? "#8A7FA8" : pal.ink;
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      const bx = px + size * (0.18 + k * 0.22);
      g.moveTo(bx, py + size * 0.74);
      g.lineTo(bx + size * 0.09, py + size * 0.24);
      g.lineTo(bx + size * 0.18, py + size * 0.74);
    }
    g.fill();
  }

  private paintedDoor(x: number, y: number, tile: number, pal: Palette) {
    // Painted on: flat, no shadow, no feet.
    const g = this.g;
    const px = x * tile + tile * 0.22;
    const py = y * tile + tile * 0.06;
    g.fillStyle = "#F2A65A";
    roundRect(g, px, py, tile * 0.56, tile * 0.72, tile * 0.08);
    g.fill();
    g.strokeStyle = "#C77B32";
    g.lineWidth = Math.max(1, tile * 0.04);
    g.stroke();
    g.fillStyle = "#FFE7C2";
    g.beginPath();
    g.arc(px + tile * 0.28, py + tile * 0.26, tile * 0.08, 0, Math.PI * 2);
    g.fill();
    void pal;
  }

  // -- Creatures -----------------------------------------------------------------------------------

  private creatures(f: Frame, c: Course, tile: number, pal: Palette) {
    const g = this.g;
    const t = ease(Math.min(1, f.t));
    const at = (a: Pos | null | undefined, b: Pos | null | undefined): Pos | null => {
      if (!b) return null;
      if (!a) return b;
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
    };
    // In the fog, what's out of sight is drawn faintly (or not at all), the way its tile is.
    const seen = (p: Pos) => (c.def.fog ? 1 - fogOver(manhattan(f.to.player, p)) : 1);
    // Doors (Doory first), then the echo, the twin, sentinels, and you on top.
    const doors = f.to.doors;
    doors.forEach((d, k) => {
      const p = at(f.from.doors[k], d)!;
      const isDoory = k === 0 && c.doors.length > 0;
      const behavior = isDoory ? c.behavior : "still";
      const near = manhattan(f.to.player, d);
      g.globalAlpha = seen(d);
      this.door(p, tile, behavior, near, f, pal, k > 0 && !!c.twin);
    });
    const echo = c.echoDelay ? echoAt(c, f.to) : null;
    if (echo && f.to.status !== "won") this.blob(at(echoAt(c, f.from), echo)!, tile, pal, { ghost: c.echoDelay, f, alpha: seen(echo) });
    f.to.sentinels.forEach((s, k) => {
      const p = at(f.from.sentinels[k], s ?? f.from.sentinels[k]);
      if (!p) return;
      if (!s && f.t > 0.6) return;
      g.globalAlpha = seen(s ?? f.from.sentinels[k]!);
      this.sentinel(p, tile, f.to.player);
    });
    g.globalAlpha = 1;
    if (f.to.twin) this.blob(at(f.from.twin, f.to.twin)!, tile, pal, { twin: true, f, alpha: seen(f.to.twin) });
    const you = at(f.from.player, f.to.player)!;
    if (f.to.status === "dead" && f.t > 0.5) return;
    if (f.to.status === "won" && f.t > 0.9) return;
    this.blob(you, tile, pal, { f, look: doors[0] ?? null, bump: f.events.find((e) => e.type === "bump") as Extract<GameEvent, { type: "bump" }> | undefined });
  }

  private blob(p: Pos, tile: number, pal: Palette, o: { f: Frame; ghost?: number; twin?: boolean; alpha?: number; look?: Pos | null; bump?: Extract<GameEvent, { type: "bump" }> }) {
    const g = this.g;
    const { f } = o;
    const alpha = o.alpha ?? 1;
    let cx = p.x * tile + tile / 2;
    let cy = p.y * tile + tile / 2;
    // Squash and stretch on a step; a nudge on a bump.
    const hop = f.reduceMotion ? 0 : Math.sin(Math.min(1, f.t) * Math.PI);
    if (o.bump && !f.reduceMotion) {
      const d = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[o.bump.dir];
      cx += d[0]! * hop * tile * 0.12;
      cy += d[1]! * hop * tile * 0.12;
    }
    const sx = 1 + hop * 0.12;
    const sy = 1 - hop * 0.1;
    const rad = tile * 0.3;
    g.save();
    g.globalAlpha = alpha * (o.ghost ? 0.42 : 1);
    // Feet.
    g.fillStyle = o.twin ? "#3E7F9E" : pal.blob;
    g.beginPath();
    g.ellipse(cx - rad * 0.4, cy + rad * 0.95, rad * 0.32, rad * 0.18, 0, 0, Math.PI * 2);
    g.ellipse(cx + rad * 0.45, cy + rad * 0.95, rad * 0.32, rad * 0.18, 0, 0, Math.PI * 2);
    g.fill();
    // Body.
    g.translate(cx, cy - hop * tile * 0.08);
    g.scale(sx, sy);
    g.fillStyle = o.twin ? "#3E7F9E" : pal.blob;
    g.beginPath();
    g.arc(0, 0, rad, 0, Math.PI * 2);
    g.fill();
    if (o.ghost) {
      g.setLineDash([tile * 0.06, tile * 0.05]);
      g.strokeStyle = pal.ink;
      g.lineWidth = Math.max(1, tile * 0.03);
      g.stroke();
      g.setLineDash([]);
    }
    // Eyes, looking at the door (the twin's are on the other side).
    const look = o.look ? Math.atan2(o.look.y - p.y, o.look.x - p.x) : 0;
    const lx = Math.cos(look) * rad * 0.1;
    const ly = Math.sin(look) * rad * 0.1;
    const mirror = o.twin ? -1 : 1;
    g.fillStyle = pal.eye;
    g.beginPath();
    g.ellipse(mirror * rad * 0.22, -rad * 0.28, rad * 0.24, rad * 0.32, 0, 0, Math.PI * 2);
    g.ellipse(mirror * rad * 0.68, -rad * 0.28, rad * 0.21, rad * 0.29, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.twin ? "#163447" : pal.blob === "#E8F6EF" ? "#1F3A33" : pal.blob;
    g.beginPath();
    g.arc(mirror * rad * 0.3 + lx, -rad * 0.24 + ly, rad * 0.11, 0, Math.PI * 2);
    g.arc(mirror * rad * 0.74 + lx, -rad * 0.24 + ly, rad * 0.1, 0, Math.PI * 2);
    g.fill();
    if (o.ghost) {
      // Its delay, on its chest.
      g.globalAlpha = alpha * 0.9;
      g.fillStyle = pal.eye;
      g.font = `700 ${Math.round(rad * 0.7)}px ${this.family}`;
      g.textAlign = "center";
      g.fillText(String(o.ghost), 0, rad * 0.62);
    }
    g.restore();
  }

  private door(p: Pos, tile: number, behavior: string, near: number, f: Frame, pal: Palette, twinExit: boolean) {
    const g = this.g;
    const cx = p.x * tile + tile / 2;
    const base = p.y * tile + tile * 0.86;
    const w = tile * 0.52;
    const h = tile * 0.7;
    const cornered = f.events.some((e) => e.type === "cornered");
    const brave = behavior === "brave";
    // Feet (twitching when you're two tiles away: the tell); a shy door's tap when it runs.
    const twitch = near === 2 && !f.reduceMotion && behavior === "shy" ? Math.sin(f.time * 30) * tile * 0.03 : 0;
    g.fillStyle = brave ? "#D2463C" : pal.ink === "#E8F6EF" ? "#0A1512" : "#1F3A33";
    g.beginPath();
    g.ellipse(cx - w * 0.28 + twitch, base + tile * 0.02, tile * 0.1, tile * 0.055, 0, 0, Math.PI * 2);
    g.ellipse(cx + w * 0.28 - twitch, base + tile * 0.02, tile * 0.1, tile * 0.055, 0, 0, Math.PI * 2);
    g.fill();
    // Its shadow (painted doors have none).
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.beginPath();
    g.ellipse(cx, base + tile * 0.05, w * 0.6, tile * 0.06, 0, 0, Math.PI * 2);
    g.fill();
    // The door.
    g.fillStyle = twinExit ? "#7FC9E8" : "#F2A65A";
    roundRect(g, cx - w / 2, base - h, w, h, tile * 0.09);
    g.fill();
    g.strokeStyle = twinExit ? "#3E7F9E" : "#C77B32";
    g.lineWidth = Math.max(1.5, tile * 0.045);
    g.stroke();
    g.strokeRect(cx - w * 0.3, base - h * 0.42, w * 0.6, h * 0.26);
    // The peephole eye (it blinks).
    const blink = Math.sin(f.time * 1.3 + p.x) > 0.97;
    g.fillStyle = "#FFE7C2";
    g.beginPath();
    g.arc(cx, base - h * 0.7, tile * 0.1, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    if (!blink) {
      g.fillStyle = "#1F3A33";
      g.beginPath();
      g.arc(cx - tile * 0.025, base - h * 0.7, tile * 0.045, 0, Math.PI * 2);
      g.fill();
    } else {
      g.beginPath();
      g.moveTo(cx - tile * 0.07, base - h * 0.7);
      g.lineTo(cx + tile * 0.07, base - h * 0.7);
      g.stroke();
    }
    if (brave) {
      // Angry eyebrows.
      g.strokeStyle = "#1F3A33";
      g.lineWidth = Math.max(2, tile * 0.05);
      g.beginPath();
      g.moveTo(cx - tile * 0.14, base - h * 0.88);
      g.lineTo(cx + tile * 0.02, base - h * 0.8);
      g.moveTo(cx + tile * 0.14, base - h * 0.88);
      g.lineTo(cx - tile * 0.02, base - h * 0.8);
      g.stroke();
    }
    // The knob.
    g.fillStyle = twinExit ? "#3E7F9E" : "#C77B32";
    g.beginPath();
    g.arc(cx + w * 0.3, base - h * 0.48, tile * 0.04, 0, Math.PI * 2);
    g.fill();
    // EXIT.
    g.fillStyle = pal.accent;
    roundRect(g, cx - w * 0.52, base - h - tile * 0.26, w * 1.04, tile * 0.22, tile * 0.05);
    g.fill();
    g.fillStyle = pal.onAccent;
    g.font = `700 ${Math.round(tile * 0.15)}px ${this.family}`;
    g.textAlign = "center";
    g.fillText("EXIT", cx, base - h - tile * 0.1);
    if (cornered) {
      // Sweating.
      g.fillStyle = "#7FD1E8";
      g.beginPath();
      g.moveTo(cx - w * 0.7, base - h * 0.95);
      g.quadraticCurveTo(cx - w * 0.85, base - h * 0.75, cx - w * 0.7, base - h * 0.7);
      g.quadraticCurveTo(cx - w * 0.55, base - h * 0.75, cx - w * 0.7, base - h * 0.95);
      g.fill();
    }
  }

  private sentinel(p: Pos, tile: number, toward: Pos) {
    const g = this.g;
    const cx = p.x * tile + tile / 2;
    const cy = p.y * tile + tile / 2;
    const s = tile * 0.62;
    g.fillStyle = "#8E9893";
    roundRect(g, cx - s / 2, cy - s / 2 + tile * 0.06, s, s, tile * 0.12);
    g.fill();
    g.fillStyle = "#AEB8B3";
    roundRect(g, cx - s / 2, cy - s / 2, s, s * 0.92, tile * 0.12);
    g.fill();
    // A carved, frowning face, turned to you.
    const look = Math.sign(toward.x - p.x) * tile * 0.04;
    g.fillStyle = "#4E5753";
    g.fillRect(cx - s * 0.28 + look, cy - s * 0.12, s * 0.18, s * 0.08);
    g.fillRect(cx + s * 0.1 + look, cy - s * 0.12, s * 0.18, s * 0.08);
    g.fillRect(cx - s * 0.2 + look, cy + s * 0.16, s * 0.4, s * 0.06);
  }

  private fog(f: Frame, c: Course, tile: number, pal: Palette) {
    // Only tiles within two steps of you can be seen (the next ring, barely). One path per ring, cell by
    // cell, so nothing's covered twice; the bottom row's also covers its tiles' lips.
    const g = this.g;
    const p = f.to.player;
    g.fillStyle = pal.bg;
    for (const far of [false, true]) {
      g.globalAlpha = fogOver(far ? 4 : 3);
      g.beginPath();
      for (let y = 0; y < c.h; y++) {
        for (let x = 0; x < c.w; x++) {
          const d = Math.abs(x - p.x) + Math.abs(y - p.y);
          if (far ? d < 4 : d !== 3) continue;
          g.rect(x * tile, y * tile, tile, y === c.h - 1 ? tile * 1.12 : tile);
        }
      }
      g.fill();
    }
    g.globalAlpha = 1;
  }

  private coords(c: Course, tile: number, pal: Palette) {
    const g = this.g;
    g.fillStyle = pal.ink;
    g.globalAlpha = 0.5;
    g.font = `600 ${Math.round(tile * 0.2)}px ${this.family}`;
    g.textAlign = "center";
    for (let x = 0; x < c.w; x++) g.fillText(String.fromCharCode(65 + x), x * tile + tile / 2, -tile * 0.08);
    g.textAlign = "right";
    for (let y = 0; y < c.h; y++) g.fillText(String(y + 1), -tile * 0.08, y * tile + tile * 0.58);
    g.globalAlpha = 1;
  }
}

/** How much fog is over a tile this many steps from you. */
const fogOver = (d: number) => (d <= 2 ? 0 : d === 3 ? 0.82 : 0.97);

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}
