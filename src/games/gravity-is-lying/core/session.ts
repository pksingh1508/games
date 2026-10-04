// One visit to a room (Plan/15-gravity-is-lying.md §2): work out which way is really down, move,
// switch, flip; spikes or the edge of the room start it again almost at once. Golden apples, once
// picked up, stay picked up for the visit (a death doesn't take them back). The clock only starts
// when you first move, so looking is free. No DOM here: the play screen feeds it a tick at a time.
import { FLIP, JUMP, LEFT, RESTART_TICKS, RIGHT } from "./constants";
import type { Room } from "./room";
import { createWorld, step, type World, type WorldEvent } from "./world";

export type SessionEvent =
  | WorldEvent
  /** The first movement of an attempt: its clock starts. */
  | { type: "start" }
  | { type: "respawn" };

export interface SessionOptions {
  /** Assist: nothing kills you (a death puts you back where you last stood). */
  invincible?: boolean;
}

export class RoomSession {
  world: World;
  /** This visit's deaths (safety-net catches count too). */
  deaths = 0;
  attempts = 1;
  /** Golden apples picked up this visit (bitmask; they stay picked up across attempts). */
  apples = 0;
  /** The current attempt has had a movement input (its clock is running). */
  started = false;
  /** Ticks left before the room starts again after a death. */
  dying = 0;
  /** Ticks across the whole visit, deaths included. */
  elapsed = 0;
  /** Ticks standing on ceilings this visit. */
  ceilingTicks = 0;
  /** Landed on three planets in a row. */
  orbital = false;
  private startTick = 0;

  constructor(
    readonly room: Room,
    private options: SessionOptions = {},
  ) {
    this.world = this.newWorld();
  }

  private newWorld(): World {
    const w = createWorld(this.room);
    w.netsEverywhere = Boolean(this.options.invincible);
    // Apples already found this visit stay found.
    w.apples = this.apples;
    return w;
  }

  get won() {
    return this.world.status === "won";
  }

  /** The current attempt's clock: ticks since its first movement (0 before it). */
  get clock(): number {
    return this.started ? this.world.tick - this.startTick : 0;
  }

  /** The winning attempt's time, from its first movement to the portal (null until then). */
  get time(): number | null {
    return this.won ? this.world.tick - this.startTick : null;
  }

  tick(bits: number): SessionEvent[] {
    const w = this.world;
    if (w.status === "won") return [];
    this.elapsed++;

    if (w.status === "dead") {
      if (--this.dying > 0) return [];
      this.world = this.newWorld();
      this.started = false;
      this.attempts++;
      return [{ type: "respawn" }];
    }

    const events: SessionEvent[] = [];
    if (!this.started && (bits & (LEFT | RIGHT | JUMP | FLIP)) !== 0) {
      this.started = true;
      this.startTick = w.tick;
      events.push({ type: "start" });
    }
    const ceilingBefore = w.ceilingTicks;
    const out = step(w, bits);
    this.ceilingTicks += w.ceilingTicks - ceilingBefore;
    for (const e of out) {
      if (e.type === "death") {
        this.deaths++;
        this.dying = RESTART_TICKS;
      } else if (e.type === "net") this.deaths++;
      else if (e.type === "apple") this.apples |= 1 << e.index;
      else if (e.type === "orbital") this.orbital = true;
    }
    events.push(...out);
    return events;
  }

  /** Quick restart (R): the room from the start. Not a death; the visit remembers everything. */
  restart() {
    if (this.won) return;
    this.world = this.newWorld();
    this.started = false;
    this.dying = 0;
    this.attempts++;
  }

  setAssist({ invincible }: { invincible: boolean }) {
    this.options = { ...this.options, invincible };
    this.world.netsEverywhere = invincible;
  }
}
