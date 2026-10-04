// Gravity Is Lying end to end (Plan/15-gravity-is-lying.md §14), against the real static build, on a
// computer and on a phone. That every room can be cleared (with every apple, fairly) is proven by
// the unit tests; these check the real thing: the loop, the input, the screens and the saves.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:gravity-is-lying";
const WORLD = (w: number) => Array.from({ length: w === 6 ? 4 : 8 }, (_, i) => `${w}-0${i + 1}`);

/** Start with these rooms cleared (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: string[], { motionSeen = true } = {}) {
  await page.addInitScript(
    ({ key, cleared, motionSeen }) => {
      if (sessionStorage.getItem("gil-seeded")) return;
      sessionStorage.setItem("gil-seeded", "1");
      const rooms: Record<string, unknown> = {};
      for (const id of cleared) rooms[id] = { clears: 1, deaths: 1, best: 600, apples: 0b011, clean: false, rotated: false, assisted: false };
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          rooms,
          deaths: 3,
          ceilingTicks: 0,
          achievements: {},
          finished: false,
          seen: { motion: motionSeen },
          stats: { playTicks: 0 },
          last: null,
          prefs: { controls: "newt", assist: { trueArrow: false, slow: false, invincible: false }, truthMode: false, clock: false, touchSize: "m", touchSwap: false, keys: null },
        }),
      );
    },
    { key: SAVE_KEY, cleared, motionSeen },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
/** A room on screen, its loop running (ready for input). */
const playing = (page: Page, id: string) => page.locator(`[data-room="${id}"][data-ready]`);
const deaths = (page: Page) => page.locator("[data-deaths]");
/** The angle the HUD's gravity arrow is turned to (degrees; 0 points down). */
const arrowAngle = async (page: Page) => {
  const style = (await page.locator("[data-needle]").getAttribute("style")) ?? "";
  const turn = /rotate\((-?[\d.]+)deg\)/.exec(style);
  return turn ? Math.round(Number(turn[1])) : null;
};

async function openGame(page: Page) {
  await page.goto("/games/gravity-is-lying/play");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
}

async function openRoom(page: Page, id: string) {
  await openGame(page);
  await page.getByRole("button", { name: "Map" }).click();
  await page.locator(`[data-world="${id[0]}"]`).click();
  // The next room to play bobs up and down: don't wait for it to hold still.
  await page.locator(`[data-room-tile="${id}"]`).click({ force: true });
}

test("START: the menu falls up, and a new player goes straight into 1-1, where Isaac says hello", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones tap (below)");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByText("← → walk · Space jumps · walk into a lever to pull it · R restarts")).toBeVisible();
  await expect(page.locator('[data-bubble="isaac"]')).toContainText("Welcome to the Lab");
  await expect(page.getByRole("img", { name: "Gravity arrow" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("on a phone, START starts, with buttons to walk, jump and flip", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).tap();
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByRole("group", { name: "Walk" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jump" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Flip gravity" })).toBeVisible();
});

test("walk into the lever: gravity points up, and the arrow in the corner says so", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  await expect.poll(() => arrowAngle(page)).toBe(0);
  await page.keyboard.down("ArrowRight");
  await expect.poll(() => arrowAngle(page), { timeout: 8_000 }).toBe(180);
  await page.keyboard.up("ArrowRight");
});

test("spikes start the room again at once, and count; R restarts without counting", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, WORLD(1).slice(0, 3));
  await openRoom(page, "1-04");
  await expect(playing(page, "1-04")).toBeVisible();
  // Straight along the floor, into the spikes at column 8.
  await page.keyboard.down("ArrowRight");
  await expect(deaths(page)).toHaveAttribute("data-deaths", "1", { timeout: 6_000 });
  await page.keyboard.up("ArrowRight");
  await expect(page.locator("[data-room]")).toHaveAttribute("data-status", "play", { timeout: 2_000 });
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(150);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(300);
  await expect(deaths(page)).toHaveAttribute("data-deaths", "1");
  await expect.poll(async () => (await stored(page))?.rooms?.["1-04"]?.deaths).toBe(1);
});

test("clear a room (hop between planets): the next one starts with how it went, and it's saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, [1, 2, 3, 4].flatMap(WORLD));
  await openRoom(page, "5-01");
  await expect(playing(page, "5-01")).toBeVisible();
  // Run round the big planet and jump at the right moment: the little one catches you, and its top
  // is the portal. Real time is never exact, so try a few times.
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.keyboard.press("KeyR");
    await page.waitForTimeout(400);
    // Walk for about 0.45 s (0.33 to 0.55 s works), then a full jump.
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(420 + (attempt % 3) * 30);
    await page.keyboard.down("Space");
    await page.waitForTimeout(300);
    await page.keyboard.up("Space");
    const cleared = await playing(page, "5-02")
      .waitFor({ timeout: 6_000 })
      .then(() => true)
      .catch(() => false);
    await page.keyboard.up("ArrowRight");
    if (cleared) break;
  }
  await expect(playing(page, "5-02")).toBeVisible();
  const card = page.locator('[data-toast="5-01"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("Small World");
  await expect.poll(async () => (await stored(page))?.rooms?.["5-01"]?.clears).toBe(1);

  // Progress survives a reload.
  await page.reload();
  await page.getByRole("button", { name: "Map" }).click();
  await page.locator('[data-world="5"]').click();
  await expect(page.locator('[data-room-tile="5-02"]')).toBeEnabled();
  await expect(page.locator('[data-room-tile="5-03"]')).toBeDisabled();
});

test("pause, options and assist: the true arrow, and the assist badge", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Options" }).click();
  await page.getByRole("switch", { name: "The true arrow" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Assist", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Gravity arrow" })).toHaveAttribute("title", "The true arrow (assist)");
  await expect.poll(async () => (await stored(page))?.prefs?.assist?.trueArrow).toBe(true);
});

test("before Tilted Town, a motion warning; with reduce motion the camera stays still and a frame shows the tilt", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard and mouse");
  await seed(page, [1, 2, 3].flatMap(WORLD), { motionSeen: false });
  await openRoom(page, "4-01");
  await expect(page.getByRole("dialog", { name: "The camera turns from here" })).toBeVisible();
  await page.getByRole("button", { name: "Turn on reduce motion" }).click();
  await expect(playing(page, "4-01")).toBeVisible();
  await expect(page.getByTitle(/How this room is turned/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("mfg:settings") ?? "null")?.motion)).toBe("reduce");
  await expect.poll(async () => (await stored(page))?.seen?.motion).toBe(true);
});

test("rooms open one after another, and worlds open as you climb", async ({ page }) => {
  await seed(page, WORLD(1).slice(0, 3));
  await openGame(page);
  await page.getByRole("button", { name: "Map" }).click();
  await expect(page.locator('[data-room-tile="1-04"]')).toBeEnabled();
  await expect(page.locator('[data-room-tile="1-05"]')).toBeDisabled();
  await expect(page.locator('[data-world="2"]')).toBeDisabled();
  await expect(page.locator('[data-world="6"]')).toBeDisabled();
});

test("on a phone, holding ▶ walks Newt into the lever", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).tap();
  await expect(playing(page, "1-01")).toBeVisible();
  // A held touch on the walk pad's right half (CDP: synthetic pointer events can't take pointer capture).
  const pad = (await page.getByRole("group", { name: "Walk" }).boundingBox())!;
  const client = await page.context().newCDPSession(page);
  const point = { x: pad.x + pad.width * 0.75, y: pad.y + pad.height / 2 };
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await expect.poll(() => arrowAngle(page), { timeout: 8_000 }).toBe(180);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
});
