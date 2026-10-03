// Every NOPE! question, checked two ways:
// 1. its metadata follows the fairness rules (Plan/02-nope.md §10), and
// 2. a scripted player solves it through the real UI: clicks, typing, keys, timers, and the
//    keyboard versions of drag and hold (the same paths keyboard players use).
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayProvider, type HotspotHandler, type HotspotName } from "../play/context";
import { EPISODE_1 } from "./episode-1";
import { EPISODE_2 } from "./episode-2";
import { EPISODE_3 } from "./episode-3";
import { EPISODE_4 } from "./episode-4";
import type { QuestionApi, QuestionEntry, WrongOptions } from "./types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const EPISODES = [EPISODE_1, EPISODE_2, EPISODE_3, EPISODE_4];
const ALL = EPISODES.flat();

// ---------------------------------------------------------------------------------------------
// 1. Metadata
// ---------------------------------------------------------------------------------------------

describe("NOPE! questions", () => {
  it("has 4 episodes of 15 questions", () => {
    expect(EPISODES.map((e) => e.length)).toEqual([15, 15, 15, 15]);
  });

  it("numbers questions e<episode>-q<NN>, in order, with no duplicates", () => {
    EPISODES.forEach((episode, e) =>
      episode.forEach(({ meta }, q) => expect(meta.id).toBe(`e${e + 1}-q${String(q + 1).padStart(2, "0")}`)),
    );
    expect(new Set(ALL.map((q) => q.meta.id)).size).toBe(60);
  });

  it.each(ALL.map((q) => [q.meta.id, q] as const))("%s follows at least one secret rule", (_, { meta }) => {
    expect(meta.rules.length).toBeGreaterThan(0);
    expect(new Set(meta.rules).size).toBe(meta.rules.length);
    for (const rule of meta.rules) expect([1, 2, 3, 4, 5]).toContain(rule);
  });

  it.each(ALL.map((q) => [q.meta.id, q] as const))("%s explains its answer, its tell and an honest hint", (_, { meta }) => {
    expect(meta.title.length).toBeGreaterThan(2);
    expect(meta.prompt.length).toBeGreaterThan(2);
    expect(meta.solution.length).toBeGreaterThan(5);
    expect(meta.tell.length).toBeGreaterThan(5);
    expect(meta.hint.length).toBeGreaterThan(5);
    expect(meta.kinds.length).toBeGreaterThan(0);
  });

  it("ends every episode with one boss that can't be skipped and has no fly", () => {
    for (const episode of EPISODES) {
      expect(episode.filter((q) => q.meta.boss).map((q) => q.meta.id)).toEqual([episode[14]!.meta.id]);
      expect(episode[14]!.meta.calm).toBe(true);
    }
  });

  it("uses every secret rule in every episode", () => {
    for (const episode of EPISODES) {
      expect(new Set(episode.flatMap((q) => q.meta.rules))).toEqual(new Set([1, 2, 3, 4, 5]));
    }
  });

  it("gives every bomb at least 10 seconds (fairness rule 5)", () => {
    const bombs = ALL.filter((q) => q.meta.bomb);
    expect(bombs.length).toBeGreaterThanOrEqual(8);
    for (const { meta } of bombs) expect(meta.bomb!.seconds).toBeGreaterThanOrEqual(10);
  });

  it("gives keyboard and hover questions a touch version", () => {
    for (const { meta } of ALL.filter((q) => q.meta.kinds.includes("key") || q.meta.kinds.includes("hover"))) {
      expect(meta.touch, meta.id).toBeTruthy();
    }
  });

  it("never sends a skip fly into a do-nothing question (catching it would be pressing something)", () => {
    for (const { meta } of ALL.filter((q) => q.meta.kinds.includes("wait"))) expect(meta.calm, meta.id).toBe(true);
  });

  it("lets Mr. Nope speak on every question about his winks", () => {
    for (const { meta } of ALL.filter((q) => q.meta.rules.includes(5) && !q.meta.boss)) {
      expect(meta.host, meta.id).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------------------------
// 2. A scripted player
// ---------------------------------------------------------------------------------------------

interface Player {
  correct: ReturnType<typeof vi.fn>;
  wrong: ReturnType<typeof vi.fn>;
  click(target: string | RegExp): void;
  key(target: string | RegExp, key: string): void;
  hold(target: string | RegExp, ms: number): void;
  /** A quick press and release: a poke. */
  tap(target: string | RegExp): void;
  type(text: string): void;
  number(value: number): void;
  press(key: string): void;
  hotspot(name: HotspotName, index?: number): void;
  wait(ms: number): void;
  text(): string;
}

let root: Root | null = null;
let mounts: HTMLElement[] = [];

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  });
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  mounts.forEach((el) => el.remove());
  mounts = [];
  vi.useRealTimers();
});

function labelOf(el: Element): string {
  return (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function play(entry: QuestionEntry, options: Partial<QuestionApi> & { memory?: Record<string, string> } = {}): Player {
  const container = document.createElement("div");
  const stage = document.createElement("div");
  document.body.append(container, stage);
  mounts.push(container, stage);

  const hotspots = new Map<HotspotName, HotspotHandler>();
  const memory: Record<string, string> = { sky: "green", fridge: "giraffe", ...options.memory };
  const correct = vi.fn<(line?: string) => void>();
  const wrong = vi.fn<(options?: WrongOptions | string) => void>();

  const api: QuestionApi = {
    correct,
    wrong,
    say: () => {},
    remember: (key, value) => {
      memory[key] = value;
    },
    recall: (key) => memory[key],
    meta: entry.meta,
    episode: 1,
    number: 1,
    fails: 0,
    attempt: 0,
    hearts: 3,
    stamps: 0,
    results: [],
    coarse: false,
    colorblind: false,
    reducedMotion: false,
    seed: 1,
    ...options,
  };

  root = createRoot(container);
  act(() =>
    root!.render(
      createElement(
        PlayProvider,
        {
          value: {
            paused: false,
            stage,
            registerHotspot: (name, handler) => {
              hotspots.set(name, handler);
              return () => {
                hotspots.delete(name);
              };
            },
          },
        },
        createElement(entry.Component, { api }),
      ),
    ),
  );

  const find = (target: string | RegExp): HTMLElement => {
    const all = [...container.querySelectorAll<HTMLElement>("button, [role=button]"), ...stage.querySelectorAll<HTMLElement>("button, [role=button]")];
    const match = all.find((el) => (typeof target === "string" ? labelOf(el) === target : target.test(labelOf(el))));
    if (!match) throw new Error(`No button "${target}" in: ${all.map(labelOf).join(" | ")}`);
    return match;
  };
  const input = () => {
    const el = container.querySelector("input");
    if (!el) throw new Error("No text box");
    return el;
  };
  const fill = (value: string) => {
    const el = input();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const submit = () => {
    input().form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  return {
    correct,
    wrong,
    click: (target) => act(() => find(target).click()),
    key: (target, key) =>
      act(() => {
        find(target).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      }),
    hold: (target, ms) => {
      const el = find(target);
      act(() => {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      });
      act(() => {
        vi.advanceTimersByTime(ms);
      });
    },
    tap: (target) => {
      const el = find(target);
      act(() => {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      });
      act(() => {
        vi.advanceTimersByTime(80);
      });
      act(() => {
        el.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));
      });
    },
    type: (text) => {
      act(() => fill(text));
      act(() => submit());
    },
    number: (value) => {
      act(() => fill(String(value)));
      act(() => submit());
    },
    press: (key) => act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))),
    hotspot: (name, index) => act(() => void hotspots.get(name)?.({ index })),
    wait: (ms) =>
      act(() => {
        vi.advanceTimersByTime(ms);
      }),
    text: () => (container.textContent ?? "") + (stage.textContent ?? ""),
  };
}

type Solver = (player: Player) => void;

/** How a player who knows the trick answers each question. null: the fuse does it (green, kind). */
const SOLUTIONS: Record<string, Solver | null> = {
  // Episode 1
  "e1-q01": (p) => p.click("Click the biggest button."),
  "e1-q02": (p) => p.click("4"),
  "e1-q03": (p) => p.wait(6100),
  "e1-q04": (p) => p.click("The empty space"),
  "e1-q05": (p) => p.press("k"),
  "e1-q06": (p) => p.click(/^GREEN/),
  "e1-q07": (p) => {
    p.click("Open the fridge door");
    p.key("Pick up the elephant", "Enter");
    p.click("Put the elephant on the fridge");
    p.click("Close the fridge door");
  },
  "e1-q08": (p) => {
    p.click("Open the fridge door");
    p.key("Pick up the elephant", "Enter");
    p.click("Put the elephant on the floor");
    p.key("Pick up the giraffe", "Enter");
    p.click("Put the giraffe on the fridge");
    p.click("Close the fridge door");
  },
  "e1-q09": (p) => p.click("A tiny number 1"),
  "e1-q10": (p) => p.number(0),
  "e1-q11": (p) => p.type("Green"),
  "e1-q12": (p) => {
    p.key("Move the question out of the way", "Enter");
    p.click("The answer");
  },
  "e1-q13": (p) => p.type("pickles"),
  "e1-q14": (p) => ["1", "2", "3", "4", "5"].forEach((n) => p.click(n)),
  "e1-q15": (p) => {
    p.key("Move Mr. Nope out of the way", "Enter");
    p.key("Move the doormat out of the way", "Enter");
    p.key("Pick up the key", "Enter");
    p.click("Put the key on the exit door");
    p.wait(500);
  },
  // Episode 2
  "e2-q01": (p) => p.click("12"),
  "e2-q02": (p) => p.click(/^BLUE/),
  "e2-q03": (p) => p.click("D"),
  "e2-q04": null,
  "e2-q05": (p) => p.click("Close"),
  "e2-q06": (p) => p.click("5"),
  "e2-q07": (p) => p.type("fast"),
  "e2-q08": (p) => p.click("T"),
  "e2-q09": (p) => p.click("Door 3"),
  "e2-q10": (p) => p.hold("The cat", 2200),
  "e2-q11": (p) => [1, 2, 3, 4].forEach(() => p.click("Correct answer")),
  "e2-q12": (p) => p.hotspot("host"),
  "e2-q13": (p) => p.hotspot("fuse"),
  "e2-q14": (p) => p.number(6),
  "e2-q15": (p) => {
    p.type("nothing");
    p.hotspot("host");
    p.wait(3300);
    p.click("Type");
    p.click("Cut the blue wire");
  },
  // Episode 3
  "e3-q01": (p) => p.click("Green"),
  "e3-q02": (p) => p.click("Giraffe"),
  "e3-q03": (p) => p.click("Fish"),
  "e3-q04": (p) => {
    p.key("Move the stamp out of the way", "Enter");
    p.click("The answer");
  },
  "e3-q05": (p) => p.click("nothing"),
  "e3-q06": (p) => {
    p.click("Heart 1");
    p.click("Heart 2");
    p.click("Heart 4");
    p.click(/^Done/);
  },
  "e3-q07": (p) => p.click("Wrong"),
  "e3-q08": (p) => p.click("Answer D"),
  "e3-q09": (p) => p.click("4"),
  "e3-q10": (p) => p.number(1),
  "e3-q11": (p) => p.click(/^PRESS/),
  "e3-q12": (p) => p.click("Tomato"),
  "e3-q13": (p) => p.type("Banana"),
  "e3-q14": (p) => [/2 \+ 2/, /Don't press/, /elephant/, /Leave the quiz/].forEach((t) => p.click(t)),
  "e3-q15": (p) => ["Tomato", "Wrong", "Fish"].forEach((a) => p.click(a)),
  // Episode 4
  "e4-q01": (p) => p.hotspot("stage"),
  "e4-q02": (p) => {
    ["ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "ArrowLeft"].forEach((k) => p.key("The ketchup bottle", k));
    p.wait(400);
  },
  "e4-q03": (p) => p.click("1"),
  "e4-q04": (p) => p.click("Cut the yellow wire"),
  "e4-q05": (p) => p.wait(6100),
  "e4-q06": (p) => p.number(6),
  "e4-q07": (p) => ["5", "4", "3", "2", "1"].forEach((n) => p.click(n)),
  "e4-q08": (p) => p.click(/^RED/),
  "e4-q09": (p) => p.wait(7100),
  "e4-q10": (p) => p.type("Mr. Nope"),
  "e4-q11": (p) => p.hotspot("hearts", 0),
  "e4-q12": (p) => {
    p.wait(12100);
    p.click("GO");
  },
  "e4-q13": (p) => p.click("The biggest button wins."),
  "e4-q14": (p) => p.click("2"),
  "e4-q15": (p) => {
    [1, 2, 3, 4].forEach(() => p.click("No"));
    p.wait(1800);
  },
};

/** Extra setup some questions need (the hearts and stamps the run has at that point). */
const SETUP: Record<string, Partial<QuestionApi>> = {
  "e3-q06": { hearts: 3 },
};

describe("a player who knows the trick", () => {
  it("has a solution for every question", () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(ALL.map((q) => q.meta.id).sort());
  });

  it.each(ALL.map((q) => [q.meta.id, q] as const))("solves %s", (id, entry) => {
    const solve = SOLUTIONS[id];
    const player = play(entry, SETUP[id]);
    if (solve === null) {
      // Solved by the frame: a green fuse that just has to run out.
      expect(entry.meta.bomb?.kind).toBe("green");
      player.wait(entry.meta.bomb!.seconds * 1000 + 100);
      expect(player.wrong).not.toHaveBeenCalled();
      return;
    }
    solve!(player);
    expect(player.wrong).not.toHaveBeenCalled();
    expect(player.correct).toHaveBeenCalledTimes(1);
  });
});

describe("the obvious answer", () => {
  const cases: Array<[string, Solver]> = [
    ["e1-q01", (p) => p.click("Answer D")],
    ["e1-q02", (p) => p.click("Fish")],
    ["e1-q03", (p) => p.click(/^PRESS/)],
    ["e1-q05", (p) => p.click("Esc")],
    ["e1-q06", (p) => p.click(/^BLUE/)],
    ["e1-q09", (p) => p.click("3")],
    ["e1-q11", (p) => p.type("blue")],
    ["e1-q13", (p) => p.type("banana")],
    ["e2-q01", (p) => p.click("1")],
    ["e2-q06", (p) => p.click("10")],
    ["e2-q08", (p) => p.click("Z")],
    ["e2-q10", (p) => p.tap("The cat")],
    ["e2-q14", (p) => p.number(4)],
    ["e3-q08", (p) => p.click("Answer A")],
    ["e3-q13", (p) => p.type("pickles")],
    ["e4-q10", (p) => p.type("nope")],
    ["e4-q15", (p) => p.click("YES!")],
  ];

  it.each(cases)("gets %s NOPE'd", (id, act) => {
    const entry = ALL.find((q) => q.meta.id === id)!;
    const player = play(entry);
    act(player);
    expect(player.wrong).toHaveBeenCalled();
    expect(player.correct).not.toHaveBeenCalled();
  });

  it("stamps you for believing a wink", () => {
    const player = play(EPISODE_2[8]!);
    player.click("Door 1");
    expect(player.wrong).toHaveBeenCalledWith(expect.objectContaining({ winked: true }));
  });

  it("stamps the wrong order in the boss of episode 3", () => {
    const player = play(EPISODE_3[14]!);
    player.click("Fish");
    expect(player.wrong).toHaveBeenCalled();
  });

  it("flips the boss of episode 3 on the next attempt", () => {
    const player = play(EPISODE_3[14]!, { attempt: 1 });
    ["Fish", "Wrong", "Tomato"].forEach((a) => player.click(a));
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("moves the key in the boss of episode 1 on the next attempt", () => {
    const player = play(EPISODE_1[14]!, { attempt: 1 });
    player.key("Move Mr. Nope out of the way", "Enter");
    player.key("Move the plant pot out of the way", "Enter");
    player.key("Pick up the key", "Enter");
    player.click("Put the key on the exit door");
    player.wait(500);
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("swaps the five-part bomb's word and wire on the next attempt", () => {
    const player = play(EPISODE_2[14]!, { attempt: 1 });
    player.type("something");
    player.hotspot("host");
    player.wait(3300);
    player.click("Type");
    player.click("Cut the red wire");
    expect(player.correct).toHaveBeenCalledTimes(1);
  });
});

describe("other ways to play", () => {
  it("offers a tappable key on touch screens", () => {
    const player = play(EPISODE_1[4]!, { coarse: true });
    expect(player.text()).toContain("Tap any key.");
    player.click("Any");
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("swaps colours for shapes and styles in colour-vision mode", () => {
    const shapes = play(EPISODE_1[5]!, { colorblind: true });
    expect(shapes.text()).toContain("Click the star.");
    shapes.click(/^SQUARE/);
    expect(shapes.correct).toHaveBeenCalledTimes(1);
  });

  it("uses italics instead of ink in colour-vision mode", () => {
    const player = play(EPISODE_2[1]!, { colorblind: true });
    player.click(/^BOLD/);
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("uses capitals instead of ink in colour-vision mode", () => {
    const player = play(EPISODE_4[7]!, { colorblind: true });
    player.click("LOWERCASE");
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("counts the stamps you actually have", () => {
    const player = play(EPISODE_1[9]!, { stamps: 7 });
    player.number(7);
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("asks for as many hearts as you have", () => {
    const player = play(EPISODE_3[5]!, { hearts: 1 });
    player.click("Heart 3");
    player.click(/^Done/);
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("remembers who you left in the fridge", () => {
    const player = play(EPISODE_3[1]!, { memory: { fridge: "elephant" } });
    player.click("Elephant");
    expect(player.correct).toHaveBeenCalledTimes(1);
  });

  it("accepts pressing “nothing” or waiting it out", () => {
    const player = play(EPISODE_3[4]!);
    player.wait(6100);
    expect(player.correct).toHaveBeenCalledTimes(1);
  });
});
