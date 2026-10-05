// Don't Trust The Game end to end (Plan/04-dont-trust-the-game.md §12 "Testing", §14), against the real static build,
// on a computer and a phone. That every level can be finished (and the gated ones can't without their trick) is
// proven by the solver in the unit tests, and that HELPER's tell is right on every line by core/helper.test.ts.
// These check what only a browser can: HELPER's eyes on screen, the Options menu's remap and whisper, the favicon
// and tab-title tricks, the crash's deleteSave() joke, ?room=405 (typed, and Back/Forward), the crank and a real
// reload, the poster's hidden text, the console's please (and the real console's helper.truth()), coming back after
// the ending, Truth Mode, and the real settings and exit outside the fiction.
import { expect, test, type Page } from "@playwright/test";

const KEY = "mfg:game:dont-trust-the-game";
type Scene = "tutorial" | "options" | "launcher" | "loading" | "crash" | "404" | "void" | "console" | "credits";

function save(more: Record<string, unknown> = {}) {
  const ch = (done: number) => ({ done, believed: 0, bestMs: 0 });
  return {
    v: 1,
    scene: null,
    truthScene: null,
    cracked: true,
    chapters: { 1: ch(0), 2: ch(0), 3: ch(0), 4: ch(0), 5: ch(0), 6: ch(0) },
    secrets: {},
    trust: { believed: 0, doubted: 0 },
    ending: null,
    endings: { quit: 0, stay: 0 },
    cameBack: false,
    achievements: {},
    deaths: 0,
    playMs: 0,
    prefs: { captions: true, speed: "fast", describeEyes: false, invincible: false, sooner: false },
    ...more,
  };
}

/** Start with this save (once per test: reloads keep what the game saved). */
async function seed(page: Page, value: Record<string, unknown> | null) {
  await page.addInitScript(
    ({ key, value }) => {
      if (sessionStorage.getItem("dttg-seeded")) return;
      sessionStorage.setItem("dttg-seeded", "1");
      localStorage.setItem("mfg:settings", JSON.stringify({ v: 2, sound: false, volume: { master: 0.8, music: 0.7, sfx: 0.8 }, motion: "system", reduceFlashing: false, jumpScares: false, textSize: "normal", colorblind: "off", tapOffsetMs: null }));
      if (value) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    },
    { key: KEY, value },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), KEY);
const helper = (page: Page) => page.locator("[data-helper]");

/** From the title, into the saved scene. */
async function continueAt(page: Page, scene: Scene, url = "/games/dont-trust-the-game/play") {
  await page.goto(url);
  await page.locator("[data-start]").click();
  await expect(page.locator(`[data-scene-view="${scene}"], [data-launcher], [data-crash]`).first()).toBeVisible();
}

/** Walk right for a while: the arrow key on a computer, the pad's ▶ (a real touch) on a phone. */
async function walkRight(page: Page, ms: number, isMobile: boolean) {
  if (!isMobile) {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(ms);
    await page.keyboard.up("ArrowRight");
    return;
  }
  const box = (await page.locator('[data-pad-btn="right"]').boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at] });
  await page.waitForTimeout(ms);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test("the title tells the truth, and its Quit doesn't work (HELPER says so, looking right at you)", async ({ page }) => {
  await seed(page, null);
  await page.goto("/games/dont-trust-the-game/play");
  await expect(page.locator("[data-title-screen]")).toBeVisible();
  await expect(helper(page)).toHaveAttribute("data-line", "title.hi");
  await page.locator("[data-title-quit]").click();
  await expect(helper(page)).toHaveAttribute("data-line", "title.quit");
  // A truth: the eyes never leave you.
  for (let i = 0; i < 12; i++) {
    await expect(helper(page)).toHaveAttribute("data-eyes", "straight");
    await page.waitForTimeout(100);
  }
  await page.locator("[data-start]").click();
  await expect(page.locator('[data-scene-view="tutorial"]')).toBeVisible();
});

test("Chapter 2: HELPER glances when it lies; brightness shows the level; Jump is remapped from F13; Hard builds the bridge; the volume whispers", async ({ page, isMobile }) => {
  await seed(page, save({ scene: "options", chapters: { 1: { done: 1, believed: 0, bestMs: 0 }, 2: { done: 0, believed: 0, bestMs: 0 }, 3: { done: 0, believed: 0, bestMs: 0 }, 4: { done: 0, believed: 0, bestMs: 0 }, 5: { done: 0, believed: 0, bestMs: 0 }, 6: { done: 0, believed: 0, bestMs: 0 } } }));
  await continueAt(page, "options");
  // "These are just the options. Nothing to see here!" is a lie: the eyes glance away.
  await expect(helper(page)).toHaveAttribute("data-line", "o.intro");
  await expect(helper(page)).toHaveAttribute("data-eyes", "glance");
  await page.locator('[data-option="brightness"]').fill("100");
  await expect(helper(page)).toHaveAttribute("data-line", "o.bright");
  // The remap button dodges: on a computer, Tab to it and press Enter; on a phone, it gets tired of being chased.
  if (isMobile) {
    await expect(page.locator('[data-pad-btn="jump"]')).toHaveText("F13");
    for (let i = 0; i < 7 && (await page.locator('[data-pad-btn="jump"]').textContent()) !== "JUMP"; i++) await page.locator("[data-remap]").tap();
    await expect(page.locator('[data-pad-btn="jump"]')).toHaveText("JUMP");
  } else {
    await page.locator("[data-remap]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-remap]")).toHaveText("Press a key…");
    await page.keyboard.press("Space");
    await expect(page.locator("[data-remap]")).toHaveText("Space");
  }
  await page.locator('[data-difficulty="easy"]').click();
  await expect(helper(page)).toHaveAttribute("data-line", "o.easy-wall");
  await page.locator('[data-difficulty="hard"]').click();
  await expect(helper(page)).toHaveAttribute("data-line", "o.hard");
  await page.locator('[data-option="volume"]').fill("100");
  await expect(page.locator("[data-caption]")).toHaveText("[a whisper: seven… two… nine]");
  // Backwards English: the gibberish tip reads the right way round (and that's a secret).
  await expect(page.locator("[data-tip]")).toHaveText(".rooD thgiR si rood thgir eht :piT");
  await page.locator('[data-language="backwards"]').click();
  await expect(page.locator("[data-tip]")).toHaveText("Tip: the right door is Right Door.");
  await expect.poll(async () => Object.keys((await stored(page)).secrets)).toContain("backwards");
});

test("More Games: the tab's icon turns into Right Door's (and is given back), the parodies are broken, Right Door goes on", async ({ page }) => {
  await seed(page, save({ scene: "launcher" }));
  await page.goto("/games/dont-trust-the-game/play");
  const icon = () => page.evaluate(() => document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.getAttribute("href") ?? "");
  const before = await icon();
  await page.locator("[data-start]").click();
  await expect(page.locator("[data-launcher]")).toBeVisible();
  await expect.poll(icon).toMatch(/^data:image\/png/);
  await page.locator('[data-game-card="yep"]').click();
  await expect(page.locator('[data-parody="yep"]')).toContainText("YEP!");
  await page.locator("[data-parody-back]").click();
  await page.locator('[data-game-card="right-door"]').click();
  await expect(page.locator('[data-scene-view="loading"]')).toBeVisible();
  await expect.poll(icon).toBe(before);
});

test("Now Loading: switch tabs and the title begs, then gives you the CD key, which skips the loading screen", async ({ page }) => {
  await seed(page, save({ scene: "loading" }));
  await continueAt(page, "loading");
  const original = await page.evaluate(() => document.title);
  const tab = (hidden: boolean) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await tab(true);
  // First it begs (for a second and a half), then it gives up the key.
  await expect.poll(() => page.evaluate(() => document.title)).toMatch(/don't leave me 🥺|CD key/);
  await expect.poll(() => page.evaluate(() => document.title), { timeout: 5000 }).toContain("CD key: 2468");
  await tab(false);
  await expect(helper(page)).toHaveAttribute("data-line", "ld.tab");
  await expect.poll(async () => Object.keys((await stored(page)).secrets)).toContain("tab");
  await page.locator("[data-skip-loading]").click();
  for (const [i, n] of [2, 4, 6, 8].entries()) for (let k = 0; k < n; k++) await page.locator(`[data-key-up="${i}"]`).click();
  await page.locator("[data-key-enter]").click();
  await expect(page.locator("[data-crash]")).toBeVisible({ timeout: 10_000 });
  // The tab's title comes back.
  await expect.poll(() => page.evaluate(() => document.title), { timeout: 15_000 }).toBe(original);
});

test("Fatal Error: deleteSave() is a joke that's over in three seconds; openSecretDoor() opens level 404, and the address bar says so", async ({ page }) => {
  await seed(page, save({ scene: "crash" }));
  await continueAt(page, "crash");
  await expect(page.locator("[data-crash]")).toBeVisible();
  await page.locator('[data-fn="deleteSave"]').click();
  await expect(page.locator("[data-deleting]")).toBeVisible();
  await expect(page.locator("[data-deleting]")).toContainText("Just kidding", { timeout: 3000 });
  expect((await stored(page)).scene).toBe("crash");
  await page.locator('[data-fn="openSecretDoor"]').click();
  await expect(page.locator('[data-scene-view="404"]')).toBeVisible();
  await expect(page).toHaveURL(/\?room=404$/);
  // Forward and Back step between 404 and 405 (one history entry).
  await page.evaluate(() => history.pushState(null, "", "?room=405"));
  await page.goBack();
  await page.goForward();
  await expect(page.locator('[data-scene-view="405"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-scene-view="404"]')).toBeVisible();
});

test("typing ?room=405 into the address bar opens the room that isn't in the game (once you've got that far)", async ({ page }) => {
  await seed(page, save({ scene: "404" }));
  await page.goto("/games/dont-trust-the-game/play?room=405");
  await expect(page.locator('[data-scene-view="405"]')).toBeVisible();
  await expect.poll(async () => Object.keys((await stored(page)).achievements)).toContain("hacker");
  expect(Object.keys((await stored(page)).secrets)).toContain("room-405");
});

test("too early for room 405: a nice try, and the address bar is put back", async ({ page }) => {
  await seed(page, null);
  await page.goto("/games/dont-trust-the-game/play?room=405");
  await expect(page.locator("[data-title-screen]")).toBeVisible();
  await expect(page.locator("[data-toast]")).toContainText("Nice try");
  await expect(page).toHaveURL(/\/play$/);
});

test("the void: the crank squeezes the wall; HELPER (looking right at you) says reload; a real reload fixes the door", async ({ page, isMobile }) => {
  await seed(page, save({ scene: "void" }));
  await continueAt(page, "void");
  for (let i = 0; i < 4; i++) await page.locator("[data-crank]").click();
  await expect(page.locator('[data-scene-view="void"]')).toHaveAttribute("data-squeezed", "");
  // Walk through the gap to the empty door frame.
  await walkRight(page, 3200, isMobile);
  await expect(helper(page)).toHaveAttribute("data-line", "v.door", { timeout: 10_000 });
  await expect(helper(page)).toHaveAttribute("data-eyes", "straight");
  await page.reload();
  await page.locator("[data-start]").click();
  await expect(page.locator('[data-scene-view="void"]')).toHaveAttribute("data-fixed", "");
  await expect.poll(async () => Object.keys((await stored(page)).achievements)).toContain("reloaded");
  await walkRight(page, 1500, isMobile);
  await expect(page.locator('[data-scene-view="console"]')).toBeVisible({ timeout: 10_000 });
});

test("the console: the blank poster's text, seven taps on the version, sudo is a nice try, please opens the door", async ({ page, isMobile }) => {
  await seed(page, save({ scene: "console" }));
  await continueAt(page, "console");
  await expect(helper(page)).toHaveAttribute("data-line", "k.nothing");
  await expect(helper(page)).toHaveAttribute("data-eyes", "glance");
  // Select the poster that looks blank (a long-press on a phone does the same).
  await page.evaluate(() => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("[data-poster]")!);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
  });
  await expect(page.locator("[data-poster]")).toHaveAttribute("data-read", "");
  for (let i = 0; i < 7; i++) await page.locator("[data-version]").click();
  await expect(page.locator("[data-console]")).toBeVisible();
  const run = async (command: string) => {
    await page.locator("[data-console-in]").fill(command);
    await page.locator("[data-console-in]").press("Enter");
  };
  await run("sudo open door");
  await expect(page.locator("[data-console-out]")).toContainText("Nice try.");
  await run("please open door");
  await expect(page.locator('[data-scene-view="console"]')).toHaveAttribute("data-door-open", "");
  await expect.poll(async () => Object.keys((await stored(page)).achievements)).toContain("magic-word");
  // Desktop players with DevTools open can ask the real console too.
  if (!isMobile) {
    expect(await page.evaluate(() => (window as unknown as { helper: { truth(): string } }).helper.truth())).toMatch(/the game ends/);
    await expect.poll(async () => Object.keys((await stored(page)).secrets)).toContain("truth");
  }
  await page.locator("[data-console-close]").click();
  await walkRight(page, 4000, isMobile);
  await expect(page.locator('[data-scene-view="credits"]')).toBeVisible({ timeout: 10_000 });
});

test("after the ending: “You came back.”, HELPER is honest, and Truth Mode tells the truth instead of every lie", async ({ page }) => {
  const done = { done: 1, believed: 0, bestMs: 0 };
  await seed(page, save({ ending: "quit", endings: { quit: 1, stay: 0 }, truthScene: "options", chapters: { 1: done, 2: done, 3: done, 4: done, 5: done, 6: done } }));
  await page.goto("/games/dont-trust-the-game/play");
  await expect(page.locator("[data-you-came-back]")).toBeVisible();
  await expect(helper(page)).toHaveAttribute("data-line", "title.back");
  await expect.poll(async () => Object.keys((await stored(page)).achievements)).toContain("you-came-back");
  await page.locator("[data-truth-mode]").click();
  await expect(page.locator('[data-scene-view="options"]')).toBeVisible();
  // The lie "These are just the options" becomes the truth, and the eyes stay on you.
  await expect(helper(page)).toHaveAttribute("data-line", "o.intro");
  await expect(page.locator("[data-bubble]")).toHaveAttribute("aria-label", /The options are a level/);
  for (let i = 0; i < 12; i++) {
    await expect(helper(page)).toHaveAttribute("data-eyes", "straight");
    await page.waitForTimeout(100);
  }
  // Only once: the next visit's title is the usual one.
  await page.reload();
  await expect(page.locator("[data-title-screen]")).toBeVisible();
  await expect(page.locator("[data-you-came-back]")).toHaveCount(0);
});

test("outside the fiction: the real settings do what they say (reset really resets), and the real exit leaves", async ({ page }) => {
  await seed(page, save({ scene: "console", secrets: { poke: 1 } }));
  await page.goto("/games/dont-trust-the-game/play");
  await page.locator("[data-real-settings-open]").click();
  await expect(page.locator("[data-real-settings]")).toBeVisible();
  await page.locator("#dttg-eyes").click();
  await expect.poll(async () => (await stored(page)).prefs.describeEyes).toBe(true);
  await page.locator("[data-reset]").click();
  await page.locator("[data-reset-confirm]").click();
  await expect.poll(async () => (await stored(page)).scene).toBeNull();
  expect((await stored(page)).secrets).toEqual({});
  await page.keyboard.press("Escape");
  await page.locator("[data-real-exit]").click();
  await expect(page).toHaveURL(/\/games\/dont-trust-the-game$/);
});
