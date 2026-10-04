// Wrong Door end to end (Plan/13-wrong-door.md §14), against the real static build, on a computer and a
// phone. That every generated floor has exactly one answer, that Monty Hall's odds are right and that the
// doorman's logic holds are proven by the unit tests (10,000 floors of every kind; 100,000 Lucky Floors; a
// careful player that climbs hundreds of runs). These check the real thing: the hand-made Story Run, real
// taps and keys, knocking, Mr. Hinges, the Truth Reveal, the Wrong Room, the save, a full climb by touch.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:wrong-door";

const PLAY = { visit: 0, knocks: {}, answer: null, coins: {}, peeks: {}, opened: [], shuffled: false, chalk: [], taken: false, lucky: null, wrong: 0, itemsUsed: 0, curse: null };
/** The kinds of door the Story Run's way up is, floor by floor (floor 9 asks about floor 4's). */
const STORY_STYLES = ["velvet", "wood", "velvet", "wood", "iron", null, "round", "glass", "wood", "velvet", "glass", "velvet"];

/** A Story Run waiting on floor `floor` (the floors below climbed cleanly). */
function storyAt(floor: number) {
  const path = Array.from({ length: floor - 1 }, (_, k) => ({ floor: k + 1, style: STORY_STYLES[k] ?? null, wrong: 0, knocks: 0, question: false, items: 0, lucky: k === 7, points: 100 }));
  return {
    mode: "story",
    seed: 0,
    daily: null,
    floor,
    keys: 3,
    visits: { [floor]: 0 },
    items: { stethoscope: false, lantern: false, chalk: false, truthCoin: 0, crowbar: 0 },
    cursed: false,
    play: PLAY,
    path,
    chalkLog: [],
    wrongBy: {},
    stats: { wrong: 0, knocks: 0, questions: 0, items: 0, anomalies: 0, switchWon: false, doubleNegative: false },
    status: "play",
    pending: null,
    elapsedMs: 0,
  };
}

/** Start with this save (once per test: reloads keep what the game saved). */
async function seed(page: Page, run: unknown = null) {
  await page.addInitScript(
    ({ key, run }) => {
      if (sessionStorage.getItem("wd-seeded")) return;
      sessionStorage.setItem("wd-seeded", "1");
      const stats = { runs: 1, escapes: 0, storyEscapes: 0, bestEndless: 0, bestScore: 0, floors: 0, wrongDoors: 0, anomalies: 0, knocks: 0, questions: 0, luckyPlays: 0, luckySwitches: 0, luckyWins: 0 };
      if (run) localStorage.setItem(key, JSON.stringify({ v: 1, run, codex: {}, achievements: {}, stats, daily: {}, prefs: { relaxed: false, bigSigns: false } }));
      else localStorage.removeItem(key);
    },
    { key: SAVE_KEY, run },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);
const area = (page: Page) => page.locator("[data-game-area]");

async function lobby(page: Page) {
  await page.goto("/games/wrong-door/play");
  await expect(page.locator("[data-play]")).toBeVisible({ timeout: 10_000 });
}

/** Into the seeded run. */
async function resume(page: Page, floor: number) {
  await lobby(page);
  await page.locator("[data-continue]").click();
  await expect(area(page)).toHaveAttribute("data-floor", String(floor));
}

/** Open a door (or the painting, or go back), and confirm. */
async function open(page: Page, choice: number | "back" | "painting", tap = false) {
  const press = (sel: string) => (tap ? page.locator(sel).first().tap() : page.locator(sel).first().click());
  if (choice === "back") await press('[data-go="back"]');
  else if (choice === "painting") await press("[data-painting]");
  else if (await page.locator('[data-go="ahead"]').count()) await press('[data-go="ahead"]');
  else {
    await press(`[data-door="${choice}"]`);
    await press("[data-open]");
  }
  await press("[data-confirm-open]");
}

test("check in: the Story Run's first floor, where the confident sign is the liar", async ({ page, isMobile }) => {
  await seed(page);
  await lobby(page);
  await expect(page.getByText("Daily Door #")).toBeVisible();
  if (isMobile) await page.locator("[data-play]").tap();
  else await page.locator("[data-play]").click();
  await expect(area(page)).toHaveAttribute("data-floor", "1");
  await expect(page.locator("[data-plaque]")).toContainText("Exactly one sign tells the truth.");
  await expect(page.locator('[data-sign="1"]')).toContainText("This is the way up.");
  await open(page, 2, isMobile);
  await expect(area(page)).toHaveAttribute("data-floor", "2");
  await expect.poll(async () => (await stored(page))?.run?.floor).toBe(2);
});

test("a wrong door: down the stairs, and the Truth Reveal says exactly why", async ({ page, isMobile }) => {
  test.skip(isMobile, "One device is enough");
  await seed(page, storyAt(2));
  await resume(page, 2);
  await open(page, 1);
  const reveal = page.locator("[data-reveal]");
  await expect(reveal).toBeVisible({ timeout: 5000 });
  await expect(reveal).toContainText("Down the stairs!");
  await expect(reveal.locator("[data-truth]")).toHaveText("The way up was door 2.");
  await expect(reveal.locator("[data-why]")).toContainText("If door 1 were the way up, two signs would be true");
  await expect(reveal.locator("[data-false]")).toHaveCount(2);
  // A reload doesn't dodge it.
  await page.reload();
  await page.locator("[data-continue]").click();
  await expect(page.locator("[data-reveal]")).toBeVisible();
  await page.locator("[data-reveal] [data-continue]").click();
  await expect(area(page)).toHaveAttribute("data-floor", "1");
  await expect.poll(async () => (await stored(page))?.run).toMatchObject({ floor: 1, visits: { 1: 1 }, pending: null });
  expect((await stored(page)).stats.wrongDoors).toBe(1);
});

test("knocking: what's behind the door, out loud and in a caption", async ({ page, isMobile }) => {
  await seed(page, storyAt(4));
  await resume(page, 4);
  if (isMobile) {
    // Hold the door (a long press).
    const box = (await page.locator('[data-door="2"]').boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at] });
    await page.waitForTimeout(700);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.locator('[data-door="2"]').click();
    await page.keyboard.press("k");
  }
  await expect(page.locator('[data-door="2"] [role=status]')).toContainText("ticking");
  await expect(page.locator("[data-log]")).toContainText("Behind door 2: ticking.");
  await expect.poll(async () => (await stored(page))?.run?.play?.knocks).toEqual({ 2: "ticking" });
});

test("Mr. Hinges in his red hat, and the double question", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, storyAt(3));
  await resume(page, 3);
  await expect(page.locator('[data-hinges="red"]')).toBeVisible();
  await page.keyboard.press("q");
  await page.locator('[data-question="wouldSay:1"]').click();
  await expect(page.locator("[data-log]")).toContainText("Mr. Hinges: “Yes.”");
  await expect.poll(async () => (await stored(page))?.achievements?.["double-negative"]).toBeGreaterThan(0);
  // One question a floor.
  await expect(page.locator("[data-ask]")).toBeDisabled();
});

test("the Lucky Floor by the real rules: he opens a wrong door and offers the switch", async ({ page, isMobile }) => {
  test.skip(isMobile, "One device is enough");
  await seed(page, storyAt(8));
  await resume(page, 8);
  await open(page, 1);
  const offer = page.locator("[data-lucky]");
  await expect(offer).toBeVisible({ timeout: 5000 });
  await expect(offer).toContainText("Mr. Hinges opened door 3");
  await offer.locator("[data-switch]").click();
  await expect(area(page)).toHaveAttribute("data-floor", "9", { timeout: 5000 });
  await expect.poll(async () => (await stored(page))?.achievements?.["the-switch"]).toBeGreaterThan(0);
});

test("the Wrong Room: find the draft in the dark, and keep your key", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, storyAt(2));
  await resume(page, 2);
  await open(page, 3);
  await expect(page.locator("[data-reveal]")).toContainText("The Wrong Room");
  await page.locator("[data-reveal] [data-continue]").click();
  const room = page.locator("[data-wrong-room]");
  await expect(room).toBeVisible();
  for (let k = 0; k < 8; k++) {
    const draft = await page.locator("[data-draft]").getAttribute("data-draft");
    if (draft === "here") break;
    await page.keyboard.press(draft === "left" ? "ArrowLeft" : "ArrowRight");
  }
  await page.keyboard.press("Enter");
  await expect(room).toBeHidden({ timeout: 5000 });
  await expect(area(page)).toHaveAttribute("data-keys", "3");
  await expect(page.locator('[data-door="3"]')).toHaveAttribute("aria-label", /opened: wrong/);
});

test("the Final Floor: none of these doors is the way out (believe it)", async ({ page, isMobile }) => {
  test.skip(isMobile, "One device is enough");
  await seed(page, storyAt(13));
  await resume(page, 13);
  await expect(page.locator("[data-plaque]")).toContainText("None of these doors is the way out.");
  await open(page, "painting");
  await expect(page.locator('[data-summary="escaped"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator("[data-path]")).toContainText("🏁");
  const save = await stored(page);
  expect(save.achievements.believer).toBeGreaterThan(0);
  expect(save.stats.storyEscapes).toBe(1);
  expect(save.run).toBeNull();
});

test("options are saved: Relaxed mode and bigger signs", async ({ page }) => {
  await seed(page);
  await lobby(page);
  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Options" });
  await options.getByRole("switch", { name: "Relaxed mode" }).click();
  await options.getByRole("switch", { name: "Bigger signs" }).click();
  await expect.poll(async () => (await stored(page))?.prefs).toEqual({ relaxed: true, bigSigns: true });
});

test("the Daily Door is the same hotel in every browser", async ({ browser, isMobile }) => {
  test.skip(isMobile, "One device is enough");
  const signs: string[] = [];
  for (let k = 0; k < 2; k++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/games/wrong-door/play");
    await page.locator("[data-daily]").click();
    await expect(area(page)).toHaveAttribute("data-floor", "1");
    signs.push((await page.locator("[data-board]").textContent()) ?? "");
    await context.close();
  }
  expect(signs[0]).toContain("Door 1");
  expect(signs[1]).toBe(signs[0]);
});

test("a full Story Run by touch, floor 1 to the way out", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  test.setTimeout(150_000);
  await seed(page);
  await lobby(page);
  await page.locator("[data-play]").tap();
  // The way up on each floor of the Story Run (it's hand-made; the unit tests prove each one).
  const ANSWERS: Array<number | "back" | "painting" | "lucky" | "shift"> = [2, 2, 1, 3, 3, "back", 1, "lucky", 3, 4, "shift", 1, "painting"];
  for (let floor = 1; floor <= 13; floor++) {
    await expect(area(page)).toHaveAttribute("data-floor", String(floor), { timeout: 6000 });
    await page.waitForTimeout(400);
    const answer = ANSWERS[floor - 1]!;
    if (answer === "lucky") {
      await open(page, 1, true);
      await page.locator("[data-switch]").tap();
    } else if (answer === "shift") {
      // Going to open a door makes the lights flicker and the doors move; the way up (the ring scratch,
      // door 2) is followed by its scratch.
      await page.locator('[data-door="2"]').tap();
      await page.locator("[data-open]").tap();
      await page.waitForTimeout(1600);
      await expect(page.locator('[data-door="2"]')).not.toHaveAttribute("data-place", "2");
      await open(page, 2, true);
    } else await open(page, answer, true);
  }
  await expect(page.locator('[data-summary="escaped"]')).toBeVisible({ timeout: 6000 });
  await expect(page.locator("[data-path]")).toHaveText("🚪🚪🚪🚪🚪🚪🚪🎲🚪🚪🚪🚪🏁");
});
