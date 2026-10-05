// Don't Blink end to end (Plan/14-dont-blink.md §14), against the real static build, on a computer and a phone.
// That changes only happen while the screen is covered, that no object ever has two, that the Visitor always
// scrapes when it moves and that every night is survivable by a tester with the reference photos (while a guard
// who never switches cameras isn't) are proven by the unit tests. These check the real thing: the title's blinks,
// the flicker notice, the manager's note, cameras by click, tap and key, a real change found and reported (the
// night's seed is fixed for the test, and the same night is played out here to know where it'll be), a false
// report, the binder's photo, holding your eyes open, pausing, getting fired, the save, and soft blinks that
// never go black.
import { expect, test, type Page } from "@playwright/test";
import { OBJECTS } from "../../src/games/dont-blink/core/catalogue";
import { Game } from "../../src/games/dont-blink/core/game";
import { nightConfig } from "../../src/games/dont-blink/core/nights";
import { boxAt, boxCentre } from "../../src/games/dont-blink/core/report";

const SAVE_KEY = "mfg:game:dont-blink";

const night = (clears: number) => ({ tries: clears, clears, best: clears ? "sleepy" : null, perfect: false });

function saveWith(cleared: number, prefs: Partial<{ noticeSeen: boolean; assist: boolean }> = {}) {
  const nights: Record<string, ReturnType<typeof night>> = {};
  for (let n = 1; n <= cleared; n++) nights[n] = night(1);
  return {
    v: 1,
    nights,
    endless: { best: 0, runs: 0 },
    custom: { blink: 5, visitor: 0.4, rate: 4, subtlety: 3, staticBlink: false, fakeBlink: false, gradual: false, office: false, mirror: false },
    achievements: {},
    stats: { shifts: cleared, reported: 0, falseReports: 0, visitorHome: 0, counts: 0 },
    ending: false,
    prefs: { assist: false, captions: true, colourChanges: true, noticeSeen: true, ...prefs },
  };
}

/** Start with this save, this night seed and these comfort settings (once per test: reloads keep what the game saved). */
async function seed(page: Page, { save = null as unknown, seed = 0, reduceFlashing = false } = {}) {
  await page.addInitScript(
    ({ key, save, seed, reduceFlashing }) => {
      if (seed) sessionStorage.setItem("mfg:dont-blink:seed", String(seed));
      if (sessionStorage.getItem("db-seeded")) return;
      sessionStorage.setItem("db-seeded", "1");
      if (save) localStorage.setItem(key, JSON.stringify(save));
      else localStorage.removeItem(key);
      localStorage.setItem(
        "mfg:settings",
        JSON.stringify({ v: 2, sound: false, volume: { master: 0.8, music: 0.7, sfx: 0.8 }, motion: "system", reduceFlashing, jumpScares: false, textSize: "normal", colorblind: "off", tapOffsetMs: null }),
      );
    },
    { key: SAVE_KEY, save, seed, reduceFlashing },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
const area = (page: Page) => page.locator("[data-game-area]");

/** Click (or tap) a point on the camera, in the scene's own units (640 × 400). */
async function pointAt(page: Page, x: number, y: number, tap: boolean) {
  const box = (await page.locator("[data-screen]").boundingBox())!;
  const px = box.x + (x / 640) * box.width;
  const py = box.y + (y / 400) * box.height;
  if (tap) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
}

/** The first change Night 1 makes with no input at all, played out here: which seed puts it in the Lobby. */
function firstLobbyChange() {
  for (let s = 1; s < 500; s++) {
    const game = new Game({ mode: "night", night: 1, config: () => nightConfig(1), seed: s, colour: true, assist: false });
    while (game.active.size === 0 && game.tick < 60 * 60) {
      game.step();
      game.events.length = 0;
    }
    const a = [...game.active.values()][0];
    if (!a || a.def.camera !== "lobby" || a.def.object === "@view") continue;
    const o = OBJECTS.get(a.def.object)!;
    const s0 = game.states.get(o.id)!;
    const c = boxCentre(boxAt(o, s0.visible ? s0 : o.base));
    return { seed: s, type: a.def.type, name: o.name, x: c.x, y: c.y, seconds: game.tick / 60 };
  }
  throw new Error("no seed puts the first change in the Lobby");
}

test("the title blinks, and something on it changes", async ({ page }) => {
  await seed(page);
  await page.goto("/games/dont-blink/play");
  await expect(page.locator("[data-title-screen]")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("[data-title-screen]")).toHaveAttribute("data-changes", "");
  await expect.poll(async () => (await page.locator("[data-title-screen]").getAttribute("data-changes")) ?? "", { timeout: 15_000 }).not.toBe("");
});

test("the first night: the flicker notice, the manager's note, three cameras and your office", async ({ page, isMobile }) => {
  await seed(page);
  await page.goto("/games/dont-blink/play");
  await page.locator("[data-play]").click();
  await expect(page.getByRole("dialog", { name: "A word about flicker" })).toBeVisible();
  await page.locator("[data-notice-continue]").click();
  await expect(page.locator("[data-intro]")).toContainText("Night 1");
  await expect(page.locator("[data-note]")).toContainText("three cameras");
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  await expect(area(page)).toHaveAttribute("data-night", "1");
  await expect(page.locator("[data-cam]")).toHaveCount(4);
  await expect(page.locator('[data-cam="storage"]')).toHaveCount(0);
  await expect(area(page)).toHaveAttribute("data-camera", "lobby");
  if (isMobile) await page.locator('[data-cam="gallery"]').tap();
  else await page.locator('[data-cam="gallery"]').click();
  await expect(area(page)).toHaveAttribute("data-camera", "gallery");
  if (!isMobile) {
    await page.keyboard.press("3");
    await expect(area(page)).toHaveAttribute("data-camera", "sculpture");
    await page.keyboard.press("o");
    await expect(area(page)).toHaveAttribute("data-camera", "office");
    await page.keyboard.press("1");
    await expect(area(page)).toHaveAttribute("data-camera", "lobby");
  }
  // The notice is only ever shown once.
  await expect.poll(async () => (await stored(page))?.prefs?.noticeSeen).toBe(true);
});

test("a change during a blink, found and reported: it snaps back", async ({ page, isMobile }) => {
  const change = firstLobbyChange();
  await seed(page, { save: saveWith(0), seed: change.seed });
  await page.goto("/games/dont-blink/play");
  await page.locator("[data-play]").click();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  await expect(area(page)).toHaveAttribute("data-active", "0");
  await expect(area(page)).toHaveAttribute("data-active", "1", { timeout: (change.seconds + 15) * 1000 });
  await pointAt(page, change.x, change.y, isMobile);
  await expect(page.locator("[data-picker]")).toBeVisible();
  await page.locator(`[data-type="${change.type}"]`).click();
  await expect(page.locator('[data-stamp="accepted"]')).toBeVisible();
  await expect(page.locator('[data-stamp="accepted"]')).toContainText(change.name.slice(4, 12));
  await expect(area(page)).toHaveAttribute("data-active", "0");
});

test("a false report costs credibility; the binder's photo; holding your eyes open; pause and leave", async ({ page, isMobile }) => {
  await seed(page, { save: saveWith(0) });
  await page.goto("/games/dont-blink/play");
  await page.locator("[data-play]").click();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  const cred = page.locator("[data-credibility]");
  await expect(cred).toHaveAttribute("data-credibility", "7");
  // The welcome sign hasn't changed (nothing has, this early).
  await pointAt(page, 320, 166, isMobile);
  await page.locator('[data-type="moved"]').click();
  await expect(page.locator('[data-stamp="denied"]')).toContainText("No anomaly found");
  await expect(cred).toHaveAttribute("data-credibility", "6");
  // Esc closes the picker without a report.
  if (!isMobile) {
    await pointAt(page, 320, 166, false);
    await expect(page.locator("[data-picker]")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-picker]")).toHaveCount(0);
    await expect(cred).toHaveAttribute("data-credibility", "6");
  }
  // The reference photo: one of five.
  const photo = page.locator("[data-photo-button]");
  await expect(photo).toHaveAttribute("data-photos", "5");
  await photo.click();
  await expect(page.locator("[data-photo]")).toBeVisible();
  await expect(page.locator("[data-photo]")).toContainText("Lobby, 6:00 AM");
  await expect(photo).toHaveAttribute("data-photos", "4");
  await photo.click();
  await expect(page.locator("[data-photo]")).toHaveCount(0);
  // Hold your eyes open: the strain rises.
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page);
    const eye = (await page.locator("[data-eye]").boundingBox())!;
    const at = { x: eye.x + eye.width / 2, y: eye.y + eye.height / 2 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at] });
    await expect(page.locator("[data-eye]")).toHaveAttribute("data-held", "");
    await page.waitForTimeout(1500);
    await expect.poll(async () => Number(await page.locator("[data-strain]").getAttribute("data-strain"))).toBeGreaterThan(8);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator("[data-eye]")).not.toHaveAttribute("data-held", "");
  } else {
    await page.keyboard.down("Space");
    await expect(page.locator("[data-eye]")).toHaveAttribute("data-held", "");
    await page.waitForTimeout(1500);
    await expect.poll(async () => Number(await page.locator("[data-strain]").getAttribute("data-strain"))).toBeGreaterThan(8);
    await page.keyboard.up("Space");
    await expect(page.locator("[data-eye]")).not.toHaveAttribute("data-held", "");
  }
  // Pause, and leave the night.
  await page.locator("[data-pause]").click();
  await expect(page.locator('[data-card="paused"]')).toBeVisible();
  await expect(area(page)).toHaveAttribute("data-phase", "paused");
  await page.locator("[data-leave]").click();
  await expect(page.locator("[data-nights-screen]")).toBeVisible();
});

test("seven false reports in an hour on Night 1: fired, and the save remembers the try", async ({ page, isMobile }) => {
  await seed(page, { save: saveWith(0) });
  await page.goto("/games/dont-blink/play");
  await page.locator("[data-play]").click();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  for (let i = 0; i < 7; i++) {
    await pointAt(page, 320, 166, isMobile);
    await expect(page.locator("[data-picker]")).toBeVisible();
    // On a keyboard, 1–9 pick the type (3 is Extra).
    if (!isMobile && i % 2) await page.keyboard.press("3");
    else await page.locator('[data-type="extra"]').click();
    await expect(page.locator("[data-picker]")).toHaveCount(0);
  }
  await expect(page.locator('[data-results="lost"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("[data-results]")).toContainText("You're fired");
  await expect(page.locator('[data-rank="fired"]')).toBeVisible();
  await expect(page.locator('[data-stat="false"]')).toContainText("7");
  await expect.poll(async () => (await stored(page))?.nights?.["1"]?.tries).toBe(1);
  const save = await stored(page);
  expect(save.nights["1"].clears).toBe(0);
  expect(save.stats.falseReports).toBe(7);
  // Try again: the manager's note, then the night again.
  await page.locator("[data-retry]").click();
  await expect(page.locator("[data-intro]")).toContainText("Night 1");
});

test("the week opens one night at a time; Endless and Custom after Night 2", async ({ page }) => {
  await seed(page, { save: saveWith(1) });
  await page.goto("/games/dont-blink/play");
  await page.locator("[data-nights]").click();
  await expect(page.locator('[data-night-card="1"]')).toHaveAttribute("data-open", "");
  await expect(page.locator('[data-night-card="2"]')).toHaveAttribute("data-open", "");
  await expect(page.locator('[data-night-card="3"]')).toBeDisabled();
  await expect(page.locator("[data-endless]")).toBeDisabled();
  await expect(page.locator("[data-custom]")).toBeDisabled();
  // Night 2: all five cameras.
  await page.locator('[data-night-card="2"]').click();
  await expect(page.locator("[data-note]")).toContainText("All five cameras");
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  await expect(page.locator("[data-cam]")).toHaveCount(6);
});

test("soft blinks (Reduce flashing) never go black: the lids stay see-through, the picture blurs", async ({ page }) => {
  await seed(page, { save: saveWith(0), reduceFlashing: true });
  await page.goto("/games/dont-blink/play");
  await page.locator("[data-play]").click();
  await page.locator("[data-start]").click();
  await expect(area(page)).toHaveAttribute("data-ready", "");
  // Watch the lids and the picture through a few blinks.
  const seen = await page.evaluate(
    () =>
      new Promise<{ maxOpacity: number; blurred: boolean; samples: number }>((resolve) => {
        const lid = document.querySelector<HTMLElement>('[data-lid="top"]')!;
        const canvas = document.querySelector<HTMLCanvasElement>("[data-screen] canvas")!;
        let maxOpacity = 0;
        let blurred = false;
        let samples = 0;
        const start = performance.now();
        const look = () => {
          samples++;
          maxOpacity = Math.max(maxOpacity, Number(getComputedStyle(lid).opacity));
          if (canvas.style.filter.includes("blur")) blurred = true;
          if (performance.now() - start < 9000) requestAnimationFrame(look);
          else resolve({ maxOpacity, blurred, samples });
        };
        requestAnimationFrame(look);
      }),
  );
  expect(seen.samples).toBeGreaterThan(100);
  expect(seen.blurred).toBe(true);
  expect(seen.maxOpacity).toBeGreaterThan(0.3);
  expect(seen.maxOpacity).toBeLessThan(1);
});
