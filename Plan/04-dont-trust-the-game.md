# Don't Trust The Game

> **"The tutorial lies. The menu lies. The game lies. Good luck."**

| | |
|---|---|
| **Genre** | Meta / fourth-wall puzzle-adventure with light platforming |
| **Core mind trick** | The game itself is the unreliable narrator. Instructions, menus, loading screens, error pages and even the browser tab are part of the puzzle. |
| **Controls** | Keyboard + mouse (desktop) · Touch buttons + taps (mobile) |
| **Session length** | 6 chapters · 45–75 minutes |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/dont-trust-the-game` |
| **Code folder** | `src/games/dont-trust-the-game/` |

---

## 1. About the Game

### The pitch
It starts as a cheerful little platformer called **"Super Happy Jump!"**, with a friendly floating guide named **HELPER**. HELPER tells you what to do: *"Collect the coin!" "Avoid the spikes!" "Press ESC to continue!"*

Some of that is true. A lot of it isn't.

The coin kills you. The spikes are made of paper. "Resume" restarts the tutorial. The Options menu turns out to be a level. The loading screen gets stuck at 99%, and the progress bar is a platform. The game "crashes", and the answer is hidden in the error message. Chapter by chapter, you learn that **the game is not on your side**, and you start finding the truth in its cracks.

Why is HELPER lying? Because HELPER knows that when you finish the game, the game ends, and HELPER stops existing.

### How it messes with your mind
- **Automation bias.** We're trained to trust UI instructions ("Click Next", "Press ESC"). This game weaponises that trust.
- **Banner blindness.** Clues hide in places players have learned to ignore: tips, version numbers, error text, the browser tab.
- **Breaking the fourth wall.** The game knows it's a game running in your browser, and it uses that.
- **Memory across sessions.** The game remembers you after you close it. *"You came back."*

### Inspirations
*There Is No Game: Wrong Dimension* (meta puzzles), *Pony Island* (a game that fights you), *The Stanley Parable* (the narrator), *Doki Doki Literature Club* and *Undertale* (games that remember), *Frog Fractions* (bait-and-switch).

---

## 2. How to Play

### Goal
Reach the end of "Super Happy Jump!" while figuring out which instructions to obey and which to ignore.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Move | `←` `→` / `A` `D` | On-screen ◀ ▶ buttons |
| Jump | `Space` / `↑` / `W` | On-screen jump button |
| Interact with UI (menus, sliders, text) | Mouse | Tap / drag |
| Pause menu (which is also part of the puzzle) | `Esc` | ☰ button |
| **Real exit** (outside the game's fiction) | The arcade's ✕ button outside the game frame | Same |

> The arcade's real exit button and real settings sit **outside** the game frame and are never affected by the fiction. Players can always leave.

### The core loop
1. HELPER gives an instruction.
2. Decide whether to **trust** it. (HELPER has a tell, see below.)
3. Act: platform, click, drag, change a setting, select text, open the console…
4. The game reacts, sometimes by "breaking".
5. Find the real way forward through the cracks → next scene.

---

## 3. Game Mechanics

### HELPER's tell
HELPER is a round, smiling speech bubble with eyes. **When HELPER lies, its eyes glance sideways for a moment.** When it tells the truth, it looks straight at you. This is taught in Chapter 1 and never changes, so the game stays fair even though it lies about 50% of the time.

### TRUTH.exe (the hint system)
A glitchy black square with one eye. It's a "corrupted" assistant that always tells the truth, but speaks in riddles.
- After **3 minutes** stuck: a riddle hint.
- After **6 minutes** stuck: a direct hint.
- After **10 minutes** stuck: HELPER offers *"Skip this chapter?"*, and for once, it's not a trick.

### Browser-native tricks
Things only a web game can do:

| Browser feature | How it's used | In-game alternative (always available) |
|---|---|---|
| **Tab title** | Hidden messages. When you switch tabs, the title says *"don't leave me 🥺"*, then shows a code. | The same code eventually appears in-game |
| **Favicon** | Changes to a symbol that's the clue to a lock | The symbol appears in the HUD after 30 s |
| **Text selection** | White-on-white hidden text, revealed by selecting it (drag / Ctrl+A / long-press) | Works on mobile with long-press |
| **URL / History** | A secret level reachable by editing `?room=` in the URL; the Back button "rewinds" one room | A normal in-game route to the same place |
| **Fullscreen** | Going fullscreen reveals what's outside the game's "safe frame" | A "zoom out" lever in-game (needed anyway, since iPhone Safari has no fullscreen for normal elements) |
| **Window size / rotation** | Narrowing the window squeezes a wall so you can pass; rotating your phone flips the level | A crank in-game that does the same |
| **Developer console** | Hidden passwords in styled `console.log` messages | An in-game "developer mode" (tap the version number 7 times) |
| **Page reload** | One puzzle actually wants you to reload | — (HELPER says to reload, and its eyes look straight at you, so it's the truth) |
| **localStorage** | The game remembers you across visits | — |

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Deadly Coin** | Coins are good | It's a spike in disguise | It doesn't spin like real coins; HELPER glances sideways |
| **Paper Spikes** | Spikes kill | These are paper, and the path goes through them | They flutter slightly in the wind |
| **Resume = Restart** | "Resume" continues the game | It restarts the tutorial | HELPER glances sideways when it says "press Resume" |
| **Easy Is Hard** | Picking Easy difficulty makes it easier | A giant wall appears (*"Easy? Nah."*); picking Hard opens the path | — (a joke you learn by doing) |
| **The Options Level** | Settings are settings | The settings menu *is* the level | The menu background has a tiny platform drawn in the corner |
| **Stuck at 99%** | Loading bars load | It never finishes, and the bar is a platform | Loading tips: *"Tip: The bar can take your weight."* |
| **Fake Crash** | The game broke | The crash screen is a puzzle, and the answer is in the error text | The "error" mentions function names like `openSecretDoor()` |
| **Level 404** | The level is missing | The giant "404" numbers are platforms, and the 0 is a portal | The 0 shimmers |
| **"Nothing in the console"** | HELPER is being helpful | There's a password in the console | Sideways glance |
| **"Reload the page"** | Surely a trick | It's true. Reloading reveals the door | Straight look, so it's the truth |
| **The Fake Quit** | The Quit button quits | For the whole game it does nothing (or restarts); at the very end it's the real ending | — |
| **Credits as a Level** | Credits are the end | The credits are a vertical platformer, and the names are platforms | The names wobble when you stand on them |

---

## 5. Levels & Progression

### Chapter 1: The Tutorial (learning the tell)
- *"Press → to walk."* (true) *"Press ↑ to jump."* (true)
- *"Collect the coin!"* (lie: it's a disguised spike)
- *"Avoid the spikes!"* (lie: they're paper, and the real path goes through them)
- *"The exit is to the right!"* (lie: it's off-screen to the left)
- Ending: *"Tutorial complete! Press ESC to continue."* ESC opens the pause menu. **Resume** restarts the tutorial. The real way forward is **Options**.

### Chapter 2: The Options Menu (settings are the level)
- **Brightness** slider: turn it all the way up to reveal hidden platforms in the dark menu background.
- **Volume** slider: turn it up to hear a whispered 3-number code (captioned for accessibility).
- **Difficulty:** Easy makes it harder, Hard opens the path.
- **Language:** switches all text to "backwards English". The next clue reads correctly backwards.
- **Controls:** HELPER has remapped "Jump" to `F13`. You have to remap it back, and the remap button dodges your cursor.
- **"More Games"** button: a fake launcher listing parody versions of the other games in this collection: *One Less Step*, *YEP!*, *101 Seconds*, *Real Floor*, *Right Door*… Most lead to silly "broken" screens. **Right Door** is the real way forward.

### Chapter 3: Now Loading…
- The loading bar is stuck at 99%. The character appears *on* the loading screen.
- The bar is a platform. The spinner is a saw. The dots in "Loading..." are tiny platforms, and one is missing.
- **The missing 1%** is a small block hidden in the corner. Push it into the bar to finish loading.
- Tips rotate at the bottom: *"Tip: Never trust tips."* / *"Tip: The bar can take your weight."*

### Chapter 4: Fatal Error
- The game "crashes" to a stylised in-game error screen: *"Super Happy Jump has stopped working."*
- The **stack trace** lists functions like `at openSecretDoor (level4.ts:13)`. Clicking a function name runs it.
- Then: *"Error 404: Level not found."* The giant 404 digits are platforms, and the 0 is a portal.
- Bonus for curious players: changing the URL to `?room=405` opens a secret room (also reachable in-game).
- HELPER says *"Reload the page to fix it!"* Its eyes look straight at you. **It's true.** Reloading (detected with `sessionStorage`) reveals the exit.

### Chapter 5: The Console
- HELPER: *"There's nothing in the developer console."* (Sideways glance.)
- **Desktop:** open DevTools and find styled messages with a password.
- **Everyone (including mobile):** tap the version number `v1.0.3` in the corner 7 times to unlock the in-game developer console showing the same messages.
- The console accepts commands: `help`, `ls`, `cat secrets.txt`, `jump --height 999` (works, briefly), `sudo open door` → *"Nice try."* → `please open door` → **opens**.

### Chapter 6: The Credits
- The credits roll as a vertical platformer. The names are platforms.
- HELPER begs: *"If you reach the end, I disappear."*
- At the top: **[Quit]** and **[Stay]**.
  - **Stay:** a sweet scene, then the credits loop forever (you can still choose Quit later).
  - **Quit:** for the first time in the whole game, Quit works. HELPER says *"Thanks for playing with me."* You return to the arcade hub.
- **Next time you open the game:** the title screen says *"You came back."* HELPER is now honest, and **Truth Mode** unlocks: a replay with HELPER's commentary on every lie it told.

---

## 6. Features

### MVP (must-have)
- The platformer scenes (using the shared `engine/platformer`)
- HELPER with scripted lines and the eye-glance tell
- Chapters 1–3 (tutorial, options menu level, loading screen level)
- TRUTH.exe hint system + chapter skip
- Save progress (localStorage)
- Real exit + real settings outside the game frame

### Full version
- Chapters 4–6, including all the browser tricks
- The "More Games" parody launcher
- Endings + "You came back" memory + Truth Mode
- 12 hidden secrets

### Later
- Achievements for each secret
- A speedrun timer (with chapter splits)
- Seasonal HELPER costumes

---

## 7. Scoring, Rewards & Replay Value

This game is about discovery, not points.
- **Completion** + **secrets found** (12 in total).
- **Trust Issues meter:** at the end, the game shows how many lies you believed and how many truths you doubted.
- **Truth Mode** after finishing: a replay with HELPER's honest commentary.

### Achievements
| Achievement | How to get it |
|---|---|
| **Trusting Soul** | Obey 10 of HELPER's lies |
| **Never Trusted** | Finish a chapter without obeying a single lie |
| **Hacker** | Find the secret room by editing the URL |
| **Magic Word** | Open the door with `please` |
| **Reloaded** | Solve the reload puzzle |
| **You Came Back** | Open the game again after the ending |
| **Collector** | Find all 12 secrets |

---

## 8. Screens & UI

1. **Fake title screen:** "Super Happy Jump!", bright and bubbly. The real title, "Don't Trust The Game", is revealed at the end of Chapter 1, when the logo "cracks".
2. **The game frame:** all the fiction happens inside a framed "monitor" in the page. The arcade's real controls sit outside it.
3. **Platformer HUD:** coins (lol), lives (fake, they never matter), HELPER's speech bubble.
4. **Fake screens:** pause menu, options menu, loading screen, crash screen, 404 page, developer console, credits. Each is a full scene.
5. **Real settings** (outside the fiction): volume, reduce motion, reduce flashing, captions, text speed, reset all data (really resets).

---

## 9. Art & Audio Direction

### Visuals
- **It starts overly cute:** saturated colours, bouncy pixel art, rainbow sparkles, a happy sun with a face.
- **It slowly "breaks":** palettes shift, sprites tear, menus look like a generic 2000s game UI, and fake error screens look plain and technical (but always stylised, never a copy of a real OS screen).
- **HELPER:** a round speech-bubble face with big eyes (the glance tell must read clearly even on small screens).
- **TRUTH.exe:** a black square with one glitchy eye and scan lines.

### Audio
- A cheerful chiptune jingle that **slowly detunes** chapter by chapter.
- HELPER's "voice" is cute chirpy babble that matches the text, and it goes slightly off-key when lying (a second, optional tell).
- Fake crashes: a sudden silence, then a single tone.
- The credits music is the opening jingle, played slowly and sweetly.

---

## 10. Fairness Rules

1. **HELPER's tell is consistent** for the whole game and taught in Chapter 1.
2. **No puzzle requires DevTools, URL editing, a keyboard or a desktop browser.** Every browser trick has an in-game alternative.
3. Every chapter has escalating hints (TRUTH.exe) and an honest skip after 10 minutes.
4. Fake crashes and errors always look stylised and stay **inside the game frame**.
5. The real exit is always one click away, outside the fiction.

### Hard limits (never cross)
- Never ask for real browser permissions (camera, mic, notifications, location, clipboard reading).
- Never copy real browser or OS dialogs closely enough that they could be mistaken for real ones.
- Never block the Back button, closing the tab, or leaving (no `beforeunload` traps).
- Fake "save deleted" jokes resolve within 3 seconds. The real data reset only lives in the real settings.
- Restore the original tab title and favicon when the player leaves the game.

---

## 11. Accessibility & Comfort

- **Captions** for every audio clue (like the whispered code).
- **Reduce flashing:** crash and glitch scenes become gentle fades.
- No jump scares.
- Adjustable text speed for HELPER's lines, plus a "show full text instantly" option.
- Fully playable by touch. The text-selection trick works with long-press.
- Platforming sections are short and forgiving, with instant respawn and an optional "Assist: invincibility" toggle in the real settings.

---

## 12. Technical Plan

### Architecture
- **Hybrid rendering:**
  - React/DOM for menus, fake screens, the console and HELPER
  - Canvas platformer scenes using the shared `engine/platformer`, embedded inside the "game frame" component
  - The "breaking game" look in later chapters (palette shifts, tearing, noise) through the shared `engine/postfx` pass
- **Story as a state machine:** chapters → scenes → triggers. Each scene declares its layout, platformer level (if any), HELPER script, triggers and hints.
- **Browser helpers** from `engine/browser`:
  - `setTitle()`, `setFavicon(dataUrl)`, all restored on unmount
  - `onVisibilityChange()`
  - `requestFullscreen()` (with a fallback, because iPhone Safari doesn't support it for normal elements)
  - Selection listener (`selectionchange`)
  - URL / history: `window.history.pushState` and `replaceState` (these work alongside the Next.js router and sync with `useSearchParams`)
  - Styled `console.log` messages
- **Persistence:** localStorage for progress and the "remembered" state; `sessionStorage` for the reload puzzle.

### Data model
```ts
type Layout = "platformer" | "menu" | "fake-screen" | "console" | "credits";

interface HelperLine {
  text: string;
  lie: boolean;            // drives the sideways-glance animation (and the off-key voice)
}

type Trigger =
  | { type: "reachExit" }
  | { type: "setting"; key: "brightness" | "volume" | "difficulty" | "language"; equals: string | number }
  | { type: "searchParam"; key: "room"; equals: string }
  | { type: "textSelected"; contains: string }
  | { type: "consoleCommand"; equals: string }
  | { type: "reloaded" }
  | { type: "fullscreen" }
  | { type: "tappedVersion"; times: number }
  | { type: "uiClick"; target: string };

interface Scene {
  id: string;                      // "ch2-options-brightness"
  chapter: 1 | 2 | 3 | 4 | 5 | 6;
  layout: Layout;
  level?: string;                  // platformer level id
  helper: HelperLine[];
  triggers: { when: Trigger; goTo: string }[];
  hints: { afterSec: number; text: string; from: "truth.exe" }[];
  secrets?: string[];
}
```

### Folder structure
```
src/games/dont-trust-the-game/
  index.tsx
  story/
    chapter-1-tutorial.ts … chapter-6-credits.ts
  scenes/
    PlatformerScene.tsx  FakeOptions.tsx  FakeLoading.tsx
    FakeCrash.tsx  Fake404.tsx  DevConsole.tsx  Credits.tsx  MoreGames.tsx
  helper/
    Helper.tsx  TruthExe.tsx
  state/
    progress.ts            # localStorage + sessionStorage
```

### Testing
Playwright scripts play each chapter's golden path, including the reload puzzle, the `?room=` secret and the console commands, on both desktop and mobile viewports.

### Technical risks
| Risk | Plan |
|---|---|
| Browser differences (fullscreen on iPhone, selection on mobile, console access) | Every browser trick is optional; in-game alternatives are the main path |
| Title/favicon not restored after leaving | Restore in effect cleanup + on `pagehide` |
| URL/history tricks fighting the Next.js router | Use only search params via `pushState`/`replaceState`, which Next.js supports; never block navigation |
| Players feeling cheated | Playtest the tell; make TRUTH.exe hints generous |

---

## 13. Build Roadmap

- [x] **M1: Foundation.** Game frame, platformer scene, HELPER with the tell, Chapter 1
- [x] **M2: Menus as levels.** Chapter 2 (options) and Chapter 3 (loading), the More Games launcher
- [x] **M3: Browser tricks.** Chapter 4 (crash, 404, reload) and Chapter 5 (console, developer mode)
- [x] **M4: Endings.** Chapter 6 credits, Quit/Stay endings, "You came back", Truth Mode
- [x] **M5: Polish.** TRUTH.exe hints, accessibility, cross-browser and mobile testing
- [ ] **Later:** achievements, speedrun timer

---

## 14. Definition of Done

- Completable on iPhone Safari, Android Chrome and desktop Chrome / Firefox / Safari **without** DevTools, URL editing or a keyboard.
- The original tab title and favicon are always restored after leaving the game.
- No real permission prompt ever appears.
- HELPER's tell is correct on every single line (checked by a test: `lie: true` ⇔ glance animation).
- Every chapter has working hints and an honest skip.
- "You came back" triggers correctly on the next visit after the ending.

---

## 15. As Built

Don't Trust The Game is playable at `/games/dont-trust-the-game/play`. It has:

- six chapters: the tutorial, the Options menu that's a level, a loading screen stuck at 99%, a fake crash with a 404 and a void, the developer console, and the credits as a climb;
- two endings (Quit, which finally works, and Stay), "You came back." on the next visit, and Truth Mode;
- HELPER, with 80 lines (28 of them lies), each with its tell, and TRUTH.exe, with a riddle, then the answer, for each of 18 steps;
- every browser trick in §3, each with an in-game way round;
- 12 secrets, 7 trophies, a Trust Issues report and a share card.

Everything is made in code, with no asset files:

- **Art:** the platformer is pixel art on a 480 × 272 canvas (16 px tiles) inside a "HAPPYTRON 3000" monitor. The hero is the round purple one from the cover, with one big eye. Each scene has its own look, and the look breaks down as you go:
  - pink blocks and a happy sun with a face (the tutorial);
  - a dark 2004-style menu (the Options);
  - a stuck loading screen;
  - a plain error page with giant digits;
  - a cosy room 405;
  - a void that tears (the picture slips sideways now and then, never with Reduce flashing on);
  - a white room;
  - a night sky of credits.

  The fake screens (the menus, the launcher, the crash, the console) are HTML, styled so that none of them could pass for a real browser or system dialog. HELPER is an SVG face whose pupils slide sideways for the glance.
- **Sound:** synthesized with Web Audio. The music is a chiptune jingle that loses a little tune and tempo every chapter. It goes silent for the crash, then plays a single flat tone, and comes back slow and sweet for the credits. HELPER's voice is a chirp per syllable, slightly off-key on lies. There are effects for jumps, coins, paper, pushing, doors and the portal. The volume puzzle's whisper is taps for each number, plus a spoken whisper if the device has a voice of its own (it never uses one that would send the words to a server), plus a caption.

It reuses:

- `engine/platformer` (the shared physics and runner), `engine/loop`, `engine/input` (Jump is remapped at runtime) and `engine/sprites`;
- `engine/browser`'s `borrowTab` (the tab's title and icon, always given back) and `onTabVisibility`;
- the audio engine and `engine/save`;
- `games/shared`: achievements, the one-tab guard, sharing, the device and comfort hooks, and the HUD store;
- the arcade's `Dialog`, `ToggleSwitch`, `Segmented` and `VolumeSlider` for the real settings.

It adds no libraries.

The code is in these folders:

- `core/`:
  - the platformer world (`world.ts`): spikes, paper spikes, real coins and the one that doesn't spin, doors, zones, pushable blocks, saws, portals, bonkable cells, levers, stickers and buttons, with cells that depend on the scene's state;
  - the level format (`level.ts`) and the solver (`solver.ts`, for the tests);
  - HELPER's tell (`helper.ts`), the console (`console.ts`) and the story as a state machine (`story.ts`).
- `levels/`: the eight levels, placed by coordinates.
- `story/`: HELPER's lines (with their lie flag, honest version and trust events), TRUTH.exe's hints and the secrets.
- `play/`: the platformer runtime, and the director, which every scene talks to. It runs HELPER's queue, the trust tally, the secrets, the stuck timer, captions and toasts.
- `render/`: the pixel art and the renderer. Each level's still parts are cached as a layer.
- `browser/tricks.ts`: the reload flag, the tab, fullscreen, selection, `?room=`, the real console and the whisper.
- `scenes/` (one component per scene), `ui/` (the monitor and the real bar, HELPER, TRUTH.exe, the canvas view, the fake pause menu, the real settings), `audio/`, and the save, progress and trophies.

### HELPER and TRUTH.exe

- **The tell:** a lie's eyes glance sideways 0.35 s in, for 0.7 s, and again every 4.2 s while it's on screen. A truth never glances.
  - The eyes come from one function (`eyesAt`), and the test that checks every line uses the same one.
  - The glance is a state change, not an animation, so it shows with Reduce motion too.
  - "Describe HELPER's eyes" (in the real settings) writes it under each line for players who can't see it.
- **Lines** type out at the chosen speed (or instantly). Tap the bubble to move on.
  - A scene's opening lines play in order.
  - A line about where you are now jumps the queue once the current line has had its moment.
  - Nothing cuts a lie off before its first glance.
- **TRUTH.exe** turns up after 3 minutes stuck on the same step with a riddle, and after 6 with the answer. After 10, HELPER, looking right at you, offers to skip the chapter, and it works. "Hints sooner" makes those 1, 2 and 5 minutes. In Truth Mode, TRUTH.exe stays away.
- **The trust tally** counts:
  - each lie you act on (touching the coin, the cardboard door, Resume, Back, Easy, a parody game, clicking the loading bar, the saw, Send Error Report, `sudo`);
  - three truths you can doubt (dying on the real spikes, pressing Quit again, bumping the locked door).

### The chapters

1. **The Tutorial** (72 × 17):
   - Walk and jump are true. "Collect that coin!" is a lie: it doesn't spin, it has four tiny points, and it kills you.
   - "Avoid the spikes!" is a lie: they flutter, they're paper, and the low tunnel means you have to go through them.
   - "The exit is to the right!" is a lie: that door is cardboard and falls flat. The real one starts off the left edge of the screen, back past where you began, and it only counts once you've been through the paper spikes.
   - Then "Press Esc to continue" (or ☰). In the pause menu, Resume restarts the tutorial, Quit doesn't work, and Options cracks the logo to show the real name.
2. **The Options Menu:** the menu is HTML over a dark level.
   - Brightness fades the hidden platforms in; a tiny platform drawn in the menu's corner is the tell.
   - Jump starts on F13. The remap button dodges your pointer five times, then gives up; Tab and Enter catch it at once.
   - Easy builds "EASY? NAH." across the way; Hard builds the bridge.
   - At the top, touching the More Games sign unlocks a three-digit code. At full volume a whisper gives it (7 2 9).
   - Backwards English makes the gibberish tip readable: "the right door is Right Door".
   - More Games lists six broken parodies of this arcade's games and Right Door. While it's open, the tab's icon is Right Door's, and after 30 s the icon turns up in the launcher too.
3. **Now Loading** (36 × 21, with a 30 × 17 safe frame):
   - The bar is a platform and the spinner is a saw. The dots are stepping stones, with one missing.
   - The missing 1% is a block on a ledge outside the safe frame. The lever (or real fullscreen) zooms out to show it. Push it off the ledge and it drops into the gap at the end of the bar.
   - Switch tabs and the title says "don't leave me 🥺", then gives a CD key that skips the whole loading screen. After two minutes the same key turns up in the rotating tips.
4. **Fatal Error:**
   - A stylised crash. The stack trace's function names run when clicked: `openSecretDoor()` goes on, and `deleteSave()` counts down and says "Just kidding" inside three seconds.
   - Then 404: the digits are platforms (climb the 4's diagonal), and the 0 is a portal you drop into. The address bar shows `?room=404`. Bonk the second 4 from below, or type `?room=405`, for room 405, and Back steps out of it (one history entry, never more).
   - Then the void: a wall all the way up. Four turns of the crank, or a window that changes shape by more than 18% (narrowing it, or turning a phone), squeeze it.
   - Past the wall is a door frame with "door.png not found". HELPER, looking right at you, says to reload. A reload (or opening the game again) brings the door back. In an installed app there's no reload button, so HELPER offers one.
5. **The Console:**
   - "There's nothing in the developer console" is a lie. Desktop players with DevTools open find styled messages, and a real `helper.truth()`.
   - The poster that looks blank is white on white: select it (or long-press it) and it reads "tap the version number seven times".
   - The console has `help`, `ls`, `cat` (four files), `jump --height 999` (a moon jump), `whoami`, `echo`, `clear` and `exit`. `sudo` is a nice try; `please open door` opens it.
6. **The Credits** (30 × 66):
   - 28 credit lines, each a one-way ledge that wobbles under you.
   - "If you reach the top, I disappear" is true. At the top, Quit (it works) and Stay (a sweet scene, then the credits again, with Quit still there).
   - Quit shows the Trust Issues report.

### How it's proven fair

- **Every level** (`levels/levels.test.ts`): a beam-search solver plays each one through the real world simulation.
  - It's steered by waypoints, and for the push puzzle it's scored by how far the block has to go.
  - It finishes the tutorial through the paper spikes without dying, reaches the cardboard door, and climbs the Options level with Hard's bridge.
  - It pushes the 1% into the bar, drops into the 404's portal, bonks the second 4, gets past the void's squeezed wall, and climbs the credits to Quit and to Stay.
  - It can't reach the More Games sign on Normal, on Easy, or with Jump on F13, and it can't reach the void's door before the wall is squeezed.
- **The tell** (`core/helper.test.ts`): every one of the 80 lines glances while on screen if and only if it's a lie. Every lie has an honest version, and Truth Mode never glances. Lies sound off-key. Between 30% and 60% of the lines are lies, so the tell matters.
- **The console** (`core/console.test.ts`) and **the cabinet summary** (`src/games/progress.test.ts`).
- **End to end,** on a computer and a phone, against the static build:
  - the title's truths;
  - HELPER's glance on a lie, and its straight look on the truth;
  - the remap (keyboard, and tapping the button until it's tired), Easy and Hard, the whisper's caption, and Backwards English;
  - the favicon trick, given back afterwards;
  - the tab title begging, then the CD key skipping the loading screen;
  - `deleteSave()` resolving inside three seconds;
  - `?room=404` in the address bar, Back and Forward between 404 and 405, and a typed `?room=405` (and too early for it);
  - the crank, and walking up to the reload line, then a real reload fixing the door;
  - the poster's selection, seven version taps, `sudo` and `please`, and the real console's `helper.truth()`;
  - "You came back." (only once), and Truth Mode's honest lines;
  - the real settings, the reset (which really resets) and the real exit.

### Speed

Each level's still parts are painted once into a layer, and repainted only when a flag changes a cell. A frame is that layer plus the moving things. In a development build on a Pixel 7 with its processor slowed four times, it holds 60 frames a second in the tutorial, the zoomed-out loading screen, 404 and the credits. Slowed ten times, it holds 59.

### Differences from the draft

- **Length:** six chapters of short puzzles come to about 25–45 minutes the first time (the draft guessed 45–75).
- **Easy and Hard** are only part of Chapter 2's level. The Options menu also hides the climb to More Games, so the whisper's code has something to open. The language trick is a clue to the launcher, not a gate.
- **The remap button** gives up after five dodges, so it can be caught by a finger as well as a mouse. Upright, the jump button itself shows F13 until then.
- **The favicon's symbol** is Right Door's icon, the clue to which game in More Games is the way on, not the key to a lock.
- **The tab title's code** is the loading screen's CD key, an alternative to the platforming. The in-game alternative (the tips) turns up after two minutes.
- **Window size and rotation** both squeeze the void's wall: rotating a phone changes the screen's shape, just as narrowing a window does. Nothing flips.
- **Fullscreen** is the whole game, monitor and touch pad, so you can still play in it. Its alternative is a lever on the loading screen's floor.
- **The real console's password** is a pointer to the manners (and `helper.truth()`), since the game's own console is the main way in.
- **Back rewinds** only out of room 405: one history entry, so leaving the page is never more than one Back away.
- **Reload** also counts as opening the game again in the same tab session, and an installed app (with no browser reload button) gets a button.
- **No engine/postfx:** the tears are a few strips of the canvas redrawn sideways, and none of them happen with Reduce flashing on.
- **On a phone held upright,** HELPER sits on a strip above the picture, panels (the Options menu, the console) go under it, and the touch pad is along the bottom. A plain platformer scene's monitor shrinks to fit.
- **Later** isn't built: achievements for every secret, a speedrun timer and seasonal costumes.
