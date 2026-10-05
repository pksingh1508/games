// A careful stacker (Plan/11-panic-stack.md §10 rule 6, §14 "Every level has at least one tested solution").
// It plays through the same inputs a hand does (grab a belt item, drag it over, turn it, lower it until it
// touches, let go) at a human pace, and it knows what every item really is: it lays the rolling box on its
// side, puts heavy things down gently, parks the trouble (ice, balloons, vases, bowling balls) on the floor
// beside the tower, chases a floating safe down with the next item, and waits out the panic events. If it
// can build a level's tower, the level is possible.
import { MAX_FALLS, seconds } from "./constants";
import { clamp, type Vec } from "./geometry";
import { ITEMS, outline, type ItemId } from "./items";
import type { EventKind } from "./level";
import type { Command, Item, Sim, TickInput } from "./sim";
import { topOf } from "./sim";

export interface BotOptions {
  /** How fast its hand moves (m/s). */
  speed?: number;
  /** Seconds the tower must be still before the next placement. */
  settle?: number;
  /** Put these on the floor beside the tower, not on top. */
  park?: readonly ItemId[];
  /** Let these ride off the belt, if a fall can be afforded. */
  skip?: readonly ItemId[];
  /** Hold off while these events are on. */
  wary?: readonly EventKind[];
  /** Where a belt item really is (a screen's belt), if not the simulation's own idea of it. */
  beltAt?: (uid: number, pos: number) => Vec | null;
  /**
   * A first-timer instead (for measuring difficulty): believes what things look like (never turns the box,
   * never parks anything), lets go a little higher, and puts things down a little off-centre.
   */
  naive?: { seed: number; sloppy: number; drop: number };
}

const DEFAULT_PARK: ItemId[] = ["ice", "balloon", "bowling", "vase", "jelly", "cake"];
const PHYSICAL: EventKind[] = ["earthquake", "wind", "tilt", "lowGravity", "iceAge", "cat", "bird", "platformShrink"];

interface Plan {
  x: number;
  angle: number;
  park: boolean;
  /** Half the item's width and height at that angle (physics). */
  hw: number;
  hh: number;
}

type Phase = "idle" | "carry" | "lower" | "hold" | "settle";

export class Bot {
  private phase: Phase = "idle";
  private plan: Plan | null = null;
  private aim: Vec | null = null;
  private t = 0;
  private sinceRelease = 999;
  private readonly speed: number;
  private readonly settle: number;
  private readonly park: Set<ItemId>;
  private readonly skip: Set<ItemId>;
  private readonly wary: Set<EventKind>;
  private turned = 0;
  private readonly beltAt?: BotOptions["beltAt"];
  private readonly naive?: BotOptions["naive"];
  private noise = 1;

  constructor(
    private readonly sim: Sim,
    options: BotOptions = {},
  ) {
    this.speed = options.speed ?? 3;
    this.settle = options.settle ?? 0.5;
    this.park = new Set(options.park ?? DEFAULT_PARK);
    this.skip = new Set(options.skip ?? []);
    this.wary = new Set(options.wary ?? PHYSICAL);
    this.beltAt = options.beltAt;
    this.naive = options.naive;
    if (this.naive) {
      this.park = new Set();
      this.noise = this.naive.seed || 1;
    }
  }

  /** A first-timer's wobble: −1..1, seeded. */
  private wobble() {
    this.noise = (this.noise * 1103515245 + 12345) & 0x7fffffff;
    return (this.noise / 0x3fffffff) - 1;
  }

  /** Where its hand is (for drawing). */
  aimPoint(): Vec | null {
    return this.aim;
  }

  /** This tick's input. */
  next(): TickInput {
    const sim = this.sim;
    const commands: Command[] = [];
    this.t++;
    this.sinceRelease++;
    if (sim.status !== "play") return { aim: null, commands };
    const held = sim.held;
    const danger = this.danger();

    switch (this.phase) {
      case "idle": {
        if (held) {
          this.phase = "carry";
          break;
        }
        if (sim.mode === "level" && sim.top >= sim.goal) break;
        if (sim.stillFor < this.settle && this.sinceRelease < seconds(3) && !danger) break;
        const pick = this.choose();
        if (!pick) break;
        const at = this.beltAt?.(pick.uid, pick.pos) ?? sim.beltPoint(pick.pos);
        commands.push({ type: "grab", uid: pick.uid, at });
        this.aim = { ...at };
        this.plan = null;
        this.turned = 0;
        this.phase = "carry";
        this.t = 0;
        break;
      }
      case "carry": {
        if (!held || !this.aim) {
          this.phase = "idle";
          break;
        }
        this.plan ??= this.planFor(held);
        const plan = this.plan;
        // Turn it on the way (one 15° step every few ticks).
        const steps = Math.round(plan.angle / (Math.PI / 12));
        if (this.turned !== steps && this.t % 4 === 0) {
          const d = Math.sign(steps - this.turned);
          commands.push({ type: "rotate", steps: d });
          this.turned += d;
        }
        const surface = this.surface(plan.x, plan.hw, held);
        const hover = { x: plan.x, y: Math.max(surface + plan.hh + (danger ? 0.9 : 0.45), Math.min(this.aim.y, sim.viewTop() - 1)) };
        // Over the top of everything first, then across.
        const clear = this.highest(held) + plan.hh + 0.35;
        const waypoint = Math.abs(this.aim.x - plan.x) > 0.05 ? { x: plan.x, y: Math.max(hover.y, clear) } : hover;
        this.moveAim(waypoint);
        const p = held.body.getPosition();
        const v = held.body.getLinearVelocity();
        const angleOk = Math.abs(held.body.getAngle() - plan.angle) < 0.06;
        if (Math.hypot(p.x - waypoint.x, p.y - waypoint.y) < 0.06 && Math.hypot(v.x, v.y) < 0.25 && angleOk && waypoint === hover && !danger) {
          this.phase = "lower";
        }
        break;
      }
      case "lower": {
        if (!held || !this.aim || !this.plan) {
          this.phase = "idle";
          break;
        }
        if (danger) {
          // Back up and wait it out.
          this.moveAim({ x: this.plan.x, y: this.surface(this.plan.x, this.plan.hw, held) + this.plan.hh + 0.6 });
          break;
        }
        const surface = this.surface(this.plan.x, this.plan.hw, held);
        const bottom = held.body.getPosition().y - this.plan.hh;
        if (this.touching(held) || bottom - surface < 0.005 + (this.naive?.drop ?? 0)) {
          this.phase = "hold";
          this.t = 0;
          break;
        }
        // Slow down near the surface.
        const gap = bottom - surface;
        const rate = gap > 0.25 ? 1 : 0.45;
        this.aim = { x: this.plan.x, y: this.aim.y - rate / 60 };
        break;
      }
      case "hold": {
        if (!held) {
          this.phase = "idle";
          break;
        }
        // Let it rest on what's below for a moment, then let go.
        if (this.t >= 8) {
          commands.push({ type: "release" });
          this.phase = "settle";
          this.sinceRelease = 0;
          this.t = 0;
        }
        break;
      }
      case "settle": {
        if (this.t > 2) this.phase = "idle";
        break;
      }
    }
    return { aim: this.aim, commands };
  }

  /** A physical event warned or happening: the bot holds its item up high until it's over. */
  private danger(): boolean {
    const sim = this.sim;
    const e = sim.event;
    // The cat leaping onto the tower, a bird coming down: let them land first. And don't stack things on a
    // bird: it flies off in a few seconds (whatever's on it doesn't).
    if (sim.creatures.some((c) => c.phase === "jump" || c.phase === "land" || c.phase === "enter" || (c.kind === "bird" && c.phase === "sit"))) return true;
    if (!e || e.kind === "fakePanic" || !this.wary.has(e.kind)) return false;
    if (e.kind === "cat" || e.kind === "bird") return e.phase === "warn";
    return true;
  }

  /** The next belt item to take: the one nearest the end, unless it's one to skip and a fall can be spared. */
  private choose() {
    const sim = this.sim;
    const order = [...sim.belt].filter((b) => b.kind !== "xray").sort((a, b) => b.pos - a.pos);
    let pending = order.filter((b) => this.skipped.has(b.uid)).length;
    for (const b of order) {
      if (this.skipped.has(b.uid)) continue;
      // Keep a fall in hand for accidents: skip only while that leaves one to spare.
      if (this.skip.has(b.kind as ItemId) && order.length > 1 && (sim.zen || sim.falls + pending + 1 < MAX_FALLS - 1)) {
        this.skipped.add(b.uid);
        pending++;
        continue;
      }
      return b;
    }
    return order[0] ?? null;
  }

  private skipped = new Set<number>();

  private moveAim(to: Vec) {
    const a = this.aim!;
    const dx = to.x - a.x;
    const dy = to.y - a.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed / 60;
    this.aim = d <= step ? { ...to } : { x: a.x + (dx / d) * step, y: a.y + (dy / d) * step };
  }

  /** Where and how to put an item down. */
  private planFor(item: Item): Plan {
    const sim = this.sim;
    const def = ITEMS[item.kind];
    const angle = !this.naive && (item.kind === "box" || item.kind === "statue") ? Math.PI / 2 : 0;
    const pts = def.shape.kind === "circle" ? null : outline(def.shape);
    const hw = pts ? Math.max(...pts.map((p) => Math.abs(angle ? p.y : p.x))) : (def.shape as { r: number }).r;
    const hh = pts ? Math.max(...pts.map((p) => Math.abs(angle ? p.x : p.y))) : hw;
    const half = sim.platformWidth / 2;
    // It may finish the tower with a troublesome item, unless it's slippery, round, or melting.
    const finisher = !["ice", "jelly", "bowling", "balloon", "safe"].includes(item.kind);
    const reachGoal = sim.mode === "level" && sim.top + hh * 2 >= sim.goal && finisher;
    if (this.park.has(item.kind) && !reachGoal) {
      // A spot on the floor at the edge, away from the tower and anything parked already.
      for (const side of [1, -1]) {
        const x = side * (half - hw - 0.08);
        if (this.surface(x, hw, item) < 0.05 && Math.abs(x) - hw > this.towerHalfWidth(item) + 0.1) return { x, angle, park: true, hw, hh };
      }
    }
    const off = this.naive ? this.wobble() * this.naive.sloppy : 0;
    return { x: this.columnX(hw, item) + off, angle, park: false, hw, hh };
  }

  /** The middle of the tower's highest plateau, kept on the platform. */
  private columnX(hw: number, ignore: Item): number {
    const sim = this.sim;
    const half = sim.platformWidth / 2;
    const xs: number[] = [];
    for (let x = -half + 0.05; x <= half - 0.05; x += 0.05) xs.push(x);
    const heights = xs.map((x) => this.surface(x, 0.01, ignore, true));
    // The column: what's near the middle (parked things at the edges don't count).
    let best = -Infinity;
    xs.forEach((x, k) => {
      if (Math.abs(x) < 0.9) best = Math.max(best, heights[k]!);
    });
    if (best < 0.05) return 0;
    const top = xs.filter((x, k) => Math.abs(x) < 0.9 && heights[k]! > best - 0.04);
    const mid = (Math.min(...top) + Math.max(...top)) / 2;
    return clamp(mid, -half + hw, half - hw);
  }

  private towerHalfWidth(ignore: Item): number {
    let w = 0.45;
    for (const i of this.sim.items) {
      if (i === ignore || i.state !== "free") continue;
      const p = i.body.getPosition();
      if (Math.abs(p.x) < 0.9 && topOf(i.body) > 0.6) w = Math.max(w, Math.abs(p.x) + 0.45);
    }
    return w;
  }

  /** The highest thing at all (to carry over it). */
  private highest(ignore: Item): number {
    let top = 0;
    for (const i of this.sim.items) if (i !== ignore && i.state === "free") top = Math.max(top, topOf(i.body));
    for (const c of this.sim.creatures) top = Math.max(top, topOf(c.body));
    return top;
  }

  /** The surface height under [x − hw, x + hw]: the platform, items, a sitting cat. */
  private surface(x: number, hw: number, ignore: Item, single = false): number {
    const sim = this.sim;
    let best = -1;
    const samples = single ? [x] : [-1, -0.66, -0.33, 0, 0.33, 0.66, 1].map((k) => x + k * Math.max(0, hw - 0.03));
    for (const sx of samples) {
      const from = { x: sx, y: sim.viewTop() + 6 };
      const to = { x: sx, y: -0.5 };
      let hit = -1;
      sim.world.rayCast(from, to, (fixture, point, _normal, fraction) => {
        const body = fixture.getBody();
        if (body === ignore.body) return -1;
        // A safe that's drifted well clear of the tower is gone: don't chase it up the screen.
        if (point.y > sim.top + 0.9 && body.getLinearVelocity().y > 0.05) return -1;
        hit = point.y;
        return fraction;
      });
      if (Math.abs(sx) <= sim.platformWidth / 2) hit = Math.max(hit, 0);
      best = Math.max(best, hit);
    }
    return best;
  }

  private touching(item: Item): boolean {
    for (let ce = item.body.getContactList(); ce; ce = ce.next) if (ce.contact.isTouching()) return true;
    return false;
  }
}
