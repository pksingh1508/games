// One visit to a level (Plan/06-trapsprint.md §2): attempt after attempt until you reach the door.
// Instant respawn, a timer that starts on your first input, every attempt's inputs recorded (for
// the ghost and the All-Deaths Replay), and the ghost of your best run alongside you.
// No DOM here: the play screen feeds it one tick of input bits at a time.
import { Player, Recorder, type InputLog } from "@/engine/replay";
import { RESPAWN_TICKS } from "./constants";
import type { Level } from "./level";
import { createWorld, step, type DeathCause, type GameEvent, type World } from "./world";

export interface AttemptRecord {
  log: InputLog;
  /** Deaths before this attempt (the Second-Try trap moves once it's 1 or more). */
  attempt: number;
  /** The checkpoint it started from (-1: the level start). */
  checkpoint: number;
  end: "dead" | "won" | "restart";
  cause: DeathCause | null;
  /** Where it ended (the player's centre). */
  x: number;
  y: number;
  ticks: number;
}

export type SessionEvent =
  | GameEvent
  /** The first input of an attempt: the timer starts. */
  | { type: "start" }
  | { type: "respawn" };

export interface GhostRun {
  log: InputLog;
  /** Deaths before the run (which layout it ran through). */
  attempt: number;
}

export interface SessionOptions {
  /** Race this run's ghost. */
  ghost?: GhostRun | null;
  /** "Your Own Ghost" levels: the path your best run's ghost carries its spike ball along. */
  ghostTrap?: Int16Array | null;
  /** Assist: traps can't hurt you (falling still sends you back). */
  invincible?: boolean;
}

/** Keep the All-Deaths Replay (and memory) reasonable on a level you've died on all evening. */
const MAX_ATTEMPTS = 400;

export class LevelSession {
  world: World;
  deaths = 0;
  attempts: AttemptRecord[] = [];
  /** This attempt has had an input (the clock is running). */
  started = false;
  /** Ticks left of the death animation, before the respawn. */
  dying = 0;
  /** Every tick played, deaths included (zone speedruns run on this). */
  elapsed = 0;
  ghost: World | null = null;
  private ghostInputs: Player | null = null;
  private recorder = new Recorder();
  /** The checkpoint this attempt started from (-1: the level start). */
  private checkpointAtStart = -1;

  constructor(
    readonly level: Level,
    private options: SessionOptions = {},
  ) {
    this.world = this.newWorld(-1);
  }

  get won() {
    return this.world.status === "won";
  }

  /** The finished run's time (null until you win). */
  get time(): number | null {
    return this.won ? this.world.tick : null;
  }

  /** The winning attempt started from a checkpoint (its time can't earn medals). */
  get fromCheckpoint(): boolean {
    return this.attempts.at(-1)?.checkpoint !== -1;
  }

  private newWorld(checkpoint: number): World {
    this.checkpointAtStart = checkpoint;
    const world = createWorld(this.level, { attempt: this.deaths, checkpoint, ghost: this.options.ghostTrap ?? null });
    world.invincible = Boolean(this.options.invincible);
    return world;
  }

  /** One simulation tick with these input bits. */
  tick(bits: number): SessionEvent[] {
    const w = this.world;
    if (w.status === "won") return [];

    if (w.status === "dead") {
      this.elapsed++;
      if (--this.dying > 0) return [];
      this.world = this.newWorld(w.checkpoint);
      this.started = false;
      this.ghost = null;
      return [{ type: "respawn" }];
    }

    // The clock (and every trap) waits for your first input.
    const events: SessionEvent[] = [];
    if (!this.started) {
      if (bits === 0) return events;
      this.started = true;
      this.startGhost();
      events.push({ type: "start" });
    }

    this.elapsed++;
    this.recorder.push(bits);
    step(w, bits);
    events.push(...w.events);
    this.stepGhost();

    // (Read again: the step may have ended the attempt.)
    const end = this.world.status;
    if (end === "dead") {
      this.deaths++;
      this.dying = RESPAWN_TICKS;
      this.record("dead");
    } else if (end === "won") {
      this.record("won");
    }
    return events;
  }

  /** Assist's invincibility, switched mid-level. */
  setInvincible(on: boolean) {
    this.options = { ...this.options, invincible: on };
    this.world.invincible = on;
  }

  /** Quick restart: back to the level start. Not a death (the Second-Try trap stays put). */
  restart() {
    if (this.won) return;
    if (this.started && this.world.status === "play") this.record("restart");
    this.recorder.reset();
    this.world = this.newWorld(-1);
    this.started = false;
    this.dying = 0;
    this.ghost = null;
  }

  private record(end: AttemptRecord["end"]) {
    const w = this.world;
    this.attempts.push({
      log: this.recorder.snapshot(),
      attempt: w.attempt,
      checkpoint: this.checkpointAtStart,
      end,
      cause: w.cause,
      x: Math.round(w.p.x + w.p.w / 2),
      y: Math.round(w.p.y + w.p.h / 2),
      ticks: w.tick,
    });
    if (this.attempts.length > MAX_ATTEMPTS) this.attempts.splice(0, this.attempts.length - MAX_ATTEMPTS);
    this.recorder.reset();
  }

  private startGhost() {
    const run = this.options.ghost;
    if (!run || this.world.checkpoint >= 0) return;
    this.ghost = createWorld(this.level, { attempt: run.attempt });
    this.ghostInputs = new Player(run.log);
  }

  private stepGhost() {
    if (!this.ghost || !this.ghostInputs) return;
    const bits = this.ghostInputs.next();
    if (bits === null || this.ghost.status !== "play") {
      // Through the door (or off the end of its recording): gone.
      this.ghost = null;
      return;
    }
    step(this.ghost, bits);
  }
}
