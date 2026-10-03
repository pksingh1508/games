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

- [ ] **M1: Foundation.** Game frame, platformer scene, HELPER with the tell, Chapter 1
- [ ] **M2: Menus as levels.** Chapter 2 (options) and Chapter 3 (loading), the More Games launcher
- [ ] **M3: Browser tricks.** Chapter 4 (crash, 404, reload) and Chapter 5 (console, developer mode)
- [ ] **M4: Endings.** Chapter 6 credits, Quit/Stay endings, "You came back", Truth Mode
- [ ] **M5: Polish.** TRUTH.exe hints, accessibility, cross-browser and mobile testing
- [ ] **Later:** achievements, speedrun timer

---

## 14. Definition of Done

- Completable on iPhone Safari, Android Chrome and desktop Chrome / Firefox / Safari **without** DevTools, URL editing or a keyboard.
- The original tab title and favicon are always restored after leaving the game.
- No real permission prompt ever appears.
- HELPER's tell is correct on every single line (checked by a test: `lie: true` ⇔ glance animation).
- Every chapter has working hints and an honest skip.
- "You came back" triggers correctly on the next visit after the ending.
