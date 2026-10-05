// One loop (Plan/03-99-seconds.md §3, §12): 99 seconds of the room, run by the rules. The clock counts game
// time, which stops while the game's paused and stretches when you look at a clock (chronostasis: the second you
// glance at a clock lasts half a second longer, up to ten seconds a loop). Timed actions run while you stay put,
// processes take their own time (a pot only boils while nobody watches it), timed events happen at the same second
// every loop, and at zero the room decides: reset, or (if you've earned it) something else. Pure and
// deterministic: the tests drive it with a fake clock.
import type { ChapterDef, Condition, Effect, Hotspot, Interaction, ViewId, Wall } from "./types";

/** Chronostasis: each glance at a clock holds the second this much longer… */
export const STRETCH_MS = 500;
/** …up to this much a loop. */
export const STRETCH_MAX_MS = 10_000;
/** The hundredth second lasts this long, in real time. */
export const EXTRA_MS = 6_000;
/** Time moves in slices no bigger than this, so events and processes land when they should. */
const SLICE = 50;

export type LoopStatus = "play" | "extra" | "over";
export type LoopResult = "reset" | "next" | "true" | "paradox";

export type LoopEvent =
  | { type: "say"; text: string }
  | { type: "sound"; id: string; caption?: string; wall?: Wall }
  | { type: "clue"; id: string }
  | { type: "action"; id: string | null }
  | { type: "view" }
  | { type: "stretch" }
  | { type: "second"; left: number }
  | { type: "extra" }
  | { type: "end"; result: LoopResult };

export interface LoopOptions {
  /** 99, or 150 in Relaxed mode. */
  seconds: number;
  /** What the journal already knows. */
  known: ReadonlySet<string>;
}

const MIRROR: Record<Wall, Wall> = { north: "north", east: "west", south: "south", west: "east" };
const isWall = (v: string): v is Wall => v === "north" || v === "east" || v === "south" || v === "west";

export class Loop {
  readonly chapter: ChapterDef;
  readonly loopMs: number;
  /** Game time, ms. */
  elapsed = 0;
  /** Chronostasis left to spend (time held still), and how much this loop has had. */
  hold = 0;
  stretched = 0;
  /** The view on screen (in a mirrored room, walls show the other side's art). */
  view: ViewId;
  room: string;
  readonly flags = new Set<string>();
  items: string[] = [];
  /** What's been typed on a keypad. */
  entry = "";
  action: { interaction: Interaction; started: number } | null = null;
  readonly progress = new Map<string, number>();
  status: LoopStatus = "play";
  result: LoopResult | null = null;
  /** The hundredth second: real ms left. */
  extraLeft = 0;
  /** Clues the journal knows (including any found this loop), and the ones found this loop. */
  readonly known: Set<string>;
  readonly found: Array<{ id: string; at: number }> = [];
  /** How long each view was on screen this loop (game ms), for the achievements. */
  readonly watched = new Map<ViewId, number>();
  events: LoopEvent[] = [];
  private readonly fired = new Set<number>();
  private second: number;

  constructor(chapter: ChapterDef, options: LoopOptions) {
    this.chapter = chapter;
    this.loopMs = options.seconds * 1000;
    this.known = new Set(options.known);
    this.room = chapter.start.room;
    this.view = chapter.start.view;
    for (const f of chapter.startFlags ?? []) this.flags.add(f);
    this.second = options.seconds;
    // Events at or above the loop's length (a 99-second chapter played in a 150-second loop is fine; the other way,
    // events past the start just never come).
    chapter.events.forEach((e, i) => {
      if (e.at * 1000 > this.loopMs) this.fired.add(i);
    });
  }

  // -- Reading the room -----------------------------------------------------------------------------

  /** Seconds left, exactly. */
  get left(): number {
    return Math.max(0, (this.loopMs - this.elapsed) / 1000);
  }

  /** What the loop clock shows (100 during the hundredth second). */
  get display(): number {
    return this.status === "extra" ? 100 : Math.ceil(this.left - 1e-9);
  }

  get mirrored(): boolean {
    return this.chapter.mirrored?.includes(this.room) ?? false;
  }

  /** The view in the room's own terms (a mirrored room's east is the other room's west). */
  get place(): ViewId {
    return this.mirrored && isWall(this.view) ? MIRROR[this.view] : this.view;
  }

  /** Where a wall's art shows up in this room. */
  shownAs(wall: ViewId): ViewId {
    return this.mirrored && isWall(wall) ? MIRROR[wall] : wall;
  }

  holds(c: Condition): boolean {
    if ("flag" in c) return this.flags.has(c.flag) === (c.is ?? true);
    if ("hasItem" in c) return this.items.includes(c.hasItem) === (c.is ?? true);
    if ("secondsLeft" in c) {
      const left = this.left;
      return (c.secondsLeft.gte === undefined || left >= c.secondsLeft.gte) && (c.secondsLeft.lte === undefined || left <= c.secondsLeft.lte);
    }
    if ("viewing" in c) return typeof c.viewing === "string" ? this.place === c.viewing : c.viewing.includes(this.place);
    if ("room" in c) return this.room === c.room;
    if ("entry" in c) return this.entry === c.entry;
    if ("clue" in c) return this.known.has(c.clue) === (c.is ?? true);
    if ("not" in c) return !this.holds(c.not);
    if ("any" in c) return c.any.some((x) => this.holds(x));
    return c.all.every((x) => this.holds(x));
  }

  all(cs: readonly Condition[] | undefined): boolean {
    return !cs || cs.every((c) => this.holds(c));
  }

  /** The hotspots you can see right now. */
  hotspots(): Hotspot[] {
    return this.chapter.hotspots.filter((h) => h.view === this.place && this.all(h.when));
  }

  private emit(event: LoopEvent) {
    this.events.push(event);
  }

  // -- Doing things -------------------------------------------------------------------------------

  /** Look somewhere else: turn to a wall, or open a close-up. Turning away stops what you were doing. */
  look(view: ViewId) {
    if (this.status === "over" || view === this.view) return;
    this.cancel();
    const was = this.place;
    this.view = view;
    this.emit({ type: "view" });
    this.glance(was);
  }

  /** Back out of a close-up, to where it was opened from. */
  back() {
    const parent = this.chapter.closeups[this.place];
    if (parent) this.look(this.shownAs(parent));
  }

  /** Turn to the next wall (1) or the previous (-1). */
  turn(dir: 1 | -1) {
    const order: Wall[] = ["north", "east", "south", "west"];
    const from = isWall(this.view) ? this.view : this.shownAs(this.chapter.closeups[this.place] ?? "north");
    const i = order.indexOf(from as Wall);
    this.look(order[(i + dir + 4) % 4]!);
  }

  /** Chronostasis: looking at a clock holds the current second a little longer (up to ten seconds a loop). */
  private glance(was: ViewId) {
    const clocks = this.chapter.clockViews;
    if (!clocks.includes(this.place) || clocks.includes(was) || this.status !== "play") return;
    const add = Math.min(STRETCH_MS, STRETCH_MAX_MS - this.stretched);
    if (add <= 0) return;
    this.hold += add;
    this.stretched += add;
    this.emit({ type: "stretch" });
  }

  /** Use a hotspot (with the item in your hand, if any). Returns what it did. */
  interact(on: string, use: string | null = null): "acted" | "started" | "nothing" {
    if (this.status === "over") return "nothing";
    this.cancel();
    const spot = on.startsWith("item:") ? null : this.hotspots().find((h) => h.id === on);
    if (!spot && !on.startsWith("item:")) return "nothing";
    if (on.startsWith("item:") && !this.items.includes(on.slice(5))) return "nothing";
    if (use && !this.items.includes(use)) return "nothing";
    const match = this.chapter.interactions.find((i) => i.on === on && (i.use ?? null) === use && this.all(i.requires));
    if (match) {
      if (match.durationMs) {
        this.action = { interaction: match, started: this.elapsed };
        this.emit({ type: "action", id: match.id });
        return "started";
      }
      this.apply(match.effects);
      return "acted";
    }
    if (use) {
      this.emit({ type: "say", text: "That doesn't do anything." });
      return "nothing";
    }
    if (spot?.zoom) {
      this.look(spot.zoom);
      return "acted";
    }
    if (spot?.look) this.emit({ type: "say", text: spot.look });
    return "nothing";
  }

  cancel() {
    if (!this.action) return;
    this.action = null;
    this.emit({ type: "action", id: null });
  }

  /** How far the current action has got (0–1). */
  get actionProgress(): number {
    if (!this.action) return 0;
    return Math.min(1, (this.elapsed - this.action.started) / (this.action.interaction.durationMs ?? 1));
  }

  private reveal(id: string) {
    if (this.known.has(id)) return;
    this.known.add(id);
    this.found.push({ id, at: Math.ceil(this.left - 1e-9) });
    this.emit({ type: "clue", id });
  }

  apply(effects: readonly Effect[]) {
    for (const e of effects) {
      if ("setFlag" in e) {
        if (e.value ?? true) this.flags.add(e.setFlag);
        else this.flags.delete(e.setFlag);
      } else if ("giveItem" in e) {
        if (!this.items.includes(e.giveItem)) this.items.push(e.giveItem);
      } else if ("takeItem" in e) this.items = this.items.filter((i) => i !== e.takeItem);
      else if ("revealClue" in e) this.reveal(e.revealClue);
      else if ("playSound" in e) this.emit({ type: "sound", id: e.playSound, caption: e.caption, wall: e.wall });
      else if ("goToView" in e) this.look(this.shownAs(e.goToView));
      else if ("goToRoom" in e) {
        this.cancel();
        const was = this.place;
        this.room = e.goToRoom;
        this.view = e.view;
        this.emit({ type: "view" });
        this.glance(was);
      } else if ("say" in e) this.emit({ type: "say", text: e.say });
      else if ("type" in e) this.entry = (this.entry + e.type).slice(-8);
      else if ("clearEntry" in e) this.entry = "";
      else if ("resetProcess" in e) this.progress.set(e.resetProcess, 0);
      else if ("endChapter" in e) this.finish(e.endChapter);
      else if ("extraSecond" in e) {
        this.status = "extra";
        this.extraLeft = EXTRA_MS;
        this.cancel();
        this.emit({ type: "extra" });
      } else if ("when" in e) this.apply(this.all(e.when) ? e.then : (e.else ?? []));
      if (this.status === "over") return;
    }
  }

  private finish(result: LoopResult) {
    if (this.status === "over") return;
    this.cancel();
    this.status = "over";
    this.result = result;
    this.emit({ type: "end", result });
  }

  // -- Time ---------------------------------------------------------------------------------------

  /** Real time passes (the game isn't paused). */
  tick(ms: number) {
    let rest = ms;
    while (rest > 0 && this.status !== "over") {
      const slice = Math.min(SLICE, rest);
      rest -= slice;
      if (this.status === "extra") {
        this.extraLeft -= slice;
        if (this.extraLeft <= 0) this.finish("reset");
        continue;
      }
      // A held second spends real time without moving the clock.
      const held = Math.min(this.hold, slice);
      this.hold -= held;
      const step = slice - held;
      if (step <= 0) continue;
      this.advance(step);
    }
  }

  private advance(step: number) {
    this.elapsed = Math.min(this.loopMs, this.elapsed + step);
    this.watched.set(this.place, (this.watched.get(this.place) ?? 0) + step);
    // A finished action.
    const a = this.action;
    if (a && this.elapsed - a.started >= (a.interaction.durationMs ?? 0)) {
      this.action = null;
      this.emit({ type: "action", id: null });
      this.apply(a.interaction.effects);
      if (this.status !== "play") return;
    }
    // Processes take their own time, while their conditions hold.
    for (const p of this.chapter.processes) {
      if (!this.all(p.while)) continue;
      const done = (this.progress.get(p.id) ?? 0) + step;
      if (done >= p.ms) {
        this.progress.set(p.id, 0);
        this.apply(p.effects);
        if (this.status !== "play") return;
      } else this.progress.set(p.id, done);
    }
    // Timed events: the same second, every loop.
    const left = this.left;
    this.chapter.events.forEach((e, i) => {
      if (this.status !== "play" || this.fired.has(i) || left > e.at) return;
      this.fired.add(i);
      if (this.all(e.requires)) this.apply(e.effects);
    });
    if (this.status !== "play") return;
    const shown = this.display;
    if (shown !== this.second) {
      this.second = shown;
      this.emit({ type: "second", left: shown });
    }
    // Zero.
    if (this.elapsed >= this.loopMs) {
      for (const rule of this.chapter.atZero) {
        if (this.all(rule.requires)) this.apply(rule.effects);
        if (this.status !== "play") return;
      }
      this.finish("reset");
    }
  }
}
