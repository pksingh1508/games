// A level in the browser (Plan/10-last-pixel.md §12): the 60 Hz loop, your pointer, the world, the drawing,
// the sounds (the tool's own, the music that cuts when Pix wakes, the detector's beep) and the HUD's numbers.
// It also measures what's around the canvas, in cells: the HUD panels Pix can hide under, the page spots it
// can escape to (data-pix-spot: the logo's i, the "%", the pause button), and empty screen for a "dead
// pixel". Off the canvas, Pix is a tiny element over the page (you can click it there); in the tab escape it
// borrows the browser tab's icon, and always gives it back. Everything here runs outside React.
import { getAudio } from "@/engine/audio/engine";
import { borrowTab, type BorrowedTab } from "@/engine/browser/tab";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { loadSfx, playSfx } from "../audio/sfx";
import { music } from "../audio/music";
import { ToolSound } from "../audio/tools";
import { FULL, HZ } from "../core/constants";
import { dist, type Rect, type Vec } from "../core/geometry";
import type { HuntToolId, LevelDef, ToolId, Trick } from "../core/level";
import { formatProgress, World, type Layout, type LevelResult, type Phase, type SimEvent, type Spot } from "../core/world";
import { detectorHeat, Renderer, type Spray } from "../render/draw";
import { pixFavicon } from "../render/sprites";
import { CanvasInput } from "./input";

export interface Hud {
  ready: boolean;
  phase: Phase;
  started: boolean;
  /** The progress the way the HUD shows it ("99.989%"), and as 0–1. */
  progress: string;
  progressValue: number;
  /** The clean-up's clock, then the hunt's (ticks). */
  ticks: number;
  tool: ToolId;
  huntTool: HuntToolId;
  nets: number;
  baits: number;
  freezes: number;
  lens: boolean;
  /** The HUD panel Pix is hiding under (it wobbles), or -1. */
  wobble: number;
  trick: Trick | null;
  round: number;
  rounds: number;
  paused: boolean;
  /** A stroke's under way (outside the hunt): the HUD panels fade and let it through. */
  painting: boolean;
  /** For screen readers. */
  message: string;
}

export const initialHud = (): Hud => ({
  ready: false,
  phase: "clean",
  started: false,
  progress: "0%",
  progressValue: 0,
  ticks: 0,
  tool: "roller",
  huntTool: "catch",
  nets: 0,
  baits: 0,
  freezes: 0,
  lens: false,
  wobble: -1,
  trick: null,
  round: 0,
  rounds: 1,
  paused: true,
  painting: false,
  message: "",
});

export interface RuntimeOptions {
  level: LevelDef;
  assist: boolean;
  zoom: number;
  beeps: boolean;
  reduceMotion: () => boolean;
}

export interface RuntimeEvents {
  onDone(result: LevelResult, stars: [boolean, boolean, boolean]): void;
}

const SPRAY: Record<ToolId, Spray> = {
  roller: "paint",
  brush: "paint",
  sponge: "suds",
  scratch: "dust",
  mower: "grass",
  shovel: "snow",
  washer: "water",
  eraser: "crumbs",
};

const MESSAGES: Partial<Record<Trick, string>> = {
  burrow: "Pix has burrowed under the surface. Scrub where the detector beeps fastest.",
  hud: "Pix is hiding under a panel. The wobbling one: drag it out of the way.",
  dead: "Is that a dead pixel on your screen?",
  mimic: "There's a second mouse pointer. It isn't following your hand.",
  dom: "Pix has left the canvas. Follow the arrow at the edge.",
  tab: "Pix has jumped into your browser tab's icon. Look away and come back.",
};

export class Runtime {
  world: World;
  readonly renderer: Renderer;
  readonly input: CanvasInput;
  private readonly loop: Loop;
  private readonly toolSound = new ToolSound();
  private paused = true;
  private destroyed = false;
  private attempt = 0;
  private huntTool: HuntToolId = "catch";
  private lens = false;
  private tab: BorrowedTab | null = null;
  private beepAt = 0;
  private message = "";
  private messages = 0;
  private reported = false;
  private hudTick = 0;
  private born = performance.now();
  private prefs: { assist: boolean; zoom: number; beeps: boolean };
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly stage: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    /** Pix, when it's off the canvas. */
    private readonly overlay: HTMLElement,
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    this.prefs = { assist: options.assist, zoom: options.zoom, beeps: options.beeps };
    this.world = this.newWorld();
    this.renderer = new Renderer(canvas);
    this.renderer.attach(this.world);
    this.input = new CanvasInput(stage, {
      cellOf: (x, y) => this.cellOf(x, y),
      mode: (shift) => this.dragMode(shift),
      live: () => !this.paused && !this.destroyed,
      onActivity: () => {
        getAudio();
        void loadSfx();
      },
      onLens: (on) => this.setLens(on),
    });
    this.loop = createLoop({ update: () => this.update(), render: () => this.render() });
  }

  private newWorld() {
    const touch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    return new World(this.options.level, { assist: this.prefs.assist, touch, seed: this.attempt });
  }

  start() {
    this.input.attach();
    window.addEventListener("pointerdown", this.onWindowDown, { capture: true });
    window.addEventListener("scroll", this.measure, { passive: true });
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.stage);
    this.measure();
    this.render();
    this.publish(true);
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    // A real dead pixel would still be there on the pause screen. Pix isn't.
    this.input.push({ type: "paused" });
    this.overlay.hidden = true;
    this.toolSound.set(0);
    music.pause();
    this.publish(true);
  }

  resume() {
    if (this.destroyed) return;
    this.paused = false;
    this.measure();
    this.loop.start();
    music.resume();
    this.publish(true);
  }

  get isPaused() {
    return this.paused;
  }

  /** From the start again (Restart, Retry): a fresh world, paused until you're ready. */
  restart() {
    this.attempt++;
    this.world = this.newWorld();
    this.renderer.attach(this.world);
    this.reported = false;
    this.huntTool = "catch";
    this.lens = false;
    this.giveBackTab();
    this.input.clear();
    this.toolSound.stop();
    this.measure();
    this.render();
    this.publish(true);
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.input.detach();
    window.removeEventListener("pointerdown", this.onWindowDown, { capture: true });
    window.removeEventListener("scroll", this.measure);
    this.resizeObserver?.disconnect();
    this.giveBackTab();
    this.toolSound.stop();
    this.overlay.hidden = true;
  }

  setPrefs(prefs: Partial<Runtime["prefs"]>) {
    this.prefs = { ...this.prefs, ...prefs };
    (this.world.options as { assist?: boolean }).assist = this.prefs.assist;
  }

  /** A tool from the tool bar (1, 2…). */
  selectTool(tool: ToolId) {
    this.input.push({ type: "tool", tool });
    this.toolSound.use(tool);
    this.publish(true);
  }

  /** A hunt tool: freeze goes off at once; the others change what a tap or a drag does. */
  selectHuntTool(tool: HuntToolId) {
    if (tool === "freeze") {
      if (this.world.freezes > 0) this.input.push({ type: "freeze" });
      this.huntTool = "catch";
    } else this.huntTool = this.huntTool === tool ? "catch" : tool;
    this.publish(true);
  }

  setLens(on?: boolean) {
    if (!this.world.kit.magnifier) return;
    this.lens = on ?? !this.lens;
    this.publish(true);
  }

  /** The tab was hidden (the player looked away) or shown again. */
  visibility(hidden: boolean) {
    this.input.push({ type: hidden ? "hidden" : "visible" });
  }

  /** The HUD panels or the page moved: measure again. */
  measure = () => {
    if (this.destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2) return;
    const w = this.world;
    const cell = rect.width / w.w;
    this.renderer.resize(rect.width, rect.height, Math.min(2, window.devicePixelRatio || 1));
    const toCells = (r: DOMRect): Rect => ({ x: (r.left - rect.left) / cell, y: (r.top - rect.top) / cell, w: r.width / cell, h: r.height / cell });
    const hud: Rect[] = [];
    this.root.querySelectorAll<HTMLElement>("[data-pix-hud]").forEach((el) => {
      hud[Number(el.dataset.pixHud)] = toCells(el.getBoundingClientRect());
    });
    const spots: Spot[] = [];
    this.root.querySelectorAll<HTMLElement>("[data-pix-spot]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const id = el.dataset.pixSpot!;
      // The logo's slot is the dot itself; the "%" has its upper circle; the pause button gets a badge.
      const x = id === "pause" ? r.right - 3 : id === "percent" ? r.left + r.width * 0.28 : r.left + r.width / 2;
      const y = id === "pause" ? r.top + 3 : id === "percent" ? r.top + r.height * 0.32 : r.top + r.height / 2;
      spots.push({ id, x: (x - rect.left) / cell, y: (y - rect.top) / cell });
    });
    // A "dead pixel": somewhere on your screen that isn't the canvas, if there's room.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dead: Vec[] = [];
    const add = (x: number, y: number) => dead.push({ x: (x - rect.left) / cell, y: (y - rect.top) / cell });
    if (vw - rect.right > 28) add(rect.right + (vw - rect.right) * 0.55, rect.top + rect.height * 0.3);
    if (rect.left > 28) add(rect.left * 0.45, rect.top + rect.height * 0.62);
    if (rect.top > 90) add(rect.left + rect.width * 0.7, rect.top * 0.6);
    if (vh - rect.bottom > 40) add(rect.left + rect.width * 0.2, rect.bottom + (vh - rect.bottom) * 0.5);
    if (!dead.length) dead.push({ x: w.w * 0.9, y: w.h * 0.18 }, { x: w.w * 0.1, y: w.h * 0.8 });
    const layout: Layout = { hud: hud.filter(Boolean), spots, dead, cellPx: cell };
    w.setLayout(layout);
  };

  // -----------------------------------------------------------------------------------------------

  private cellOf(clientX: number, clientY: number): Vec {
    const r = this.canvas.getBoundingClientRect();
    const cell = r.width / this.world.w;
    return { x: (clientX - r.left) / cell, y: (clientY - r.top) / cell };
  }

  private dragMode(shift: boolean) {
    const w = this.world;
    if (w.phase !== "hunt") return "paint" as const;
    if ((shift || this.huntTool === "net") && w.nets > 0) return "net" as const;
    if (this.huntTool === "bait" && w.baits > 0) return "bait" as const;
    return "paint" as const;
  }

  /** Off the canvas, Pix can still be clicked: in the page, on a button, as a "dead pixel". */
  private onWindowDown = (e: PointerEvent) => {
    const w = this.world;
    // In the page (or on your "monitor"), Pix sits over whatever's there: clicks there are for it.
    const p = w.pix;
    if (this.paused || w.phase !== "hunt" || !w.catchable() || (p.mode !== "dom" && p.mode !== "dead") || (p.mode === "dead" && w.onCanvas() && !p.arrived)) return;
    const at = this.cellOf(e.clientX, e.clientY);
    if (dist(at, w.pix) > w.catchRadius() * 1.3) return;
    e.preventDefault();
    e.stopPropagation();
    this.input.push({ type: "press", at });
    this.input.push({ type: "release" });
  };

  private update() {
    const w = this.world;
    const before = w.phase;
    // The HUD's text moves as the numbers change: keep the page spots up to date while Pix is about.
    if ((w.phase === "hunt" && this.hudTick % 15 === 0) || (w.phase === "wake" && w.phaseTicks === 1)) this.measure();
    const events = w.step(this.input.take());
    this.react(events, before);
    // The tool's voice and its particles.
    const t = w.toolTick;
    const tool = w.painter.tool;
    this.toolSound.use(tool.id);
    if (tool.kind === "mower") this.toolSound.set(0, w.painter.mower.speed / 28);
    else this.toolSound.set(t.added * 0.9);
    if (t.added > 0 && w.painter.touched.length) {
      const at = w.painter.touched[w.painter.touched.length - 1]!;
      if (Math.random() < 0.6) this.renderer.spray(SPRAY[tool.id], at, tool.kind === "mower" ? 2 : 1);
    }
    if (tool.id === "sponge" && t.added > 0.4 && Math.random() < 0.02) playSfx("squeak");
    // The tab escape: Pix in the tab's icon.
    const p = w.pix;
    if (w.phase === "hunt" && p.mode === "tab" && p.arrived && !this.tab) {
      this.tab = borrowTab({ title: `👀 ${formatProgress(w.progress)} · Last Pixel`, icon: pixFavicon() });
    } else if (this.tab && !(p.mode === "tab" && w.phase === "hunt")) this.giveBackTab();
    if (++this.hudTick % 3 === 0 || this.hud.get().painting !== (this.input.down && w.phase !== "hunt")) this.publish();
  }

  private giveBackTab() {
    this.tab?.restore();
    this.tab = null;
  }

  private announce(text: string) {
    this.messages++;
    this.message = this.messages % 2 ? text : `${text}​`;
  }

  private react(events: readonly SimEvent[], before: Phase) {
    const w = this.world;
    for (const e of events) {
      switch (e.type) {
        case "start":
          music.play(w.phase === "revenge" ? "finale" : "calm");
          this.toolSound.use(w.painter.tool.id);
          break;
        case "wake":
          music.cut();
          this.toolSound.set(0);
          playSfx("wake");
          this.renderer.spray("sparkle", { x: e.x + 0.5, y: e.y + 0.5 }, 8);
          this.announce("99.99%… the last pixel woke up! It's Pix. Catch it.");
          break;
        case "hunt":
          music.play(w.level.revenge ? "finale" : "chase");
          if (e.round > 0) this.announce("Pix is back, with new tricks.");
          break;
        case "caught":
          playSfx(e.by === "net" ? "netted" : "aww");
          this.renderer.spray("pop", w.pix, 14);
          this.announce("Caught it!");
          break;
        case "escaped":
          playSfx("giggle");
          this.announce("Not yet! Pix got away again.");
          break;
        case "decoy":
          playSfx("pop");
          this.renderer.spray("pop", { x: e.x, y: e.y }, 8);
          setTimeout(() => playSfx("giggle"), 120);
          this.announce("A decoy. The real one keeps the beat.");
          break;
        case "miss":
          playSfx("miss");
          break;
        case "relocate":
          playSfx("giggle");
          break;
        case "dodge":
          playSfx("dodge");
          break;
        case "net":
          playSfx(e.caught ? "netted" : "swoop");
          if (!e.caught) this.announce("Missed with the net.");
          break;
        case "slip":
          playSfx("giggle");
          break;
        case "bait":
          playSfx("bait");
          break;
        case "freeze":
          playSfx("freeze");
          break;
        case "trick":
          if (MESSAGES[e.trick]) this.announce(MESSAGES[e.trick]!);
          if (e.trick !== "burrow") playSfx("giggle");
          break;
        case "exposed":
          playSfx("exposed");
          this.renderer.spray("sparkle", w.pix, 6);
          this.announce("Got you! It's stunned. Catch it.");
          break;
        case "tired":
          this.announce("Pix is getting tired.");
          break;
        case "gaveUp":
          playSfx("fine");
          this.announce('Pix gave up. "fine."');
          break;
        case "unpaint":
          playSfx("unpaint", { volume: 0.6 });
          break;
        case "dive":
          music.play("calm");
          playSfx("dive");
          this.announce("Pix dived into the gaps. Repaint, and it'll be the last pixel again.");
          break;
        case "notYet":
          playSfx("giggle");
          break;
        case "dumped":
          playSfx("dump");
          break;
        case "pile":
          playSfx("pile");
          break;
        case "done":
          break;
      }
    }
    if (before !== "done" && w.phase === "done" && !this.reported) {
      this.reported = true;
      music.stop();
      this.toolSound.set(0);
      this.renderer.celebrate();
      this.huntTool = "catch";
      this.lens = false;
      this.giveBackTab();
      this.publish(true);
      const result = w.result();
      const stars = w.stars();
      // A moment to see the 100% before the card.
      setTimeout(() => {
        if (!this.destroyed) this.events.onDone(result, stars);
      }, 700);
    }
  }

  private render() {
    const w = this.world;
    this.renderer.draw({
      world: w,
      pointer: this.input.pointer,
      down: this.input.down,
      touch: this.input.touch,
      huntTool: this.huntTool,
      net: this.input.netRect,
      lens: { on: this.lens, zoom: this.prefs.zoom },
      time: (performance.now() - this.born) / 1000,
      reduceMotion: this.options.reduceMotion(),
    });
    this.placeOverlay();
    this.detectorBeep();
  }

  /** Pix off the canvas: a tiny element over the page (a "dead pixel" is a pin-prick of pure colour). */
  private placeOverlay() {
    const w = this.world;
    const p = w.pix;
    const el = this.overlay;
    // Gone into the page, it's always this element (over the HUD too); a dead pixel, once it's sitting.
    const off = w.phase === "hunt" && (p.mode === "dom" || (p.mode === "dead" && !w.onCanvas()));
    const dead = w.phase === "hunt" && p.mode === "dead" && p.arrived;
    if (this.paused || !(off || dead)) {
      if (!el.hidden) el.hidden = true;
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    const cell = r.width / w.w;
    const size = dead ? 3 : Math.max(5, Math.round(cell));
    el.hidden = false;
    el.dataset.kind = dead ? "dead" : p.arrived ? "hiding" : "running";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.transform = `translate(${Math.round(r.left + p.x * cell - size / 2)}px, ${Math.round(r.top + p.y * cell - size / 2)}px)`;
  }

  private detectorBeep() {
    const w = this.world;
    if (!this.prefs.beeps || this.paused || w.phase !== "hunt" || !this.input.pointer) return;
    const heat = detectorHeat(w, this.input.pointer);
    const now = performance.now();
    const gap = 1100 - heat * 1000;
    if (now - this.beepAt < gap) return;
    this.beepAt = now;
    playSfx("beep", { rate: 0.8 + heat * 0.9, volume: 0.4 + heat * 0.6 });
  }

  private publish(force = false) {
    const w = this.world;
    const p = w.pix;
    const next: Hud = {
      ready: true,
      phase: w.phase,
      started: w.started,
      progress: formatProgress(w.progress),
      progressValue: w.progress,
      ticks: w.phase === "clean" || w.phase === "revenge" ? w.tick : w.huntTicks,
      tool: w.painter.tool.id,
      huntTool: this.huntTool,
      nets: w.nets,
      baits: w.baits,
      freezes: w.freezes,
      lens: this.lens,
      wobble: w.phase === "hunt" && p.mode === "hud" && p.arrived ? p.hud : -1,
      trick: w.phase === "hunt" && p.mode !== "free" && p.mode !== "stunned" && p.mode !== "caught" ? (p.mode as Trick) : null,
      round: w.round,
      rounds: w.rounds,
      paused: this.paused,
      painting: this.input.down && w.phase !== "hunt",
      message: this.message,
    };
    const now = this.hud.get();
    if (!force && Object.keys(next).every((k) => now[k as keyof Hud] === next[k as keyof Hud])) return;
    this.hud.set(next);
  }

  // -- QA ------------------------------------------------------------------------------------------

  /** QA: paint everything but the last cell (straight to the switch). */
  devFinishClean() {
    const w = this.world;
    const left = w.cov.remaining();
    for (const i of left.slice(0, -1)) w.cov.set(i, FULL);
    this.input.push({ type: "press", at: { x: -50, y: -50 } });
    this.input.push({ type: "release" });
  }

  /** QA: run ticks (paused or not), then draw. */
  devStep(ticks: number) {
    for (let i = 0; i < ticks; i++) this.update();
    this.render();
  }

  /** QA: the finale's revenge, over at once. */
  devSkipRevenge() {
    if (this.world.phase === "revenge") this.world.revengeLeft = 1;
  }

  /** QA: Pix caught, wherever it is. */
  devCatch() {
    (this.world as unknown as { caught(by: "click" | "net"): void }).caught("click");
  }

  /** QA: where Pix is (cells), and what it's doing. */
  devPix() {
    const p = this.world.pix;
    return { x: p.x, y: p.y, mode: p.mode, arrived: p.arrived, phase: this.world.phase, hz: HZ };
  }
}
