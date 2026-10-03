# Game Plans

This folder has one design plan for each game in this project: a collection of **15 short browser games that mess with your mind**. They lie to you, trap you and turn your own habits against you, but they always play fair.

Each plan is a working document. Numbers like level counts, timings and medal times are starting targets, and we'll tune them during playtesting.

---

## The Games

| # | Game | Genre | The mind trick | Main input | Plan |
|---|---|---|---|---|---|
| 1 | **One More Step** | Turn-based grid puzzle | The exit door has feet and runs away. Nothing moves unless you move. | Keys / swipe | [01-one-more-step.md](01-one-more-step.md) |
| 2 | **NOPE!** | Troll quiz | The obvious answer is wrong. The screen itself can be the answer. | Click / tap | [02-nope.md](02-nope.md) |
| 3 | **99 Seconds** | Time-loop escape room | Every 99 seconds the room resets. Only your knowledge survives. | Click / tap | [03-99-seconds.md](03-99-seconds.md) |
| 4 | **Don't Trust The Game** | Meta puzzle-adventure | The tutorial, menus, loading screens and even the browser tab lie to you. | Keys + mouse / touch | [04-dont-trust-the-game.md](04-dont-trust-the-game.md) |
| 5 | **Fake Floor** | Perception platformer | Some floors are fake, and the clues you learn will eventually lie too. | Keys / touch buttons | [05-fake-floor.md](05-fake-floor.md) |
| 6 | **TrapSprint** | Troll platformer + speedrun | Hidden traps fire exactly when you feel safe. Memorise them, then sprint. | Keys / touch buttons | [06-trapsprint.md](06-trapsprint.md) |
| 7 | **Glitch Run** | Glitch auto-runner | The screen and controls "break" on purpose, and you are the bug. | 3 buttons / taps | [07-glitch-run.md](07-glitch-run.md) |
| 8 | **Almost There** | Vertical rage climber | Fake summits, a lying progress bar and very long falls. | Hold-to-jump | [08-almost-there.md](08-almost-there.md) |
| 9 | **One Tap Chaos** | One-button microgames | There's only one tap, but what it means (and whether you should tap at all) keeps changing. | 1 button | [09-one-tap-chaos.md](09-one-tap-chaos.md) |
| 10 | **Last Pixel** | Clean-up + hunt | You're 99.99% done, but the last pixel is alive and will hide anywhere. | Drag / tap | [10-last-pixel.md](10-last-pixel.md) |
| 11 | **Panic Stack** | Physics stacking | Objects lie about their weight and shape. Panic events hit when your tower looks safe. | Drag / rotate | [11-panic-stack.md](11-panic-stack.md) |
| 12 | **Cursor Escape** | Cursor maze / dodge | You are the cursor. The OS inverts you, lags you, hides you and fakes you. | Mouse / touch trackpad | [12-cursor-escape.md](12-cursor-escape.md) |
| 13 | **Wrong Door** | Deduction roguelite | Doors, signs and a doorman that lie by rules you have to crack. | Click / tap | [13-wrong-door.md](13-wrong-door.md) |
| 14 | **Don't Blink** | Observation thriller | Every time you blink, something changes. Spot it before the changes pile up. | Click / tap + hold | [14-dont-blink.md](14-dont-blink.md) |
| 15 | **Gravity Is Lying** | Gravity puzzle-platformer | The arrow, the camera and the narrator all lie about which way is down. | Keys / touch buttons | [15-gravity-is-lying.md](15-gravity-is-lying.md) |

---

## Shared Design Pillars

Every game in the collection follows these rules.

1. **Every lie has a tell.** The game may trick you, but there is always a clue that a sharp player could have noticed. Fair trolling makes people laugh. Unfair trolling makes them quit.
2. **Fail fast, retry faster.** Restarts take less than half a second. A death should feel like a joke, not a punishment.
3. **Teach, then betray.** Introduce a rule safely, let the player master it, then twist it. Only twist it after hinting that a twist is possible.
4. **Short sessions.** A level or run takes between 30 seconds and 5 minutes.
5. **Built for the browser.** Use things only the web can do, like the tab title, favicon, cursor, window size and URL. Never do anything harmful (see the guardrails below).
6. **Desktop and mobile.** Every game can be played by touch. If a trick needs a mouse or keyboard, it has a touch version that's just as fair.
7. **Comfort settings always win.** Reduce motion, reduce flashing, no jump scares and volume are respected by every game.

### Guardrails (things no game will ever do)

- Ask for real browser permissions (camera, mic, notifications, location, clipboard) as a trick. The only exception is the clearly opt-in webcam feature planned for *Don't Blink*.
- Imitate real browser or OS dialogs closely enough that someone could mistake them for real ones. Fake errors stay inside the game frame and look stylised.
- Block the back button, closing the tab or leaving the page (no `beforeunload` traps).
- Fake-delete the player's progress for more than a joke of a few seconds.
- Show fake ads, fake downloads or anything that looks like phishing.

---

## Shared Technical Foundation

### Current stack (from `package.json`)

- **Next.js 16.3** (App Router, `src/app` directory)
- **React 19.2** + **TypeScript**
- **Tailwind CSS v4**
- **pnpm**

### Routes

```
src/app/page.tsx                    → "/"              Arcade hub: a grid of all 15 games
src/app/games/[slug]/page.tsx       → "/games/<slug>"  One shared page for every game
src/app/games/[slug]/GameLoader.tsx → "use client" component that loads the game
```

These conventions were checked against the Next.js docs bundled in `node_modules/next/dist/docs/`:

- `generateStaticParams()` returns all 15 slugs from the game registry, so every game page is prerendered at build time.
- `export const dynamicParams = false` makes unknown slugs return a 404. This option isn't available if Cache Components is turned on later.
- `generateMetadata()` gives each game its own title, description and share image.
- In this Next.js version `params` is a **Promise**. Use `const { slug } = await props.params` in the page, and type it with the global `PageProps<'/games/[slug]'>` helper.
- Games use `window`, canvas and audio, so they only render in the browser. The page (a Server Component) renders `GameLoader`, a Client Component that loads the game with `next/dynamic(() => import(...), { ssr: false })`. **`ssr: false` is only allowed inside Client Components.**
- `window.history.pushState` / `replaceState` work alongside the Next.js router (used by *Don't Trust The Game*).

### Folder structure

```
src/
  app/
    page.tsx                  # Arcade hub
    games/[slug]/page.tsx     # Shared game page (static params from the registry)
    games/[slug]/GameLoader.tsx
  games/
    registry.ts               # slug, title, tagline, genre, controls, cover, lazy import
    one-more-step/            # one folder per game; entry file: index.tsx
    nope/
    ...
  engine/                     # shared, framework-free TypeScript
    loop.ts                   # fixed-timestep loop (60 Hz) on requestAnimationFrame; auto-pauses on hidden tab
    input.ts                  # keyboard / pointer / touch / gamepad → game actions
    audio.ts                  # Web Audio wrapper (unlocks on the first user gesture)
    save.ts                   # versioned localStorage saves, key format "mfg:<slug>:v1"
    rng.ts                    # seeded random numbers (daily challenges, procedural levels)
    settings.ts               # global comfort settings (see below)
    platformer/               # tile collisions, jump physics, camera (shared by 6 games)
    postfx/                   # optional WebGL2 screen effects (glitch, CCTV noise, scanlines)
    browser/                  # tab title, favicon, visibility, fullscreen, pointer lock helpers
  components/
    GameShell.tsx             # frame, pause menu, settings panel, results screen
```

### Engine reuse map

| Shared piece | Used by |
|---|---|
| `engine/loop` (canvas game loop) | Every canvas game: One More Step, Fake Floor, TrapSprint, Glitch Run, Almost There, One Tap Chaos, Last Pixel, Panic Stack, Cursor Escape, Don't Blink, Gravity Is Lying, Don't Trust The Game (platform scenes) |
| `engine/platformer` | **TrapSprint** (built first), Fake Floor, Almost There, Gravity Is Lying, Glitch Run, Don't Trust The Game |
| `engine/postfx` | Glitch Run, Don't Blink, Don't Trust The Game |
| `engine/browser` | Don't Trust The Game, Last Pixel, Cursor Escape, 99 Seconds |
| `engine/rng` | One Tap Chaos, Glitch Run, Wrong Door, Panic Stack, Don't Blink, One More Step (daily puzzle) |
| Pure React/DOM (no canvas) | NOPE!, 99 Seconds, Wrong Door |
| Physics library (Planck.js) | Panic Stack only |
| Level solvers / generators (Node scripts + tests) | One More Step, Wrong Door |

### Global settings (stored once, respected everywhere)

| Setting | Effect |
|---|---|
| Reduce motion | No screen shake, no camera rotation, minimal tweening |
| Reduce flashing | No full-screen flashes; never more than 3 flashes per second (WCAG 2.3.1) |
| No jump scares | Scary moments become gentle fades |
| Volume | Master / music / sound effects |
| Colourblind-safe | Nothing relies on colour alone; shapes, patterns and icons back it up |

---

## Suggested Build Order

| Step | What | Why |
|---|---|---|
| 0 | Hub page, `GameShell`, registry, `engine` basics | Everything depends on it |
| 1 | **NOPE!** | Pure React/DOM. Ships fast and tests the shell. |
| 2 | **One Tap Chaos** | Adds the canvas loop, input handling and audio-synced timing |
| 3 | **TrapSprint** | Builds the shared platformer kit |
| 4 | **Fake Floor**, **Almost There**, **Gravity Is Lying**, **Glitch Run** | Reuse and extend the platformer kit |
| 5 | **Cursor Escape**, **Last Pixel** | Pointer-driven games, browser helpers |
| 6 | **One More Step**, **Wrong Door** | Logic engines with automated solvers |
| 7 | **Panic Stack** | Adds a physics library |
| 8 | **Don't Blink**, **99 Seconds** | Art-heavy scene games |
| 9 | **Don't Trust The Game** | Comes last because it parodies the other games and uses the most browser tricks |

---

## How Each Plan Is Organised

Every game file uses the same 14 sections:

1. **About the Game**: the pitch, how it messes with your mind, and inspirations
2. **How to Play**: goal, controls (desktop + mobile) and the core loop
3. **Game Mechanics**: the rules in detail
4. **Mind Tricks Catalogue**: every trick, what you expect, what really happens, and the tell
5. **Levels & Progression**: worlds, example levels, difficulty curve
6. **Features**: MVP vs. later
7. **Scoring, Rewards & Replay Value**
8. **Screens & UI**
9. **Art & Audio Direction**
10. **Fairness Rules**: the game's own guardrails
11. **Accessibility & Comfort**
12. **Technical Plan**: architecture, key systems, data model, folders, risks
13. **Build Roadmap**: milestones
14. **Definition of Done**

### Glossary

| Term | Meaning |
|---|---|
| **Troll / trick** | Something the game does on purpose to fool you |
| **Tell** | The clue that gives a trick away, if you notice it |
| **Betrayal** | When a rule you learned changes later (always signposted) |
| **Truth anchor** | Something in a game that never lies, which players can rely on |
| **Telegraph** | A warning (sound, flash, icon) shortly before something happens |
| **MVP** | Minimum Viable Product: the smallest version worth shipping |
