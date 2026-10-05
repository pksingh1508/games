// A platformer scene being played, in the browser (Plan/04-dont-trust-the-game.md §12): the fixed 60 Hz loop,
// keyboard, gamepad and touch input (Jump can be remapped: Chapter 2 sets it to F13), the world, the renderer and
// the sounds. The scene component owns one and reacts to its events; everything here runs outside React.
import { Input, type Bindings } from "@/engine/input";
import { createLoop, type Loop } from "@/engine/loop";
import { overlaps } from "@/engine/platformer/physics";
import { createRunner } from "@/engine/platformer/runner";
import { playSfx } from "../audio/sound";
import { JUMP, LEFT, PLAYER_H, PLAYER_W, RIGHT, TILE } from "../core/constants";
import type { Level } from "../core/level";
import { createWorld, moonJump, restartWorld, solidCell, step, type World, type WorldEvent, type WorldFlags } from "../core/world";
import { Renderer } from "../render/draw";

export type Action = "left" | "right" | "jump";

export const DEFAULT_JUMP_KEYS = ["Space", "ArrowUp", "KeyW"];

function bindings(jumpKeys: readonly string[]): Bindings<Action> {
  return {
    left: { keys: ["ArrowLeft", "KeyA"], buttons: [14], axis: { index: 0, dir: -1 } },
    right: { keys: ["ArrowRight", "KeyD"], buttons: [15], axis: { index: 0, dir: 1 } },
    jump: { keys: [...jumpKeys], buttons: [0, 1] },
  };
}

/** Keys typed into a text box or a slider aren't for the hero. */
function forTheGame(event: KeyboardEvent): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return true;
  if (el.isContentEditable) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return false;
  if (el instanceof HTMLInputElement) return el.type !== "text" && el.type !== "range" && el.type !== "number";
  if (el.getAttribute("role") === "slider") return false;
  return !(event.metaKey || event.ctrlKey || event.altKey);
}

export interface RuntimeOptions {
  level: Level;
  flags?: Partial<WorldFlags>;
  jumpKeys?: readonly string[];
  /** Read every frame. */
  view: () => { brightness: number; zoom: boolean; glitch: number; reducedMotion: boolean; reduceFlashing: boolean };
}

export class Runtime {
  world: World;
  readonly input: Input<Action>;
  readonly renderer: Renderer;
  private readonly loop: Loop;
  private prev = { x: 0, y: 0 };
  private readonly born = performance.now();
  private paused = false;
  private listeners = new Set<(events: readonly WorldEvent[], w: World) => void>();

  constructor(
    canvas: HTMLCanvasElement,
    private readonly options: RuntimeOptions,
  ) {
    this.world = createWorld(options.level, options.flags);
    this.renderer = new Renderer(canvas, options.level);
    this.input = new Input<Action>(bindings(options.jumpKeys ?? DEFAULT_JUMP_KEYS));
    this.prev = { x: this.world.p.x, y: this.world.p.y };
    this.loop = createLoop({ update: () => this.update(), render: (alpha) => this.render(alpha) });
  }

  start() {
    this.input.attach(window, (event) => !this.paused && forTheGame(event));
    this.render(1);
    this.loop.start();
  }

  destroy() {
    this.loop.stop();
    this.input.detach();
    this.listeners.clear();
  }

  onEvents(listener: (events: readonly WorldEvent[], w: World) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.loop.stop();
    this.input.clear();
    this.render(1);
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.input.clear();
    this.loop.start();
  }

  get isPaused() {
    return this.paused;
  }

  /** Change what the scene has set (brightness, difficulty, a squeezed wall…). If a wall appears where the hero
   * is standing, the hero goes back to the start. */
  setFlags(flags: Partial<WorldFlags>) {
    Object.assign(this.world.flags, flags);
    const p = this.world.p;
    const c0 = Math.floor(p.x / TILE);
    const c1 = Math.floor((p.x + p.w - 1) / TILE);
    const r0 = Math.floor(p.y / TILE);
    const r1 = Math.floor((p.y + p.h - 1) / TILE);
    let stuck = false;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidCell(this.world, c, r)) stuck = true;
    if (stuck) this.placeHero(this.world.level.spawn.x, this.world.level.spawn.y);
    if (this.paused) this.render(1);
  }

  setJumpKeys(keys: readonly string[]) {
    this.input.setBindings(bindings(keys));
  }

  placeHero(x: number, y: number) {
    this.world.p = createRunner(x, y, PLAYER_W, PLAYER_H);
    this.world.respawnAt = { x, y };
    this.prev = { x, y };
    this.world.touching.clear();
  }

  restart() {
    restartWorld(this.world);
    this.prev = { x: this.world.p.x, y: this.world.p.y };
  }

  moonJump() {
    moonJump(this.world);
    playSfx("portal", 0.7);
  }

  /** Is the hero overlapping this rectangle right now? */
  heroIn(r: { x: number; y: number; w: number; h: number }) {
    return overlaps(this.world.p, r);
  }

  /** On-screen buttons. */
  press(action: Action) {
    this.input.press(action);
  }

  release(action: Action) {
    this.input.release(action);
  }

  private update() {
    this.input.pollGamepads();
    const bits = (this.input.sample("left") ? LEFT : 0) | (this.input.sample("right") ? RIGHT : 0) | (this.input.sample("jump") ? JUMP : 0);
    this.prev = { x: this.world.p.x, y: this.world.p.y };
    step(this.world, bits);
    const events = this.world.events;
    if (!events.length) return;
    if (events.some((e) => e.type === "respawn")) this.prev = { x: this.world.p.x, y: this.world.p.y };
    this.renderer.onEvents(events, this.world);
    this.sounds(events);
    for (const listener of this.listeners) listener(events, this.world);
  }

  private sounds(events: readonly WorldEvent[]) {
    for (const e of events) {
      switch (e.type) {
        case "jump":
          playSfx("jump", 0.8);
          break;
        case "land":
          if (e.impact > 2.5) playSfx("land", Math.min(1, e.impact / 5));
          break;
        case "head":
          playSfx("bonk", 0.6);
          break;
        case "coin":
          playSfx("coin");
          break;
        case "die":
          playSfx("die");
          break;
        case "paper":
          playSfx("paper");
          break;
        case "push":
          if (this.world.tick % 8 === 0) playSfx("push", 0.7);
          break;
        case "loaded":
          playSfx("loaded");
          break;
        case "portal":
          playSfx("portal");
          break;
        case "lever":
          playSfx("lever");
          break;
        case "sticker":
          playSfx("sticker");
          break;
        case "bonk":
          playSfx("flip");
          break;
        case "door":
          if (e.kind === "fake") playSfx("cardboard");
          break;
        default:
          break;
      }
    }
  }

  private render(alpha: number) {
    const view = this.options.view();
    this.renderer.draw({
      world: this.world,
      prev: this.prev,
      alpha: this.paused ? 1 : alpha,
      time: (performance.now() - this.born) / 1000,
      brightness: view.brightness,
      zoom: view.zoom,
      glitch: view.glitch,
      reducedMotion: view.reducedMotion,
      reduceFlashing: view.reduceFlashing,
      hero: this.world.status === "play",
    });
  }
}
