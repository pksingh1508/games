# Game Stack

> Everything we need to build the 15 games beautifully, with one hard rule: **all player data stays on the player's own device.** No database, no accounts, no backend server.

**Research date:** 3 October 2026.
- **Versions and licences** were checked on the npm registry.
- **Bundle sizes** were measured locally: each library was bundled with esbuild using the imports we'd actually use, minified and gzipped, with React excluded.
- **Browser support** was checked on MDN, caniuse and the WebKit blog.
- **Next.js details** were checked against the docs bundled with this project's Next.js 16.3.8 (`node_modules/next/dist/docs/`).
- **Font licences** were checked in Google's official font repository.

### Contents
1. The stack at a glance
2. The local-only rule
3. App framework, build & hosting
4. Offline play & installing (PWA)
5. Local data: storage, saves & backups
6. Rendering & the game engine
7. Physics
8. Animation & "juice"
9. Audio
10. Visual design system (theme & colours)
11. Typography (fonts)
12. Icons, art & the asset pipeline
13. Menus & UI components
14. Input & device APIs
15. Per-game library map
16. Testing, debugging & quality
17. Performance budgets
18. Browser support
19. Project structure
20. Install commands
21. Licences & credits
22. Decisions log

---

## 1. The Stack at a Glance

| Area | Choice | Version | Size (min + gzip) | Licence |
|---|---|---|---|---|
| Framework | **Next.js** (App Router, **static export**) | 16.3.8 | — | MIT |
| UI library | **React** | 19.2.8 | — | MIT |
| Language | **TypeScript** (strict) | 5.x | — | Apache-2.0 |
| Styling | **Tailwind CSS** | 4.x | — | MIT |
| Package manager | **pnpm** | 10.33 | — | MIT |
| Menus & settings | **Radix UI** primitives (`radix-ui`) | 1.6.7 | 20.3 KB (Dialog + Slider + Switch) | MIT |
| Class helpers | **clsx** + **tailwind-merge** | 2.1.1 / 3.7.0 | small | MIT |
| UI animation | **Motion** (`motion/react`) | 14.0.0 | 28.7 KB (with `LazyMotion`) | MIT |
| Game rendering | **Our own engine** on Canvas 2D + a small WebGL2 effects layer | — | 0 KB of libraries | — |
| Physics (Panic Stack only) | **Planck.js** | 1.5.0 | 44.8 KB | MIT |
| Audio | **Our own Web Audio wrapper** + **ZzFX** for retro sound effects | ZzFX 1.4.0 | 1.0 KB | MIT |
| Celebrations | **canvas-confetti** | 1.9.4 | 4.2 KB | ISC |
| UI state | **Zustand** | 5.0.15 | ≤ 1.3 KB | MIT |
| Small saves | **localStorage** (built into the browser) | — | 0 KB | — |
| Big saves | **IndexedDB** via **`idb`** | 8.0.3 | 1.4 KB | ISC |
| Save validation | **Valibot** | 1.5.0 | 1.8 KB | MIT |
| Compression | **`CompressionStream`** (built into the browser) | — | 0 KB | — |
| Offline & install | **Serwist** (`serwist` + `@serwist/build`) + a web app manifest | 9.5.12 | runs in the service worker | MIT |
| Fonts | **`next/font`** (self-hosted Google Fonts + local font files) | built in | — | OFL / Apache-2.0 |
| Icons | **lucide-react**, **pixelarticons**, game-icons.net | 1.51.0 / 2.4.1 / — | per icon | ISC / MIT / CC BY 3.0 |
| Level editor | **LDtk** (desktop app) | — | — | MIT |
| Unit tests | **Vitest** + **fake-indexeddb** | 5.0.3 / 6.2.5 | dev only | MIT / Apache-2.0 |
| End-to-end tests | **Playwright** + **@axe-core/playwright** | 1.63.0 / 4.13.0 | dev only | Apache-2.0 / MPL-2.0 |
| Lint & format | **ESLint** + `eslint-config-next` + **Prettier** + `prettier-plugin-tailwindcss` | 10.12 / 16.3.8 / 3.9.9 / 0.8.1 | dev only | MIT |
| Tuning panel | **lil-gui** | 0.21.0 | dev only | MIT |
| Webcam blink detection (Don't Blink, opt-in, later) | **MediaPipe Tasks Vision** | 1.0.1 | loaded only when turned on | Apache-2.0 |

**In one sentence:** a static Next.js site, our own small game engine on Canvas, a handful of tiny libraries, and every save kept in the browser's own storage.

---

## 2. The Local-Only Rule

### What it means
- **Everything the player creates stays in their browser:** progress, settings, stats, replays and custom levels.
- **The website is just files.** The host serves HTML, JavaScript, CSS, images and sounds. It never receives player data.
- **We don't use:** a database, accounts or login, a backend API, cookies, analytics or tracking, error-reporting services, or any third-party request while playing. Fonts are self-hosted, and nothing loads from a CDN.
- **Data only leaves the device when the player decides to share it:** a share card, a challenge link or an exported save file.

### Server features in the plans, and their local versions
A few "later" ideas in the game plans needed a server. Here is the local-only replacement for each (the plan files have been updated to match):

| Feature in the plans | Needed a server for | Local-only version |
|---|---|---|
| Global leaderboards (TrapSprint, Almost There, Glitch Run, Panic Stack, Wrong Door) | Storing everyone's scores | **Personal bests + a local top 10** per level, plus **challenge links** that friends play on their own devices |
| Server-verified speedrun times (TrapSprint) | Re-running replays on a server | **Ghost links:** the friend's browser re-runs the recording with the same deterministic engine and checks the time |
| Global death heatmap (TrapSprint) | Collecting everyone's deaths | **Personal death heatmap:** all of your own deaths, stored locally |
| Daily challenges that are "the same for everyone" | Nothing! | Still works. The seed is calculated from the date **on the device** |
| Community levels, question packs and rooms | Hosting uploads | **Share codes** inside links, and `.mfglevel` files |
| Analytics for tuning difficulty | Collecting play data | None in production. Playtesters press **"Copy debug report"** and send it themselves |
| Cloud saves / playing on another device | Syncing | **Export/import a save file**, or copy a per-game **save code** |
| Crash reporting (e.g. Sentry) | Sending errors | A **local error log** (the last 20 errors), included in the debug report |

### Trade-offs we accept
- **Browser data can disappear.** Players can clear it, and browsers can evict it. Section 5.6 explains our defences.
- **Players can edit their own saves.** That's fine: these are single-player games with nothing to protect.
- **No global rankings.** Friend challenges replace them, and they suit these games better anyway. "Beat my 41 deaths" is funnier than rank #18,204.

---

## 3. App Framework, Build & Hosting

### 3.1 Next.js static export
The whole site is built into plain files at build time. In `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",              // build the site into /out as static HTML/CSS/JS
  images: { unoptimized: true }, // the default image optimizer needs a server
};

export default nextConfig;
```

What the bundled Next.js 16 docs (`static-exports.md`) say, and how it fits our plan:
- ✅ **Server Components still work.** They run **during the build**, so the hub and every game page are prerendered.
- ✅ **Client Components work normally.** Every game is one.
- ✅ **Dynamic routes work** when every path comes from `generateStaticParams()` and `dynamicParams` is `false`, which is exactly our `/games/[slug]` plan.
- ✅ **Route Handlers** work only as static `GET` files (`export const dynamic = 'force-static'`).
- ❌ **Not available:** cookies, rewrites, redirects, `headers()`, Proxy (the old middleware), Server Actions, ISR, draft mode and the default `next/image` optimizer. **We need none of them.**
- **Browser APIs** (`localStorage`, `window`, `navigator`) may only be used in client code: effects, event handlers and client-only modules. Pages are prerendered at build time, where those APIs don't exist.

### 3.2 Hosting
- Any static host with **HTTPS** works. HTTPS is required for service workers and for installing the app. Good free options: **Cloudflare Pages**, **Netlify**, **Vercel**, **GitHub Pages**.
- The host only serves files, so **it never sees player data**.
- `headers()` doesn't work in a static export, so set headers in the **host's own config** (a `_headers` file on Netlify / Cloudflare Pages, `vercel.json` on Vercel):

| Path | Header | Why |
|---|---|---|
| `/sw.js` | `Cache-Control: no-cache` | Browsers always check for a new service worker |
| `/_next/static/*` and `/assets/*` | `Cache-Control: public, max-age=31536000, immutable` | File names contain content hashes, so they can be cached forever |
| `/*` | `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` | Basic safety |
| `/*` (optional) | `Content-Security-Policy` including `connect-src 'self'` | **Enforces the local-only promise:** the page can't send data to any other site. Test carefully, because Next.js output includes inline scripts |

### 3.3 TypeScript, linting & formatting
- **TypeScript strict mode** is already on. Also enable `noUncheckedIndexedAccess`: game code reads arrays constantly, and this catches out-of-bounds bugs.
- **`next lint` was removed in Next.js 16** (per the v16 upgrade guide). Use the ESLint CLI with the official flat config, plus Prettier:

```js
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

- **Prettier** with `prettier-plugin-tailwindcss` sorts Tailwind classes automatically.

### 3.4 Scripts
```jsonc
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build && node scripts/build-sw.mjs",  // static site + service worker
    "preview": "pnpm dlx serve out",                      // test the real static build locally
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "assets:build": "node scripts/build-assets.mjs"
  }
}
```

> **pnpm 10 note:** pnpm 10 doesn't run dependencies' install scripts unless you approve them. This project's `pnpm-workspace.yaml` already lists `sharp` under `ignoredBuiltDependencies`. If `esbuild` or `sharp` fails to load in our build scripts, run `pnpm approve-builds`.

---

## 4. Offline Play & Installing (PWA)

### 4.1 Why it matters for these games
- **Offline play:** on a plane, on the metro, on bad Wi-Fi.
- **On iPhone and iPad, installing protects saves.** Safari deletes **all** script-written storage (localStorage, IndexedDB and service worker caches) for any site the player hasn't interacted with in **7 days of Safari use**. WebKit says web apps **added to the Home Screen have their own days-of-use counter**, and it doesn't expect their data to be deleted. Since Safari 17, persistent storage is also granted based on signals like whether the site runs as a Home Screen web app.

### 4.2 Web app manifest
Next.js generates the manifest from `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mind Games Arcade",          // working title
    short_name: "Mind Games",
    description: "15 short games that lie to you. Fairly.",
    start_url: "/",
    display: "standalone",
    display_override: ["fullscreen", "standalone"],
    orientation: "any",
    background_color: "#0E0B16",
    theme_color: "#0E0B16",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

In the root layout's `metadata`, also set `appleWebApp: { capable: true, title: "Mind Games" }`, and add an `apple-icon.png` (180×180) file for iOS.

### 4.3 Service worker: built after the export
**Decision:** use **Serwist** (the option the Next.js PWA guide points to for offline caching), but build the worker **after** `next build`, straight from the exported `out/` folder.

**Why not Serwist's Turbopack route handler (`@serwist/turbopack`)?** We read its source. It serves the worker at `/serwist/sw.js` and registers it for the whole site (scope `/`). A worker inside `/serwist/` can only control the whole site if the server sends a `Service-Worker-Allowed: /` header. The route handler adds that header when running `next start`, but a static host just serves the file without it, so registration would fail. Building `out/sw.js` at the site root avoids the problem, and the precache list then comes from the **real exported files**, HTML pages included.

`@serwist/build`'s `injectManifest` only inserts the file list; it doesn't bundle code. So we bundle `sw.ts` with esbuild first.

```ts
// src/sw/sw.ts — the service worker source (bundled by scripts/build-sw.mjs)
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST, // app shell: pages, JS, CSS, fonts, icons
  skipWaiting: false,                  // never swap versions mid-game; the hub asks first
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // game art & audio: cached the first time a game uses them
      matcher: ({ url }) => url.pathname.startsWith("/assets/"),
      handler: new CacheFirst({
        cacheName: "mfg-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 3000 })],
      }),
    },
  ],
});

// The hub sends this when the player taps "Update"
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

serwist.addEventListeners();
```

```js
// scripts/build-sw.mjs — runs after `next build`
import { build } from "esbuild";
import { injectManifest } from "@serwist/build";

await build({
  entryPoints: ["src/sw/sw.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: ".sw/sw.js",
});

const { count, size, warnings } = await injectManifest({
  swSrc: ".sw/sw.js",
  swDest: "out/sw.js",
  globDirectory: "out",
  globPatterns: ["**/*.{html,js,css,woff2,webmanifest,ico,svg,png}"],
  globIgnores: ["assets/**", "sw.js"],           // game assets are cached on demand
  dontCacheBustURLsMatching: /^_next\/static\//, // already content-hashed
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
});
console.log(`Precached ${count} files (${Math.round(size / 1024)} KB)`, warnings);
```

- Serwist's precache matches **clean URLs** by default (`cleanURLs: true`), so a visit to `/games/nope` is served from the precached `games/nope.html`.
- Register the worker from a small client component in the root layout, in production only: `navigator.serviceWorker.register("/sw.js", { scope: "/" })`.
- **Already tested once:** both snippets above pass `tsc --strict`, and the script was run against a sample `out/` folder. It precached the HTML pages and the `_next/static` files, skipped `assets/`, and wrote a ~35 KB `out/sw.js`.
- **Spike it in the real app first (M0):** build, serve `out/` with `pnpm preview`, go offline in DevTools and confirm the hub and a played game still load.

### 4.4 What gets cached, and when
| What | When it's cached | Size target |
|---|---|---|
| App shell: hub, game pages, JS/CSS chunks, fonts, icons | When the service worker installs (first visit) | ≤ 3 MB |
| A game's art & audio (`/assets/<slug>/…`) | The first time that game loads them | 2–8 MB per game (see 12.5) |
| **"Download for offline"** (button per game) | When the player taps it: the page reads the game's asset `manifest.json` and adds every file to the cache | Shows the size before downloading |

### 4.5 Updates
- A new version installs in the background and **waits**.
- The hub shows *"A new version is ready → Update"*. **Never during a game.** On tap: send `SKIP_WAITING`, then reload.
- Save formats are versioned (Section 5.4), so new code can always read old saves.

### 4.6 Install prompts
- **iPhone / iPad:** there's no automatic install prompt (the Next.js PWA guide notes `beforeinstallprompt` doesn't work on iOS Safari). After the 3rd visit, or after a big milestone, show a short sheet: *"Tap Share → Add to Home Screen. Your progress will be safer, and the games work offline."* Hide it when already installed (`matchMedia('(display-mode: standalone)')`, or `navigator.standalone` on older iOS).
- **Android / desktop Chrome & Edge:** the browser offers installing by itself. Optionally add an "Install" button using `beforeinstallprompt`.
- Next.js's experimental `useOffline` hook is meant for server-backed apps that retry network requests. We don't need it.

---

## 5. Local Data: Storage, Saves & Backups

### 5.1 Where data lives
| Storage | What we keep there | Limits | Notes |
|---|---|---|---|
| **localStorage** | Settings, profile, and each game's progress (small JSON) | About **5 MiB per site** in total (MDN) | Synchronous, so keep each value small. Can be read **before the first paint** |
| **IndexedDB** (via `idb`) | Replays and ghosts, run history, custom levels, images, backups | Large. Chrome/Edge: up to **60% of the disk**. Firefox: **10% of the disk or 10 GiB** (best-effort). Safari 17+: about **60% of the disk** for browser apps | Asynchronous, transactional, stores binary data |
| **sessionStorage** | One-visit flags (e.g. Don't Trust The Game's reload puzzle) | About 5 MiB | Cleared when the tab closes |
| **Cache Storage** | The service worker's copies of app files and game assets | Shares the IndexedDB quota | Not player data; it can always be downloaded again |
| **Cookies** | Not used | — | There's no server to send them to |
| **OPFS** (private file system) | Not needed now | — | An option if replays ever get huge |

> **Important (MDN):** when a browser evicts a site's data, it deletes **all** of that site's data at the same time (for example IndexedDB and the Cache API together), not just part of it. That's why backups (5.6) matter.

### 5.2 Libraries, and why
| Need | Choice | Measured size | Alternative we rejected |
|---|---|---|---|
| IndexedDB access | **`idb`**, a typed promise wrapper | 1.4 KB | **Dexie** (32.0 KB): great, but we don't need its query engine |
| Validating saves and imported files | **Valibot** | 1.8 KB | **Zod 4**: 90.1 KB with its classic API (in our test it doesn't tree-shake), 5.6 KB with `zod/mini` |
| UI state (menus, toasts, hub) | **Zustand** | ≤ 1.3 KB | React context alone (extra re-renders) |
| Compressing save files and share codes | Built-in **`CompressionStream("gzip")`** | 0 KB | **fflate** (5.0 KB) and **lz-string** (1.7 KB): only needed for Firefox 111–112 |
| Multi-tab safety | Built-in **Web Locks** + **BroadcastChannel** | 0 KB | — |
| Checksums | Built-in `crypto.subtle.digest("SHA-256")` | 0 KB | — |

All **persisted** data goes through our save system (`engine/save`), so versioning, validation and multi-tab safety live in one place. Zustand holds in-memory UI state only.

### 5.3 Names & layout
```
localStorage
  mfg:settings              global settings (volume, comfort options, colourblind mode, calibration…)
  mfg:profile               optional nickname + avatar for share cards (never sent anywhere)
  mfg:meta                  achievements index, session count, last backup date, install-prompt state
  mfg:game:<slug>           one small save per game (progress, stars, medals, stats)
  mfg:errors                the last 20 errors (for "Copy debug report")

IndexedDB — database "mfg"
  runs                      run history: daily results, endless runs, local top 10
  replays                   input recordings: ghosts, All-Deaths Replay, challenge runs
  levels                    custom levels from the editors (later)
  media                     images: share cards, Fall Cam clips (later)
  backups                   automatic snapshots before migrations and imports (last 3)

sessionStorage
  mfg:session:<slug>:<name> one-visit flags
```
Every stored object has a version field `v`, so it can be upgraded later.

### 5.4 The save system (`src/engine/save/`)

**Loading a save**
1. Read the raw value (`localStorage.getItem`).
2. `JSON.parse` it.
3. **Migrate** it step by step (v1 → v2 → v3…).
4. **Validate** it with Valibot.
5. If anything fails: copy the raw data into the IndexedDB `backups` store (so nothing is lost), reset **only that game's** save, and show a gentle notice. Never wipe everything.

**Writing a save**
- Writes are **debounced** (at most every 500 ms) and **flushed immediately** on `visibilitychange` (when hidden) and `pagehide`, so closing the tab never loses progress.
- Almost There writes every 250 ms while Pip is moving (its anti save-scum rule).
- Every write sits in a `try/catch`. If storage is full (`QuotaExceededError`) or blocked (some private modes), the game keeps running with an in-memory save and shows *"Progress can't be saved in this browser mode."*

**Several tabs open**
- Writes run inside `navigator.locks.request("mfg:save:<slug>", …)`, so two tabs never write at the same moment.
- After writing, a `BroadcastChannel("mfg")` message tells other tabs to reload that save.
- If the same game is open in two tabs, the older tab pauses and shows *"This game is open in another tab."*

**API sketch**
```ts
// src/engine/save/define-save.ts
import * as v from "valibot";

export interface SaveDef<T> {
  key: string;                                     // "mfg:game:trapsprint"
  version: number;                                 // current schema version
  schema: v.GenericSchema<unknown, T>;
  defaults: () => T;
  migrations?: Record<number, (old: any) => any>;  // migrations[1] turns v1 into v2
}

export function defineSave<T>(def: SaveDef<T>) {
  return {
    load(): T { /* read → parse → migrate → validate → defaults on failure */ },
    update(change: (current: T) => T): void { /* debounced, locked write */ },
    flush(): Promise<void> { /* immediate write, used on pagehide */ },
    subscribe(listener: (value: T) => void): () => void { /* for useSyncExternalStore */ },
  };
}
```

**Example: TrapSprint's save**
```ts
// src/games/trapsprint/save.ts
import * as v from "valibot";
import { defineSave } from "@/engine/save";

const LevelResult = v.object({
  bestMs: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  deaths: v.pipe(v.number(), v.integer(), v.minValue(0)),
  medal: v.picklist(["none", "bronze", "silver", "gold", "dev"]),
});

const TrapSprintSaveV1 = v.object({
  v: v.literal(1),
  levels: v.record(v.string(), LevelResult),      // "1-01" → result
  totalDeaths: v.pipe(v.number(), v.integer(), v.minValue(0)),
  achievements: v.array(v.string()),
  remixUnlocked: v.boolean(),
});

export type TrapSprintSave = v.InferOutput<typeof TrapSprintSaveV1>;

export const trapSprintSave = defineSave<TrapSprintSave>({
  key: "mfg:game:trapsprint",
  version: 1,
  schema: TrapSprintSaveV1,
  defaults: () => ({ v: 1, levels: {}, totalDeaths: 0, achievements: [], remixUnlocked: false }),
});
```

**IndexedDB schema (typed with `idb`)**
```ts
// src/engine/save/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface MfgDB extends DBSchema {
  runs: {
    key: number;                                  // auto-increment
    value: { game: string; level?: string; mode: string; score: number; at: number; seed?: number };
    indexes: { "by-game": string; "by-game-level": [string, string] };
  };
  replays: {
    key: string;                                  // e.g. "trapsprint:1-04:best"
    value: {
      game: string;
      level: string;
      kind: "best" | "attempt" | "challenge";
      engineVersion: number;                      // replays only work with the same physics
      inputs: Uint8Array;                         // run-length encoded input bits
      timeMs: number;
      at: number;
    };
  };
  levels: { key: string; value: { game: string; name: string; data: unknown; updatedAt: number } };
  media: { key: string; value: Blob };
  backups: { key: number; value: { at: number; reason: string; data: string } };
}

let dbPromise: Promise<IDBPDatabase<MfgDB>> | undefined;

// Lazy, so nothing touches IndexedDB while Next.js prerenders pages at build time
export function getDb() {
  dbPromise ??= openDB<MfgDB>("mfg", 1, {
    upgrade(db) {
      const runs = db.createObjectStore("runs", { autoIncrement: true });
      runs.createIndex("by-game", "game");
      runs.createIndex("by-game-level", ["game", "level"]);
      db.createObjectStore("replays");
      db.createObjectStore("levels");
      db.createObjectStore("media");
      db.createObjectStore("backups", { autoIncrement: true });
    },
  });
  return dbPromise;
}
```

**Replay format:** one input byte per simulation tick (bit 0 = left, bit 1 = right, bit 2 = jump, and so on), run-length encoded. A 10-second run is usually a few hundred bytes. Each replay stores `engineVersion`. If the physics changes, old ghosts are marked "outdated" and kept, but not raced.

### 5.5 What each game stores
| Game | localStorage (small) | IndexedDB (large) | Approx. size |
|---|---|---|---|
| **Global** | Settings, profile, meta (achievements index, sessions, last backup, install-prompt state), error log | Backups | ~10 KB |
| One More Step | Stars and steps per level, stats, unlocked worlds, finale flag | Daily Step history, custom levels (later) | ~10 KB |
| NOPE! | Episode progress, best scores, NOPE count, achievements, current run (hearts, stamps, answers for memory questions) | Run history | ~10 KB |
| 99 Seconds | Chapter progress, journal facts, loop count, room-memory flags, endings | — | ~20 KB |
| Don't Trust The Game | Scene progress, secrets found, "Trust Issues" stats, "you came back" memory, Truth Mode unlock | — (plus a sessionStorage flag for the reload puzzle) | ~5 KB |
| Fake Floor | Medals per room, falls, pebble stats | Time-trial ghosts (later) | ~10 KB |
| TrapSprint | Best times, medals, deaths per level, achievements | Best-run ghosts, recent attempts for the All-Deaths Replay, death positions (heatmap), custom levels (later) | ~15 KB + ~2 MB |
| Glitch Run | High scores, stage progress, daily results | Daily run replays | ~10 KB + ~1 MB |
| Almost There | The full climb save (position, velocity, screen, stats, feathers, flags), written continuously | Previous save as a backup, best-run ghost, Fall Cam clips (later) | ~2 KB + up to ~5 MB |
| One Tap Chaos | High score, unlocks, daily results (the calibration offset lives in global settings) | Run history | ~5 KB |
| Last Pixel | Stars per level, finale flag | — | ~5 KB |
| Panic Stack | Stars, endless records, daily results | Endless run history | ~5 KB |
| Cursor Escape | Times, medals, drive progress (mouse sensitivity lives in global settings) | — | ~5 KB |
| Wrong Door | Current run (to resume), codex entries, achievements, daily result | Run history | ~10 KB |
| Don't Blink | Nights unlocked, best Endless score, Custom Night presets | — | ~3 KB |
| Gravity Is Lying | Apples per room, best times, Truth Mode unlock | — | ~5 KB |

**Total localStorage:** about 150 KB, far below the ~5 MiB limit. IndexedDB stays in the low megabytes.

### 5.6 Keeping data safe

**The risks**
| Risk | What happens | Who it affects |
|---|---|---|
| The player clears browsing data | Everything is deleted | Everyone |
| Safari's 7-day rule | No interaction for 7 days of Safari use → all script-written storage is deleted (localStorage, IndexedDB, service worker caches) | Safari users who haven't installed the app |
| Storage pressure | The browser evicts the least recently used sites first (unless storage is persistent) | Devices low on space |
| Private / incognito mode | Data is deleted when the private session ends | Private browsing users |
| New phone or computer | Data doesn't follow the player | Everyone |

**Our defences**
1. **Ask for persistent storage** (`navigator.storage.persist()`) after the player's first real progress (e.g. first level cleared), with a one-line explanation. Chrome, Edge and Safari decide automatically without a prompt (Safari favours Home Screen apps). Firefox shows a permission prompt, so we explain first.
2. **Encourage installing on iPhone and iPad** (Section 4.6).
3. **Export / import a save file**, from the "Your Data" page:
   - One file with everything, e.g. `mind-games-2026-10-03.mfgsave`
   - Contains every `mfg:*` localStorage value and every IndexedDB store, gzipped with `CompressionStream`
   - Includes the format version, the export date and a **SHA-256 checksum** to detect damaged files
   - Import validates everything with Valibot, shows a preview (*"TrapSprint: 23 levels, 4 ghosts…"*), then lets the player **merge** (keep the best of both) or **replace**
4. **Save codes per game:** a copyable text code (gzip + base64url) to move one game's progress quickly, for example through a chat app.
5. **Backup reminders:** if there's meaningful progress and no backup in 14 days, the hub shows a small reminder. Never during play.
6. **Automatic snapshots** in IndexedDB before every migration and import (the last 3 are kept). These protect against our own bugs, not against data being cleared.
7. **Fail loudly:** if storage writes fail, show a clear banner instead of failing silently.

**Save file format**
```jsonc
{
  "format": "mfg-save",
  "formatVersion": 1,
  "exportedAt": "2026-10-03T14:22:05Z",
  "appVersion": "1.4.0",
  "localStorage": { "mfg:settings": "{…}", "mfg:game:trapsprint": "{…}" },
  "indexedDB": { "runs": [], "replays": [] },  // binary fields stored as base64
  "checksum": "sha256:…"                       // calculated over everything above
}
```

### 5.7 Sharing without a server
| Share | How it works | Support / fallback |
|---|---|---|
| **Share card** (image) | Draw the result on a canvas → PNG `Blob` → `navigator.share({ files })` | Web Share works in Safari 12.1+, iOS 12.2+, Chrome Android and Chrome desktop 128+. Desktop Firefox doesn't support it → download the image and copy the text instead |
| **Emoji result text** (Wordle-style) | `navigator.clipboard.writeText()` when the player taps "Copy" | Show the text for manual copying if the clipboard is blocked |
| **Challenge link** | `https://<site>/games/<slug>#c=<code>`, where the code is base64url(gzip(JSON with version, seed, score and optional ghost)) | — |
| **Level code** (editors, later) | `#level=<code>` in the link, or a `.mfglevel` file for big levels | — |

- **Why the `#` part of the link?** Browsers never send the text after `#` to the server, so not even the host sees challenge data.
- The receiving browser decodes the code, **validates it with Valibot**, then plays the same seed or races the ghost. For speedrun ghosts it re-runs the recording with the same deterministic engine to **confirm the time is real**. After reading the code, it removes it from the address bar with `history.replaceState`.
- Keep links under about 2,000 characters so chat apps don't break them; use a file for anything bigger.

### 5.8 The "Your Data" page (`/data`)
- **Shows:** storage used (`navigator.storage.estimate()`), whether storage is persistent, the last backup date, and the size per game.
- **Buttons:** Export everything, Import, Delete one game's data, Delete everything (all `mfg:*` keys, the `mfg` database and our caches). Each asks for confirmation.
- **Privacy text, in plain words:** *"No accounts. No database. No cookies. No analytics. Your progress is stored only in this browser, on this device. Nothing is sent anywhere unless you share it."*

---

## 6. Rendering & the Game Engine

### 6.1 Decision: our own small engine on Canvas 2D
| Option | Size (measured) | Good | Not so good | Verdict |
|---|---|---|---|---|
| **Own engine on Canvas 2D** (+ WebGL2 effects) | **0 KB** of libraries | Tiny; full control; a deterministic fixed-step simulation (needed for ghosts, challenge links and solvers); great for pixel art; one engine shared by 12 canvas games | We write sprites, particles, tweens and effects ourselves (all small) | ✅ **Chosen** |
| PixiJS 8.22 | 173.1 KB | Very fast WebGL/WebGPU renderer, ready-made filters (`pixi-filters` 6.1.5) | Heavy for our simple scenes | Upgrade path if one game ever needs much heavier effects |
| Phaser 4.2 | 360.3 KB | Batteries included: scenes, physics, tweens, audio | By far the biggest; it owns the game loop and scene structure, which fights our pure-TypeScript simulations | ❌ |
| Kaplay 3001 | 67.8 KB | Fun for quick prototypes | Its own global-style API; less control over a fixed-step, deterministic loop | ❌ |
| LittleJS 1.24 | 174.8 KB (whole-library import) | Built for small games | Bigger than expected when imported as a whole; its own conventions | ❌ |

### 6.2 Engine modules (`src/engine/`)
| Module | What it does | Used by |
|---|---|---|
| `loop.ts` | Fixed 60 Hz updates, interpolated rendering, auto-pause when the tab is hidden | All canvas games |
| `input.ts` | Keyboard (`event.code`), pointer, touch and gamepad → game actions; key remapping | All games |
| `audio.ts` | Web Audio buses, sound sprites, music, precise scheduling (Section 9) | All games |
| `save/` | localStorage + IndexedDB saves, migrations, backups (Section 5) | All games |
| `rng.ts` | Seeded random numbers (sfc32 + a string hash for date seeds) | Daily modes, generators |
| `tween.ts` | Easing curves + timelines driven by game time | All canvas games |
| `particles.ts` | Pooled particles: dust, rain, sparks, puffs | Most canvas games |
| `camera.ts` | Follow, shake (respects reduce motion), screen cuts, rotation | Platformers |
| `canvas.ts` | High-DPI setup, letterboxing, pixel-perfect scaling | All canvas games |
| `assets.ts` | Loads a game's asset manifest, sprite atlases and audio, with progress | All games |
| `platformer/` | Tile collisions, jump physics, coyote time, moving platforms | TrapSprint, Fake Floor, Almost There, Gravity Is Lying, Glitch Run, Don't Trust The Game |
| `postfx/` | WebGL2 full-screen effects: scanlines, CRT, RGB split, noise, tearing, pixelate, vignette | Glitch Run, Don't Blink, Don't Trust The Game |
| `browser/` | Tab title, favicon, visibility, fullscreen, pointer lock, wake lock | Don't Trust The Game, Last Pixel, Cursor Escape, 99 Seconds |
| `share/` | Share cards and challenge codes (encode, decode, validate) | Most games |
| `debug/` | FPS and frame-time overlay, lil-gui tuning panel, state inspector (development only) | All games |

### 6.3 Game loop rules
- **Fixed timestep:** the simulation always advances in 1/60 s ticks using an accumulator. Rendering interpolates between the last two states, so motion stays smooth on 60, 90, 120 and 144 Hz screens.
- **Clamp long frames** (after a hitch or a tab switch) to 250 ms, so the game never tries to "catch up" hundreds of ticks.
- **Determinism rules** (needed for ghosts, challenge links and solvers):
  - No `Math.random()` inside simulations; use `engine/rng`.
  - No `Date.now()` / `performance.now()` inside simulations; use the tick counter.
  - Read inputs once per tick, and update entities in a fixed order.
- **Keep React out of the hot path:** simulation state lives in plain objects. The HUD subscribes with React's `useSyncExternalStore` and only re-renders when a displayed value changes.

### 6.4 Crisp, good-looking canvas
- Size the canvas by `devicePixelRatio` (capped at 2 on phones, for performance).
- **Pixel art:** render at a fixed low resolution (e.g. 480×270), scale by **whole numbers only**, set `ctx.imageSmoothingEnabled = false` and CSS `image-rendering: pixelated`.
- **Painted and vector art:** draw at full device resolution.
- Use `ResizeObserver` to keep each game letterboxed at its aspect ratio.
- Pre-render static layers (backgrounds, tile maps) to offscreen canvases once, and redraw only what moves.

### 6.5 Screen effects (`engine/postfx`)
- The game draws to a normal canvas, and a second WebGL2 canvas runs one full-screen shader pass on top.
- Each effect is a small fragment shader: scanlines, CRT curve, RGB split, film grain, horizontal tearing, pixelate, colour invert, vignette.
- Feature-detect WebGL2. If it's missing, skip the effects (or use Canvas-only versions of tearing and pixelate).
- Every effect respects **reduce flashing** and **reduce motion**.

---

## 7. Physics

| Game(s) | Physics | Why |
|---|---|---|
| TrapSprint, Fake Floor, Almost There, Gravity Is Lying, Glitch Run, Don't Trust The Game | **Our own** tile physics in `engine/platformer` | Platformer "feel" comes from hand-tuned rules (coyote time, jump buffering, variable jump height), not realistic physics. Small, deterministic, fully ours |
| **Panic Stack** | **Planck.js 1.5.0**, a JavaScript rewrite of Box2D | Stable stacking, sleeping bodies, and a **mouse joint** that makes heavy items lag behind the cursor (the game's main "weight tell") |
| Gravity Is Lying (scarf), Cursor Escape (swept collisions), Last Pixel (coverage grid) | Small custom code | Too specific for a library |

**Physics libraries compared for Panic Stack**
| Library | Version | Size (measured) | Notes | Verdict |
|---|---|---|---|---|
| **Planck.js** | 1.5.0 | **44.8 KB** | Box2D v2 design, pure JavaScript, actively maintained | ✅ |
| Rapier 2D (`@dimforge/rapier2d-compat`) | 0.21.0 | 1,257.6 KB (WebAssembly inlined) | Excellent, and has a cross-platform deterministic build, but about 28× bigger | ❌ for now |
| box2d3-wasm (Box2D v3) | 5.2.0 | not measured | The newest Box2D; worth testing if Planck's stacking isn't stable enough | Backup option |
| Matter.js | 0.20.0 | not measured | Last released mid-2024; its simpler solver is generally less stable for tall stacks | ❌ |

---

## 8. Animation & "Juice"

### 8.1 Menus and screens (React)
- **Motion 14** (`motion/react`) for menus, cards, the NOPE! stamp, page transitions and list changes.
- Use **`LazyMotion` + `m` components**: in our test this cut Motion from **42.1 KB to 28.7 KB**.
- Wrap the app in `<MotionConfig reducedMotion="user">` so Motion follows the system "reduce motion" setting; our own setting can force `"always"`.
- In Playwright tests, `MotionConfig`'s `skipAnimations` option makes screenshots stable.

### 8.2 Inside the games (canvas)
- **Our own `engine/tween.ts`:** standard easing curves (quad, cubic, back, elastic, bounce) and simple timelines, driven by **game time** so tweens pause with the game and stay deterministic.
- **Cutscenes** (Almost There's fake credits, endings, chapter intros) are timelines too.
- **GSAP 3.15** is now free for commercial use (its "Standard no-charge licence" covers games, including the formerly paid plugins). It's 27.0 KB in our test, so we only add it if our own timelines aren't enough.

### 8.3 Celebrations
- **canvas-confetti 1.9.4** (4.2 KB) for NOPE!'s correct answers, Last Pixel's 100% and achievements. Use its `disableForReducedMotion` option.

### 8.4 The juice checklist (for every game)
- **Squash & stretch** on jumps and landings
- **Anticipation:** a tiny wind-up before big actions
- **Easing on everything**: no linear movement in the UI
- **Hit-stop:** freeze for 50–80 ms on deaths and big impacts
- **Screen shake:** small and short; **off** when reduce motion is on
- **Particles:** dust on landing, sparks on hits, puffs on deaths
- **A sound for every action** (Section 9)
- **Number pops:** scores and death counters bounce when they change
- **Instant restart** with a short, satisfying transition (under 300 ms)

---

## 9. Audio

### 9.1 Engine decision
| Option | Version | Size (measured) | Notes | Verdict |
|---|---|---|---|---|
| **Own Web Audio wrapper** (`engine/audio`) | — | 0 KB | Web Audio works in every browser we support. We need precise beat scheduling (One Tap Chaos), synthesized notes (One More Step) and stereo panning (Wrong Door, Don't Blink) | ✅ |
| **ZzFX** | 1.4.0 | 1.0 KB | Generates retro sound effects from a short list of numbers, so no audio files are needed for them | ✅ for retro games |
| Howler.js | 2.2.4 | 10.0 KB | Popular and still works, but its last release was in 2023 | Fallback only |
| Tone.js | 15.1.22 | 80.8 KB | A powerful music framework | ❌ More than we need |

ZzFX ships without TypeScript types, so we add a tiny `zzfx.d.ts` declaration file.

### 9.2 How `engine/audio` works
- **One `AudioContext`** with gain "buses": master → music, sfx and ui. Each bus is connected to a volume setting.
- **Unlock on first input:** browsers start audio "suspended" until the player taps or presses a key, so we resume it on the first `pointerdown` / `keydown`.
- **Sound effects** are decoded into `AudioBuffer`s. Each game's effects are packed into **one audio sprite file** with a list of start and end times, so loading takes one request.
- **Music and memory:** decoded audio is big. A 99-second stereo track at 48 kHz takes about **38 MB** of memory once decoded (99 × 48,000 samples × 2 channels × 4 bytes). So:
  - **Long tracks stream** through an `<audio>` element connected into Web Audio (`MediaElementAudioSourceNode`).
  - Only short or **timing-critical** loops (One Tap Chaos's beat tracks, 99 Seconds' loop music) are fully decoded. Use mono or 32 kHz where quality allows, to halve the memory.
- **Precise timing:** schedule sounds on `AudioContext.currentTime` with a short look-ahead (about 100 ms), never with `setTimeout`.
- **Spatial sound:** `StereoPannerNode` for door positions (Wrong Door) and camera rooms (Don't Blink).
- **Ducking:** lower the music briefly under important cues (Chirp's lines, warnings).
- **Pause with the game**, and `suspend()` the context when the tab is hidden.
- **iPhone tip:** the ring/silent switch can mute web audio. Settings shows a hint: *"No sound on iPhone? Check the silent switch."*

### 9.3 Formats & encoding
- **MP3 is the baseline**, because it plays in every browser we support.
- **Ogg Vorbis and Opus** are only fully supported in Safari **18.4+** (earlier versions have partial support, per caniuse). They're an optional later size optimisation, with MP3 as the fallback.

| Type | Channels | Sample rate | Bitrate |
|---|---|---|---|
| Sound effects | Mono | 44.1 kHz | 96–128 kbps |
| Music | Stereo | 44.1 kHz | 128–160 kbps |
| Character babble (HELPER, Mr. Nope, Chirp) | Mono | 44.1 kHz | 64–96 kbps |

- **Loudness:** normalise music to about −16 LUFS (a common target for phone and web games), and match sound effects by ear so nothing is shockingly louder than the rest.
- **Seamless loops:** MP3 files start with a tiny silence. For music that must loop perfectly, set `loopStart` / `loopEnd` on the decoded buffer, or give tracks a short tail.
- **Batch encoding with ffmpeg** (`scripts/encode-audio.sh`):

```bash
# music: loudness-normalised stereo MP3
ffmpeg -i music/loop.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -b:a 160k public/assets/<slug>/audio/loop.mp3
# sound effect: mono MP3
ffmpeg -i sfx/jump.wav -ac 1 -ar 44100 -b:a 112k public/assets/<slug>/audio/jump.mp3
```

### 9.4 Where sounds come from (licences checked)
| Source | What | Licence | Credit needed? |
|---|---|---|---|
| **ZzFX** / **jsfxr** (sfxr.me) | Make retro sound effects yourself | MIT / Unlicense | No |
| **Kenney** audio packs | UI clicks, impacts, jingles | CC0 (public domain) | No (optional) |
| **Sonniss GDC Game Audio Bundle** | A huge professional sound library, free every year | Royalty-free, commercial use allowed | No. But the raw sounds can't be redistributed, and **AI/ML training use is prohibited** |
| **Freesound.org** | Community-recorded sounds | Varies per sound (CC0, CC BY, …) | Only for CC BY sounds. Prefer CC0 |
| **Pixabay** sound effects & music | Effects and music | Pixabay Content License: free commercial use | No. But you can't sell or distribute the files unaltered on their own |
| **BeepBox** | Make chiptune music in the browser | MIT (the tool) | No; your songs are yours |
| **Bosca Ceoil Blue** | A simple, free music maker | Free, open source | No |
| **LMMS** | A free full music studio | GPL (the tool) | No; your songs are yours |
| **Audacity** + **ffmpeg** | Editing and encoding | Free tools | No |

### 9.5 Sound palette per game
| Game | Music | Key sounds |
|---|---|---|
| One More Step | A gentle pentatonic melody that your steps play | Footstep notes, Doory's squeaky feet, crumbles, a sour death note |
| NOPE! | Game-show stings and drumrolls | The stamp THUNK, laugh track, ding, fuse tick |
| 99 Seconds | One 99-second track per chapter (the music is the clock) | Clock tick, reversed whoosh on reset, timed-event cues |
| Don't Trust The Game | Cheerful chiptune that slowly detunes | HELPER's babble (off-key when lying), fake-crash silence + tone |
| Fake Floor | Calm marimba and pads | Footsteps per material, pebble *tok* / *tink* / *fwip*, rain |
| TrapSprint | Upbeat chiptune that never restarts on death | Bonk, splat, boing, saw "shing" warnings |
| Glitch Run | Driving electronic music, bitcrushed as corruption rises | On-beat obstacle cues, warning crackle |
| Almost There | Calm and melancholy, one instrument per zone | Rising charge tone, fall whoosh, thud, Chirp's tweets |
| One Tap Chaos | Loops locked to each speed tier's BPM | Microgame stingers, rising success pitch, record scratch |
| Last Pixel | Calm ASMR, then playful chase strings | Roller squish, mower hum, Pix's giggles, detector beeps |
| Panic Stack | A bouncy track that speeds up with panic, plus a heartbeat | Item tap sounds (thud / tink / boing), siren, meow |
| Cursor Escape | Old-screensaver ambience, glitchier in System32 | Retro clicks, window open/close, error ding, notification pops |
| Wrong Door | Ironic lobby elevator music, near silence upstairs | Knocks, creaks, wind / footsteps / ticking behind doors (panned) |
| Don't Blink | Almost no music: hum and silence | Stone scrape (panned), camera static, report click, heartbeat |
| Gravity Is Lying | Light and floaty; the melody turns upside down when gravity does | Gravity-change hum, flip "whoomp", Isaac's pompous babble |

---

## 10. Visual Design System (Theme & Colours)

### 10.1 Brand: the arcade hub
- A dark "night arcade" look: deep ink background, warm off-white text, a hot pink accent (the trick), with lime (the lie) and cyan (the truth) as supporting accents.
- Each game card on the hub uses **that game's own accent colour**, so the hub feels like a row of different arcade cabinets.

### 10.2 Tailwind v4 tokens
This follows the pattern already in `src/app/globals.css`: plain CSS variables, mapped to Tailwind colours with `@theme inline`. Every game swaps the same variables under its own `data-game` attribute.

```css
@import "tailwindcss";

/* the hub theme (default) */
:root {
  --bg: #0e0b16;
  --surface: #1b1628;
  --ink: #f5f1e8;        /* text on surfaces */
  --ink-on-bg: #f5f1e8;  /* text directly on the background */
  --accent: #ff3d7f;
  --on-accent: #0e0b16;  /* text on accent buttons */
  --lie: #c6ff3d;
  --truth: #3de0ff;
}

/* each game overrides the same variables (values in 10.3) */
[data-game="nope"] {
  --bg: #161414;
  --surface: #fff4d6;
  --ink: #161414;
  --ink-on-bg: #fff4d6;
  --accent: #d41f22;
  --on-accent: #ffffff;
}

/* fixed tokens */
@theme {
  --radius-card: 1.25rem;
  --ease-pop: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* colours that change per game */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-ink-on-bg: var(--ink-on-bg);
  --color-accent: var(--accent);
  --color-on-accent: var(--on-accent);
  --color-lie: var(--lie);
  --color-truth: var(--truth);
}
```

Usage: `<main data-game="nope" className="bg-bg text-ink-on-bg">`, and buttons with `bg-accent text-on-accent rounded-card ease-pop`.

### 10.3 Palettes (every text pair checked for WCAG AA)
| Game | Background | Surface | Ink | Ink on background | Accent | On accent | Contrast checks |
|---|---|---|---|---|---|---|---|
| **Hub** | `#0E0B16` | `#1B1628` | `#F5F1E8` | `#F5F1E8` | `#FF3D7F` | `#0E0B16` | 15.6 · 17.3 · 5.8 · 5.8 |
| One More Step | `#E8F6EF` | `#FFFFFF` | `#1F3A33` | `#1F3A33` | `#1E7D5E` | `#FFFFFF` | 12.3 · 11.0 · 5.1 · 5.1 |
| NOPE! | `#161414` | `#FFF4D6` | `#161414` | `#FFF4D6` | `#D41F22` | `#FFFFFF` | 16.8 · 16.8 · 5.2 · 4.8 |
| 99 Seconds | `#2B2421` | `#F2E6D8` | `#2B2421` | `#F2E6D8` | `#D98E3F` | `#2B2421` | 12.4 · 12.4 · 5.7 · 5.7 |
| Don't Trust The Game | `#FFF5FA` | `#FFFFFF` | `#2D1B4E` | `#2D1B4E` | `#C2306F` | `#FFFFFF` | 15.2 · 14.3 · 5.3 · 5.0 |
| Fake Floor | `#F4F1EA` | `#FFFFFF` | `#26323B` | `#26323B` | `#8A5D12` | `#FFFFFF` | 13.1 · 11.6 · 5.8 · 5.1 |
| TrapSprint | `#9AD8FF` | `#FFFFFF` | `#23153C` | `#23153C` | `#C8224B` | `#FFFFFF` | 16.9 · 11.0 · 5.6 · 3.6 |
| Glitch Run | `#07070D` | `#14142A` | `#E6F1FF` | `#E6F1FF` | `#00F5D4` | `#07070D` | 15.8 · 17.6 · 14.4 · 14.4 |
| Almost There | `#1E2A44` | `#F7F4EF` | `#1E2A44` | `#F7F4EF` | `#F2B880` | `#1E2A44` | 13.0 · 13.0 · 8.1 · 8.1 |
| One Tap Chaos | `#FFD23F` | `#FFFFFF` | `#1B1B1B` | `#1B1B1B` | `#2B59C3` | `#FFFFFF` | 17.2 · 11.9 · 6.3 · 4.4 |
| Last Pixel | `#FDF6EC` | `#FFFFFF` | `#3B3355` | `#3B3355` | `#6F5BF2` | `#FFFFFF` | 11.7 · 10.9 · 4.7 · 4.4 |
| Panic Stack | `#FFF1E0` | `#FFFFFF` | `#2E2A4F` | `#2E2A4F` | `#B8460C` | `#FFFFFF` | 13.5 · 12.1 · 5.4 · 4.8 |
| Cursor Escape | `#0F7F7F` | `#C3C3C3` | `#111111` | `#FFFFFF` | `#0A2A8A` | `#FFFFFF` | 10.7 · 4.8 · 12.3 · 7.0 |
| Wrong Door | `#2A1E2F` | `#F3E3D3` | `#2A1E2F` | `#F3E3D3` | `#C9A227` | `#2A1E2F` | 12.6 · 12.6 · 6.6 · 6.6 |
| Don't Blink | `#0B0F0E` | `#1C2422` | `#CFE8DC` | `#CFE8DC` | `#7CFFB2` | `#0B0F0E` | 12.3 · 14.9 · 15.4 · 15.4 |
| Gravity Is Lying | `#F2FBFA` | `#FFFFFF` | `#163238` | `#163238` | `#0F7366` | `#FFFFFF` | 13.6 · 12.9 · 5.7 · 5.5 |

**How to read the contrast column** (WCAG contrast ratios, all calculated): ink on surface · ink-on-bg on background · on-accent text on the accent · the accent against what it sits on (the surface for One More Step, NOPE! and Cursor Escape; the background for the rest). **Every text pair is at least 4.5:1** (WCAG AA for normal text), and **every accent is at least 3:1** against its surroundings (WCAG AA for interface elements).

**Extra colours from the game plans** (decorative, not used for text):
- NOPE!: the green sky `#7ED957`
- Glitch Run: "missing texture" magenta `#FF00FF` (with a black checkerboard), corruption pink `#FF2E88`
- One Tap Chaos: Red Means No `#D62839`, always with the ✖ stripe pattern
- Wrong Door: Mr. Hinges' red hat `#B23A48` (always with the feather)
- Don't Blink: REC red `#FF5A4E`
- Gravity Is Lying: Isaac red `#E63946`, scarf yellow `#FFB703`

### 10.4 Colour rules
- **Never colour alone.** Every meaning also has a shape, icon, pattern or word.
- **Red means danger in every game.** Don't use it for decoration.
- **Test colourblind modes** with Chrome DevTools' "Emulate vision deficiencies" (Rendering tab).
- The hub stays dark; each game picks its own look.

### 10.5 Pixel-art palettes
For the pixel-art games, start from proven palettes on **Lospec** and credit their authors in `CREDITS.md`:
| Game | Starting palette | Why |
|---|---|---|
| TrapSprint | **Sweetie 16** (GrafxKid) | Bright, candy-like, friendly (the contrast with the brutal traps is the joke) |
| Fake Floor | **Endesga 32** (ENDESGA) | A wide range for 5 very different worlds |
| Almost There | **Resurrect 64** (Kerrie Lake) | Enough shades for 9 zones and sunset gradients |
| Glitch Run | **PICO-8** palette as a base, plus a neon accent ramp | Clean base colours that make glitches stand out |
| Cursor Escape | Custom retro-OS greys, teal and navy (palette table above) | An original old-OS look |

### 10.6 Settings applied before the first paint
Comfort settings must apply **before** anything is drawn: a flash of animation is exactly what "reduce motion" users don't want. The bundled Next.js guide *"How to prevent flash before hydration"* recommends a small inline script in `<head>`:

```tsx
// src/app/layout.tsx (excerpt)
<html lang="en" suppressHydrationWarning>
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=JSON.parse(localStorage.getItem("mfg:settings")||"{}"),d=document.documentElement;if(s.reduceMotion)d.dataset.reduceMotion="";if(s.reduceFlashing)d.dataset.reduceFlashing="";if(s.colorblind&&s.colorblind!=="off")d.dataset.colorblind=s.colorblind;if(s.textSize)d.dataset.textSize=s.textSize}catch(e){}})()`,
      }}
    />
  </head>
  <body>{children}</body>
</html>
```

CSS and games then read `data-reduce-motion`, `data-reduce-flashing`, `data-colorblind` and `data-text-size` on `<html>`. When the player hasn't chosen yet, the defaults follow the system (`prefers-reduced-motion`).

---

## 11. Typography (Fonts)

### 11.1 Loading: self-hosted, private, offline-ready
- **`next/font/google`** downloads Google Fonts **at build time** and serves them with our own files. The Next.js docs say: *"No requests are sent to Google by the browser."* That keeps the local-only promise, and the service worker can cache the fonts for offline play.
- **`next/font/local`** for fonts that aren't on Google Fonts (DSEG7 for the 99 Seconds clock).
- **Each game's fonts load only with that game.** Every game has its own `fonts.ts`, and applies the classes inside its own component, so the hub never downloads 15 games' worth of fonts.
- Use `subsets: ["latin"]`; `display: "swap"` is the default.
- **Variable fonts** (one file for every weight) don't need a weight. **Static fonts need `weight: "400"`** (or their available weights).

```ts
// src/games/trapsprint/fonts.ts
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";

export const hudFont = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-hud" }); // static
export const uiFont = Pixelify_Sans({ subsets: ["latin"], variable: "--font-ui" });                  // variable
```

### 11.2 Font choices
All licences were checked in Google's official font repository: everything is **SIL Open Font License (OFL)** except Special Elite (**Apache-2.0**). Both licences allow free commercial use. "Variable" was confirmed against the Google Fonts API.

| Where | Font | Type | Why |
|---|---|---|---|
| Hub & menus (body text) | **Geist** (already installed) | Variable | Clean and very readable |
| Numbers, timers, debug text | **Geist Mono** (already installed) | Variable | Even-width digits that don't jiggle |
| Hub brand & headlines | **Bricolage Grotesque** | Variable | Quirky and characterful, a little "off", like the games |
| One More Step | **Fredoka** | Variable | Soft, rounded and friendly; fits the pastel world |
| NOPE! | **Lilita One** (show titles) + **Bangers** (the NOPE stamp, comic hits) | Static | Loud game-show energy |
| 99 Seconds | **Fraunces** (story text) + **Caveat** ("your handwriting" on the walls) + **DSEG7** (the clock) | Variable + variable + static | Warm and surreal; the notes must look handwritten; a real 7-segment clock |
| Don't Trust The Game | **Baloo 2** (the fake cute game) + **JetBrains Mono** (crash screens, console) | Variable | Cute vs. technical: the contrast is the joke |
| Fake Floor | **Pixelify Sans** | Variable | A pixel font that stays readable at several sizes |
| TrapSprint | **Press Start 2P** (HUD, numbers) + **Pixelify Sans** (menus) | Static + variable | The classic arcade look |
| Glitch Run | **Rubik Glitch** (titles) + **VT323** (HUD) | Static | Letterforms that are already glitched; a terminal-style HUD |
| Almost There | **Silkscreen** (signs, Chirp's bubbles) + **Pixelify Sans** | Static (400 & 700) + variable | Tiny, crisp pixel text |
| One Tap Chaos | **Bungee** | Static | Bold signage letters, readable in a split second |
| Last Pixel | **Baloo 2** + **Space Mono** (the 99.993% counter) | Variable + static | Soft and satisfying; precise digits |
| Panic Stack | **Rubik** | Variable | Chunky and toy-like, with many weights |
| Cursor Escape | **Pixelify Sans** (retro OS interface) + **VT323** (system text) | Variable + static | An "old OS" feel without copying a real OS font |
| Wrong Door | **Limelight** (hotel signage) + **Cormorant Garamond** (plaques) + **Special Elite** (door signs) | Static + variable + static | An art-deco hotel; typewritten signs |
| Don't Blink | **Cormorant SC** (museum labels) + **VT323** (CCTV timestamp) | Static | An elegant museum vs. a cheap security camera |
| Gravity Is Lying | **Lexend** (interface) + **Fredoka** (Isaac's speech) | Variable | Stays readable while the world rotates; Isaac is round and pompous |

DSEG7 comes from the DSEG project on GitHub (OFL-1.1), loaded with `next/font/local`.

### 11.3 Text on a canvas
- `next/font` gives each font a generated family name. Read it from **`font.style.fontFamily`** (part of the `next/font` API) instead of typing the name.
- **Wait for the font before the first draw:** `await document.fonts.load(\`16px ${hudFont.style.fontFamily}\`)`. Otherwise the canvas draws with a fallback font and never updates.
- Draw **pixel fonts at whole-number multiples** of their design size (Press Start 2P at 8, 16, 24 or 32 px) to keep them sharp.
- Cache text that rarely changes (titles, labels) on offscreen canvases.

### 11.4 Licence housekeeping
List every font in `CREDITS.md` and ship the licence texts in `public/licenses/`.

---

## 12. Icons, Art & the Asset Pipeline

### 12.1 Icons
| Set | Used for | Licence | Notes |
|---|---|---|---|
| **lucide-react** 1.51.0 | Hub, menus, settings | ISC | Only the icons we import end up in the bundle |
| **pixelarticons** 2.4.1 | Retro games (TrapSprint, Fake Floor, Almost There, Glitch Run, Cursor Escape) | MIT | About 1,000 SVG files (no React components). Use a tiny `<PixelIcon name="…" />` that shows the SVG as a CSS `mask-image`, so it takes the current text colour |
| **game-icons.net** | Item and event icons (Wrong Door's items, Panic Stack's events) | CC BY 3.0 | Credit required, e.g. *"Icons made by {author}. Available on https://game-icons.net"* |
| **Kenney Input Prompts** | Keyboard, gamepad and touch button pictures for tutorials and control screens | CC0 | Shows the right button for each control |

### 12.2 Art tools
| Tool | For | Cost / licence |
|---|---|---|
| **Aseprite** | Pixel art and animation (the industry favourite) | Paid (about $20) |
| **LibreSprite** / **Pixelorama** | Free alternatives to Aseprite | GPL-2.0 / MIT |
| **Krita** | Painted scenes (99 Seconds, Wrong Door, Don't Blink) | Free |
| **Inkscape** / **Figma** | Flat vector art (NOPE!, One Tap Chaos, Panic Stack, One More Step) and UI mockups | Free / free tier |
| **LDtk** | Level editor for the platformers and tile games (exports JSON) | Free (MIT) |
| **free-tex-packer-core** | Packs sprites into atlases from a Node script | MIT |
| **sharp** 0.35 | Converts and compresses images in our asset script | Apache-2.0 |

### 12.3 Free asset sources
| Source | Good for | Licence |
|---|---|---|
| **Kenney.nl** | Pixel platformer tiles, UI packs, particles, input prompts, audio | CC0 (public domain) |
| **OpenGameArt.org** | Mixed art and audio | Varies; check each item (CC0, CC BY, GPL…) |
| **itch.io asset packs** | A huge variety, many free | Varies; read each pack's licence |
| **Lospec** | Colour palettes for pixel art | Credit the palette's author as a courtesy |

### 12.4 Asset pipeline
```
assets-src/<slug>/        source files: .aseprite, .kra, .ldtk, .wav (not shipped)
public/assets/<slug>/     built files: atlases, images, audio sprites, levels (shipped)
  manifest.json           every file + its size; used by the loader and "Download for offline"
```

`pnpm assets:build` runs `scripts/build-assets.mjs`, which:
1. **Packs sprites into atlases** (free-tex-packer-core, or Aseprite's own sprite-sheet export).
2. **Converts images:** PNG for pixel art (lossless and tiny with small palettes), WebP or AVIF for painted art, using sharp.
3. **Encodes audio** (ffmpeg) and builds audio sprites.
4. **Adds a content hash** to every file name (`atlas.3f2a1c.png`), so files can be cached forever and old caches never show stale art.
5. **Writes `manifest.json`** for each game.

`next/image` isn't needed for game art, because games load images in code. The hub's cover images are pre-sized WebP files.

### 12.5 Asset budgets (per game, first play)
| Game type | Games | Budget |
|---|---|---|
| Light | NOPE!, One Tap Chaos, One More Step, Wrong Door, Cursor Escape | ≤ 2 MB |
| Medium | TrapSprint, Fake Floor, Glitch Run, Last Pixel, Panic Stack, Gravity Is Lying, Almost There | ≤ 4 MB |
| Heavy (painted scenes) | 99 Seconds, Don't Blink, Don't Trust The Game | ≤ 8 MB, loaded per chapter or night |

---

## 13. Menus & UI Components
- **Radix UI** (`radix-ui` 1.6.7) for accessible building blocks: dialogs, sliders (volume), switches (comfort settings), tabs, tooltips, toasts and dropdowns. Radix handles keyboard navigation, focus and screen readers; we style it with Tailwind.
  - Measured with Dialog + Slider + Switch: **Radix 20.3 KB**, React Aria Components 29.9 KB, Base UI 32.6 KB. All three are good; Radix was the smallest in our test and is the most widely used.
- **A `cn()` helper** (`clsx` + `tailwind-merge`) for combining class names safely.
- **shadcn/ui** (optional): a CLI that copies ready-made components built on Radix and Tailwind into the project, as a starting point for the hub and settings screens.
- **In-game HUDs are custom:** drawn on the canvas, or simple DOM elements placed over it. No component library inside the game view.
- **Shared components:** `GameShell`, `PauseMenu`, `SettingsPanel`, `ResultsCard`, `ShareSheet`, `InstallSheet`, `BackupReminder`, `Toast`.

---

## 14. Input & Device APIs
| API | What we use it for | Support (checked) | Fallback |
|---|---|---|---|
| Keyboard (`event.code`) | All keyboard controls. `code` is the physical key, so WASD also works on AZERTY keyboards | All browsers | — |
| Pointer Events | Mouse, touch and pen through one API; `touch-action: none` on game canvases | All browsers | — |
| Gamepad API | Controllers for the platformers | All modern browsers | Keyboard / touch |
| Pointer Lock | Cursor Escape | Desktop Chrome, Edge, Firefox, Safari. **Not** on iPhone/iPad or Chrome Android | Trackpad mode (touch) |
| Screen Wake Lock | Keep the phone screen on during play (Don't Blink nights, Almost There, 99 Seconds loops) | Safari 16.4+, Chrome 85+, Firefox 126+, Edge 90+ | The screen may dim on older browsers |
| Fullscreen API | Optional fullscreen; Don't Trust The Game's "safe frame" trick | Desktop browsers and Chrome Android; **only partial** on iOS Safari | The in-game alternatives in the plans |
| Vibration | A small buzz on landings (Almost There) | Android only; not iPhone | Visual and audio feedback |
| Page Visibility | Pause when the tab is hidden; Last Pixel's tab trick | All browsers | — |
| Web Share | Share cards | Safari 12.1+, iOS 12.2+, Chrome desktop 128+, Chrome Android, Edge 95+. **Not** desktop Firefox | Download + copy |
| Clipboard (write) | Copy results, save codes and debug reports | All modern browsers (needs a tap or click) | Show the text for manual copying |
| Web Locks | Safe saving with several tabs open | Safari 15.4+, Chrome 69+, Firefox 96+, Edge 79+ | — |
| StorageManager (`persist`, `estimate`) | Persistent storage; the "Your Data" page | Chrome, Edge, Firefox (with a prompt); fully supported in Safari 17+ | Backups |
| CompressionStream | Save files and share codes | Safari 16.4+, Chrome 80+, Firefox 113+, Edge 80+ | Uncompressed JSON (Firefox 111–112) |
| WebGL2 | Screen effects | All modern browsers | Skip the effects |

---

## 15. Per-Game Library Map
| Game | Rendering | Physics | Audio | Extra libraries & APIs | Local data highlights |
|---|---|---|---|---|---|
| One More Step | Canvas 2D | — (rules engine) | Web Audio (synthesized footstep melody) | Solver run as Vitest tests | Stars and steps; Daily Step history |
| NOPE! | React + DOM | — | Web Audio (stamp, laugh track) | Motion, canvas-confetti | Episode progress, current run, stamp count |
| 99 Seconds | React + DOM/SVG | — | Web Audio (99-second loop music, ticking) | Motion, DSEG7 font, Wake Lock | Journal, loop count, room memory |
| Don't Trust The Game | React + DOM + canvas platformer | `engine/platformer` | Web Audio (detuning jingle) | `engine/browser` (title, favicon, history, fullscreen, selection), `engine/postfx` | Scene progress, secrets, "you came back" memory; a sessionStorage flag |
| Fake Floor | Canvas 2D (pixel art) | `engine/platformer` | Web Audio + ZzFX | Particles (rain), lighting | Medals, falls, pebble stats |
| TrapSprint | Canvas 2D (pixel art) | `engine/platformer` | Web Audio + ZzFX | Input recorder (ghosts, All-Deaths Replay, challenge links) | Best times; ghosts and attempts in IndexedDB |
| Glitch Run | Canvas 2D + `engine/postfx` | `engine/platformer` (runner) | Web Audio (beat-synced cues) | Seeded chunk generator | High scores, daily results, run replays |
| Almost There | Canvas 2D (pixel art) | `engine/platformer` (charge jumps) | Web Audio (streamed zone music) | Wake Lock, Vibration (Android) | Continuous position save |
| One Tap Chaos | Canvas 2D + React HUD | — | Web Audio as the master clock | Seeded runs, input calibration | High score, unlocks, calibration offset |
| Last Pixel | Canvas 2D | — | Web Audio (ASMR tool sounds) | `engine/browser` (favicon/title bonus level), canvas-confetti | Stars per level |
| Panic Stack | Canvas 2D | **Planck.js** | Web Audio (panic music, tap sounds) | Seeded events | Stars, endless records |
| Cursor Escape | Canvas 2D | Custom swept collisions | Web Audio + ZzFX (retro UI sounds) | Pointer Lock, trackpad mode | Times, medals, sensitivity |
| Wrong Door | React + DOM/SVG | — | Web Audio (stereo-panned doors) | Puzzle generator + solver, Motion | Current run (resume), codex |
| Don't Blink | Canvas 2D + `engine/postfx` (CCTV look) | — | Web Audio (panned stone scrape) | Wake Lock; MediaPipe (opt-in, later, self-hosted model files) | Nights unlocked, best Endless score |
| Gravity Is Lying | Canvas 2D | `engine/platformer` (gravity frames) + Verlet scarf | Web Audio | — | Apples, best times |

---

## 16. Testing, Debugging & Quality

### 16.1 Unit tests (Vitest 5)
- Pure logic: rules engines, solvers (One More Step, Wrong Door), generators (Glitch Run chunks), save migrations, challenge-code encoding and decoding.
- **Determinism:** recorded inputs must replay to exactly the same result.
- IndexedDB code runs in Node with **fake-indexeddb**.
- **Level checks are ordinary tests:** "every One More Step level is solvable" and "every Wrong Door floor has exactly one answer" run in CI like any other test.

### 16.2 End-to-end tests (Playwright 1.63)
Run against the **real static build** (`next build`, then serve `out/`), on desktop and on emulated phones:
- Every game page loads without console errors.
- **Progress survives a reload:** play a little, reload, check it's still there.
- **Offline:** visit once, then `context.setOffline(true)`; the hub and a played game must still load.
- **Backups:** export → clear storage → import → everything is back.
- **Multiple tabs** never corrupt a save.
- **Menu accessibility** with `@axe-core/playwright`.

### 16.3 Debug tools (development only)
- Add `?debug` to the URL (or run in development) for an FPS / frame-time overlay and a **lil-gui** panel to tune numbers live: jump height, coyote time, gravity, timings. The game-feel values in the plans get tuned here.
- A state inspector for the current game.
- **"Copy debug report"** (always available in settings): browser info, storage status, settings, the local error log and the current game's stats, as text the player can paste into a message.

### 16.4 Real devices (before each release)
- iPhone Safari (normal **and** installed to the Home Screen), Android Chrome, and desktop Chrome, Firefox and Safari.
- Test with **reduce motion**, **colourblind mode** and **sound off**.

---

## 17. Performance Budgets
| Metric | Target |
|---|---|
| Hub page JavaScript | ≤ 120 KB gzipped |
| One game's JavaScript (on top of the shared engine) | ≤ 150 KB gzipped (Panic Stack: +45 KB for Planck.js) |
| App shell precached on the first visit | ≤ 3 MB |
| A game's first-play assets | 2 / 4 / 8 MB (see 12.5) |
| Frame rate | A steady 60 fps on a mid-range phone (roughly a 2021 Android phone or an iPhone 12) |
| Restart / respawn | Under 300 ms |
| Decoded audio in memory | ≤ 64 MB per game |
| Hub ready to use (repeat visit, offline) | Under 1 second |
| localStorage in total | ≤ 1 MB (well under the ~5 MiB limit) |

---

## 18. Browser Support
- **Minimum:** Next.js 16's defaults (from the bundled docs): **Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+** (iOS 16.4+).
- Features that need newer versions have fallbacks:
  - `persist()` / `estimate()` fully in Safari: 17+ (older versions rely on backups)
  - Ogg Vorbis / Opus in Safari: 18.4+ (we use MP3)
  - CompressionStream in Firefox: 113+ (older versions get uncompressed codes)
  - Screen Wake Lock in Firefox: 126+
  - Web Share in desktop Firefox: not supported (download + copy)

---

## 19. Project Structure
```
mindfuckgame/
├─ Plan/                          design docs (this folder)
├─ assets-src/<slug>/             source art & audio (not shipped)
├─ public/
│  ├─ assets/<slug>/              built art, audio, levels + manifest.json (hashed names)
│  ├─ icons/                      app icons (192, 512, maskable)
│  └─ licenses/                   font & asset licence texts
├─ scripts/
│  ├─ build-sw.mjs                bundles src/sw/sw.ts → injects the precache list → out/sw.js
│  ├─ build-assets.mjs            atlases, image conversion, hashing, manifests
│  └─ encode-audio.sh             ffmpeg presets
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx               fonts, settings script, service worker registration
│  │  ├─ page.tsx                 the arcade hub
│  │  ├─ manifest.ts              web app manifest
│  │  ├─ apple-icon.png           iOS home screen icon
│  │  ├─ data/page.tsx            "Your Data": storage, backups, deleting data
│  │  └─ games/[slug]/
│  │     ├─ page.tsx              prerendered once per game (generateStaticParams)
│  │     └─ GameLoader.tsx        client-only loader (next/dynamic with ssr: false)
│  ├─ components/                 GameShell, PauseMenu, SettingsPanel, ShareSheet, InstallSheet…
│  ├─ engine/                     loop, input, audio, save/, rng, tween, particles, camera,
│  │                              canvas, assets, platformer/, postfx/, browser/, share/, debug/
│  ├─ games/
│  │  ├─ registry.ts              slug, title, colours, fonts, lazy import
│  │  └─ <slug>/                  index.tsx, fonts.ts, save.ts, levels/…
│  └─ sw/
│     └─ sw.ts                    service worker source
├─ tests/e2e/                     Playwright tests
├─ CREDITS.md                     every asset, font and sound with its licence
├─ eslint.config.mjs
└─ next.config.ts                 output: "export"
```

---

## 20. Install Commands
Add packages when the milestone that needs them starts, not all at once.

```bash
# 1. Core: hub, shell, saves
pnpm add zustand idb valibot motion radix-ui clsx tailwind-merge lucide-react

# 2. Offline & install (service worker, built by a script)
pnpm add -D serwist @serwist/build esbuild

# 3. Per game, when that game is being built
pnpm add zzfx                       # retro sound effects (TrapSprint, Fake Floor, Cursor Escape…)
pnpm add canvas-confetti            # celebrations (NOPE!, Last Pixel)
pnpm add -D @types/canvas-confetti
pnpm add pixelarticons              # retro icons (SVG files)
pnpm add planck                     # Panic Stack physics
pnpm add @mediapipe/tasks-vision    # Don't Blink "Real Blink Mode" (later, opt-in)

# 4. Quality
pnpm add -D eslint eslint-config-next eslint-config-prettier prettier prettier-plugin-tailwindcss
pnpm add -D vitest fake-indexeddb
pnpm add -D @playwright/test @axe-core/playwright && pnpm exec playwright install
pnpm add -D lil-gui

# 5. Asset scripts
pnpm add -D sharp free-tex-packer-core
# ffmpeg is installed on the computer (e.g. `brew install ffmpeg`), not through pnpm
```

For Don't Blink's MediaPipe feature, copy its WebAssembly files and the face model into `public/` and load them from there. **No CDN**, to keep the local-only promise.

---

## 21. Licences & Credits
- Keep **`CREDITS.md`** (and an in-game Credits screen) listing every font, sound, image and icon with its name, author, source link and licence.
- **Credit required:** game-icons.net (CC BY 3.0), and any CC BY sounds or music (e.g. from Freesound).
- **Credit optional but nice:** Kenney (CC0), Pixabay, Sonniss, Lospec palette authors.
- **Fonts:** OFL and Apache-2.0 — include their licence texts in `public/licenses/`.
- **Rules to remember:**
  - Sonniss sounds can't be redistributed as raw files or used for AI training.
  - Pixabay files can't be redistributed unaltered on their own.
  - Never use assets with an unclear licence.
- **Code dependencies:** everything we ship is MIT, ISC, Apache-2.0 or BSD, which is fine for a free or paid game. GSAP (if ever added) uses its own free "Standard no-charge licence". The copyleft licences (GPL editors, MPL-2.0 for axe) belong to tools and test libraries we don't ship.

---

## 22. Decisions Log
| Considered | Decision | Why |
|---|---|---|
| A database (Firebase, Supabase, Postgres…) | ❌ | Breaks the local-only rule |
| Accounts / login | ❌ | Nothing is stored on a server, so there's nothing to log into |
| Analytics, Sentry, ad SDKs | ❌ | They send data off the device |
| Google Fonts `<link>` tags | ❌ → `next/font` | Google's servers would see every visitor; `next/font` self-hosts |
| Cookies | ❌ | No server to read them |
| Phaser 4 | ❌ | 360 KB, and it owns the game loop |
| PixiJS 8 | Upgrade path | 173 KB; our scenes don't need it yet |
| Rapier | ❌ | 1.26 MB with WebAssembly |
| Matter.js | ❌ | Older, and less stable for tall stacks |
| Howler.js | Fallback | Works, but last released in 2023; our wrapper covers what we need |
| Tone.js | ❌ | 81 KB of features we don't use |
| Zod 4 (classic API) | ❌ → Valibot | 90 KB in our test vs. 1.8 KB |
| Dexie | ❌ → `idb` | 32 KB vs. 1.4 KB; we don't need its query engine |
| fflate / lz-string | ❌ → `CompressionStream` | Built into every browser we support except Firefox 111–112 |
| `@serwist/turbopack` route handler | ❌ → `@serwist/build` after export | Its `/serwist/sw.js` worker needs a `Service-Worker-Allowed` header that static hosts don't send |
| The `next/image` optimizer | ❌ → pre-optimised images | Needs a server; our asset script optimises at build time |
| Next.js `useOffline` (experimental) | Not needed | Built for server-backed apps; we use a service worker |
