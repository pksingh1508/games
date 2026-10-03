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

- [ ] **M1: Satisfying core.** Coverage grid, stroke filling, roller + brush + sponge, progress display
- [ ] **M2: Pix v1.** The switch moment, flee + camouflage, click + net + magnifier + detector, World 1
- [ ] **M3: More tools + tricks.** Mower, shovel, washer; decoys, burrow; World 2
- [ ] **M4: Meta tricks.** Draggable HUD, dead pixel gambit, mimic cursor, DOM escape, tab escape; Worlds 3–4
- [ ] **M5: Finale + polish.** Pix's Revenge, logo ending, achievements, accessibility options
- [ ] **Later:** Zen mode, daily canvas, time attack

---

## 14. Definition of Done

- Every level can reach exactly 100% (tested with a script that covers every cell).
- No `getImageData` calls in the game loop. Progress is always incremental.
- Pix is always findable: detector, magnifier and the "tired" timer all work in every level.
- The favicon and tab title are always restored after the bonus level.
- 60 fps while painting with fast strokes on a mid-range phone.
- Progress and stars survive page reloads.
