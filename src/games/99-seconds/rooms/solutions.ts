// Each chapter's golden path (Plan/03-99-seconds.md §10 rule 1, §12 "Testing the puzzles"): what someone who knows
// the solution does in one loop. It's split by goal, so the tests' hint-reader can play the parts it has learned
// (from the room's scratches) and nothing else. The tests check every path escapes in a single loop with at least
// 24 seconds of room to breathe.
import type { Step } from "../core/script";
import type { ChapterId } from "../core/types";

export interface Segment {
  /** The goal this part of the path needs you to know. */
  goal: string;
  steps: readonly Step[];
}

export const SOLUTIONS: Record<ChapterId, readonly Segment[]> = {
  "waiting-room": [
    // 0742 (42 behind the photo, 07 on the clock at 42), and through the door…
    { goal: "door", steps: [{ tap: "keypad" }, { code: "0742" }, { tap: "doorway" }] },
    // …into the mirrored room. Pull the lever with ten seconds left, stand in the doorway, and wait for zero.
    { goal: "escape", steps: [{ look: "north" }, { waitLeft: 9.5 }, { tap: "lever" }, { tap: "doorway" }] },
  ],
  kitchen: [
    // Fill the pot, take the mitt, light the hob.
    { goal: "boil", steps: [{ tap: "stove" }, { tap: "pot" }, { look: "west" }, { tap: "sink", use: "pot" }, { tap: "cupboard" }, { tap: "mitt" }, { look: "north" }, { tap: "stove", use: "water" }, { tap: "stove" }, { tap: "knob" }, { look: "south" }] },
    // The ice in the oven, door shut, oven on (from the oven's close-up, where you can't see the pot).
    { goal: "key", steps: [{ look: "east" }, { tap: "freezer" }, { tap: "ice" }, { look: "north" }, { tap: "oven" }, { tap: "ovendoor" }, { tap: "tray", use: "ice" }, { tap: "ovenshut" }, { tap: "dial" }, { look: "south" }] },
    // Thirty seconds later, the key (with the mitt).
    { goal: "key", steps: [{ waitFlag: "key.inOven" }, { look: "north" }, { tap: "oven" }, { tap: "ovendoor" }, { tap: "tray", use: "mitt" }, { look: "south" }] },
    // When it boils, the pot (with the mitt), then the wax, the lock and the hatch.
    { goal: "boil", steps: [{ waitFlag: "pot.boiling" }, { look: "north" }, { tap: "stove" }, { tap: "pot", use: "mitt" }] },
    { goal: "down", steps: [{ look: "south" }, { tap: "hatch" }, { tap: "wax", use: "boiling" }, { tap: "keyhole", use: "key" }, { tap: "handle" }] },
  ],
  "clock-room": [
    // The key, and the notes (write what you read), while the little clock sleeps.
    { goal: "wind", steps: [{ look: "east" }, { tap: "key" }] },
    { goal: "door", steps: [{ look: "west" }, { tap: "notepad" }, { tap: "write-clock" }, { tap: "write-oven" }, { tap: "write-zero" }] },
    // It lands on top of the big clock at 70: catch it, wind it, fit it.
    { goal: "catch", steps: [{ look: "north" }, { waitFlag: "perch.north" }, { tap: "perch-north" }] },
    { goal: "wind", steps: [{ tap: "item:flyer", use: "key" }, { look: "east" }, { tap: "axle", use: "wound" }] },
    // The crank puts the hand on 100.
    { goal: "hundred", steps: [{ look: "north" }, { tap: "crank" }] },
    // The hundredth second: the door behind the pendulum.
    { goal: "door", steps: [{ look: "south" }, { waitExtra: true }, { tap: "door100" }] },
  ],
};

export const goldenPath = (chapter: ChapterId): Step[] => SOLUTIONS[chapter].flatMap((s) => s.steps);
