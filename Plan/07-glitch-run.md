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

- [ ] **M1: Runner core.** Simulation, jump/slide, obstacles, chunk generator, endless mode (no glitches)
- [ ] **M2: Glitch system.** Telegraphs, postfx layer, the first 6 events, corruption + bits + patches + Clip
- [ ] **M3: Story part 1.** Stages 1–10, The Debugger chase
- [ ] **M4: Story part 2.** Remaining events, stages 11–20, Kernel Panic, the ending
- [ ] **M5: Polish.** Comfort settings, visual beat bar, daily seed, achievements
- [ ] **Later:** practice mode, daily challenge links, skins

---

## 14. Definition of Done

- A unit test proves no glitch event changes simulation state.
- Every endless chunk passes the validator.
- Every event warns at least 600 ms ahead.
- With "reduce flashing" on, nothing flashes more than 3 times per second.
- 60 fps on a mid-range phone with postfx on (or the fallback kicks in automatically).
- The same seed always produces the same run.
