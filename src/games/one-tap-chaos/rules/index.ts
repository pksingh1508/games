// The eight Chaos Cards (Plan/09-one-tap-chaos.md §3). Each one changes how taps are read, how a
// round is judged, or how it's shown, so rules combine without rewriting any microgame.
import type { Microgame } from "../microgames/types";

export type RuleId = "opposite" | "redMeansNo" | "simonSays" | "lag" | "doubleTap" | "silent" | "mirror" | "lightsOut";

export interface ChaosRule {
  id: RuleId;
  name: string;
  /** The HUD badge. */
  short: string;
  /** What the card says when it flips. */
  description: string;
  /** Which microgames can appear while this rule is active. */
  allows(game: Pick<Microgame<string>, "id" | "invertible">): boolean;
}

/** The order the cards unlock in: each one the first time you reach its slot in a run. */
export const CARD_ORDER: RuleId[] = ["opposite", "redMeansNo", "simonSays", "lag", "doubleTap", "silent", "mirror", "lightsOut"];

/** Too many taps (PUMP!) or a rhythm (BEAT!) don't work as double taps. */
const NOT_DOUBLE = new Set(["pump", "beat"]);

export const RULES: Record<RuleId, ChaosRule> = {
  opposite: {
    id: "opposite",
    name: "Opposite Day",
    short: "OPPOSITE",
    description: "Do the opposite. DON'T means tap, SHOOT means hold your fire.",
    allows: (game) => game.invertible,
  },
  redMeansNo: {
    id: "redMeansNo",
    name: "Red Means No",
    short: "RED = NO",
    description: "An instruction in red (with ✖ stripes) means: don't tap at all.",
    allows: () => true,
  },
  simonSays: {
    id: "simonSays",
    name: "Simon Says",
    short: "SIMON",
    description: "Only instructions with a crown count. No crown: don't tap.",
    allows: () => true,
  },
  lag: {
    id: "lag",
    name: "Lag",
    short: "LAG +½",
    description: "Your taps land half a beat late. Tap early!",
    allows: () => true,
  },
  doubleTap: {
    id: "doubleTap",
    name: "Double Tap",
    short: "×2 TAP",
    description: "Every action needs two quick taps. One tap does nothing.",
    allows: (game) => !NOT_DOUBLE.has(game.id),
  },
  silent: {
    id: "silent",
    name: "Silent",
    short: "SILENT",
    description: "No words. Just a picture and a sound.",
    allows: () => true,
  },
  mirror: {
    id: "mirror",
    name: "Mirror",
    short: "MIRROR",
    description: "Everything is flipped left to right. Even the words.",
    allows: () => true,
  },
  lightsOut: {
    id: "lightsOut",
    name: "Lights Out",
    short: "LIGHTS OUT",
    description: "The lights go out on beats 3 and 6. Remember what you saw.",
    allows: () => true,
  },
};

/**
 * Rules that would contradict each other (Plan §10.8). Red Means No and Simon Says both say
 * "don't tap"; Opposite Day would flip that into "tap", so they never share a round.
 */
const CLASHES: ReadonlyArray<readonly [RuleId, RuleId]> = [
  ["opposite", "redMeansNo"],
  ["opposite", "simonSays"],
];

export function compatible(a: RuleId, b: RuleId): boolean {
  if (a === b) return false;
  return !CLASHES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Every microgame that may appear under all of these rules. */
export function allowedUnder<G extends Pick<Microgame<string>, "id" | "invertible">>(games: G[], rules: RuleId[]): G[] {
  return games.filter((game) => rules.every((rule) => RULES[rule].allows(game)));
}

/** Lights Out darkens beats 3 and 6 (beat 1 is the first). */
export const DARK_BEATS: ReadonlyArray<readonly [number, number]> = [
  [2, 3],
  [5, 6],
];
