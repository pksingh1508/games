// End-to-end tests (Plan/gameStack.md §16.2). They run against the real static build:
//   pnpm build && pnpm e2e
// Set E2E_BASE_URL to test a server that's already running (e.g. `pnpm dev`), and
// PLAYWRIGHT_CHROMIUM_PATH to use a Chromium you already have instead of `playwright install`.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    // The offline service worker would serve a previous build; tests always want this one.
    serviceWorkers: "block",
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `pnpm dlx serve@14 out -l ${PORT} --no-clipboard`, port: PORT, reuseExistingServer: true },
});
