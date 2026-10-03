// The offline service worker (Plan/gameStack.md §4.3). Bundled by scripts/build-sw.mjs after
// `next build`, which also injects the list of exported files to precache.
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // App shell: every exported page, script, style, font and icon.
  precacheEntries: self.__SW_MANIFEST,
  // Client-side navigations fetch "?_rsc=…" payloads; match them to the precached files.
  precacheOptions: { ignoreURLParametersMatching: [/^_rsc$/, /^utm_/, /^fbclid$/] },
  // Never swap versions in the middle of a game: the page asks the player first.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Fonts: content-hashed by next/font, so once cached they never change.
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/media/"),
      handler: new CacheFirst({
        cacheName: "mfg-fonts",
        plugins: [new ExpirationPlugin({ maxEntries: 120 })],
      }),
    },
    {
      // Game art & audio: cached the first time a game uses them (file names are content-hashed).
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
      handler: new CacheFirst({
        cacheName: "mfg-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 3000 })],
      }),
    },
    {
      // Anything else from our own site: try the network, fall back to the cache when offline.
      matcher: ({ sameOrigin }) => sameOrigin,
      handler: new NetworkFirst({ cacheName: "mfg-pages", networkTimeoutSeconds: 4 }),
    },
  ],
});

// The page sends this when the player taps "Update".
self.addEventListener("message", (event) => {
  if ((event.data as { type?: string } | null)?.type === "SKIP_WAITING") void self.skipWaiting();
});

serwist.addEventListeners();
