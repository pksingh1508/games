// One night at the Marlow Museum (Plan/14-dont-blink.md §2–§5, §10, §12): the clock, your eyelids, the cameras,
// the changes, the Visitor, your reports and your credibility. Pure and seeded: the same seed and the same
// inputs play out the same night, tick for tick, so a night can be replayed and the tester bot can prove each
// one fair. The runtime steps it 60 times a second and turns its events into sounds and pictures.
import { createRng, randInt, randRange, shuffle, type Rng } from "@/engine/rng";
import { Blink } from "./blink";
import { ALL_CAMERAS, ANOMALY_BY_ID, OBJECTS, ROOM_SOUND, slotOf, VISITOR_PATH } from "./catalogue";
import {
  ANOMALY_COOLDOWN,
  DANGER_TICKS,
  EAGLE_EYE_TICKS,
  FIX_TICKS,
  FLICKER_TICKS,
  FLUTTER_TICKS,
  HOURS,
  HZ,
  LYING_HUD_TICKS,
  PHOTO_TICKS,
  seconds,
  STATIC_TICKS,
  VIEW_W,
  VISITOR_COOLDOWN,
  VISITOR_DOOR_COOLDOWN,
  VISITOR_GRACE,
  VISITOR_REST,
} from "./constants";
import { eligible, pickAnomaly, type Closure, type PickContext } from "./director";
import { accepts, inBox, objectsAt, VISITOR_TYPES, visitorBox } from "./report";
import { ANOMALY_TYPES, type AnomalyDef, type AnomalyType, type CameraId, type NightConfig, type NightFeature, type ObjState } from "./types";

export type Mode = "night" | "endless" | "custom";
export type Status = "play" | "won" | "lost";
export type LoseReason = "piled" | "fired" | "visitor";
export type Rank = "hawk-eye" | "night-owl" | "sleepy" | "fired";

/** Slow changes a night (Night 4 on) starts each hour, on average. */
const GRADUAL_RATE = 0.8;

export interface Active {
  def: AnomalyDef;
  /** The tick it happened (or started creeping). */
  at: number;
  /** When it could first be seen: the eyes open, the static clears. Null until then. */
  shownAt: number | null;
  by: Closure | "gradual";
  /** A slow change: from the object's state when it started, over this many ticks. */
  creep?: { from: ObjState; ticks: number };
}

/** How a report went. */
export interface Verdict {
  ok: boolean;
  type: AnomalyType;
  /** What it was about ("the clock", "the statue", "the picture"); null when nothing's wrong there. */
  name: string | null;
  /** The anomaly fixed (ok), for stats and tests. */
  anomaly?: string;
  /** It was the Visitor, sent home. */
  visitor?: boolean;
  /** Reported within a second of the blink that made it. */
  eagle?: boolean;
  /** A false report that cost credibility. */
  penalty: boolean;
  /** Turned down: nothing's wrong there; something is, but not that; the statue isn't gone, it's out walking. */
  reason?: "nothing" | "wrong-type" | "visitor-away";
}

export type GameEvent =
  | { type: "shut"; long: boolean }
  | { type: "opened" }
  | { type: "change"; id: string; camera: CameraId; by: Active["by"] }
  | { type: "scrape"; room: CameraId; step: number }
  | { type: "home"; from: CameraId }
  | { type: "switch"; camera: CameraId }
  | { type: "flicker"; camera: CameraId }
  | { type: "flutter" }
  | { type: "creak"; room: CameraId }
  | { type: "footsteps"; room: CameraId }
  | { type: "report"; verdict: Verdict }
  | { type: "warned" }
  | { type: "hour"; hour: number }
  | { type: "danger"; on: boolean }
  | { type: "lying"; on: boolean }
  | { type: "photo"; camera: CameraId }
  | { type: "end"; status: Status; reason: LoseReason | null };

export interface GameSetup {
  mode: Mode;
  /** 1–5 for the nights (0 for Endless and Custom). */
  night: number;
  /** The night's settings by hour (Endless climbs an hour at a time; the others don't change). */
  config: (hour: number) => NightConfig;
  seed: number;
  /** Colour changes allowed (§11: they can be switched off; other changes take their place). */
  colour: boolean;
  /** Assist mode (§11): unlimited photos, slower blinks, no credibility penalty. */
  assist: boolean;
}

export interface NightStats {
  reported: number;
  falseReports: number;
  changes: number;
  /** Ticks from a change showing to its report, summed, and how many. */
  reactionSum: number;
  reactionN: number;
  eagle: boolean;
  visitorHome: number;
  counts: number;
  warnings: number;
}

export interface NightResult {
  mode: Mode;
  night: number;
  status: Status;
  lost: LoseReason | null;
  /** Hours survived (fractional): the Endless score. */
  hours: number;
  reported: number;
  falseReports: number;
  /** Changes still unreported at the end. */
  missed: number;
  changes: number;
  /** Average seconds from a change showing to its report. */
  reaction: number | null;
  eagle: boolean;
  heldTicks: number;
  visitorHome: number;
  counts: number;
  rank: Rank | null;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (k: number) => k * k * (3 - 2 * k);

/** The 6 AM rank (§7): Hawk Eye (fast and accurate) → Night Owl → Sleepy; Fired if you were. */
export function rankFor(r: Pick<NightResult, "night" | "status" | "lost" | "reported" | "falseReports" | "missed" | "reaction">): Rank | null {
  if (r.lost === "fired") return "fired";
  if (r.status !== "won") return null;
  const accuracy = r.reported + r.falseReports === 0 ? 1 : r.reported / (r.reported + r.falseReports);
  // Later nights have more rooms to search: a fast reaction there is a little slower.
  const fast = 6 + 2.5 * Math.max(1, Math.min(5, r.night || 5));
  if (accuracy >= 0.9 && r.missed <= 1 && (r.reaction ?? 0) <= fast) return "hawk-eye";
  if (accuracy >= 0.7 && r.missed <= 3) return "night-owl";
  return "sleepy";
}

export class Game {
  readonly setup: GameSetup;
  config: NightConfig;
  readonly rng: Rng;
  tick = 0;
  hour = 0;
  hourTick = 0;
  status: Status = "play";
  lost: LoseReason | null = null;
  readonly blink: Blink;
  /** The player is holding their eyes open. */
  holding = false;
  camera: CameraId;
  /** The camera before the last switch. */
  from: CameraId;
  /** Ticks of camera static left (a switch). */
  static = 0;
  /** Camera static that could hide a change (between two museum cameras, from Night 3). */
  private staticCovers = false;
  /** Ticks of a power flicker left. */
  flicker = 0;
  /** Ticks of a fake blink left (the lids flutter, nothing changes). */
  flutter = 0;
  /** Ticks of the little glitch after a fix. */
  fix = 0;
  /** Every object's state, museum-wide. */
  readonly states = new Map<string, ObjState>();
  /** Changes waiting to be reported, by slot (an object, or a camera's view). */
  readonly active = new Map<string, Active>();
  /** How far along its route the Visitor is (0: on its pedestal), and how long before it can move again. */
  visitorStep = 0;
  visitorCooldown = VISITOR_GRACE;
  visitorMoves = 0;
  falseThisHour = 0;
  private warnedThisHour = false;
  photos: number;
  /** Ticks the reference photo stays up. */
  photoLeft = 0;
  /** The final countdown: five changes are waiting (ticks left; null when it isn't running). */
  danger: number | null = null;
  /** The lying HUD (Night 5): when it starts, and how long it has left. */
  private lyingAt = -1;
  private lyingFrom = 0;
  lyingLeft = 0;
  /** The labels on the report buttons, by type (they swap while the HUD lies). */
  labels: Record<AnomalyType, AnomalyType>;
  readonly stats: NightStats = { reported: 0, falseReports: 0, changes: 0, reactionSum: 0, reactionN: 0, eagle: false, visitorHome: 0, counts: 0, warnings: 0 };
  /** What happened this tick (the runtime plays them and clears the list). */
  events: GameEvent[] = [];
  private budget = 0;
  private threshold: number;
  private cooldown = 0;
  private gradualBudget = 0;
  private nextFlicker: number;
  private nextFlutter: number;
  private readonly seen = new Map<CameraId, number>();
  private pool: AnomalyDef[] = [];
  private gradualPool: AnomalyDef[] = [];

  constructor(setup: GameSetup) {
    this.setup = setup;
    this.rng = createRng(setup.seed);
    this.config = setup.config(0);
    this.refreshPools();
    for (const o of OBJECTS.values()) this.states.set(o.id, { ...o.base });
    this.camera = this.config.cameras[0] ?? "lobby";
    this.from = this.camera;
    this.photos = this.config.photos;
    this.labels = Object.fromEntries(ANOMALY_TYPES.map((t) => [t, t])) as Record<AnomalyType, AnomalyType>;
    this.threshold = randRange(this.rng, 0.8, 1.2);
    // The first change comes a little sooner than the rest.
    this.budget = 0.45;
    const slow = setup.assist ? 1.35 : 1;
    this.blink = new Blink(() => Math.round(randRange(this.rng, this.config.blink[0], this.config.blink[1]) * HZ * slow), seconds(3.2 * slow));
    this.nextFlicker = seconds(randRange(this.rng, 18, 35));
    this.nextFlutter = seconds(randRange(this.rng, 12, 25));
    if (this.has("lyingHud")) this.lyingAt = randInt(this.rng, this.hourTicks * 2, Math.round(this.hourTicks * 4.5));
  }

  get hourTicks() {
    return seconds(this.config.hour);
  }

  has(feature: NightFeature) {
    return this.config.features.includes(feature);
  }

  private refreshPools() {
    this.pool = eligible(this.config, { colour: this.setup.colour, gradual: false });
    this.gradualPool = this.has("gradual") ? eligible(this.config, { colour: this.setup.colour, gradual: true }) : [];
  }

  /** Cameras you can switch to (your office is always there: you just turn round). */
  get cameras(): CameraId[] {
    const museum = this.config.cameras.filter((c) => c !== "office");
    return [...museum, "office"];
  }

  canLook(camera: CameraId) {
    return camera === "office" || this.config.cameras.includes(camera);
  }

  /** The camera actually on screen (none during static). */
  watching(): CameraId | null {
    return this.static > 0 ? null : this.camera;
  }

  /** The Visitor's room. */
  get visitorRoom(): CameraId {
    return VISITOR_PATH[Math.min(this.visitorStep, VISITOR_PATH.length - 1)]!;
  }

  /** How dark a power flicker is right now (0 normal, 1 black). */
  get flickerDark(): number {
    if (this.flicker <= 0) return 0;
    const k = FLICKER_TICKS - this.flicker;
    if (k >= 3 && k <= 7) return 1;
    return k % 2 ? 0.7 : 0.25;
  }

  /** How far a fake blink has the lids down (0–0.55). */
  get flutterClosure(): number {
    if (this.flutter <= 0) return 0;
    const k = 1 - this.flutter / FLUTTER_TICKS;
    return 0.55 * Math.sin(k * Math.PI);
  }

  /** Nothing on screen can be seen right now: eyes shut, static or a black flicker. Changes only happen then. */
  covered(): boolean {
    return this.blink.phase === "closed" || this.static > 0 || this.flickerDark >= 1;
  }

  /** The player can see the screen. */
  seeing(): boolean {
    return this.blink.phase === "open" && this.static === 0 && this.flickerDark < 1;
  }

  /** The view is flipped (a mirror anomaly). */
  mirrored(camera: CameraId = this.camera) {
    return this.active.has(`${camera}.view`);
  }

  activeIn(camera: CameraId) {
    let n = 0;
    for (const a of this.active.values()) if (a.def.camera === camera) n++;
    return n;
  }

  /** Minutes since midnight, as the clock shows them (it runs backwards while the HUD lies). */
  clockMinutes(): number {
    const real = (this.hour + this.hourTick / this.hourTicks) * 60;
    if (this.lyingLeft <= 0) return real;
    const since = (this.tick - this.lyingFrom) / this.hourTicks;
    const start = real - since * 60;
    return Math.max(0, start - since * 60);
  }

  get lying() {
    return this.lyingLeft > 0;
  }

  private emit(event: GameEvent) {
    this.events.push(event);
  }

  // -- Input ---------------------------------------------------------------------------------------

  /** Switch to a camera (or turn to your office). A short burst of static either way. */
  look(camera: CameraId): boolean {
    if (this.status !== "play" || camera === this.camera || !this.canLook(camera)) return false;
    const from = this.camera;
    this.seen.set(from, this.tick);
    this.from = from;
    this.camera = camera;
    this.static = STATIC_TICKS;
    this.staticCovers = from !== "office" && camera !== "office" && this.has("staticBlink");
    this.photoLeft = 0;
    this.emit({ type: "switch", camera });
    return true;
  }

  /** Look at the reference photo (the camera's morning photo from the guard binder). */
  usePhoto(): boolean {
    if (this.status !== "play" || this.photoLeft > 0) return false;
    if (!this.setup.assist) {
      if (this.photos <= 0) return false;
      this.photos--;
    }
    this.photoLeft = PHOTO_TICKS;
    this.emit({ type: "photo", camera: this.camera });
    return true;
  }

  closePhoto() {
    this.photoLeft = 0;
  }

  /** Report a change on the camera on screen: a point in scene units as it's shown, and a type. */
  report(x: number, y: number, type: AnomalyType): Verdict | null {
    if (this.status !== "play") return null;
    const camera = this.camera;
    const mirrored = this.mirrored(camera);
    const verdict = type === "mirror" ? (mirrored ? this.fixSlot(`${camera}.view`, type) : this.falseReport(type, "nothing", null)) : this.judge(camera, mirrored ? VIEW_W - x : x, y, type);
    this.emit({ type: "report", verdict });
    return verdict;
  }

  private judge(camera: CameraId, x: number, y: number, type: AnomalyType): Verdict {
    const vbox = visitorBox(camera);
    const onVisitor = !!vbox && inBox(vbox, x, y);
    const visitorHere = onVisitor && this.visitorStep > 0 && this.visitorRoom === camera;
    if (visitorHere && VISITOR_TYPES.includes(type)) {
      const from = this.visitorRoom;
      this.sendHome();
      this.fix = FIX_TICKS;
      return { ok: true, type, name: "the statue", visitor: true, penalty: false, anomaly: `visitor.${from}` };
    }
    const changed = objectsAt(camera, x, y, this.states)
      .map((o) => this.active.get(o.id))
      .filter((a): a is Active => !!a);
    const right = changed.find((a) => accepts(a.def, type));
    if (right) return this.fixSlot(slotOf(right.def), type);
    if (changed.length > 0) return this.falseReport(type, "wrong-type", OBJECTS.get(changed[0]!.def.object)?.name ?? null);
    if (visitorHere) return this.falseReport(type, "wrong-type", "the statue");
    // The empty pedestal: it isn't gone. It's out walking (a hint, and no penalty).
    if (camera === "sculpture" && onVisitor && this.visitorStep > 0 && (type === "missing" || type === "moved")) {
      return { ok: false, type, name: "the statue", penalty: false, reason: "visitor-away" };
    }
    return this.falseReport(type, "nothing", null);
  }

  private fixSlot(slot: string, type: AnomalyType): Verdict {
    const a = this.active.get(slot)!;
    this.active.delete(slot);
    if (a.def.object !== "@view") this.states.set(a.def.object, { ...OBJECTS.get(a.def.object)!.base });
    this.fix = FIX_TICKS;
    this.stats.reported++;
    const shown = a.shownAt ?? this.tick;
    this.stats.reactionSum += Math.max(0, this.tick - shown);
    this.stats.reactionN++;
    const eagle = (a.by === "blink" || a.by === "long") && a.shownAt !== null && this.tick - a.shownAt <= EAGLE_EYE_TICKS;
    if (eagle) this.stats.eagle = true;
    if (a.def.type === "count") this.stats.counts++;
    const name = a.def.object === "@view" ? "the picture" : (OBJECTS.get(a.def.object)?.name ?? null);
    return { ok: true, type, name, anomaly: a.def.id, eagle, penalty: false };
  }

  private falseReport(type: AnomalyType, reason: "nothing" | "wrong-type", name: string | null): Verdict {
    this.stats.falseReports++;
    if (this.setup.assist) return { ok: false, type, name, penalty: false, reason };
    this.falseThisHour++;
    const [warn, fired] = this.config.credibility;
    if (this.falseThisHour >= fired) this.end("lost", "fired");
    else if (this.falseThisHour >= warn && !this.warnedThisHour) {
      this.warnedThisHour = true;
      this.stats.warnings++;
      this.emit({ type: "warned" });
    }
    return { ok: false, type, name, penalty: true, reason };
  }

  private sendHome() {
    const from = this.visitorRoom;
    this.visitorStep = 0;
    this.visitorCooldown = VISITOR_REST;
    this.stats.visitorHome++;
    this.emit({ type: "home", from });
  }

  // -- The tick ------------------------------------------------------------------------------------

  step() {
    if (this.status !== "play") return;
    this.tick++;
    this.hourTick++;
    if (this.hourTick >= this.hourTicks) {
      this.newHour();
      if (this.status !== "play") return;
    }
    this.budget = Math.min(3, this.budget + this.config.rate / this.hourTicks);
    if (this.cooldown > 0) this.cooldown--;
    if (this.visitorCooldown > 0) this.visitorCooldown--;
    if (this.fix > 0) this.fix--;
    if (this.photoLeft > 0) this.photoLeft--;

    // Camera static: from Night 3 it hides changes too (a second kind of blink).
    if (this.static > 0) {
      this.static--;
      if (this.static === STATIC_TICKS - 3 && this.staticCovers) this.closure("static");
    }

    // Power flickers (Night 3): the feed drops out for a moment, and something can change in the dark.
    if (this.flicker > 0) {
      this.flicker--;
      if (this.flicker === FLICKER_TICKS - 5) this.closure("flicker");
    } else if (this.has("flicker") && this.tick >= this.nextFlicker) {
      if (this.camera !== "office" && this.static === 0 && this.blink.phase === "open") {
        this.flicker = FLICKER_TICKS;
        this.emit({ type: "flicker", camera: this.camera });
      }
      this.nextFlicker = this.tick + seconds(randRange(this.rng, 22, 45));
    }

    // Your eyes.
    const b = this.blink.step(this.holding);
    if (b.shut) {
      this.emit({ type: "shut", long: b.long });
      this.flutter = 0;
      this.closure(b.long ? "long" : "blink");
      if (this.status !== "play") return;
    }
    if (b.opened) this.emit({ type: "opened" });

    // Fake blinks (Night 4): the lids flutter, and nothing changes. Sometimes a creak, to go with it.
    if (this.flutter > 0) this.flutter--;
    else if (this.has("fakeBlink") && this.tick >= this.nextFlutter) {
      if (this.blink.phase === "open" && this.blink.next > FLUTTER_TICKS + 20) {
        this.flutter = FLUTTER_TICKS;
        this.emit({ type: "flutter" });
        if (this.rng() < 0.5) this.emit({ type: "creak", room: this.cameras[Math.floor(this.rng() * this.cameras.length)]! });
      }
      this.nextFlutter = this.tick + seconds(randRange(this.rng, 14, 32));
    }

    this.creep();

    // When each change could first be seen, and when each camera was last looked at.
    if (this.seeing()) {
      for (const a of this.active.values()) if (a.shownAt === null) a.shownAt = this.tick;
      this.seen.set(this.camera, this.tick);
    }

    // The lying HUD (Night 5): a minute of the clock running backwards and the report labels swapped.
    if (this.lyingLeft > 0) {
      this.lyingLeft--;
      if (this.lyingLeft === 0) {
        this.labels = Object.fromEntries(ANOMALY_TYPES.map((t) => [t, t])) as Record<AnomalyType, AnomalyType>;
        this.emit({ type: "lying", on: false });
      }
    } else if (this.tick === this.lyingAt) {
      this.lyingLeft = LYING_HUD_TICKS;
      this.lyingFrom = this.tick;
      const swapped = shuffle(this.rng, ANOMALY_TYPES);
      // Every label lands somewhere new.
      for (let i = 0; i < swapped.length; i++) {
        if (swapped[i] === ANOMALY_TYPES[i]) {
          const j = (i + 1) % swapped.length;
          [swapped[i], swapped[j]] = [swapped[j]!, swapped[i]!];
        }
      }
      this.labels = Object.fromEntries(ANOMALY_TYPES.map((t, i) => [t, swapped[i]!])) as Record<AnomalyType, AnomalyType>;
      this.emit({ type: "lying", on: true });
    }

    // Five changes waiting: they're coming. Report one before the countdown runs out.
    if (this.active.size >= this.config.maxActive) {
      if (this.danger === null) {
        this.danger = DANGER_TICKS;
        this.emit({ type: "danger", on: true });
      } else if (--this.danger <= 0) this.end("lost", "piled");
    } else if (this.danger !== null) {
      this.danger = null;
      this.emit({ type: "danger", on: false });
    }
  }

  private newHour() {
    this.hour++;
    this.hourTick = 0;
    this.falseThisHour = 0;
    this.warnedThisHour = false;
    if (this.setup.mode !== "endless" && this.hour >= HOURS) {
      this.end("won", null);
      return;
    }
    if (this.setup.mode === "endless") {
      this.config = this.setup.config(this.hour);
      this.refreshPools();
    }
    this.emit({ type: "hour", hour: this.hour });
  }

  private context(): PickContext {
    return {
      config: this.config,
      busy: new Set(this.active.keys()),
      activeIn: (c) => this.activeIn(c),
      watching: this.watching() ?? this.camera,
      unseen: (c) => (c === this.watching() ? 0 : this.tick - (this.seen.get(c) ?? 0)),
    };
  }

  /** The screen is covered: maybe something changes, and maybe the Visitor moves. */
  private closure(kind: Closure) {
    const room = this.config.maxActive - this.active.size;
    let n = 0;
    if (room > 0) {
      if (kind === "long") n = Math.min(room, Math.min(3, Math.max(2, Math.floor(this.budget + 1))));
      else if (this.cooldown === 0 && this.budget >= this.threshold) n = 1;
    }
    for (let i = 0; i < n; i++) {
      const a = pickAnomaly(this.rng, this.pool, this.context(), kind, this.camera);
      if (!a) break;
      this.apply(a, kind);
      this.budget = Math.max(-1, this.budget - 1);
      this.cooldown = this.config.cooldown ? seconds(this.config.cooldown) : ANOMALY_COOLDOWN;
      this.threshold = randRange(this.rng, 0.8, 1.2);
    }
    // The Visitor moves only while you blink, and only when you're not watching its camera.
    if (kind === "blink" || kind === "long") this.visitorTurn();
  }

  private apply(a: AnomalyDef, by: Active["by"], creep?: Active["creep"]) {
    if (a.object !== "@view" && !creep) this.states.set(a.object, { ...this.states.get(a.object)!, ...a.set });
    this.active.set(slotOf(a), { def: a, at: this.tick, shownAt: null, by, ...(creep ? { creep } : {}) });
    this.stats.changes++;
    this.emit({ type: "change", id: a.id, camera: a.camera, by });
    // Night 5: footsteps from the other side of the museum.
    if (this.has("misdirection") && by !== "gradual" && this.rng() < 0.3) {
      const side = Math.sign(ROOM_SOUND[a.camera].pan) || (this.rng() < 0.5 ? 1 : -1);
      const other = ALL_CAMERAS.filter((c) => c !== "office" && Math.sign(ROOM_SOUND[c].pan) === -side);
      if (other.length) this.emit({ type: "footsteps", room: other[Math.floor(this.rng() * other.length)]! });
    }
  }

  /** Slow changes (Night 4): they start whenever they like, and creep in over half a minute. */
  private creep() {
    if (this.gradualPool.length > 0) {
      this.gradualBudget = Math.min(1.5, this.gradualBudget + GRADUAL_RATE / this.hourTicks);
      const creeping = [...this.active.values()].some((a) => a.creep && this.tick - a.at < a.creep.ticks);
      if (!creeping && this.gradualBudget >= 1 && this.active.size < this.config.maxActive - 1) {
        const a = pickAnomaly(this.rng, this.gradualPool, this.context(), "gradual", this.camera);
        if (a) {
          this.gradualBudget -= 1;
          this.apply(a, "gradual", { from: { ...this.states.get(a.object)! }, ticks: seconds(a.gradual ?? 30) });
        }
      }
    }
    for (const a of this.active.values()) {
      if (!a.creep) continue;
      const k = smooth(Math.min(1, (this.tick - a.at) / a.creep.ticks));
      const from = a.creep.from;
      const to = { ...from, ...a.def.set };
      this.states.set(a.def.object, {
        x: lerp(from.x, to.x, k),
        y: lerp(from.y, to.y, k),
        tint: lerp(from.tint, to.tint, k),
        visible: to.visible,
        variant: k >= 1 ? to.variant : from.variant,
      });
    }
  }

  private visitorTurn() {
    if (this.config.visitor <= 0 || this.visitorCooldown > 0) return;
    if (this.watching() === this.visitorRoom) return;
    // It's slower to step down off its pedestal than to keep coming.
    if (this.rng() >= this.config.visitor * (this.visitorStep === 0 ? 0.5 : 1)) return;
    this.visitorStep++;
    this.visitorMoves++;
    const room = this.visitorRoom;
    this.visitorCooldown = room === "corridor" ? VISITOR_DOOR_COOLDOWN : VISITOR_COOLDOWN;
    // It always makes a sound when it moves (§10 rule 4).
    this.emit({ type: "scrape", room, step: this.visitorStep });
    if (room === "office") this.end("lost", "visitor");
  }

  private end(status: Status, reason: LoseReason | null) {
    if (this.status !== "play") return;
    this.status = status;
    this.lost = reason;
    this.emit({ type: "end", status, reason });
  }

  /** Make a change now, as a blink would (tests and QA). False if its object is already changed. */
  force(id: string, by: Active["by"] = "blink"): boolean {
    const a = ANOMALY_BY_ID.get(id);
    if (!a || this.active.has(slotOf(a))) return false;
    this.apply(a, by);
    return true;
  }

  /** Give up (the pause menu's "end the night"). */
  quit() {
    this.end("lost", null);
  }

  result(): NightResult {
    const s = this.stats;
    const base = {
      mode: this.setup.mode,
      night: this.setup.night,
      status: this.status,
      lost: this.lost,
      hours: Math.min(this.setup.mode === "endless" ? Infinity : HOURS, this.hour + this.hourTick / this.hourTicks),
      reported: s.reported,
      falseReports: s.falseReports,
      missed: this.active.size,
      changes: s.changes,
      reaction: s.reactionN ? s.reactionSum / s.reactionN / HZ : null,
      eagle: s.eagle,
      heldTicks: this.blink.heldTicks,
      visitorHome: s.visitorHome,
      counts: s.counts,
    };
    return { ...base, rank: rankFor(base) };
  }
}
