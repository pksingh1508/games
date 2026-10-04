// Glitch Run end to end (Plan/07-glitch-run.md §14), against the real static build, on a computer and
// on a phone. That every stage can be cleared, every chunk passed and every glitch is fair is proven by
// the unit tests; these check the real thing: the loop, the input, the screens and the saves.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:glitch-run";
const IDS = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, "0"));

/** Start with these stages cleared (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: number, { warned = true } = {}) {
  await page.addInitScript(
    ({ key, ids, warned }) => {
      if (sessionStorage.getItem("gr-seeded")) return;
      sessionStorage.setItem("gr-seeded", "1");
      const stages: Record<string, unknown> = {};
      for (const id of ids) stages[id] = { clears: 1, deaths: 2, best: 4200, clean: false };
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          stages,
          endless: { runs: 0, best: 0, metres: 0 },
          daily: {},
          totals: { runs: 0, deaths: 0, metres: 0, clips: 0, panics: 0, tears: 0 },
          achievements: {},
          warned,
          ending: null,
          prefs: { gentle: false, beatBar: true, touchSwap: false, keys: null },
        }),
      );
    },
    { key: SAVE_KEY, ids: IDS.slice(0, cleared), warned },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
/** A run on screen, its loop going (ready for input). */
const running = (page: Page, target: string) => page.locator(`[data-target="${target}"][data-ready]`);
const metres = async (page: Page) => Number(await page.locator("[data-metres]").getAttribute("data-metres"));
/** Wait until the runner has come this far (the HUD's distance, in tiles). */
const reach = (page: Page, m: number) =>
  page.waitForFunction((m) => Number(document.querySelector("[data-metres]")?.getAttribute("data-metres")) >= m, m, { polling: "raf", timeout: 20_000 });

async function openGame(page: Page) {
  await page.goto("/games/glitch-run/play");
  await expect(page.locator("button[data-start]")).toBeVisible();
}

test("START crashes the title into stage_01.exe, after the photosensitivity warning", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones tap (below)");
  await openGame(page);
  await expect(page.getByRole("heading", { name: "Glitch Run" })).toBeVisible();
  await page.keyboard.press("Enter");
  // The first time: what's coming, and the comfort settings right there.
  const warning = page.getByRole("dialog", { name: "Photosensitivity warning" });
  await expect(warning).toBeVisible();
  await expect(warning.getByRole("switch", { name: "Reduce flashing" })).toBeVisible();
  await warning.getByRole("button", { name: "Run" }).click();
  await expect(running(page, "01")).toBeVisible();
  await expect(page.locator("[data-hint]")).toContainText("Space jumps");
  // Saves are written a moment later (debounced).
  await expect.poll(async () => (await stored(page))?.warned).toBe(true);
});

test("no input: the first spike patches you; R and Space retry at once, and deaths count", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, 0);
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(running(page, "01")).toBeVisible();
  const card = page.locator('[data-end="patched"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText("Corrupted spikes");
  await expect(card.getByRole("button", { name: "Retry" })).toBeFocused();
  let save = await stored(page);
  expect(save.stages["01"]).toMatchObject({ clears: 0, deaths: 1 });
  expect(save.totals.deaths).toBe(1);
  await page.keyboard.press("KeyR");
  await expect(card).toBeHidden();
  await expect(page.locator("[data-attempt]")).toHaveAttribute("data-attempt", "2");
  await expect(card).toBeVisible({ timeout: 20_000 });
  await page.keyboard.press("Space");
  await expect(page.locator("[data-attempt]")).toHaveAttribute("data-attempt", "3");
  save = await stored(page);
  expect(save.stages["01"].deaths).toBe(2);
});

test("a jump, held, clears the first spike", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard (phones below)");
  await seed(page, 0);
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(running(page, "01")).toBeVisible();
  // The spike is in column 36; a held jump taken off from 31 m to 34 m sails over it.
  await reach(page, 31);
  await page.keyboard.down("Space");
  await page.waitForTimeout(250);
  await page.keyboard.up("Space");
  await reach(page, 40);
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-status", "run");
});

test("Esc pauses (the run stops), and Resume carries on", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, 1);
  await openGame(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("[data-run]").click();
  await expect(running(page, "02")).toBeVisible();
  await reach(page, 6);
  await page.keyboard.press("Escape");
  const pause = page.getByRole("dialog", { name: "Paused" });
  await expect(pause).toBeVisible();
  const at = await metres(page);
  await page.waitForTimeout(600);
  expect(await metres(page)).toBe(at);
  await pause.getByRole("button", { name: "Resume" }).click();
  await reach(page, at + 3);
});

test("the files: stages open one after another, the rest are still corrupted; endless and the daily open after stage 1", async ({ page }) => {
  await seed(page, 3);
  await openGame(page);
  await page.getByRole("button", { name: "Continue" }).click();
  // The next stage to clear is picked, with its details.
  await expect(page.locator('[data-file="04"]')).toHaveAttribute("aria-current", "true");
  await expect(page.locator('[data-details="04"]')).toContainText("Tear Down");
  await expect(page.locator('[data-file="01"]')).toBeEnabled();
  await expect(page.locator('[data-file="05"]')).toBeDisabled();
  await expect(page.locator('[data-file="05"]')).toContainText("corrupted");
  await expect(page.locator('[data-file="endless"]')).toBeEnabled();
  await page.locator('[data-file="daily"]').click();
  await expect(page.locator('[data-details="daily"]')).toContainText("the same track and the same glitches for everyone");
  await page.locator("[data-run]").click();
  await expect(running(page, "daily")).toBeVisible();
});

test("endless: a run ends PATCHED, with a share card, and it's saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, 1);
  await openGame(page);
  await page.getByRole("button", { name: "Endless" }).click();
  await expect(running(page, "endless")).toBeVisible();
  const card = page.locator('[data-end="patched"]');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card.getByRole("button", { name: "Share" })).toBeVisible();
  const save = await stored(page);
  expect(save.endless.runs).toBe(1);
  expect(save.totals.runs).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-file="endless"]')).toHaveAttribute("aria-current", "true");
});

test("options: gentle glitches and the beat bar are saved, and the beat bar goes", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, 1);
  await openGame(page);
  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Options" });
  await options.getByRole("switch", { name: "Gentle glitches" }).click();
  await options.getByRole("switch", { name: "Beat bar" }).click();
  await expect.poll(async () => (await stored(page)).prefs).toMatchObject({ gentle: true, beatBar: false });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("[data-run]").click();
  await expect(running(page, "02")).toBeVisible();
  await expect(page.locator("[data-beatbar]")).toHaveCount(0);
});

test("on a phone: START, then the screen's halves are the buttons (hold the right half to jump the spike)", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await seed(page, 0);
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).tap();
  await expect(running(page, "01")).toBeVisible();
  await expect(page.getByRole("button", { name: "Glitch (Clip)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jump" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Slide" })).toBeVisible();
  // A held touch (synthetic pointer events can't be held: real touch events through the protocol).
  const cdp = await page.context().newCDPSession(page);
  const size = page.viewportSize()!;
  const point = [{ x: size.width * 0.8, y: size.height * 0.5 }];
  await reach(page, 31);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point });
  await page.waitForTimeout(250);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await reach(page, 40);
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-status", "run");
});
