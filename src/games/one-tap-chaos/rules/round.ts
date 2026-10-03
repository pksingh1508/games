// A round = one microgame scene wrapped in the active rules (Plan/09-one-tap-chaos.md §12,
// "Chaos rules as wrappers"). The wrapper decides how presses become actions (Lag, Double Tap)
// and how the round is judged (Red Means No and Simon Says can make it a "don't tap" trap).
// Opposite Day, Silent, Mirror and Lights Out work on the scene's context and the display.
import { DOUBLE_TAP_SECONDS, LAG_BEATS } from "../core/timing";
import type { Microgame, Outcome, Scene } from "../microgames/types";
import type { RuleId } from ".";

export interface RoundFlags {
  rules: RuleId[];
  /** Red Means No: the instruction is shown in red, with ✖ stripes. */
  red: boolean;
  /** Simon Says: with the crown (true) or an empty crown slot (false). Null without Simon. */
  crown: boolean | null;
}

export const NO_RULES: RoundFlags = { rules: [], red: false, crown: null };

/** A red instruction (Red Means No) or a missing crown (Simon Says): the right answer is no tap. */
export function isTrap(flags: RoundFlags): boolean {
  return (flags.red && flags.rules.includes("redMeansNo")) || (flags.crown === false && flags.rules.includes("simonSays"));
}

/** Whether this round is won by not tapping at all (for Self Control, and the HUD). */
export function wantsNoTap(game: Pick<Microgame<string>, "refrain" | "invertedRefrain">, flags: RoundFlags): boolean {
  if (isTrap(flags)) return true;
  return flags.rules.includes("opposite") ? Boolean(game.invertedRefrain) : game.refrain;
}

export type PressResult = "action" | "delayed" | "first";

export class Round {
  readonly trap: boolean;
  /** When a trap round was lost by tapping. */
  sprungAt: number | null = null;
  actions = 0;
  private readonly lag: number;
  private readonly pairBeats: number | null;
  private pairStart: number | null = null;
  private queue: Array<{ at: number; kind: "tap" | "release" }> = [];

  constructor(
    readonly scene: Scene,
    readonly flags: RoundFlags,
    bpm: number,
  ) {
    this.trap = isTrap(flags);
    this.lag = flags.rules.includes("lag") ? LAG_BEATS : 0;
    this.pairBeats = flags.rules.includes("doubleTap") ? DOUBLE_TAP_SECONDS * (bpm / 60) : null;
  }

  /** The player pressed at beat `b`. */
  press(b: number): PressResult {
    if (this.pairBeats !== null) {
      if (this.pairStart !== null && b - this.pairStart <= this.pairBeats) {
        this.pairStart = null;
      } else {
        this.pairStart = b;
        return "first";
      }
    }
    if (this.lag > 0) {
      this.queue.push({ at: b + this.lag, kind: "tap" });
      return "delayed";
    }
    this.deliver(b, "tap");
    return "action";
  }

  /** The finger came off (only hold mode cares). */
  release(b: number) {
    if (this.lag > 0) this.queue.push({ at: b + this.lag, kind: "release" });
    else this.deliver(b, "release");
  }

  /** Advance to beat `b`, landing any late (lagged) actions on the way. */
  update(b: number) {
    while (this.queue.length && this.queue[0]!.at <= b) {
      const next = this.queue.shift()!;
      this.deliver(next.at, next.kind);
    }
    this.scene.update(b);
  }

  /** Lagged actions still on their way (for the HUD). */
  get inFlight() {
    return this.queue.filter((e) => e.kind === "tap").length;
  }

  /** Waiting for the second tap of a Double Tap. */
  get halfPressed() {
    return this.pairStart !== null;
  }

  outcome(final: boolean): Outcome {
    if (this.trap) return this.sprungAt !== null ? "lose" : final ? "win" : "pending";
    return this.scene.outcome(final);
  }

  private deliver(at: number, kind: "tap" | "release") {
    this.scene.update(at);
    if (kind === "release") {
      this.scene.release?.(at);
      return;
    }
    this.actions++;
    if (this.trap && this.sprungAt === null) this.sprungAt = at;
    this.scene.tap(at);
  }
}
