# Mind Games Arcade

Fifteen short browser games that lie to you, trap you and turn your own habits against you, but always play fair. Every lie has a tell.

This repo holds the arcade website (the landing page, the game library, a cabinet page for every game, settings, a local data manager and offline support) and the games, which are being built one by one. Until a game ships, its cabinet shows "Out of order".

**Playable now:**

- [NOPE!](Plan/02-nope.md), the troll quiz: 60 questions in 4 episodes, at `/games/nope/play`.
- [One Tap Chaos](Plan/09-one-tap-chaos.md), the one-button microgame gauntlet: 24 microgames, 8 Chaos Cards and 3 bosses on a music-synced clock, plus Daily Chaos and a practice room, at `/games/one-tap-chaos/play`.
- [TrapSprint](Plan/06-trapsprint.md), the troll platformer: 30 levels in 3 zones (plus 30 Remix levels) full of traps that each have a tell, with medals, your own ghost, the All-Deaths Replay and zone speedruns, at `/games/trapsprint/play`.
- [Fake Floor](Plan/05-fake-floor.md), the perception platformer: 50 rooms in 5 worlds and The Floor itself, where some floors are fake and the clues you learn eventually lie too; pebbles that never lie, medals, time trials and hidden pebbles, at `/games/fake-floor/play`.
- [Almost There](Plan/08-almost-there.md), the vertical rage climber: one continuous climb of 45 screens in 9 zones with charge jumps and no air control, a lying progress bar, a sparrow who's sincere only half the time, a fake summit with fake credits, a save that makes every fall stick (mid-air included), 12 Lost Feathers that are hats, and Mirror Mountain, at `/games/almost-there/play`.
- [Gravity Is Lying](Plan/15-gravity-is-lying.md), the gravity puzzle-platformer: 44 rooms where gravity points any way and the arrow, the camera and Isaac (a talking apple) lie about which; levers, zones, flips, timed turns, round planets, golden apples, and a scarf that never lies, at `/games/gravity-is-lying/play`.
- [Glitch Run](Plan/07-glitch-run.md), the glitch auto-runner: 20 stages, endless mode and a daily run on a beat grid, 11 glitches that break the screen and the controls (never the game), each with its warning and its tell, corruption that multiplies your score, Clip, Kernel Panic, The Debugger's scan lines, and a cue a beat before every move (heard, and drawn on the beat bar), at `/games/glitch-run/play`.

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
| `pnpm test` | Unit tests (Vitest), including a scripted player that solves every NOPE! question, bots that win every One Tap Chaos microgame under every allowed rule combination, replays of a solver's run through every TrapSprint level and every Fake Floor room (plus a check that every Fake Floor lie has a tell), a solver's fair climb of Almost There's mountain and Mirror Mountain (plus checks that every feather can be reached and that no fall passes a whole zone), replays of a solver's run through every Gravity Is Lying room with all its apples (plus checks that every lie keeps an honest anchor and every timed turn is hummed), and a reference run through every Glitch Run stage, chunk and endless seed (plus checks that no glitch ever changes the simulation and every glitch is warned in time) |
| `pnpm e2e` | End-to-end tests (Playwright) against the static build. Run `pnpm build` first; `pnpm exec playwright install chromium` once |
| `pnpm icons` | Regenerates the app icons and favicon from the logo |

## Deploying

`pnpm build` writes a fully static site to `out/`. Upload that folder to any static host. Set `NEXT_PUBLIC_SITE_URL` to the real domain when you build, so share images, the sitemap and canonical links point to it.

## Project structure

```
src/
  app/          routes: landing, /games, /games/<slug>, /games/<slug>/play, /settings, /data, /about
  components/   site chrome, landing sections, game cards, UI kit, settings, data manager, PWA
  engine/       framework-free code: saves, settings, achievements, sounds (Web Audio, ZzFX sound banks), seeded random numbers,
                and the game kit: fixed-timestep loop, input, input recordings, pixel sprites, a pixel font, platformer physics
  games/        the game registry, palettes, title fonts, SVG cover art, one folder per game (nope/, one-tap-chaos/, trapsprint/,
                fake-floor/), and shared/ (what every game uses: the one-tab guard, achievements, sharing, comfort hooks,
                canvas scaling, gamepad menus)
  sw/           service worker source (Serwist)
scripts/        service worker build, icon generation
tests/e2e/      Playwright tests
Plan/           design plans for every game, plus the stack
```

## Adding a game

1. Build the game in `src/games/<slug>/`, with a default export from `index.tsx` (see that game's plan in [Plan/](Plan/README.md); `src/games/nope/` is a DOM game, `src/games/one-tap-chaos/` a canvas one, `src/games/trapsprint/` and `src/games/fake-floor/` platformers on the shared kit in `src/engine/`). Reuse `src/games/shared/` for the one-tab guard, achievements, sharing, comfort hooks, canvas scaling and gamepad menus, and `src/engine/save/runs.ts` for run history.
2. Add it to the map in `src/app/games/[slug]/play/GameLoader.tsx`. It loads client-only, as its own chunk.
3. Set the game's `status` to `"playable"` in `src/games/registry.ts`. The cabinet lights up everywhere on the site.
4. Optionally, teach `src/games/progress.ts` to summarize its save for the cabinet page.
