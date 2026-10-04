// What every level is built with: the hunt kits (introduced a tool at a time), and `level()`, which adds the
// clean-up star's target time from the bot's run (targets.ts).
import { seconds } from "../core/constants";
import type { HuntKit, LevelDef } from "../core/level";
import { TARGETS } from "./targets";

/** Just your finger (1-01). */
export const TAP: HuntKit = { net: 0, bait: 0, freeze: 0, magnifier: false };
/** + the net (1-02). */
export const NET: HuntKit = { net: 3, bait: 0, freeze: 0, magnifier: false };
/** + the magnifier (1-05). */
export const LENS: HuntKit = { net: 3, bait: 0, freeze: 0, magnifier: true };
/** + freeze (2-01). */
export const COLD: HuntKit = { net: 3, bait: 0, freeze: 1, magnifier: true };
/** + bait (2-03): everything. */
export const FULL_KIT: HuntKit = { net: 3, bait: 1, freeze: 1, magnifier: true };
/** Late levels: a second bait. */
export const BIG_KIT: HuntKit = { net: 3, bait: 2, freeze: 1, magnifier: true };

export function level(def: Omit<LevelDef, "target">): LevelDef {
  return { ...def, target: TARGETS[def.id] ?? seconds(180) };
}
