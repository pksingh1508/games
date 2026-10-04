// Draws a moment of a room (Plan/15-gravity-is-lying.md §9, §12). Clean vector shapes on a canvas
// sized to the screen's real pixels, so they stay crisp at any angle. Back to front: the backdrop
// (screen space), then, turned by the camera: the air, the zones and their painted arrows, the
// scenery, the walls and spikes, the lamps and drips, the things, Newt and the scarf, the dust and
// the effects. Words (Isaac, signs, the HUD) are drawn by the page on top.
import { NEWT, TILE, VIEW_H, VIEW_W } from "../core/constants";
import { DIRS, TURN, VEC, type Dir, type Vec } from "../core/gravity";
import { asteroidAt } from "../core/orbit";
import { cellAt, SPIKES, WALL, type Room } from "../core/room";
import type { World } from "../core/world";
import { anchorDown, LAMP_CHAIN, type Anchors } from "./anchors";
import { arrowPath, drawApple, drawDropper, drawAsteroid, drawDecor, drawIsaac, drawLamp, drawLever, drawNewt, drawPlanet, drawPortal, drawScarf, drawSign, drawSpikes } from "./art";
import { fitScale, viewAngle } from "./camera";
import { Effects } from "./effects";
import { INK, LOOKS, type WorldLook } from "./palette";

export interface Frame {
  world: World;
  /** Newt's middle a tick ago (smooth motion between ticks on fast screens). */
  prev: Vec;
  alpha: number;
  /** Seconds, for things that move whether or not you do. */
  time: number;
  /** The camera's angle right now (radians). */
  angle: number;
  /** Newt's angle (it eases round after a gravity change). */
  newtTurn: number;
  anchors: Anchors;
  /** Golden apples found this visit (bitmask). */
  apples: number;
  /** Isaac's mood: talking, and whether what he's saying is a lie. */
  isaac: { talking: boolean; lying: boolean };
  /** Ticks since Newt last landed (a little squash). */
  sinceLand: number;
  /** A timed turn is coming: 0 → 1 over the hum. */
  hum: number;
}

/** Planet colours, by index. */
const PLANET_HUES = [28, 190, 320, 140, 260, 50];

export class Renderer {
  readonly g: CanvasRenderingContext2D;
  readonly fx: Effects;
  private room: Room | null = null;
  /** The air and the walls, drawn once per room at the screen's resolution. */
  private back: HTMLCanvasElement | null = null;
  private front: HTMLCanvasElement | null = null;
  private layerScale = 0;
  private stars: Array<{ x: number; y: number; r: number; tw: number }> = [];
  /** Each house front's colour (one colour per house: neighbouring fronts share it). */
  private facadeColours: string[] = [];
  /** Canvas pixels per screen unit (480 × 272). */
  private k = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly reducedMotion: () => boolean,
  ) {
    this.g = canvas.getContext("2d")!;
    this.fx = new Effects(reducedMotion);
    this.resize();
  }

  /** Match the canvas to its size on the page (crisp on high-density screens). */
  private resize() {
    const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
    const cssW = this.canvas.clientWidth || VIEW_W;
    const cssH = this.canvas.clientHeight || VIEW_H;
    const w = Math.max(VIEW_W, Math.round(cssW * dpr));
    const h = Math.max(VIEW_H, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.k = Math.min(this.canvas.width / VIEW_W, this.canvas.height / VIEW_H);
  }

  setRoom(room: Room) {
    this.room = room;
    this.back = this.front = null;
    this.fx.clear();
    this.facadeColours = houseColours(room);
    this.stars = Array.from({ length: room.kind === "orbit" ? 120 : 0 }, (_, i) => ({
      x: frac(Math.sin(i * 12.9898) * 43758.5453) * VIEW_W,
      y: frac(Math.sin(i * 78.233) * 12345.678) * VIEW_H,
      r: 0.4 + frac(Math.sin(i * 3.1) * 999.1) * 1.1,
      tw: frac(Math.sin(i * 7.7) * 555.5) * 6,
    }));
  }

  /** The room's static layers, at a resolution that stays sharp at the current zoom. */
  private layers(room: Room, look: WorldLook, scale: number) {
    const want = Math.min(4, Math.max(1, Math.ceil(this.k * scale * 2) / 2));
    if (this.back && this.front && want === this.layerScale) return;
    this.layerScale = want;
    this.back = paintBack(room, look, want);
    this.front = paintFront(room, look, want);
  }

  draw(f: Frame) {
    this.resize();
    const { g } = this;
    const w = f.world;
    const room = w.room;
    if (this.room !== room) this.setRoom(room);
    const look = LOOKS[room.world];
    const scale = fitScale(room, f.angle);
    if (room.kind === "tiles") this.layers(room, look, scale);
    const k = this.k;

    // The backdrop, in screen space (it doesn't turn).
    g.setTransform(1, 0, 0, 1, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, this.canvas.height);
    bg.addColorStop(0, look.backdrop[0]);
    bg.addColorStop(1, look.backdrop[1]);
    g.fillStyle = bg;
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Centre the 480 × 272 view in the canvas.
    const ox = (this.canvas.width - VIEW_W * k) / 2;
    const oy = (this.canvas.height - VIEW_H * k) / 2;
    g.setTransform(k, 0, 0, k, ox, oy);
    if (room.kind === "orbit") this.drawStars(f.time);

    // The room, turned by the camera.
    g.save();
    let shakeX = 0;
    let shakeY = 0;
    if (this.fx.shake > 0) {
      shakeX = Math.sin(f.time * 90) * this.fx.shake;
      shakeY = Math.cos(f.time * 73) * this.fx.shake;
    }
    g.translate(VIEW_W / 2 + shakeX, VIEW_H / 2 + shakeY);
    g.rotate(f.angle);
    g.scale(scale, scale);
    g.translate(-room.w / 2, -room.h / 2);

    if (room.kind === "tiles") g.drawImage(this.back!, 0, 0, room.w, room.h);
    else this.drawSpace(room);
    this.drawZones(room, look, f.time);
    this.drawScenery(room, f);
    if (room.kind === "tiles") g.drawImage(this.front!, 0, 0, room.w, room.h);
    else this.drawPlanets(room, f.time);
    this.drawAnchorsBack(f, look);
    this.drawThings(f);
    this.drawNewt(f);
    this.drawAnchorsFront(f, look);
    this.fx.draw(g);
    if (f.hum > 0) this.drawHum(room, f.hum, f.time);
    g.restore();
  }

  private drawStars(time: number) {
    const { g } = this;
    for (const s of this.stars) {
      g.globalAlpha = 0.35 + 0.35 * Math.sin(time * 1.3 + s.tw);
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  /** Orbit rooms: no walls, just the edge of the safe space (drift past it and you're lost). */
  private drawSpace(room: Room) {
    const { g } = this;
    g.save();
    g.strokeStyle = "rgba(220,200,255,0.22)";
    g.lineWidth = 1.5;
    g.setLineDash([6, 6]);
    g.strokeRect(-TILE + 2, -TILE + 2, room.w + TILE * 2 - 4, room.h + TILE * 2 - 4);
    g.restore();
  }

  private drawZones(room: Room, look: WorldLook, time: number) {
    const { g } = this;
    for (const z of room.zones) {
      g.save();
      g.beginPath();
      g.rect(z.x, z.y, z.w, z.h);
      g.clip();
      g.fillStyle = look.zone;
      g.fillRect(z.x, z.y, z.w, z.h);
      // Painted arrows, marching the way they say gravity goes (in a liar room, the wrong way).
      const v = VEC[z.painted];
      const gap = 32;
      const shift = (time * 14) % gap;
      g.fillStyle = look.zoneArrow;
      for (let y = z.y - gap; y < z.y + z.h + gap; y += gap) {
        for (let x = z.x - gap; x < z.x + z.w + gap; x += gap) {
          g.save();
          g.translate(x + gap / 2 + v.x * shift, y + gap / 2 + v.y * shift);
          g.rotate(TURN[z.painted]);
          arrowPath(g, 12);
          g.fill();
          g.restore();
        }
      }
      g.restore();
      g.strokeStyle = look.zoneArrow;
      g.lineWidth = 1;
      g.setLineDash([4, 3]);
      g.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1);
      g.setLineDash([]);
    }
  }

  /**
   * Tilted Town's scenery and the signs: upright for the camera, whatever gravity says. House
   * fronts and roofs follow the camera's quarter turns only (so they tile, even on a gravity hill);
   * trees, benches and signs stand straight up on the screen.
   */
  private drawScenery(room: Room, f: Frame) {
    const { g } = this;
    const upright = -viewAngle(room);
    const quarter = -viewAngle({ ...room, view: { ...room.view, tilt: 0 } });
    room.decor.forEach((d, i) => {
      const house = d.kind === "facade" || d.kind === "window" || d.kind === "door" || d.kind === "roof";
      g.save();
      g.translate(d.x, d.y);
      g.rotate(house ? quarter : upright);
      drawDecor(g, d.kind, f.time, this.facadeColours[i]);
      g.restore();
    });
    for (const s of room.signs) {
      g.save();
      g.translate(s.x, s.y);
      g.rotate(upright);
      drawSign(g);
      g.restore();
    }
  }

  /** The planets: painted ones first (they're on the sky, you pass in front of them), then the real ones. */
  private drawPlanets(room: Room, time: number) {
    const { g } = this;
    for (const fake of [true, false]) {
      room.planets.forEach((p, i) => {
        if (p.fake !== fake) return;
        // The edge of its pull (a painted planet has a painted one too).
        g.strokeStyle = "rgba(220,200,255,0.14)";
        g.lineWidth = 1;
        g.setLineDash([3, 5]);
        g.beginPath();
        g.arc(p.x, p.y, p.field, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
        drawPlanet(g, p.x, p.y, p.r, PLANET_HUES[i % PLANET_HUES.length]!, p.fake, time);
      });
    }
  }

  /** Lamps and drips' pipes (behind things). */
  private drawAnchorsBack(f: Frame, look: WorldLook) {
    const { g } = this;
    const a = f.anchors;
    for (const lamp of a.lamps) drawLamp(g, lamp.x, lamp.y, lamp.angle, LAMP_CHAIN, f.time);
    for (const d of f.world.room.anchors) {
      if (d.kind !== "drip") continue;
      // A dropper, tip toward where its water falls (the truth, unless the anchors lie here).
      const down = anchorDown(f.world, d.x, d.y) ?? { x: 0, y: 1 };
      g.save();
      g.translate(d.x, d.y);
      g.rotate(Math.atan2(-down.x, down.y));
      drawDropper(g, look.water);
      g.restore();
    }
  }

  /** Water, splashes and dust (in front: they're how you tell the truth). */
  private drawAnchorsFront(f: Frame, look: WorldLook) {
    const { g } = this;
    const a = f.anchors;
    g.fillStyle = look.dust;
    for (const m of a.motes) {
      g.globalAlpha = 0.55 + 0.45 * Math.sin(f.time * 2 + m.seed);
      g.beginPath();
      g.arc(m.x, m.y, 1.1, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    for (const d of a.drops) {
      const sp = Math.hypot(d.vx, d.vy) || 1;
      const ux = d.vx / sp;
      const uy = d.vy / sp;
      const len = 2 + Math.min(4, sp);
      g.strokeStyle = look.water;
      g.lineCap = "round";
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(d.x - ux * len, d.y - uy * len);
      g.lineTo(d.x, d.y);
      g.stroke();
      g.fillStyle = "#fff";
      g.fillRect(d.x - 0.5, d.y - 0.5, 1, 1);
    }
    for (const s of a.splashes) {
      g.globalAlpha = s.life / 14;
      g.strokeStyle = look.water;
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(s.x, s.y, 4 - s.life * 0.2, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  private drawThings(f: Frame) {
    const { g } = this;
    const w = f.world;
    const room = w.room;
    // Levers: lit when they're what the room's gravity is set to.
    for (const l of room.levers) {
      g.save();
      g.translate(l.x + l.w / 2, l.y + l.h / 2);
      drawLever(g, l.dir, w.gravity === l.dir);
      g.restore();
    }
    // The portal.
    g.save();
    g.translate(room.portal.x + room.portal.w / 2, room.portal.y + room.portal.h / 2);
    drawPortal(g, f.time);
    g.restore();
    // Golden apples (found ones leave a faint ring).
    room.apples.forEach((a, i) => {
      g.save();
      g.translate(a.x + a.w / 2, a.y + a.h / 2);
      g.rotate(-f.angle);
      if (f.apples & (1 << i)) {
        g.strokeStyle = "rgba(244,180,0,0.45)";
        g.lineWidth = 1;
        g.setLineDash([2, 2]);
        g.beginPath();
        g.arc(0, 0, 5, 0, Math.PI * 2);
        g.stroke();
      } else drawApple(g, f.time + i);
      g.restore();
    });
    // Asteroids (between ticks: where they'll be).
    for (const a of room.asteroids) {
      const at = asteroidAt(a, w.tick - 1 + f.alpha);
      drawAsteroid(g, at.x, at.y, a.r, f.time);
    }
    // Isaac: upright on the screen (he's part of what tells you things, not of the room).
    if (room.isaac) {
      g.save();
      g.translate(room.isaac.x, room.isaac.y);
      g.rotate(-f.angle);
      drawIsaac(g, f.time, f.isaac);
      g.restore();
    }
  }

  private drawNewt(f: Frame) {
    const { g } = this;
    const w = f.world;
    if (w.status === "dead") return;
    const c = w.orbit ? { x: w.orbit.x, y: w.orbit.y } : { x: w.newt.x + NEWT / 2, y: w.newt.y + NEWT / 2 };
    const a = w.status === "play" ? f.alpha : 1;
    const x = f.prev.x + (c.x - f.prev.x) * a;
    const y = f.prev.y + (c.y - f.prev.y) * a;
    // The scarf moves with Newt between ticks.
    const scarf = f.anchors.scarf.map((p) => ({ x: p.x + x - c.x, y: p.y + y - c.y }));
    drawScarf(g, scarf);
    const run = w.orbit ? w.orbit.run : w.newt;
    const moving = Math.abs(run.vx) > 0.3 && run.grounded;
    g.save();
    g.translate(x, y);
    g.rotate(f.newtTurn);
    const squash = f.sinceLand < 8 ? (1 - f.sinceLand / 8) * 0.6 : 0;
    drawNewt(g, run.facing >= 0 ? 1 : -1, moving ? f.time : 0, { squash, blink: f.time % 3.7 < 0.12 });
    g.restore();
    // The knot.
    g.fillStyle = "#FB8500";
    g.beginPath();
    g.arc(scarf[0]!.x, scarf[0]!.y, 1.8, 0, Math.PI * 2);
    g.fill();
  }

  /** The hum: the room's edge glows faster and brighter until the turn. */
  private drawHum(room: Room, hum: number, time: number) {
    const { g } = this;
    const pulse = 0.5 + 0.5 * Math.sin(time * (8 + hum * 22));
    g.strokeStyle = `rgba(123,44,191,${(0.15 + hum * 0.55) * (0.6 + pulse * 0.4)})`;
    g.lineWidth = 2 + hum * 3;
    g.strokeRect(1, 1, room.w - 2, room.h - 2);
  }
}

const frac = (n: number) => n - Math.floor(n);

const HOUSE_COLOURS = ["#F7D6E0", "#FDE2B3", "#CDE7F0", "#D8F0D2", "#E9D8F4", "#FFE8CC"];

/** Group touching house fronts (and their windows and doors) into houses, and give each a colour. */
function houseColours(room: Room): string[] {
  const at = new Map<string, number>();
  room.decor.forEach((d, i) => {
    if (d.kind === "facade" || d.kind === "window" || d.kind === "door") at.set(`${Math.floor(d.x / TILE)},${Math.floor(d.y / TILE)}`, i);
  });
  const colours: string[] = [];
  let next = 0;
  for (const [key, start] of at) {
    if (colours[start]) continue;
    const colour = HOUSE_COLOURS[next++ % HOUSE_COLOURS.length]!;
    const queue = [key];
    while (queue.length) {
      const k = queue.pop()!;
      const i = at.get(k);
      if (i === undefined || colours[i]) continue;
      colours[i] = colour;
      const [c, r] = k.split(",").map(Number) as [number, number];
      queue.push(`${c + 1},${r}`, `${c - 1},${r}`, `${c},${r + 1}`, `${c},${r - 1}`);
    }
  }
  return colours;
}

function layer(room: Room, scale: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.ceil(room.w * scale);
  c.height = Math.ceil(room.h * scale);
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  return [c, g];
}

/** The air: a soft colour and a dot at every tile corner (so you can count tiles at any angle). */
function paintBack(room: Room, look: WorldLook, scale: number): HTMLCanvasElement {
  const [c, g] = layer(room, scale);
  g.fillStyle = look.air;
  g.fillRect(0, 0, room.w, room.h);
  g.fillStyle = look.grid;
  for (let r = 1; r < room.rows; r++) for (let col = 1; col < room.cols; col++) {
    g.beginPath();
    g.arc(col * TILE, r * TILE, 1.1, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

const isWall = (room: Room, c: number, r: number) => {
  // Outside the room counts as wall for drawing edges along the border.
  if (c < 0 || r < 0 || c >= room.cols || r >= room.rows) return false;
  return cellAt(room, c, r) === WALL;
};

/** Which way a spike points: away from the wall it sits on. */
function spikePoint(room: Room, c: number, r: number): Dir {
  if (isWall(room, c, r + 1)) return "up";
  if (isWall(room, c, r - 1)) return "down";
  if (isWall(room, c - 1, r)) return "right";
  if (isWall(room, c + 1, r)) return "left";
  return "up";
}

/** The walls (every face lit: any of them can be a floor) and the spikes. */
function paintFront(room: Room, look: WorldLook, scale: number): HTMLCanvasElement {
  const [c, g] = layer(room, scale);
  const T = TILE;
  for (let r = 0; r < room.rows; r++) {
    for (let col = 0; col < room.cols; col++) {
      if (cellAt(room, col, r) !== WALL) continue;
      const x = col * T;
      const y = r * T;
      g.fillStyle = look.wall;
      g.fillRect(x, y, T, T);
      // A faint panel seam every other tile.
      if ((col + r) % 2 === 0) {
        g.fillStyle = "rgba(255,255,255,0.04)";
        g.fillRect(x + 2, y + 2, T - 4, T - 4);
      }
    }
  }
  // Lit faces and dark edges where a wall meets the air.
  for (let r = 0; r < room.rows; r++) {
    for (let col = 0; col < room.cols; col++) {
      if (cellAt(room, col, r) !== WALL) continue;
      const x = col * T;
      const y = r * T;
      const open = (dc: number, dr: number) => {
        const cc = col + dc;
        const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= room.cols || rr >= room.rows) return false;
        return cellAt(room, cc, rr) !== WALL;
      };
      for (const d of DIRS) {
        const v = VEC[d];
        if (!open(v.x, v.y)) continue;
        // The face (3 px) and its edge (1 px).
        const fx = v.x > 0 ? x + T - 3 : x;
        const fy = v.y > 0 ? y + T - 3 : y;
        const fw = v.x !== 0 ? 3 : T;
        const fh = v.y !== 0 ? 3 : T;
        g.fillStyle = look.wallFace;
        g.fillRect(fx, fy, fw, fh);
        g.fillStyle = look.wallEdge;
        const ex = v.x > 0 ? x + T - 1 : x;
        const ey = v.y > 0 ? y + T - 1 : y;
        g.fillRect(ex, ey, v.x !== 0 ? 1 : T, v.y !== 0 ? 1 : T);
      }
    }
  }
  for (let r = 0; r < room.rows; r++) {
    for (let col = 0; col < room.cols; col++) {
      if (cellAt(room, col, r) === SPIKES) drawSpikes(g, col * T, r * T, T, spikePoint(room, col, r));
    }
  }
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.strokeRect(1, 1, room.w - 2, room.h - 2);
  return c;
}
