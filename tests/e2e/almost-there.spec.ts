// Almost There end to end (Plan/08-almost-there.md §14), against the real static build, on a
// computer and on a phone. That the mountain can be climbed (fairly) is proven by the unit tests;
// these check the real thing: the loop, the input, the saves that make every fall stick, the fake
// summit's credits, and the real summit.
import { expect, test, type Page } from "@playwright/test";

const CLIMB_KEY = "mfg:game:almost-there:climb";
const SAVE_KEY = "mfg:game:almost-there";

interface Seed {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  grounded?: boolean;
  story?: "climbing" | "fallen";
  collapsed?: boolean;
  tick?: number;
}

/** A climb in progress, as the game saves it. */
function climbSave({ x, y, vx = 0, vy = 0, grounded = true, story = "climbing", collapsed = false, tick = 5000 }: Seed) {
  return {
    v: 1,
    climb: {
      engine: 1,
      mirrored: false,
      sim: {
        tick,
        pip: { x, y, w: 8, h: 12, vx, vy, rx: 0, ry: 0, grounded, charge: 0, latch: false, facing: 1, stun: 0, takeoff: y + 12, peak: y + 12, walked: 0, bounced: false },
        crumbles: [],
        collapsed,
        elevators: [{ offset: 0, phase: "idle", t: 0 }],
        feathers: 0,
        touchingJoke: -1,
        touchingFlag: false,
      },
      stats: { ticks: tick, jumps: 120, falls: 7, fallen: 2400, biggest: 900 },
      splits: { foothills: 0 },
      story,
      scripted: false,
      stand: { x, y },
      best: y + 12,
      assisted: false,
      checkpoints: [],
      chirp: { n: 0, quiet: 0 },
    },
  };
}

/** Start with this climb saved (once per test: reloads keep what the game saved since). */
async function seed(page: Page, seed: Seed) {
  await page.addInitScript(
    ({ key, value }) => {
      if (sessionStorage.getItem("at-seeded")) return;
      sessionStorage.setItem("at-seeded", "1");
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: CLIMB_KEY, value: climbSave(seed) },
  );
}

type SavedClimb = ReturnType<typeof climbSave>["climb"] | null;
const savedClimb = (page: Page): Promise<SavedClimb> => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.climb ?? null, CLIMB_KEY);
const record = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
const climbing = (page: Page) => page.locator("[data-zone][data-ready]");

async function openGame(page: Page) {
  await page.goto("/games/almost-there/play");
  await expect(page.locator("button[data-start]")).toBeVisible();
}

async function startClimb(page: Page) {
  await openGame(page);
  await page.locator("button[data-start]").click();
  await expect(climbing(page)).toBeVisible();
}

/** Wait until the saved climb has Pip standing (it's saved on every landing). */
async function landed(page: Page) {
  await expect.poll(async () => (await savedClimb(page))?.sim.pip.grounded, { timeout: 15_000 }).toBe(true);
  return (await savedClimb(page))!;
}

test("CLIMB starts at the foot of the mountain; the bar says 0%, and the climb is saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones tap (below)");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await expect(page.getByRole("heading", { name: "Almost There" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(climbing(page)).toBeVisible();
  await expect(page.locator("[data-zone=foothills]")).toBeVisible();
  await expect(page.locator("[data-progress]")).toHaveAttribute("data-progress", "0%");
  // The first sign explains the controls.
  await expect(page.locator("[data-sign]")).toContainText("Hold to charge. Let go to leap.");
  const climb = await savedClimb(page);
  expect(climb?.sim.pip).toMatchObject({ x: 41, grounded: true });
  expect(errors).toEqual([]);
});

test("hold to charge, let go to leap: the jump is saved the moment you leave the ground", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await startClimb(page);
  await page.keyboard.down("Space");
  await page.waitForTimeout(350);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.up("Space");
  // Saved at takeoff: in the air already. Chirp says hello.
  await expect.poll(async () => (await savedClimb(page))?.stats.jumps).toBe(1);
  await expect(page.locator("[data-chirp=sincere]")).toContainText("Up we go!");
  await page.keyboard.up("ArrowRight");
  const after = await landed(page);
  expect(after.sim.pip.x).toBeGreaterThan(41 + 20);
});

test("refreshing mid-fall never undoes it: you come back still falling, and land where you would have", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  const fall: Seed = { x: 60, y: 8440, vy: -4, grounded: false, tick: 6000 };
  // Without a refresh: where the fall ends.
  await seed(page, fall);
  await openGame(page);
  await page.locator("button[data-start]").click();
  const straight = await landed(page);

  // Again, refreshing halfway down.
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("about:blank");
  await seed(page, fall);
  await openGame(page);
  await page.locator("button[data-start]").click();
  await expect(climbing(page)).toBeVisible();
  await page.waitForTimeout(250);
  await page.reload();
  const midAir = await savedClimb(page);
  expect(midAir?.sim.pip.grounded).toBe(false);
  expect(midAir!.sim.tick).toBeGreaterThan(fall.tick!);
  // The title offers to carry on, and it carries on falling.
  await expect(page.getByRole("button", { name: "Continue your climb" })).toBeVisible();
  await page.getByRole("button", { name: "Continue your climb" }).click();
  const after = await landed(page);
  expect({ x: after.sim.pip.x, y: after.sim.pip.y }).toEqual({ x: straight.sim.pip.x, y: straight.sim.pip.y });
});

test("the pause menu tells the truth: the altitude in metres, and the climb is saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, { x: 300, y: 2908 });
  await openGame(page);
  await page.locator("button[data-start]").click();
  await expect(climbing(page)).toBeVisible();
  // The fake summit, so the bar says 90% (the truth: about two thirds of the way).
  await expect(page.locator("[data-progress]")).toHaveAttribute("data-progress", "90%");
  await page.keyboard.press("Escape");
  const dialog = page.getByRole("dialog", { name: "Paused" });
  await expect(dialog).toBeVisible();
  // 40 screens of 216 px, 20 px to the metre: the feet are at y 2920.
  await expect(dialog.locator("[data-honest-altitude]")).toHaveAttribute("data-honest-altitude", String(Math.round((40 * 216 - 2920) / 20)));
  await expect(dialog.locator("[data-honest-altitude] > div").first()).toContainText("286 m");
  await dialog.getByRole("button", { name: "Resume" }).click();
  await expect(dialog).toBeHidden();
});

test("the fake summit: plant the flag, THE END, the credits… and the ground gives way", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  test.setTimeout(120_000);
  await seed(page, { x: 300, y: 2908 });
  await openGame(page);
  await page.locator("button[data-start]").click();
  await expect(climbing(page)).toBeVisible();
  await page.keyboard.down("ArrowRight");
  await expect(page.locator("[data-credits]")).toBeVisible();
  await page.keyboard.up("ArrowRight");
  await expect(page.locator("[data-story=credits]")).toBeVisible();
  await expect(page.locator("[data-chirp=troll]")).toContainText("We did it!");
  // (Screen readers hear these too: look at what's drawn.)
  const credits = page.locator("[data-credits]");
  await expect(credits.getByText("THE END")).toBeVisible({ timeout: 10_000 });
  await expect(credits.getByText("Thanks for playing… so far")).toBeAttached({ timeout: 10_000 });
  await expect(credits.getByText("…just kidding.")).toBeVisible({ timeout: 20_000 });
  // The summit falls, and Pip with it. The bar can't cope.
  await expect(page.locator("[data-story=fallen]")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("[data-progress]")).toHaveAttribute("data-progress", "99.9%");
  const fallen = await landed(page);
  expect(fallen.sim.collapsed).toBe(true);
  // Down in the cave by the way in, four screens below, and that fall wasn't counted against you.
  expect(fallen.sim.pip.y).toBeGreaterThan(2908 + 4 * 216);
  expect(fallen.stats.falls).toBe(7);
  expect((await record(page)).achievements["fooled-once"]).toBeGreaterThan(0);
  // Seen once: next time the credits can be skipped.
  expect((await record(page)).seen.fakeSummit).toBe(true);
});

test("the real summit: the stats, the share card, and Mirror Mountain", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, { x: 428, y: 68, story: "fallen", collapsed: true });
  await openGame(page);
  await page.locator("button[data-start]").click();
  await expect(climbing(page)).toBeVisible();
  await page.keyboard.down("ArrowRight");
  await expect(page.locator("[data-story=summit]")).toBeVisible();
  await page.keyboard.up("ArrowRight");
  await expect(page.locator("[data-chirp]")).toContainText("We're… actually there.");
  await expect(page.locator("[data-ending]")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("[data-ending-line]")).toContainText("You fell 120 m.");
  expect(await savedClimb(page)).toBeNull();
  const saved = await record(page);
  expect(saved.climbs.finished).toBe(1);
  expect(saved.achievements["never-again"]).toBeGreaterThan(0);
  expect(saved.achievements["clean-climb"]).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Mirror Mountain" }).click();
  await expect(climbing(page)).toBeVisible();
  await expect(page.getByText("Mirror Mountain")).toBeVisible();
  expect((await savedClimb(page))?.mirrored).toBe(true);
  // No Chirp on Mirror Mountain.
  await page.waitForTimeout(1500);
  await expect(page.locator("[data-chirp]")).toHaveCount(0);
});

test("a new climb over an old one asks first", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, { x: 300, y: 2908 });
  await openGame(page);
  await expect(page.locator("[data-saved-climb]")).toContainText("The Summit");
  await page.getByRole("button", { name: "New climb" }).click();
  const dialog = page.getByRole("dialog", { name: "Start a new climb?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep climbing" }).click();
  expect((await savedClimb(page))?.sim.pip.y).toBe(2908);
  await page.getByRole("button", { name: "New climb" }).click();
  await page.locator("[data-confirm-new]").click();
  await expect(climbing(page)).toBeVisible();
  expect((await savedClimb(page))?.sim.pip.x).toBe(41);
});

test("on a phone: arrows on one side, a big jump button on the other; holding it charges", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await openGame(page);
  await page.locator("button[data-start]").tap();
  await expect(climbing(page)).toBeVisible();
  const jump = page.getByRole("button", { name: "Jump: hold to charge, let go to leap" });
  await expect(jump).toBeVisible();
  await expect(page.getByRole("group", { name: /Direction/ })).toBeVisible();
  const box = (await jump.boundingBox())!;
  // A real touch, held for a moment, then let go: a jump.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await page.waitForTimeout(300);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => (await savedClimb(page))?.stats.jumps).toBe(1);
});
