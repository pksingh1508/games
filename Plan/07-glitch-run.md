# Glitch Run

> **"The game is broken. Use it."**

| | |
|---|---|
| **Genre** | Auto-runner with deliberate glitch mechanics |
| **Core mind trick** | The screen and the controls "break" on purpose. What you see isn't always where things are. And you can use glitches yourself to clip through walls. |
| **Controls** | 3 actions: Jump, Slide, Glitch |
| **Session length** | 1–5 minute runs · 20 story stages + endless mode |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/glitch-run` |
| **Code folder** | `src/games/glitch-run/` |

---

## 1. About the Game

### The pitch
**You are the bug.**

You're a corrupted little sprite running through the memory of a game that wants you gone. Your character runs automatically. You jump and slide to survive. But the game is falling apart around you: frames skip, the screen tears in half, textures go missing, your controls swap, and sometimes the whole game freezes with *"Not Responding"* while you keep running blind.

All this chaos **follows rules**. Learn them and you'll survive. Master them and you can **glitch on purpose**: phase through walls, skip ahead and live dangerously at high corruption for huge scores. Meanwhile **The Debugger**, the game's antivirus, is hunting you down to "fix" you.

### How it messes with your mind
- **What you see isn't where things are.** Screen tears shift the visible ground away from the real ground. Your eyes say one thing and the game says another.
- **Fighting visual dominance.** Our brains trust sight over sound (the *Colavita effect*). Glitch Run makes your eyes unreliable, so you learn to trust the audio cues and your character's shadow instead.
- **Control swaps.** Jump becomes slide for 5 seconds. Your muscle memory betrays you, and you have to override it.
- **Risk vs. reward.** Using your glitch power raises corruption, which makes the world even more broken… and multiplies your score.

### Inspirations
*Canabalt* and *Bit.Trip Runner* (auto-runners), *Geometry Dash* (rhythm and memorisation), and glitch culture in general (think of famous glitches like *MissingNo.*).

---

## 2. How to Play

### Goal
- **Story stages:** reach the end of the stage, then escape The Debugger.
- **Endless:** run as far as possible, and score as high as possible.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Jump (hold for higher) | `Space` / `↑` / `W` | Tap the **right half** of the screen |
| Slide | `↓` / `S` | Tap the **left half** of the screen |
| Glitch (phase through) | `Shift` / `J` | ⚡ button (bottom centre) |
| Pause | `Esc` / `P` | ⏸ button |

> **The HUD always shows your current control mapping** with small icons, including during Input Swap.

### The core loop
1. **Run** (automatically). Speed rises over time.
2. **React:** jump, slide, glitch.
3. **A glitch event is coming:** a warning crackle and a flicker in the HUD.
4. **Adapt** to the event for 3–6 seconds.
5. **Collect bits** to charge your glitch power, and **patches** to lower corruption.
6. **Crash → see your score → instant restart.**

---

## 3. Game Mechanics

### The golden rule
> **The simulation never lies. Only the screen and the controls do.**

Every glitch changes either **what you see** (presentation) or **how your input is read** (input mapping). The physics underneath is always honest. This keeps the game fair, and it makes it testable.

### Glitch power (your ability)
- Collect **bits** (floating 0s and 1s) to charge your glitch power. 10 bits = 1 charge, and you can hold up to 3.
- **Clip:** press Glitch to become intangible for 0.35 s and phase through one obstacle.
- Every Clip raises **Corruption** by 10%.

### Corruption (0–100%)
- **Higher corruption** = glitch events happen more often and hit harder… and your **score multiplier goes up** (up to ×5).
- **Patches** 🩹 (rare pickups) lower corruption by 15%.
- **At 100%: Kernel Panic.** 10 seconds of maximum chaos. Survive it for a big bonus, and corruption drops back to 50%.

### Glitch events
Every event gets a **warning (telegraph) at least 0.6 s before** it starts: a crackle sound + a flicker in the HUD + the event's icon.

| Event | What happens | How to beat it (the tell / truth anchor) |
|---|---|---|
| **Frame Skip** | The game jumps 0.3 s ahead, and you "teleport" | The screen stutters (holds 2 frames) right before; you can see where you'll land |
| **Input Swap** | Jump and Slide switch for 5 s | The HUD control icons flip; your character turns colour-inverted while swapped |
| **Screen Tear** | The bottom half of the screen slides sideways, so the ground you *see* isn't the real ground | **Your shadow** is always drawn at your true position, and the top half is honest |
| **Missing Texture** | Obstacles turn into magenta-and-black checkerboards | Their **shapes** stay the same, so read the outline |
| **Invert** | Colours invert, revealing hidden platforms that are normally invisible | Hidden platforms are only there during the inversion, so time your jumps |
| **Audio Desync** | The visuals lag behind the sound | Trust the sound: each obstacle's sound is perfectly on time |
| **Déjà Vu** | The last 3 seconds of track repeat, with one change | Spot the difference |
| **Low Res** | The screen drops to giant chunky pixels | Read the shapes; audio cues still work |
| **Ghost Double** | Two copies of you appear; which one is real? | The real one has a shadow and responds instantly |
| **Not Responding** | The screen freezes with a fake *"Not Responding"* overlay, but the game keeps running | **Run blind** using audio. Every obstacle has a rhythm cue (and a visual beat bar for players who can't hear it) |
| **Upside Down** | The screen flips 180°, but the controls don't | Jump is still jump. Trust your hands. |

### Rules for events
- At most **2 events at the same time** (except during Kernel Panic).
- Events last **3–6 seconds**.
- Event frequency is set by corruption and difficulty.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **Where's the Floor?** | The ground is where you see it | Screen tear has shifted it | Your shadow shows the real ground |
| **Hands Betray You** | Jump is always jump | Input Swap reversed it | HUD icons flip + inverted character |
| **Sound Before Sight** | Things happen when you see them | During desync, the sound is the truth | Sounds stay perfectly on beat |
| **The Freeze** | A frozen game is a paused game | It's still running behind the overlay | The music never stops |
| **The Helpful Glitch** | Glitches are bad | Inversion reveals hidden shortcuts with bonus bits | Hidden platforms glow faintly just before an Invert |
| **Corruption Temptation** | Low corruption is safe and good | High corruption is where the big scores are | The multiplier glows brighter |
| **Fix the Bug?** | Winning means getting fixed | The true ending is refusing to be fixed | — (final choice) |

---

## 5. Levels & Progression

### Story stages (20)
Each stage teaches one glitch, mixes in the earlier ones, and ends with a short Debugger chase.

| # | Stage | Focus |
|---|---|---|
| 1 | **Boot Sequence** | Pure running, no glitches… until the very last second |
| 2 | **Frame Drop** | Frame Skip |
| 3 | **Swap Meet** | Input Swap |
| 4 | **Tear Down** | Screen Tear + trusting your shadow |
| 5 | **Missing Assets** | Missing Textures |
| 6 | **Negative Space** | Invert + hidden platforms |
| 7 | **Lag Spike** | Audio Desync |
| 8 | **Déjà Vu** | Repeats with one change |
| 9 | **Low Res** | Chunky pixels |
| 10 | **Double Trouble** | Ghost Double |
| 11–15 | **Mixed Memory** | Two-glitch combos, faster speeds |
| 16 | **Not Responding** | Running blind on audio |
| 17 | **Upside Down** | Flipped screen |
| 18–19 | **Heap Overflow** | Everything, at high corruption |
| 20 | **Root** | Final escape from The Debugger |

### The Debugger (boss)
- A huge scanning entity that chases you from the left.
- It sweeps a **scan line** across the screen. Touch it while solid and you get "patched" (game over). **Clip through it** with your glitch power.
- In the final stage, it has 3 phases: scan lines, deleting the ground behind you, and finally "reformatting" the screen into a blank white void that you navigate by sound.
- **Ending:** you reach the Root folder. A dialog asks: *"Fix the bug?" [Yes] [No]*. Choose **No**, and the game decides to keep you. The credits are glitched in your honour.

### Endless mode
- Built from hand-made chunks of 2–4 seconds each, joined procedurally.
- Difficulty, speed and corruption rise over time.
- **Daily Corruption:** a daily seed, so everyone plays the exact same run that day.

---

## 6. Features

### MVP (must-have)
- Auto-runner with jump, slide and glitch-clip
- Corruption meter + bits + patches
- 6 glitch events (Frame Skip, Input Swap, Screen Tear, Missing Texture, Invert, Audio Desync)
- Endless mode with chunk generation
- High score saving
- Comfort settings (reduce flashing, gentle glitches)

### Full version
- All 11 glitch events
- 20 story stages + The Debugger boss + the ending
- Kernel Panic
- Daily Corruption seed
- Achievements

### Later
- **Practice mode:** pick which glitches appear
- **Daily challenge links:** share your Daily Corruption score as a link; friends play the same seed on their own device and compare (no server)
- Character skins ("corrupted" versions of the other games' heroes)

---

## 7. Scoring, Rewards & Replay Value

### Score
`distance × corruption multiplier + style points`
- **Style points:** near misses, clipping through obstacles, surviving events without touching anything, surviving Kernel Panic.

### Share card
```
GLITCH RUN · Daily Corruption #142
2,481 m · ×4.2 · survived 2 Kernel Panics
▓▒░ YOU ARE THE BUG ░▒▓
```

### Achievements
| Achievement | How to get it |
|---|---|
| **Living Dangerously** | Run for 60 seconds above 80% corruption |
| **Kernel Survivor** | Survive a Kernel Panic |
| **Blind Faith** | Survive a full Not Responding without touching anything |
| **Shadow Reader** | Survive 10 Screen Tears |
| **Wontfix** | Get the true ending |
| **Clean Code** | Finish a story stage without using Glitch |

---

## 8. Screens & UI

1. **Title:** the logo constantly glitches. Pressing Start "crashes" the title screen into the first stage.
2. **Stage select:** styled like a corrupted file browser (`stage_01.exe`, `stage_02.exe`…).
3. **Run HUD:**
   - Top left: distance + score
   - Top right: corruption meter + multiplier
   - Bottom: glitch charges (⚡⚡⚡) and **current control icons**
   - Event warning icon (centre-top, appears during the telegraph)
4. **Game over:** "PATCHED" stamp, score, best, retry (instant).
5. **Settings:** photosensitivity options, gentle glitches, reduce motion, audio, controls.

---

## 9. Art & Audio Direction

### Visuals
- Clean, simple base art (dark background, neon outlines), so glitches stand out clearly against it.
- Glitch effects: RGB colour split, horizontal tearing, pixel sorting, scanlines, noise, checkerboard "missing texture" magenta.
- **The player's shadow is drawn with special care.** It's the main truth anchor and must always be visible.
- The Debugger: a white, clinical, geometric shape. Calm, clean and terrifying, the opposite of you.

### Audio
- Driving electronic / chiptune music. Obstacles are placed on the beat, so the music helps you time jumps.
- **Every obstacle has its own sound cue on the beat.** This is what makes Not Responding and Audio Desync playable.
- Warnings: a short crackle before every glitch event.
- Bitcrushing and stuttering applied to the music as corruption rises.

---

## 10. Fairness Rules

1. **The simulation never lies.** Glitches only affect what you see and how input is mapped.
2. **Every event has a warning** at least 0.6 s before.
3. **Truth anchors:** your shadow always shows your true position; audio cues are always on time; the HUD always shows the real control mapping.
4. **No more than 2 events at once** (except Kernel Panic, which players choose to risk by raising corruption).
5. **Every generated chunk is checked to be passable** with normal jumps (no glitch power required).
6. **Instant restart** after a crash.

---

## 11. Accessibility & Comfort

> This game uses flashing and screen effects, so comfort settings are a priority, not an afterthought.

- **Photosensitivity warning** shown before the first run.
- **Reduce flashing:** no full-screen inversions or strobes; never more than 3 flashes per second (WCAG 2.3.1). Invert becomes a soft colour shift.
- **Gentle glitches:** all effects at 30% intensity.
- **Reduce motion:** no screen shake; Upside Down becomes an icon-based warning instead of a full flip.
- **Visual beat bar:** a visual version of the audio cues, for deaf and hard-of-hearing players (essential for Not Responding and Audio Desync).
- Colourblind-safe: shapes and outlines, never colour alone.

---

## 12. Technical Plan

### Architecture: two layers
1. **Simulation (truth):** pure TypeScript, fixed 60 Hz, deterministic, seeded RNG (`engine/rng`). Player physics, obstacles, collisions, scoring. The jump and tile-collision code is reused from the shared `engine/platformer` (built for TrapSprint).
2. **Presentation (lies):** draws the simulation onto a Canvas 2D offscreen canvas, then applies glitch effects using the shared `engine/postfx` (a small WebGL2 shader pass: RGB split, tearing offsets, pixelation, inversion, noise, scanlines).
   - **Fallback** if WebGL2 isn't available: Canvas-only effects (tearing and pixelation via `drawImage` slices; RGB split is skipped).
   - *Alternative:* PixiJS + `pixi-filters` (which includes glitch, RGB-split and CRT filters) if we want a full rendering library.
3. **Input mapping layer** between the controls and the simulation: handles Input Swap.

### Glitch event system
Each event is an object with a warning phase, an active phase and an end, and it declares which layer it affects:
- `presentation`: screen effects, offsets, freezes, flips
- `input`: swaps

It is **never** allowed to touch the simulation. A unit test enforces this.

### Endless generation
- A **chunk library:** hand-made 2–4 s sections tagged by difficulty and required moves.
- **Generator:** picks chunks to fit a difficulty budget that rises over time.
- **Validator:** simulates jump arcs to make sure every chunk transition is passable.
- **Seeded RNG** from `engine/rng`. The daily seed is based on the UTC date.

### Audio
Web Audio API. Obstacle sound cues are scheduled ahead of time from the simulation timeline, so they stay perfectly in sync even when the visuals are "lagging".

### Data model
```ts
type GlitchKind =
  | "frameSkip" | "inputSwap" | "screenTear" | "missingTexture" | "invert"
  | "audioDesync" | "dejaVu" | "lowRes" | "ghostDouble" | "notResponding" | "upsideDown";

interface GlitchEvent {
  kind: GlitchKind;
  telegraphMs: number;              // ≥ 600
  durationMs: number;               // 3000–6000
  intensity: number;                // 0..1, scaled by corruption and comfort settings
  layer: "presentation" | "input";  // never "simulation"
}

interface Chunk {
  id: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  lengthTiles: number;
  tiles: string[];                  // ASCII rows
  requires?: Array<"jump" | "slide" | "longJump">;
  bits?: Array<{ x: number; y: number }>;
}

interface RunState {
  seed: number;
  distance: number;
  corruption: number;               // 0..100
  multiplier: number;
  charges: number;                  // 0..3
  activeEvents: GlitchEvent[];
}
```

### Folder structure
```
src/games/glitch-run/
  index.tsx
  sim/
    world.ts  player.ts  obstacles.ts  scoring.ts
  glitches/
    director.ts                # decides when and which events happen
    events/                    # one file per glitch kind
  gen/
    chunks/  generator.ts  validator.ts
  render/
    draw.ts  shadow.ts
  ui/
    Hud.tsx  GameOver.tsx  StageSelect.tsx
src/engine/postfx/             # shared WebGL2 effects
```

### Technical risks
| Risk | Plan |
|---|---|
| Photosensitivity / motion sickness | Strong comfort settings, a warning screen, a WCAG flash limit by default |
| WebGL performance on low-end phones | Render at 960×540 internally; Canvas-only fallback |
| Chaos becomes unreadable | Max 2 events at once; playtest readability; truth anchors |

---

## 13. Build Roadmap

- [x] **M1: Runner core.** Simulation, jump/slide, obstacles, chunk generator, endless mode (no glitches)
- [x] **M2: Glitch system.** Telegraphs, postfx layer, the first 6 events, corruption + bits + patches + Clip
- [x] **M3: Story part 1.** Stages 1–10, The Debugger chase
- [x] **M4: Story part 2.** Remaining events, stages 11–20, Kernel Panic, the ending
- [x] **M5: Polish.** Comfort settings, visual beat bar, daily seed, achievements
- [ ] **Later:** practice mode, daily challenge links, skins

---

## 14. Definition of Done

- A unit test proves no glitch event changes simulation state.
- Every endless chunk passes the validator.
- Every event warns at least 600 ms ahead.
- With "reduce flashing" on, nothing flashes more than 3 times per second.
- 60 fps on a mid-range phone with postfx on (or the fallback kicks in automatically).
- The same seed always produces the same run.

---

## 15. As Built

Glitch Run is playable at `/games/glitch-run/play`: 20 story stages (each ending in The Debugger's chase, and Root's finale at the end), endless mode and Daily Corruption, all 11 glitch events (each warned at least 0.6 s ahead), corruption and its score multiplier, bits, glitch charges and Clip, patches, Kernel Panic, six achievements, the ending (both answers), the share card, the photosensitivity warning, reduce flashing, gentle glitches, reduce motion, the visual beat bar, remappable keys, gamepads and touch. The art is drawn in code (Canvas 2D). The music (four chiptune songs, scheduled from the run's own beats and bitcrushed as corruption rises) and the sounds (ZzFX) are generated in code: there are no asset files.

It reuses `engine/loop`, `input`, `rng`, `platformer/physics` (vertical moves and ground checks: the runner's sideways move is the game's own, pixel by pixel along the beat grid) and the audio engine. The shared sound bank gained one option, `at`, to play a sound at a set time on the audio clock: the cues are scheduled ahead.

### The stages

| Stage | Name | bpm | Corruption at the start | Glitches | Scan lines | Clips needed | Cues | Length |
|---|---|---|---|---|---|---|---|---|
| 01 | Boot Sequence | 120 | 0% | Screen Tear | 3 | 0 | 17 | 22 s |
| 02 | Frame Drop | 120 | 0% | Frame Skip | 4 | 0 | 25 | 27 s |
| 03 | Swap Meet | 120 | 0% | Input Swap | 4 | 0 | 23 | 25 s |
| 04 | Tear Down | 124 | 0% | Screen Tear, Frame Skip | 4 | 0 | 26 | 26 s |
| 05 | Missing Assets | 124 | 0% | Missing Texture, Input Swap | 5 | 0 | 29 | 26 s |
| 06 | Negative Space | 129 | 0% | Invert, Screen Tear | 4 (1 full) | 1 | 20 | 24 s |
| 07 | Lag Spike | 129 | 0% | Audio Desync, Missing Texture | 5 (1 full) | 1 | 29 | 25 s |
| 08 | Déjà Vu | 129 | 0% | Déjà Vu, Audio Desync | 5 (1 full) | 1 | 36 | 26 s |
| 09 | Low Res | 133 | 0% | Low Res, Frame Skip | 5 (1 full) | 1 | 32 | 23 s |
| 10 | Double Trouble | 133 | 0% | Ghost Double, Screen Tear | 5 (1 full) | 1 | 35 | 22 s |
| 11 | Mixed Memory I | 138 | 20% | Screen Tear, Input Swap, Missing Texture, Frame Skip, Low Res, Audio Desync | 6 (1 full) | 1 | 43 | 27 s |
| 12 | Mixed Memory II | 138 | 25% | Input Swap, Missing Texture, Ghost Double, Screen Tear, Frame Skip, Low Res | 6 (1 full) | 1 | 46 | 28 s |
| 13 | Mixed Memory III | 144 | 30% | Audio Desync, Input Swap, Invert, Low Res, Missing Texture, Ghost Double | 6 (1 full) | 1 | 40 | 28 s |
| 14 | Mixed Memory IV | 144 | 35% | Frame Skip, Screen Tear, Ghost Double, Input Swap, Audio Desync, Missing Texture | 6 (1 full) | 1 | 36 | 26 s |
| 15 | Mixed Memory V | 144 | 40% | Low Res, Input Swap, Screen Tear, Audio Desync, Frame Skip, Ghost Double | 6 (1 full) | 1 | 37 | 26 s |
| 16 | Not Responding | 144 | 30% | Not Responding, Input Swap | 5 (1 full) | 1 | 28 | 20 s |
| 17 | Upside Down | 150 | 35% | Upside Down, Missing Texture | 5 (1 full) | 1 | 34 | 20 s |
| 18 | Heap Overflow I | 150 | 70% | Screen Tear, Input Swap, Low Res, Missing Texture, Audio Desync, Ghost Double, Frame Skip, Not Responding | 7 (2 full) | 2 | 45 | 28 s |
| 19 | Heap Overflow II | 157 | 80% | Upside Down, Audio Desync, Input Swap, Screen Tear, Not Responding, Low Res, Ghost Double, Missing Texture | 7 (2 full) | 2 | 49 | 26 s |
| 20 | Root | 164 | 60% | Screen Tear, Input Swap, Not Responding, Low Res, Missing Texture | 10 (3 full) | 3 | 43 | 28 s |

"Clips needed" and "Cues" come from the reference run (below): the Clips it makes (one per full scan line) and the moves the sounds and the beat bar announce. Stages are built from the same chunks as endless mode (text, `gen/chunks.ts`), placed by hand (`stages/stages.ts`), with glitches placed over chunks; Root hands you all three charges at the start.

### How the truth is kept

| Anchor | How it tells the truth |
|---|---|
| The simulation | Glitches only ever change what's drawn (the "look") or which button does what (the input layer). A test runs the same inputs with and without the glitches and compares every tick |
| Your shadow | Drawn last, under where you really are, on the surface beneath you: Audio Desync, Ghost Double and Screen Tear can't move it. Only Not Responding (a frozen screen) hides it |
| The cues | A sound one beat before every move the reference run makes (high for a jump, low for a slide, a zap for Clip), scheduled on the audio clock from the run's own ticks, so it's never late whatever the screen does |
| The beat bar | The same cues, drawn along the bottom at the track's own scale (a beat is always 96 px), with "now" under the runner: each one sits under the spot where you make the move |
| The HUD | Input Swap flips the control keys it shows (and the touch labels); it sits on dark plates, so it reads on an inverted screen and in the white void |

### Differences from the draft

- **Canvas 2D, not WebGL.** The scene is drawn to its own canvas, then torn, pixelated, inverted (`difference`), tinted (`hue`), frozen and covered in noise on the way to the screen. The RGB split is drawn into the line art itself (the track's neon edges and the runner come apart) instead of full-screen tinted copies, the scanlines are CSS over the canvas, noise comes in bands, and Kernel Panic's vignette is a small canvas scaled up. A frame takes about 4 ms at 2880 × 1632 in software rendering, and the heaviest stages hold 60 fps on a phone profile with the CPU slowed 4×. If frames still run long (two 2-second stretches under about 45 fps), the renderer steps down by itself: 1.5 device pixels per pixel, then 1 and no noise.
- **A beat is 6 tiles at every tempo.** The runner's speed is 96 px a beat, so its position comes straight from the beat (no drift, ever) and every obstacle sits on the music's grid.
- **A reference run proves everything.** It's a beam search over what a player can do on every half-beat (run, jump, hop, slide, and in chases Clip), using the real simulation (`core/reference.ts`). It proves every chunk can be passed at every endless tempo without glitch power (with and without its hidden platforms), every stage can be cleared (Clip only where a full scan line forces it), and every endless chunk before it's laid: if there's no way through, the chunk is taken back and another tried. Its moves are the cues. Clip states are merged by glitch power in hand (charges and bits), so a stage builds in 0.1–0.6 s, while you read about it in the file browser.
- **The Debugger's scan lines** sweep in from the right over a beat: a low one (jump it), a high one (slide under it) or a full one (Clip through it). The gap is marked in amber. It hovers at the left edge for the chase, its eye charging before each scan.
- **Root's finale** has the three planned phases: the scan lines (three of them full), then The Debugger deletes the ground behind you (only behind you: it's for show), then reformats the screen into a white void with obstacles in it, crossed by the cues and the beat bar. The void clears a beat before the `/root` folder.
- **Endless**: nine tempo steps from 120 to 164 bpm (one every 24 beats), difficulty 1 to 5 (one step every 28 beats), déjà vu from beat 40, corruption creeping 0.4% a beat, and a glitch rolled for every beat from beat 8 (more often with corruption; up to four at once in a Kernel Panic). **Daily Corruption** is seeded by the UTC date (#1 was 1 October 2026), and its best is kept per day.
- **Stage select is a file browser** (`memory://glitch_run/`): `stage_01.exe` to `stage_20.exe`, `endless.exe` and `daily_corruption_NN.exe`. Files you can't run yet still have corrupted names.
- **Rules as built**: ten bits make a charge (three at most); a Clip lasts 0.35 s (a little longer if it ends inside something, then you're patched) and adds 10% corruption; patches take 15% off. The score is distance × (1 + corruption/25), plus near misses (+50), phasing through something (+100) and surviving a Kernel Panic (+5,000), all multiplied. Kernel Panic comes at 100%: survive its ten seconds and corruption drops back to 50%.
- **The ending**: "Yes" fixes the bug: a clean, perfectly working, empty screen (and a button to undo it). "No" is WONTFIX: glitched credits and the Wontfix trophy.
- **Touch**: the right half of the screen jumps and the left half slides (swappable in the options), with ⚡ in the middle. Input Swap swaps them like any button, and the labels say so.
- **Comfort**: the photosensitivity warning comes before the first run, with reduce flashing (the arcade-wide setting: Invert becomes a soft violet tint, warning flickers stay under three a second) and gentle glitches (30%) right there. Reduce motion stops the shake, and Upside Down warns without turning the screen.

### Testing (as built)

- `core/run.test.ts`: the beat grid is exact; jumps, slides, walls, spikes, the void, near misses, bits and charges, Clip and phasing, patches, Kernel Panic, scan lines, the reference search, determinism.
- `glitches/glitches.test.ts`: the director (warnings of at least 0.6 s, at most two at once (four in a panic), the same seed the same glitches, story timing), the golden rule, every look, and the comfort rules (reduce flashing, reduce motion, gentle).
- `gen/chunks.test.ts`: every chunk and déjà vu variant at every endless tempo, with and without hidden platforms. `gen/endless.test.ts`: the same seed makes the same track and cues; five seeds, five minutes each, always a way through; the daily seed.
- `stages/stages.test.ts`: every stage can be cleared, and playing the reference run's moves through the real simulation clears it; cues on beats and half-beats; one new glitch per stage, in the plan's order; every warning at least 0.6 s, never more than two at once; Clip only for full scan lines (Clean Code is possible); Root's finale.
- `core/progress.test.ts`, `save.test.ts`, `audio/audio.test.ts`: records, unlocks and every trophy; the save's schema; every sound short and audible, every cue distinct.
- `tests/e2e/glitch-run.spec.ts`: the warning and the crash into stage 1, PATCHED and instant retry, a held jump (key and touch) over the first spike, pause, the files, endless and the daily, options, on a computer and a phone.
