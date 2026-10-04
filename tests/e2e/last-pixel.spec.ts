// Last Pixel end to end (Plan/10-last-pixel.md §14), against the real static build, on a computer and a
// phone. That every level can reach exactly 100% is proven by the unit tests (a bot plays every one); these
// check the real thing: painting with real drags, Pix waking at the last cell, catching it with a real click,
// the save, the screens.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:last-pixel";

/** Start with these levels done (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: string[] = []) {
  await page.addInitScript(
    ({ key, cleared }) => {
      if (sessionStorage.getItem("lp-seeded")) return;
      sessionStorage.setItem("lp-seeded", "1");
      const levels: Record<string, unknown> = {};
      for (const id of cleared) levels[id] = { clears: 1, stars: 3, bestClean: 1500, bestHunt: 300 };
      localStorage.setItem(key, JSON.stringify({ v: 1, levels, achievements: {}, stats: { catches: 0, netCatches: 0, outed: 0, playTicks: 0 }, finished: false, prefs: { assist: false, zoom: 3, beeps: true } }));
    },
    { key: SAVE_KEY, cleared },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);

async function title(page: Page) {
  await page.goto("/games/last-pixel/play");
  await expect(page.locator("button[data-play]")).toBeEnabled({ timeout: 10_000 });
}

/** Drag the mouse along a row of the canvas, in small steps (cells → screen). */
async function sweep(page: Page, y: number) {
  const box = (await page.locator("[data-game-area] canvas").boundingBox())!;
  const cell = box.width / 128;
  const at = (x: number) => ({ x: box.x + x * cell, y: box.y + y * cell });
  await page.mouse.move(at(1).x, at(1).y);
  await page.mouse.down();
  for (let x = 1; x <= 127; x += 1.2) await page.mouse.move(at(x).x, at(x).y);
  await page.mouse.up();
}

/** Where Pix is on the canvas: its square is the one patch of its cream glow colour (screen px), or null. */
function findPix(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-game-area] canvas")!;
    const g = canvas.getContext("2d")!;
    const { data, width, height } = g.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        if (Math.abs(data[i]! - 255) < 3 && Math.abs(data[i + 1]! - 244) < 3 && Math.abs(data[i + 2]! - 214) < 3) {
          const r = canvas.getBoundingClientRect();
          return { x: r.left + (x / width) * r.width, y: r.top + (y / height) * r.height };
        }
      }
    }
    return null;
  });
}

test("the title's logo is missing the dot on its i (Pix has it), and Play opens Fresh Coat", async ({ page }) => {
  await seed(page);
  await title(page);
  await expect(page.locator('[data-logo="missing"]').first()).toBeVisible();
  await page.locator("button[data-play]").click();
  await expect(page.locator('[data-game-area][data-level="1-01"]')).toBeVisible();
  await expect(page.locator('[data-overlay="start"]')).toContainText("Fresh Coat");
});

test("paint the whole wall with real strokes: the last pixel wakes up, and a click on it makes it 100%", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse");
  test.setTimeout(90_000);
  await seed(page);
  await title(page);
  await page.locator("button[data-play]").click();
  await page.locator("button[data-start]").click();
  const area = page.locator("[data-game-area]");
  // Rows three cells apart, top to bottom: the roller covers them all (twice, to be sure of its soft edges).
  for (const offset of [2.5, 4]) {
    for (let y = offset; y < 60; y += 3) await sweep(page, y);
    if ((await area.getAttribute("data-sim")) !== "clean") break;
  }
  // The last cell won't go: it's Pix.
  await expect(area).not.toHaveAttribute("data-sim", "clean");
  await expect(area).toHaveAttribute("data-progress", /^99\.\d+%$/);
  await page.mouse.move(640, 760);
  await expect(area).toHaveAttribute("data-sim", "hunt", { timeout: 5000 });
  await page.waitForTimeout(1200);
  // Find it, and click it (it runs: try a few times).
  for (let k = 0; k < 20 && (await area.getAttribute("data-sim")) === "hunt"; k++) {
    const pix = await findPix(page);
    if (pix) await page.mouse.click(pix.x, pix.y);
    await page.waitForTimeout(150);
  }
  await expect(page.locator("[data-cleared]")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("[data-cleared]")).toContainText("100%");
  await expect.poll(async () => (await stored(page))?.levels["1-01"]?.clears).toBe(1);
  // On to the next.
  await page.locator("button[data-next]").click();
  await expect(page.locator('[data-game-area][data-level="1-02"]')).toBeVisible();
});

test("Esc pauses (a real dead pixel would still be there), and Carry on carries on", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page);
  await title(page);
  await page.locator("button[data-play]").click();
  await page.locator("button[data-start]").click();
  await sweep(page, 20);
  await expect(page.locator("[data-game-area]")).not.toHaveAttribute("data-progress", "0%");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-overlay="paused"]')).toBeVisible();
  await page.locator("button[data-start]").click();
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-phase", "play");
});

test("the levels: done ones show their finished picture; the next one's open, the rest locked", async ({ page }) => {
  await seed(page, ["1-01", "1-02"]);
  await title(page);
  await expect(page.locator("[data-totals]")).toContainText("2 of 41");
  await page.locator("button[data-open-levels]").click();
  await expect(page.locator('[data-level-card="1-01"]')).toBeEnabled();
  await expect(page.locator('[data-level-card="1-03"]')).toBeEnabled();
  await expect(page.locator('[data-level-card="1-03"]')).toHaveAttribute("aria-current", "true");
  await expect(page.locator('[data-level-card="1-04"]')).toBeDisabled();
  await expect(page.locator('[data-world="2"]')).toBeDisabled();
});

test("options are saved: hunt assist, the magnifier's strength, the detector's beeps", async ({ page }) => {
  await seed(page);
  await title(page);
  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Options" });
  await options.getByRole("switch", { name: "Hunt assist" }).click();
  await options.locator('[data-zoom="4"]').click();
  await options.getByRole("switch", { name: "Detector beeps" }).click();
  await expect.poll(async () => (await stored(page))?.prefs).toEqual({ assist: true, zoom: 4, beeps: false });
});

test("on a phone: Play, Start, and a finger dragged across the wall paints it", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await seed(page);
  await title(page);
  await page.locator("button[data-play]").tap();
  await page.locator("button[data-start]").tap();
  const box = (await page.locator("[data-game-area] canvas").boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const y = box.y + box.height * 0.4;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + 8, y }] });
  for (let k = 1; k <= 16; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + 8 + ((box.width - 16) * k) / 16, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("[data-game-area]")).not.toHaveAttribute("data-progress", "0%");
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-sim", "clean");
});
