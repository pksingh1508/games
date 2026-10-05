// The story's director (Plan/04-dont-trust-the-game.md §12 "Story as a state machine"): what every scene talks to.
// It queues HELPER's lines (Truth Mode swaps the lies), keeps the trust tally (believing a lie, doubting a truth),
// records secrets, runs the stuck timer that brings TRUTH.exe (and, at 10 minutes, the honest skip), and shows
// captions and toasts. Outside React; the UI reads its snapshot.
import { Store } from "@/games/shared/store";
import { unlockDttgAchievement } from "../achievements";
import { helperVoice, playSfx } from "../audio/sound";
import { GLANCE, lineMs } from "../core/helper";
import { CHAPTER_OF, type SceneId } from "../core/story";
import { believed, doubted, foundSecret, type AchievementId } from "../progress";
import { dttgSave } from "../save";
import { HINTS, helpFor, type HelpLevel } from "../story/hints";
import { LINES, spoken, type TrustEvent } from "../story/lines";
import { SECRETS, type SecretId } from "../story/secrets";
import type { Runtime } from "./runtime";

export interface Said {
  id: string;
  text: string;
  lie: boolean;
  key: number;
  /** performance.now() when it started. */
  at: number;
  ms: number;
}

export interface DirectorView {
  helper: Said | null;
  truthExe: { level: Exclude<HelpLevel, "none" | "skip">; text: string; key: number } | null;
  skip: boolean;
  caption: { text: string; key: number } | null;
  toast: { text: string; key: number } | null;
  /** The real world has paused the game (the real settings, a hidden tab). */
  held: boolean;
  /** The touch pad: what the jump button says (F13, in Chapter 2), and whether the scene has a pause menu. */
  pad: { jump: string; menu: boolean; move: boolean; fill: boolean };
}

const initial = (): DirectorView => ({ helper: null, truthExe: null, skip: false, caption: null, toast: null, held: false, pad: { jump: "JUMP", menu: false, move: false, fill: true } });

export class Director {
  readonly store = new Store<DirectorView>(initial());
  scene: SceneId = "tutorial";
  truth = false;
  touch = false;
  /** The platformer that's on screen (the touch pad drives it). */
  runtime: Runtime | null = null;
  private queue: string[] = [];
  private keys = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private said = new Set<string>();
  private counted = new Set<string>();
  private step = "";
  private stuckMs = 0;
  private dismissed: HelpLevel = "none";
  private ticker: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private playStart = 0;
  private holds = new Set<string>();
  private onSkip: (() => void) | null = null;
  /** The fiction's pause menu (Esc, ☰). */
  menu: (() => void) | null = null;
  /** The scene wants to know about touch-pad presses (Chapter 2's dead F13 button). */
  onPad: ((action: "left" | "right" | "jump") => void) | null = null;

  setTruth(on: boolean) {
    this.truth = on;
  }

  setTouch(on: boolean) {
    this.touch = on;
  }

  /** The platformer now on screen (the touch pad and the real pause reach it). */
  attach(runtime: Runtime) {
    this.runtime = runtime;
  }

  detach(runtime: Runtime) {
    if (this.runtime === runtime) this.runtime = null;
  }

  setMenu(open: (() => void) | null) {
    this.menu = open;
  }

  setOnPad(listener: ((action: "left" | "right" | "jump") => void) | null) {
    this.onPad = listener;
  }

  /** The touch pad. */
  press(action: "left" | "right" | "jump") {
    this.runtime?.press(action);
    this.onPad?.(action);
  }

  release(action: "left" | "right" | "jump") {
    this.runtime?.release(action);
  }

  start() {
    this.lastTick = performance.now();
    this.playStart = this.lastTick;
    this.ticker = setInterval(() => this.tick(), 1000);
  }

  destroy() {
    if (this.ticker) clearInterval(this.ticker);
    if (this.timer) clearTimeout(this.timer);
    this.flushPlayTime();
  }

  private set(change: Partial<DirectorView>) {
    this.store.set({ ...this.store.get(), ...change });
  }

  // -- Scenes ------------------------------------------------------------------------------------------------

  /** A new scene: HELPER forgets what it said (for the trust tally), and the stuck timer starts over. */
  enter(scene: SceneId, onSkip: (() => void) | null) {
    this.scene = scene;
    this.said.clear();
    this.counted.clear();
    this.queue = [];
    this.onSkip = onSkip;
    this.setStep(scene);
    this.set({ helper: null, truthExe: null, skip: false, caption: null });
  }

  /** Which part of the scene's puzzle you're on (hints are about it). */
  setStep(step: string) {
    if (step === this.step) return;
    this.step = step;
    this.stuckMs = 0;
    this.dismissed = "none";
    this.set({ truthExe: null, skip: false });
  }

  get currentStep() {
    return this.step;
  }

  // -- Holding (the real world pausing the fiction) --------------------------------------------------------

  /** What the touch pad shows for this scene. */
  setPad(pad: Partial<DirectorView["pad"]>) {
    const now = this.store.get().pad;
    const next = { ...now, ...pad };
    if (next.jump !== now.jump || next.menu !== now.menu || next.move !== now.move || next.fill !== now.fill) this.set({ pad: next });
  }

  hold(reason: string, on: boolean) {
    if (on) this.holds.add(reason);
    else this.holds.delete(reason);
    const held = this.holds.size > 0;
    if (held === this.store.get().held) return;
    if (held) this.runtime?.pause();
    else this.runtime?.resume();
    this.set({ held });
  }

  // -- HELPER ---------------------------------------------------------------------------------------------------

  /**
   * HELPER says a line. By default it waits its turn (a scene's opening lines play in order). `soon` jumps the queue:
   * it replaces whatever's waiting and follows the current line once that's had its moment (lines about where
   * you are now). `now` interrupts straight away. Nothing cuts a lie off before its first glance.
   */
  say(id: string, { now = false, soon = false }: { now?: boolean; soon?: boolean } = {}) {
    const current = this.store.get().helper;
    if (!current) {
      this.queue = [];
      this.show(id);
      return;
    }
    if (!now && !soon) {
      if (!this.queue.includes(id)) this.queue.push(id);
      return;
    }
    this.queue = [id];
    const shown = performance.now() - current.at;
    const least = current.lie ? GLANCE.first + GLANCE.length + 50 : now ? 250 : 1600;
    if (shown >= least) {
      this.next();
      return;
    }
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.next(), least - shown);
  }

  /** Tap the bubble (or the line's time is up): on to the next line. */
  next() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const id = this.queue.shift();
    if (id) this.show(id);
    else this.set({ helper: null });
  }

  hush() {
    if (this.timer) clearTimeout(this.timer);
    this.queue = [];
    this.set({ helper: null });
  }

  private show(id: string) {
    if (this.timer) clearTimeout(this.timer);
    const { text, lie } = spoken(id, { truth: this.truth, touch: this.touch });
    const prefs = dttgSave.get().prefs;
    const ms = lineMs(text, prefs.speed);
    this.said.add(id);
    this.set({ helper: { id, text, lie, key: ++this.keys, at: performance.now(), ms } });
    helperVoice(text, lie);
    this.timer = setTimeout(() => this.next(), ms);
  }

  /** Has HELPER said this line in this scene? */
  hasSaid(id: string) {
    return this.said.has(id);
  }

  // -- Trust ------------------------------------------------------------------------------------------------

  /** You did something: if HELPER told you a lie about it (or a truth you're now doubting), it counts. */
  act(event: TrustEvent) {
    if (this.truth) return;
    for (const l of LINES) {
      if (!this.said.has(l.id) || this.counted.has(l.id)) continue;
      if (l.lie && l.believe === event) {
        this.counted.add(l.id);
        const out = believed(dttgSave.get(), this.scene);
        dttgSave.set(out.save);
        this.unlock(out.unlock);
      } else if (!l.lie && l.doubt === event) {
        this.counted.add(l.id);
        dttgSave.set(doubted(dttgSave.get()));
      }
    }
  }

  // -- Secrets, achievements, toasts and captions -----------------------------------------------------------

  secret(id: SecretId) {
    const out = foundSecret(dttgSave.get(), id);
    if (!out.fresh) return;
    dttgSave.set(out.save);
    const s = SECRETS.find((x) => x.id === id)!;
    playSfx("secret");
    this.toast(`Secret found: ${s.name} (${Object.keys(out.save.secrets).length}/${SECRETS.length})`);
    this.unlock(out.unlock);
  }

  unlock(ids: readonly AchievementId[]) {
    for (const id of ids) unlockDttgAchievement(id);
  }

  toast(text: string) {
    this.set({ toast: { text, key: ++this.keys } });
  }

  caption(text: string) {
    if (!dttgSave.get().prefs.captions) return;
    this.set({ caption: { text, key: ++this.keys } });
  }

  // -- The stuck timer ------------------------------------------------------------------------------------

  private tick() {
    const now = performance.now();
    const dt = now - this.lastTick;
    this.lastTick = now;
    if (this.store.get().held || this.truth) return;
    this.stuckMs += dt;
    const level = helpFor(this.stuckMs, dttgSave.get().prefs.sooner);
    if (level === "none" || level === this.dismissed) return;
    const order: HelpLevel[] = ["none", "riddle", "direct", "skip"];
    if (order.indexOf(level) <= order.indexOf(this.dismissed)) return;
    const view = this.store.get();
    if (level === "skip") {
      if (!view.skip && this.onSkip && CHAPTER_OF[this.scene] < 6) {
        this.set({ skip: true });
        this.say("any.skip", { now: true });
      }
      return;
    }
    const hint = HINTS[this.step] ?? HINTS[this.scene];
    if (!hint) return;
    if (view.truthExe?.level === level) return;
    this.set({ truthExe: { level, text: level === "riddle" ? hint.riddle : hint.direct, key: ++this.keys } });
  }

  dismissHint() {
    this.dismissed = this.store.get().truthExe?.level ?? this.dismissed;
    this.set({ truthExe: null });
  }

  acceptSkip(yes: boolean) {
    this.dismissed = "skip";
    this.set({ skip: false });
    if (yes) this.onSkip?.();
  }

  // -- Time played --------------------------------------------------------------------------------------------

  flushPlayTime() {
    const now = performance.now();
    const ms = Math.round(now - this.playStart);
    this.playStart = now;
    if (ms > 0 && ms < 6 * 3600_000) dttgSave.update((s) => ({ ...s, playMs: s.playMs + ms }));
  }
}
