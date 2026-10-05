// A chapter in the browser (Plan/03-99-seconds.md §12 "One authoritative loop clock"): the loop's time comes from
// performance.now() on requestAnimationFrame (never setInterval), and stops for the pause menu, the journal
// (Normal mode), reading (Relaxed mode) and the flash between loops. Sounds are panned toward the wall they come
// from; captions, the message line, the action ring and the journal's toasts come from the loop's events. The
// screen reads a snapshot from a store, published only when something it shows has changed.
import { Store } from "@/games/shared/store";
import type { ArtState } from "../art/kit";
import { Music } from "../audio/music";
import { playSound, tick, whoosh } from "../audio/sounds";
import { Loop, type LoopEvent, type LoopResult } from "../core/loop";
import { saturation, type ChapterProgress } from "../core/memory";
import { type ChapterId, type Wall } from "../core/types";
import type { LoopReport } from "../progress";
import { CHAPTER_DEFS } from "../rooms";

export type Mode = "normal" | "hardcore" | "relaxed";

export interface Snapshot {
  ready: boolean;
  chapter: ChapterId;
  art: ArtState;
  /** The hotspots on screen, where they're drawn (scene units). */
  hotspots: Array<{ id: string; label: string; box: [number, number, number, number] }>;
  /** A wall (turn left and right) or a close-up (back out). */
  wall: boolean;
  items: Array<{ id: string; name: string; about: string }>;
  selected: string | null;
  display: number;
  hideClock: boolean;
  /** An action under way: what it says, how long it takes (game ms) and how far it's got. */
  action: { doing: string; ms: number; progress: number; key: number } | null;
  message: { text: string; key: number } | null;
  caption: { text: string; key: number } | null;
  /** "Noted in your journal" (not in Hardcore). */
  noted: { key: number } | null;
  /** The loop you're in (1-based). */
  loop: number;
  paused: boolean;
  journal: boolean;
  transition: { loop: number; key: number } | null;
  /** How it ended (an escape, an ending, or a Single Loop that ran out). */
  over: LoopResult | null;
  saturation: number;
  /** Bumps each time a glance at a clock stretches the second. */
  stretch: number;
}

export interface RuntimeOptions {
  chapter: ChapterId;
  mode: Mode;
  /** The Single Loop challenge: one loop, no second chances. */
  single: boolean;
  subtitles: () => boolean;
  /** The chapter's journal and memory as saved (read at the start of each loop). */
  progress: () => ChapterProgress;
}

export interface RuntimeEvents {
  /** New clues: into the journal now (a reload keeps them). */
  onClues(found: ReadonlyArray<{ id: string; at: number }>): void;
  /** A loop's over. */
  onLoopEnd(report: LoopReport): void;
}

const ORDER: Wall[] = ["north", "east", "south", "west"];
const TRANSITION_MS = 1400;

export const emptySnapshot = (chapter: ChapterId): Snapshot => ({
  ready: false,
  chapter,
  art: { chapter, place: "north", room: "", mirrored: false, flags: new Set(), items: [], entry: "", left: 99, display: 99, loopSeconds: 99, elapsedMs: 0, extra: false, loops: 0, scratches: [] },
  hotspots: [],
  wall: true,
  items: [],
  selected: null,
  display: 99,
  hideClock: false,
  action: null,
  message: null,
  caption: null,
  noted: null,
  loop: 1,
  paused: false,
  journal: false,
  transition: null,
  over: null,
  saturation: 1,
  stretch: 0,
});

/** How long a message takes to read (Relaxed mode holds the clock that long). */
const readMs = (text: string) => 1500 + text.length * 45;

export class Runtime {
  loop!: Loop;
  private readonly def;
  private readonly music = new Music();
  private raf = 0;
  private last = 0;
  private running = false;
  private paused = false;
  private journal = false;
  private readUntil = 0;
  private transitionUntil = 0;
  private selected: string | null = null;
  private message: Snapshot["message"] = null;
  private messageUntil = 0;
  private caption: Snapshot["caption"] = null;
  private captionUntil = 0;
  private noted: Snapshot["noted"] = null;
  private notedUntil = 0;
  private action: Snapshot["action"] = null;
  private transition: Snapshot["transition"] = null;
  private over: LoopResult | null = null;
  private stretch = 0;
  private keys = 0;
  private realMs = 0;
  private reported = 0;
  private lastKey = "";
  /** The picture, kept until something in it changes (so a progress ring or a message doesn't redraw the room). */
  private art: { key: string; state: ArtState } | null = null;

  constructor(
    private readonly options: RuntimeOptions,
    private readonly store: Store<Snapshot>,
    private readonly events: RuntimeEvents,
  ) {
    this.def = CHAPTER_DEFS[options.chapter];
  }

  private get seconds() {
    return this.options.mode === "relaxed" ? 150 : 99;
  }

  start() {
    this.newLoop();
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.music.stop();
  }

  private newLoop() {
    const progress = this.options.progress();
    this.loop = new Loop(this.def, { seconds: this.seconds, known: new Set(Object.keys(progress.clues)) });
    this.loop.events.length = 0;
    this.reported = 0;
    this.realMs = 0;
    this.selected = null;
    this.action = null;
    this.music.start(this.options.chapter, this.loop.left);
    if (progress.loops === 0 && !this.options.single) this.say("You wake up in a chair.");
    this.publish(true);
  }

  // -- Time ---------------------------------------------------------------------------------------

  /** Whether the clock is held right now. */
  private held(now: number) {
    if (this.paused || this.over || this.transitionUntil) return true;
    if (this.journal && this.options.mode !== "hardcore") return true;
    return this.options.mode === "relaxed" && now < this.readUntil;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min(5000, Math.max(0, now - this.last)) : 0;
    this.last = now;
    if (this.transitionUntil && now >= this.transitionUntil) {
      this.transitionUntil = 0;
      this.transition = null;
      this.newLoop();
    }
    if (!this.held(now) && dt > 0) {
      this.loop.tick(dt);
      this.realMs += dt;
      this.handle(this.loop.events, now);
      this.loop.events.length = 0;
      this.music.sync(this.loop.left);
      if (this.action && this.loop.action) this.action = { ...this.action, progress: this.loop.actionProgress };
    }
    if (this.message && now >= this.messageUntil) this.message = null;
    if (this.caption && now >= this.captionUntil) this.caption = null;
    if (this.noted && now >= this.notedUntil) this.noted = null;
    this.publish(false);
  };

  // -- Events ---------------------------------------------------------------------------------------

  private say(text: string, now = performance.now()) {
    if (!text) return;
    this.message = { text, key: ++this.keys };
    const ms = readMs(text);
    this.messageUntil = now + Math.max(3500, ms);
    if (this.options.mode === "relaxed") this.readUntil = now + ms;
  }

  /** Where a wall is, to your ears (-0.75 left … 0.75 right), and how loud. */
  private pan(wall: Wall | undefined): { pan: number; gain: number } {
    if (!wall) return { pan: 0, gain: 1 };
    const place = this.loop.place;
    const facing = (ORDER as string[]).includes(place) ? (place as Wall) : ((this.def.closeups[place] as Wall | undefined) ?? "north");
    const from = ORDER.indexOf(this.loop.shownAs(wall) as Wall);
    const to = ORDER.indexOf(this.loop.shownAs(facing) as Wall);
    const rel = (from - to + 4) % 4;
    return rel === 0 ? { pan: 0, gain: 1 } : rel === 1 ? { pan: 0.75, gain: 0.85 } : rel === 3 ? { pan: -0.75, gain: 0.85 } : { pan: 0, gain: 0.6 };
  }

  private handle(events: readonly LoopEvent[], now: number) {
    for (const e of events) {
      switch (e.type) {
        case "say":
          this.say(e.text, now);
          break;
        case "sound": {
          const { pan, gain } = this.pan(e.wall);
          playSound(e.id, pan, gain);
          if (e.caption && this.options.subtitles()) {
            this.caption = { text: e.caption, key: ++this.keys };
            this.captionUntil = now + 3500;
          }
          break;
        }
        case "clue": {
          const fresh = this.loop.found.slice(this.reported);
          this.reported = this.loop.found.length;
          if (fresh.length) {
            this.events.onClues(fresh);
            if (this.options.mode !== "hardcore") {
              this.noted = { key: ++this.keys };
              this.notedUntil = now + 2200;
            }
          }
          break;
        }
        case "action": {
          const a = this.loop.action;
          this.action = e.id && a ? { doing: a.interaction.doing ?? "…", ms: a.interaction.durationMs ?? 0, progress: 0, key: ++this.keys } : null;
          break;
        }
        case "stretch":
          this.stretch++;
          tick(true);
          break;
        case "second":
          if (this.loop.hold <= 0) tick(false);
          break;
        case "extra":
          break;
        case "end":
          this.end(e.result, now);
          break;
        default:
          break;
      }
    }
  }

  private end(result: LoopResult, now: number) {
    this.events.onLoopEnd({
      chapter: this.options.chapter,
      result,
      found: this.loop.found,
      stretched: this.loop.stretched,
      stared: this.loop.flags.has("stared"),
      realMs: this.realMs,
      ...(this.options.single ? { single: { left: this.loop.left } } : {}),
    });
    this.action = null;
    if (result === "reset" && !this.options.single) {
      whoosh();
      this.transitionUntil = now + TRANSITION_MS;
      this.transition = { loop: this.options.progress().loops + 1, key: ++this.keys };
      this.music.stop();
      return;
    }
    this.over = result;
    this.music.stop();
  }

  // -- Input ----------------------------------------------------------------------------------------

  private live() {
    return !this.paused && !this.over && !this.transitionUntil;
  }

  private after() {
    this.handle(this.loop.events, performance.now());
    this.loop.events.length = 0;
    this.publish(true);
  }

  look(view: string) {
    if (!this.live()) return;
    this.loop.look(view);
    this.after();
  }

  turn(dir: 1 | -1) {
    if (!this.live()) return;
    this.loop.turn(dir);
    this.after();
  }

  back() {
    if (!this.live()) return;
    this.loop.back();
    this.after();
  }

  /** Click a hotspot (with the item in your hand, if you're holding one). */
  tap(id: string) {
    if (!this.live()) return;
    const use = this.selected;
    this.selected = null;
    this.loop.interact(id, use);
    this.after();
  }

  /** Use a particular item on a hotspot (dragged there). */
  useOn(item: string, id: string) {
    if (!this.live()) return;
    this.selected = null;
    this.loop.interact(id, item);
    this.after();
  }

  select(item: string | null) {
    if (!this.live()) return;
    // Picking an item while holding another: use one on the other (if that does anything), or just swap.
    if (item && this.selected && this.selected !== item) {
      const held = this.selected;
      this.selected = null;
      if (this.loop.interact(`item:${item}`, held) !== "nothing") {
        this.after();
        return;
      }
      this.loop.events.length = 0;
    }
    this.selected = item === this.selected ? null : item;
    this.publish(true);
  }

  /** A digit typed on the keyboard (only means something at a keypad). */
  typeDigit(d: string) {
    if (this.loop.place !== "closeup:keypad") return;
    this.tap(`k${d}`);
  }

  cancelAction() {
    if (!this.live()) return;
    this.loop.cancel();
    this.after();
  }

  setPaused(on: boolean) {
    this.paused = on;
    if (on) this.loop.cancel();
    this.last = 0;
    this.after();
  }

  setJournal(on: boolean) {
    this.journal = on && this.options.mode !== "hardcore";
    this.publish(true);
  }

  // -- The snapshot ---------------------------------------------------------------------------------

  private publish(force: boolean) {
    const l = this.loop;
    const progress = this.options.progress();
    const flags = [...l.flags].sort().join(",");
    const key = [l.view, l.room, flags, l.items.join(","), l.entry, l.display, l.status, this.selected, this.message?.key, this.caption?.key, this.action?.key, Math.round((this.action?.progress ?? 0) * 20), this.paused, this.journal, this.transition?.key, this.over, this.noted?.key, this.stretch, progress.scratches.length, progress.loops].join("|");
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    const wall = (ORDER as string[]).includes(l.place);
    const flip = wall && l.mirrored;
    // Nothing in the pictures moves by less than the clock's second (the slow wall clock steps with it).
    const artKey = [l.place, l.room, flags, l.items.join(","), l.entry, l.display, l.status, progress.loops, progress.scratches.length].join("|");
    if (this.art?.key !== artKey) {
      this.art = {
        key: artKey,
        state: {
          chapter: this.options.chapter,
          place: l.place,
          room: l.room,
          mirrored: l.mirrored,
          flags: new Set(l.flags),
          items: [...l.items],
          entry: l.entry,
          left: l.left,
          display: l.display,
          loopSeconds: this.seconds,
          elapsedMs: l.elapsed,
          extra: l.status === "extra",
          loops: progress.loops,
          scratches: progress.scratches,
        },
      };
    }
    this.store.set({
      ready: true,
      chapter: this.options.chapter,
      art: this.art.state,
      hotspots: l.hotspots().map((h) => {
        const [x, y, w, hh] = h.box;
        return { id: h.id, label: h.label, box: flip ? [1600 - x - w, y, w, hh] : [x, y, w, hh] };
      }),
      wall,
      items: l.items.map((id) => this.def.items.find((i) => i.id === id)!).filter(Boolean),
      selected: this.selected,
      display: l.display,
      hideClock: !!this.def.hideClock,
      action: this.action,
      message: this.message,
      caption: this.caption,
      noted: this.noted,
      loop: progress.loops + 1,
      paused: this.paused,
      journal: this.journal,
      transition: this.transition,
      over: this.over,
      saturation: saturation(progress.streak),
      stretch: this.stretch,
    });
  }
}
