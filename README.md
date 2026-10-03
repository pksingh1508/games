# Mind Games Arcade

Fifteen short browser games that lie to you, trap you and turn your own habits against you, but always play fair. Every lie has a tell.

This repo holds the arcade website: the landing page, the game library, a cabinet page for every game, settings, a local data manager and offline support. The games are being built one by one. Until a game ships, its cabinet shows "Out of order".

"Mind Games" is a working title, set in `src/lib/site.ts`.

## Local-only by design

There's no server, database, account, cookie or analytics. The site is a static export, and everything a player does is saved in their own browser:

- **localStorage** holds small saves: settings, achievements and per-game progress (`mfg:*` keys).
- **IndexedDB** holds big saves such as runs, replays and custom levels (database `mfg`).
- **Your data** (`/data`) shows what's stored, exports and imports a `.mfgsave` backup file and deletes everything.

The full reasoning is in [Plan/gameStack.md](Plan/gameStack.md).

## Getting started

You need Node.js 20.9 or newer and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

| Script | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Static export to `out/`, then builds the service worker (`out/sw.js`) |
| `pnpm preview` | Serves `out/` on http://localhost:3000. The service worker only runs here, not in `dev` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generates route types, then type-checks the app and the service worker |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm icons` | Regenerates the app icons and favicon from the logo |

## Deploying

`pnpm build` writes a fully static site to `out/`. Upload that folder to any static host. Set `NEXT_PUBLIC_SITE_URL` to the real domain when you build, so share images, the sitemap and canonical links point to it.

## Project structure

```
src/
  app/          routes: landing, /games, /games/<slug>, /games/<slug>/play, /settings, /data, /about
  components/   site chrome, landing sections, game cards, UI kit, settings, data manager, PWA
  engine/       framework-free code: saves, settings, achievements, UI sounds
  games/        the game registry, palettes, title fonts and SVG cover art
  sw/           service worker source (Serwist)
scripts/        service worker build, icon generation
Plan/           design plans for every game, plus the stack
```

## Adding a game

1. Build the game in `src/games/<slug>/` (see that game's plan in [Plan/](Plan/README.md)).
2. Load it from `src/app/games/[slug]/play/` with a client-only `GameLoader`.
3. Set the game's `status` to `"playable"` in `src/games/registry.ts`. The cabinet lights up everywhere on the site.
