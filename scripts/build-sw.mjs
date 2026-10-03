// Runs after `next build` (see package.json): bundles src/sw/sw.ts, then injects the list of
// exported files to precache, and writes out/sw.js at the site root (Plan/gameStack.md §4.3).
import { build } from "esbuild";
import { injectManifest } from "@serwist/build";

await build({
  entryPoints: ["src/sw/sw.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  outfile: ".sw/sw.js",
  logLevel: "warning",
});

const { count, size, warnings } = await injectManifest({
  swSrc: ".sw/sw.js",
  swDest: "out/sw.js",
  globDirectory: "out",
  // The app shell. Fonts and the client router's ".txt" payloads are cached at runtime instead:
  // next/font emits every language subset, and Next writes several copies of each payload.
  // (Offline, a failed payload fetch makes Next load the precached HTML page instead.)
  globPatterns: ["**/*.{html,js,css,webmanifest,ico,svg,png}"],
  // Game assets are cached when a game first uses them; the worker never precaches itself.
  globIgnores: ["assets/**", "sw.js", "**/opengraph-image*"],
  // Already content-hashed by Next.js.
  dontCacheBustURLsMatching: /^_next\/static\//,
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
});

for (const warning of warnings) console.warn(`[sw] ${warning}`);
console.log(`[sw] out/sw.js: precaching ${count} files (${(size / 1024 / 1024).toFixed(2)} MB)`);
