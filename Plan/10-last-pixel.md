# Last Pixel

> **"99.99% complete. The last pixel disagrees."**

| | |
|---|---|
| **Genre** | Satisfying clean-up game + hide-and-seek hunt |
| **Core mind trick** | Every level is a relaxing "paint / clean / mow the whole screen" task, until one pixel is left. That pixel is alive, sneaky, and willing to hide anywhere, even outside the game. |
| **Controls** | Drag to use the tool · Tap / click to catch |
| **Session length** | 1–3 minutes per level · 40 levels + finale |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/last-pixel` |
| **Code folder** | `src/games/last-pixel/` |

---

## 1. About the Game

### The pitch
Paint the wall. Mow the lawn. Wipe the window. Scratch the lottery card. It's calm, colourful and *so* satisfying. The progress bar fills: 80%… 95%… 99%… **99.99%**.

One pixel is left. You move to paint it… **and it moves.**

Meet **Pix**, the last pixel. It runs from your cursor. It changes colour to blend in. It hides under the HUD. It pretends to be a dead pixel **on your actual monitor**. It splits into decoys. It escapes the canvas entirely and hides inside the page: in the "%" sign, in the dot on the "i" of the logo. Catch it to hit a true **100%**.

### How it messes with your mind
- **The itch of an unfinished task** (often linked to the *Zeigarnik effect*). 99.99% is unbearable, and the game knows it.
- **Relaxation → panic.** Calm, satisfying play suddenly switches to a frantic chase. The contrast is the joke.
- **The limits of perception.** Pix camouflages itself just barely differently from the background (around the *just-noticeable difference*). You'll squint at your screen.
- **Doubting your own hardware.** *"Wait, is that a dead pixel on my monitor?"* Players genuinely wonder. Then it blinks.

### Inspirations
Satisfying cleaning and painting games (like power-washing and lawn-mowing games), *Progressbar95* (a game about loading bars), *Desktop Goose* (a mischievous creature that messes with your screen), *Where's Waldo?* (hunting in plain sight).

---

## 2. How to Play

### Goal
Get the canvas to **100%**: clean, paint or clear every last pixel, including Pix.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Use the tool (paint, mow, wipe…) | Click + drag | Touch + drag |
| Catch Pix | Click on it | Tap on it |
| Net (draw a box to trap Pix) | Hold `Shift` + drag a rectangle | Select the net tool, then drag a rectangle |
| Magnifier | Mouse wheel / `M` | Pinch / magnifier button |
| Switch hunt tools | `1`–`4` | Tool bar |
| Pause | `Esc` | ⏸ button |

### The core loop (two phases per level)
1. **Phase 1, Clean-up (relaxing):** use the level's tool to cover the whole canvas. Watch the percentage climb.
2. **The switch:** at the final cell, Pix wakes up with a tiny *"!"* and the music changes.
3. **Phase 2, The Hunt (chaos):** find and catch Pix using your hunt tools.
4. **100%!** Big celebration, stars, next level.

---

## 3. Game Mechanics

### Phase 1: Clean-up tools
| Tool | Task | How it feels |
|---|---|---|
| **Paint Roller** | Paint a wall | Wide strokes; slightly slower at the edges |
| **Brush** | Paint details | Small, precise |
| **Sponge** | Wipe a dirty window | Circular strokes clean faster |
| **Scratch Coin** | Scratch a lottery card | Reveals a picture underneath |
| **Lawn Mower** | Mow the grass | Follows your cursor with momentum and a turning circle (you steer it) |
| **Snow Shovel** | Clear a driveway | Pushes snow into piles you must clear too |
| **Pressure Washer** | Clean a dirty patio | Narrow, powerful jet |
| **Eraser** | Erase a doodle | Classic |

- The canvas is a grid of **coverage cells** (for example 160 × 90). A "pixel" in this game means one cell, drawn as a chunky square.
- **Progress** = covered cells ÷ total cells. The display adds decimals as you get closer: 99% → 99.9% → 99.99% → 99.993%.

### Phase 2: Pix's behaviours
Pix gets new tricks as the worlds go on:

| Behaviour | What Pix does | How to beat it |
|---|---|---|
| **Flee** | Runs away from your cursor | Corner it against the canvas edge, or use the Net |
| **Camouflage** | Changes colour to be *almost* the same as the background | It shimmers every 2 seconds; the Magnifier exaggerates the contrast |
| **Decoys** | Splits into 5 copies; only one is real | The real one blinks in time with the music |
| **Hide Under HUD** | Slips under the progress bar or the pause button | The HUD panels are **draggable**. Move them |
| **Dead Pixel Gambit** | Freezes and pretends to be a stuck pixel on your monitor | Pause the game: a real dead pixel would stay on the pause screen, but Pix disappears |
| **Repaint Trail** | Un-paints cells as it runs (99.99% → 99.5%) | Chase it while fixing the trail behind it |
| **Burrow** | Hides *under* the paint layer | The Sponge / Scratch tool reveals it |
| **Mimic Cursor** | Disguises itself as the tip of a second mouse cursor | Move your mouse: the fake cursor moves wrong |
| **Escape the Canvas** | Leaves the game area and hides inside the page: the "%" text, a button, the dot on the "i" in the logo | A hint arrow points off-canvas; click it where it hides |
| **Tab Escape** (bonus level only) | Jumps into the browser tab's favicon | Switch to another tab and come back. It gets scared and falls back into the canvas |

### Hunt tools
| Tool | What it does | Uses |
|---|---|---|
| **Click / tap** | Catch Pix directly (generous hit radius) | Unlimited |
| **Net** | Draw a rectangle. If Pix is inside when you let go, it's caught. Pix dodges if you draw slowly | 3 per level |
| **Magnifier** | A 2× lens that follows the cursor and boosts contrast, revealing camouflage | Unlimited, but slows you down |
| **Bait** | Place a shiny pixel; Pix can't resist and comes closer for 2 seconds | 1–2 per level |
| **Freeze** | Stops Pix for 1 second | 1 per level |
| **Pixel Detector** (always on) | A beeping that speeds up as your cursor gets closer to Pix, plus a visual radar ring | Always on |

### Pix gets tired
- After **30 seconds** of hunting, Pix slows down and pulses gently.
- After **60 seconds**, Pix gives up and sits still with a tiny *"fine."* speech bubble.
- **There's no fail state.** The hunt is about speed and style, not survival.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Last 0.01%** | The last pixel is the easiest | It's alive | A tiny "!" pops up above it |
| **Not My Monitor?** | That's a dead pixel on my screen | It's Pix | It vanishes when you pause |
| **Almost Invisible** | A finished wall | Pix is the same colour, give or take 2% | Shimmers every 2 seconds |
| **Hide and HUD** | The HUD is just UI | Pix is under it | The HUD panel wobbles slightly |
| **Spot the Real One** | All 5 pixels are the same | Only one is real | It blinks on the beat |
| **Going Backwards** | Progress only goes up | Pix un-paints as it runs | The trail it leaves behind |
| **Outside the Box** | The game stays in the canvas | Pix hides in the page itself | A hint arrow at the canvas edge |
| **The Logo** | The logo is decoration | The dot on the "i" in "Last Pixel" is missing from the start… Pix took it | You can see it's missing on the title screen |
| **Two Cursors** | You only have one cursor | One of them is Pix | It doesn't follow your hand exactly |

---

## 5. Levels & Progression

### Worlds
| World | Name | Tools | Pix's new tricks |
|---|---|---|---|
| 1 | **Home Makeover** | Roller, brush, sponge | Flee, camouflage |
| 2 | **Garden Day** | Mower, snow shovel, pressure washer | Decoys (among fireflies), burrow |
| 3 | **Desktop Cleanup** | Eraser, sponge (wipe smudges off a "screen") | Dead pixel gambit, hide under HUD, mimic cursor |
| 4 | **Outside the Box** | All tools | Escape the canvas, repaint trail, the bonus tab escape |
| ★ | **Pix's Revenge** | All | Everything at once |

Each world has 10 levels.

### The finale: Pix's Revenge
- Pix starts **un-painting the entire canvas**, and you have to repaint while chasing it.
- When it's the last pixel again, it uses all its tricks in sequence. Catch it 3 times.
- **Ending:** caught for good, Pix floats up to the title logo and settles into its place as **the dot on the "i"**. *"It finally knows where it belongs."* The logo is complete.

---

## 6. Features

### MVP (must-have)
- The coverage system + 4 tools (roller, brush, sponge, mower)
- Pix with flee, camouflage, decoys and hide-under-HUD
- Hunt tools: click, net, magnifier, pixel detector
- World 1 + World 2 (20 levels)
- Stars and save progress

### Full version
- All 8 tools and all Pix behaviours
- Worlds 3–4 + the finale (41 levels)
- Draggable HUD, DOM escapes, dead-pixel gambit, tab escape bonus level
- Achievements

### Later
- **Zen mode:** just the satisfying part, no Pix (pure relaxation)
- **Daily canvas:** one new picture to uncover every day
- **Time attack:** fastest 100% on each level

---

## 7. Scoring, Rewards & Replay Value

### Stars per level
- ★ Reach 100%
- ★★ Finish the clean-up under the target time
- ★★★ Catch Pix in under 10 seconds

### Achievements
| Achievement | How to get it |
|---|---|
| **Perfectionist** | 3-star every level in a world |
| **Gotcha** | Catch Pix in under 2 seconds |
| **Not My Monitor** | Expose the dead pixel gambit by pausing the game |
| **Net Worth** | Catch Pix with the Net 25 times |
| **Logo Complete** | Finish the finale |
| **Tab Hunter** | Catch Pix in the tab escape level |

---

## 8. Screens & UI

1. **Title:** "Last P**ı**xel", with the dot on the "i" missing. (Pix has it.)
2. **World select / level select:** the levels shown as small finished pictures (or as blank canvases when not yet done).
3. **Gameplay:**
   - The canvas
   - **HUD:** progress % (top), tool bar (bottom), hunt tools (appear in Phase 2)
   - HUD panels can be dragged in Phase 2
4. **100% celebration:** confetti, the final picture glowing, stars.
5. **Settings:** volume, magnifier strength, hunt assist, reduce motion, colourblind options.

---

## 9. Art & Audio Direction

### Visuals
- Soft, colourful, "satisfying" style: thick paint, wet sheen on washed surfaces, fresh lines in mowed grass.
- Every finished canvas reveals a cute illustration (a cosy room, a garden, a city view), so 100% always feels like a reward.
- **Pix:** a single glowing pixel. When you use the magnifier it shows a tiny 3×3 face with two eyes. Cheeky, never mean.
- Chunky, visible pixels (canvas cells are drawn with nearest-neighbour scaling, so they stay crisp).

### Audio
- **Phase 1:** calm, ASMR-like sounds: roller squish, mower hum, sponge squeak, scratch.
- **The switch:** the music cuts, there's a tiny *"!"* sound, then playful chase music starts (plucked strings, quick tempo).
- **Pix:** giggles and chirps when it escapes; a defeated *"aww"* when caught.
- **Pixel detector:** a metal-detector beep that speeds up as you get closer.

---

## 10. Fairness Rules

1. **No fail state in the hunt.** Pix gets tired after 30 s and gives up at 60 s.
2. **Always a way to locate Pix:** the pixel detector (audio + visual ring) is always on.
3. **Camouflage is beatable:** the Magnifier always makes Pix clearly visible.
4. **DOM escapes always show a hint arrow.** The hunt never requires leaving the page.
5. **The tab escape is a bonus level only**, never needed to finish the game.
6. **Generous catch radius** (bigger on touchscreens).
7. **Each new behaviour is introduced on its own** before being combined with others.

---

## 11. Accessibility & Comfort

- **Hunt assist:** Pix moves slower, shimmers more often, and the catch radius is bigger.
- **Colourblind-friendly camouflage:** camouflage is based on brightness differences, not only hue, and the shimmer helps.
- The pixel detector has both audio and visual feedback.
- **Reduce motion:** no screen shake, softer celebration.
- Zen mode (later) for players who just want the relaxing part.
- One-handed play on mobile.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** with layers:
  1. **Scene layer:** the illustration underneath
  2. **Paint/dirt layer:** an offscreen canvas at grid resolution (e.g. 160 × 90), drawn scaled up with `imageSmoothingEnabled = false` (CSS `image-rendering: pixelated` on the canvas element)
  3. **Pix + effects layer**
- **Coverage:** a `Uint8Array(160 * 90)`. Tools "stamp" their footprint into it. A running `coveredCount` goes up whenever a cell flips from 0 to 1, so progress never needs a full scan, and we **never** call `getImageData` every frame.
- **Smooth strokes:** fast mouse movements are filled in by stepping along the line between pointer samples (so no gaps). Where supported, `getCoalescedEvents()` gives extra samples.
- **Pix AI:** a small state machine per behaviour (wander, flee, hide, camouflage, decoy, escape). Flee uses a distance field from the cursor. Each level lists Pix's hiding spots.
- **DOM escape:** when Pix leaves the canvas, it becomes a tiny fixed-position `<div>` over the page. Page elements it can hide in are marked with a `data-pix-spot` attribute, and positions come from `getBoundingClientRect()`.
- **Favicon / title** (bonus level only) via `engine/browser`, always restored when the level ends or the player leaves.
- **Visibility API** for the tab escape ("look away and it comes back").

### Data model
```ts
type Task = "paint" | "mow" | "wipe" | "scratch" | "shovel" | "wash" | "erase";
type ToolId = "roller" | "brush" | "sponge" | "scratch" | "mower" | "shovel" | "washer" | "eraser";
type PixBehaviour =
  | "flee" | "camouflage" | "decoys" | "hideUnderHud" | "deadPixel"
  | "repaintTrail" | "burrow" | "mimicCursor" | "escapeDom" | "tabEscape";

interface LevelDef {
  id: string;                        // "2-07"
  world: 1 | 2 | 3 | 4 | 5;
  task: Task;
  tool: ToolId;
  picture: string;                   // the illustration revealed at 100%
  grid: { w: number; h: number };    // e.g. 160 × 90
  mask?: string;                     // which cells count (e.g. the wall, not the window)
  pix: {
    behaviours: PixBehaviour[];
    speed: number;                   // cells per second
    hideSpots?: { x: number; y: number }[];
    domSpots?: string[];             // ids of page elements it can hide in
  };
  huntTools: { net?: number; bait?: number; freeze?: number; magnifier?: boolean };
  targetTimeMs: number;              // clean-up star
}
```

### Folder structure
```
src/games/last-pixel/
  index.tsx
  coverage/
    grid.ts  stamp.ts  stroke.ts       # coverage grid, tool footprints, line stepping
  tools/
    roller.ts  brush.ts  mower.ts  …
  pix/
    brain.ts                            # behaviour state machine
    behaviours/  flee.ts  camouflage.ts  decoys.ts  dom-escape.ts  …
  hunt/
    net.ts  magnifier.ts  bait.ts  detector.ts
  levels/
    world-1.ts … world-4.ts  finale.ts
  ui/
    Hud.tsx  DraggablePanel.tsx  ToolBar.tsx  Celebration.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| The "dead pixel" and DOM tricks confuse rather than delight | Introduce each in a dedicated level with a clear hint; playtest |
| Small screens make Pix too hard to see | Bigger catch radius + stronger shimmer on touch devices; hunt assist |
| Coverage bugs (100% never reached) | Unit tests for stamping and counting; a debug overlay showing uncovered cells |

---

## 13. Build Roadmap

- [x] **M1: Satisfying core.** Coverage grid, stroke filling, roller + brush + sponge, progress display
- [x] **M2: Pix v1.** The switch moment, flee + camouflage, click + net + magnifier + detector, World 1
- [x] **M3: More tools + tricks.** Mower, shovel, washer; decoys, burrow; World 2
- [x] **M4: Meta tricks.** Draggable HUD, dead pixel gambit, mimic cursor, DOM escape, tab escape; Worlds 3–4
- [x] **M5: Finale + polish.** Pix's Revenge, logo ending, achievements, accessibility options
- [ ] **Later:** Zen mode, daily canvas, time attack

---

## 14. Definition of Done

- Every level can reach exactly 100% (tested with a script that covers every cell).
- No `getImageData` calls in the game loop. Progress is always incremental.
- Pix is always findable: detector, magnifier and the "tired" timer all work in every level.
- The favicon and tab title are always restored after the bonus level.
- 60 fps while painting with fast strokes on a mid-range phone.
- Progress and stars survive page reloads.

---

## 15. As Built

Last Pixel is playable at `/games/last-pixel/play`. It has:

- 40 levels in four worlds, then the finale, Pix's Revenge;
- all eight clean-up tools;
- all ten of Pix's behaviours;
- the click, the net, the magnifier, bait, freeze and the pixel detector;
- stars, best times and six achievements;
- hunt assist, the magnifier's strength, the detector's beeps and reduce motion;
- the ending, where Pix becomes the dot on the logo's "i", with a share line.

Everything is made in code, with no asset files:

- **Art:** the pictures are pixel art drawn cell by cell (rooms, windows, lawns, driveways, patios, lottery cards, a computer's desktop). The tools and Pix are sprites.
- **Music:** calm music for the clean-up, a 120 bpm chase for the hunt, and a menu tune.
- **Sounds:** each tool's own voice (filtered noise that follows how hard you're working), and ZzFX effects.

It reuses `engine/loop`, `engine/sprites`, `engine/rng`, the audio engine and sound bank, and `games/shared`.

It adds to the shared engine:

- `engine/browser/tab.ts`: borrow the tab's title and icon, always give them back, and know when the player looks away.
- An export of the pixel font's glyphs, so pictures can carry words.

### The levels

The canvas is 128 × 72 cells. The clean-up star's target is the bot's own clean-up plus 30%, rounded up to half a second (`levels/targets.ts`).

| Level | Name | Tools | Pix | Target |
|---|---|---|---|---|
| 1-01 | Fresh Coat | Roller | Flees (slowly) | 33.5 s |
| 1-02 | Around the Window | Roller | Flees · the net | 33.5 s |
| 1-03 | Trim | Brush | Flees | 47.5 s |
| 1-04 | Spring Clean | Sponge | Flees | 69 s |
| 1-05 | Magnolia | Roller | **Camouflage** on its own · the magnifier | 33.5 s |
| 1-06 | Nursery | Roller | Flees, camouflaged | 33.5 s |
| 1-07 | Bay Window | Sponge | Flees, camouflaged | 69 s |
| 1-08 | Feature Wall | Roller | Flees, fast | 33.5 s |
| 1-09 | Picture Rail | Brush | Flees, camouflaged | 57.5 s |
| 1-10 | Open House | Roller, sponge | Flees, camouflaged | 44.5 s |
| 2-01 | Front Lawn | Mower | Flees · freeze | 88 s |
| 2-02 | First Snow | Shovel | Flees | 48 s |
| 2-03 | Patio Day | Washer | Flees · bait | 56 s |
| 2-04 | Fireflies | Mower (at dusk) | **Decoys** on their own, among fireflies | 88 s |
| 2-05 | Moss | Washer | **Burrows** | 56 s |
| 2-06 | Stripes | Mower | Flees, with decoys | 88 s |
| 2-07 | Snowed In | Shovel | Flees, burrows | 54 s |
| 2-08 | Garden Path | Washer | Flees, with decoys | 56 s |
| 2-09 | Night Mow | Mower (at night) | Decoys, burrows | 88 s |
| 2-10 | Garden Party | Mower, washer | Flees, decoys, burrows | 104 s |
| 3-01 | Doodle | Eraser | Flees | 37 s |
| 3-02 | Smudges | Sponge | **Under the HUD** | 76 s |
| 3-03 | Stuck Pixel | Eraser | **A dead pixel** | 35.5 s |
| 3-04 | Two Cursors | Sponge | **A second cursor** (mirrored left–right) | 60.5 s |
| 3-05 | Wallpaper | Eraser | Flees, under the HUD | 37.5 s |
| 3-06 | Screensaver | Sponge | Camouflaged, a dead pixel | 59.5 s |
| 3-07 | Desktop Icons | Eraser | Flees, a second cursor (mirrored up–down) | 38.5 s |
| 3-08 | Fingerprints | Sponge | Flees, decoys, under the HUD | 60.5 s |
| 3-09 | Blue Screen | Eraser | Flees, a dead pixel, a second cursor | 38.5 s |
| 3-10 | Clean Install | Eraser, sponge | Flees; the HUD, a dead pixel, a second cursor | 120.5 s |
| 4-01 | Lucky Pixel | Scratch coin | Flees, **out of the canvas** (into the "%") | 72 s |
| 4-02 | Wet Paint | Roller | Flees, **un-paints a trail** | 33.5 s |
| 4-03 | Logo | Shovel | Flees, into the logo's "i" | 55.5 s |
| 4-04 | Undo | Washer | Flees, camouflaged, a trail | 56 s |
| 4-05 | Toolbar | Scratch coin | Decoys, onto the pause button | 79 s |
| 4-06 | Backwards | Sponge | Flees, a trail, under the HUD | 69 s |
| 4-07 | Jackpot | Scratch coin | Flees, a dead pixel, out of the canvas | 72 s |
| 4-08 | Snow Day | Shovel | Flees, a trail, burrows | 62.5 s |
| 4-09 | Everything | Roller, sponge | Flees, a trail, the HUD, out of the canvas | 41.5 s |
| 4-10 | Tab Escape (bonus) | Sponge | Flees, **into the tab** | 69 s |
| ★ | Pix's Revenge | Roller, brush | See below | 51 s |

**Bold** marks a trick's first appearance: each comes in on its own, and only running away goes with it. The hunt tools come in the same way: the net at 1-02, the magnifier at 1-05, freeze at 2-01, bait at 2-03. Every camouflage level has the magnifier.

The finale works like this:

1. **Revenge:** the wall has "LAST PıXEL" painted on it. Pix tears through 2,600 cells of it while you repaint, and can't be caught while it does ("not yet!").
2. **The dive:** it dives into the gaps and is the last pixel again once you've repainted.
3. **Three catches:** it has to be caught three times. First it flees camouflaged and leaves a trail. Then it flees with four decoys and hides under the HUD. Last, it plays a dead pixel, then a second cursor, then escapes into the logo's "i". That's where it belonged all along.
4. **The ending:** the ending screen flies Pix up into the logo's "i". From then on the logo has its dot everywhere.

### How the truth is kept

| Lie | The tell |
|---|---|
| The last 0.01% | A "!" over it, and the music cuts |
| Camouflage | Within 2% of the background's brightness (brightness, not hue, so it's the same trick for every eye), with a shimmer every 2 s (every second when tired, or with the assist). The magnifier boosts local contrast, so nothing blends in under it, and shows Pix's face |
| Decoys | The real one blinks on every beat of the chase music; decoys blink when they like, and ignore bait |
| Under the HUD | The panel wobbles (or gets a dashed outline, with reduce motion); drag it aside |
| A dead pixel | A pin-prick of pure green somewhere off the canvas. Pause, and it's gone: a real one would still be there |
| A second cursor | It moves mirrored to your hand; touch it with yours and it drops the act |
| Burrowed | The detector beeps faster as you get close; any stroke of your tool over it digs it out |
| Out of the canvas | An arrow at the canvas's edge points to it (in the "%", the logo's "i", on the pause button) |
| Into the tab | The tab's title and icon become Pix; look away and come back |
| The repaint trail | The trail it leaves is plain to see, and the progress goes down |
| Always | The detector's ring round your pointer turns hot and pulses faster as you get close; Pix tires at 30 s and gives up at 60 s ("fine."), coming out of any hiding place |

### Differences from the draft

- **Coverage is 0–255 per cell, not 0/1.** So the sponge and the scratch coin reveal a little at a time, and the roller's edges only part-paint, so strokes want to overlap ("slower at the edges"). A cell counts once it's full, and the count is kept as cells fill. Nothing ever scans the canvas's pixels: the renderer puts only the changed box of cells.
- **The last cell can't be covered by a tool.** When a stroke would finish everything at once, the last cell it reaches refuses. That's Pix. Near the end (98.5%), the cells you missed sparkle.
- **The grid is 128 × 72**, chunkier than the draft's 160 × 90, so Pix and the art read on a phone.
- **The tools as built:**
  - the roller is wide with soft edges;
  - the brush is small;
  - the sponge wipes at a fixed rate per cell, up to 2.6× faster when you circle or scrub;
  - the scratch coin's reveal is speckled;
  - the mower drives itself towards your pointer, with momentum and a turning circle, and stripes the lawn by the way it went;
  - the shovel's load is capped; push it off the drive (onto the lawn) or it's left as a heap where you let go;
  - the washer has a narrow full-strength jet in a fine mist;
  - the eraser only works on doodles.
- **Pix's traits and tricks are separate:**
  - Traits are always on: fleeing, camouflage, decoys, the repaint trail.
  - Tricks come one at a time, in order. Each lasts until you see through it, then Pix is stunned for 1.3 s and runs free for 4 s before the next.
- **Fleeing as built:**
  - Pix runs from your cursor within 15 cells, faster the closer you get, and dodges sideways when you're right on it.
  - It gets winded after a few seconds of hard running (which isn't in the draft), so cornering it or chasing it down works.
- **Waking:** when Pix wakes it can't be caught during its "!" (1.1 s) or the quick dash that follows (under a second).
- **Burrowing:** any tool digs Pix out, not only the sponge or scratch coin, since World 2 has neither.
- **The mimic** moves by your movement, mirrored left–right or up–down. Walk towards it along the mirrored axis, and pin it against an edge for the other.
- **The net** is three per level and catches whatever's inside when you let go. Draw it for more than half a second and Pix slips out.
- **Bait:** Pix rushes to it for 2 seconds (decoys don't care).
- **Freeze** stops everything for a second.
- **The magnifier** is a lens about 22 cells across that trails your hand a little ("it slows you down"). Its strength (2×, 3× or 4×) is in Options.
- **The HUD** is three panels over the canvas: progress, tools, pause.
  - They're draggable at any time by their grip, and anywhere on the panel during the hunt.
  - While you paint, they fade and let your strokes through, so you can see what's under them.
- **The play screen covers the whole window** (the site's header too), so the canvas gets every pixel. "The page" Pix escapes into is the game's own logo bar and HUD.
- **Level 4-10 is the bonus.** It's the tab escape, and the finale opens once 4-09 is done. The scratch coin first appears in World 4, which is where the draft's world table first lists all the tools.
- **Hunt assist:** the third star (Pix in under 10 seconds) and Gotcha need it off.
- **Colour-blind players:** no separate option is needed, because camouflage is by brightness for everyone.
- **Performance:** fast strokes and the busiest hunts (fireflies, five glowing pixels, the lens) hold 60 fps on a phone profile with the CPU slowed 4×.
- **Not built yet** (Later): Zen mode, the daily canvas, time attack.

### The bot

Every level is played through by a bot made of code (`core/bot.ts`), using the real simulation:

- **The clean-up:** rows across each job at a steady hand's speed, scrubbing zig-zags for the sponge, and two passes for the scratch coin. It steers the mower with a carrot held about 8 cells ahead, and pushes snow off the nearer edge of the drive. Then it mops up whatever's left.
- **The hunt:** it plays like a person:
  - it sees Pix a fifth of a second late and half-guesses where it's going;
  - its hand accelerates to about 70 cells a second, and it pauses between clicks;
  - it only sees a camouflaged Pix when it shimmers or is under the lens, and takes a couple of beats to pick the real one out of the decoys;
  - it drags the wobbling panel, pauses on a dead pixel, pins a mimic, follows the arrow, and looks away from the tab.
  - With the net and freeze it usually catches Pix in 2 to 9 seconds; without them, in 3 to 13.
- **Targets:** `UPDATE_TARGETS=1 pnpm vitest run src/games/last-pixel/levels/runs.test.ts` re-plays every level's clean-up and rewrites the targets.

### Testing (as built)

- **`core/coverage.test.ts`** covers:
  - the running count always matching a full scan;
  - each tool only working on its own job;
  - the last cell refusing;
  - un-doing and re-doing cells;
  - the dirty box.
- **`core/tools.test.ts`** covers:
  - no gaps in a flick, and the same paint for the same path at any speed;
  - the roller's edges, the sponge's scrubbing and circling, the speckled scratch, and the washer's jet and mist;
  - the mower's momentum, turning circle, coasting and stripes;
  - the shovel's load, its dump off the drive, the heap where you let go, and a full blade.
- **`core/world.test.ts`** covers:
  - the switch and the progress display;
  - "!" and the dash;
  - catching and missing, fleeing, the net (quick and slow), freeze and bait, the stars;
  - tiring and giving up;
  - camouflage (2% and the shimmer), decoys (only the real one keeps the beat), the trail;
  - every trick and how it's seen through;
  - the finale;
  - determinism.
- **`core/progress.test.ts` and `save.test.ts`** cover stars, best times, every trophy, the unlock order (the bonus is optional), and the save's schema.
- **`levels/levels.test.ts`** checks:
  - four worlds of ten, then the finale;
  - every picture is a full canvas, and the job visibly changes it;
  - the bot cleans up every level within its own target and catches Pix, for exactly 100%;
  - each trick comes in on its own, in the order above;
  - the hunt tools arrive a level at a time, and there's a magnifier wherever Pix camouflages;
  - page spots exist;
  - only the bonus uses the tab;
  - the finale is shaped as described.
- **`levels/runs.test.ts`** checks there's a target for every level.
- **`engine/browser/tab.test.ts`** checks:
  - the title and every icon are borrowed and put back exactly;
  - an icon is added and removed when there's none;
  - what the site changed in the meantime is left alone;
  - everything comes back when the page goes away;
  - looking away and back is noticed.
- **`games/progress.test.ts`** checks the cabinet's summary.
- **`tests/e2e/last-pixel.spec.ts`** covers, on a computer and a phone:
  - the logo's missing dot;
  - painting the whole of Fresh Coat with real mouse strokes until the last pixel wakes, then finding Pix on the canvas and clicking it for a saved 100%;
  - Esc pausing;
  - the levels opening in order;
  - options being saved;
  - a finger painting on a phone.
