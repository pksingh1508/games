// 99 Seconds end to end (Plan/03-99-seconds.md §14), against the real static build, on a computer and a phone. That
// every chapter's golden path escapes in one loop with room to spare, that timed events land on the same second
// every loop, that a player who works nothing out still gets out by the room's scratches, and that both endings are
// reachable are proven by the unit tests. These check the real thing, with the browser's clock under the test's
// control (Playwright's fake clock jumps the game a frame at a time): the title's countdown, Chapter 1 escaped by a
// player who knows the way (typed and tapped), a reset that empties your pockets but not your journal, the journal
// and a hidden tab holding the clock, the save surviving a reload, the kitchen without a loop clock, Hardcore without
// a journal, and the Clock Room's hundredth second to both endings and the credits.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:99-seconds";

/** Start with this save (once per test: reloads keep what the game saved): `done` chapters escaped. */
async function seed(page: Page, { done = 0, mode = "normal" }: { done?: number; mode?: "normal" | "hardcore" | "relaxed" } = {}) {
  await page.addInitScript(
    ({ key, done, mode }) => {
      if (sessionStorage.getItem("n9-seeded")) return;
      sessionStorage.setItem("n9-seeded", "1");
      localStorage.setItem("mfg:settings", JSON.stringify({ v: 2, sound: false, volume: { master: 0.8, music: 0.7, sfx: 0.8 }, motion: "system", reduceFlashing: false, jumpScares: false, textSize: "normal", colorblind: "off", tapOffsetMs: null }));
      const chapter = (escaped: boolean) => ({ progress: { loops: escaped ? 2 : 0, clues: {}, stuck: 0, streak: 0, hints: {}, scratches: [] }, done: escaped ? 1 : 0, escapedIn: escaped ? 2 : null, hints: 0, realMs: 0, single: { tries: 0, best: null } });
      localStorage.setItem(key, JSON.stringify({ v: 1, chapters: { "waiting-room": chapter(done >= 1), kitchen: chapter(done >= 2), "clock-room": chapter(done >= 3) }, totalLoops: done * 2, endings: { true: 0, paradox: 0 }, credits: false, achievements: {}, stretchBest: 0, prefs: { mode, subtitles: true } }));
    },
    { key: SAVE_KEY, done, mode },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
const area = (page: Page) => page.locator("[data-game-area]");
const display = async (page: Page) => Number(await area(page).getAttribute("data-display"));
const view = (page: Page) => area(page).getAttribute("data-view");

/** A click on a computer, a tap on a phone. */
async function press(page: Page, selector: string, isMobile: boolean) {
  if (isMobile) await page.locator(selector).tap();
  else await page.locator(selector).click();
}
const tap = (page: Page, hotspot: string, isMobile: boolean) => press(page, `[data-hotspot="${hotspot}"]`, isMobile);

/** Jump the game's clock: one frame a second (each one runs that second of the loop, events and all). */
async function advance(page: Page, ms: number) {
  for (; ms > 0; ms -= 1000) await page.clock.fastForward(Math.min(ms, 1000));
}

/** Let the loop run until the clock shows this many seconds left. */
async function runUntil(page: Page, left: number) {
  for (let i = 0; i < 600; i++) {
    const now = await display(page);
    if (now <= left) return;
    await page.clock.fastForward(Math.min(1000, Math.max(250, (now - left - 1) * 1000)));
  }
}

/** Turn to a wall (out of a close-up first). */
async function face(page: Page, wall: string, isMobile: boolean) {
  if ((await view(page))?.startsWith("closeup:")) await press(page, "[data-game-area] [data-back]", isMobile);
  for (let i = 0; i < 4; i++) {
    const now = await view(page);
    if (now === wall) break;
    await press(page, '[data-turn="right"]', isMobile);
    await expect(area(page)).not.toHaveAttribute("data-view", now ?? "");
  }
  await expect(area(page)).toHaveAttribute("data-view", wall);
}

/** A finger across the room (CDP: real touch events, so the browser makes the pointer events). */
async function swipe(page: Page, dx: number) {
  const box = (await page.locator("[data-stage]").boundingBox())!;
  const y = box.y + box.height * 0.3;
  const x = box.x + box.width / 2 - dx / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (dx * i) / 6, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

/** The tab hidden (or shown again), as far as the page can tell. */
async function tabHidden(page: Page, hidden: boolean) {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

/** Into a chapter's first loop. */
async function wakeUp(page: Page, chapter: "waiting-room" | "kitchen" | "clock-room" = "waiting-room") {
  await page.goto("/games/99-seconds/play");
  if (chapter === "waiting-room") await page.locator("[data-play]").click();
  else {
    await page.locator("[data-chapters]").click();
    await page.locator(`[data-play-chapter="${chapter}"]`).click();
  }
  await expect(page.locator(`[data-intro="${chapter}"]`)).toBeVisible();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
}

test("the title counts down from 99, and if you wait it out, you've been here before", async ({ page }) => {
  await page.clock.install();
  await seed(page);
  await page.goto("/games/99-seconds/play");
  const title = page.locator("[data-title-screen]");
  await expect(title).toHaveAttribute("data-left", /^9[89]$/);
  await expect(page.locator("[data-play]")).toHaveText("Press Start");
  for (let i = 0; i < 400 && (await title.getAttribute("data-left")) !== "0"; i++) await page.clock.fastForward(1000);
  await expect(title).toHaveAttribute("data-left", "0");
  await expect(page.locator("[data-play]")).toHaveText("You've been here before.");
});

test("Chapter 1 by someone who knows: 0742, through the mirror, the lever at ten, and stand in the doorway at zero", async ({ page, isMobile }) => {
  await page.clock.install();
  await seed(page);
  await wakeUp(page);
  await expect(area(page)).toHaveAttribute("data-view", "north");
  await tap(page, "keypad", isMobile);
  await expect(area(page)).toHaveAttribute("data-view", "closeup:keypad");
  if (isMobile) for (const d of "0742") await tap(page, `k${d}`, true);
  else for (const d of "0742") await page.keyboard.press(d);
  await tap(page, "kOK", isMobile);
  await expect(area(page)).toHaveAttribute("data-view", "north");
  await tap(page, "doorway", isMobile);
  // The same room, backwards: you're facing the chair.
  await expect(area(page)).toHaveAttribute("data-room", "mirror");
  await expect(area(page)).toHaveAttribute("data-view", "south");
  if (isMobile) {
    await press(page, '[data-turn="right"]', true);
    await press(page, '[data-turn="right"]', true);
  } else {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
  }
  await expect(area(page)).toHaveAttribute("data-view", "north");
  await runUntil(page, 9);
  await tap(page, "lever", isMobile);
  await tap(page, "doorway", isMobile);
  await expect(area(page)).toHaveAttribute("data-view", "closeup:doorway");
  await advance(page, 12_000);
  await expect(page.locator('[data-done="waiting-room"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-rank="time-lord"]')).toBeVisible();
  await expect.poll(async () => (await stored(page))?.chapters?.["waiting-room"]?.done).toBe(1);
  expect((await stored(page)).achievements).toHaveProperty("first-try");
  // The next chapter is open.
  await page.locator("[data-next]").click();
  await expect(page.locator('[data-intro="kitchen"]')).toBeVisible();
});

test("at zero the room resets: your pockets empty, your journal doesn't", async ({ page, isMobile }) => {
  await page.clock.install();
  await seed(page);
  await wakeUp(page);
  await press(page, '[data-turn="right"]', isMobile);
  await press(page, '[data-turn="right"]', isMobile);
  await expect(area(page)).toHaveAttribute("data-view", "south");
  await tap(page, "coat", isMobile);
  await advance(page, 3500);
  await expect(page.locator('[data-item="coin"]')).toBeVisible();
  await expect.poll(async () => Object.keys((await stored(page))?.chapters?.["waiting-room"]?.progress?.clues ?? {})).toContain("coin");
  await runUntil(page, 1);
  await advance(page, 2000);
  await expect(area(page)).toHaveAttribute("data-loop", "2");
  await expect(area(page)).toHaveAttribute("data-view", "north");
  await expect(page.locator('[data-item="coin"]')).toHaveCount(0);
  // The journal still knows.
  await page.locator("[data-open-journal]").click();
  await expect(page.locator("[data-journal]")).toContainText("A coin in the coat pocket");
});

test("the journal and a hidden tab hold the clock (Normal mode); H shows everything you can use", async ({ page, isMobile }) => {
  await page.clock.install();
  await seed(page);
  await wakeUp(page);
  await advance(page, 3000);
  await page.locator("[data-open-journal]").click();
  await expect(page.locator("[data-journal]")).toBeVisible();
  await expect(area(page)).toHaveAttribute("data-phase", "journal");
  const reading = await display(page);
  await advance(page, 10_000);
  expect(await display(page)).toBe(reading);
  await page.locator("[data-close-journal]").click();
  await advance(page, 3000);
  expect(await display(page)).toBeLessThan(reading);

  // Looking away pauses; coming back, it's still paused until you say so.
  await tabHidden(page, true);
  await expect(area(page)).toHaveAttribute("data-phase", "paused");
  const away = await display(page);
  await advance(page, 20_000);
  await tabHidden(page, false);
  expect(await display(page)).toBe(away);
  await press(page, "[data-resume]", isMobile);
  await expect(area(page)).toHaveAttribute("data-phase", "play");

  if (isMobile) await press(page, "[data-highlight]", true);
  else await page.keyboard.press("h");
  await expect(page.locator("[data-stage]")).toHaveAttribute("data-highlighting", "");
});

test("your journal survives a reload (and a swipe turns you on a phone)", async ({ page, isMobile }) => {
  await page.clock.install();
  await seed(page);
  await wakeUp(page);
  if (isMobile) await swipe(page, 180);
  else await page.keyboard.press("ArrowLeft");
  await expect(area(page)).toHaveAttribute("data-view", "west");
  await tap(page, "drawer", isMobile);
  await tap(page, "tally", isMobile);
  await expect.poll(async () => Object.keys((await stored(page))?.chapters?.["waiting-room"]?.progress?.clues ?? {})).toContain("tally");
  await page.reload();
  await page.locator("[data-play]").click();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  await page.locator("[data-open-journal]").click();
  await expect(page.locator("[data-journal]")).toContainText("Tally marks");
});

test("the kitchen has no loop clock, and Hardcore has no journal", async ({ page }) => {
  await page.clock.install();
  await seed(page, { done: 1, mode: "hardcore" });
  await page.goto("/games/99-seconds/play");
  await page.locator("[data-chapters]").click();
  await expect(page.locator('[data-chapter-card="kitchen"]')).toHaveAttribute("data-open", "");
  await expect(page.locator('[data-chapter-card="clock-room"]')).not.toHaveAttribute("data-open", "");
  await page.locator('[data-play-chapter="kitchen"]').click();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  await expect(area(page)).toHaveAttribute("data-mode", "hardcore");
  await expect(page.locator("[data-clock]")).toHaveCount(0);
  await expect(page.locator("[data-clock-hidden]")).toBeVisible();
  await expect(page.locator("[data-oven-timer]")).toBeVisible();
  await expect(page.locator("[data-open-journal]")).toHaveCount(0);
  await page.keyboard.press("j");
  await expect(page.locator("[data-journal]")).toHaveCount(0);
});

/** The Clock Room the way the golden path goes, with or without writing the notes you read. */
async function clockRoom(page: Page, isMobile: boolean, writeNotes: boolean) {
  await wakeUp(page, "clock-room");
  await face(page, "east", isMobile);
  await tap(page, "key", isMobile);
  await expect(area(page)).toHaveAttribute("data-items", /\bkey\b/);
  if (writeNotes) {
    await face(page, "west", isMobile);
    await tap(page, "notepad", isMobile);
    for (const note of ["clock", "oven", "zero"]) {
      await tap(page, `write-${note}`, isMobile);
      await advance(page, 3000);
    }
  }
  // The little clock lands on top of the big one at 70.
  await face(page, "north", isMobile);
  await runUntil(page, 70);
  await tap(page, "perch-north", isMobile);
  await expect(area(page)).toHaveAttribute("data-items", /\bflyer\b/);
  // Wind it (the key on it), fit it, turn the crank.
  await press(page, '[data-item="key"]', isMobile);
  await expect(area(page)).toHaveAttribute("data-selected", "key");
  await press(page, '[data-item="flyer"]', isMobile);
  await advance(page, 4500);
  await expect(area(page)).toHaveAttribute("data-items", /\bwound\b/);
  await face(page, "east", isMobile);
  await press(page, '[data-item="wound"]', isMobile);
  await tap(page, "axle", isMobile);
  await expect(page.locator('[data-hotspot="axle"]')).toHaveCount(0);
  await face(page, "north", isMobile);
  await tap(page, "crank", isMobile);
  await advance(page, 4500);
  // Then wait for the second that isn't on any other clock.
  await face(page, "south", isMobile);
  await runUntil(page, 1);
  for (let i = 0; i < 20 && (await page.locator('[data-hotspot="door100"]').count()) === 0; i++) await page.clock.fastForward(250);
  await expect(area(page)).toHaveAttribute("data-display", "100");
  await tap(page, "door100", isMobile);
  await advance(page, 2000);
}

test("the Clock Room: the notes written, the hundredth second, the loop closes, and the credits", async ({ page, isMobile }) => {
  await page.clock.install();
  await seed(page, { done: 2 });
  await clockRoom(page, isMobile, true);
  await expect(page.locator('[data-ending="true"]')).toBeVisible();
  await expect.poll(async () => (await stored(page))?.endings?.true).toBe(1);
  const save = await stored(page);
  expect(save.chapters["clock-room"].done).toBe(1);
  expect(save.achievements).toHaveProperty("closed-loop");
  await page.locator("[data-credits-start]").click();
  const credits = page.locator("[data-credits]");
  await expect(credits).toHaveAttribute("data-left", "99");
  for (let i = 0; i < 10; i++) await page.clock.fastForward(1000);
  await expect(credits).not.toHaveAttribute("data-left", "99");
  await page.locator("[data-skip-credits]").click();
  await expect(page.locator("[data-play]")).toHaveText("You've been here before.");
  await expect.poll(async () => (await stored(page))?.credits).toBe(true);
});

test("the Clock Room without the notes: nobody ever wrote them, so it's a paradox", async ({ page, isMobile }) => {
  await page.clock.install();
  await seed(page, { done: 2 });
  await clockRoom(page, isMobile, false);
  await expect(page.locator('[data-ending="paradox"]')).toBeVisible();
  await advance(page, 3000);
  await expect(page.getByRole("heading", { name: "Paradox" })).toBeVisible();
  const save = await stored(page);
  expect(save.endings.paradox).toBe(1);
  expect(save.chapters["clock-room"].done).toBe(0);
  expect(save.achievements).toHaveProperty("paradox");
  await page.locator("[data-again]").click();
  await expect(page.locator('[data-intro="clock-room"]')).toBeVisible();
});
