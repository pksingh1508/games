// NOPE! end to end (Plan/02-nope.md §12): a player who knows the tricks clears episode 1, on a
// computer and on a phone, against the real static build.
import { expect, test, type Page } from "@playwright/test";

const card = (page: Page, n: number) => page.getByRole("region", { name: n === 15 ? "Boss question" : `Question ${n}` });

async function openGame(page: Page) {
  await page.goto("/games/nope/play");
  await expect(page.getByRole("heading", { name: "NOPE!" })).toBeVisible();
}

async function startEpisodeOne(page: Page) {
  await openGame(page);
  const start = page.getByRole("button", { name: "▶ Start" });
  await start.click();
  // The first press of Start gets stamped. It's a joke.
  await expect(page.getByText("…just kidding. Go ahead.")).toBeVisible();
  await start.click();
  await page.getByRole("button", { name: "Start episode 1" }).click();
  await skipIntro(page);
  await expect(card(page, 1)).toBeVisible();
}

async function skipIntro(page: Page) {
  await page.getByText("Click anywhere to skip").click();
  await expect(page.getByText("Click anywhere to skip")).toBeHidden();
}

/** Tap something (a click without moving: picks it up, or slides it aside). */
const tap = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();

const SOLVE: Record<number, (page: Page) => Promise<void>> = {
  1: (p) => tap(p, "Click the biggest button."),
  2: (p) => card(p, 2).getByRole("button", { name: "4", exact: true }).click(),
  3: (p) => p.waitForTimeout(6500),
  4: (p) => tap(p, "The empty space"),
  5: (p) => tap(p, "Any"),
  6: (p) => card(p, 6).getByRole("button", { name: /^GREEN/ }).click(),
  7: async (p) => {
    await tap(p, "Open the fridge door");
    await tap(p, "Pick up the elephant");
    await tap(p, "Put the elephant on the fridge");
    await tap(p, "Close the fridge door");
  },
  8: async (p) => {
    await tap(p, "Open the fridge door");
    await tap(p, "Pick up the elephant");
    await tap(p, "Put the elephant on the floor");
    await tap(p, "Pick up the giraffe");
    await tap(p, "Put the giraffe on the fridge");
    await tap(p, "Close the fridge door");
  },
  9: (p) => tap(p, "A tiny number 1"),
  10: (p) => card(p, 10).getByRole("button", { name: "Answer", exact: true }).click(),
  11: async (p) => {
    await card(p, 11).getByRole("textbox").fill("Green");
    await card(p, 11).getByRole("button", { name: "Answer", exact: true }).click();
  },
  12: async (p) => {
    await tap(p, "Move the question out of the way");
    await tap(p, "The answer");
  },
  13: async (p) => {
    await card(p, 13).getByRole("textbox").fill("pickles");
    await card(p, 13).getByRole("button", { name: "Answer", exact: true }).click();
  },
  14: async (p) => {
    for (const n of ["1", "2", "3", "4", "5"]) await card(p, 14).getByRole("button", { name: n, exact: true }).click();
  },
  15: async (p) => {
    await tap(p, "Move Mr. Nope out of the way");
    await tap(p, "Move the doormat out of the way");
    await tap(p, "Pick up the key");
    await tap(p, "Put the key on the exit door");
  },
};

test("a player who knows the tricks clears episode 1", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await startEpisodeOne(page);
  for (let n = 1; n <= 15; n++) {
    await expect(card(page, n)).toBeVisible();
    await SOLVE[n]!(page);
    if (n < 15) await expect(card(page, n + 1)).toBeVisible({ timeout: 15_000 });
  }

  await expect(page.getByRole("heading", { name: "Cleared!" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("NOPE! Episode 1: Easy Peasy (Lies) — cleared")).toBeVisible();
  await expect(page.getByText("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅")).toBeVisible();

  // Episode 2 is unlocked in the channel guide.
  await page.getByRole("button", { name: "Channels" }).click();
  await page.getByRole("radio", { name: /Channel 2: Brain Freeze/ }).click();
  await expect(page.getByRole("button", { name: "Start episode 2" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the obvious answer gets stamped, and it costs a heart", async ({ page }) => {
  await startEpisodeOne(page);
  await card(page, 1).getByRole("button", { name: "Answer D" }).click();
  await expect(page.getByRole("group", { name: "Hearts: 2 of 3" })).toBeVisible();
  await expect(card(page, 1).getByText("Try 2")).toBeVisible({ timeout: 15_000 });
});

test("three NOPEs end the attempt, and one tap tries again", async ({ page }) => {
  await startEpisodeOne(page);
  for (let i = 0; i < 3; i++) {
    await expect(card(page, 1)).toBeVisible({ timeout: 15_000 });
    await card(page, 1).getByRole("button", { name: "Answer A" }).click();
  }
  await expect(page.getByRole("heading", { name: "Out of hearts!" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Try again" }).click();
  await skipIntro(page);
  await expect(page.getByRole("group", { name: "Hearts: 3 of 3" })).toBeVisible();
});

test("the run survives a reload", async ({ page }) => {
  await startEpisodeOne(page);
  await SOLVE[1]!(page);
  await expect(card(page, 2)).toBeVisible({ timeout: 15_000 });
  await SOLVE[2]!(page);
  await expect(card(page, 3)).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await page.getByRole("button", { name: /Continue: Episode 1, Q3/ }).click();
  await skipIntro(page);
  await expect(card(page, 3)).toBeVisible();
});

test("Esc pauses the show", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones pause with the button");
  await startEpisodeOne(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Commercial break" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

// ---------------------------------------------------------------------------------------------
// Later in the game: start from a saved run instead of playing everything before it.
// ---------------------------------------------------------------------------------------------

function seededSave(run: { episode: number; index: number; hearts?: number; skip?: boolean; wall?: number }) {
  const record = { attempts: 0, clears: 0, bestScore: null, bestTimeMs: null, bestGrid: null, perfect: false };
  return {
    v: 1,
    unlocked: run.episode,
    episodes: { "1": record, "2": record, "3": record, "4": record },
    run: {
      episode: run.episode,
      seed: 12345,
      attempt: 0,
      index: run.index,
      hearts: run.hearts ?? 3,
      skip: run.skip ?? false,
      results: Array.from({ length: run.index }, () => "first"),
      fails: {},
      nopes: 0,
      wall: run.wall ?? 0,
      elapsedMs: 0,
    },
    memory: {},
    stats: { nopes: 0, flies: 0, winkedAt: 0, correct: 0, firstTry: 0, patience: [], playMs: 0 },
    achievements: {},
    prefs: { laughTrack: true },
    finished: false,
  };
}

async function continueFrom(page: Page, save: ReturnType<typeof seededSave>) {
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("mfg:game:nope", value);
      sessionStorage.setItem("seeded", "1");
    }
  }, JSON.stringify(save));
  await openGame(page);
  await page.getByRole("button", { name: /^Continue: Episode/ }).click();
  await skipIntro(page);
}

test("saying no to Mr. Nope rolls the credits", async ({ page }) => {
  await continueFrom(page, seededSave({ episode: 4, index: 14 }));
  await expect(card(page, 15)).toBeVisible();
  // The YES button pulses forever (it's the temptation), so it never "settles" for Playwright.
  await card(page, 15).getByRole("button", { name: "YES!" }).click({ force: true });
  await expect(page.getByRole("group", { name: "Hearts: 2 of 3" })).toBeVisible();
  await expect(card(page, 15).getByText("Try 2")).toBeVisible({ timeout: 15_000 });
  // "no" runs away a few times, then pants (an endless wobble), so these clicks are forced too.
  const caught = card(page, 15).getByText("N-n-nope?!");
  for (let i = 0; i < 10 && !(await caught.isVisible()); i++) {
    await card(page, 15).getByRole("button", { name: "No", exact: true }).click({ force: true });
    await page.waitForTimeout(450);
  }
  await expect(page.getByText("You NOPE'd the NOPE.")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "See your score" }).click();
  await expect(page.getByRole("heading", { name: "Cleared!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next episode" })).toHaveCount(0);
});

test("a skip from a caught fly moves past a question", async ({ page }) => {
  await continueFrom(page, seededSave({ episode: 1, index: 1, skip: true }));
  await expect(card(page, 2)).toBeVisible();
  await page.getByRole("button", { name: "Use your skip" }).click();
  await page.getByRole("button", { name: "Skip it" }).click();
  await expect(card(page, 3)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Skip slot (empty)" })).toBeVisible();
});

test("a hidden tab freezes the fuse and opens the pause menu", async ({ page, isMobile }) => {
  test.skip(isMobile, "Same code path on phones");
  await continueFrom(page, seededSave({ episode: 1, index: 8 }));
  await expect(card(page, 9)).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const timer = page.getByRole("timer");
  const frozenAt = await timer.textContent();
  await page.waitForTimeout(2500);
  await expect(timer).toHaveText(frozenAt ?? "");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("dialog", { name: "Commercial break" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(timer).not.toHaveText(frozenAt ?? "", { timeout: 5000 });
});

test("only one tab runs the show", async ({ page, context }) => {
  await openGame(page);
  const second = await context.newPage();
  await second.goto("/games/nope/play");
  await expect(page.getByRole("heading", { name: "NOPE! is open in another tab" })).toBeVisible();
  await page.getByRole("button", { name: "Play here instead" }).click();
  await expect(second.getByRole("heading", { name: "NOPE! is open in another tab" })).toBeVisible();
});

test("answering question 1 without reading earns an achievement", async ({ page }) => {
  await startEpisodeOne(page);
  await card(page, 1).getByRole("button", { name: "Answer D" }).click();
  await expect(page.getByText("Didn't Even Read")).toBeVisible();
});
