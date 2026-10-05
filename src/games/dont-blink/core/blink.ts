// Your eyelids (Plan/14-dont-blink.md §3 "Blinking", §12 "Blink state machine"): OPEN → CLOSING → CLOSED →
// OPENING. They blink by themselves every few seconds; holding them open delays the next blink and strains
// them, and at full strain they give up for a long blink. Pure: the game steps it once a tick.
import { BLINK_CLOSED, BLINK_CLOSING, BLINK_OPENING, HZ, LONG_BLINK, STRAIN_RECOVER_SECONDS, STRAIN_SECONDS } from "./constants";

export type BlinkPhase = "open" | "closing" | "closed" | "opening";

export interface BlinkStep {
  /** The eyes have just finished closing (the one tick changes may be made, for this blink). */
  shut: boolean;
  /** A long blink (strain gave out). */
  long: boolean;
  /** They've just opened again. */
  opened: boolean;
}

export class Blink {
  phase: BlinkPhase = "open";
  /** Ticks into the phase. */
  t = 0;
  /** How long this blink stays shut. */
  private hold: number = BLINK_CLOSED;
  /** Ticks until the next blink (counting down only while not holding them open). */
  next: number;
  /** Eye strain, 0–100. */
  strain = 0;
  /** Seconds the eyes were held open (for Iron Eyes). */
  heldTicks = 0;
  long = false;

  constructor(
    private readonly interval: () => number,
    first?: number,
  ) {
    this.next = first ?? interval();
  }

  /** 0 open, 1 shut: how far the lids have come down. */
  get closure(): number {
    switch (this.phase) {
      case "open":
        return 0;
      case "closing":
        // Only fully shut once they're closed (that's when changes happen).
        return (this.t + 1) / (BLINK_CLOSING + 1);
      case "closed":
        return 1;
      case "opening":
        return Math.max(0, 1 - (this.t + 1) / BLINK_OPENING);
    }
  }

  get shut(): boolean {
    return this.phase === "closed";
  }

  /** Blink now (a forced blink: strain giving out, or a blink coming due). */
  private start(long: boolean) {
    this.phase = "closing";
    this.t = 0;
    this.long = long;
    this.hold = long ? LONG_BLINK : BLINK_CLOSED;
  }

  /** One tick. `holding`: the player's holding their eyes open. */
  step(holding: boolean): BlinkStep {
    const out: BlinkStep = { shut: false, long: false, opened: false };
    const strainUp = 100 / (STRAIN_SECONDS * HZ);
    const strainDown = 100 / (STRAIN_RECOVER_SECONDS * HZ);
    if (this.phase === "open") {
      if (holding) {
        this.heldTicks++;
        this.strain = Math.min(100, this.strain + strainUp);
        if (this.strain >= 100) this.start(true);
      } else {
        this.strain = Math.max(0, this.strain - strainDown);
        this.next--;
        if (this.next <= 0) this.start(false);
      }
      return out;
    }
    this.t++;
    if (this.phase === "closing" && this.t >= BLINK_CLOSING) {
      this.phase = "closed";
      this.t = 0;
      out.shut = true;
      out.long = this.long;
    } else if (this.phase === "closed" && this.t >= this.hold) {
      this.phase = "opening";
      this.t = 0;
    } else if (this.phase === "opening" && this.t >= BLINK_OPENING) {
      this.phase = "open";
      this.t = 0;
      out.opened = true;
      // A long blink rests the eyes; a normal one helps a little.
      this.strain = this.long ? 25 : Math.max(0, this.strain - 10);
      this.long = false;
      this.next = this.interval();
    }
    return out;
  }
}
