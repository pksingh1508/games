// Fake Floor end to end (Plan/05-fake-floor.md §14), against the real static build, on a computer
// and on a phone. That every room can be crossed (and fairly) is proven by the unit tests; these
// check the real thing: the loop, the input, the screens and the saves.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:fake-floor";
const WORLD = (w: number) => Array.from({ length: 10 }, (_, i) => `${w}-${String(i + 1).padStart(2, "0")}`);
const ALL = [1, 2, 3, 4, 5].flatMap(WORLD);

/** Start with these rooms cleared (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: string[]) {
  await page.addInitScript(
    ({ key, cleared }) => {
      if (sessionStorage.getItem("ff-seeded")) return;
      sessionStorage.setItem("ff-seeded", "1");
      const rooms: Record<string, unknown> = {};
      for (const id of cleared) rooms[id] = { clears: 1, falls: 1, thrown: 0, best: 600, clean: false, barefoot: true, quick: false, assisted: false, hidden: false };
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          rooms,
          falls: 0,
          fakeFalls: 0,
          thrown: 0,
          causes: {},
          trials: {},
          achievements: {},
          stats: { playTicks: 0 },
          last: null,
          prefs: { highContrast: false, clock: false, assist: { speed: 1, unlimited: false, nets: false }, touchSize: "m", touchSwap: false, keys: null },
        }),
      );
    },
    { key: SAVE_KEY, cleared },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
/** A room on screen, its loop running (ready for input). */
const playing = (page: Page, id: string) => page.locator(`[data-room="${id}"][data-ready]`);
const falls = (page: Page) => page.locator("[data-falls]");
const pebbles = (page: Page) => page.locator("[data-pebbles]");

async function openGame(page: Page) {
  await page.goto("/games/fake-floor/play");
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
}

async function openRoom(page: Page, id: string) {
  await openGame(page);
  await page.getByRole("button", { name: "Map" }).click();
  await page.locator(`[data-world="${id[0]}"]`).click();
  // The next room to play bobs up and down: don't wait for it to hold still.
  await page.locator(`[data-room-tile="${id}"]`).click({ force: true });
  await expect(playing(page, id)).toBeVisible();
}

/** 1-01, the Welcome Mat: jump the first tile from the start and walk to the door. */
async function crossWelcomeMat(page: Page) {
  await page.keyboard.down("Space");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("Space");
  await expect(playing(page, "1-02")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("ArrowRight");
}

test("START: the logo falls through the floor, and a new player goes straight into 1-01", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones tap (below)");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByText("← → walk · Space jumps · R restarts")).toBeVisible();
  expect(errors).toEqual([]);
});

test("on a phone, START starts, with buttons to move, jump and look ahead", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await openGame(page);
  await page.getByRole("button", { name: "Start" }).tap();
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByRole("group", { name: "Move" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jump" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Look ahead" })).toBeVisible();
});

test("the Welcome Mat drops you into a safety net; jump it, and the next room starts with how it went", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  // Straight onto the first tile: it's fake.
  await page.keyboard.down("ArrowRight");
  await expect(falls(page)).toHaveAttribute("data-falls", "1", { timeout: 6_000 });
  await page.keyboard.up("ArrowRight");
  await expect.poll(async () => (await stored(page))?.causes?.fake).toBe(1);
  // The net puts you back on safe ground (no restart): wait for it, then restart for a clean run-up.
  await page.waitForTimeout(1200);
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(200);
  await crossWelcomeMat(page);
  const card = page.locator('[data-toast="1-01"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("Welcome Mat");
  await expect(card).toContainText("Barefoot");
  await expect.poll(async () => (await stored(page))?.rooms?.["1-01"]).toMatchObject({ clears: 1, clean: false, barefoot: true });

  // Progress survives a reload.
  await page.reload();
  await page.getByRole("button", { name: "Map" }).click();
  await expect(page.locator('[data-room-tile="1-02"]')).toBeEnabled();
  await expect(page.locator('[data-room-tile="1-03"]')).toBeDisabled();
});

test("pebbles: F throws one at the floor ahead, a click throws one where you click, and they run out", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard and mouse");
  await seed(page, ["1-01", "1-02"]);
  await openRoom(page, "1-03");
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "3");
  await page.keyboard.press("KeyF");
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "2");
  const canvas = page.locator("[data-room] canvas");
  const box = (await canvas.boundingBox())!;
  // The fake tile at column 7, row 11 (480 × 272 canvas pixels).
  await page.mouse.click(box.x + ((7 * 16 + 8) / 480) * box.width, box.y + ((11 * 16 + 3) / 272) * box.height);
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "1");
  // The pebble never lies (and screen readers hear it too).
  await expect(page.locator("[data-message]")).toContainText("no floor there");
  await page.keyboard.press("KeyF");
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "0");
  await page.keyboard.press("KeyF");
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "0");
  await expect.poll(async () => (await stored(page))?.thrown).toBe(3);
});

test("on a phone, tapping a floor throws a pebble at it", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await seed(page, ["1-01", "1-02"]);
  await openRoom(page, "1-03");
  const box = (await page.locator("[data-room] canvas").boundingBox())!;
  await page.touchscreen.tap(box.x + ((10 * 16 + 8) / 480) * box.width, box.y + ((11 * 16 + 3) / 272) * box.height);
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "2");
});

test("a fall restarts the room at once; R restarts without counting one", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, WORLD(1).slice(0, 4));
  await openRoom(page, "1-05");
  // No safety nets here: straight into the fake at column 7.
  await page.keyboard.down("ArrowRight");
  await expect(falls(page)).toHaveAttribute("data-falls", "1", { timeout: 6_000 });
  await page.keyboard.up("ArrowRight");
  await expect(page.locator("[data-room]")).toHaveAttribute("data-status", "play", { timeout: 2_000 });
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(300);
  await expect(falls(page)).toHaveAttribute("data-falls", "1");
  await expect.poll(async () => (await stored(page))?.rooms?.["1-05"]?.falls).toBe(1);
});

test("pause, options and assist: unlimited pebbles, and a clear earns no medals", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await openGame(page);
  await page.keyboard.press("Enter");
  await expect(playing(page, "1-01")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Options" }).click();
  await page.getByRole("switch", { name: "Unlimited pebbles" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Assist", { exact: true })).toBeVisible();
  await expect(pebbles(page)).toHaveAttribute("data-pebbles", "unlimited");
  await crossWelcomeMat(page);
  await expect(page.locator('[data-toast="1-01"]')).toContainText("Assist on: no medals");
  await expect.poll(async () => (await stored(page))?.rooms?.["1-01"]).toMatchObject({ clears: 1, best: null, assisted: true, barefoot: false });
});

test("rooms open one after another, and storeys open as you climb", async ({ page }) => {
  await seed(page, WORLD(1).slice(0, 3));
  await openGame(page);
  await page.getByRole("button", { name: "Map" }).click();
  await expect(page.locator('[data-room-tile="1-04"]')).toBeEnabled();
  await expect(page.locator('[data-room-tile="1-05"]')).toBeDisabled();
  await expect(page.locator('[data-world="2"]')).toBeDisabled();
  await expect(page.locator('[data-world="6"]')).toBeDisabled();

  await page.evaluate(
    ({ key, ids }) => {
      const save = JSON.parse(localStorage.getItem(key)!);
      for (const id of ids) save.rooms[id] = { clears: 1, falls: 0, thrown: 0, best: 600, clean: true, barefoot: true, quick: true, assisted: false, hidden: false };
      localStorage.setItem(key, JSON.stringify(save));
    },
    { key: SAVE_KEY, ids: ALL },
  );
  await page.reload();
  await page.getByRole("button", { name: "Map" }).click();
  await page.locator('[data-world="6"]').click();
  await page.locator('[data-room-tile="6-01"]').click({ force: true });
  await expect(playing(page, "6-01")).toBeVisible();
});

test("a cleared world opens its time trial: ten rooms, one clock", async ({ page }) => {
  await seed(page, WORLD(1));
  await openGame(page);
  await page.getByRole("button", { name: "Map" }).click();
  await page.locator('[data-world="1"]').click();
  await page.getByRole("button", { name: /Time trial/ }).click();
  await expect(playing(page, "1-01")).toBeVisible();
  await expect(page.getByText("Time trial · 1/10")).toBeVisible();
  await expect(page.getByLabel("Time")).toBeVisible();
  await page.getByRole("button", { name: "Pause (Esc)" }).click();
  await expect(page.getByRole("button", { name: "Restart the time trial" })).toBeVisible();
  await page.getByRole("button", { name: "Back to the map" }).click();
  await expect(page.locator('[data-world="1"]')).toHaveAttribute("aria-selected", "true");
});
