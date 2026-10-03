# TrapSprint

> **"Run fast. Die faster. Remember everything."**

| | |
|---|---|
| **Genre** | Troll platformer + speedrun |
| **Core mind trick** | Every level is a short sprint packed with hidden traps that fire exactly when you think you're safe. Memorise them, then speedrun them. |
| **Controls** | Keyboard / gamepad (desktop) · Touch buttons (mobile) |
| **Session length** | 30 seconds to 3 minutes per level · 30 levels + Remix mode |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/trapsprint` |
| **Code folder** | `src/games/trapsprint/` |

---

## 1. About the Game

### The pitch
Single-screen levels. Start on the left, door on the right. Looks easy. **It isn't.**

Spikes pop out of the floor. The ground drops away. The ceiling falls. The door runs off. A saw flies in from nowhere. You'll die a lot, but respawning is instant and every death teaches you something.

Then the real game begins. Once you know a level's traps, you can **sprint** through it: dodge everything in one smooth run, chase medal times, and race the ghost of your best run. Your death counter becomes a trophy.

### How it messes with your mind
- **Expectation violation = laughter.** A sudden surprise that turns out harmless (you respawn instantly) is the core of physical comedy. Players laugh at their deaths.
- **"One more try."** Instant respawn + short levels + visible progress keeps people hooked.
- **From victim to master.** The same level that killed you 30 times becomes a 6-second speedrun. That change feels amazing.
- **Learned paranoia.** After a few levels, players start fearing *everything*, including harmless objects. The game uses that against them with fake traps.

### Inspirations
*Level Devil*, *Syobon Action* (Cat Mario), *Trap Adventure 2* and *I Wanna Be The Guy* (troll platformers), *Super Meat Boy* (instant respawn and the replay of every attempt), *Celeste* (tight controls and assist mode).

---

## 2. How to Play

### Goal
Reach the door. Then reach it faster.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Move | `←` `→` / `A` `D` / left stick / D-pad | ◀ ▶ buttons (bottom-left) |
| Jump (hold for higher) | `Space` / `↑` / `W` / gamepad A | Jump button (bottom-right) |
| Quick restart | `R` / gamepad Y | ⟳ button |
| Pause | `Esc` / Start | ⏸ button |

### The core loop
1. **Run** into the level.
2. **Die** to a surprise trap (respawn in under 0.3 s).
3. **Remember** the trap and try again.
4. **Clear** the level → see your time, deaths and medal.
5. **Sprint** it again for a better medal, racing your ghost.

---

## 3. Game Mechanics

### Movement (must feel perfect)
- Quick acceleration, a high top speed and responsive turning.
- **Variable jump height:** release jump early to cut the jump short.
- **Coyote time** 80 ms, **jump buffer** 100 ms.
- No double jump and no wall jump. Simple controls mean players blame the trap, not the controls.
- Fixed 60 Hz physics, so every run plays out exactly the same way.

### Traps
Each trap has a **trigger** (when it fires) and an **action** (what it does). Everything is deterministic, with no randomness, so memorisation always works.

| # | Trap | Trigger | What it does | The tell |
|---|---|---|---|---|
| 1 | **Pop Spikes** | You're above them | Spikes shoot up from the floor | Tiny holes in the floor tile |
| 2 | **Drop Floor** | You step on it | The floor segment falls away | A hairline seam |
| 3 | **Ceiling Crusher** | You're underneath | The ceiling slams down | Dust trickling from cracks |
| 4 | **Runaway Door** | You get close | The door slides away | The door has tiny wheels |
| 5 | **Fake Door** | You touch it | It's painted on; the real door appears elsewhere | No shadow under the frame |
| 6 | **Saw Launcher** | You enter a zone | A saw flies across | A slot in the wall + a "shing" sound 0.4 s before |
| 7 | **Jump Punisher** | You jump inside a zone | Spikes appear above | Suspicious ceiling tiles |
| 8 | **Invisible Block** | Always there | You bonk your head mid-jump | A faint sparkle every 3 s |
| 9 | **Falling Stalactite** | You walk below | It drops | It wobbles first |
| 10 | **Wall Squeeze** | You enter a zone | Walls close in from both sides | Rails on the floor |
| 11 | **Fake Checkpoint** | You touch the flag | It's a spring that launches you into spikes | The flag doesn't wave |
| 12 | **Coin Bait** | You grab the coin | Spikes appear around it | The coin spins backwards |
| 13 | **Conveyor Flip** | You're halfway across | The conveyor reverses | Its arrow lights flicker |
| 14 | **Fake Spikes** | — | Painted spikes, totally harmless (fear is the trap) | Flat, no shine |
| 15 | **Sideways Spring** | You land on it | Launches you sideways instead of up | Its base is tilted |
| 16 | **Return Trap** | You walk back over it | Fires only on the way back | A small clock engraving |
| 17 | **Second-Try Trap** | After your first death | The trap moves (max 1 per zone) | The level name ends with "?" |
| 18 | **"Level Complete!" Banner** | You reach the door | The victory banner drops on your head | You can see the banner's rope |
| 19 | **Rising Floor** | You stand still too long | The floor rises and squashes you against the ceiling | Visible pistons |
| 20 | **The Follower** | Level start | A spike ball follows your exact path, 2 seconds behind | It's visible from the start, asleep |

### Death & respawn
- Respawn in under **300 ms** at the level start. There are no lives and no game over.
- The death counter goes up with a satisfying *tick*.
- **Death markers:** small skulls show where you died before (can be turned off).

### Speedrunning
- The timer starts on your first input and stops when you touch the door.
- **Medals:** Bronze / Silver / Gold / **Dev** (the designer's best time).
- **Ghost:** a see-through replay of your personal best runs alongside you.

---

## 4. Mind Tricks Catalogue

The traps above are the main tricks. These are the bigger mind games built on top of them:

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Calm Start** | Level 1 is a tutorial | Level 1 has 3 traps in 6 seconds | — (sets the tone immediately) |
| **Fear Itself** | Spikes are deadly | Some are painted and harmless; the "safe" path around them is the trap | Flat, matte spikes |
| **Safe Spot** | Checkpoints mean safety | The flag is a spring trap | It doesn't wave |
| **Victory Lap** | Touching the door = win | The "Level Complete!" banner falls on you | The banner rope is visible |
| **Learned It? Moved It.** | Memorisation always works | One trap per zone moves after your first death | A "?" after the level name |
| **Remix** | You know these levels | Remix mode mirrors the levels and shuffles the traps | "REMIX" stamp on the level select |
| **Your Own Ghost** | The ghost is just a replay | In one level, your ghost *is* the trap (it carries a spike ball along your old path) | The ghost is red instead of white |

---

## 5. Levels & Progression

### Zones
| Zone | Name | Levels | New ideas |
|---|---|---|---|
| 1 | **Green Lies** (grassland) | 10 | Pop spikes, drop floors, runaway door, fake door, invisible blocks |
| 2 | **Factory of Fails** | 10 | Conveyors, crushers, saws, wall squeezes, rising floors |
| 3 | **Castle Gotcha** | 10 | Trap chains, the Follower, fake checkpoints, door chases, everything combined |
| R | **Remix** | 30 | Every level mirrored with traps shuffled (unlocks after Zone 3) |

### Example: Level 1-1, "Welcome"
1. **Try 1:** walk right. Halfway across, **pop spikes**. Dead.
2. **Try 2:** jump over the spike spot. Land. Approach the door… it **rolls away** to the right. Chase it. A **drop floor** opens under you. Dead.
3. **Try 3:** jump the spikes, jump over the drop floor's seam, follow the door to the wall. **Clear!**

Once you know it, it takes **about 6 seconds**. Gold medal: 5.5 s.

### Difficulty rules
- Each new level adds **no more than 2 new trap ideas**.
- When you know a level, a run takes **15 seconds or less**.
- Learning any single trap shouldn't take more than about 3 deaths.

---

## 6. Features

### MVP (must-have)
- Tight platformer controls (this builds the shared `engine/platformer`)
- 12 trap types, data-driven
- Zone 1 (10 levels)
- Instant respawn, death counter, level timer
- Medals and saved personal bests
- Mobile touch controls

### Full version
- All 20 traps, Zones 2–3 (30 levels in total)
- **Ghost of your best run**
- **All-Deaths Replay:** at the end of a level, every one of your attempts replays at once, a crowd of little runners dying in all the ways you did (inspired by *Super Meat Boy*)
- Death markers
- Remix mode
- Achievements

### Later
- **Global leaderboards** with replay verification (see the Technical Plan)
- **Level editor** with share codes, plus community levels
- **Global death heatmap:** see where *everyone* dies on each level

---

## 7. Scoring, Rewards & Replay Value

- **Per level:** best time, medal, total deaths.
- **Share card:** *"TrapSprint 2-07 — 41 deaths, 8.31 s 🥇"*
- **Zone speedrun:** play all 10 levels of a zone in a row with splits.

### Achievements
| Achievement | How to get it |
|---|---|
| **Fresh Meat** | Die 10 times |
| **Collector** | Die to every trap type |
| **Read the Room** | Clear a level on your first try |
| **Speed Demon** | Beat a Dev time |
| **Untouchable** | Clear a whole zone in speedrun mode without dying |
| **Paranoid** | Jump over a fake spike 20 times |
| **1,000 Ways** | Die 1,000 times in total |

---

## 8. Screens & UI

1. **Title:** the "Start" text falls off the screen when you hover over it (a mini trap). Press any key to start anyway.
2. **Level select:** a grid of levels per zone with medal icons and best times.
3. **Level HUD:** timer (top centre), death counter (top right), level name (top left). Nothing else.
4. **Level complete:** time, medal, deaths, buttons for "Next", "Retry" and "Watch all deaths".
5. **All-Deaths Replay:** fun and shareable, skippable at any time.
6. **Pause / settings:** volume, death markers on/off, ghost on/off, assist options, controls.

---

## 9. Art & Audio Direction

### Visuals
- **Bright, cheerful and deceptive.** Candy-coloured pixel art that looks friendly and safe. The contrast with the brutal traps is the joke.
- Traps spring out with snappy, exaggerated animations.
- Deaths are cartoony: a squish, a puff of smoke, a little ghost floating away. Never gory.
- Each zone has its own palette: grassy greens, factory orange and grey, castle purple and stone.

### Audio
- Upbeat chiptune music that keeps playing across deaths (it never restarts, so the rhythm keeps you going).
- Comedic death sounds: *bonk*, *splat*, *boing*.
- Every trap has a clear sound cue. Saws "shing" before they enter the screen.
- The music speeds up slightly in speedrun mode.

---

## 10. Fairness Rules

1. **Controls first.** Movement must feel tight and responsive before any trap is built.
2. **Every trap has a tell**, listed in the trap table and checked in level reviews.
3. **Deterministic.** The same inputs always give the same result.
4. **Short levels** (15 s or less when known) and **instant respawn**.
5. **No surprise off-screen hits without warning.** Anything entering from off-screen has a sound cue at least 0.4 s before.
6. **Second-Try Traps are rare** (max 1 per zone) and always marked with "?".
7. **Hitboxes are slightly forgiving:** trap hitboxes are a little smaller than their sprites.

---

## 11. Accessibility & Comfort

- **Remappable keys** and full gamepad support.
- **Assist mode** (medals are disabled while it's on):
  - Slow motion (50% / 75%)
  - "Reveal traps": after 10 deaths in a level, trap triggers show as faint outlines
  - Invincibility
- **Reduce motion:** no screen shake on death.
- **Colourblind palette:** traps are readable by shape, not colour.
- Big mobile buttons with adjustable size and position.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** using the shared `engine/platformer`. TrapSprint is the first game to use it, so it **builds** the kit: movement, tile collisions, camera, fixed-timestep loop.
- **Fixed 60 Hz simulation** with an accumulator, so physics is identical on 60 Hz and 120 Hz screens.
- **No `Math.random` in the simulation**, so runs are fully deterministic.
- **Trap system:** each trap is a small state machine (`idle → armed → firing → done`) driven by its trigger.
- **Input recording:** each frame's input is stored as a small bitmask (left / right / jump), run-length encoded. This one recording powers:
  - the **ghost** (replay your best run)
  - the **All-Deaths Replay** (simulate every attempt in parallel at the end of the level, which is cheap for small levels)
  - future **leaderboard verification**
- **Level authoring:** LDtk (a free 2D level editor), with traps as entities with fields, exported as JSON.

### Leaderboards (later)
- A Route Handler, e.g. `src/app/api/trapsprint/scores/route.ts`, receives a run's **input recording**, not just a time.
- The server **re-runs the same TypeScript simulation** to confirm the time. This is very hard to cheat, and it's possible because the engine is pure and deterministic.

### Data model
```ts
interface Rect { x: number; y: number; w: number; h: number }

type TrapTrigger =
  | { type: "enterZone"; zone: Rect }
  | { type: "jumpInZone"; zone: Rect }
  | { type: "landOn"; zone: Rect }
  | { type: "proximity"; radius: number }
  | { type: "afterTrap"; trapId: string; delayMs: number }
  | { type: "deathCount"; atLeast: number }
  | { type: "returnTrip"; zone: Rect }
  | { type: "always" };

type TrapKind =
  | "popSpikes" | "dropFloor" | "crusher" | "runawayDoor" | "fakeDoor"
  | "saw" | "jumpPunisher" | "invisibleBlock" | "stalactite" | "wallSqueeze"
  | "fakeCheckpoint" | "coinBait" | "conveyorFlip" | "fakeSpikes"
  | "sidewaysSpring" | "returnTrap" | "secondTry" | "victoryBanner"
  | "risingFloor" | "follower";

interface TrapDef {
  id: string;
  kind: TrapKind;
  rect: Rect;
  trigger: TrapTrigger;
  params?: { speed?: number; delayMs?: number; distance?: number };
  tell: string;              // design note describing the tell (checked in reviews)
}

interface LevelDef {
  id: string;                // "1-01"
  name: string;              // "Welcome"
  zone: 1 | 2 | 3;
  tiles: number[][];         // or a reference to an LDtk layer
  spawn: { x: number; y: number };
  door: { x: number; y: number };
  traps: TrapDef[];
  medals: { gold: number; silver: number; bronze: number; dev: number };  // ms
}

// Input recording: one byte per frame, run-length encoded
// bit 0 = left, bit 1 = right, bit 2 = jump
type InputLog = Array<[bits: number, frames: number]>;
```

### Folder structure
```
src/games/trapsprint/
  index.tsx
  traps/
    registry.ts              # kind → behaviour
    pop-spikes.ts  drop-floor.ts  …  follower.ts
  replay/
    recorder.ts  ghost.ts  all-deaths.ts
  levels/                    # LDtk JSON exports
  ui/
    Hud.tsx  LevelSelect.tsx  LevelComplete.tsx  TouchControls.tsx
src/engine/platformer/       # built here, shared with other games
```

### Technical risks
| Risk | Plan |
|---|---|
| Controls don't feel good | Prototype movement first; playtest before building traps |
| Physics differs between frame rates | Fixed timestep with an accumulator; tests that replay recorded inputs |
| Virtual buttons feel bad on mobile | Large, adjustable buttons; test on several phones |

---

## 13. Build Roadmap

- [ ] **M1: Platformer kit.** Movement, tile collisions, camera, fixed timestep, 3 test levels
- [ ] **M2: Traps + Zone 1.** Trap system, the first 12 traps, 10 levels
- [ ] **M3: Replays.** Input recording, ghost, All-Deaths Replay, timers, medals
- [ ] **M4: Zones 2–3.** Remaining traps, 20 more levels
- [ ] **M5: Polish.** Remix mode, achievements, touch controls tuning, assist mode
- [ ] **Later:** leaderboards with server verification, level editor, death heatmap

---

## 14. Definition of Done

- 30 levels, each clearable in 15 seconds or less once known.
- Every trap has a documented tell.
- A recorded input log always replays to the exact same result (unit tested).
- The game plays identically at 60 Hz and 120 Hz.
- Respawn takes under 300 ms.
- Touch controls are good enough that a tester can earn a gold medal on Level 1-1 on a phone.
- Progress, medals and ghosts survive page reloads.
