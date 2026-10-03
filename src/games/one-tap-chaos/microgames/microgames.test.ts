// Plan/09-one-tap-chaos.md §14: every microgame is winnable by its bot at top speed under every
// allowed rule combination, and no rule combination can make a microgame impossible.
import { describe, expect, it } from "vitest";
import { botPresses, makeContext, simulate, type RoundSetup } from "../bots/harness";
import { TIERS, windowBeats } from "../core/timing";
import { allowedUnder, CARD_ORDER, compatible, type RuleId } from "../rules";
import { NO_RULES, wantsNoTap, type RoundFlags } from "../rules/round";
import { BOSSES, MICROGAMES, MICROGAME_IDS } from ".";
import type { Microgame, View } from "./types";

const TOP = TIERS[4];
const SEEDS = Array.from({ length: 12 }, (_, i) => `seed-${i}`);
const games = MICROGAME_IDS.map((id) => MICROGAMES[id] as Microgame<string>);
const bosses = Object.values(BOSSES) as Array<Microgame<string>>;

/** Every way a set of rules can show up (red or not, crowned or not). */
function flagVariants(rules: RuleId[]): RoundFlags[] {
  const reds = rules.includes("redMeansNo") ? [false, true] : [false];
  const crowns = rules.includes("simonSays") ? [true, false] : [null];
  return reds.flatMap((red) => crowns.map((crown) => ({ rules, red, crown })));
}

const RULE_SETS: RuleId[][] = [
  ...CARD_ORDER.map((r) => [r]),
  ...CARD_ORDER.flatMap((a, i) => CARD_ORDER.slice(i + 1).filter((b) => compatible(a, b)).map((b) => [a, b])),
];

const label = (flags: RoundFlags) =>
  [flags.rules.join("+") || "none", flags.red ? "red" : "", flags.crown === false ? "no-crown" : ""].filter(Boolean).join(" ");

describe("every microgame, played by its bot", () => {
  for (const game of games) {
    it(`${game.id}: wins at every tempo and difficulty`, () => {
      for (const bpm of TIERS) {
        for (const difficulty of [0, 0.5, 1]) {
          for (const seed of SEEDS) {
            const { outcome } = simulate({ game, bpm, difficulty, seed, flags: NO_RULES });
            expect(outcome, `${game.id} @${bpm} d${difficulty} ${seed}`).toBe("win");
          }
        }
      }
    });

    it(`${game.id}: wins at top speed under every rule and pair of rules it allows`, () => {
      for (const rules of RULE_SETS) {
        if (!allowedUnder([game], rules).length) continue;
        for (const flags of flagVariants(rules)) {
          for (const seed of SEEDS.slice(0, 6)) {
            const { outcome } = simulate({ game, bpm: TOP, difficulty: 1, seed, flags });
            expect(outcome, `${game.id} [${label(flags)}] ${seed}`).toBe("win");
          }
        }
      }
    });

    it(`${game.id}: still wins when input arrives a frame late, or a little early or late`, () => {
      for (const seed of SEEDS) {
        const setup: RoundSetup = { game, bpm: TOP, difficulty: 1, seed, flags: NO_RULES };
        expect(simulate(setup, { late: true, frame: 1 / 22 }).outcome, `${game.id} late ${seed}`).toBe("win");
        // Inside the timing window, early or late, still a win (±60 ms at top speed).
        const w = windowBeats(1, TOP) * 0.7;
        expect(simulate(setup, { shift: -w }).outcome, `${game.id} early ${seed}`).toBe("win");
        expect(simulate(setup, { shift: w }).outcome, `${game.id} late-ish ${seed}`).toBe("win");
      }
    });
  }
});

describe("doing nothing", () => {
  it("loses the tap microgames and wins the don't-tap ones", () => {
    for (const game of games) {
      for (const seed of SEEDS.slice(0, 4)) {
        const { outcome } = simulate({ game, bpm: TIERS[0], difficulty: 0, seed, flags: NO_RULES }, { presses: [] });
        expect(outcome, game.id).toBe(wantsNoTap(game, NO_RULES) ? "win" : "lose");
      }
    }
  });

  it("flips on Opposite Day", () => {
    const opposite: RoundFlags = { rules: ["opposite"], red: false, crown: null };
    for (const game of games.filter((g) => g.invertible)) {
      const { outcome } = simulate({ game, bpm: TIERS[0], difficulty: 0, seed: 1, flags: opposite }, { presses: [] });
      expect(outcome, game.id).toBe(wantsNoTap(game, opposite) ? "win" : "lose");
    }
  });

  it("wins every trap round (red, or no crown)", () => {
    for (const flags of [
      { rules: ["redMeansNo"], red: true, crown: null },
      { rules: ["simonSays"], red: false, crown: false },
    ] as RoundFlags[]) {
      for (const game of games) {
        expect(simulate({ game, bpm: TOP, difficulty: 1, seed: 3, flags }, { presses: [] }).outcome, game.id).toBe("win");
      }
    }
  });
});

describe("button mashing", () => {
  const mash = Array.from({ length: 40 }, (_, i) => 0.05 + i * 0.2);
  const oneShot = ["stop", "shoot", "flip", "wait", "snap", "kick", "high-five", "bigger", "match", "swat", "dont", "sleep", "loading", "beat", "count"];
  it("loses the one-shot microgames", () => {
    for (const id of oneShot) {
      const game = MICROGAMES[id as keyof typeof MICROGAMES] as Microgame<string>;
      for (const seed of SEEDS.slice(0, 4)) {
        expect(simulate({ game, bpm: TIERS[2], difficulty: 0.5, seed, flags: NO_RULES }, { presses: mash }).outcome, id).toBe("lose");
      }
    }
  });

  it("loses any trap round", () => {
    const flags: RoundFlags = { rules: ["redMeansNo"], red: true, crown: null };
    for (const game of games) expect(simulate({ game, bpm: TOP, difficulty: 1, seed: 9, flags }, { presses: [2] }).outcome, game.id).toBe("lose");
  });
});

describe("the bosses", () => {
  for (const boss of bosses) {
    it(`${boss.id}: the bot wins at every tempo`, () => {
      for (const bpm of TIERS) {
        for (const seed of SEEDS) {
          expect(simulate({ game: boss, bpm, difficulty: 1, seed, flags: NO_RULES, beats: 16 }).outcome, `${boss.id} @${bpm} ${seed}`).toBe("win");
        }
      }
    });

    it(`${boss.id}: doing nothing or mashing loses`, () => {
      for (const seed of SEEDS.slice(0, 6)) {
        const setup: RoundSetup = { game: boss, bpm: TIERS[2], difficulty: 0.5, seed, flags: NO_RULES, beats: 16 };
        expect(simulate(setup, { presses: [] }).outcome).toBe("lose");
        expect(simulate(setup, { presses: Array.from({ length: 64 }, (_, i) => i * 0.25) }).outcome).toBe("lose");
      }
    });
  }
});

describe("details", () => {
  it("PUMP! hold mode: hold to the line, let go, win", () => {
    for (const seed of SEEDS) {
      const ctx = makeContext({ game: MICROGAMES.pump, bpm: TOP, difficulty: 1, seed, flags: NO_RULES, holdMode: true });
      const scene = MICROGAMES.pump.create(ctx);
      const taps = scene.plan().length;
      // The bot's taps reach the line; holding for the same amount of pumping does too.
      const holdFor = (taps * 0.1 - 0.02) / 0.42;
      for (let t = 0; t <= 1.4; t += 0.02) scene.update(t);
      scene.tap(1.4);
      for (let t = 1.4; t <= 1.4 + holdFor; t += 0.02) scene.update(t);
      scene.release!(1.4 + holdFor);
      scene.update(8);
      expect(scene.outcome(true), seed).toBe("win");
    }
  });

  it("??? borrows a microgame that needs no words, the same one for the same seed", () => {
    const a = simulate({ game: MICROGAMES.mystery, bpm: 130, difficulty: 0.5, seed: "m1", flags: NO_RULES });
    const b = simulate({ game: MICROGAMES.mystery, bpm: 130, difficulty: 0.5, seed: "m1", flags: NO_RULES });
    expect(a.presses).toEqual(b.presses);
    expect(a.outcome).toBe("win");
  });

  it("LOADING… turns into DON'T on the last beat", () => {
    const scene = MICROGAMES.loading.create(makeContext({ game: MICROGAMES.loading, bpm: 100, difficulty: 0, seed: 1, flags: NO_RULES }));
    expect(scene.label?.(3)).toBeNull();
    expect(scene.label?.(7.2)?.text).toBe("…DON'T.");
  });

  it("Lag and Double Tap change the presses, not the plan", () => {
    expect(botPresses([3], { rules: ["lag"], red: false, crown: null }, 100)).toEqual([2.5]);
    const pair = botPresses([3], { rules: ["doubleTap"], red: false, crown: null }, 160);
    expect(pair).toHaveLength(2);
    expect(pair[1]).toBe(3);
    expect(3 - pair[0]!).toBeLessThanOrEqual(0.25 * (160 / 60));
  });

  it("a single tap under Double Tap does nothing", () => {
    const flags: RoundFlags = { rules: ["doubleTap"], red: false, crown: null };
    // DON'T! survives one stray tap, but not a double one.
    expect(simulate({ game: MICROGAMES.dont, bpm: 130, difficulty: 0, seed: 2, flags }, { presses: [3] }).outcome).toBe("win");
    expect(simulate({ game: MICROGAMES.dont, bpm: 130, difficulty: 0, seed: 2, flags }, { presses: [3, 3.1] }).outcome).toBe("lose");
  });
});

// ---------------------------------------------------------------------------------------------
// Drawing: every scene draws without errors, on a canvas stand-in that rejects what a real canvas
// would (negative radii, NaN coordinates).
// ---------------------------------------------------------------------------------------------

function strictCanvas(): CanvasRenderingContext2D {
  const state: Record<string, unknown> = {};
  const finite = (name: string, args: unknown[]) => {
    for (const a of args) if (typeof a === "number" && !Number.isFinite(a)) throw new Error(`${name}: non-finite argument`);
  };
  const methods: Record<string, (...args: never[]) => unknown> = {
    arc: (...a: number[]) => {
      finite("arc", a);
      if (a[2]! < 0) throw new Error("arc: negative radius");
    },
    ellipse: (...a: number[]) => {
      finite("ellipse", a);
      if (a[2]! < 0 || a[3]! < 0) throw new Error("ellipse: negative radius");
    },
    roundRect: (...a: number[]) => {
      finite("roundRect", a);
      if (typeof a[4] === "number" && a[4] < 0) throw new Error("roundRect: negative radius");
    },
    measureText: (s: string) => ({ width: s.length * 10 }),
  };
  return new Proxy(state, {
    get(target, key: string) {
      if (key in methods) return methods[key];
      if (key in target) return target[key];
      return (...args: unknown[]) => finite(key, args);
    },
    set(target, key: string, value) {
      if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`${key} = ${value}`);
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const VIEWS: View[] = [
  { left: 0, top: 0, right: 1000, bottom: 1000, font: "Bungee", reducedMotion: false, reduceFlashing: false, showVerdict: true },
  { left: -480, top: -60, right: 1480, bottom: 1060, font: "Bungee", reducedMotion: true, reduceFlashing: true, showVerdict: true },
];

describe("drawing", () => {
  for (const game of [...games, ...bosses]) {
    it(`${game.id}: draws every moment, with and without taps`, () => {
      const g = strictCanvas();
      const beats = game.id in BOSSES ? 16 : 8;
      for (const seed of SEEDS.slice(0, 3)) {
        for (const presses of [undefined, [], [2.1, 4.4]]) {
          const setup: RoundSetup = { game, bpm: 130, difficulty: 0.6, seed, flags: NO_RULES, beats };
          const ctx = makeContext(setup);
          const scene = game.create(ctx);
          const plan = presses ?? scene.plan();
          let i = 0;
          for (let t = 0; t <= beats + 0.5; t += 0.07) {
            while (i < plan.length && plan[i]! <= t) scene.tap(plan[i++]!);
            scene.update(t);
            for (const view of VIEWS) scene.draw(g, t, view);
            scene.label?.(t);
          }
        }
      }
    });
  }
});
