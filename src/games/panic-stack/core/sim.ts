// The simulation (Plan/11-panic-stack.md §3, §12): a Planck.js world with the platform, the items you've
// placed, the one in your hand, the conveyor, the panic events and the creatures they bring (the cat, the
// bird), the panic meter, and the rules: reach the goal line and hold still for three seconds; three falls,
// the clock or a broken vase and it's over. One `step` is one tick (1/60 s, four physics sub-steps). Pure and
// seeded: no clocks, no Math.random, so the same inputs always build the same tower (the tests rely on it).
import { Box, Circle, Polygon, WeldJoint, World, type Body, type Contact, type ContactImpulse, type Fixture, type Joint } from "planck";
import { createRng, pick, type Rng } from "@/engine/rng";
import {
  BELT_SLOTS,
  DT,
  FALL_Y,
  FLOOR_Y,
  GRAVITY,
  HAND_FORCE,
  HAND_GAIN,
  HAND_GRIP,
  HAND_GRIP_LIGHT,
  HAND_TOP_SPEED,
  HZ,
  LIGHT_MASS,
  MAX_FALLS,
  PLATFORM_THICKNESS,
  POSITION_ITERATIONS,
  RELEASE_SPEED,
  ROTATE_STEP,
  seconds,
  SET_DEPTH,
  STABLE_TICKS,
  STILL_SPEED,
  STILL_SPIN,
  SUBSTEPS,
  VELOCITY_ITERATIONS,
  WRIST_GAIN,
  WRIST_GRIP,
  WRIST_TORQUE,
  XRAY_TICKS,
} from "./constants";
import { EVENTS, Scheduler, type ActiveEvent } from "./events";
import { clamp, wrapAngle, type Vec } from "./geometry";
import { areaOf, behaviourOf, ITEMS, outline, type ItemId } from "./items";
import type { BeltKind, EventKind, LevelDef } from "./level";
import { clampPanic, drift, PANIC } from "./panic";

export type Mode = "level" | "endless" | "daily";

export interface SimOptions {
  level: LevelDef;
  seed: number;
  mode?: Mode;
  /** Zen (§11): no timer, no events, no fail; the belt waits for you. */
  zen?: boolean;
  /** Slow conveyor assist (§11). */
  slowBelt?: boolean;
}

export type ItemState = "held" | "free" | "fallen";

export interface Item {
  uid: number;
  /** What it really is. */
  kind: ItemId;
  /** What it looks like right now (a re-skin swaps these). */
  skin: ItemId;
  body: Body;
  state: ItemState;
  /** Inflate and melt. */
  scale: number;
  /** Cake: 1 is unsquashed. */
  squash: number;
  /** Ticks since it was let go (−1: never). */
  age: number;
  welds: number;
  /** It has touched something since it was let go. */
  landed: boolean;
  /** The hardest hit this tick (N·s in one sub-step), and the load from above (N). */
  hit: number;
  load: number;
  /** Endless: set in place (static) far below the top. */
  set: boolean;
  stillTicks: number;
  /** When it fell (it lies on the floor a moment, then vanishes). */
  fellAt: number;
}

export interface BeltItem {
  uid: number;
  kind: BeltKind;
  /** 0 just in on the right, 1 dropping off the left. */
  pos: number;
}

export type CreatureKind = "cat" | "bird";

export interface Creature {
  kind: CreatureKind;
  body: Body;
  phase: "enter" | "walk" | "nudge" | "jump" | "sit" | "leave" | "land" | "fly";
  t: number;
  dir: -1 | 1;
  target: Vec | null;
}

export interface Hand {
  uid: number;
  /** Where the item's centre should go (m). */
  aim: Vec;
  /** The angle you've turned it to. */
  angle: number;
}

export type Command =
  /** Pick a belt item up; `at` is its centre where you took it. */
  | { type: "grab"; uid: number; at: Vec }
  | { type: "rotate"; steps: number }
  | { type: "release" }
  | { type: "oops" }
  /** The tap test (a sound and a caption; X-ray glasses put themselves on). */
  | { type: "tap"; uid: number };

export interface TickInput {
  /** Where the held item's centre should go this tick. */
  aim: Vec | null;
  commands: Command[];
}

export type LoseReason = "falls" | "time" | "broke";

export type SimEvent =
  | { type: "grab"; uid: number; kind: ItemId }
  | { type: "release"; uid: number; kind: ItemId }
  | { type: "land"; uid: number; kind: ItemId; impulse: number; gentle: boolean; at: Vec }
  | { type: "bump"; uid: number; kind: ItemId; impulse: number; at: Vec }
  | { type: "fall"; uid: number; kind: BeltKind; why: "platform" | "belt" | "floated" }
  | { type: "break"; uid: number; at: Vec }
  | { type: "pop"; uid: number; at: Vec }
  | { type: "melted"; uid: number; at: Vec }
  /** A fallen item vanishing from the floor. */
  | { type: "gone"; uid: number; at: Vec }
  | { type: "weld"; uid: number; at: Vec }
  | { type: "squish"; uid: number }
  | { type: "tap"; uid: number; kind: BeltKind }
  | { type: "xray" }
  | { type: "warn"; event: ActiveEvent }
  | { type: "eventHit"; event: ActiveEvent }
  | { type: "eventEnd"; event: ActiveEvent }
  | { type: "fakeSurvived" }
  | { type: "panic" }
  | { type: "creature"; kind: CreatureKind; what: "arrive" | "bump" | "sit" | "leave" | "land" | "fly" }
  | { type: "stable"; left: number }
  | { type: "unstable" }
  | { type: "height"; metres: number }
  /** Endless medals: 10, 25, 50, 100 m. */
  | { type: "milestone"; metres: number }
  | { type: "oops" }
  | { type: "won" }
  | { type: "lost"; why: LoseReason }
  | { type: "over" };

export type Status = "play" | "won" | "lost" | "over";

interface WeldRecord {
  joint: Joint;
  a: number;
  /** −1: the platform. */
  b: number;
  at: Vec;
}

interface Snapshot {
  items: Array<{ uid: number; kind: ItemId; skin: ItemId; x: number; y: number; angle: number; vx: number; vy: number; w: number; scale: number; squash: number; age: number; welds: number; landed: boolean; set: boolean }>;
  welds: Array<{ a: number; b: number; at: Vec }>;
  falls: number;
  released: { uid: number; kind: ItemId; skin: ItemId };
}

type Owner = { item: Item } | { creature: Creature } | { platform: true } | { floor: true };

const ownerOf = (body: Body) => body.getUserData() as Owner | null;

/** The top of a body (m): its highest corner, or the top of its circle. */
export function topOf(body: Body): number {
  let top = -Infinity;
  for (let f: Fixture | null = body.getFixtureList(); f; f = f.getNext()) {
    const shape = f.getShape();
    if (shape.getType() === "circle") {
      const c = body.getWorldPoint((shape as Circle).getCenter());
      top = Math.max(top, c.y + shape.getRadius());
    } else {
      for (const v of (shape as Polygon).m_vertices) top = Math.max(top, body.getWorldPoint(v).y);
    }
  }
  return top;
}

export class Sim {
  readonly world: World;
  readonly level: LevelDef;
  readonly mode: Mode;
  readonly zen: boolean;
  readonly rng: Rng;
  private readonly slowBelt: boolean;
  readonly platform: Body;
  platformWidth: number;
  /** Platform shrink: where it's shrinking to. */
  private shrinkTo: number | null = null;
  items: Item[] = [];
  belt: BeltItem[] = [];
  creatures: Creature[] = [];
  hand: Hand | null = null;
  readonly scheduler: Scheduler;
  tick = 0;
  /** Ticks of play (the clock). */
  played = 0;
  falls = 0;
  status: Status = "play";
  lost: LoseReason | null = null;
  panic = 0;
  /** The tower's top (m), its stillness, the stability countdown. */
  top = 0;
  stableTicks = 0;
  stillFor = 0;
  /** Endless and the Daily Stack: the best height that held still for three seconds. */
  best = 0;
  /** X-ray glasses: ticks left. */
  xray = 0;
  /** Re-skin: what each kind looks like. */
  skins: Partial<Record<ItemId, ItemId>> = {};
  oopsUsed = false;
  private snapshot: Snapshot | null = null;
  private nextUid = 1;
  private queued = 0;
  private welds: WeldRecord[] = [];
  private pendingWelds: Array<{ a: Item; b: Body; at: Vec }> = [];
  private events: SimEvent[] = [];
  private fallsAtHit = 0;
  private fakeWatch: { until: number; falls: number } | null = null;
  private broken = 0;
  /** Counted for achievements and stars. */
  placed = 0;
  breaks = 0;
  /** The last milestone announced (Endless). */
  private milestone = 0;

  constructor(options: SimOptions) {
    this.level = options.level;
    this.mode = options.mode ?? "level";
    this.zen = options.zen ?? false;
    this.slowBelt = options.slowBelt ?? false;
    this.rng = createRng(options.seed);
    this.world = new World({ gravity: { x: 0, y: -(this.level.gravity ?? GRAVITY) } });
    this.platformWidth = this.level.platform;
    this.platform = this.world.createBody({ type: "static", position: { x: 0, y: 0 } });
    this.platform.setUserData({ platform: true } satisfies Owner);
    this.platformFixture(this.platformWidth);
    const floor = this.world.createBody({ type: "static", position: { x: 0, y: FLOOR_Y } });
    floor.createFixture({ shape: new Box(30, 0.5, { x: 0, y: -0.5 }), friction: 0.8 });
    floor.setUserData({ floor: true } satisfies Owner);
    this.scheduler = new Scheduler(this.level, createRng(options.seed ^ 0x5eed), this.zen);
    this.world.on("post-solve", this.onPostSolve);
    this.world.on("begin-contact", this.onBeginContact);
    this.world.on("pre-solve", this.onPreSolve);
    // Something to grab straight away: two items already on the belt.
    this.spawn(0.5);
    this.spawn(0.17);
  }

  get gravity() {
    return this.level.gravity ?? GRAVITY;
  }

  get timeLimited() {
    return this.level.time > 0 && !this.zen;
  }

  /** Ticks left on the clock (Infinity with no limit). */
  get ticksLeft() {
    return this.timeLimited ? Math.max(0, seconds(this.level.time) - this.played) : Infinity;
  }

  get goal() {
    return this.level.goal;
  }

  get held(): Item | null {
    return this.hand ? (this.items.find((i) => i.uid === this.hand!.uid) ?? null) : null;
  }

  get event(): ActiveEvent | null {
    return this.scheduler.active;
  }

  /** The event that's hitting right now. */
  hitting(kind: EventKind): ActiveEvent | null {
    const a = this.scheduler.active;
    return a && a.phase === "hit" && a.kind === kind ? a : null;
  }

  skinOf(kind: ItemId): ItemId {
    return this.skins[kind] ?? kind;
  }

  // -- One tick ------------------------------------------------------------------------------------

  step(input: TickInput): SimEvent[] {
    this.events = [];
    if (this.status !== "play") {
      // The level's over: the world keeps moving (the tower falls the rest of the way), nothing else.
      this.physics();
      this.cull(false);
      return this.events;
    }
    this.tick++;
    this.played++;
    for (const c of input.commands) this.command(c);
    if (this.hand && input.aim) this.hand.aim = input.aim;
    this.beltStep();
    this.eventStep();
    this.behaviours();
    this.physics();
    this.afterPhysics();
    this.cull(true);
    this.judge();
    return this.events;
  }

  private emit(e: SimEvent) {
    this.events.push(e);
  }

  // -- Commands ------------------------------------------------------------------------------------

  private command(c: Command) {
    switch (c.type) {
      case "grab": {
        if (this.hand) return;
        const b = this.belt.find((x) => x.uid === c.uid);
        if (!b) return;
        this.belt = this.belt.filter((x) => x !== b);
        if (b.kind === "xray") {
          this.xray = XRAY_TICKS;
          this.emit({ type: "xray" });
          return;
        }
        const item = this.addItem(b.uid, b.kind, this.skinOf(b.kind), this.clearSpot(b.kind, c.at), 0);
        item.state = "held";
        this.hand = { uid: item.uid, aim: { x: item.body.getPosition().x, y: item.body.getPosition().y }, angle: 0 };
        this.emit({ type: "grab", uid: item.uid, kind: item.kind });
        return;
      }
      case "rotate":
        if (this.hand) this.hand.angle += c.steps * ROTATE_STEP;
        return;
      case "release":
        this.release();
        return;
      case "oops":
        this.oops();
        return;
      case "tap": {
        const b = this.belt.find((x) => x.uid === c.uid);
        if (!b) return;
        if (b.kind === "xray") {
          this.belt = this.belt.filter((x) => x !== b);
          this.xray = XRAY_TICKS;
          this.emit({ type: "xray" });
        } else this.emit({ type: "tap", uid: b.uid, kind: b.kind });
        return;
      }
    }
  }

  private release() {
    const item = this.held;
    this.hand = null;
    if (!item) return;
    // Oops (§10 rule 5) can put things back the way they were just before this.
    this.snapshot = this.snap(item);
    item.state = "free";
    item.age = 0;
    const v = item.body.getLinearVelocity();
    const speed = Math.hypot(v.x, v.y);
    if (speed > RELEASE_SPEED) item.body.setLinearVelocity({ x: (v.x / speed) * RELEASE_SPEED, y: (v.y / speed) * RELEASE_SPEED });
    item.body.setAngularVelocity(item.body.getAngularVelocity() * 0.5);
    this.placed++;
    this.emit({ type: "release", uid: item.uid, kind: item.kind });
  }

  // -- Items ---------------------------------------------------------------------------------------

  private addItem(uid: number, kind: ItemId, skin: ItemId, at: Vec, angle: number): Item {
    const def = ITEMS[kind];
    const body = this.world.createBody({
      type: "dynamic",
      position: at,
      angle,
      linearDamping: def.linearDamping ?? 0,
      angularDamping: def.angularDamping ?? 0.05,
    });
    const item: Item = { uid, kind, skin, body, state: "free", scale: 1, squash: 1, age: -1, welds: 0, landed: false, hit: 0, load: 0, set: false, stillTicks: 0, fellAt: 0 };
    body.setUserData({ item } satisfies Owner);
    this.fixtures(item);
    this.items.push(item);
    return item;
  }

  /** (Re)build an item's fixture at its scale and squash. Inflating and squashing keep the mass; melting loses it. */
  private fixtures(item: Item) {
    const def = ITEMS[item.kind];
    const body = item.body;
    for (let f = body.getFixtureList(); f; ) {
      const next = f.getNext();
      body.destroyFixture(f);
      f = next;
    }
    const keepMass = !behaviourOf(def, "melt");
    const shape =
      def.shape.kind === "circle"
        ? new Circle(def.shape.r * item.scale)
        : new Polygon(outline(def.shape, item.scale, item.squash).map((p) => ({ x: p.x, y: p.y })));
    const area = def.shape.kind === "circle" ? Math.PI * (def.shape.r * item.scale) ** 2 : polygonArea(outline(def.shape, item.scale, item.squash));
    const density = keepMass ? def.mass / area : def.mass / areaOf(def.shape);
    body.createFixture({ shape, density, friction: def.friction, restitution: def.restitution });
  }

  /** Tests and the title screen: an item put straight into the world, already let go. */
  drop(kind: ItemId, at: Vec, angle = 0): Item {
    const item = this.addItem(this.nextUid++, kind, this.skinOf(kind), at, angle);
    item.age = 0;
    return item;
  }

  /** Where a picked-up item can appear without overlapping anything (up a little, if need be). */
  private clearSpot(kind: BeltKind, at: Vec): Vec {
    if (kind === "xray") return at;
    const def = ITEMS[kind];
    const half = { x: def.size.w / 2 + 0.02, y: def.size.h / 2 + 0.02 };
    const p = { ...at };
    for (let k = 0; k < 40; k++) {
      let hit = false;
      this.world.queryAABB({ lowerBound: { x: p.x - half.x, y: p.y - half.y }, upperBound: { x: p.x + half.x, y: p.y + half.y } }, () => {
        hit = true;
        return false;
      });
      if (!hit) break;
      p.y += 0.1;
    }
    return p;
  }

  private removeItem(item: Item) {
    if (this.hand?.uid === item.uid) this.hand = null;
    this.welds = this.welds.filter((w) => w.a !== item.uid && w.b !== item.uid);
    this.world.destroyBody(item.body);
    this.items = this.items.filter((i) => i !== item);
  }

  // -- The belt ------------------------------------------------------------------------------------

  private nextKind(): BeltKind {
    const k = this.queued++;
    if (k < this.level.items.length) return this.level.items[k]!;
    return pick(this.rng, this.level.more.length ? this.level.more : (["brick"] as BeltKind[]));
  }

  private spawn(pos: number) {
    this.belt.push({ uid: this.nextUid++, kind: this.nextKind(), pos });
  }

  /** How fast the belt runs: the rush doubles it, panic speeds it a little (§3), the assist slows it. */
  beltSpeed(): number {
    let s = 1 + 0.15 * (this.panic / 100);
    if (this.hitting("conveyorRush")) s *= 2;
    if (this.slowBelt) s *= 0.6;
    return s;
  }

  private beltStep() {
    // Zen: the belt waits when the next item reaches the end.
    const front = this.belt.reduce((m, b) => Math.max(m, b.pos), -1);
    if (this.zen && front >= 0.9) return;
    const d = this.beltSpeed() / (this.level.belt * HZ);
    for (const b of this.belt) b.pos += d;
    const last = this.belt.reduce((m, b) => Math.min(m, b.pos), Infinity);
    if (!this.belt.length) this.spawn(0);
    else if (last >= 1 / BELT_SLOTS) this.spawn(last - 1 / BELT_SLOTS);
    for (const b of this.belt.filter((x) => x.pos >= 1)) {
      this.belt = this.belt.filter((x) => x !== b);
      if (b.kind === "xray") continue;
      this.fell(b.uid, b.kind, "belt");
    }
  }

  private fell(uid: number, kind: BeltKind, why: "platform" | "belt" | "floated") {
    if (!this.zen) {
      this.falls++;
      this.panic = clampPanic(this.panic + PANIC.fall);
    }
    this.emit({ type: "fall", uid, kind, why });
  }

  /** The belt's place for an item in the world (m): for the bot, and anything else without a screen. */
  beltPoint(pos: number): Vec {
    const reach = this.platformWidth / 2 + 2.6;
    return { x: reach - pos * reach * 2, y: this.viewTop() - 0.75 };
  }

  /**
   * The top of what the camera shows: the goal line (or the tower) plus room for the belt, and never less than
   * a tall-enough view (low goals don't zoom the camera right in).
   */
  viewTop(): number {
    const above = this.mode === "level" ? this.goal : Math.max(4, this.top + 2.5);
    return Math.max(above + 2.3, 5.6);
  }

  // -- Events --------------------------------------------------------------------------------------

  private eventStep() {
    // Panic brings events sooner; so does height, in Endless (§5: events get more frequent as you climb).
    const pressure = this.mode === "endless" ? Math.max(this.panic / 100, Math.min(1, this.best / 60)) : this.panic / 100;
    const { started, hit, ended } = this.scheduler.step(this.played, pressure);
    if (started) this.emit({ type: "warn", event: started });
    if (hit) {
      this.fallsAtHit = this.falls;
      if (hit.kind !== "fakePanic") this.panic = clampPanic(this.panic + PANIC.hit);
      this.emit({ type: "eventHit", event: hit });
      this.onHit(hit);
    }
    if (ended) {
      if (ended.kind === "fakePanic") this.fakeWatch = { until: this.played + seconds(4), falls: this.falls };
      else if (this.falls === this.fallsAtHit) this.panic = clampPanic(this.panic + PANIC.survived);
      this.emit({ type: "eventEnd", event: ended });
    }
    if (this.fakeWatch && this.falls > this.fakeWatch.falls) this.fakeWatch = null;
    if (this.fakeWatch && this.played >= this.fakeWatch.until) {
      this.fakeWatch = null;
      this.emit({ type: "fakeSurvived" });
    }
    if (this.xray > 0) this.xray--;
    this.creatureStep();
    // Gravity this tick: tilted, lowered, or shaken.
    let gx = 0;
    let gy = -this.gravity;
    const low = this.hitting("lowGravity");
    if (low) gy *= 1 - 0.65 * ramp(low.t, EVENTS.lowGravity.ticks, 20);
    const tilt = this.hitting("tilt");
    if (tilt) {
      // Gravity turned by 10° (dir 1 pulls to the right).
      const a = tilt.dir * ((10 * Math.PI) / 180) * ramp(tilt.t, EVENTS.tilt.ticks, 18);
      [gx, gy] = [-gy * Math.sin(a), gy * Math.cos(a)];
    }
    const quake = this.hitting("earthquake");
    if (quake) gx += 3.5 * quake.strength * Math.sin((2 * Math.PI * 2.2 * quake.t) / HZ) * ramp(quake.t, EVENTS.earthquake.ticks, 15);
    this.world.setGravity({ x: gx, y: gy });
    if (quake || tilt || low) this.wakeAll();
    // The platform shrinking (in four steps).
    if (this.shrinkTo !== null && this.platformWidth > this.shrinkTo) {
      if (this.tick % 15 === 0) {
        this.platformWidth = Math.max(this.shrinkTo, this.platformWidth - 0.25);
        this.platformFixture(this.platformWidth);
        this.wakeAll();
      }
    }
  }

  private onHit(e: ActiveEvent) {
    switch (e.kind) {
      case "platformShrink":
        this.shrinkTo = Math.max(2, this.platformWidth - 1);
        break;
      case "reskin":
        this.reskin();
        break;
      case "cat":
        this.addCreature("cat", e.dir);
        break;
      case "bird":
        this.addCreature("bird", e.dir);
        break;
      case "iceAge":
      case "wind":
        this.wakeAll();
        break;
      default:
        break;
    }
  }

  /** Re-skin (§3): every kind in play swaps its looks with another; the physics stay the same. */
  private reskin() {
    const kinds = [...new Set<ItemId>([...this.items.map((i) => i.kind), ...this.belt.filter((b) => b.kind !== "xray").map((b) => b.kind as ItemId)])];
    if (kinds.length < 2) return;
    // A shuffle where nothing keeps its own looks.
    const order = [...kinds];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * i);
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const skins: Partial<Record<ItemId, ItemId>> = {};
    kinds.forEach((k, i) => (skins[k] = order[i]!));
    this.skins = skins;
    for (const item of this.items) item.skin = this.skinOf(item.kind);
  }

  private platformFixture(width: number) {
    for (let f = this.platform.getFixtureList(); f; ) {
      const next = f.getNext();
      this.platform.destroyFixture(f);
      f = next;
    }
    this.platform.createFixture({ shape: new Box(width / 2, PLATFORM_THICKNESS / 2, { x: 0, y: -PLATFORM_THICKNESS / 2 }), friction: 0.9 });
  }

  private wakeAll() {
    for (const i of this.items) if (!i.set) i.body.setAwake(true);
    for (const c of this.creatures) c.body.setAwake(true);
  }

  // -- Creatures: the cat and the bird -------------------------------------------------------------

  private addCreature(kind: CreatureKind, dir: -1 | 1) {
    const side = -dir;
    if (kind === "cat") {
      const body = this.world.createBody({ type: "dynamic", position: { x: side * (this.platformWidth / 2 + 1.4), y: 0.9 }, fixedRotation: true });
      body.createFixture({ shape: new Box(0.36, 0.21), density: 2.6 / (0.72 * 0.42), friction: 0.9 });
      // A hop onto the platform's near edge.
      const land = side * (this.platformWidth / 2 - 0.45);
      body.setLinearVelocity(ballistic({ x: body.getPosition().x, y: 0.9 }, { x: land, y: 0.25 }, 0.6, this.gravity));
      const c: Creature = { kind, body, phase: "enter", t: 0, dir, target: null };
      body.setUserData({ creature: c } satisfies Owner);
      this.creatures.push(c);
    } else {
      const top = this.towerTopPoint();
      const body = this.world.createBody({ type: "dynamic", position: { x: top.x + side * 3, y: top.y + 3 }, fixedRotation: true, gravityScale: 0 });
      body.createFixture({ shape: new Circle(0.2), density: 2 / (Math.PI * 0.04), friction: 0.9 });
      const c: Creature = { kind, body, phase: "land", t: 0, dir, target: { x: top.x, y: top.y + 0.21 } };
      body.setUserData({ creature: c } satisfies Owner);
      this.creatures.push(c);
    }
    this.emit({ type: "creature", kind, what: "arrive" });
  }

  /** The highest point of the tower and where it is (for the bird and the cat). */
  towerTopPoint(): Vec {
    let best: Vec = { x: 0, y: 0 };
    for (const i of this.items) {
      if (i.state !== "free" || !i.landed) continue;
      const t = topOf(i.body);
      if (t > best.y) best = { x: i.body.getPosition().x, y: t };
    }
    return best;
  }

  private creatureStep() {
    for (const c of [...this.creatures]) {
      c.t++;
      const p = c.body.getPosition();
      const v = c.body.getLinearVelocity();
      const m = c.body.getMass();
      if (c.kind === "cat") {
        const onGround = this.touching(c.body);
        const walk = (speed: number, push: number) => {
          const f = clamp(m * 8 * (speed - v.x), -push, push);
          c.body.applyForceToCenter({ x: f, y: 0 }, true);
        };
        switch (c.phase) {
          case "enter":
            if (onGround && c.t > 10) {
              c.phase = "walk";
              c.t = 0;
            }
            break;
          case "walk":
            walk(c.dir * 0.9, 18);
            if (this.touchingItem(c.body)) {
              c.phase = "nudge";
              c.t = 0;
              this.emit({ type: "creature", kind: "cat", what: "bump" });
            } else if (Math.abs(p.x) < 0.2 || c.t > seconds(5)) {
              c.phase = "nudge";
              c.t = 0;
            }
            break;
          case "nudge":
            // It leans on the tower for a second, then decides: up, or away.
            walk(c.dir * 0.6, 22);
            if (c.t > seconds(1.2)) {
              const top = this.towerTopPoint();
              const climb = top.y > 0.3 && top.y < 6 && this.rng() < 0.65;
              if (climb) {
                c.phase = "jump";
                c.t = 0;
                c.target = { x: top.x, y: top.y + 0.22 };
                c.body.setLinearVelocity(ballistic(p, c.target, 0.45, this.gravity));
              } else {
                c.phase = "leave";
                c.t = 0;
              }
            }
            break;
          case "jump":
            if (c.t > 12 && onGround && Math.abs(v.y) < 0.3) {
              c.phase = "sit";
              c.t = 0;
              this.emit({ type: "creature", kind: "cat", what: "sit" });
              this.scheduler.finish();
            } else if (c.t > seconds(3)) {
              c.phase = "leave";
              c.t = 0;
            }
            break;
          case "sit":
            break;
          case "leave":
            walk(c.dir * 1.2, 20);
            if (c.t === 1) this.emit({ type: "creature", kind: "cat", what: "leave" });
            if (Math.abs(p.x) > this.platformWidth / 2 + 0.3 && c.t > 30) this.scheduler.finish();
            break;
          default:
            break;
        }
      } else {
        // The bird: glides down onto the top, sits (heavy), then flies off.
        switch (c.phase) {
          case "land": {
            const top = this.towerTopPoint();
            c.target = { x: c.target!.x, y: Math.max(c.target!.y, top.y + 0.21) };
            const to = { x: c.target.x - p.x, y: c.target.y + 0.05 - p.y };
            const d = Math.hypot(to.x, to.y);
            const sp = Math.min(2.2, d * 2.5);
            const want = d > 1e-3 ? { x: (to.x / d) * sp, y: (to.y / d) * sp } : { x: 0, y: 0 };
            c.body.applyForceToCenter({ x: m * 10 * (want.x - v.x), y: m * 10 * (want.y - v.y) }, true);
            if (d < 0.12 || this.touchingItem(c.body) || c.t > seconds(4)) {
              c.phase = "sit";
              c.t = 0;
              c.body.setGravityScale(1);
              this.emit({ type: "creature", kind: "bird", what: "land" });
            }
            break;
          }
          case "sit":
            if (c.t > seconds(5)) {
              c.phase = "fly";
              c.t = 0;
              c.body.setGravityScale(0);
              this.emit({ type: "creature", kind: "bird", what: "fly" });
            }
            break;
          case "fly":
            c.body.applyForceToCenter({ x: m * 6 * (c.dir * 2.5 - v.x), y: m * 6 * (2.5 - v.y) }, true);
            if (c.t > seconds(2.5)) this.scheduler.finish();
            break;
          default:
            break;
        }
      }
      // Gone off the edge (a cat lands on its feet somewhere else), or flown away.
      if (p.y < FLOOR_Y + 0.6 || p.y > this.viewTop() + 6 || Math.abs(p.x) > 14) {
        this.world.destroyBody(c.body);
        this.creatures = this.creatures.filter((x) => x !== c);
      }
    }
  }

  private touching(body: Body): boolean {
    for (let ce = body.getContactList(); ce; ce = ce.next ?? null) {
      if (ce.contact.isTouching()) return true;
    }
    return false;
  }

  private touchingItem(body: Body): boolean {
    for (let ce = body.getContactList(); ce; ce = ce.next ?? null) {
      if (!ce.contact.isTouching()) continue;
      const o = ownerOf(ce.other!);
      if (o && "item" in o && o.item.state === "free") return true;
    }
    return false;
  }

  // -- Behaviours ----------------------------------------------------------------------------------

  private behaviours() {
    for (const item of [...this.items]) {
      const def = ITEMS[item.kind];
      if (item.age >= 0) item.age++;
      const inflate = behaviourOf(def, "inflate");
      if (inflate && item.age > 0 && item.scale < inflate.maxScale) {
        item.scale = Math.min(inflate.maxScale, 1 + ((inflate.maxScale - 1) * item.age) / seconds(inflate.seconds));
        this.resize(item);
      }
      const melt = behaviourOf(def, "melt");
      if (melt && item.age > 0) {
        item.scale = Math.max(melt.minScale, 1 - ((1 - melt.minScale) * item.age) / seconds(melt.seconds));
        if (item.scale <= melt.minScale + 1e-6) {
          const at = item.body.getPosition();
          this.removeItem(item);
          this.emit({ type: "melted", uid: item.uid, at: { x: at.x, y: at.y } });
          continue;
        }
        this.resize(item);
      }
      const squish = behaviourOf(def, "squish");
      if (squish && item.state === "free") {
        const target = 1 - squish.maxSquash * clamp(item.load / squish.fullLoad, 0, 1);
        if (target < item.squash - 0.005) {
          // Cakes squash over about a second, and never spring back.
          const was = item.squash;
          item.squash = Math.max(target, item.squash - 0.008);
          this.resize(item);
          if (was >= 0.95 && item.squash < 0.95) this.emit({ type: "squish", uid: item.uid });
        }
      }
    }
  }

  /**
   * Inflating, melting and squashing change an item's shape a little every tick, in place: its contacts
   * carry on (rebuilding the fixture would drop them, and the tower above would jolt).
   */
  private resize(item: Item) {
    const def = ITEMS[item.kind];
    const fixture = item.body.getFixtureList();
    if (!fixture) return;
    const shape = fixture.getShape() as unknown as { m_radius: number; _set(points: Vec[]): void };
    let area: number;
    if (def.shape.kind === "circle") {
      shape.m_radius = def.shape.r * item.scale;
      area = Math.PI * shape.m_radius ** 2;
    } else {
      const pts = outline(def.shape, item.scale, item.squash);
      shape._set(pts);
      area = polygonArea(pts);
    }
    fixture.setDensity(behaviourOf(def, "melt") ? def.mass / areaOf(def.shape) : def.mass / area);
    (fixture as unknown as { _reset(): void })._reset();
    this.wakeNear(item);
  }

  private wakeNear(item: Item) {
    item.body.setAwake(true);
    for (let ce = item.body.getContactList(); ce; ce = ce.next ?? null) ce.other?.setAwake(true);
  }

  // -- Physics -------------------------------------------------------------------------------------

  private physics() {
    const wind = this.status === "play" ? this.hitting("wind") : null;
    for (const i of this.items) {
      i.hit = 0;
      i.load = 0;
    }
    for (let s = 0; s < SUBSTEPS; s++) {
      if (this.status === "play") {
        this.handForces();
        this.itemForces(wind);
      }
      this.world.step(DT, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
    }
    // Loads were summed over the sub-steps as impulses: back to a force.
    for (const i of this.items) i.load *= HZ;
  }

  /** The hand (§12): hold the weight, then pull toward the aim with what's left; and turn with the wrist. */
  private handForces() {
    const item = this.held;
    const hand = this.hand;
    if (!item || !hand) return;
    const body = item.body;
    const m = body.getMass();
    const g = this.world.getGravity();
    const floats = !!behaviourOf(ITEMS[item.kind], "float");
    const support = floats ? { x: 0, y: 0 } : { x: -g.x * m, y: -g.y * m };
    const rem = Math.max(0, HAND_FORCE - Math.hypot(support.x, support.y));
    const origin = body.getPosition();
    const v = body.getLinearVelocityFromWorldPoint(origin);
    const ex = hand.aim.x - origin.x;
    const ey = hand.aim.y - origin.y;
    const d = Math.hypot(ex, ey);
    const aPlan = (0.6 * rem) / m;
    const speed = Math.min(HAND_GAIN * d, Math.sqrt(2 * aPlan * d), HAND_TOP_SPEED);
    const vx = d > 1e-6 ? (ex / d) * speed : 0;
    const vy = d > 1e-6 ? (ey / d) * speed : 0;
    const grip = m < LIGHT_MASS ? HAND_GRIP_LIGHT : HAND_GRIP;
    let fx = m * grip * (vx - v.x);
    let fy = m * grip * (vy - v.y);
    const f = Math.hypot(fx, fy);
    if (f > rem) {
      fx *= rem / f;
      fy *= rem / f;
    }
    body.applyForceToCenter({ x: fx + support.x, y: fy + support.y }, true);
    // The wrist: turn toward the set angle, with a fixed strength (so heavy things turn slowly).
    const lc = body.getLocalCenter();
    const inertia = Math.max(1e-4, body.getInertia() - m * (lc.x * lc.x + lc.y * lc.y));
    const err = wrapAngle(hand.angle - body.getAngle());
    const alpha = (0.6 * WRIST_TORQUE) / inertia;
    const w = Math.sign(err) * Math.min(WRIST_GAIN * Math.abs(err), Math.sqrt(2 * alpha * Math.abs(err)), 9);
    const torque = clamp(inertia * WRIST_GRIP * (w - body.getAngularVelocity()), -WRIST_TORQUE, WRIST_TORQUE);
    body.applyTorque(torque, true);
  }

  private itemForces(wind: ActiveEvent | null) {
    const g = this.world.getGravity();
    const windForce = wind ? 7 * wind.strength * wind.dir * ramp(wind.t, EVENTS.wind.ticks, 30) : 0;
    const magnets = this.items.filter((i) => behaviourOf(ITEMS[i.kind], "magnet"));
    for (const item of this.items) {
      if (item.set) continue;
      const def = ITEMS[item.kind];
      const body = item.body;
      const float = behaviourOf(def, "float");
      if (float) {
        // Helium: cancel gravity, then rise at a gentle speed, pushing up with a few newtons at most.
        const m = body.getMass();
        const vy = body.getLinearVelocity().y;
        const lift = clamp(m * 8 * (float.rise - vy), 0, float.push);
        body.applyForceToCenter({ x: -g.x * m, y: -g.y * m + lift }, true);
      }
      if (windForce) {
        const h = Math.max(0.2, topOf(body) - bottomOf(body));
        body.applyForceToCenter({ x: windForce * h, y: 0 }, true);
      }
      if (def.metal) {
        for (const mag of magnets) {
          if (mag === item) continue;
          const b = behaviourOf(ITEMS[mag.kind], "magnet")!;
          const a = mag.body.getWorldCenter();
          const p = body.getWorldCenter();
          const d = Math.hypot(a.x - p.x, a.y - p.y);
          if (d > b.radius || d < 1e-3) continue;
          // More metal, more pull: a light helium safe drifts over, an anvil only creeps when it's close.
          const f = Math.min(b.maxForce, (b.strength * body.getMass()) / Math.max(0.35, d) ** 2);
          const fx = ((a.x - p.x) / d) * f;
          const fy = ((a.y - p.y) / d) * f;
          body.applyForceToCenter({ x: fx, y: fy }, true);
          if (!mag.set) mag.body.applyForceToCenter({ x: -fx, y: -fy }, true);
        }
      }
    }
    if (windForce) {
      for (const c of this.creatures) c.body.applyForceToCenter({ x: windForce * 0.4, y: 0 }, true);
    }
  }

  private onPreSolve = (contact: Contact) => {
    // Ice age: everything's slippery (§3). Otherwise the usual mix.
    const a = contact.getFixtureA();
    const b = contact.getFixtureB();
    const ice = this.status === "play" && this.hitting("iceAge");
    const fa = a.getFriction();
    const fb = b.getFriction();
    // Slippery things (jelly, ice) stay slippery whatever touches them.
    contact.setFriction(ice ? 0.04 : Math.min(fa, fb) < 0.2 ? Math.min(fa, fb) : Math.sqrt(fa * fb));
  };

  private onPostSolve = (contact: Contact, impulse: ContactImpulse) => {
    const count = contact.getManifold().pointCount;
    let total = 0;
    for (let k = 0; k < count; k++) total += impulse.normalImpulses[k] ?? 0;
    if (total <= 0) return;
    const ba = contact.getFixtureA().getBody();
    const bb = contact.getFixtureB().getBody();
    const oa = ownerOf(ba);
    const ob = ownerOf(bb);
    if (oa && "item" in oa) this.felt(oa.item, bb, total);
    if (ob && "item" in ob) this.felt(ob.item, ba, total);
  };

  private felt(item: Item, other: Body, impulse: number) {
    item.hit = Math.max(item.hit, impulse);
    // A load from above (for squashing): the other body's centre is higher.
    if (other.getWorldCenter().y > item.body.getWorldCenter().y + 0.05) item.load += impulse;
  }

  private onBeginContact = (contact: Contact) => {
    const ba = contact.getFixtureA().getBody();
    const bb = contact.getFixtureB().getBody();
    for (const [body, other] of [
      [ba, bb],
      [bb, ba],
    ] as const) {
      const o = ownerOf(body);
      if (!o || !("item" in o)) continue;
      const item = o.item;
      const sticky = behaviourOf(ITEMS[item.kind], "sticky");
      if (!sticky || item.state !== "free" || item.welds >= sticky.maxWelds) continue;
      const oo = ownerOf(other);
      if (!oo || "creature" in oo || ("item" in oo && oo.item.state === "held")) continue;
      const wm = contact.getWorldManifold(null);
      const pt = wm?.points[0];
      if (!pt) continue;
      // Not while something's flying past at speed.
      const rel = Math.hypot(body.getLinearVelocity().x - other.getLinearVelocity().x, body.getLinearVelocity().y - other.getLinearVelocity().y);
      if (rel > 2.5) continue;
      if (this.pendingWelds.some((w) => (w.a === item && w.b === other) || ("item" in oo && w.a === oo.item && w.b === body))) continue;
      if (this.welds.some((w) => (w.a === item.uid && w.b === uidOf(other)) || (w.b === item.uid && w.a === uidOf(other)))) continue;
      this.pendingWelds.push({ a: item, b: other, at: { x: pt.x, y: pt.y } });
    }
  };

  private weld(a: Item, b: Body, at: Vec) {
    const joint = this.world.createJoint(new WeldJoint({}, a.body, b, at));
    if (!joint) return;
    a.welds++;
    const ob = ownerOf(b);
    if (ob && "item" in ob) ob.item.welds++;
    this.welds.push({ joint, a: a.uid, b: uidOf(b), at });
    this.emit({ type: "weld", uid: a.uid, at });
  }

  // -- After the physics ---------------------------------------------------------------------------

  private afterPhysics() {
    for (const w of this.pendingWelds) {
      if (this.items.includes(w.a) && (w.b === this.platform || this.items.some((i) => i.body === w.b))) {
        const sticky = behaviourOf(ITEMS[w.a.kind], "sticky")!;
        if (w.a.welds < sticky.maxWelds) this.weld(w.a, w.b, w.at);
      }
    }
    this.pendingWelds = [];
    for (const item of [...this.items]) {
      const def = ITEMS[item.kind];
      const at = item.body.getPosition();
      const fragile = behaviourOf(def, "fragile");
      if (fragile && item.hit > fragile.breakImpulse) {
        this.removeItem(item);
        this.emit({ type: "break", uid: item.uid, at: { x: at.x, y: at.y } });
        // Smashed on the floor after falling off, it's counted as a fall (already); in play, it's the end.
        if (item.state !== "fallen") {
          this.breaks++;
          if (!this.zen) this.broken++;
        }
        continue;
      }
      const inflate = behaviourOf(def, "inflate");
      if (inflate && item.state === "free" && item.hit > inflate.popImpulse) {
        this.removeItem(item);
        this.emit({ type: "pop", uid: item.uid, at: { x: at.x, y: at.y } });
        continue;
      }
      if (item.state === "free" && item.hit > 0) {
        if (!item.landed) {
          item.landed = true;
          const gentle = item.hit / item.body.getMass() < 1.2;
          if (gentle && !this.zen) this.panic = clampPanic(this.panic + PANIC.gentle);
          this.emit({ type: "land", uid: item.uid, kind: item.kind, impulse: item.hit, gentle, at: { x: at.x, y: at.y } });
        } else if (item.hit / item.body.getMass() > 1.4) {
          this.emit({ type: "bump", uid: item.uid, kind: item.kind, impulse: item.hit, at: { x: at.x, y: at.y } });
        }
      }
    }
  }

  /** Items that have fallen off (they land on the floor, then vanish) or floated away. */
  private cull(counting: boolean) {
    const ceiling = this.viewTop() + 3;
    for (const item of [...this.items]) {
      const p = item.body.getPosition();
      if (item.state === "fallen") {
        if (this.tick - item.fellAt > 40 || p.y < FLOOR_Y - 2) {
          this.removeItem(item);
          this.emit({ type: "gone", uid: item.uid, at: { x: p.x, y: p.y } });
        }
        continue;
      }
      if (p.y > ceiling && item.state === "free") {
        this.removeItem(item);
        if (counting) this.fell(item.uid, item.kind, "floated");
        continue;
      }
      if (p.y < FALL_Y || Math.abs(p.x) > 14) {
        if (this.hand?.uid === item.uid) this.hand = null;
        item.state = "fallen";
        item.fellAt = this.tick;
        if (counting) this.fell(item.uid, item.kind, "platform");
      }
    }
  }

  // -- The tower and the rules ---------------------------------------------------------------------

  /** Everything resting on the platform (through touching contacts and welds), not counting the held item. */
  tower(): { items: Item[]; creatures: Creature[]; touchedByHand: boolean } {
    // Things set in place (Endless) are static: they keep no contact with the static platform, but they're the
    // tower's foundation, so the search starts from them too.
    const set = this.items.filter((i) => i.set);
    const seen = new Set<Body>([this.platform, ...set.map((i) => i.body)]);
    const queue: Body[] = [this.platform, ...set.map((i) => i.body)];
    const items: Item[] = [...set];
    const creatures: Creature[] = [];
    let touchedByHand = false;
    const visit = (other: Body | null | undefined) => {
      if (!other || seen.has(other)) return;
      const o = ownerOf(other);
      if (!o) return;
      if ("item" in o && o.item.state === "held") {
        touchedByHand = true;
        return;
      }
      if (("item" in o && o.item.state === "fallen") || "floor" in o) return;
      seen.add(other);
      queue.push(other);
      if ("item" in o) items.push(o.item);
      else if ("creature" in o) creatures.push(o.creature);
    };
    while (queue.length) {
      const body = queue.shift()!;
      for (let ce = body.getContactList(); ce; ce = ce.next ?? null) if (ce.contact.isTouching()) visit(ce.other);
      for (let je = body.getJointList(); je; je = je.next ?? null) visit(je.other);
    }
    return { items, creatures, touchedByHand };
  }

  private judge() {
    const t = this.tower();
    let top = 0;
    let still = true;
    let energy = 0;
    for (const i of t.items) {
      top = Math.max(top, topOf(i.body));
      if (i.set) continue;
      const v = i.body.getLinearVelocity();
      const w = i.body.getAngularVelocity();
      const speed = Math.hypot(v.x, v.y);
      if (speed > STILL_SPEED || Math.abs(w) > STILL_SPIN) still = false;
      energy += 0.5 * i.body.getMass() * speed * speed;
      i.stillTicks = speed < STILL_SPEED && Math.abs(w) < STILL_SPIN ? i.stillTicks + 1 : 0;
    }
    for (const c of t.creatures) {
      const v = c.body.getLinearVelocity();
      if (Math.hypot(v.x, v.y) > STILL_SPEED * 2) still = false;
    }
    this.top = top;
    this.stillFor = still ? this.stillFor + 1 / HZ : 0;

    // The panic meter (§3).
    if (!this.zen) {
      const timeLeft = this.timeLimited ? this.ticksLeft / seconds(this.level.time) : 1;
      this.panic = drift(this.panic, { timeLeft, energy, stillFor: this.stillFor });
      if (this.panic >= 100) {
        this.panic = PANIC.after;
        this.scheduler.panic();
        this.emit({ type: "panic" });
      }
    }

    // Holding still above the line (§3): three seconds.
    const reach = this.mode === "level" ? top >= this.goal : top > 0.05;
    const holding = still && reach && !t.touchedByHand && t.items.length > 0;
    const before = this.stableTicks;
    this.stableTicks = holding ? this.stableTicks + 1 : 0;
    if (before > 0 && this.stableTicks === 0 && this.mode === "level") this.emit({ type: "unstable" });
    if (holding && this.mode === "level" && (this.stableTicks === 1 || this.stableTicks % HZ === 0)) {
      this.emit({ type: "stable", left: Math.max(0, Math.ceil((STABLE_TICKS - this.stableTicks) / HZ)) });
    }
    if (this.mode !== "level" && this.stableTicks >= STABLE_TICKS && top > this.best + 0.005) {
      this.best = top;
      this.emit({ type: "height", metres: top });
      for (const m of [10, 25, 50, 100]) {
        if (top >= m && this.milestone < m) {
          this.milestone = m;
          this.emit({ type: "milestone", metres: m });
        }
      }
    }

    // Endless: deep, still items are set in place, so tall towers stay quick and steady.
    if (this.mode === "endless") {
      for (const i of t.items) {
        if (!i.set && i.stillTicks > HZ && topOf(i.body) < top - SET_DEPTH) {
          i.set = true;
          i.body.setStatic();
        }
      }
    }

    // Win or lose.
    if (this.mode === "level" && this.stableTicks >= STABLE_TICKS) {
      this.status = "won";
      this.hand = null;
      this.emit({ type: "won" });
      return;
    }
    if (this.zen) return;
    const why: LoseReason | null = this.broken > 0 ? "broke" : this.falls >= MAX_FALLS ? "falls" : this.timeLimited && this.ticksLeft <= 0 ? "time" : null;
    if (!why) return;
    this.hand = null;
    for (const i of this.items) if (i.state === "held") i.state = "free";
    if (this.mode === "level") {
      this.status = "lost";
      this.lost = why;
      this.emit({ type: "lost", why });
    } else {
      this.status = "over";
      this.lost = why;
      this.emit({ type: "over" });
    }
  }

  // -- Oops ----------------------------------------------------------------------------------------

  private snap(released: Item): Snapshot {
    return {
      items: this.items
        .filter((i) => i !== released)
        .map((i) => {
          const p = i.body.getPosition();
          const v = i.body.getLinearVelocity();
          return { uid: i.uid, kind: i.kind, skin: i.skin, x: p.x, y: p.y, angle: i.body.getAngle(), vx: v.x, vy: v.y, w: i.body.getAngularVelocity(), scale: i.scale, squash: i.squash, age: i.age, welds: i.welds, landed: i.landed, set: i.set };
        }),
      welds: this.welds.map((w) => ({ a: w.a, b: w.b, at: w.at })),
      falls: this.falls,
      released: { uid: released.uid, kind: released.kind, skin: released.skin },
    };
  }

  /** Can Oops be used right now? (Once a level, after something's been put down, not once time's up.) */
  canOops(): boolean {
    return !this.oopsUsed && !!this.snapshot && (this.status === "play" || (this.status === "lost" && this.lost !== "time")) && !this.hand;
  }

  /** Oops (§10 rule 5): everything back to just before the last drop, and that item back on the belt. */
  oops(): boolean {
    if (!this.canOops()) return false;
    const s = this.snapshot!;
    this.oopsUsed = true;
    for (const item of [...this.items]) this.removeItem(item);
    this.welds = [];
    for (const it of s.items) {
      const item = this.addItem(it.uid, it.kind, this.skinOf(it.kind), { x: it.x, y: it.y }, it.angle);
      Object.assign(item, { scale: it.scale, squash: it.squash, age: it.age, landed: it.landed, set: it.set, welds: 0 });
      this.fixtures(item);
      item.body.setLinearVelocity({ x: it.vx, y: it.vy });
      item.body.setAngularVelocity(it.w);
      if (it.set) item.body.setStatic();
    }
    for (const w of s.welds) {
      const a = this.items.find((i) => i.uid === w.a);
      const b = w.b === -1 ? this.platform : this.items.find((i) => i.uid === w.b)?.body;
      if (a && b) this.weld(a, b, w.at);
    }
    this.falls = s.falls;
    this.broken = 0;
    this.status = "play";
    this.lost = null;
    this.stableTicks = 0;
    const front = this.belt.reduce((m, b) => Math.max(m, b.pos), 0);
    this.belt.push({ uid: s.released.uid, kind: s.released.kind, pos: clamp(front + 0.12, 0.35, 0.8) });
    this.snapshot = null;
    this.emit({ type: "oops" });
    return true;
  }
}

const uidOf = (body: Body): number => {
  const o = ownerOf(body);
  return o && "item" in o ? o.item.uid : -1;
};

/** The bottom of a body (m). */
export function bottomOf(body: Body): number {
  let bottom = Infinity;
  for (let f: Fixture | null = body.getFixtureList(); f; f = f.getNext()) {
    const shape = f.getShape();
    if (shape.getType() === "circle") {
      const c = body.getWorldPoint((shape as Circle).getCenter());
      bottom = Math.min(bottom, c.y - shape.getRadius());
    } else {
      for (const v of (shape as Polygon).m_vertices) bottom = Math.min(bottom, body.getWorldPoint(v).y);
    }
  }
  return bottom;
}

function polygonArea(pts: Vec[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** 0 → 1 over the first `edge` ticks of an event and back to 0 over its last `edge`. */
export function ramp(t: number, length: number, edge: number): number {
  return clamp(Math.min(t / edge, (length - t) / edge), 0, 1);
}

/** The launch velocity that reaches `to` from `from`, peaking `apex` m above the higher of the two. */
export function ballistic(from: Vec, to: Vec, apex: number, g: number): Vec {
  const peak = Math.max(from.y, to.y) + apex;
  const up = Math.sqrt(2 * g * (peak - from.y));
  const t = up / g + Math.sqrt((2 * (peak - to.y)) / g);
  return { x: (to.x - from.x) / t, y: up };
}

