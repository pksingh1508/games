// The narrator (Plan/01-one-more-step.md §1, §4): it always says "one more step". Early on, it's telling the
// truth. In World 5 it lies, and when it does, its speech bubble's tail points away from you. In the finale
// it gets smug, then desperate. Each level has its own lines; these fill the gaps.
import { manhattan, type Cause, type GameEvent, type LevelDef, type State } from "../engine/types";

export interface Said {
  text: string;
  /** It isn't true (the tail points away). */
  lie: boolean;
  /** A new line each time (so the bubble can pop again, even with the same words). */
  key: number;
}

const DEATHS: Record<Cause, string[]> = {
  spikes: ["Spikes are pointy. Noted.", "Ouch.", "Those were up."],
  hole: ["Mind the gap.", "Down you go.", "That was a hole."],
  echo: ["That was you. Well, earlier you.", "Don't walk into yourself."],
  sentinel: ["Stone beats blob.", "It caught you."],
  door: ["The door slammed. On you.", "That one's angry."],
  twin: ["Your twin! Noooo.", "One of you fell."],
};
const RUNS = ["…did the door just move?", "There it goes.", "It's shy.", "Rude."];
const UNDOS = ["Taking it back? Bold.", "Rewind.", "Let's pretend that didn't happen.", "Undo. Again.", "Bold."];
// Smugger each time ("#" is the level it says this is); after the last, the last three go round.
const RESETS = ["Level 6-#! One more step!", "6-#. You're doing great!", "6-#. Any minute now.", "6-#. One more step!", "6-#. Still one more step.", "6-#. This is fun. Isn't it?", "6-#. One. More. Step.", "6-#. I could do this all day.", "6-#. Can you?"];
const BEGS: Record<number, string> = { 2: "…", 3: "Step?", 4: "…Step?", 5: "Come on.", 6: "Please?", 7: "Pretty please?", 8: "Just one?", 9: "Fine." };

export class Narrator {
  private key = 0;
  private counts = { run: 0, undo: 0, death: 0 };
  private ranThisTry = false;
  private resets = 0;

  constructor(private readonly level: LevelDef) {}

  private say(text: string, lie = false): Said {
    return { text, lie, key: ++this.key };
  }

  private line(at: string | number) {
    return this.level.narrator?.find((n) => n.at === at);
  }

  start(): Said {
    this.ranThisTry = false;
    const l = this.line("start");
    return this.say(l?.text ?? "One more step!", l?.lie);
  }

  /** What it says after a step (or nothing new). */
  after(prev: State, next: State, events: readonly GameEvent[]): Said | null {
    const finale = this.level.door === "finale";
    if (finale && next.status === "play") {
      if (next.coming && !prev.coming) return this.say("Oh.");
      const beg = BEGS[next.waits];
      if (beg) return this.say(beg);
      return null;
    }
    if (finale && next.status === "won") return this.say("Sometimes the best step is no step.");
    const die = events.find((e) => e.type === "die");
    if (die && die.type === "die") {
      const own = this.line("death");
      const pool = DEATHS[die.cause];
      return this.say(own?.text ?? pool[this.counts.death++ % pool.length]!);
    }
    if (events.some((e) => e.type === "win")) {
      const fall = events.some((e) => e.type === "fall") ? this.line("fall") : null;
      return this.say(fall?.text ?? (next.tick <= 3 ? "Gotcha." : "Caught it!"));
    }
    const timed = this.line(next.tick);
    if (timed) return this.say(timed.text, timed.lie);
    if (events.some((e) => e.type === "reveal")) return this.say("Oh. There it is.");
    if (events.some((e) => e.type === "cornered")) {
      const own = this.line("cornered");
      return this.say(own?.text ?? "It's cornered. One more step!");
    }
    const ran = events.find((e) => e.type === "door" && e.first);
    if (ran && !this.ranThisTry) {
      this.ranThisTry = true;
      const own = this.line("run");
      return this.say(own?.text ?? RUNS[this.counts.run++ % RUNS.length]!);
    }
    // The truth (outside World 5): you really are one step away.
    const door = next.doors[0];
    if (door && this.level.world < 5 && manhattan(door, next.player) === 1 && this.level.door !== "brave") return this.say("One more step!");
    if (events.some((e) => e.type === "plate" && e.down) && this.line("plate")) return this.say(this.line("plate")!.text);
    return null;
  }

  undo(): Said {
    const own = this.line("undo");
    return this.say(own?.text ?? UNDOS[this.counts.undo++ % UNDOS.length]!);
  }

  /** The finale: you stepped onto the door, and it's "the next level" (6-`sub`). */
  reset(sub: number): Said {
    this.ranThisTry = false;
    const k = this.resets++;
    const line = k < RESETS.length ? RESETS[k]! : RESETS[RESETS.length - 3 + ((k - RESETS.length) % 3)]!;
    return this.say(line.replace("#", String(sub)));
  }

  restarted(): Said {
    return this.start();
  }
}
