// Cursor Escape end to end (Plan/12-cursor-escape.md §14), against the real static build, on a computer
// and on a phone. That every window can be escaped is proven by the unit tests (the solver's runs,
// replayed); these check the real thing: the boot, the input, the screens and the saves. Headless
// browsers can't capture the mouse, so the computer tests play in trackpad mode (drag to move, tap to
// click), which runs the same pipeline.
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "mfg:game:cursor-escape";
const C = Array.from({ length: 10 }, (_, i) => `C-${String(i + 1).padStart(2, "0")}`);

/** Start with these windows closed (once per test: reloads keep what the game saved). */
async function seed(page: Page, cleared: string[], { calibrated = true, trackpad = true } = {}) {
  await page.addInitScript(
    ({ key, cleared, calibrated, trackpad }) => {
      if (sessionStorage.getItem("ce-seeded")) return;
      sessionStorage.setItem("ce-seeded", "1");
      const levels: Record<string, unknown> = {};
      for (const id of cleared) levels[id] = { clears: 1, crashes: 1, best: 700, medal: "silver", clean: false };
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 1,
          levels,
          crashes: 3,
          achievements: {},
          calibrated,
          finished: false,
          stats: { turnedClean: 0, playTicks: 0 },
          prefs: { sensitivity: 1, trackpadSensitivity: 1, trackpad, raw: false, steady: false, assist: false },
        }),
      );
    },
    { key: SAVE_KEY, cleared, calibrated, trackpad },
  );
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SAVE_KEY);

async function boot(page: Page) {
  await page.goto("/games/cursor-escape/play");
  await expect(page.locator("button[data-start]")).toBeEnabled({ timeout: 10_000 });
}

/** In trackpad mode: drag the mouse by (dx, dy) screen px, in small steps. */
async function drag(page: Page, dx: number, dy: number) {
  const x = 640;
  const y = 380;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
  for (let i = 1; i <= steps; i++) await page.mouse.move(x + (dx * i) / steps, y + (dy * i) / steps);
  await page.mouse.up();
  // A beat for the loop to take it.
  await page.waitForTimeout(80);
}

test("DeskOS boots; a new player sets the pointer speed, and C:\\-01 opens", async ({ page, isMobile }) => {
  test.skip(isMobile, "Phones tap (below)");
  await seed(page, [], { calibrated: false });
  await boot(page);
  await expect(page.getByRole("heading", { name: /Cursor\s*Escape/ })).toBeVisible();
  await page.keyboard.press("Enter");
  const calibration = page.getByRole("dialog", { name: "Pointer speed" });
  await expect(calibration).toBeVisible();
  // Up from 1× to 1.4× (the slider moves in steps of 0.05).
  await calibration.locator('[data-speed="sensitivity"]').focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight");
  await calibration.getByRole("button", { name: "That feels right" }).click();
  await expect(page.locator('[data-level="C-01"]')).toBeVisible();
  await expect(page.locator('[data-overlay="start"]')).toContainText("Drag anywhere");
  await expect.poll(async () => (await stored(page))?.prefs.sensitivity).toBe(1.4);
  expect((await stored(page)).calibrated).toBe(true);
});

test("trackpad mode: a drag moves the cursor; into a wall, and it crashes (and counts)", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse");
  await seed(page, []);
  await boot(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.locator("[data-capture]").click();
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-phase", "play");
  await expect(page.locator("[data-crash-count]")).toContainText("0");
  // C:\-01's first wall is 120 desktop px to the right of the start (the screen's at twice the size).
  await drag(page, 330, 0);
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-crashes", "1");
  await expect.poll(async () => (await stored(page))?.crashes).toBe(4);
});

test("escape C:\\-01 for real: round the walls, up to the [X], click", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mouse");
  await seed(page, []);
  await boot(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.locator("[data-capture]").click();
  // From the start (88, 264): up over the first wall, across, down past the pop-up's side, under the
  // second wall, along, and up through the opening to the [X] (desktop px; the screen's twice the size).
  await drag(page, 0, -2 * 204);
  await drag(page, 2 * 162, 0);
  await drag(page, 0, 2 * 270);
  // The pop-up between the walls bounces to the bottom and back up (its clock starts with the first
  // move): wait for it to climb out of the way. It's clear of the bottom from 4 s in until 12 s.
  const seconds = async () => {
    const [m, s] = ((await page.locator("[data-clock]").textContent()) ?? "0:0").split(":");
    return Number(m) * 60 + Number(s);
  };
  await expect.poll(seconds, { intervals: [100], timeout: 10_000 }).toBeGreaterThanOrEqual(4.2);
  await drag(page, 2 * 365, 0);
  await drag(page, 0, -2 * 310);
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-crashes", "0");
  await page.mouse.click(640, 380);
  await expect(page.locator("[data-cleared]")).toBeVisible();
  await expect(page.locator("[data-cleared]")).toContainText("Window closed");
  await expect.poll(async () => (await stored(page))?.levels["C-01"]?.clears).toBe(1);
  // Next: C:\-02.
  await page.locator("[data-next]").click();
  await expect(page.locator('[data-level="C-02"]')).toBeVisible();
});

test("Esc pauses, and Continue carries on", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard");
  await seed(page, []);
  await boot(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.locator("[data-capture]").click();
  await drag(page, 0, -40);
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-overlay="paused"]')).toBeVisible();
  await page.locator("[data-capture]").click();
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-phase", "play");
});

test("the desktop: windows open one after another; drives open when the last one's closed", async ({ page }) => {
  await seed(page, C);
  await boot(page);
  await page.getByRole("button", { name: "Continue" }).click();
  // The next window to close is picked: D:\-01, in D:\.
  await expect(page.locator('[data-file="D-01"]')).toHaveAttribute("aria-current", "true");
  await expect(page.locator('[data-drive="E"]')).toBeDisabled();
  await expect(page.locator('[data-file="D-02"]')).toBeDisabled();
  await page.locator('[data-drive="C"]').click();
  await expect(page.locator('[data-file="C-10"]')).toBeEnabled();
  await expect(page.locator('[data-file="C-01"]')).toContainText("0:05.8");
  // The drive's score: ten windows at 5.8 s each, and a crash in each.
  await expect(page.locator("[data-drive-score]")).toContainText("10/10 closed");
  await expect(page.locator("[data-drive-score]")).toContainText("Drive time 0:58.3");
  await expect(page.locator("[data-drive-score]")).toContainText("10 crashes");
});

test("options: trackpad mode and steady mode are saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard and mouse");
  await seed(page, [], { trackpad: false });
  await boot(page);
  await page.getByRole("button", { name: "Options" }).click();
  const options = page.getByRole("dialog", { name: "Options" });
  await options.getByRole("switch", { name: "Trackpad mode" }).click();
  await options.getByRole("switch", { name: "Steady mode" }).click();
  await expect.poll(async () => (await stored(page))?.prefs).toMatchObject({ trackpad: true, steady: true });
});

test("on a phone: Start, then drag anywhere to move the cursor", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch only");
  await seed(page, [], { trackpad: false });
  await boot(page);
  await page.getByRole("button", { name: "Start" }).tap();
  await expect(page.locator('[data-level="C-01"]')).toBeVisible();
  await page.locator("[data-capture]").tap();
  await expect(page.locator("[data-game-area]")).toHaveAttribute("data-phase", "play");
  // A real touch drag (through the protocol): up the screen.
  const cdp = await page.context().newCDPSession(page);
  const size = page.viewportSize()!;
  const x = size.width / 2;
  const y = size.height * 0.75;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - i * 8 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  // The clock started: the cursor moved.
  await expect(page.locator("[data-clock]")).not.toHaveText("0:00.0");
});
