// One Tap Chaos end to end (Plan/09-one-tap-chaos.md §14), against the real static build, on a
// computer and on a phone. Every microgame's winnability is proven by the bots in the unit tests;
// these check the real thing runs: the clock, the screens, the input, the saves.
import { expect, test, type Page } from "@playwright/test";

/** The instruction, as screen readers hear it. */
const pill = (page: Page) => page.locator("[data-instruction]");

async function openGame(page: Page) {
  await page.goto("/games/one-tap-chaos/play");
  await expect(page.getByRole("button", { name: "Tap to start" })).toBeVisible();
}

/** Press TAP, skip the first-time calibration, and wait for the first microgame. */
async function startRun(page: Page) {
  await openGame(page);
  await page.getByRole("button", { name: "Tap to start" }).click();
  await expect(page.getByRole("heading", { name: "Tap timing" })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByText("GO!")).toBeVisible();
  await expect(pill(page)).not.toHaveText("", { timeout: 5_000 });
}

test("TAP starts a run: a count-in, then a microgame on the beat", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startRun(page);
  await expect(page.getByRole("img", { name: "Lives: 4 of 4" })).toBeVisible();
  await expect(page.getByText(/Round 1 · 100 bpm/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test("Esc pauses the music clock, and resuming counts you back in", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones pause with the button (tested below)");
  await startRun(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("GO!")).toBeVisible();
});

test("the pause button works on a phone, and Quit goes back to the title", async ({ page }) => {
  await startRun(page);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Quit to the menu" }).click();
  await expect(page.getByRole("button", { name: "Tap to start" })).toBeVisible();
});

test("never tapping ends in game over, and one tap tries again", async ({ page }) => {
  await startRun(page);
  // The don't-tap rounds pass; everything else smashes a bulb.
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible({ timeout: 150_000 });
  await expect(page.getByText("Got you")).toBeVisible();
  const retry = page.getByRole("button", { name: "Tap to try again" });
  await expect(retry).toHaveAttribute("aria-disabled", "false");
  await retry.click();
  await expect(page.getByText("GO!")).toBeVisible();

  // The cabinet page now knows about this device's save.
  await page.goto("/games/one-tap-chaos");
  await expect(page.getByText("Save found on this device")).toBeVisible();
  await expect(page.getByText("12/24")).toBeVisible();
});

test("the practice room plays one microgame, with no lives to lose", async ({ page }) => {
  await openGame(page);
  await page.getByRole("button", { name: "Practice room" }).click();
  await expect(page.getByRole("heading", { name: "Practice room" })).toBeVisible();
  // Locked ones say how to unlock them.
  await expect(page.getByText("Score 10 in a run to unlock").first()).toBeVisible();
  // DON'T!: not tapping is the win.
  await page.getByRole("button", { name: /^DON'T!/ }).click();
  await expect(page.getByRole("img", { name: "Practice: 1 won, 0 lost" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Quit to the menu" }).click();
  // SHOOT!: not tapping is a miss.
  await page.getByRole("button", { name: /^SHOOT!/ }).click();
  await expect(page.getByRole("img", { name: "Practice: 0 won, 1 lost" })).toBeVisible({ timeout: 15_000 });
});

test("calibration measures your taps and saves the offset", async ({ page }) => {
  await openGame(page);
  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByText("Not calibrated yet.")).toBeVisible();
  await page.getByRole("button", { name: "Calibrate" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  // Listen for 4 beats, then tap along for 12 (100 BPM: a beat every 600 ms).
  await expect(page.getByText(/^Tap! \d+/)).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(600);
  }
  await expect(page.getByRole("button", { name: "Use this" })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Use this" }).click();
  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByText("Not calibrated yet.")).toBeHidden();
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
});

test("the demo plays itself, and any key stops it", async ({ page }) => {
  await openGame(page);
  await page.getByRole("button", { name: "Watch the demo" }).click();
  await expect(page.getByText("DEMO · tap to stop")).toBeVisible();
  await expect(pill(page)).not.toHaveText("", { timeout: 8_000 });
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Tap to start" })).toBeVisible();
});

test("Daily Chaos is today's numbered run", async ({ page }) => {
  await openGame(page);
  const daily = page.getByRole("button", { name: /^Daily Chaos #\d+/ });
  await expect(daily).toBeVisible();
  await daily.click();
  await expect(page.getByText("GO!")).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Quit to the menu" }).click();
  await expect(daily).toBeVisible();
});

test("only one tab plays at a time", async ({ page, context }) => {
  await openGame(page);
  const second = await context.newPage();
  await second.goto("/games/one-tap-chaos/play");
  await expect(page.getByRole("heading", { name: "One Tap Chaos is open in another tab" })).toBeVisible();
  await page.getByRole("button", { name: "Play here instead" }).click();
  await expect(second.getByRole("heading", { name: "One Tap Chaos is open in another tab" })).toBeVisible();
});
