// A visit to a level (Plan/12-cursor-escape.md §2): crash and it starts again at once (after a beat to
// see where you hit), counting crashes; escape and the time is yours. Also counts what the trophies
// need: turned sections survived (Ambidextrous), finding yourself among the decoys (Identity Crisis).
import { CRASH_TICKS } from "./constants";
import { World, type Course, type Input, type SimEvent, type WorldOptions } from "./sim";

export class Session {
  world: World;
  crashes = 0;
  attempts = 1;
  /** Ticks since the crash (the level restarts after CRASH_TICKS). */
  private crashedFor = 0;
  /** The winning time (ticks from the first move). */
  time: number | null = null;
  /** Inverted or rotated stretches got through without crashing (Ambidextrous). */
  turnedClean = 0;
  /** Found yourself among the decoys within a second (Identity Crisis). */
  found = false;
  /** Ticks played, crashes and all. */
  elapsed = 0;

  constructor(
    readonly course: Course,
    readonly options: WorldOptions = {},
  ) {
    this.world = new World(course, options);
  }

  get crashed() {
    return this.world.status === "crashed";
  }

  get won() {
    return this.world.status === "won";
  }

  step(input: Input): readonly SimEvent[] {
    if (this.won) return [];
    if (this.crashed) {
      if (++this.crashedFor >= CRASH_TICKS) this.restart();
      return [];
    }
    if (this.world.status === "run") this.elapsed++;
    const events = this.world.step(input);
    for (const e of events) {
      if (e.type === "end" && (e.effect.type === "invert" || e.effect.type === "rotate")) this.turnedClean++;
      else if (e.type === "found") this.found = true;
      else if (e.type === "crash") {
        this.crashes++;
        this.crashedFor = 0;
      } else if (e.type === "win") this.time = this.world.tick;
    }
    return events;
  }

  /** Back to the start (a crash, or R). */
  restart() {
    this.world = new World(this.course, this.options);
    this.attempts++;
    this.crashedFor = 0;
  }
}
