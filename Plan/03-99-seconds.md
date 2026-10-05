# 99 Seconds

> **"You have 99 seconds. You've had them before."**

| | |
|---|---|
| **Genre** | Time-loop escape room (point-and-click puzzle) |
| **Core mind trick** | Every 99 seconds the room resets, but you keep what you learned. Then the room starts to remember you too. |
| **Controls** | Click / tap (keyboard shortcuts on desktop) |
| **Session length** | 3 chapters · 45–90 minutes for the story · speedrun mode afterwards |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/99-seconds` |
| **Code folder** | `src/games/99-seconds/` |

---

## 1. About the Game

### The pitch
You wake up in a chair in a locked room. A big clock on the wall reads **99**. It counts down. When it hits zero there's a flash, and you're back in the chair. The clock says 99 again. The doors are locked again. Everything you picked up is back where it was.

But **you remember**. The code you saw, the drawer you opened, the noise you heard at second 42. To escape, you need to collect knowledge across many loops, then pull off the perfect run inside a single 99-second loop.

Then things get strange. Scratched messages appear on the walls, **in your handwriting**, saying things you haven't written… yet. The clock seems to slow down when you stare at it. And the door you finally open leads… back into the same room.

### How it messes with your mind
- **Knowledge is the only thing you keep.** Like *Outer Wilds*, your progress lives in your head (and your journal), not in your inventory.
- **Time pressure + planning.** You'll replay a loop in your head before you play it. Players start to "feel" 99 seconds.
- **The stopped-clock illusion (chronostasis).** In real life, the first second after you glance at a clock feels longer. In this game, it actually *is* longer.
- **Idioms come to life.** *"A watched pot never boils"*: the pot only heats up when you're not looking at it. *"Time flies"*: in the last chapter, the clock grows wings.
- **The bootstrap paradox.** The notes that help you were written by you, and in the final chapter you have to write them.

### Inspirations
*Outer Wilds* and *Twelve Minutes* (time loops), *The Legend of Zelda: Majora's Mask* (a repeating clock and schedule), the classic Flash "escape the room" genre (such as *Crimson Room*), and the film *Groundhog Day*.

---

## 2. How to Play

### Goal
Escape each room before the loop resets, then break the loop entirely.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Turn to another wall | `←` / `→` or click the arrows | Swipe left/right or tap the arrows |
| Inspect / use | Click a hotspot | Tap a hotspot |
| Use an item on something | Select the item, then click the target (or drag it) | Select the item, then tap the target (or drag it) |
| Back out of a close-up | `↓` / `Esc` / click "Back" | Tap "Back" |
| Open the journal | `J` | 📓 button |
| Flash all hotspots (help) | `H` | 💡 button |
| Pause | `P` / `Esc` (in room view) | ⏸ button |

### The core loop
1. **Wake up** at 99.
2. **Explore and experiment**: open things, read things, try codes, watch for timed events.
3. **The loop ends** at 0. Flash. Back in the chair.
4. **Your journal** keeps every fact you discovered, with timestamps ("At 42 s: the clock flickered **07**").
5. **Plan** a better route and try again.
6. **Escape** with a perfect run, and the next chapter begins (with a new twist on the loop).

---

## 3. Game Mechanics

### The room
- Each room has **4 wall views** (North / East / South / West), the classic escape-room layout.
- Hotspots open **close-up views** (a drawer, a keypad, the back of a photo).
- **Inventory:** items you pick up during a loop. They **reset** every loop.

### Time
- **The loop clock** counts 99 → 0 in real seconds.
- **Actions can take time.** Searching a coat takes 3 s, unscrewing a screw takes 6 s, reading a book takes 5 s. A progress ring shows the action, and you can cancel it. The clock keeps running either way.
- **Timed events** happen at the same second in every loop: a bird lands on the window sill at 13, the clock flickers at 42, the lights dip at 66, the phone rings at 77. Some events can only be seen if you prepare for them earlier in the loop.
- **Chronostasis:** when you turn to look at a clock, the current second lasts 1.5 s instead of 1 s. That's up to **+10 s per loop** for players who notice. The tick sound stretches as a tell.

### What persists vs. what resets
| Resets every loop | Persists forever |
|---|---|
| Inventory | The journal (facts, codes, timestamps) |
| Doors, drawers, screws, object positions | The loop counter |
| Running actions and timers | "Room memory" (see below) |
| | Chapter progress |

### Room memory (hints disguised as story)
If you go several loops without making progress, the room changes slightly. New messages appear, scratched into the wall **in your own handwriting**:
- After 5 stuck loops: something vague (*"Look up at the clock."*)
- After 10 stuck loops: something clearer (*"The clock talks at 42."*)
- After 15 stuck loops: something explicit (*"Watch the clock at 42 seconds left."*)

This is the hint system. Players experience it as story, not as a hint button, and nobody stays stuck forever.

### Modes
- **Normal:** the journal fills in automatically, and opening it pauses time.
- **Hardcore:** no journal, and time never pauses. Bring a real pen and paper.
- **Relaxed (accessibility):** 150-second loops, and reading pauses time.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Loop** | Running out of time means failing | It's the core mechanic. Failing is learning. | Revealed in the first loop |
| **The Watched Clock** | A second is a second | The first second you look at a clock lasts longer; staring buys you time | The tick sound stretches out |
| **A Watched Pot** | Boiling water takes 50 s | It only heats up while you're *not* looking at it | The bubbles freeze while you watch |
| **Two Clocks** | The wall clock is the loop timer | In Chapter 2, the wall clock is wrong and the oven timer is the honest one | The wall clock's second hand stutters |
| **The Fake Escape** | An open door means freedom | Through the door is the same room, mirrored | The door's hinges are on the wrong side |
| **Notes From Yourself** | Someone was trapped here before | It was you, from later. You'll write those notes in Chapter 3. | The handwriting matches your journal's font |
| **Leaving at Zero** | The reset is bad | Standing in an open doorway at 0 lets you slip out of the loop | The doorframe glows at 3… 2… 1… |
| **The 100th Second** | 99 is the limit | In Chapter 3 you can create a hidden 100th second | The clock face has a scratched-out "100" mark |
| **Time Flies** | The clock is an object | It grows wings and flies around the room, and you have to catch it | Feathers start falling from the clock in earlier loops |

---

## 5. Levels & Progression

### Chapter 1: The Waiting Room (tutorial + first twist)
**Room layout**
- **North:** the exit door with a 4-digit keypad; the big loop clock above it.
- **East:** a window; a potted plant.
- **South:** the chair you wake up in; a coat rack with a coat.
- **West:** a desk; a framed photo screwed to the wall above it; a lamp.

**The clue chain**
| Clue | How you find it |
|---|---|
| A **coin** | Search the coat pocket (3 s) |
| **"42"** + a note: *"THE CLOCK KNOWS THE REST"* | Use the coin as a screwdriver on the photo frame (2 screws × 6 s); it's scratched into the wall behind |
| **"07"** | At exactly 42 seconds left, the clock glitches and shows "07", but only if you're looking at it |
| Door code **0742** | Combine the two |

Once you know the code, you don't need the coin or the photo anymore. Your knowledge is the shortcut. Type **0742** → the door opens → you walk through…

**…into the same room, mirrored.** (The fake escape.)

**Part 2:** in the mirrored room, the keypad is replaced by a spring lever. The door only stays open for **10 seconds**, and the lever takes 30 s to recharge. Behind the mirrored photo, the note now says *"LEAVE AT ZERO."*

**Golden path (final loop):** wait until about 10 s are left → pull the lever → stand in the doorway → the clock hits **0** → everything resets around you, but you're outside the loop. **Chapter complete.**

### Chapter 2: The Kitchen (multitasking)
- A hatch in the floor is sealed with wax. Melt it with boiling water.
- **The watched pot:** the pot needs 50 s of *unwatched* time to boil. Start it early, then go do other things.
- The hatch key is frozen inside an ice block in the freezer. Melt it in the oven (30 s).
- **Two clocks:** the wall clock runs slow, so the loop "ends early" and players are confused. A note on the fridge in your handwriting says *"THE OVEN IS HONEST."* The oven timer shows the real loop time.
- The challenge is to **plan parallel tasks** so everything finishes inside one loop.

### Chapter 3: The Clock Room (breaking the loop)
- You're inside the giant clock: gears, pendulums, a huge clock face.
- **Time flies:** the clock grows wings and flutters around the room. Catch it to wind it.
- **The 100th second:** move the minute hand onto the scratched-out "100" mark to create one extra second. A hidden door only exists during that second.
- **The finale (bootstrap paradox):** before you leave, a notepad asks you to write messages. If you write the notes you found in Chapters 1–2, the loop closes properly → **True Ending**. If you leave without writing them → **Paradox Ending** (the rooms fold in on themselves; a funny "try again").

### Epilogue
The credits run for exactly 99 seconds. When they end, the title screen says: *"You've been here before."*

---

## 6. Features

### MVP (must-have)
- Chapter 1 complete: 4 walls, ~8 interactions, fake escape, real escape
- Loop system with reset animation
- Journal (auto-filled facts with timestamps)
- Inventory and timed actions
- Room memory hints
- Save chapter progress + journal

### Full version
- Chapters 2 and 3, plus both endings
- Chronostasis and the watched-pot mechanic
- Hardcore and Relaxed modes
- Achievements
- **Single Loop challenge:** escape a chapter in your first loop (only possible once you know the solution, which is exactly why speedrunners will love it)

### Later
- **Room editor** (rooms are data, see the Technical Plan)
- Shareable rooms: players send rooms they've made as links or files (no server)
- A "ghost" replay of your previous loop shown as a faint silhouette

---

## 7. Scoring, Rewards & Replay Value

- **Per chapter:** loops used, real time, hints triggered.
- **Ranks:** *Time Lord* (5 loops or fewer), *Clockwatcher* (6–15), *Groundhog* (16+).
- **Speedrun:** fastest single-loop escape per chapter (in-game seconds and real time).

### Achievements
| Achievement | How to get it |
|---|---|
| **First Try (lol)** | Escape Chapter 1 in a single loop on a fresh save (needs outside knowledge) |
| **Groundhog** | Live through 50 loops |
| **A Watched Pot** | Stare at the pot for a whole loop |
| **Clockwatcher** | Gain the full +10 s from chronostasis in one loop |
| **Closed Loop** | Get the True Ending |
| **Paradox** | Get the Paradox Ending |

---

## 8. Screens & UI

1. **Title screen:** the clock on the title counts down from 99. If you wait until 0, the "Press Start" text changes to *"You've been here before."*
2. **Room view:**
   - The current wall, full screen
   - Top centre: the loop clock (hidden in the Chapter 2 "two clocks" sections, where you rely on the in-room clocks)
   - Bottom: inventory bar
   - Corners: journal button, loop counter, pause
   - Left/right arrows to turn
3. **Close-up view:** a zoomed-in object with its own hotspots.
4. **Journal:** a notebook with facts grouped by room, timed events on a timeline, and codes.
5. **Loop transition:** white flash (or a fade with reduce flashing), reversed whoosh, *"Loop 7"*.
6. **Chapter complete:** loops, time, rank.
7. **Settings:** volume, text size, hotspot highlight, Relaxed/Hardcore toggles, reduce flashing.

---

## 9. Art & Audio Direction

### Visuals
- Warm, slightly surreal illustrated rooms: flat vector shading, muted colours, soft lamplight.
- **The clock is the star.** Every room's composition leads the eye to a clock.
- Colours slowly **desaturate** with each loop without progress, then snap back to full colour when you make a breakthrough. It's a subtle mood signal.
- Wall scratches (room memory) look hand-drawn and get more frantic over time.

### Audio
- **A constant tick.** The heartbeat of the game.
- **A 99-second soundtrack.** Each chapter's music is exactly one loop long, so players learn where they are in the loop just from the music. *"The phone rings when the cello comes in."*
- The reset is a reversed whoosh, as if everything is being sucked back to the start.
- Timed events have clear sounds (a bird's flutter, the clock's buzz at 42) so players notice them even on another wall.

---

## 10. Fairness Rules

1. **Room to breathe.** Each chapter's golden path can be finished in **75 seconds or less** by someone who knows the solution, leaving at least 24 seconds of buffer.
2. **Knowledge is the only progression.** No pure luck, and no pixel hunting (the hotspot highlight button exists for this).
3. **Deterministic.** Timed events happen at the same second in every loop.
4. **Nobody stays stuck forever.** Room memory hints escalate until the answer is clear.
5. **The journal records every clue** in Normal mode. Players never have to remember a code they saw once.
6. **Every audio clue has a visual equivalent** (and subtitles).

---

## 11. Accessibility & Comfort

- **Relaxed mode:** 150-second loops, and reading pauses time.
- **Hotspot highlight:** a button that briefly outlines every interactive object.
- Clues never rely on colour alone.
- Subtitles for all sounds that matter (*"[buzz from the North wall]"*).
- **Reduce flashing:** the loop reset becomes a gentle fade.
- Large tap targets on mobile (44 px or more).
- Text size options for notes and the journal.

---

## 12. Technical Plan

### Architecture
- **React + DOM/SVG scenes.** Each wall is an illustrated background (SVG or WebP) with hotspot polygons laid over it, positioned in a fixed 16:9 coordinate space that scales to fit the screen.
- **Two-layer state:**
  - `PersistentState`: journal, loop count, room memory flags, chapter progress (saved to localStorage)
  - `LoopState`: inventory, object states, running actions (rebuilt at every reset)
  - At reset: `loopState = createLoopState(room, persistentState)`. The room's starting state plus any room-memory changes.
- **One authoritative loop clock** using `performance.now()` + `requestAnimationFrame`. It pauses when the tab is hidden (`visibilitychange`, via the `engine/browser` helper) or the pause menu is open. Chronostasis adds bonus milliseconds when a clock view is entered.
- **Data-driven puzzle rules:** interactions, conditions and effects are data, not hard-coded logic. This makes rooms easy to edit and test, and enables a room editor later.

### Data model
```ts
type Condition =
  | { flag: string; is?: boolean }
  | { hasItem: string }
  | { secondsLeft: { gte?: number; lte?: number } }
  | { viewing: string };                       // e.g. "north" or "closeup:clock"

type Effect =
  | { setFlag: string; value?: boolean }
  | { giveItem: string }
  | { takeItem: string }
  | { revealClue: string }                     // adds a journal entry
  | { playSound: string }
  | { goToView: string }
  | { endChapter: "true" | "paradox" | "next" };

interface Interaction {
  id: string;
  on: string;                    // hotspot id
  use?: string;                  // inventory item id (optional)
  requires?: Condition[];
  durationMs?: number;           // actions that take time
  effects: Effect[];
}

interface TimedEvent {
  atSecondsLeft: number;         // e.g. 42
  requires?: Condition[];        // e.g. { viewing: "north" }
  effects: Effect[];
}

interface RoomMemoryStage {
  afterStuckLoops: number;       // 5, 10, 15
  effects: Effect[];             // e.g. reveal a new wall scratch
}
```

### Testing the puzzles
Each chapter has a **golden path script**: a list of interactions with timestamps. A headless test runs the rules engine with a fake clock and checks that the escape happens before the loop ends, with at least 24 s to spare.

### Folder structure
```
src/games/99-seconds/
  index.tsx
  engine/
    loop-clock.ts        # authoritative timer, pausing, chronostasis
    rules.ts             # evaluates interactions, conditions, effects
    state.ts             # PersistentState + LoopState
  rooms/
    waiting-room/        # scene.ts, interactions.ts, events.ts, memory.ts, art/
    kitchen/
    clock-room/
  ui/
    RoomView.tsx  Hotspot.tsx  CloseUp.tsx  Inventory.tsx
    Journal.tsx  LoopClock.tsx  LoopTransition.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Puzzle design is hard to get right | Greybox every chapter with placeholder art and playtest before final art |
| Art workload (4 walls × 3 rooms + close-ups ≈ 30 illustrations) | Reuse props between rooms, keep a consistent simple style, lazy-load each chapter |
| Timer drift / tab switching | One authoritative clock; pause on hidden tab; never use `setInterval` for game time |

---

## 13. Build Roadmap

- [x] **M1: Loop engine.** Loop clock, reset, rules engine, Chapter 1 greybox (placeholder art)
- [x] **M2: Knowledge systems.** Journal, timed actions, timed events, room memory hints
- [x] **M3: Chapter 1 final.** Art, audio, the 99-second soundtrack, fake escape + real escape
- [x] **M4: Chapters 2–3.** Watched pot, two clocks, time flies, the 100th second, both endings
- [x] **M5: Polish.** Hardcore/Relaxed modes, achievements, Single Loop challenge, accessibility pass
- [ ] **Later:** room editor, shareable rooms

---

## 14. Definition of Done

- Every chapter's golden path passes its automated test with at least 24 s to spare.
- Playtesters escape Chapter 1 in an average of 20 loops or fewer, and nobody needs more than 30 (room memory guarantees it).
- The loop clock stays accurate after tab switches, pauses and slow devices.
- Both endings are reachable.
- Fully playable by touch on a phone.
- Progress and the journal survive page reloads.

---

## 15. As Built

99 Seconds is playable at `/games/99-seconds/play`. It has:

- three chapters (The Waiting Room, The Kitchen and The Clock Room), the True Ending with exactly 99 seconds of credits, and the Paradox Ending;
- the loop clock with chronostasis, timed actions, timed events, things that take their own time (a pot that only boils while nobody watches it), and the room's memory: scratches in your handwriting, and colour that drains while you're stuck;
- the journal (facts, a timeline, codes and notes, and what's on the walls), Normal, Relaxed and Hardcore modes, and the Single Loop challenge for chapters you've escaped;
- six trophies, three ranks and a share card.

Everything is made in code, with no asset files:

- **Art:** SVG in a 1600 × 900 scene, drawn in flat shapes with soft lamplight gradients. There are 12 walls and 12 close-ups across the three chapters, plus the mirrored Waiting Room (the same walls drawn flipped, with a lever instead of the keypad, and its notes still readable). Every room leads the eye to a clock: a seven-segment clock over the door, a slow wall clock and an honest oven timer, the back of a giant clock face. Hotspots are real buttons over the picture, labelled for screen readers and at least 44 px. Notes, scratches and the journal are in a handwriting font (Caveat). Small CSS animations bring it to life: the ringing phone, steam, bubbles that freeze while you watch, the stuttering wall clock, turning gears, the pendulum, the little clock's wings, and the rooms folding up in the Paradox.
- **Sound:** synthesized with Web Audio. There's the constant tick (stretched when a glance holds the second), the reversed whoosh of a reset, and 34 sounds for what you do and what happens, each panned toward its wall.
- **Music:** each chapter's score is exactly one loop long and is scheduled against the seconds left, so it pauses with the game and stretches with the clock. Chapter 1 is a music box in A minor: the cello comes in with the phone at 77, everything drops when the lights dip at 66, a bell sounds at 42 and the bird's flute at 13. Chapter 2 has a walking bass that slips up a key at 66 and again at 33. Chapter 3 is a mechanical ostinato with the "time flies" theme at 77 and a bell at every landing. Relaxed mode's longer loops start with a quiet bed.

It reuses:

- the audio engine, `engine/save` (plus `engine/save/runs` for run history), the arcade settings (sound, Reduce flashing, text size) and `engine/browser` (the tab's visibility);
- `games/shared`: achievements, the one-tab guard, sharing, the comfort and device hooks, and the HUD store;
- the arcade's `Dialog` and `ToggleSwitch`.

It adds no libraries. The handwriting font comes through `next/font`, like the other games' fonts.

The code is in these folders:

- `core/`: the loop (`loop.ts`: the clock, chronostasis, actions, events, processes and zero), the rules' types (`types.ts`) and the room's memory (`memory.ts`). Two more files exist for the tests: a script player (`script.ts`) and the hint reader (`reader.ts`).
- `rooms/`: one file per chapter (its hotspots, interactions, timed events, processes, items, clues and scratches), and `solutions.ts`, each chapter's golden path split by goal.
- `art/`: the drawing kit, one file per chapter (walls and close-ups), and the scene (mirroring, the scratches, the dim and the hundredth second's glow).
- `play/`: the runtime (the clock on `requestAnimationFrame`, sounds, captions, messages and the HUD store).
- `audio/` (the sounds and the music) and `ui/` (the title, chapters, the play screen, the journal, the endings and the menus), plus the save, progress and trophies.

### A loop

- **The clock** counts game time: 99 seconds, or 150 in Relaxed. Each frame advances it in 50 ms slices, so events and processes land on time even after a slow frame. It holds:
  - while the game's paused;
  - while the tab is hidden (the pause card comes up);
  - during the flash between loops;
  - while the journal's open (Normal and Relaxed);
  - in Relaxed, while you read a message (1.5 s plus 45 ms a character).
- **Chronostasis:** turning to a clock (a wall or close-up with one on it) from somewhere without one holds that second half a second longer, up to 10 s a loop. The tick stretches and the HUD clock glows.
- **Actions** take time: searching the coat takes 3 s, each screw 6 s, filling the pot 3 s, writing a note 2.5 s and winding the little clock 4 s. A ring shows the progress, with a Stop button, and turning away stops them too. The clock keeps running throughout.
- **Timed events** happen at the same second every loop, with a sound panned toward their wall and a caption (*[a buzz from the clock, North wall]*). Some only count as clues if you see them: the clock's 07 at 42 only counts if you're looking at it.
- **Processes** run while their conditions hold:
  - the pot heats only while nobody's looking at it (50 s);
  - the ice melts only with the oven on and its door shut (30 s);
  - the lever's spring holds the mirrored door open for 10 s and takes 30 s to recharge.
- **At zero** the room decides:
  - Usually it's a reset: a flash (a fade with Reduce flashing), the reversed whoosh and "Loop 8". Your pockets are empty and everything's back where it was.
  - Standing in the mirrored doorway gets you out (Chapter 1).
  - With the hand on 100, the loop gets a hundredth second (Chapter 3).

### The chapters

| Chapter | The way out | Golden path | Hint reader |
|---|---|---|---|
| 1. The Waiting Room | The door code is 0742. 42 is scratched behind the photo (the coat's coin turns its two screws), and the clock flickers 07 at 42 if you're watching. Through the door is the same room, mirrored, with a lever that holds the door open for 10 s. Pull it at 10, stand in the doorway and wait for zero. | 3.9 s of doing things; out at zero | 23 loops |
| 2. The Kitchen | There's no loop clock: the wall clock runs at 0.7 speed, and the oven timer is honest (the fridge note says so). Fill the pot, light the hob and look away for 50 s. Put the ice in the oven with the door shut for 30 s, and take the key out with the mitt. Pour the boiling pot on the hatch's wax, then put the key in the lock. | 18.7 s; out with 38.3 s left | 28 loops |
| 3. The Clock Room | Take the key and write the three notes you found. At 77 the little clock flies, landing somewhere new every 8 s (on top of the big clock at 70). Catch it, wind it and fit it to the gears' empty axle. The crank puts the hand on 100. At zero the loop gets a hundredth second (6 s long), with a door behind the pendulum. | 19.3 s; the True Ending | 35 loops |

Chapter 1 also has:

- the phone at 77 (a voice like yours says "Don't go through", and in the mirrored room, "Wait in the doorway. Wait for zero.");
- the lights dipping at 66;
- a bird at 13;
- tally marks in the drawer, one for every loop.

### The room's memory

- Every loop without a new clue adds 1 to how stuck the room thinks you are, and a loop with one takes off 5.
- At 5, 10 and 15, the room scratches a hint for the first goal you haven't reached. It goes on the wall you wake up facing, in your handwriting, and gets plainer each time: *LOOK UP AT THE CLOCK.*, then *THE CLOCK TALKS AT 42. THE PHOTO KNOWS THE REST.*, then *THE DOOR IS 0742.* A goal's scratches never go back, and they're in the journal's "On the walls" tab too.
- The room's colour drains 7% a loop without a new clue (down to 35%) and snaps back the moment you learn something.

### Modes, ranks and trophies

- **Modes:**
  - **Normal:** the journal fills in by itself ("noted in your journal") and holds the clock while it's open.
  - **Relaxed:** 150-second loops, with the events at the same seconds left (the extra time comes first), and reading holds the clock.
  - **Hardcore:** no journal. Bring a pen.
- **Ranks** for each chapter: Time Lord (5 loops or fewer), Clockwatcher (6–15) and Groundhog (16+). The chapter card shows the loops, the real time and how many scratches you read, and it shares as a line of ⏳.
- **Single Loop:** play any chapter you've escaped in one loop; the reset ends it. It keeps your best real time and seconds left, and leaves the story's numbers alone.
- **Trophies:**
  - First Try (lol);
  - Groundhog (50 loops);
  - A Watched Pot (a minute of staring at the heating pot);
  - Clockwatcher (the full 10 s in one loop);
  - Closed Loop;
  - Paradox.
- **The title** counts down from 99. Wait it out (or see the credits) and the start button says *You've been here before.*

### How it's proven fair

- **Golden paths** (`rooms/chapters.test.ts`): every chapter escapes in one loop, at 99 and at 150 seconds, with at most 75 s of doing things (rule 1). The Kitchen is the only chapter that doesn't end at zero by design, and it finishes with 38 s left.
- **Nobody stays stuck forever:** a hint reader plays each chapter knowing nothing it hasn't been told outright. Each loop it does only the parts of the golden path that the room's plainest scratches have spelled out (or that it's already done once), and otherwise stands still. It escapes Chapter 1 in 23 loops (the plan says nobody should need more than 30), Chapter 2 in 28 and Chapter 3 in 35, and the same in Relaxed.
- **Every rule** has a test:
  - Chapter 1: 07 only counts if you're looking, wrong codes fail, the mirror, the lever's timing, leaving at zero and the phone.
  - Chapter 2: the watched pot (looking from inside the oven doesn't count), the oven and the mitt, the wax and the wall clock.
  - Chapter 3: the flight schedule, the crank, the hundredth second, both endings and tearing off the page.
- **The data** (`rooms/data.test.ts`):
  - everything a room mentions exists, and every close-up has a way back;
  - every hotspot is on screen and big enough, and nothing you can use hides under the turn tabs or Back on a 640 × 360 phone on its side;
  - every sound that tells you something has a caption (rule 6), and the journal records every goal's answer (rule 5);
  - the notepad wants exactly the three notes you found.
- **The loop** (`core/loop.test.ts`): one long tick equals many short ones, chronostasis stops at 10 s, events on the same second all happen, you can only use what you're holding, and the same inputs give the same loop.
- **The save** (`progress.test.ts`): loops, clues saved mid-loop, escapes and ranks, trophies, Single Loop bests, and broken saves refused.
- **End to end,** on a computer and a phone, with the browser's clock fast-forwarded:
  - the title's countdown;
  - Chapter 1 by a player who knows the way (typed on a computer, tapped on a phone);
  - a reset that empties your pockets but not your journal;
  - the journal and a hidden tab holding the clock, and the highlight;
  - turning by a swipe, and the journal surviving a reload;
  - the Kitchen without a loop clock, and Hardcore without a journal;
  - the Clock Room to both endings and the credits.

### Speed

The room is one SVG, redrawn only when the picture changes: at most once a second, or when you do something. Progress rings, messages and captions don't redraw it. In a development build on a Pixel 7 with its processor slowed four times, it holds 60 frames a second during actions and in the busiest scenes (the kitchen with the pot on, the gears, the little clock in flight). A turn shows the new wall within two frames. Slowed ten times, it holds 57–59 frames a second.

### Differences from the draft

- **Chronostasis** holds the second you glance at a clock for an extra half second (the draft had it last 1.5 s), still up to 10 s a loop.
- **Chapter 1** has more going on than the draft's clue chain. The phone at 77 (your own voice, with a different message in the mirrored room), the lights at 66, the bird at 13 and the tally marks give the loop a rhythm, and give the room's memory something to point at. Standing in the doorway is its own close-up, and the frame glows (and hums) in the last three seconds.
- **The Kitchen** hides the loop clock for the whole chapter. Its clocks are the oven timer, the slow wall clock and a radio whose tune lasts exactly one loop.
- **The hundredth second** comes from a crank that moves the short hand (the draft said the minute hand). It lasts 6 real seconds, with the clock on 100 throughout, so there's time to reach the door on a phone.
- **The notepad** offers six notes: the three you found and three that only look like them. The True Ending needs exactly the real three, and tearing off the page starts again.
- **The rules engine** grew past the draft's data model:
  - `any`, `all` and `not` conditions, and conditions on clues, items, the room's version and what's been typed;
  - effects with `when`/`then`/`else`;
  - processes (things that take their own time while their conditions hold);
  - rules for zero;
  - messages and captions as effects.
- **Room memory** is goal-based (three stages a goal) instead of per-room effects, so the scratches always speak to what you're stuck on.
- **The folders** follow the arcade's other games (`core/`, `rooms/`, `art/`, `play/`, `ui/`) instead of `engine/` plus a folder per room.
- **Hardcore** still holds the clock while the pause card is up (it covers the room) and while the tab is hidden, so a phone call doesn't cost a loop.
- **Settings:** text size is the arcade's own setting, and the hotspot highlight is the 💡 button (or `H`), not a setting.
- **Phones:** held upright, the turn arrows and Back sit in a bar under the room, which also says where you're looking. On its side, your pockets go down the right so the room gets the full height.
- **Later** isn't built: the room editor, shareable rooms, and a ghost of your last loop.
