// One visit to a room (Plan/05-fake-floor.md §2): read the floor, test it, commit, fall, try
// again. A fall restarts the room in under half a second; a safety net puts you back on safe
// ground instead. The visit remembers its falls and pebbles (the Clean and Barefoot medals), and
// the clock only starts when you first move, so looking and testing are free.
// No DOM here: the play screen feeds it one tick of input bits at a time.
import { JUMP, LEFT, RESPAWN_TICKS, RIGHT } from "./constants";
import type { Room } from "./room";
import { createWorld, step, throwPebble, type FallCause, type GameEvent, type World } from "./world";

export type SessionEvent =
  | GameEvent
  /** The first movement of an attempt: its clock starts. */
  | { type: "start" }
  | { type: "respawn" };

export interface SessionOptions {
  /** Assist: pebbles never run out. */
  unlimited?: boolean;
  /** Assist: safety nets under everything. */
  nets?: boolean;
  /** Time trials: the clock runs from the moment you arrive, not from your first step. */
  clockFromStart?: boolean;
}

export class RoomSession {
  world: World;
  /** This visit's falls (safety-net catches count too). */
  falls = 0;
  /** Pebbles thrown this visit. */
  thrown = 0;
  attempts = 1;
  /** What each fall this visit went through. */
  causes: FallCause[] = [];
  /** The current attempt has had a movement input (its clock is running). */
  started = false;
  /** Ticks of the fall left before the room starts again. */
  dying = 0;
  /** Ticks on the clock across the whole visit, falls included (time trials run on this). */
  elapsed = 0;
  /** Stepped onto an untested invisible floor (Leap of Faith). */
  leapt = false;
  /** Hidden pebbles picked up this visit (pickup indexes). */
  hiddenFound: number[] = [];
  private startTick = 0;
  private clockOn: boolean;

  constructor(
    readonly room: Room,
    private options: SessionOptions = {},
  ) {
    this.world = this.newWorld();
    this.clockOn = Boolean(options.clockFromStart);
  }

  private newWorld(): World {
    return createWorld(this.room, { unlimited: this.options.unlimited, nets: this.options.nets });
  }

  get won() {
    return this.world.status === "won";
  }

  /** The current attempt's clock: ticks since its first step (0 before it). */
  get clock(): number {
    return this.started ? this.world.tick - this.startTick : 0;
  }

  /** The winning attempt's time, from its first step to the door (null until you're through). */
  get time(): number | null {
    return this.won ? this.world.tick - this.startTick : null;
  }

  /** One simulation tick with these input bits. */
  tick(bits: number): SessionEvent[] {
    const w = this.world;
    if (w.status === "won") return [];

    if (w.status === "fell") {
      if (this.clockOn) this.elapsed++;
      if (--this.dying > 0) return [];
      this.world = this.newWorld();
      this.started = false;
      this.attempts++;
      return [{ type: "respawn" }];
    }

    const events: SessionEvent[] = [];
    if (!this.started && (bits & (LEFT | RIGHT | JUMP)) !== 0) {
      this.started = true;
      this.startTick = w.tick;
      this.clockOn = true;
      events.push({ type: "start" });
    }
    if (this.clockOn) this.elapsed++;

    step(w, bits);
    for (const e of w.events) {
      if (e.type === "fall") {
        this.falls++;
        this.causes.push(e.cause);
        this.dying = RESPAWN_TICKS;
      } else if (e.type === "net") {
        this.falls++;
        this.causes.push(e.cause);
      } else if (e.type === "leap") this.leapt = true;
      else if (e.type === "pickup" && e.hidden) this.hiddenFound.push(e.index);
    }
    events.push(...w.events);
    return events;
  }

  /** Throw a pebble at a point in the room. Throwing doesn't start the clock. */
  throw(tx: number, ty: number): boolean {
    const ok = throwPebble(this.world, tx, ty);
    if (ok) this.thrown++;
    return ok;
  }

  /** Quick restart (R): the room from the start. Not a fall, but the visit remembers everything. */
  restart() {
    if (this.won) return;
    this.world = this.newWorld();
    this.started = false;
    this.dying = 0;
    this.attempts++;
  }

  /** Assist options, switched mid-room. */
  setAssist({ unlimited, nets }: { unlimited: boolean; nets: boolean }) {
    this.options = { ...this.options, unlimited, nets };
    this.world.unlimited = unlimited;
    this.world.netsEverywhere = nets;
  }
}
