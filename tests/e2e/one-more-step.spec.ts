// One More Step end to end (Plan/01-one-more-step.md §14), against the real static build, on a computer and a
// phone. That every level can be solved, in exactly its par's step count, is proven by the unit tests (the
// solver replays every one); these check the real thing: the hop, real keys and swipes, death and undo, the
// finale's fake levels and its ten waits, the save, the screens.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:one-more-step";
const WORLD_LEVELS = [1, 2, 3, 4, 5].flatMap((w) => Array.from({ length: 8 }, (_, k) => `${w}-${k + 1}`));

/** Start with these levels done (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: string[] = [], hopped = true) {
  await page.addInitScript(
    ({ key, cleared, hopped }) => {
      if (sessionStorage.getItem("oms-seeded")) return;
      sessionStorage.setItem("oms-seeded", "1");
      const levels: Record<string, unknown> = {};
      for (const id of cleared) levels[id] = { clears: 1, stars: 3, best: 99 };
      localStorage.setItem(key, JSON.stringify({ v: 1, levels, achievements: {}, stats: { steps: 0, undos: 0, deaths: 0, echoDeaths: 0, resets: 0 }, hopped, finished: false, prefs: { dpad: false, swipe: 24, coords: false } }));
    },
    { key: SAVE_KEY, cleared, hopped },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);

async function title(page: Page) {
  await page.goto("/games/one-more-step/play");
  await expect(page.locator("button[data-play]")).toBeEnabled({ timeout: 10_000 });
}

/** From the title, through the map, into a level. */
async function open(page: Page, id: string) {
  await title(page);
  await page.locator("button[data-open-map]").click();
  await page.locator(`[data-node="${id}"]`).click();
  await expect(page.locator(`[data-game-area][data-level="${id}"]`)).toBeVisible();
}

/** Real key presses, a step's animation apart (the game queues two at most). */
async function keys(page: Page, ...presses: string[]) {
  for (const key of presses) {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  }
}

const area = (page: Page) => page.locator("[data-game-area]");

test("the first time you go for Start it hops out of the way (once, ever); then it starts level 1-1", async ({ page, isMobile }) => {
  await seed(page, [], false);
  await title(page);
  const start = page.locator("button[data-play]");
  const before = (await start.boundingBox())!;
  // A mouse hovering it, or the first tap.
  if (isMobile) await start.tap();
  else await start.hover();
  await expect.poll(async () => (await start.boundingBox())!.x).not.toBe(before.x);
  await expect.poll(async () => (await stored(page))?.hopped).toBe(true);
  const after = (await start.boundingBox())!;
  const map = (await page.locator("button[data-open-map]").boundingBox())!;
  expect(after.x + after.width <= map.x || map.x + map.width <= after.x || after.y + after.height <= map.y || map.y + map.height <= after.y).toBe(true);
  if (isMobile) await start.tap();
  else await start.click();
  await expect(page.locator('[data-game-area][data-level="1-1"]')).toBeVisible();
  // It never hops again.
  await title(page);
  const again = (await start.boundingBox())!;
  if (!isMobile) await start.hover();
  await page.waitForTimeout(300);
  expect((await start.boundingBox())!.x).toBe(again.x);
});

test("level 1-1 with real keys: six steps right catch the door, three stars, saved, and on to 1-2", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page);
  await title(page);
  await page.locator("button[data-play]").click();
  await expect(area(page)).toHaveAttribute("data-level", "1-1");
  await expect(page.locator("[data-narrator]")).toContainText("The exit is right there");
  await keys(page, ...Array<string>(6).fill("ArrowRight"));
  const card = page.locator("[data-cleared]");
  await expect(card).toBeVisible();
  await expect(card).toContainText("6 steps");
  await expect(card.locator("[data-on]")).toHaveCount(3);
  await expect.poll(async () => (await stored(page))?.levels["1-1"]).toEqual({ clears: 1, stars: 7, best: 6 });
  expect((await stored(page)).stats.steps).toBe(6);
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-game-area][data-level="1-2"]')).toBeVisible();
});

test("dying: the prompt offers undo, undo takes the step back, R starts again", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, WORLD_LEVELS.slice(0, 32));
  await open(page, "5-1");
  // Lazy spikes: up, and they only move when you wait.
  await keys(page, "ArrowRight", "ArrowRight");
  await expect(area(page)).toHaveAttribute("data-status", "dead");
  await expect(page.locator('[data-dead="spikes"]')).toBeVisible();
  await page.locator("[data-undo-death]").click();
  await expect(area(page)).toHaveAttribute("data-status", "play");
  await expect(area(page)).toHaveAttribute("data-steps", "1");
  await expect(page.locator("[data-narrator]")).toContainText("Taking it back? Bold.");
  await keys(page, "r");
  await expect(area(page)).toHaveAttribute("data-steps", "0");
  await expect.poll(async () => (await stored(page))?.stats).toMatchObject({ deaths: 1, undos: 1 });
});

test("no take-backs: World 5's taped-over undo, and dying means from the top", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, WORLD_LEVELS.slice(0, 35));
  await open(page, "5-4");
  await expect(page.locator("button[data-undo]")).toBeDisabled();
  await expect(page.locator("button[data-undo]")).toHaveAccessibleName(/taped over/);
  await keys(page, "ArrowRight");
  await keys(page, "z");
  await expect(area(page)).toHaveAttribute("data-steps", "1");
  // Back, then forward again: the crumbly tile you left is a hole now.
  await keys(page, "ArrowLeft", "ArrowRight");
  await expect(page.locator('[data-dead="hole"]')).toContainText("No take-backs. From the top.");
  await expect(page.locator("[data-undo-death]")).toHaveCount(0);
  await page.locator("[data-dead]").getByRole("button", { name: "Restart" }).click();
  await expect(area(page)).toHaveAttribute("data-steps", "0");
  await expect(area(page)).toHaveAttribute("data-status", "play");
});

test("the finale: step on the door and it's 'Level 6-2'; wait ten times and the door comes to you", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, WORLD_LEVELS);
  await open(page, "6-1");
  await expect(page.locator("[data-narrator]")).toHaveText("One more step!");
  await keys(page, "ArrowRight");
  await expect(page.locator("[data-level-title]")).toContainText("Level 6-2");
  await expect(page.locator("[data-narrator]")).toHaveText("Level 6-2! One more step!");
  await keys(page, "ArrowRight");
  await expect(page.locator("[data-level-title]")).toContainText("Level 6-3");
  await keys(page, ...Array<string>(5).fill("Space"));
  await expect(page.locator("[data-narrator]")).toHaveText("Come on.");
  await keys(page, ...Array<string>(5).fill("Space"));
  const card = page.locator("[data-cleared]");
  await expect(card).toBeVisible();
  await expect(card).toContainText("It came to you.");
  await expect(page.locator("[data-narrator]")).toHaveText("Sometimes the best step is no step.");
  await expect.poll(async () => (await stored(page))?.finished).toBe(true);
  const save = await stored(page);
  expect(save.achievements["zero-steps"]).toBeGreaterThan(0);
  expect(save.stats.resets).toBe(2);
  await card.locator("button[data-next]").click();
  await expect(page.locator('[data-node="6-1"]')).toBeVisible();
});

test("the map: done levels show their stars; the next one's open, the rest locked", async ({ page }) => {
  await seed(page, ["1-1", "1-2"]);
  await title(page);
  await expect(page.locator("[data-totals]")).toContainText("2 of 41 levels");
  await page.locator("button[data-open-map]").click();
  await expect(page.locator('[data-node="1-1"]')).toBeEnabled();
  await expect(page.locator('[data-node="1-3"]')).toBeEnabled();
  await expect(page.locator('[data-node="1-3"]')).toHaveAttribute("aria-current", "true");
  await expect(page.locator('[data-node="1-4"]')).toBeDisabled();
  await expect(page.locator('[data-node="6-1"]')).toBeDisabled();
});

test("options are saved: the D-pad, the swipe distance, grid coordinates", async ({ page }) => {
  await seed(page);
  await title(page);
  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Options" });
  await options.getByRole("switch", { name: "On-screen D-pad" }).click();
  await options.getByRole("switch", { name: "Grid coordinates" }).click();
  await options.locator("[data-swipe]").fill("40");
  await expect.poll(async () => (await stored(page))?.prefs).toEqual({ dpad: true, swipe: 40, coords: true });
});

test("on a phone: swipe to step, tap the tile next to you, tap yourself to wait, or use the D-pad", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await seed(page);
  await title(page);
  await page.locator("button[data-play]").tap();
  await expect(area(page)).toHaveAttribute("data-level", "1-1");
  await expect(page.getByText("Swipe to step")).toBeVisible();
  const box = (await page.locator("[data-game-area] canvas").boundingBox())!;
  // A real finger swiping right.
  const cdp = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let k = 1; k <= 6; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + k * 12, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(area(page)).toHaveAttribute("data-steps", "1");
  await page.waitForTimeout(200);
  // Taps: the tile to your right, then yourself. Where the tiles are, as the game lays out 1-1 (9 by 3).
  const t = Math.floor(Math.min((box.width - 16) / 9, (box.height - 24) / 3.4));
  const ox = box.x + Math.round((box.width - t * 9) / 2);
  const oy = box.y + Math.round((box.height - t * 3) / 2 + t * 0.2);
  const tap = (cx: number) => page.touchscreen.tap(ox + (cx + 0.5) * t, oy + 1.5 * t);
  await tap(3);
  await expect(area(page)).toHaveAttribute("data-steps", "2");
  await page.waitForTimeout(200);
  await tap(3);
  await expect(area(page)).toHaveAttribute("data-steps", "3");
  // The D-pad.
  await page.locator("button[data-menu-button]").tap();
  await page.locator("[data-menu]").getByRole("button", { name: "Options" }).tap();
  await page.getByRole("dialog", { name: "Options" }).getByRole("switch", { name: "On-screen D-pad" }).tap();
  await page.keyboard.press("Escape");
  await page.locator("button[data-resume]").tap();
  await page.getByRole("button", { name: "Step right" }).tap();
  await expect(area(page)).toHaveAttribute("data-steps", "4");
});
