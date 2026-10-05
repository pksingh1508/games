// A night in the browser (Plan/14-dont-blink.md §12): the 60 Hz loop, the night itself, the camera view, your
// eyelids, the sounds and captions, and the HUD's numbers. Pure TypeScript outside React: React only reads the
// HUD store (which changes a few times a second, not every frame), and the eyelids are moved straight in the DOM.
import { getAudio } from "@/engine/audio/engine";
import { createLoop, type Loop } from "@/engine/loop";
import { Store } from "@/games/shared/store";
import { Ambience, sounds } from "../audio/sounds";
import { Bot } from "../core/bot";
import { ROOM_SOUND } from "../core/catalogue";
import { HOURS, HZ, VIEW_H, VIEW_W } from "../core/constants";
import { Game, type GameEvent, type GameSetup, type NightResult, type Status, type Verdict } from "../core/game";
import { CAMERA_NAMES, type AnomalyType, type CameraId } from "../core/types";
import { cover } from "../render/lids";
import { ViewRenderer } from "../render/view";

export interface Stamp {
  ok: boolean;
  title: string;
  detail: string;
  /** Changes every report, so the stamp animates again. */
  key: number;
}

export interface Hud {
  ready: boolean;
  status: Status;
  /** "02:41". */
  clock: string;
  hour: number;
  lying: boolean;
  camera: CameraId;
  cameras: CameraId[];
  /** Unreported changes, and how many end the night. */
  active: number;
  max: number;
  /** Seconds left on the countdown (five changes waiting), or null. */
  danger: number | null;
  /** Eye strain, 0–100 (in steps). */
  strain: number;
  holding: boolean;
  /** False reports you can still make this hour before you're fired. */
  credibility: number;
  credibilityOf: number;
  warned: boolean;
  /** Reference photos left (null: unlimited). */
  photos: number | null;
  photo: boolean;
  caption: { text: string; key: number } | null;
  stamp: Stamp | null;
  labels: Record<AnomalyType, AnomalyType>;
  /** For screen readers. */
  message: string;
}

export const initialHud = (): Hud => ({
  ready: false,
  status: "play",
  clock: "00:00",
  hour: 0,
  lying: false,
  camera: "lobby",
  cameras: [],
  active: 0,
  max: 5,
  danger: null,
  strain: 0,
  holding: false,
  credibility: 3,
  credibilityOf: 3,
  warned: false,
  photos: 0,
  photo: false,
  caption: null,
  stamp: null,
  labels: { moved: "moved", missing: "missing", extra: "extra", changed: "changed", intruder: "intruder", light: "light", door: "door", count: "count", mirror: "mirror" },
  message: "",
});

export interface RuntimeOptions {
  setup: GameSetup;
  reduceFlashing: () => boolean;
  captions: () => boolean;
}

export interface RuntimeEvents {
  onEnd(result: NightResult): void;
}

const ROOM_NAMES: Record<CameraId, string> = { ...CAMERA_NAMES, office: "right outside your door" };

const side = (pan: number) => (pan < -0.5 ? "far to your left" : pan < -0.1 ? "to your left" : pan > 0.5 ? "far to your right" : pan > 0.1 ? "to your right" : "close by");

export const clockText = (minutes: number) => {
  const m = Math.max(0, Math.floor(minutes));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export class Runtime {
  readonly game: Game;
  readonly renderer: ViewRenderer;
  private readonly loop: Loop;
  private readonly ambience = new Ambience();
  private paused = true;
  private destroyed = false;
  private ended = false;
  private holding = false;
  private caption: { text: string; key: number; until: number } | null = null;
  private stamp: Stamp | null = null;
  private stampUntil = 0;
  private message = "";
  private nextBeat = 0;
  private resizeObserver: ResizeObserver | null = null;
  private filter = "";
  private born = performance.now();
  private frames: number[] = [];
  private lastFrame = 0;
  private hudKey = "";
  /** QA: the careful tester playing through the live loop. */
  private bot: Bot | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly lids: { top: HTMLElement; bottom: HTMLElement },
    private readonly options: RuntimeOptions,
    private readonly hud: Store<Hud>,
    private readonly events: RuntimeEvents,
  ) {
    this.game = new Game(options.setup);
    this.renderer = new ViewRenderer(canvas);
    this.loop = createLoop({ update: () => this.update(), render: () => this.render() });
  }

  start() {
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.canvas);
    this.measure();
    this.render();
    this.publish(true);
  }

  private measure() {
    const box = this.canvas.getBoundingClientRect();
    this.renderer.resize(box.width, box.height);
    if (this.paused) this.render();
  }

  pause() {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    this.loop.stop();
    this.setHolding(false);
    this.ambience.stop();
    this.publish(true);
  }

  resume() {
    if (!this.paused || this.destroyed || this.ended) return;
    this.paused = false;
    getAudio();
    this.ambience.start();
    this.loop.start();
  }

  get running() {
    return !this.paused;
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.ambience.stop();
    this.resizeObserver?.disconnect();
  }

  // -- Input ---------------------------------------------------------------------------------------

  setHolding(on: boolean) {
    this.holding = on && !this.paused;
  }

  look(camera: CameraId) {
    if (this.paused) return;
    if (this.game.look(camera)) {
      if (camera !== "office" && this.game.from !== "office") sounds.static();
      this.publish(true);
    }
  }

  togglePhoto() {
    if (this.paused) return;
    if (this.game.photoLeft > 0) this.game.closePhoto();
    else this.game.usePhoto();
    this.publish(true);
  }

  /** A point on the canvas (client px) in scene units as shown, or null if it's off the picture. */
  toScene(clientX: number, clientY: number): { x: number; y: number } | null {
    const box = this.canvas.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * VIEW_W;
    const y = ((clientY - box.top) / box.height) * VIEW_H;
    if (x < 0 || y < 0 || x > VIEW_W || y > VIEW_H) return null;
    return { x, y };
  }

  report(x: number, y: number, type: AnomalyType): Verdict | null {
    if (this.paused) return null;
    sounds.click();
    const verdict = this.game.report(x, y, type);
    this.handle(this.game.events);
    this.game.events.length = 0;
    this.publish(true);
    return verdict;
  }

  /** QA (dev builds): run some ticks straight away, then draw. */
  devStep(ticks: number) {
    for (let i = 0; i < ticks && !this.ended; i++) this.update();
    this.render();
  }

  /** QA (dev builds): let the careful tester play (it reports through the game, so stamps and sounds still come). */
  devAutoplay(on: boolean) {
    this.bot = on ? new Bot() : null;
  }

  /** QA (dev builds): make a change now, as a blink would. */
  devForce(id: string) {
    const ok = this.game.force(id);
    this.handle(this.game.events);
    this.game.events.length = 0;
    this.publish(true);
    this.render();
    return ok;
  }

  /** Give up the night (from the pause menu). */
  quit() {
    this.game.quit();
    this.handle(this.game.events);
    this.game.events.length = 0;
  }

  // -- The loop ------------------------------------------------------------------------------------

  private update() {
    const game = this.game;
    game.holding = this.holding;
    this.bot?.act(game);
    game.step();
    this.bot?.hear(game);
    this.handle(game.events);
    game.events.length = 0;
    if (this.ended) return;
    // The clock ticks once a second; the heart beats faster as changes pile up.
    if (game.tick % HZ === 0) this.ambience.tick((game.tick / HZ) % 2 === 1);
    const pile = game.active.size;
    if ((pile >= 3 || game.danger !== null) && game.tick >= this.nextBeat) {
      const bpm = game.danger !== null ? 140 : 60 + 20 * (pile - 2);
      sounds.heartbeat(Math.min(1, (pile - 2) / 3));
      this.nextBeat = game.tick + Math.round((60 * HZ) / bpm);
    }
    this.publish(false);
  }

  private say(text: string) {
    this.message = text;
    if (!this.options.captions()) return;
    this.caption = { text, key: (this.caption?.key ?? 0) + 1, until: this.game.tick + Math.round(HZ * 3.2) };
  }

  private setStamp(ok: boolean, title: string, detail: string) {
    this.stamp = { ok, title, detail, key: (this.stamp?.key ?? 0) + 1 };
    this.stampUntil = this.game.tick + Math.round(HZ * 2.6);
    this.message = `${title}. ${detail}`;
  }

  private handle(events: readonly GameEvent[]) {
    for (const e of events) {
      switch (e.type) {
        case "scrape": {
          const where = ROOM_SOUND[e.room];
          sounds.scrape(where.pan, where.far);
          this.say(e.room === "office" ? "[stone scraping — right behind you]" : `[stone scraping — ${ROOM_NAMES[e.room]}]`);
          break;
        }
        case "home":
          sounds.home(ROOM_SOUND.sculpture.pan);
          break;
        case "creak":
          sounds.creak(ROOM_SOUND[e.room].pan);
          this.say("[a door creaks somewhere]");
          break;
        case "footsteps":
          sounds.footsteps(ROOM_SOUND[e.room].pan);
          this.say(`[footsteps — ${side(ROOM_SOUND[e.room].pan)}]`);
          break;
        case "flicker":
          sounds.flicker();
          this.say("[the lights buzz]");
          break;
        case "photo":
          sounds.photo();
          break;
        case "warned":
          sounds.warned();
          this.say("[your phone buzzes: the manager]");
          this.message = "A text from the manager: that's three false reports this hour. Any more and you're done.";
          break;
        case "hour":
          sounds.hour(false);
          this.say("[the clock chimes]");
          break;
        case "danger":
          if (e.on) this.say("[your heart is pounding]");
          break;
        case "lying":
          break;
        case "report":
          this.verdict(e.verdict);
          break;
        case "end":
          this.end(e.status);
          break;
        default:
          break;
      }
    }
  }

  private verdict(v: Verdict) {
    const name = v.name ? v.name.charAt(0).toUpperCase() + v.name.slice(1) : "";
    if (v.ok) {
      sounds.accepted();
      if (v.visitor) this.setStamp(true, "Report accepted", "The statue has been returned to the Sculpture Hall.");
      else this.setStamp(true, "Report accepted", `${name}: fixed.`);
      return;
    }
    if (v.reason === "visitor-away") {
      sounds.denied();
      this.setStamp(false, "It isn't gone", "The statue's not missing. It's somewhere else.");
      return;
    }
    sounds.denied();
    const left = this.game.config.credibility[1] - this.game.falseThisHour;
    const cost = v.penalty ? ` Credibility: ${Math.max(0, left)} left this hour.` : "";
    this.setStamp(false, "No anomaly found", v.reason === "wrong-type" ? `That's not what changed.${cost}` : `Nothing's wrong there.${cost}`);
  }

  private end(status: Status) {
    if (this.ended) return;
    this.ended = true;
    this.loop.stop();
    this.ambience.stop();
    this.paused = true;
    if (status === "won") sounds.hour(true);
    this.publish(true);
    this.events.onEnd(this.game.result());
  }

  private render() {
    const game = this.game;
    const reduce = this.options.reduceFlashing();
    const now = performance.now();
    this.renderer.draw(game, { reduceFlashing: reduce, time: (now - this.born) / 1000 });
    // Your eyelids (and, with Reduce flashing, the soft blur that stands in for black).
    const closure = Math.max(game.blink.closure, game.flutterClosure);
    const veil = Math.max(game.static > 0 ? 1 : 0, game.flickerDark);
    const look = cover(closure, veil, reduce);
    const reach = look.reach * 100;
    this.lids.top.style.transform = `translateY(${reach - 100}%)`;
    this.lids.bottom.style.transform = `translateY(${100 - reach}%)`;
    this.lids.top.style.opacity = this.lids.bottom.style.opacity = String(look.alpha);
    const filter = reduce && (look.blur > 0.1 || look.brightness < 0.99) ? `blur(${look.blur.toFixed(1)}px) brightness(${look.brightness.toFixed(2)})` : "";
    if (filter !== this.filter) {
      this.filter = filter;
      this.canvas.style.filter = filter;
    }
    // Too slow for this device? Drop to one pixel per CSS pixel and no grain.
    if (!this.paused && !this.renderer.low) {
      if (this.lastFrame) this.frames.push(now - this.lastFrame);
      if (this.frames.length >= 120) {
        const avg = this.frames.reduce((s, f) => s + f, 0) / this.frames.length;
        this.frames = [];
        if (avg > 24) {
          this.renderer.low = true;
          this.measure();
        }
      }
    }
    this.lastFrame = this.paused ? 0 : now;
  }

  private publish(force: boolean) {
    const game = this.game;
    if (this.caption && game.tick >= this.caption.until) this.caption = null;
    if (this.stamp && game.tick >= this.stampUntil) this.stamp = null;
    const [, fired] = game.config.credibility;
    const strain = Math.round(game.blink.strain / 4) * 4;
    const clock = clockText(Math.min(HOURS * 60, game.clockMinutes()));
    const danger = game.danger === null ? null : Math.ceil(game.danger / HZ);
    const key = [game.status, clock, game.hour, game.lying, game.camera, game.active.size, danger, strain, this.holding, game.falseThisHour, game.photos, game.photoLeft > 0, this.caption?.key, this.stamp?.key, this.message, this.paused].join("|");
    if (!force && key === this.hudKey) return;
    this.hudKey = key;
    this.hud.set({
      ready: true,
      status: game.status,
      clock,
      hour: game.hour,
      lying: game.lying,
      camera: game.camera,
      cameras: game.cameras,
      active: game.active.size,
      max: game.config.maxActive,
      danger,
      strain,
      holding: this.holding,
      credibility: Math.max(0, fired - game.falseThisHour),
      credibilityOf: fired,
      warned: game.falseThisHour >= game.config.credibility[0],
      photos: game.setup.assist ? null : game.photos,
      photo: game.photoLeft > 0,
      caption: this.caption ? { text: this.caption.text, key: this.caption.key } : null,
      stamp: this.stamp,
      labels: game.labels,
      message: this.message,
    });
  }
}
