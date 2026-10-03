# Almost There

> **"You're so close. You're always so close."**

| | |
|---|---|
| **Genre** | Vertical precision climber / rage game |
| **Core mind trick** | The game keeps telling you you're nearly at the top, with fake summits, a lying progress bar and fake credits, while one bad jump can drop you a long way down |
| **Controls** | Hold to charge a jump, release to leap |
| **Session length** | One continuous climb: 1–4 hours for a first clear · speedruns of 10–20 minutes |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/almost-there` |
| **Code folder** | `src/games/almost-there/` |

---

## 1. About the Game

### The pitch
**Pip** is a tiny climber with a huge backpack and a flag to plant at the top of the mountain. Climbing is simple: **hold** to charge a jump, **release** to leap. Once you're in the air, there's no steering. Miss a ledge and you don't die. You just **fall**, maybe one screen, maybe five.

A cheerful sparrow named **Chirp** flies beside you the whole way, saying *"Almost there!"* The progress bar on the side says 90%. Then 97%. Then you reach the summit, plant your flag, and **the credits roll**… and halfway through the credits, the ground under your flag crumbles.

You were not almost there.

### How it messes with your mind
- **The goal-gradient effect.** People try harder as they get close to a goal. The game constantly makes the goal *feel* close.
- **The near-miss effect.** Almost making a jump is more motivating than missing it badly. Ledges are designed to produce lots of "so close!" moments.
- **Loss aversion and sunk cost.** Every metre you climb is something you can lose, which makes every jump tense.
- **Rage → catharsis.** The frustration makes the final summit one of the best feelings in the whole collection.

### Inspirations
*Jump King* (charge jumps, no air control, screen-by-screen climbing), *Getting Over It with Bennett Foddy* (climbing, falling, the narrator), *Only Up!* (vertical ascent), *Celeste* (assist mode done right).

---

## 2. How to Play

### Goal
Reach the **real** summit and plant your flag.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Walk (on the ground) | `←` `→` / `A` `D` | ◀ ▶ buttons |
| Charge jump | Hold `Space` | Hold the big jump button |
| Choose direction | Hold `←` / `→` (or nothing for straight up) when you **release** | Hold ◀ / ▶ while releasing jump |
| Pause | `Esc` | ⏸ button |

### The core loop
1. **Look** at the screen above you and plan the route.
2. **Charge** a jump (Pip squats lower and a rising tone plays).
3. **Release** and commit. There's no air control.
4. **Land** on the next ledge, or **fall** and recover.
5. Reach the top of the screen → the camera cuts to the next screen.
6. Repeat until the summit (the real one).

---

## 3. Game Mechanics

### Jump physics
- **Charge time:** 0–600 ms. Jump power grows in a straight line with charge time, up to a maximum.
- **Direction:** left, right or straight up, decided at the moment you release.
- **No air control.** Once you jump, the arc is fixed.
- **Wall bounce:** hitting a wall reverses your sideways speed at half strength.
- **Ceilings** stop upward movement.
- **No fall damage and no death.** You land wherever gravity takes you.
- Physics runs at a fixed 60 Hz and is fully deterministic, so practice always transfers.

### Screens
- The world is a tall stack of **fixed screens**. The camera doesn't scroll; it cuts instantly to whichever screen Pip is on (like *Jump King*).
- About **45 screens** in total.

### Surfaces & hazards
| Surface | Effect | Zone |
|---|---|---|
| Stone | Normal | Everywhere |
| Gear platforms | Rotate and move on a timer | Clocktower |
| Wind | Pushes you sideways mid-air (flags show direction and strength) | Windy Cliffs |
| Ice | You slide after landing | Ice Cavern |
| Snow | Charged jumps are 15% weaker | Ice Cavern |
| Crumbling ledges | Break 1 s after you land; respawn after 3 s | Several zones |
| Cloud platforms | Vanish 1 s after you land | Sky Ladder |
| Bouncy mushrooms | Launch you upward | Inside the Mountain |

### Saving
- **Continuous autosave**, including mid-air. There's one save slot and no manual saves, so you can't undo a fall. That's the whole tension of the game.
- Refreshing during a fall doesn't save you: you come back mid-fall, still falling.
- Closing the browser and coming back puts you exactly where you were.

### Chirp the sparrow
- Flies beside you and comments: *"Almost there!"*, *"That was close!"*, *"Don't look down."*
- **Chirp's tell:** when Chirp is sincere, it looks at Pip. When it's trolling, it looks **at the camera**, at you.

### Assist mode (optional)
- Plant up to **3 checkpoint flags per zone**.
- **Trajectory preview** while charging.
- Slower game speed (75%).
- Assist runs are marked, and don't count for speedrun times.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Lying Progress Bar** | The progress bar is accurate | It says 90% at the fake summit, then shows "99.9%" for the whole second half, until it says *"Progress bar broke. Sorry."* | The altitude in metres on the pause screen is always honest |
| **The Fake Summit** | A flag, fanfare and credits mean you won | Halfway through the credits the camera pans up, revealing more mountain, and your ledge crumbles | The credits list "Thanks for playing… *so far*" |
| **Chirp's Encouragement** | Chirp is cheering you on | Half the time it's trolling you | It looks at the camera when it's trolling |
| **The Express Elevator** | "Express to the Top!" | It goes **down** 2 screens | The arrow display flickers ▼ for a single frame |
| **The Summit Mirage** | That peak in the background is the goal | It's painted background scenery | It moves slower than the foreground when the camera cuts (parallax) |
| **Lying Signs** | "Last jump!" means the last jump | "Last jump!" signs come before hard sections; "This is the hard part" signs come before easy ones | — (learned quickly) |
| **The Joke Checkpoint** | A checkpoint flag! | It says *"Checkpoints are for quitters"* when you touch it (it costs you nothing) | It's slightly smaller than real flags |
| **So-Close Ledges** | That ledge is reachable | It's just above your maximum jump, and the real route is elsewhere | Worn footprints mark the real route |

### Tricks we will **not** do
- **Fake "save corrupted" / fake reset to the bottom.** Too cruel. Players would quit, not laugh.
- **Falls that can't be seen coming.** Every big fall must be the player's own mistake, never a hidden trap.

---

## 5. Levels & Progression

### Zones (bottom to top)
| # | Zone | Screens | What's new |
|---|---|---|---|
| 1 | **The Foothills** | 4 | Tutorial; small, safe falls |
| 2 | **Old Town Rooftops** | 5 | Gutters, chimneys, narrow ledges |
| 3 | **The Clocktower** | 6 | Moving gear platforms, timing |
| 4 | **Windy Cliffs** | 5 | Wind gusts, reading the flags |
| 5 | **Ice Cavern** | 5 | Ice and snow, precise landings |
| 6 | **The Summit** (fake) | 2 | Flag, fanfare, fake credits, collapse |
| 7 | **Inside the Mountain** | 7 | Dark tunnels, a lantern light radius, mushrooms |
| 8 | **Sky Ladder** | 7 | Tiny cloud platforms that vanish |
| 9 | **Almost There** | 4 | The final climb and the real summit |

### The fake summit sequence
1. Pip reaches a beautiful peak. A flag pole is waiting. Fanfare plays.
2. Pip plants the flag. *"THE END"* appears. The credits start scrolling.
3. Halfway through, the camera slowly pans **up**, revealing that the mountain keeps going into the clouds.
4. Text: *"…just kidding."* The ledge crumbles and Pip falls about 1.5 zones.
5. **But** the fall lands Pip next to a cave entrance that was hidden before: the way **inside** the mountain. The fake summit wasn't a dead end; it was the only way to open the real path. The troll is funny, not soul-crushing.

### The real summit
- Pip plants the flag. Chirp, quietly: *"We're… actually there."*
- Stats screen: *"You climbed 420 m. You fell 3,812 m."*
- **New Game+: "Mirror Mountain"**, the whole mountain flipped horizontally, and no Chirp to keep you company.

---

## 6. Features

### MVP (must-have)
- Charge-jump physics with wall bounces
- Zones 1–5 (25 screens)
- Continuous autosave (including mid-air), resume on reload
- Chirp with basic lines
- The lying progress bar + honest altitude in the pause menu
- Speedrun timer

### Full version
- All 9 zones (45 screens), the fake summit sequence, the real ending
- All surfaces (gears, wind, ice, snow, crumbling, clouds, mushrooms)
- Assist mode
- 12 collectible **Lost Feathers** (cosmetic hats for Pip)
- Achievements, New Game+

### Later
- Speedrun leaderboards (with replay verification, like TrapSprint)
- Ghost of your best run
- A "Fall Cam" that shows your biggest fall as a shareable replay

---

## 7. Scoring, Rewards & Replay Value

- **Stats:** total time, jumps, falls, **total metres fallen**, biggest single fall.
- **Speedrun:** in-game timer with zone splits.
- **Collectibles:** 12 Lost Feathers hidden in risky spots, each unlocking a hat for Pip.

### Achievements
| Achievement | How to get it |
|---|---|
| **Gravity Tourist** | Fall a total of 1 km |
| **Fooled Once** | Reach the fake summit |
| **Never Again** | Reach the real summit |
| **Clean Climb** | Reach the summit with fewer than 20 falls |
| **The Long Way Down** | Fall 4 or more screens in one go |
| **Feather Collector** | Find all 12 Lost Feathers |
| **Mirror Climber** | Finish Mirror Mountain |

---

## 8. Screens & UI

1. **Title:** Pip stands at the foot of the mountain. The summit is visible in the distance (it's the fake one).
2. **Climb view:** the current screen, full size. Minimal HUD:
   - The **progress bar** on the right edge (it lies)
   - Chirp's speech bubble when it talks
3. **Pause menu:** **honest altitude in metres**, time, falls, settings, assist mode toggle.
4. **Fake credits:** full credits, then the twist.
5. **Ending screen:** stats + share card.
6. **Settings:** volume, reduce motion, controls, assist options.

---

## 9. Art & Audio Direction

### Visuals
- Pixel art. Each screen is 384×216 logical pixels (scaled ×5 to fit 1080p) with an 8 px tile grid.
- Every zone has a strong mood, and the colours get colder and brighter as you climb:
  - Foothills: warm greens
  - Rooftops: orange evening light
  - Clocktower: brass and shadow
  - Cliffs: grey-blue wind
  - Ice: pale cyan
  - Inside the Mountain: dark, lantern-lit
  - Sky Ladder: pink and gold sunset clouds
  - Summit: clear, bright white
- **Readable landings:** ledges have clear, bright top edges so players can judge jumps.
- Pip's charge pose squashes lower with more charge (visual feedback).

### Audio
- **Charge sound:** a rising tone, so timing can be learned by ear.
- **Falling:** a whoosh that gets louder the longer you fall, then a thud and a little "oof".
- **Music:** calm and melancholy, a different instrument per zone. The music doesn't restart when you fall, which makes it quietly comforting.
- Chirp tweets in little babble sounds that match its speech bubble.

---

## 10. Fairness Rules

1. **Hitboxes match the art.** What you see is what you land on.
2. **Every required jump has a margin** of at least 4 px at the right charge level.
3. **Deterministic physics**, with no randomness in movement.
4. **Planned falls:** every ledge has a known fall destination. Big falls (more than one zone) are rare (at most 4 in the game) and marked with a warning sign.
5. **No fake progress deletion.** Ever.
6. **The pause-menu altitude is always honest.** Players always have a way to know the truth.

---

## 11. Accessibility & Comfort

- **Assist mode:** checkpoints, trajectory preview and slow motion.
- Remappable keys and full gamepad support.
- **Reduce motion:** no screen shake on landing; the fall whoosh effect is toned down.
- Charge feedback is visual (pose + meter) **and** audio (rising tone).
- **Mobile:** large buttons; optional vibration on landing (Android only; iPhone Safari doesn't support the Vibration API).
- Chirp's lines can be shown in a larger text size.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D pixel-art renderer:** integer scaling and `imageSmoothingEnabled = false`.
- **Physics:** custom charge-jump physics on top of the shared `engine/platformer` (tile collisions, slopes for the Ice Cavern, moving platforms for the gears). Fixed 60 Hz, deterministic.
- **World:** authored in **LDtk** using its *Linear Vertical* world layout. Each level in LDtk is one screen, and screens are stacked bottom to top.
- **Camera:** instant cut to the screen that contains Pip's centre.
- **Autosave (anti save-scum):** write Pip's position, **velocity**, screen and stats to localStorage through `engine/save` every 250 ms while moving, on every landing, and on `pagehide` / `visibilitychange`. Because velocity is saved and the physics is deterministic, a reload mid-air continues the same fall, so refreshing can't undo a mistake.
- **Cutscenes:** the fake summit and endings are scripted timelines (camera moves, text scroll, platform collapse) using a tiny timeline player.

### Data model
```ts
type ZoneId =
  | "foothills" | "rooftops" | "clocktower" | "cliffs" | "ice"
  | "fake-summit" | "inside" | "sky" | "summit";

interface ScreenDef {
  id: string;                 // "z3-s04"
  zone: ZoneId;
  index: number;              // 0 = bottom of the mountain
  tiles: Uint8Array;          // 48 × 27 tiles (8 px each)
  surfaces?: { rect: Rect; kind: "ice" | "snow" | "bouncy" | "crumble" | "cloud" }[];
  movers?: { rect: Rect; path: Vec2[]; periodMs: number }[];          // gear platforms
  wind?: { rect: Rect; force: Vec2; pattern: "constant" | "gusts" }[];
  signs?: { at: Vec2; text: string; honest: boolean }[];
  feathers?: Vec2[];
  bigFall?: boolean;          // marked with a warning sign
}

interface SaveData {
  version: 1;
  pos: Vec2;
  vel: Vec2;
  screenId: string;
  stats: { timeMs: number; jumps: number; falls: number; metresFallen: number };
  feathers: string[];
  flags: { fakeSummitSeen: boolean; finished: boolean };
  assist?: { checkpoints: Vec2[] };
}
```

### The lying progress bar
```ts
// The bar maps true height to a "felt" percentage that runs ahead of reality.
// Honest altitude is always available separately in the pause menu.
function displayedProgress(trueHeight: number, fakeSummitHeight: number, total: number) {
  if (trueHeight < fakeSummitHeight) return 0.9 * (trueHeight / fakeSummitHeight);
  return 0.999;   // "99.9%", until the very end
}
```

### Folder structure
```
src/games/almost-there/
  index.tsx
  physics/
    charge-jump.ts  surfaces.ts  wind.ts
  world/                      # LDtk JSON export + loader
  story/
    chirp-lines.ts  fake-summit.ts  ending.ts
  save/
    autosave.ts
  ui/
    Hud.tsx  PauseMenu.tsx  Credits.tsx  EndStats.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Level tuning takes a long time | Greybox the whole mountain first; playtest every zone before art |
| Too frustrating → players quit | Track where testers quit; limit big falls; assist mode |
| Charge jumps feel bad on touchscreens | Strong visual + audio charge feedback; tune button size; test on several phones |
| Save corruption | Versioned save format; validate on load; keep the previous save as a backup |

---

## 13. Build Roadmap

- [ ] **M1: Feel.** Charge-jump physics, wall bounces, screen camera, one test screen
- [ ] **M2: First half.** Zones 1–5 greyboxed, autosave, progress bar + pause altitude
- [ ] **M3: The twist.** Fake summit sequence, fake credits, Inside the Mountain
- [ ] **M4: Second half.** Sky Ladder, final zone, real ending, Chirp's full script
- [ ] **M5: Polish.** Final art, music per zone, assist mode, feathers, achievements, New Game+
- [ ] **Later:** leaderboards, ghosts, Fall Cam

---

## 14. Definition of Done

- The full climb is completable without assist mode, and every required jump has at least a 4 px margin.
- First-time playtesters reach the fake summit in roughly 45–60 minutes.
- Refreshing the page never loses position **and never undoes a fall** (tested by refreshing mid-jump and mid-fall: the fall continues after reload).
- The pause menu altitude is always accurate.
- Physics gives the same result at 60 Hz and 120 Hz.
- At least one playtester shouts at the screen during the fake credits. (Then laughs.)
