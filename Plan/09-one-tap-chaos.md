# One Tap Chaos

> **"One button. Infinite ways to mess it up."**

| | |
|---|---|
| **Genre** | One-button microgame gauntlet |
| **Core mind trick** | Every microgame uses the same single tap, but what the tap does, and whether you should tap at all, keeps changing |
| **Controls** | One input: `Space` / click / tap anywhere |
| **Session length** | 1–5 minute runs |
| **Platforms** | Desktop & mobile browsers (mobile-first) |
| **Route** | `/games/one-tap-chaos` |
| **Code folder** | `src/games/one-tap-chaos/` |

---

## 1. About the Game

### The pitch
Tiny games flash by, each lasting **3 to 5 seconds**. *"JUMP!" "CATCH!" "STOP!" "DON'T!" "WAIT…"* You only ever have **one** input: a tap. The pace speeds up to the beat of the music. Every few rounds, a **Chaos Card** flips over and adds a new rule:

- *"Opposite Day"*: do the opposite of what it says.
- *"Red Means No"*: ignore any instruction shown in red.
- *"Simon Says"*: only obey instructions with a crown.
- *"Lag"*: your taps land half a beat late.

Your brain knows what to do. Your thumb does something else. You have 4 lives. How far can you get?

### How it messes with your mind
This game is basically a set of famous psychology experiments wearing a party hat:
- **Go / No-Go tasks.** Stopping yourself from tapping is surprisingly hard, especially when you've been tapping all along.
- **The Stroop effect.** A red word saying "TAP" when red means "don't" makes your brain argue with itself.
- **Task-switching cost.** Every time the rule changes, your brain slows down for a moment. At high speed, that moment is everything.
- **Rhythm and flow.** The beat pulls you into a flow state… which makes the sudden "DON'T!" even harder to resist.

### Inspirations
*WarioWare* (microgames), *Rhythm Heaven* (one-button rhythm), *Flappy Bird* (one-tap simplicity), the childhood game *Simon Says*.

---

## 2. How to Play

### Goal
Clear as many microgames in a row as you can before losing all 4 lives.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| **Tap** (the only game input) | `Space`, `Enter`, mouse click, gamepad A | Tap anywhere on the screen |
| Pause | `Esc` / `P` | ⏸ button (top corner, outside the tap area) |

> That's it. One button. Everything else is in your head.

### The core loop
1. **Instruction flashes** ("JUMP!") along with the scene.
2. **Tap (or don't)** within the 3–5 second window.
3. **Result:** ✅ or 💥 (−1 life).
4. **Next microgame**, slightly faster.
5. Every 5 microgames → **speed up**. Every 5 games from #6 → **a new Chaos Card**. Every 10 games → **Boss**.
6. Out of lives → score screen → instant retry.

---

## 3. Game Mechanics

### Tempo
Everything is tied to the music's beats per minute (BPM). Each microgame lasts **8 beats**.

| Speed tier | BPM | One microgame lasts |
|---|---|---|
| 1 | 100 | 4.8 s |
| 2 | 115 | 4.2 s |
| 3 | 130 | 3.7 s |
| 4 | 145 | 3.3 s |
| 5+ | 160 | 3.0 s |

Between microgames there's a 4-beat break showing the result and your lives.

### Lives
**4 lives**, shown as 4 light bulbs. Lose a microgame and a bulb smashes.

### Microgames (24 at launch)
| # | Instruction | What's happening | How to win |
|---|---|---|---|
| 1 | **JUMP!** | A runner heads toward a cactus | Tap at the right moment to jump it |
| 2 | **CATCH!** | An egg falls; a basket slides back and forth | Tap to stop the basket under the egg |
| 3 | **STOP!** | A needle spins around a dial | Tap when it's in the green zone |
| 4 | **DON'T!** | A big red button, with a fly walking on it | Don't tap at all |
| 5 | **SHOOT!** | A target slides across | Tap when it's in the crosshair |
| 6 | **PUMP!** | A balloon and a line | Tap repeatedly to inflate it to the line, but don't pop it |
| 7 | **FLIP!** | A pancake browns in a pan | Tap when it's golden, not burnt |
| 8 | **WAIT…** | A traffic light | Tap only after it turns green (tapping early = fail) |
| 9 | **COUNT!** | Sheep jump over a fence | Tap exactly once per sheep |
| 10 | **DODGE!** | A car with obstacles coming | Tap to switch lanes in time |
| 11 | **BEAT!** | A drum | Tap on the 4 beats |
| 12 | **CUT!** | A sandbag swings on a rope above a sneaking cartoon villain | Tap to cut the rope when it's right above him |
| 13 | **SNAP!** | A group photo | Tap when everyone is smiling |
| 14 | **KICK!** | A penalty kick | Tap when the goalkeeper dives the wrong way |
| 15 | **HIGH FIVE!** | Two hands swing toward each other | Tap when they meet |
| 16 | **SLEEP!** | A baby sleeping; an alarm clock starts ringing | Don't tap, even when the alarm rings |
| 17 | **BIGGER!** | Two numbers take turns lighting up | Tap when the bigger number is lit |
| 18 | **MATCH!** | A shape cycles through shapes | Tap when it matches the target shape |
| 19 | **STACK!** | A block slides back and forth above a tower | Tap to drop it onto the tower |
| 20 | **LAND!** | A rocket falls toward a pad | Tap for thruster bursts to land softly |
| 21 | **FREEZE!** | You sneak behind a guard | Tap to freeze whenever he turns around |
| 22 | **SWAT!** | A mosquito buzzes around | Tap when it lands and stays still |
| 23 | **LOADING…** | A loading bar that "needs a tap to skip" | **Don't tap.** On the very last beat the text turns into "…DON'T." |
| 24 | **???** | One of the other microgames, with the instruction hidden | Figure it out from the scene |

### Chaos Cards (rules)
From microgame #6, a Chaos Card flips over every 5 games and adds a rule for the next 5 games. **Up to 2 rules can be active at once.**

| Card | Rule | How it works |
|---|---|---|
| **Opposite Day** | Do the opposite | Only "binary" microgames appear (DON'T, WAIT, SLEEP, SHOOT…), each in an inverted version that makes sense: *"DON'T!"* now means tap |
| **Red Means No** | Ignore red instructions | Instructions in red (always with a striped ✖ pattern) mean: don't tap at all |
| **Simon Says** | Only obey the crown | Instructions with a 👑 are real; without the crown, don't tap |
| **Lag** | Your taps are late | Every tap registers half a beat later. Tap early! |
| **Double Tap** | Two taps needed | Every action needs two quick taps (within 250 ms) |
| **Silent** | No words | Instructions are hidden. You get a sound cue and an icon only |
| **Mirror** | Everything is flipped | The screen is mirrored left to right, text included |
| **Lights Out** | Darkness | The screen goes dark on beats 3 and 6 of each microgame |

### Boss microgames
Every 10 microgames: a **Boss**, 16 beats long, in several phases.
- **The Chaos Conductor:** an orchestra conductor fires 8 rapid commands at you, switching rules mid-way.
- **The Liar:** a host gives instructions, but only half of them come with the crown.
- **The Final Tap:** a single huge button and a 16-beat countdown. The instruction changes on every beat. Tap only on the beat where it says "NOW".

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **Rhythm Trap** | The beat says tap | "DON'T!" lands right on the beat you were about to tap | The instruction is always on screen. Read before you tap |
| **Stroop Text** | Read the word | The colour matters more than the word (Red Means No) | Red always comes with a striped ✖ pattern |
| **Missing Crown** | All instructions count | Without the crown, it's a trap (Simon Says) | The crown slot is shown empty |
| **The Loading Bar** | "Tap to skip" means tap | It's a microgame, and the answer is not to tap | Its instruction appears in the microgame's font, not the UI font |
| **Late Hands** | Taps happen instantly | Under Lag, your tap lands half a beat later | A small "⏱ +½" HUD icon |
| **The Fly** | Don't tap the button | A fly lands on it, and you *really* want to swat it | — (pure temptation) |
| **Blank Instruction** | No instruction = free round | You still have to do the right thing (???) | The scene always shows what to do |

---

## 5. Levels & Progression

### A run
- **Microgames 1–5:** tier 1, no rules. Warm-up.
- **#6:** first Chaos Card.
- **#10:** first Boss.
- **#11+:** more rules, faster tiers, new microgames mixed in.
- The run goes on until you run out of lives (there's no end).

### Unlocks
- You start with 12 microgames. More unlock as your best score grows (at 10, 20, 30, 40 and 50).
- Chaos Cards unlock in order as you first reach them.
- **Practice room:** play any unlocked microgame or Chaos Card on its own.

### Daily Chaos
A seeded daily run: the same microgames and rules, in the same order, for everyone that day.

---

## 6. Features

### MVP (must-have)
- The microgame framework + 12 microgames
- Tempo system (speed tiers tied to BPM)
- 4 lives, scoring, high score
- 3 Chaos Cards (Opposite Day, Red Means No, Simon Says)
- An input calibration screen
- Mobile-first full-screen tap

### Full version
- 24 microgames + 3 bosses
- All 8 Chaos Cards
- Daily Chaos with share card
- Practice room, unlocks, achievements

### Later
- More microgame packs
- **Versus mode:** two players on one keyboard or phone (left half vs. right half)
- Cosmetic host skins

---

## 7. Scoring, Rewards & Replay Value

### Score
- **1 point per microgame cleared.**
- **Chaos bonus:** +1 extra for each game cleared with 2 active rules.
- **Boss bonus:** +5.

### Share card
```
ONE TAP CHAOS · Daily #88
Score 37 🔥 · Bosses beaten: 3
Died to: "DON'T!" (of course)
```

### Achievements
| Achievement | How to get it |
|---|---|
| **Self Control** | Pass 10 "don't tap" microgames in a row |
| **Simon Who?** | Clear 5 games in a row under Simon Says |
| **Double Trouble** | Clear 5 games with 2 active rules |
| **Conductor** | Beat The Chaos Conductor |
| **Fifty** | Score 50 |
| **Couldn't Resist** | Swat the fly on the red button 5 times |

---

## 8. Screens & UI

1. **Title:** one huge button: **TAP**. (Tapping it starts the game. No tricks on the title, which is itself a surprise.)
2. **Calibration** (first launch, and in settings): tap along to a beat to measure your device's input and audio delay.
3. **Microgame screen:**
   - The big instruction at the top
   - The scene in the middle
   - Beat dots at the bottom (8 dots, filling one per beat)
   - Active Chaos Card icons in a corner
   - Lives (bulbs) and score
4. **Chaos Card reveal:** a card flips with a fanfare and stays on screen for at least 2 beats.
5. **Game over:** score, best, cause of death, retry (one tap).
6. **Practice room / unlocks.**
7. **Settings:** volume, calibration, reduced speed, visual beat, reduce flashing.

---

## 9. Art & Audio Direction

### Visuals
- Bold, simple, flat vector shapes with thick outlines. They need to be readable in a split second.
- Each microgame has a strong, single-colour background so the scene changes are instantly clear.
- Instructions use big, chunky, slightly tilted text that bounces in on the beat.
- **Red is only ever used for Red Means No**, and always with a striped ✖ pattern, never as decoration.
- A smug little host character (a metronome with a face) appears between games.

### Audio
- **The music is the clock.** A catchy, looping track per speed tier, crossfading smoothly between tiers.
- Every microgame has a short sound signature (*boing*, *crack*, *splat*).
- The success sound rises in pitch with your streak.
- The fail sound is a comedic record scratch.

---

## 10. Fairness Rules

1. **Calibration** for input and audio delay (Bluetooth headphones can add a lot of delay).
2. **Generous timing windows:** ±120 ms at the start, never tighter than ±60 ms at top speed.
3. **Active rules are always visible** as big HUD icons.
4. **Rules are announced** with a Chaos Card shown for at least 2 beats.
5. **Never colour alone.** Red always has a ✖ pattern; Simon Says uses a crown icon.
6. **The whole screen is the tap area** on mobile, except a small pause button area.
7. **Pausing stops the music clock.** Resuming gives a 3-beat count-in.
8. **Contradictions are impossible:** a rule-compatibility table and automated tests make sure two active rules can't make a microgame unwinnable.

---

## 11. Accessibility & Comfort

- **One-switch friendly by design.** The whole game uses a single input, which makes it playable with accessibility switches.
- **Reduced speed mode:** the tempo is capped at 120 BPM.
- **Hold mode for PUMP!:** hold to inflate instead of tapping quickly.
- **Visual beat:** a pulsing ring for deaf and hard-of-hearing players.
- **Captions** for the Silent Chaos Card's sound cues.
- **Reduce flashing:** Lights Out becomes a dim instead of black; no strobing effects.
- Colourblind-safe (patterns and icons alongside colour).

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** for microgames, each drawing into a fixed 16:9 virtual canvas that scales to fit.
- **React** for menus, the HUD overlay and Chaos Card reveals.
- **The audio clock is the master clock.** `AudioContext.currentTime` from the Web Audio API drives the beat, not `requestAnimationFrame` timestamps, because audio time is far more accurate. Beats are scheduled slightly ahead (the "lookahead scheduler" pattern, about 100 ms), and visuals interpolate from audio time.
- **Input:** `pointerdown` (not `click`, which is slower) + `keydown`, using each event's `timeStamp`, converted into audio time, minus the calibration offset.
- On mobile: `touch-action: none` on the game area, so taps never zoom or scroll.

### Microgame framework
```ts
interface MicrogameContext {
  bpm: number;
  beats: number;                 // usually 8
  rng: () => number;             // seeded, from engine/rng
  difficulty: number;            // 0..1, grows during a run
}

interface MicrogameInstance {
  onTap(beatTime: number): void;
  update(dt: number, beatTime: number): void;
  render(g: CanvasRenderingContext2D): void;
  result(): "win" | "lose" | "pending";   // judged at the end of the last beat
}

interface Microgame {
  id: string;                    // "jump"
  instruction: string;           // "JUMP!"
  invertible: boolean;           // can it appear under Opposite Day?
  create(ctx: MicrogameContext): MicrogameInstance;
}
```

### Chaos rules as wrappers
Each rule wraps a microgame instance and changes how it reads taps, judges the result, or renders. That means rules can be combined without rewriting any microgame.
```ts
interface ChaosRule {
  id: "opposite" | "redMeansNo" | "simonSays" | "lag" | "doubleTap" | "silent" | "mirror" | "lightsOut";
  appliesTo(game: Microgame): boolean;      // e.g. Opposite Day → only invertible games
  wrap(instance: MicrogameInstance, ctx: MicrogameContext): MicrogameInstance;
}
```

### Testing
- **Bots:** every microgame has a tiny auto-player that knows the right moment to tap. Automated tests run every microgame under every allowed rule combination, at top speed, and check that it's winnable.
- **Daily seed** tests check that the same date always gives the same run.

### Folder structure (as built)
```
src/games/one-tap-chaos/
  index.tsx              # screens: title → calibration (first time) → play → game over; practice room, demo
  save.ts achievements.ts sfx.ts music.ts otc.module.css
  core/
    timing.ts            # tiers, beats per segment, timing windows, Lag and Double Tap constants
    clock.ts             # maps the audio clock onto the performance clock (getOutputTimestamp)
    session.ts           # the live game: timeline of segments, input, rounds, drawing, music scheduling, HUD state
    run.ts               # the run planner (tiers, cards, bosses, picks), scoring, lives
    practice.ts          # the practice room's planner
    daily.ts             # Daily Chaos seed and number, share card
    progress.ts          # what a round or run changes in the save, and which achievements it earns
    calibration.ts       # tap-along offset measurement
    store.ts             # tiny external store for the React HUD
  microgames/
    types.ts kit.ts index.ts                      # the contract, shared helpers, registry + unlocks
    jump.ts catch.ts stop.ts dont.ts … loading.ts  # 23 scenes (??? is defined in index.ts)
    bosses/ commands.ts conductor.ts liar.ts final-tap.ts
    microgames.test.ts                            # bots win everything, at every tempo and rule combination
  rules/
    index.ts             # the 8 cards, which microgames each allows, the clash table
    round.ts             # a round = a scene wrapped in its rules (Lag, Double Tap, traps)
  bots/harness.ts        # turns a bot's moments into presses under the rules, and plays a round
  render/ draw.ts lobby.ts                         # the art kit, the between-rounds background
  ui/ Play.tsx Title.tsx Calibration.tsx GameOver.tsx Practice.tsx Menus.tsx Metro.tsx icons.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Timing accuracy differs across devices (especially Bluetooth audio) | Calibration screen; audio clock as the master; generous windows |
| 24 microgames is a lot of content | Simple bold shapes; a shared art kit; reuse animations |
| Rule combinations break microgames | Compatibility table + bot tests for every combination |

---

## 13. Build Roadmap

- [x] **M1: Engine.** Audio clock, beat scheduler, tap timing, calibration, the first 4 microgames
- [x] **M2: The run.** Lives, tiers, score, game over, 12 microgames
- [x] **M3: Chaos.** Rule wrappers, the first 3 Chaos Cards, compatibility table, bots
- [x] **M4: Full content.** 24 microgames, all 8 cards, 3 bosses, Daily Chaos
- [x] **M5: Polish.** Practice room, unlocks, achievements, accessibility options (plus a demo mode)
- [ ] **Later:** versus mode, more microgame packs, cosmetic host skins

---

## 14. Definition of Done

- Every microgame is winnable by its bot at top speed under every allowed rule combination.
- After calibration, measured tap timing error stays under 30 ms on test devices.
- No rule combination can make a microgame impossible (tested).
- The whole game works with a single input device (keyboard only, mouse only, touch only, switch).
- 60 fps on a mid-range phone.
- The daily seed gives an identical run on every device.

---

## 15. As Built

One Tap Chaos is playable at `/games/one-tap-chaos/play`: all 24 microgames, all 8 Chaos Cards, the 3 bosses, Daily Chaos with a share card, the practice room, unlocks, the 6 achievements, calibration and every comfort option in §11. Everything (art, music, sound) is generated in code; there are no asset files.

### The microgames

| Instruction | What to do | Opposite Day | Unlocks at |
|---|---|---|---|
| JUMP! | Tap to jump the cactus (two later on) | — | start |
| CATCH! | Tap to stop the basket under the falling egg | — | start |
| STOP! | Tap when the needle is in the green zone (marked with a ★) | — | start |
| DON'T! | Don't tap the big blue TAP button, even with a fly on it | tap it | start |
| SHOOT! | Tap when the target crosses the crosshair | hold your fire | start |
| PUMP! | Tap up to the dashed ring, without popping it (hold mode available) | — | start |
| FLIP! | Tap when the pancake is golden (it sparkles), not raw or burnt | — | start |
| WAIT… | Tap only after the crossing signal shows GO | tap before it does | start |
| HIGH FIVE! | Tap when the hands really meet; near misses don't count | leave him hanging | start |
| SLEEP! | Don't tap, even when the alarm rings | tap to switch it off | start |
| STACK! | Tap to drop the block on the tower (two blocks later on) | — | start |
| BIGGER! | Tap while the bigger number is lit (later: negatives, decimals, the smaller one written bigger) | — | start |
| COUNT! | Tap once per sheep; later a sheep balks at the fence | — | 10 |
| DODGE! | Tap to switch lanes before each cone | — | 10 |
| LOADING… | Don't tap "Tap to skip"; on the last beat it says …DON'T. | skip it | 10 |
| BEAT! | The sticks count 1-2-3, then tap the next 4 beats (later with off-beats) | — | 20 |
| MATCH! | Tap when the big shape matches the framed one (colour doesn't count) | — | 20 |
| SWAT! | Tap when the mosquito lands and its wings stop | let it live | 20 |
| SNAP! | Tap when everyone in the photo is smiling | — | 30 |
| CUT! | Tap to cut the rope so the sandbag lands on the villain | — | 30 |
| KICK! | Tap when the keeper dives away from your arrow | — | 40 |
| LAND! | Tap thruster bursts to touch down slowly (the speed gauge shows safe) | — | 40 |
| FREEZE! | Tap to freeze when the guard turns (each tap holds you still a moment) | — | 50 |
| ??? | One of 12 microgames whose scene needs no words, unnamed | — | 50 |

### Differences from the draft

- **Clocks.** The timeline lives on the performance clock (what input events and frames are stamped with). The audio clock is mapped onto it continuously with `getOutputTimestamp()`, and every note is scheduled about 250 ms ahead on the audio clock to be heard exactly on its beat. Same accuracy as "audio is the master", without the game freezing if audio stalls.
- **One calibration number.** The calibrated offset delays both what you see and how taps are judged. That keeps picture, sound and thumb together even when the browser doesn't know about Bluetooth delay. It lives in the arcade's global settings (`tapOffsetMs`, settings v2) and can be nudged ±10 ms in Options.
- **Scenes are a 1000 × 1000 square** that extends to every edge of the screen, instead of a 16:9 canvas, so portrait phones get a full-width scene. The square can reach a little under the beat dots.
- **Red is only for Red Means No.** DON'T!'s button is the cover's blue TAP button; WAIT…'s stop light is the orange pedestrian hand.
- **Fairness built into the scenes.** Each scene sizes its target from the timing window (a wider window → a wider cactus gap, basket, green zone…). Under Lights Out, key moments are kept out of the dark beats. Taps that arrive a frame late are still judged on their own timestamp.
- **COUNT!** checks the number of taps (your tally is chalked on a board), not each tap's timing.
- **Bosses.** The Chaos Conductor gives 8 commands, 1.75 beats apart (PLAY!/REST!), and flips to Opposite at the fifth. The Liar crowns exactly 4 of 8. The Final Tap's decoys include KNOW and SNOW, and every word looks and sounds the same, because reading is the test. Bosses ignore the active cards.
- **Cards.** New cards arrive in order, the first time you reach their slot; after that, any card you've met. From the third card on, the previous card stays as well (two rules). A card never repeats within three slots. Opposite Day never shares a round with Red Means No or Simon Says. Double Tap skips PUMP! and BEAT!.
- **Scoring.** 1 point a round, 2 with two rules, 6 for a boss. Only normal runs raise your best (and unlock microgames); Daily Chaos keeps its own best per day.
- **Extras.** A demo mode (the bot plays, and fluffs one now and then), a dev-only `debugPlan()` for QA scripts, and Metro the metronome as the host.

### Testing (as built)

- `microgames/microgames.test.ts`: every microgame's bot wins at every tier and difficulty over 12 seeds, under every allowed rule and pair of rules at top speed. It still wins with input a frame late, or 70% of the window early or late. Doing nothing loses (or wins the don't-tap ones), button mashing loses, traps are won by not tapping, and every scene draws without errors on a strict canvas stand-in.
- `core/run.test.ts`: tiers, card schedule, bosses, two-rule slots, no clashes, no repeats, unlocks, a deterministic daily.
- `core/progress.test.ts`: achievements, practice records, run results, daily bests, calibration maths.
- `tests/e2e/one-tap-chaos.spec.ts`: the real build in Chromium on a desktop and a phone (start, count-in, pause, a full run to game over, practice, calibration, demo, one tab).

