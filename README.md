# Mind Games Arcade

Fifteen short browser games that lie to you, trap you and turn your own habits against you, but always play fair. Every lie has a tell.

This repo holds the arcade website (the landing page, the game library, a cabinet page for every game, settings, a local data manager and offline support) and the games, built one by one. All fifteen are playable now. (A cabinet still waiting for its game would show "Out of order".)

**Playable now (all fifteen):**

- [NOPE!](Plan/02-nope.md), the troll quiz: 60 questions in 4 episodes, at `/games/nope/play`.
- [One Tap Chaos](Plan/09-one-tap-chaos.md), the one-button microgame gauntlet: 24 microgames, 8 Chaos Cards and 3 bosses on a music-synced clock, plus Daily Chaos and a practice room, at `/games/one-tap-chaos/play`.
- [TrapSprint](Plan/06-trapsprint.md), the troll platformer: 30 levels in 3 zones (plus 30 Remix levels) full of traps that each have a tell, with medals, your own ghost, the All-Deaths Replay and zone speedruns, at `/games/trapsprint/play`.
- [Fake Floor](Plan/05-fake-floor.md), the perception platformer: 50 rooms in 5 worlds and The Floor itself, where some floors are fake and the clues you learn eventually lie too; pebbles that never lie, medals, time trials and hidden pebbles, at `/games/fake-floor/play`.
- [Almost There](Plan/08-almost-there.md), the vertical rage climber: one continuous climb of 45 screens in 9 zones with charge jumps and no air control, a lying progress bar, a sparrow who's sincere only half the time, a fake summit with fake credits, a save that makes every fall stick (mid-air included), 12 Lost Feathers that are hats, and Mirror Mountain, at `/games/almost-there/play`.
- [Gravity Is Lying](Plan/15-gravity-is-lying.md), the gravity puzzle-platformer: 44 rooms where gravity points any way and the arrow, the camera and Isaac (a talking apple) lie about which; levers, zones, flips, timed turns, round planets, golden apples, and a scarf that never lies, at `/games/gravity-is-lying/play`.
- [Glitch Run](Plan/07-glitch-run.md), the glitch auto-runner: 20 stages, endless mode and a daily run on a beat grid, 11 glitches that break the screen and the controls (never the game), each with its warning and its tell, corruption that multiplies your score, Clip, Kernel Panic, The Debugger's scan lines, and a cue a beat before every move (heard, and drawn on the beat bar), at `/games/glitch-run/play`.
- [Cursor Escape](Plan/12-cursor-escape.md), the cursor maze: you're the mouse pointer inside DeskOS 98, escaping 40 windows in 4 drives and then The Uninstaller by reaching each one's [X] and clicking it. Cursor shapes change the rules, and the OS inverts, rotates, lags, hides, fakes and copies you, always announced first and always with a tell. It uses Pointer Lock on a computer and trackpad mode on a phone, at `/games/cursor-escape/play`.
- [Last Pixel](Plan/10-last-pixel.md), the clean-up and hunt: paint walls, wipe windows, mow lawns, shovel snow, pressure-wash patios, scratch lottery cards and erase doodles in 40 levels and a finale. At 99.99% the last pixel comes alive. Pix flees, camouflages itself, splits into decoys, burrows, hides under the HUD, plays a dead pixel on your monitor, pretends to be a second cursor, escapes into the page, and in a bonus level hides in your browser tab. Every trick has a tell, and the net, the magnifier, bait, freeze and a pixel detector catch it. At `/games/last-pixel/play`.
- [One More Step](Plan/01-one-more-step.md), the turn-based grid puzzle: the exit door has feet, and it runs away when you get close. In 40 levels and a finale, nothing moves unless you move. You herd the door into corners using crumbling floors, spikes, holes and moving walkways. Your own echo follows a few steps behind, a mirror twin copies you backwards, and stone sentinels stalk you. In World 5 the rules betray you, and the narrator starts lying (its speech bubble's tail turns away when it does). Every step plays the next note of the level's tune, and the tune only resolves when you catch the door. There's unlimited undo, and par and stars come from a solver. At `/games/one-more-step/play`.
- [Wrong Door](Plan/13-wrong-door.md), the deduction roguelite: climb The Ambiguous Hotel to floor 13, where every floor has a few doors and only one goes up. Signs lie by the plaque's rule, and Mr. Hinges the doorman lies in his red hat (the one with the feather). You can knock and listen, follow the candle and the footprints, and take on knights and knaves, the Monty Hall problem, mirror floors, dark floors, anomalies and Liar's Banquet. A wrong door ends with a Truth Reveal that shows exactly why. There's a hand-made Story Run, an Endless Hotel and a Daily Door with a share card, and a solver checks every floor as it's made. At `/games/wrong-door/play`.
- [Panic Stack](Plan/11-panic-stack.md), the physics stacker: build a tower to the goal line from what rides in on a conveyor, then hold it still for three seconds. Nothing is what it looks like: the iron safe is full of helium, the feather weighs as much as an anvil, the cardboard box has a rounded bottom, the duck is covered in glue, the ice melts, the balloon keeps inflating and the paperweight is a magnet. Tap things to hear what they're really made of, and feel how they follow your hand. Twelve panic events (earthquakes, wind, a cat, sirens that might be cardboard) all warn you first. There are 36 levels in six locations, Zen mode, an Endless Tower and a Daily Stack. It runs on Planck.js, and a careful stacker builds every level in the tests. At `/games/panic-stack/play`.
- [Don't Blink](Plan/14-dont-blink.md), the observation thriller: you're the night guard at the Marlow Museum of Curious Things, and every time you blink, something changes. A portrait turns its head, a vase is gone, a door is open, the whole picture is flipped. Report each change before five pile up, and keep the Visitor (a statue that only moves while you blink, and never while you're watching it) out of your office. Hold your eyes open until they give out, check the binder's morning photos, and mind your credibility. Five nights bring camera static that hides changes, fake blinks, slow changes, your own office, mirrors and a HUD that lies, and then the ending. There's also Endless Night and Custom Night, and a careful tester survives every night in the tests. At `/games/dont-blink/play`.
- [99 Seconds](Plan/03-99-seconds.md), the time-loop escape room: you wake up in a chair, and the clock on the wall says 99. At zero there's a flash and you're back in the chair, with everything reset except what you know. Your journal keeps every clue and the second you found it, and when you're stuck, the room starts scratching hints on the wall in your own handwriting. There are three chapters: a waiting room whose door leads back into itself, mirrored; a kitchen where the pot only boils while nobody's watching it and the wall clock runs slow; and the inside of a giant clock, where time grows wings and you have to find the hundredth second. The first second you look at a clock lasts longer, and each chapter's music is exactly one loop long. There are two endings, Relaxed and Hardcore modes and a Single Loop challenge, and in the tests every chapter is escaped by someone who knows the way and by someone who only reads the walls. At `/games/99-seconds/play`.
- [Don't Trust The Game](Plan/04-dont-trust-the-game.md), the meta puzzle-adventure: it starts as a cheerful platformer called Super Happy Jump!, with a friendly guide called HELPER, who lies about the coin, the spikes and the way out. When it lies, its eyes glance away. The Options menu is a level (brightness shows the platforms, Easy builds a wall and Hard a bridge, the volume whispers a code). The loading bar is a platform, and the missing 1% is hiding outside the screen. The game crashes, the answer is in the error, and level 404's 0 is a portal. The URL has a secret room, the developer console wants you to say please, and the credits are a climb to Quit (which finally works) or Stay. Every browser trick (the tab's title and icon, fullscreen, selecting hidden text, the address bar, reloading, DevTools) has an in-game way round, TRUTH.exe gives honest hints, and the next visit says "You came back." and opens Truth Mode. At `/games/dont-trust-the-game/play`.

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
| `pnpm test` | Unit tests (Vitest), including a scripted player that solves every NOPE! question, bots that win every One Tap Chaos microgame under every allowed rule combination, replays of a solver's run through every TrapSprint level and every Fake Floor room (plus a check that every Fake Floor lie has a tell), a solver's fair climb of Almost There's mountain and Mirror Mountain (plus checks that every feather can be reached and that no fall passes a whole zone), replays of a solver's run through every Gravity Is Lying room with all its apples (plus checks that every lie keeps an honest anchor and every timed turn is hummed), a reference run through every Glitch Run stage, chunk and endless seed (plus checks that no glitch ever changes the simulation and every glitch is warned in time), replays of a solver's run through every Cursor Escape window (plus checks that every sabotage is announced in time and every inversion lasts long enough to adapt), a bot that paints every Last Pixel canvas to exactly 100% and catches Pix through every trick (plus checks of every trick's tell, and that each one is introduced on its own), replays of a solver's shortest solution through every One More Step level (plus checks that each idea comes in where the plan says, that World 5's betrayals stay in World 5, and that the narrator only lies where it says it does), 10,000 generated Wrong Door floors of every kind checked for exactly one answer (plus 100,000 Monty Hall rounds, every doorman question, and a careful player that escapes hundreds of runs without a wrong door except by luck), a careful stacker that builds every Panic Stack level through the real physics (plus a 60-second brick tower, every liar's tells and every event's warning, and a first-timer that still clears the calm introductions), a careful tester that survives every Don't Blink night knowing only what's on its screen (plus checks that changes only happen while the screen is covered, never two to one object, and that the statue always scrapes when it moves), every 99 Seconds chapter's golden path played through the real rules in a single loop (plus a player who only does what the room's scratches spell out and still escapes every chapter, and checks that every sound that matters has a caption), and a solver that plays every Don't Trust The Game level (plus checks that the gated ones can't be finished without their trick, and that HELPER glances on every lie and never on the truth) |
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
