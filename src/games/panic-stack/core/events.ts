// Panic events (Plan/11-panic-stack.md §3 "Panic events"): what each one does, how long it lasts, and the
// warning that always comes first (§10 rule 3: at least 1.5 s; here every warning is 2 s, with an icon, a
// sound and words). The scheduler below decides when they come: the level's own list, random ones on later
// levels and in Endless (more often as panic rises), and a big one when the panic meter hits 100%.
import { pick, randInt, type Rng } from "@/engine/rng";
import { seconds, WARN_TICKS } from "./constants";
import type { EventKind, LevelDef } from "./level";

export interface EventInfo {
  name: string;
  /** What the warning says (with its icon and sound). */
  warning: string;
  /** What it says while it's happening. */
  doing: string;
  /** How long it lasts once it hits. */
  ticks: number;
  /** A fake panic can pretend to be it; a real PANIC! can be it. */
  big: boolean;
}

export const EVENTS: Record<EventKind, EventInfo> = {
  earthquake: { name: "Earthquake", warning: "The seismograph's twitching. Earthquake!", doing: "Earthquake! The platform's shaking.", ticks: seconds(3), big: true },
  wind: { name: "Wind", warning: "The flags are flapping. Wind's coming!", doing: "A gust of wind!", ticks: seconds(3.5), big: true },
  cat: { name: "The Cat", warning: "A paw at the edge of the screen… meow?", doing: "The cat's here. It wants the top.", ticks: seconds(9), big: true },
  tilt: { name: "Tilt", warning: "The spirit level's bubble is sliding. Tilt!", doing: "Gravity's tilted 10°.", ticks: seconds(3), big: true },
  lowGravity: { name: "Low Gravity", warning: "Everything's sparkling. Low gravity!", doing: "Low gravity: everything's floaty.", ticks: seconds(4), big: false },
  iceAge: { name: "Ice Age", warning: "Frost is creeping in. Ice age!", doing: "Ice age: everything's slippery.", ticks: seconds(5), big: false },
  bird: { name: "Bird", warning: "A shadow's growing on your tower. Bird!", doing: "A bird's landed on top. It's heavier than it looks.", ticks: seconds(7), big: false },
  platformShrink: { name: "Platform Shrink", warning: "Warning stripes on the edges. The platform's shrinking!", doing: "The platform got narrower.", ticks: seconds(1), big: false },
  lightsOut: { name: "Lights Out", warning: "The lights are flickering…", doing: "Lights out. Only silhouettes (and silhouettes don't lie).", ticks: seconds(5), big: false },
  fakePanic: { name: "PANIC!", warning: "PANIC!", doing: "PANIC!", ticks: seconds(2.5), big: false },
  reskin: { name: "Re-skin", warning: "Textures loading… something's shimmering.", doing: "Everything's swapped its looks. Not its weight.", ticks: seconds(0.6), big: false },
  conveyorRush: { name: "Conveyor Rush", warning: "The gears are whining. Conveyor rush!", doing: "Conveyor rush: double speed.", ticks: seconds(5), big: false },
};

export const EVENT_KINDS = Object.keys(EVENTS) as EventKind[];

export interface ActiveEvent {
  kind: EventKind;
  phase: "warn" | "hit";
  /** Ticks into the phase. */
  t: number;
  strength: number;
  dir: -1 | 1;
  /** A PANIC! siren with it: real (the meter hit 100%) or a cardboard cut-out (a fake panic). */
  siren: "real" | "fake" | null;
  /** What a fake panic pretends is coming. */
  pretends: EventKind | null;
}

/** When the next events come. Pure and seeded: the same level, seed and panic give the same events. */
export class Scheduler {
  private scripted: Array<{ kind: EventKind; tick: number; strength: number; dir: -1 | 1 | undefined }>;
  private nextRandom: number;
  private queue: ActiveEvent[] = [];
  active: ActiveEvent | null = null;
  /** Ticks since the last event ended (a breather between events). */
  private quiet = seconds(10);

  constructor(
    private readonly level: LevelDef,
    private readonly rng: Rng,
    /** Zen (§11): no events at all. */
    private readonly off: boolean,
  ) {
    this.scripted = level.events.map((e) => ({ kind: e.kind, tick: seconds(e.at), strength: e.strength ?? 1, dir: e.dir })).sort((a, b) => a.tick - b.tick);
    this.nextRandom = level.random ? seconds(level.random.every[0] + 4) : Infinity;
  }

  private make(kind: EventKind, strength = 1, dir?: -1 | 1, siren: ActiveEvent["siren"] = null): ActiveEvent {
    const real = this.realKinds();
    return {
      kind,
      phase: "warn",
      t: 0,
      strength,
      dir: dir ?? (this.rng() < 0.5 ? -1 : 1),
      siren: kind === "fakePanic" ? "fake" : siren,
      pretends: kind === "fakePanic" ? pick(this.rng, real.length ? real : (["earthquake"] as EventKind[])) : null,
    };
  }

  /** The level's real, big events (what a PANIC! can be). */
  realKinds(): EventKind[] {
    const kinds = new Set<EventKind>([...this.level.events.map((e) => e.kind), ...(this.level.random?.kinds ?? [])]);
    return [...kinds].filter((k) => EVENTS[k].big);
  }

  /** The panic meter hit 100%: a big real event, with a real siren. */
  panic() {
    if (this.off) return;
    const kinds = this.realKinds();
    const kind = kinds.length ? pick(this.rng, kinds) : pick(this.rng, ["earthquake", "wind"] as EventKind[]);
    this.queue.unshift(this.make(kind, 1.1, undefined, "real"));
  }

  /** One tick. `tick` is the level's clock; `panic` is 0–1. Returns the event that just changed phase, if any. */
  step(tick: number, panic: number): { started?: ActiveEvent; hit?: ActiveEvent; ended?: ActiveEvent } {
    if (this.off) return {};
    while (this.scripted.length && this.scripted[0]!.tick <= tick) {
      const s = this.scripted.shift()!;
      this.queue.push(this.make(s.kind, s.strength, s.dir));
    }
    if (this.level.random && tick >= this.nextRandom) {
      const [lo, hi] = this.level.random.every;
      // Panic makes events come more often (§3).
      this.nextRandom = tick + Math.round(seconds(randInt(this.rng, lo, hi)) * (1 - 0.4 * panic));
      if (this.queue.length === 0) this.queue.push(this.make(pick(this.rng, this.level.random.kinds)));
    }
    const out: { started?: ActiveEvent; hit?: ActiveEvent; ended?: ActiveEvent } = {};
    const a = this.active;
    if (a) {
      a.t++;
      if (a.phase === "warn" && a.t >= WARN_TICKS) {
        a.phase = "hit";
        a.t = 0;
        out.hit = a;
      } else if (a.phase === "hit" && a.t >= EVENTS[a.kind].ticks) {
        this.active = null;
        this.quiet = 0;
        out.ended = a;
      }
      return out;
    }
    this.quiet++;
    // A short breather after each event (a real PANIC! doesn't wait).
    if (this.queue.length && (this.quiet >= seconds(1.5) || this.queue[0]!.siren === "real")) {
      this.active = this.queue.shift()!;
      out.started = this.active;
    }
    return out;
  }

  /** QA: an event straight away (with its warning). */
  inject(kind: EventKind) {
    this.queue.unshift(this.make(kind));
    this.quiet = seconds(10);
  }

  /** The cat walked off early, or the bird flew away: the event's over. */
  finish() {
    if (this.active) {
      this.active = null;
      this.quiet = 0;
    }
  }
}
