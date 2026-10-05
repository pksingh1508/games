// Panic Stack end to end (Plan/11-panic-stack.md §14), against the real static build, on a computer and a phone.
// That every level can be built is proven by the unit tests (a careful stacker plays each one through the real
// simulation); these play the real thing with a real hand: a mouse, or a finger (touch events), picking things
// up off the belt, tap-testing them, carrying them over and putting them down. Then the cards, Oops, Zen,
// hold-to-drop, the keyboard, the guide, the locks, the Daily Stack, Endless and the save.
import { expect, test, type CDPSession, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:panic-stack";
const LEVELS = [1, 2, 3, 4, 5, 6].flatMap((w) => [1, 2, 3, 4, 5, 6].map((l) => `${w}-${l}`));

interface Seed {
  cleared?: string[];
  prefs?: Record<string, unknown>;
  seen?: string[];
  known?: string[];
}

/** Start with these levels done and these preferences (once per test: reloads keep what the game saved). */
async function seed(page: Page, { cleared = [], prefs = {}, seen = [], known = [] }: Seed = {}) {
  await page.addInitScript(
    ({ key, cleared, prefs, seen, known }) => {
      if (sessionStorage.getItem("ps-seeded")) return;
      sessionStorage.setItem("ps-seeded", "1");
      const levels: Record<string, unknown> = {};
      for (const id of cleared) levels[id] = { clears: 1, stars: 1, best: 3600, noOops: false, noBreak: false };
      const at = Object.fromEntries;
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          levels,
          achievements: {},
          stats: { placed: 0, fallen: 0, broken: 0, fakePanics: 0, taps: 0, oopses: 0, playTicks: 0 },
          endless: { best: 0, runs: 0 },
          daily: {},
          seen: at(seen.map((s: string) => [s, 1])),
          known: at(known.map((s: string) => [s, 1])),
          prefs: { zen: false, slowBelt: false, holdToDrop: false, rotateButtons: "auto", reduceShake: false, ...prefs },
        }),
      );
    },
    { key: SAVE_KEY, cleared, prefs, seen, known },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
const area = (page: Page) => page.locator("[data-game-area]");

async function title(page: Page) {
  await page.goto("/games/panic-stack/play");
  await expect(page.locator("button[data-play]")).toBeEnabled({ timeout: 10_000 });
}

/** From the title, through the map, into a level, past its start card. */
async function open(page: Page, id: string, start = true) {
  await title(page);
  await page.locator("button[data-play]").click();
  const location = ["kitchen", "warehouse", "toyroom", "museum", "bakery", "space"][Number(id[0]) - 1]!;
  await page.locator(`[data-location="${location}"]`).click();
  await page.locator(`[data-level-tile="${id}"]`).click();
  await expect(page.locator(`[data-game-area][data-level="${id}"][data-ready]`)).toBeVisible();
  if (start) await page.locator("[data-start]").click();
}

interface BeltItem {
  uid: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What's on the belt, where (page px), nearest the drop first. */
async function belt(page: Page): Promise<BeltItem[]> {
  const stage = (await page.locator("[data-stage]").boundingBox())!;
  const items = await page.locator("[data-belt-item]").evaluateAll((els) => els.map((e) => ({ uid: (e as HTMLElement).dataset.uid!, kind: (e as HTMLElement).dataset.kind!, box: (e as HTMLElement).dataset.box!.split(",").map(Number) })));
  return items
    .map((i) => ({ uid: i.uid, kind: i.kind, x: stage.x + i.box[0]! + i.box[2]! / 2, y: stage.y + i.box[1]! + i.box[3]! / 2, w: i.box[2]!, h: i.box[3]! }))
    .filter((i) => i.x > stage.x + 20 && i.x < stage.x + stage.width - 20)
    .sort((a, b) => a.x - b.x);
}

/** A world point (m) on the page (px), from the camera the game publishes. */
async function onScreen(page: Page, x: number, y: number) {
  const stage = page.locator("[data-stage]");
  const box = (await stage.boundingBox())!;
  const [scale, ox, oy] = (await stage.getAttribute("data-camera"))!.split(",").map(Number) as [number, number, number];
  return { x: box.x + ox + x * scale, y: box.y + oy - y * scale, scale };
}

/** A hand: the mouse, or a finger (Chrome's touch events: synthetic pointers can't be held). */
class Hand {
  private cdp: CDPSession | null = null;
  constructor(
    private readonly page: Page,
    private readonly touch: boolean,
  ) {}
  private async send(type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) {
    this.cdp ??= await this.page.context().newCDPSession(this.page);
    await this.cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
  }
  async down(x: number, y: number) {
    if (this.touch) await this.send("touchStart", x, y);
    else {
      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
    }
  }
  async move(x: number, y: number, steps = 12) {
    if (!this.touch) return this.page.mouse.move(x, y, { steps });
    for (let k = 1; k <= steps; k++) {
      await this.send("touchMove", this.last.x + ((x - this.last.x) * k) / steps, this.last.y + ((y - this.last.y) * k) / steps);
      await this.page.waitForTimeout(16);
    }
    this.last = { x, y };
  }
  private last = { x: 0, y: 0 };
  async up() {
    if (this.touch) await this.send("touchEnd");
    else await this.page.mouse.up();
  }
  async tap(x: number, y: number) {
    if (this.touch) {
      await this.send("touchStart", x, y);
      await this.page.waitForTimeout(50);
      await this.send("touchEnd");
    } else await this.page.mouse.click(x, y);
  }
  /** Pick a belt item up (press and hold), carry it to (x, y) in the world, lower it gently, let go. */
  async place(item: BeltItem, x: number, y: number, release = true) {
    const scale = (await onScreen(this.page, 0, 0)).scale;
    const half = item.h / scale / 2;
    // A finger carries things 0.6 m above itself.
    const lift = this.touch ? 0.6 : 0;
    const over = await onScreen(this.page, x, y + half + 0.6 - lift);
    const low = await onScreen(this.page, x, y + half + 0.12 - lift);
    await this.down(item.x, item.y);
    this.last = { x: item.x, y: item.y };
    await this.page.waitForTimeout(260);
    await this.move(over.x, over.y, 20);
    await this.page.waitForTimeout(500);
    await this.move(low.x, low.y, 10);
    await this.page.waitForTimeout(600);
    if (release) await this.up();
  }
}

const top = async (page: Page) => Number(await area(page).getAttribute("data-top"));

test("1-1 with a real hand: tap-test, pick up, stack to the line, three stars, saved, on to 1-2", async ({ page, isMobile }) => {
  await seed(page);
  await title(page);
  await expect(page.locator("[data-title-tower]")).toBeVisible();
  // Play: the tower of letters falls over, into the map.
  await page.locator("button[data-play]").click();
  await expect(page.locator("[data-map-screen]")).toBeVisible();
  await expect(page.locator('[data-level-tile="1-2"]')).toBeDisabled();
  await page.locator('[data-level-tile="1-1"]').click();
  await expect(page.locator("[data-card=start]")).toContainText("Plate Stack");
  await expect(page.locator("[data-new]")).toContainText("Plate");
  await page.locator("[data-start]").click();
  const hand = new Hand(page, isMobile);

  // The tap test: a quick tap plays its true sound, with a caption.
  await expect.poll(async () => (await belt(page)).length).toBeGreaterThan(0);
  const first = (await belt(page))[0]!;
  await hand.tap(first.x, first.y);
  await expect(page.locator("[data-caption]")).toContainText(first.kind === "plate" ? "clack" : first.kind === "loaf" ? "thup" : "clunk");

  for (let n = 0; n < 9 && (await area(page).getAttribute("data-status")) === "play"; n++) {
    const items = await belt(page);
    if (!items.length) {
      await page.waitForTimeout(400);
      continue;
    }
    await hand.place(items[0]!, 0, await top(page));
    await page.waitForTimeout(1200);
  }
  await expect(page.locator("[data-end=won]")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("[data-stars]")).toHaveAttribute("data-stars", "3");
  await expect.poll(async () => (await stored(page))?.levels?.["1-1"]?.stars).toBe(7);
  await expect.poll(async () => !!(await stored(page))?.seen?.plate).toBe(true);
  await page.locator("[data-next]").click();
  await expect(page.locator('[data-game-area][data-level="1-2"]')).toBeVisible();
});

test("Oops puts things back as they were before the last drop, once a level", async ({ page, isMobile }) => {
  await seed(page);
  await open(page, "1-1");
  const hand = new Hand(page, isMobile);
  await expect.poll(async () => (await belt(page)).length).toBeGreaterThan(0);
  const item = (await belt(page))[0]!;
  // Put it down off the edge of the platform: it falls.
  await hand.place(item, -2.5, 0.8);
  await expect(area(page)).toHaveAttribute("data-falls", "1");
  await expect(page.locator("[data-oops]")).toBeEnabled();
  if (isMobile) await page.locator("[data-oops]").tap();
  else await page.keyboard.press("Space");
  await expect(area(page)).toHaveAttribute("data-falls", "0");
  // It's back on the belt, and the Oops is spent.
  await expect.poll(async () => (await belt(page)).some((b) => b.uid === item.uid)).toBe(true);
  await expect(page.locator("[data-oops]")).toBeDisabled();
});

test("three falls and it's over; the fail card's Oops can rescue it", async ({ page, isMobile }) => {
  await seed(page);
  await open(page, "1-1");
  const hand = new Hand(page, isMobile);
  for (let n = 1; n <= 3; n++) {
    await expect.poll(async () => (await belt(page)).length).toBeGreaterThan(0);
    await hand.place((await belt(page))[0]!, n % 2 ? -2.5 : 2.5, 0.8);
    await expect(area(page)).toHaveAttribute("data-falls", String(n));
  }
  await expect(page.locator("[data-end=lost]")).toBeVisible();
  await expect(page.locator("[data-end=lost]")).toContainText("Three things fell");
  await page.locator("[data-oops-card]").click();
  await expect(area(page)).toHaveAttribute("data-phase", "play");
  await expect(area(page)).toHaveAttribute("data-falls", "2");
});

test("pausing stops the clock; Esc carries on", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page);
  await open(page, "1-1");
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-card=paused]")).toBeVisible();
  const clock = await page.locator("[data-clock]").textContent();
  await page.waitForTimeout(2200);
  await expect(page.locator("[data-clock]")).toHaveText(clock!);
  await page.keyboard.press("Escape");
  await expect(area(page)).toHaveAttribute("data-phase", "play");
  await expect(page.locator("[data-clock]")).not.toHaveText(clock!, { timeout: 3000 });
});

test("with no mouse at all: 1 picks up, the arrow keys carry, Q turns, Enter drops", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page);
  await open(page, "1-1");
  await expect.poll(async () => (await belt(page)).length).toBeGreaterThan(0);
  // Screen readers get the belt in words: what 1, 2 and 3 would pick up.
  await expect(page.locator("[data-belt-summary]")).toContainText("1: Plate");
  const before = (await belt(page)).length;
  await page.keyboard.press("Digit1");
  await expect.poll(async () => (await belt(page)).length).toBe(before - 1);
  // Carry it down and toward the middle, then let go.
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(700);
  await page.keyboard.up("ArrowDown");
  await page.keyboard.press("KeyQ");
  await page.keyboard.press("KeyE");
  await expect(page.locator("[data-belt-summary]")).toContainText("You're holding the Plate");
  await page.keyboard.press("Enter");
  await expect.poll(() => top(page), { timeout: 8000 }).toBeGreaterThan(0.1);
  await expect.poll(async () => (await stored(page))?.stats?.placed).toBe(1);
});

test("Zen mode: no clock, no falls, no panic; the belt waits", async ({ page }) => {
  await seed(page);
  await title(page);
  await page.locator("button[data-play]").click();
  await page.locator("#ps-map-zen").click();
  await expect.poll(async () => (await stored(page))?.prefs?.zen).toBe(true);
  await page.locator('[data-level-tile="1-1"]').click();
  await expect(page.locator("[data-zen]")).toBeVisible();
  await page.locator("[data-start]").click();
  await expect(page.locator("[data-clock]")).toHaveCount(0);
  await expect(page.locator("[data-fall-marks]")).toHaveCount(0);
  await expect(page.locator("[data-panic]")).toHaveCount(0);
  // The first item would have dropped off the end by now: in Zen it waits.
  await page.waitForTimeout(10_000);
  await expect(area(page)).toHaveAttribute("data-falls", "0");
  expect((await belt(page)).length).toBeGreaterThan(0);
});

test("hold to drop: letting go keeps hold, the Drop button lets go", async ({ page, isMobile }) => {
  await seed(page, { prefs: { holdToDrop: true } });
  await open(page, "1-1");
  const hand = new Hand(page, isMobile);
  await expect.poll(async () => (await belt(page)).length).toBeGreaterThan(0);
  await hand.place((await belt(page))[0]!, 0, 0);
  // Still held.
  await page.waitForTimeout(800);
  await expect(page.locator("[data-drop]")).toBeVisible();
  expect(await top(page)).toBe(0);
  await page.locator("[data-drop]").click();
  await expect.poll(() => top(page), { timeout: 8000 }).toBeGreaterThan(0.1);
  await expect(page.locator("[data-drop]")).toHaveCount(0);
});

test("the item guide fills in as you meet things; a liar's secret once you've put one down", async ({ page }) => {
  await seed(page, { seen: ["brick", "safe", "feather", "earthquake"], known: ["safe"] });
  await title(page);
  await page.locator("[data-open-guide]").click();
  const guide = page.locator("[data-guide]");
  await expect(guide.locator('[data-guide-item="brick"]')).toContainText("Brick");
  await expect(guide.locator('[data-guide-item="safe"]')).toContainText("full of helium");
  // Seen, not yet found out.
  await expect(guide.locator('[data-guide-item="feather"]')).toContainText("isn't right");
  await expect(guide.locator('[data-guide-item="feather"]')).not.toContainText("anvil");
  await expect(guide.locator('[data-guide-event="earthquake"]')).toContainText("seismograph");
  await expect(guide.getByText("You haven't met this one.").first()).toBeVisible();
});

test("the Daily Stack opens after the Toy Room: two minutes, your best height, a share card", async ({ page }) => {
  await seed(page);
  await title(page);
  await expect(page.locator("button[data-daily]")).toBeDisabled();
  // The Toy Room done (the first eighteen levels).
  await page.evaluate(
    ({ key, ids }) => {
      const save = JSON.parse(localStorage.getItem(key)!);
      for (const id of ids) save.levels[id] = { clears: 1, stars: 1, best: 3600, noOops: false, noBreak: false };
      localStorage.setItem(key, JSON.stringify(save));
    },
    { key: SAVE_KEY, ids: LEVELS.slice(0, 18) },
  );
  await page.reload();
  await expect(page.locator("button[data-daily]")).toBeEnabled({ timeout: 10_000 });
  await page.locator("button[data-daily]").click();
  await expect(page.locator('[data-game-area][data-mode="daily"]')).toBeVisible();
  await expect(page.locator("[data-card=start]")).toContainText("Two minutes");
  await page.locator("[data-start]").click();
  await expect(page.locator("[data-height]")).toContainText("best");
});

test("the Endless Tower: no clock, a height that counts once it holds", async ({ page, isMobile }) => {
  await seed(page);
  await title(page);
  await page.locator("button[data-endless]").click();
  await expect(page.locator('[data-game-area][data-mode="endless"]')).toBeVisible();
  await page.locator("[data-start]").click();
  const hand = new Hand(page, isMobile);
  await expect.poll(async () => (await belt(page)).length).toBeGreaterThan(0);
  await hand.place((await belt(page))[0]!, 0, 0);
  // Held still for three seconds, the height counts.
  await expect(page.locator("[data-height]")).toContainText(/best 0\.[1-9]/, { timeout: 10_000 });
});

test("options save, and the cabinet page reads the save", async ({ page }) => {
  await seed(page, { cleared: ["1-1", "1-2"] });
  await title(page);
  await page.getByRole("button", { name: "Options" }).click();
  await page.locator("#ps-slow").click();
  await page.locator('[data-rotate-buttons="on"]').click();
  await expect.poll(async () => (await stored(page))?.prefs).toMatchObject({ slowBelt: true, rotateButtons: "on" });
  await page.keyboard.press("Escape");
  await page.goto("/games/panic-stack");
  await expect(page.getByText("Save found on this device")).toBeVisible();
  await expect(page.getByText("2/36")).toBeVisible();
});
