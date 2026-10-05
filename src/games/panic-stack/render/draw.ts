// Drawing a frame (Plan/11-panic-stack.md §8.3, §9): the location, the platform on its pillar, the goal line
// and its flag, every item (by its looks: a re-skin swaps those), the cat and the bird, the item in your hand
// on its rubber band (stretched long when it's heavy: the drag-weight tell, drawn), and the conveyor across
// the top with its own tells (the belt sags under real weight; the safe hovers; the box rocks; the jelly
// jiggles; the balloon grows; the ice drips). Then the events: the siren (real, or a cardboard cut-out),
// frost, wind, a shrinking platform's stripes, a re-skin's missing textures, lights out (silhouettes of the
// true shapes: shadows don't lie), X-ray glasses, and the panic vignette. Canvas 2D, in CSS pixels × DPR.
import type { Circle, Polygon } from "planck";
import { FLOOR_Y, STABLE_TICKS } from "../core/constants";
import type { Vec } from "../core/geometry";
import { ITEMS, outline, type ItemId } from "../core/items";
import type { BeltItem, Item, Sim } from "../core/sim";
import { fit, toScreen, toWorld, viewRect, type Camera } from "./camera";
import { drawScenery, PALETTES } from "./scenery";
import { canvasFont, drawBird, drawCat, drawGlasses, INK, rr, SPRITES, text } from "./sprites";

export interface FrameState {
  sim: Sim;
  /** Seconds, for animation. */
  t: number;
  /** The pointer in the world (m), and whether it's a finger. */
  pointer: Vec | null;
  touch: boolean;
  /** Where the hand holds the held item, from its centre in its own frame (m). */
  grip: Vec | null;
  /** The belt item under the pointer. */
  hover: number | null;
  /** Tap tests: belt uid → when (seconds). */
  taps: ReadonlyMap<number, number>;
  reduceMotion: boolean;
  reduceFlashing: boolean;
  /** Earthquakes shake the screen too, unless this is off (§11 "Reduce shake"). */
  shake: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "dust" | "shard" | "confetti" | "drip" | "spark" | "goo" | "puddle" | "leaf";
  spin: number;
}

/** Where each belt item is drawn this frame (CSS px), for hit-testing and grabbing. */
export interface BeltSlot {
  uid: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ITEM_SIZE = (kind: BeltItem["kind"]) => (kind === "xray" ? { w: 0.7, h: 0.3 } : ITEMS[kind].size);

export class Renderer {
  private readonly g: CanvasRenderingContext2D;
  private bg: HTMLCanvasElement | null = null;
  private bgKey = "";
  private vignette: HTMLCanvasElement | null = null;
  private particles: Particle[] = [];
  private dpr = 1;
  private cssW = 1;
  private cssH = 1;
  cam: Camera = { scale: 60, ox: 0, oy: 0, w: 1, h: 1 };
  /** The camera's top (m), eased toward where it wants to be (Endless rises). */
  private camTop: number | null = null;
  slots: BeltSlot[] = [];
  private beltScroll = 0;
  private lastT = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    this.dpr = Math.min(dpr, this.maxDpr);
    this.sprites.clear();
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.bgKey = "";
  }

  /** Automatic quality (as in Glitch Run): two 2-second stretches averaging over 20 ms a frame step it down. */
  private maxDpr = 2;
  private slow = { frames: 0, ms: 0, strikes: 0 };

  /** A frame took `ms`: maybe draw at a lower resolution from now on. Returns true when it stepped down. */
  frameTook(ms: number): boolean {
    const q = this.slow;
    q.frames++;
    q.ms += Math.min(ms, 100);
    if (q.ms < 2000) return false;
    const avg = q.ms / q.frames;
    q.frames = 0;
    q.ms = 0;
    q.strikes = avg > 20 ? q.strikes + 1 : 0;
    if (q.strikes < 2 || this.maxDpr <= 1) return false;
    q.strikes = 0;
    this.maxDpr = this.maxDpr > 1.5 ? 1.5 : 1;
    this.resize(this.cssW, this.cssH, this.maxDpr);
    return true;
  }

  /** The camera for this frame (Endless follows the tower up). */
  private frameCamera(sim: Sim, dt: number): Camera {
    const want = sim.viewTop();
    this.camTop = this.camTop === null ? want : this.camTop + (want - this.camTop) * Math.min(1, dt * 2.5);
    const top = this.camTop;
    const rect = viewRect(sim.level.platform, sim.mode === "level" ? top : 7.6);
    if (sim.mode !== "level") {
      // A fixed-size window that rides up with the tower.
      const span = rect.top - rect.bottom;
      rect.top = Math.max(top, span + rect.bottom);
      rect.bottom = rect.top - span;
    }
    return fit(this.cssW, this.cssH, rect);
  }

  /** Screen → world, with this frame's camera. */
  toWorld(x: number, y: number): Vec {
    return toWorld(this.cam, x, y);
  }

  /** The belt item under a point (CSS px), with a generous margin for fingers. */
  beltAt(x: number, y: number, touch: boolean): number | null {
    const m = touch ? 14 : 6;
    let best: { uid: number; d: number } | null = null;
    for (const s of this.slots) {
      if (x < s.x - s.w / 2 - m || x > s.x + s.w / 2 + m || y < s.y - s.h / 2 - m || y > s.y + s.h / 2 + m) continue;
      const d = Math.hypot(x - s.x, y - s.y);
      if (!best || d < best.d) best = { uid: s.uid, d };
    }
    return best?.uid ?? null;
  }

  /** The bottom of the conveyor on screen (CSS px). */
  beltBottom(): number {
    return this.beltY + 0.3 * this.cam.scale;
  }
  private beltY = 0;

  /** A belt item's centre in the world (m): where it appears when you pick it up. */
  beltCentre(uid: number): Vec | null {
    const s = this.slots.find((x) => x.uid === uid);
    return s ? this.toWorld(s.x, s.y) : null;
  }

  // -- Sprites, cached as bitmaps (vector art redrawn every frame was the slow part on phones) ---------

  private sprites = new Map<string, HTMLCanvasElement>();

  /**
   * Draw an item's picture at the current transform (metres, y down, centred). Most come from a bitmap made
   * once at this zoom; the duck's dripping glue is drawn live.
   */
  private sprite(skin: ItemId, w: number, h: number, seed: number, t: number) {
    const g = this.g;
    if (skin === "duck") {
      SPRITES[skin](g, { w, h, t, seed });
      return;
    }
    const px = this.cam.scale * this.dpr;
    // Sizes that change (inflating, melting, squashing) are rounded so the cache stays small.
    const qw = Math.round(w * 50) / 50;
    const qh = Math.round(h * 50) / 50;
    const variant = skin === "block" ? seed % 30 : 0;
    const key = `${skin}:${variant}:${qw}:${qh}:${px.toFixed(1)}`;
    let c = this.sprites.get(key);
    if (!c) {
      const pad = 0.12;
      c = document.createElement("canvas");
      c.width = Math.max(1, Math.ceil((qw + pad * 2) * px));
      c.height = Math.max(1, Math.ceil((qh + pad * 2) * px));
      const cg = c.getContext("2d")!;
      cg.setTransform(px, 0, 0, px, c.width / 2, c.height / 2);
      SPRITES[skin](cg, { w: qw, h: qh, t: 0, seed: variant });
      if (this.sprites.size > 400) this.sprites.clear();
      this.sprites.set(key, c);
    }
    g.drawImage(c, -c.width / px / 2, -c.height / px / 2, c.width / px, c.height / px);
  }

  // -- Particles -----------------------------------------------------------------------------------

  burst(kind: Particle["kind"], at: Vec, n: number, color = "#FFFFFF", speed = 1.5) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      const life = kind === "puddle" ? 3 : kind === "drip" ? 0.9 : 0.5 + Math.random() * 0.7;
      this.particles.push({
        x: at.x + (Math.random() - 0.5) * 0.2,
        y: at.y + (Math.random() - 0.5) * 0.1,
        vx: Math.cos(a) * v,
        vy: kind === "dust" ? Math.abs(Math.sin(a)) * v * 0.4 : Math.sin(a) * v + (kind === "confetti" ? 2 : 0),
        life,
        max: life,
        size: kind === "shard" ? 0.06 + Math.random() * 0.06 : kind === "confetti" ? 0.07 : kind === "puddle" ? 0.5 : 0.05 + Math.random() * 0.05,
        color,
        kind,
        spin: (Math.random() - 0.5) * 12,
      });
    }
    if (this.particles.length > 160) this.particles.splice(0, this.particles.length - 160);
  }

  private stepParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      if (p.kind === "puddle") continue;
      p.vy -= (p.kind === "confetti" || p.kind === "leaf" ? 2.5 : p.kind === "dust" ? 0.6 : 9) * dt;
      if (p.kind === "confetti" || p.kind === "leaf") p.vx *= 0.98;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // -- The frame -----------------------------------------------------------------------------------

  draw(s: FrameState) {
    const { sim } = s;
    const dt = Math.min(0.05, Math.max(0, s.t - this.lastT));
    this.lastT = s.t;
    const g = this.g;
    const cam = this.frameCamera(sim, dt);
    this.cam = cam;
    this.stepParticles(dt);
    this.beltScroll += dt * sim.beltSpeed() * (sim.zen && this.beltFull(sim) ? 0 : 1);

    // Shake (earthquakes): the whole world wobbles a little, unless reduced.
    const quake = sim.hitting("earthquake");
    let shakeX = 0;
    if (quake && s.shake && !s.reduceMotion) shakeX = Math.sin(s.t * 2 * Math.PI * 2.2) * 0.04 * quake.strength * cam.scale;
    const dark = sim.status === "play" && !!sim.hitting("lightsOut");

    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.cssW, this.cssH);
    this.background(sim, cam);
    g.save();
    g.translate(shakeX, 0);

    // The world, in metres, y up.
    g.save();
    g.translate(cam.ox, cam.oy);
    g.scale(cam.scale, -cam.scale);
    this.platform(sim, s);
    this.goal(sim, s);
    if (!dark) this.shadowWarning(sim, s);
    for (const item of sim.items) if (item.state !== "held") this.item(item, s, !!dark);
    for (const c of sim.creatures) this.creature(c, s, !!dark);
    this.drawParticles(s);
    g.restore();

    this.belt(sim, s, cam, !!dark);

    // What you're holding is in front of everything, the belt included.
    const held = sim.held;
    if (held) {
      g.save();
      g.translate(cam.ox, cam.oy);
      g.scale(cam.scale, -cam.scale);
      this.item(held, s, !!dark);
      if (s.pointer) this.band(held, s);
      g.restore();
    }
    g.restore();

    this.overlays(sim, s, cam);
  }

  private beltFull(sim: Sim) {
    return sim.belt.some((b) => b.pos >= 0.9);
  }

  private background(sim: Sim, cam: Camera) {
    const key = `${sim.level.location}:${this.cssW}x${this.cssH}:${cam.scale.toFixed(2)}:${Math.round(cam.oy)}`;
    if (sim.mode !== "level") {
      // Endless: the sky darkens as you climb (and the backdrop's only drawn at the bottom).
      const p = PALETTES[sim.level.location];
      const g = this.g;
      const height = Math.max(0, (this.camTop ?? 0) - 7);
      const k = Math.min(1, height / 60);
      const grad = g.createLinearGradient(0, 0, 0, this.cssH);
      grad.addColorStop(0, mix(p.wall2, "#141B33", k));
      grad.addColorStop(1, mix(p.wall, "#2C3560", k * 0.8));
      g.fillStyle = grad;
      g.fillRect(0, 0, this.cssW, this.cssH);
      if (height < 6) {
        this.ensureBg(sim, cam, key);
        g.globalAlpha = 1 - height / 6;
        g.drawImage(this.bg!, 0, 0, this.cssW, this.cssH);
        g.globalAlpha = 1;
      }
      return;
    }
    this.ensureBg(sim, cam, key);
    this.g.drawImage(this.bg!, 0, 0, this.cssW, this.cssH);
  }

  private ensureBg(sim: Sim, cam: Camera, key: string) {
    if (this.bg && this.bgKey === key) return;
    this.bg ??= document.createElement("canvas");
    this.bg.width = Math.round(this.cssW * this.dpr);
    this.bg.height = Math.round(this.cssH * this.dpr);
    const bg = this.bg.getContext("2d")!;
    bg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const half = sim.level.platform / 2 + 0.3;
    const top = sim.mode === "level" ? sim.viewTop() : (this.camTop ?? sim.viewTop());
    drawScenery(bg, sim.level.location, {
      w: this.cssW,
      h: this.cssH,
      floorY: toScreen(cam, { x: 0, y: 0 }).y,
      groundY: toScreen(cam, { x: 0, y: FLOOR_Y }).y,
      beltBottom: toScreen(cam, { x: 0, y: top - 1.55 }).y + 0.28 * cam.scale,
      beltTop: toScreen(cam, { x: 0, y: top - 0.5 }).y,
      left: toScreen(cam, { x: -half - 0.2, y: 0 }).x,
      right: toScreen(cam, { x: half + 0.65, y: 0 }).x,
      scale: cam.scale,
    });
    this.bgKey = key;
  }

  private platform(sim: Sim, s: FrameState) {
    const g = this.g;
    const p = PALETTES[sim.level.location];
    const w = sim.platformWidth;
    // The pillar, down to the floor.
    g.fillStyle = shade(p.platform, -0.15);
    g.fillRect(-0.45, FLOOR_Y, 0.9, -FLOOR_Y);
    g.lineWidth = 0.035;
    g.strokeStyle = INK;
    g.strokeRect(-0.45, FLOOR_Y, 0.9, -FLOOR_Y);
    // The slab.
    g.save();
    g.scale(1, -1);
    rr(g, -w / 2, 0, w, 0.35, 0.06);
    g.fillStyle = p.platform;
    g.fill();
    g.lineWidth = 0.04;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(-w / 2 + 0.06, 0.04, w - 0.12, 0.05);
    g.restore();
    // A shrink coming: hazard stripes over what's about to go (§3: warning stripes on the edges).
    const e = sim.event;
    if (e && e.kind === "platformShrink" && e.phase === "warn") {
      const to = Math.max(2, w - 1);
      const cut = (w - to) / 2;
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? -w / 2 : w / 2 - cut;
        g.save();
        g.beginPath();
        g.rect(x0, -0.35, cut, 0.37);
        g.clip();
        g.fillStyle = "#FFD23F";
        g.fillRect(x0, -0.35, cut, 0.37);
        g.fillStyle = INK;
        const phase = s.reduceMotion ? 0 : (s.t * 0.4) % 0.24;
        for (let x = x0 - 0.5 + phase; x < x0 + cut + 0.5; x += 0.24) {
          g.beginPath();
          g.moveTo(x, -0.35);
          g.lineTo(x + 0.12, -0.35);
          g.lineTo(x + 0.3, 0.02);
          g.lineTo(x + 0.18, 0.02);
          g.closePath();
          g.fill();
        }
        g.restore();
      }
    }
  }

  private goal(sim: Sim, s: FrameState) {
    const g = this.g;
    const p = PALETTES[sim.level.location];
    const half = sim.level.platform / 2 + 0.1;
    if (sim.mode === "level") {
      const y = sim.goal;
      const holding = sim.stableTicks > 0;
      g.save();
      g.setLineDash([0.22, 0.14]);
      g.lineDashOffset = s.reduceMotion ? 0 : -s.t * 0.3;
      g.lineWidth = holding ? 0.07 : 0.05;
      g.strokeStyle = holding ? "#2BB673" : "#B8460C";
      g.beginPath();
      g.moveTo(-half, y);
      g.lineTo(half, y);
      g.stroke();
      g.restore();
      // The flag.
      g.fillStyle = INK;
      g.fillRect(half, y, 0.05, 0.6);
      const wind = sim.hitting("wind");
      const flap = wind && !s.reduceMotion ? Math.sin(s.t * 18) * 0.06 : Math.sin(s.t * 3) * 0.02;
      g.beginPath();
      g.moveTo(half + 0.05, y + 0.6);
      g.lineTo(half + 0.36 * (wind ? wind.dir : 1), y + 0.48 + flap);
      g.lineTo(half + 0.05, y + 0.36);
      g.closePath();
      g.fillStyle = holding ? "#2BB673" : "#B8460C";
      g.fill();
      g.lineWidth = 0.025;
      g.strokeStyle = INK;
      g.stroke();
      g.save();
      g.scale(1, -1);
      if (holding && sim.status === "play") {
        // Holding still: 3… 2… 1…, big, over the left end of the line (not over the tower).
        const left = Math.max(1, Math.ceil((STABLE_TICKS - sim.stableTicks) / 60));
        const pop = s.reduceMotion ? 1 : 1 + 0.25 * Math.max(0, 1 - ((sim.stableTicks % 60) / 60) * 4);
        g.save();
        g.translate(-half + 0.45, -y - 0.5);
        g.scale(pop, pop);
        g.lineWidth = 0.08;
        g.strokeStyle = INK;
        g.lineJoin = "round";
        strokeText(g, String(left), 0.85);
        g.fillStyle = "#2BB673";
        text(g, String(left), 0, 0, 0.85);
        g.restore();
      } else {
        g.fillStyle = holding ? "#1E7A4C" : "#B8460C";
        text(g, `GOAL ${sim.goal.toFixed(1)} m`, -half + 0.55, -y - 0.17, 0.17);
      }
      g.restore();
      return;
    }
    // Endless and the Daily Stack: a ruler, your best, and the milestones.
    g.save();
    g.scale(1, -1);
    const top = (this.camTop ?? 8) + 1;
    for (let m = 1; m < top; m++) {
      g.fillStyle = "rgba(46,42,79,0.45)";
      g.fillRect(-half, -m, m % 5 ? 0.12 : 0.25, 0.02);
      if (m % 5 === 0) text(g, `${m} m`, -half + 0.45, -m - 0.12, 0.15, 800);
    }
    for (const m of [10, 25, 50, 100]) {
      if (m > top + 2) continue;
      g.fillStyle = "rgba(201,162,39,0.6)";
      g.fillRect(-half, -m - 0.02, half * 2, 0.04);
      g.fillStyle = "#836919";
      text(g, `★ ${m} m`, half - 0.4, -m - 0.17, 0.18);
    }
    if (sim.best > 0.1) {
      g.setLineDash([0.18, 0.12]);
      g.lineWidth = 0.035;
      g.strokeStyle = p.trim;
      g.beginPath();
      g.moveTo(-half, -sim.best);
      g.lineTo(half, -sim.best);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = p.trim;
      text(g, `best ${sim.best.toFixed(1)} m`, half - 0.55, -sim.best - 0.16, 0.17);
    }
    g.restore();
  }

  /** The bird's shadow growing on the tower before it lands (its warning). */
  private shadowWarning(sim: Sim, s: FrameState) {
    const e = sim.event;
    if (!e || e.kind !== "bird" || e.phase !== "warn") return;
    const top = sim.towerTopPoint();
    const k = e.t / 120;
    const g = this.g;
    g.fillStyle = `rgba(20,16,40,${0.15 + 0.3 * k})`;
    g.beginPath();
    g.ellipse(top.x, top.y + 0.02, 0.1 + 0.25 * k, 0.04 + 0.05 * k, 0, 0, Math.PI * 2);
    g.fill();
    void s;
  }

  private item(item: Item, s: FrameState, dark: boolean) {
    const g = this.g;
    const body = item.body;
    const p = body.getPosition();
    g.save();
    g.translate(p.x, p.y);
    g.rotate(body.getAngle());
    if (dark) {
      this.silhouette(item.body, "#1B1530");
      g.restore();
      return;
    }
    const xray = s.sim.xray > 0;
    if (xray) g.globalAlpha = 0.35;
    g.scale(1, -1);
    const size = ITEMS[item.kind].size;
    const spread = 1 + 0.35 * (1 - item.squash);
    const w = size.w * item.scale * spread;
    const h = size.h * item.scale * item.squash;
    // Squashing keeps the bottom where it is.
    g.translate(0, (size.h * item.scale - h) / 2);
    const loading = s.sim.status === "play" && s.sim.event?.kind === "reskin" && s.sim.event.phase === "warn";
    if (item.set) g.globalAlpha *= 0.8;
    this.sprite(item.skin, w, h, item.uid, s.t);
    if (loading) this.missingTexture(w, h, s.t, item.uid);
    if (s.sim.hitting("iceAge")) {
      g.fillStyle = "rgba(220,240,255,0.35)";
      g.fillRect(-w / 2, -h / 2, w, h * 0.25);
    }
    g.restore();
    if (xray) {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(body.getAngle());
      this.xrayOutline(body);
      g.restore();
      g.save();
      g.translate(p.x, p.y);
      g.scale(1, -1);
      g.fillStyle = "#0F7366";
      text(g, `${body.getMass().toFixed(1)} kg`, 0, 0, 0.17);
      g.restore();
    }
  }

  /** "Texture loading…": a magenta-and-black checkerboard flickering over everything (the re-skin's tell). */
  private missingTexture(w: number, h: number, t: number, seed: number) {
    const g = this.g;
    if (Math.sin(t * 9 + seed) < 0.2) return;
    const n = 4;
    g.save();
    g.globalAlpha *= 0.55;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        g.fillStyle = (i + j) % 2 ? "#FF00DC" : "#111111";
        g.fillRect(-w / 2 + (i * w) / n, -h / 2 + (j * h) / n, w / n + 0.002, h / n + 0.002);
      }
    g.restore();
  }

  /** A body's true outline, filled (lights out) — shapes in the world frame, y up. */
  private silhouette(body: Item["body"], fill: string) {
    const g = this.g;
    for (let f = body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape();
      g.beginPath();
      if (shape.getType() === "circle") {
        const c = (shape as Circle).getCenter();
        g.arc(c.x, c.y, shape.getRadius(), 0, Math.PI * 2);
      } else {
        (shape as Polygon).m_vertices.forEach((v, i) => (i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)));
        g.closePath();
      }
      g.fillStyle = fill;
      g.fill();
      g.lineWidth = 0.025;
      g.strokeStyle = "rgba(255,255,255,0.25)";
      g.stroke();
    }
  }

  private xrayOutline(body: Item["body"]) {
    const g = this.g;
    for (let f = body.getFixtureList(); f; f = f.getNext()) {
      const shape = f.getShape();
      g.beginPath();
      if (shape.getType() === "circle") {
        const c = (shape as Circle).getCenter();
        g.arc(c.x, c.y, shape.getRadius(), 0, Math.PI * 2);
      } else {
        (shape as Polygon).m_vertices.forEach((v, i) => (i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)));
        g.closePath();
      }
      g.fillStyle = "rgba(94,230,200,0.25)";
      g.fill();
      g.lineWidth = 0.035;
      g.strokeStyle = "#0F7366";
      g.stroke();
    }
  }

  private creature(c: Sim["creatures"][number], s: FrameState, dark: boolean) {
    const g = this.g;
    const p = c.body.getPosition();
    g.save();
    g.translate(p.x, p.y);
    if (dark) {
      this.silhouette(c.body, "#1B1530");
      g.restore();
      return;
    }
    g.scale(1, -1);
    if (c.kind === "cat") {
      const facing = c.phase === "sit" ? -1 * c.dir : c.dir;
      drawCat(g, c.phase === "sit" || c.phase === "nudge", s.t, facing || 1);
    } else drawBird(g, c.phase !== "sit", s.t, c.dir);
    g.restore();
  }

  /** The hand's rubber band: from your pointer to where it holds the item. Long and red when it lags. */
  private band(item: Item, s: FrameState) {
    const g = this.g;
    const p = s.pointer!;
    const grip = s.grip ?? { x: 0, y: 0 };
    const at = item.body.getWorldPoint(grip);
    const d = Math.hypot(at.x - p.x, at.y - p.y);
    const k = Math.min(1, d / 1.2);
    const color = k < 0.25 ? "#2BB673" : k < 0.6 ? "#F2A541" : "#E63946";
    g.save();
    g.lineCap = "round";
    g.lineWidth = Math.max(0.018, 0.06 - k * 0.04);
    g.strokeStyle = color;
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.quadraticCurveTo((p.x + at.x) / 2, (p.y + at.y) / 2 - d * 0.15, at.x, at.y);
    g.stroke();
    g.beginPath();
    g.arc(at.x, at.y, 0.05, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    // The hand itself.
    g.beginPath();
    g.arc(p.x, p.y, s.touch ? 0.16 : 0.09, 0, Math.PI * 2);
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.fill();
    g.lineWidth = 0.03;
    g.strokeStyle = INK;
    g.stroke();
    g.restore();
  }

  private drawParticles(s: FrameState) {
    const g = this.g;
    for (const p of this.particles) {
      const a = Math.max(0, Math.min(1, p.life / p.max));
      g.globalAlpha = p.kind === "puddle" ? Math.min(1, a * 2) * 0.7 : a;
      g.fillStyle = p.color;
      if (p.kind === "puddle") {
        g.beginPath();
        g.ellipse(p.x, p.y, p.size, 0.04, 0, 0, Math.PI * 2);
        g.fill();
      } else if (p.kind === "shard" || p.kind === "confetti" || p.kind === "leaf") {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(s.reduceMotion ? 0 : (p.max - p.life) * p.spin);
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        g.restore();
      } else {
        g.beginPath();
        g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  // -- The conveyor ----------------------------------------------------------------------------------

  private belt(sim: Sim, s: FrameState, cam: Camera, dark: boolean) {
    const g = this.g;
    const p = PALETTES[sim.level.location];
    const surface = toScreen(cam, { x: 0, y: sim.viewTop() - 1.55 }).y;
    this.beltY = surface;
    const sc = cam.scale;
    const start = this.cssW + 0.7 * sc;
    const end = 0.55 * sc;
    const xOf = (pos: number) => start - pos * (start - end);
    // How much each item sags the belt (its real weight).
    const items = sim.belt.map((b) => {
      const mass = b.kind === "xray" ? 0.1 : ITEMS[b.kind].mass;
      const floats = b.kind === "safe";
      return { b, x: xOf(b.pos), mass, floats, size: ITEM_SIZE(b.kind) };
    });
    const sag = (x: number) =>
      items.reduce((d, it) => {
        if (it.floats) return d;
        const reach = (it.size.w / 2 + 0.25) * sc;
        const k = Math.max(0, 1 - Math.abs(x - it.x) / reach);
        return d + k * Math.min(1, it.mass / 6) * 0.075 * sc;
      }, 0);

    // The frame and rollers under the belt.
    g.fillStyle = shade(p.belt, -0.2);
    g.fillRect(0, surface + 0.12 * sc, this.cssW, 0.16 * sc);
    g.fillStyle = dark ? "#0D0A18" : p.belt;
    g.beginPath();
    g.moveTo(0, surface);
    for (let x = 0; x <= this.cssW; x += 6) g.lineTo(x, surface + sag(x));
    g.lineTo(this.cssW, surface + 0.12 * sc);
    g.lineTo(0, surface + 0.12 * sc);
    g.closePath();
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = INK;
    g.stroke();
    // Chevrons moving left.
    if (!dark) {
      g.strokeStyle = "rgba(255,255,255,0.22)";
      g.lineWidth = 2;
      const gap = 0.5 * sc;
      const off = ((this.beltScroll * (start - end)) / (sim.level.belt || 1)) % gap;
      for (let x = this.cssW + gap - off; x > -gap; x -= gap) {
        const y = surface + sag(x) + 0.06 * sc;
        g.beginPath();
        g.moveTo(x + 0.08 * sc, y - 0.035 * sc);
        g.lineTo(x, y);
        g.lineTo(x + 0.08 * sc, y + 0.035 * sc);
        g.stroke();
      }
      for (let x = 0.3 * sc; x < this.cssW; x += 0.9 * sc) {
        g.beginPath();
        g.arc(x, surface + 0.2 * sc, 0.06 * sc, 0, Math.PI * 2);
        g.fillStyle = "#B8C0CC";
        g.fill();
        g.lineWidth = 1.5;
        g.strokeStyle = INK;
        g.stroke();
      }
    }
    // The drop-off at the left end: a chute into a bin.
    g.fillStyle = dark ? "#0D0A18" : "#7A7F8C";
    g.fillRect(0, surface - 0.05 * sc, end - 0.25 * sc, 0.4 * sc);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.strokeRect(0, surface - 0.05 * sc, end - 0.25 * sc, 0.4 * sc);

    // The items, by their looks (and their tells).
    this.slots = [];
    const reskin = sim.status === "play" && sim.event?.kind === "reskin" && sim.event.phase === "warn";
    for (const it of items) {
      const { b, size } = it;
      const kind = b.kind;
      let w = size.w * sc;
      let h = size.h * sc;
      let lift = 0;
      let angle = 0;
      const tapAt = s.taps.get(b.uid);
      const tapK = tapAt !== undefined ? Math.max(0, 1 - (s.t - tapAt) / 0.45) : 0;
      if (!s.reduceMotion) {
        if (kind === "safe") lift = (0.05 + 0.015 * Math.sin(s.t * 2.4 + b.uid)) * sc;
        if (kind === "box") angle = Math.sin(s.t * 3.1 + b.uid) * 0.12;
        if (kind === "jelly") {
          const j = Math.sin(s.t * 14 + b.uid) * 0.05;
          w *= 1 + j;
          h *= 1 - j;
        }
        if (kind === "cake") {
          const bump = Math.max(0, Math.sin(s.t * 5 + b.uid)) ** 8 * 0.06;
          h *= 1 - bump;
          w *= 1 + bump * 0.5;
        }
        if (kind === "xray") lift = (0.08 + 0.03 * Math.sin(s.t * 3)) * sc;
      } else if (kind === "safe") lift = 0.05 * sc;
      if (kind === "balloon") {
        const grow = 1 + 0.12 * Math.min(1, b.pos);
        w *= grow;
        h *= grow;
      }
      if (tapK > 0) lift += Math.sin(tapK * Math.PI) * 0.08 * sc;
      const x = it.x;
      const y = surface + sag(x) - h / 2 - lift;
      this.slots.push({ uid: b.uid, x, y, w, h });
      // Its shadow (a hovering safe's shadow sits apart from it: the tell).
      g.fillStyle = "rgba(20,16,40,0.25)";
      g.beginPath();
      g.ellipse(x, surface + sag(x) - 1, (w / 2) * 0.85, 0.035 * sc, 0, 0, Math.PI * 2);
      g.fill();
      g.save();
      g.translate(x, y);
      g.rotate(angle);
      if (dark && kind !== "xray") {
        // Lights out: the true shape's silhouette.
        g.scale(sc, -sc);
        const pts = ITEMS[kind].shape.kind === "circle" ? null : outline(ITEMS[kind].shape);
        g.beginPath();
        if (pts) pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
        else g.arc(0, 0, (ITEMS[kind].shape as { r: number }).r, 0, Math.PI * 2);
        g.closePath();
        g.fillStyle = "#1B1530";
        g.fill();
        g.lineWidth = 0.025;
        g.strokeStyle = "rgba(255,255,255,0.25)";
        g.stroke();
      } else {
        g.scale(sc, sc);
        if (kind === "xray") drawGlasses(g, size.w);
        else {
          const skin: ItemId = sim.skinOf(kind);
          this.sprite(skin, w / sc, h / sc, b.uid, s.t);
          if (reskin) this.missingTexture(w / sc, h / sc, s.t, b.uid);
          if (sim.xray > 0) {
            g.fillStyle = "#0F7366";
            text(g, `${ITEMS[kind].mass} kg`, 0, -h / sc / 2 - 0.15, 0.16);
          }
        }
      }
      g.restore();
      // Ice drips on the belt.
      if (kind === "ice" && !s.reduceMotion && Math.random() < 0.05) {
        const at = this.toWorld(x + (Math.random() - 0.5) * w * 0.6, y + h / 2);
        this.burst("drip", at, 1, "#8CCBF2", 0.2);
      }
      // Hovered: an outline to show it can be picked up.
      if (s.hover === b.uid) {
        g.save();
        g.setLineDash([6, 4]);
        g.lineWidth = 2.5;
        g.strokeStyle = "#B8460C";
        rr(g, x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 10);
        g.stroke();
        g.restore();
      }
    }
    // Gears at the ends (they whine and spin up before a conveyor rush).
    const rush = sim.event?.kind === "conveyorRush" ? sim.event : null;
    const spin = s.reduceMotion ? 0 : s.t * (rush ? (rush.phase === "warn" ? 6 + rush.t / 10 : 14) : 2) * sim.beltSpeed();
    for (const x of [this.cssW - 0.35 * sc, end - 0.05 * sc]) gear(g, x, surface + 0.2 * sc, 0.16 * sc, spin, rush ? "#FFD23F" : "#B8C0CC");
  }

  // -- Overlays: events, the siren, the panic vignette ------------------------------------------------

  private overlays(sim: Sim, s: FrameState, cam: Camera) {
    const g = this.g;
    // Once the level's over, its events are too.
    const e = sim.status === "play" ? sim.event : null;
    const W = this.cssW;
    const H = this.cssH;
    // Lights out (and its flicker warning).
    const dark = e?.kind === "lightsOut" && e.phase === "hit";
    if (dark) {
      g.fillStyle = "rgba(8,6,20,0.62)";
      g.fillRect(0, 0, W, H);
    } else if (e?.kind === "lightsOut" && e.phase === "warn") {
      // A flicker: at most 3 a second (WCAG 2.3.1), or a gentle dim.
      const flick = s.reduceFlashing ? 0.15 + 0.15 * Math.sin(s.t * 3) : Math.sin(s.t * Math.PI * 2 * 2.5) > 0.6 ? 0.45 : 0;
      g.fillStyle = `rgba(8,6,20,${flick})`;
      g.fillRect(0, 0, W, H);
    }
    // Frost creeping in from the corners (ice age).
    if (e?.kind === "iceAge") {
      const k = e.phase === "warn" ? e.t / 120 : 1;
      for (const [x, y] of [
        [0, 0],
        [W, 0],
        [0, H],
        [W, H],
      ] as const) {
        const r = Math.max(W, H) * (0.18 + 0.22 * k);
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(225,245,255,0.85)");
        grad.addColorStop(1, "rgba(225,245,255,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);
      }
    }
    // Wind streaks.
    const wind = e?.kind === "wind" ? e : null;
    if (wind && !s.reduceMotion) {
      g.strokeStyle = "rgba(255,255,255,0.6)";
      g.lineWidth = 2;
      const n = wind.phase === "hit" ? 14 : 4;
      for (let k = 0; k < n; k++) {
        const y = ((k * 137) % 100) / 100 * H * 0.8 + H * 0.1;
        const x = (((s.t * 600 * wind.dir + k * 211) % (W + 200)) + W + 200) % (W + 200) - 100;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x - wind.dir * 60, y);
        g.stroke();
      }
    }
    // Sparkles before and during low gravity.
    if (e?.kind === "lowGravity" && !s.reduceMotion) {
      g.fillStyle = "rgba(255,240,170,0.9)";
      for (const item of sim.items) {
        const p = toScreen(cam, item.body.getPosition());
        const k = Math.sin(s.t * 7 + item.uid * 1.7);
        if (k > 0.3) star4(g, p.x + Math.sin(item.uid) * 12, p.y + Math.cos(item.uid) * 10, 3 + 3 * k);
      }
    }
    // The cat's paw at the screen's edge (its warning).
    if (e?.kind === "cat" && e.phase === "warn") {
      const side = -e.dir;
      const k = Math.min(1, e.t / 60);
      const x = side < 0 ? 0 : W;
      const y = toScreen(cam, { x: 0, y: 0.4 }).y;
      g.save();
      g.translate(x - side * (-30 + 40 * k), y);
      g.fillStyle = "#F29E4C";
      g.strokeStyle = INK;
      g.lineWidth = 2.5;
      g.beginPath();
      g.ellipse(0, 0, 34, 20, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = "#FF9EBB";
      for (const [px, py] of [
        [-side * 14, -10],
        [-side * 20, 2],
        [-side * 14, 12],
      ] as const) {
        g.beginPath();
        g.arc(px, py, 4.5, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
    // The siren: real (a spinning beacon) or a cardboard cut-out (the fake's tell).
    if (e && e.siren) this.siren(e.siren, e.t, s, cam);
    // The panic vignette: a soft red pulse at the edges, never a flash.
    const panic = sim.panic / 100;
    if (panic > 0.45) {
      this.vignette ??= makeVignette();
      const pulse = s.reduceFlashing || s.reduceMotion || panic < 0.7 ? 1 : 0.8 + 0.2 * Math.sin(s.t * Math.PI * 2 * (1 + panic));
      g.globalAlpha = Math.min(0.75, (panic - 0.45) * 1.4) * pulse;
      g.drawImage(this.vignette, 0, 0, W, H);
      g.globalAlpha = 1;
    }
  }

  private siren(kind: "real" | "fake", t: number, s: FrameState, cam: Camera) {
    const g = this.g;
    const x = this.cssW - 0.9 * cam.scale;
    const r = 0.32 * cam.scale;
    const y = this.beltBottom() + r * 1.4 + 12;
    g.save();
    g.translate(x, y);
    if (kind === "real") {
      // Rotating light beams.
      if (!s.reduceFlashing) {
        const a = (t / 60) * Math.PI * 2 * 1.4;
        g.fillStyle = "rgba(230,57,70,0.22)";
        for (const off of [0, Math.PI]) {
          g.beginPath();
          g.moveTo(0, -r * 0.5);
          g.arc(0, -r * 0.5, r * 4, a + off - 0.25, a + off + 0.25);
          g.closePath();
          g.fill();
        }
      }
      g.beginPath();
      g.arc(0, -r * 0.4, r * 0.8, Math.PI, 0);
      g.closePath();
      g.fillStyle = "#E63946";
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.fillStyle = "#3B3F4A";
      g.fillRect(-r, -r * 0.4, r * 2, r * 0.45);
      g.strokeRect(-r, -r * 0.4, r * 2, r * 0.45);
      g.fillStyle = "rgba(255,255,255,0.6)";
      g.fillRect(-r * 0.4, -r * 0.95, r * 0.18, r * 0.35);
    } else {
      // A flat cardboard cut-out: painted-on beams, a fold-out stand, sticky tape, and it wobbles.
      g.rotate(s.reduceMotion ? 0 : Math.sin(t * 0.15) * 0.08);
      g.fillStyle = "#C9955C";
      g.beginPath();
      g.moveTo(-r * 0.2, r * 0.05);
      g.lineTo(-r * 0.9, r * 1.1);
      g.lineTo(-r * 0.7, r * 1.1);
      g.closePath();
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 2;
      g.stroke();
      g.beginPath();
      g.moveTo(-r * 1.1, -r * 0.9);
      g.lineTo(r * 1.1, -r * 0.9);
      g.lineTo(r * 1.1, r * 0.1);
      g.lineTo(-r * 1.1, r * 0.1);
      g.closePath();
      g.fillStyle = "#D8B07C";
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(0, -r * 0.3, r * 0.55, Math.PI, 0);
      g.closePath();
      g.fillStyle = "#E66A72";
      g.fill();
      g.stroke();
      // Painted beams.
      g.strokeStyle = "#E66A72";
      g.lineWidth = 3;
      for (const a of [-2.6, -1.9, -1.2, -0.5]) {
        g.beginPath();
        g.moveTo(Math.cos(a) * r * 0.65, -r * 0.3 + Math.sin(a) * r * 0.65);
        g.lineTo(Math.cos(a) * r * 1.0, -r * 0.3 + Math.sin(a) * r * 1.0);
        g.stroke();
      }
      g.fillStyle = "rgba(255,255,220,0.7)";
      g.fillRect(-r * 1.25, -r * 0.95, r * 0.5, r * 0.18);
      g.fillRect(r * 0.75, -r * 0.95, r * 0.5, r * 0.18);
    }
    g.restore();
  }
}

/** An outline for big words in metres (drawn ×100, like `text`). */
function strokeText(g: CanvasRenderingContext2D, words: string, size: number) {
  g.save();
  g.scale(0.01, 0.01);
  g.font = `900 ${size * 100}px ${canvasFont.family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth *= 100;
  g.strokeText(words, 0, 0);
  g.restore();
}

function makeVignette(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 192;
  c.height = 108;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(96, 54, 30, 96, 54, 110);
  grad.addColorStop(0, "rgba(230,57,70,0)");
  grad.addColorStop(1, "rgba(230,57,70,0.9)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 192, 108);
  return c;
}

function gear(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, fill: string) {
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.beginPath();
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    const d = k % 2 ? r * 0.75 : r;
    if (k) g.lineTo(Math.cos(ang) * d, Math.sin(ang) * d);
    else g.moveTo(Math.cos(ang) * d, Math.sin(ang) * d);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = INK;
  g.stroke();
  g.beginPath();
  g.arc(0, 0, r * 0.25, 0, Math.PI * 2);
  g.fillStyle = INK;
  g.fill();
  g.restore();
}

function star4(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  g.moveTo(x, y - r);
  g.lineTo(x + r * 0.25, y - r * 0.25);
  g.lineTo(x + r, y);
  g.lineTo(x + r * 0.25, y + r * 0.25);
  g.lineTo(x, y + r);
  g.lineTo(x - r * 0.25, y + r * 0.25);
  g.lineTo(x - r, y);
  g.lineTo(x - r * 0.25, y - r * 0.25);
  g.closePath();
  g.fill();
}

/** Lighten (k > 0) or darken (k < 0) a #rrggbb colour. */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.max(0, Math.min(255, k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function mix(a: string, b: string, k: number): string {
  const p = parseInt(a.slice(1), 16);
  const q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 255) * (1 - k) + ((q >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

