// TrapSprint end to end (Plan/06-trapsprint.md §14), against the real static build, on a computer
// and on a phone. Every level's solvability (and determinism) is proven by the Dev runs in the unit
// tests; these check the real thing: the loop, the input, the screens and the saves.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:trapsprint";
const MAIN = [1, 2, 3].flatMap((z) => Array.from({ length: 10 }, (_, i) => `${z}-${String(i + 1).padStart(2, "0")}`));

/** Start with these levels cleared (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: string[], prefs: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ key, cleared, prefs }) => {
      if (sessionStorage.getItem("ts-seeded")) return;
      sessionStorage.setItem("ts-seeded", "1");
      const levels: Record<string, unknown> = {};
      for (const id of cleared) levels[id] = { deaths: 2, clears: 1, best: 400, medal: "bronze", coins: 0, assisted: false, marks: [] };
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          levels,
          deaths: 0,
          causes: {},
          fakeHops: 0,
          zoneRuns: {},
          achievements: {},
          stats: { jumps: 0, playTicks: 0 },
          last: null,
          prefs: { markers: true, ghost: true, assist: { speed: 1, reveal: false, invincible: false }, touchSize: "m", touchSwap: false, keys: null, ...prefs },
        }),
      );
    },
    { key: SAVE_KEY, cleared, prefs },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
/** A level on screen, its loop running (ready for input). */
const playing = (page: Page, id: string) => page.locator(`[data-playing="${id}"][data-ready]`);
const deaths = (page: Page) => page.locator("[data-deaths]");
const results = (page: Page) => page.getByRole("heading", { name: /^(Dev time!|Clear!|New best!)$/ });

async function openGame(page: Page) {
  await page.goto("/games/trapsprint/play");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
}

async function openLevel(page: Page, id: string) {
  await openGame(page);
  await page.getByRole("button", { name: "Levels" }).click();
  const zone = id.startsWith("R") ? /^Remix/ : new RegExp(`^${id[0]} `);
  await page.getByRole("tab", { name: zone }).click();
  // The next level to play bobs up and down: don't wait for it to hold still.
  await page.locator(`[data-level="${id}"]`).click({ force: true });
  await expect(playing(page, id)).toBeVisible();
}

/** Hold "right" with the keyboard, or with the on-screen pad on a phone. */
async function holdRight(page: Page, isMobile: boolean) {
  if (!isMobile) {
    await page.keyboard.down("ArrowRight");
    return () => page.keyboard.up("ArrowRight");
  }
  const pad = await page.getByRole("group", { name: "Move" }).boundingBox();
  if (!pad) throw new Error("No move pad");
  await page.mouse.move(pad.x + pad.width * 0.8, pad.y + pad.height / 2);
  await page.mouse.down();
  return () => page.mouse.up();
}

test("START falls when you reach for it, and any key starts 1-01", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones tap instead (below)");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).hover();
  await expect(page.getByText("Press any key to start anyway")).toBeVisible();
  await page.keyboard.press("KeyJ");
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByText("Reach the door.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("on a phone, START falls on the first tap and the next tap starts, with on-screen buttons", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).tap();
  await expect(page.getByText("Tap anywhere to start anyway")).toBeVisible();
  await page.getByRole("heading", { name: "TrapSprint", exact: true }).tap();
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByRole("button", { name: "Jump" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Move" })).toBeVisible();
});

test("running into the pop spikes is a death, and R restarts without one", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  await page.keyboard.down("ArrowRight");
  await expect(deaths(page)).toHaveAttribute("data-deaths", "1", { timeout: 8_000 });
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await stored(page))?.causes?.popSpikes).toBe(1);
  expect((await stored(page)).levels["1-01"].marks).toHaveLength(1);

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(300);
  await expect(deaths(page)).toHaveAttribute("data-deaths", "1");
  await expect(page.getByLabel("Time")).toHaveText("0.00");
});

test("walking straight through Fear Itself wins, saves a best time, and Next goes on", async ({ page, isMobile }) => {
  await seed(page, ["1-01", "1-02", "1-03", "1-04"]);
  await openLevel(page, "1-05");
  const release = await holdRight(page, isMobile);
  await expect(results(page)).toBeVisible({ timeout: 15_000 });
  await release();
  await expect(page.getByText(/medal|No medal yet/).first()).toBeVisible();
  await expect.poll(async () => (await stored(page))?.levels?.["1-05"]?.clears).toBe(1);
  const best = (await stored(page)).levels["1-05"].best;
  expect(best).toBeGreaterThan(190);
  expect(best).toBeLessThan(300);

  await page.getByRole("button", { name: "Next level" }).click();
  await expect(playing(page, "1-06")).toBeVisible();

  // Progress survives a reload.
  await page.reload();
  await page.getByRole("button", { name: "Levels" }).click();
  await expect(page.locator('[data-level="1-05"]')).toContainText(`${(best / 60).toFixed(2)} s`);
});

test("the All-Deaths Replay plays every attempt, and can be skipped", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, ["1-01", "1-02"]);
  await openLevel(page, "1-03");
  // Straight into the spikes…
  await page.keyboard.down("ArrowRight");
  await expect(deaths(page)).toHaveAttribute("data-deaths", "1", { timeout: 6_000 });
  await page.keyboard.up("ArrowRight");
  // …then assist's invincibility walks you through them.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Options" }).click();
  await page.getByRole("switch", { name: "Invincible" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Resume" }).click();
  await page.keyboard.down("ArrowRight");
  await expect(results(page)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("ArrowRight");
  await expect(page.getByText("1 death", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Watch all deaths" }).click();
  await expect(page.getByText(/^All deaths ·/)).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("button", { name: "Watch again" })).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(playing(page, "1-03")).toBeVisible();
});

test("pause, options and assist: invincible clears count, but earn no medal", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, ["1-01", "1-02"]);
  await openLevel(page, "1-03");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Options" }).click();
  await page.getByRole("switch", { name: "Invincible" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Assist", { exact: true })).toBeVisible();

  // Straight through two sets of spikes.
  await page.keyboard.down("ArrowRight");
  await expect(results(page)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("ArrowRight");
  await expect(page.getByText("Assist on: no medals")).toBeVisible();
  await expect(deaths(page)).toHaveAttribute("data-deaths", "0");
  await expect.poll(async () => (await stored(page))?.levels?.["1-03"]).toMatchObject({ clears: 1, best: null, assisted: true });
});

test("levels open one by one, and Remix opens after 3-10", async ({ page }) => {
  await seed(page, MAIN.slice(0, 3));
  await openGame(page);
  await page.getByRole("button", { name: "Levels" }).click();
  await expect(page.locator('[data-level="1-04"]')).toBeEnabled();
  await expect(page.locator('[data-level="1-05"]')).toBeDisabled();
  await page.getByRole("tab", { name: /^Remix/ }).click();
  await expect(page.getByText(/Clear 3-10 to open Remix/)).toBeVisible();
  await expect(page.locator('[data-level="R1-01"]')).toBeDisabled();

  await page.evaluate(
    ({ key, ids }) => {
      const save = JSON.parse(localStorage.getItem(key)!);
      for (const id of ids) save.levels[id] = { deaths: 0, clears: 1, best: 400, medal: "gold", coins: 0, assisted: false, marks: [] };
      localStorage.setItem(key, JSON.stringify(save));
    },
    { key: SAVE_KEY, ids: MAIN },
  );
  await page.reload();
  await page.getByRole("button", { name: "Levels" }).click();
  await page.getByRole("tab", { name: /^Remix/ }).click();
  await expect(page.locator('[data-level="R1-01"]')).toBeEnabled();
  await expect(page.locator('[data-level="R1-02"]')).toBeDisabled();
  await page.locator('[data-level="R1-01"]').click({ force: true });
  await expect(playing(page, "R1-01")).toBeVisible();
});

test("a cleared zone opens its speedrun, timed across the whole zone", async ({ page }) => {
  await seed(page, MAIN.slice(0, 10));
  await openGame(page);
  await page.getByRole("button", { name: "Levels" }).click();
  // The level select opens at the next level to play (2-01): go back to zone 1.
  await page.getByRole("tab", { name: /^1 Green Lies/ }).click();
  await page.getByRole("button", { name: "Zone speedrun" }).click();
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByText("Zone 1 · 1/10")).toBeVisible();
  await page.getByRole("button", { name: "Pause (Esc)" }).click();
  await expect(page.getByRole("button", { name: "Restart the zone run" })).toBeVisible();
  await page.getByRole("button", { name: "Quit to the levels" }).click();
  await expect(page.getByRole("tab", { name: /^1 Green Lies/ })).toHaveAttribute("aria-selected", "true");
});
