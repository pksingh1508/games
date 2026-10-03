# Cursor Escape

> **"You are the cursor. The computer wants you deleted."**

| | |
|---|---|
| **Genre** | Mouse-precision maze / dodge game (retro desktop theme) |
| **Core mind trick** | You control the cursor, but the game controls what it looks like, where it appears, how it moves, and whether it's even yours |
| **Controls** | Mouse (desktop, with Pointer Lock) · Touch "trackpad" mode (mobile) |
| **Session length** | 30 seconds to 2 minutes per level · 40 levels |
| **Platforms** | Desktop (best) & mobile browsers |
| **Route** | `/games/cursor-escape` |
| **Code folder** | `src/games/cursor-escape/` |

---

## 1. About the Game

### The pitch
You are the mouse pointer inside **DeskOS 98**, a cranky old (fictional) operating system. It has decided you're "unresponsive hardware" and wants to uninstall you.

Each level is a window you're trapped in. Guide the cursor from its starting point to the window's **[X] close button** without touching the walls, the pop-ups, the spinning loading wheel or the antivirus scanner. Close the window, and you've escaped it.

Then the OS fights back. It **inverts** your movement. It adds **lag**. It hides your cursor and shows a **fake one** a few pixels away. It spawns **decoy cursors** that copy your moves, so you have to work out which one is you. And as you move over text, links and window edges, your cursor **changes shape**, and every shape has its own rules.

### How it messes with your mind
- **Visuomotor adaptation.** Your brain can learn inverted controls in a few seconds, and then it's confused when they switch back (the same effect as experiments with mirror drawing and prism glasses).
- **Sense of agency.** *"Which of these cursors is me?"* Psychologists study exactly this question. Here it's a game mechanic.
- **Fitts's law.** Small, far-away targets are harder to hit. The game shrinks and moves the [X] button to exploit this.
- **The hand you trust most.** The mouse pointer is something you control without thinking. This game makes you think about it.

### Inspirations
*Cursor\*10* (cursor-based puzzles), *The World's Hardest Game* (precise dodging), the old "mouse maze" games (without the jump scare), *Windowkill* (windows as the arena), *Desktop Goose* (a creature that messes with your cursor), retro OS aesthetics.

---

## 2. How to Play

### Goal
Reach the window's **[X]** close button and click it.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Move the cursor | Move the mouse (the game captures it with Pointer Lock) | **Trackpad mode:** drag anywhere on the screen; the cursor moves relative to your finger |
| Click ([X], buttons) | Left click | Tap |
| Pause / release the mouse | `Esc` | ⏸ button |
| Restart level | `R` | ⟳ button |

> On desktop the game uses **Pointer Lock**: the real cursor is hidden and captured, and the game draws its own. Browsers show their own "Press Esc to show your cursor" message. `Esc` always works.

### The core loop
1. **Click to start** (this captures the mouse).
2. **Navigate** the cursor through the window's maze.
3. **Adapt** to sabotage as notifications announce it.
4. **Touch something** → crash → instant restart.
5. **Click the [X]** → window closes → next level.

---

## 3. Game Mechanics

### The hitbox
The cursor's hitbox is a small circle (3 px radius) at the **tip** of the arrow, the point that clicks. Walls are drawn with clear, solid borders.

### Cursor shapes = movement rules
As the cursor moves over different areas, its shape changes, just like on a real computer. Here, **each shape changes the rules**:

| Cursor shape | Triggered by | Rule |
|---|---|---|
| ↖ **Arrow** | Normal areas | Normal movement |
| **I** **I-beam** | Text areas | Hitbox becomes tall and thin. Fits through narrow vertical slots, but not horizontal ones |
| ↔ **Resize (horizontal)** | Left/right window edges | Can only move left and right |
| ↕ **Resize (vertical)** | Top/bottom window edges | Can only move up and down |
| 👆 **Hand** | Hyperlinks | Pulled toward links like a magnet |
| ⏳ **Busy** | "Loading" zones | Frozen for 1–2 seconds while hazards keep moving |
| ✛ **Crosshair** | Precision zones | Moves at half speed (careful and precise) |
| 🚫 **Not allowed** | Restricted zones | Pushed out of the zone |
| ✊ **Grab** | Draggable windows | You're dragging a window, which moves with you and can bump into things |

### Hazards
| Hazard | Behaviour |
|---|---|
| **Pop-ups** | "YOU WON!!!" style boxes that bounce around the window |
| **Loading Spinner** | Chases the cursor slowly |
| **Recycle Bin** | Pulls you in like a black hole |
| **Selection Box** | A marquee rectangle that closes around you |
| **"Are You Sure?" dialogs** | Their buttons swap places when you get close |
| **Antivirus Scan Line** | Sweeps across the whole screen. Hide behind "safe" files |
| **Notifications** | Slide in from the corner and block your path |
| **Icons** | Open a new window when you touch them (new walls appear) |

### Sabotage (the OS messing with you)
Every sabotage is announced by a **system notification** (e.g. *"🖱 Mouse settings updated ✓"*) at least 0.75 s before it starts.

| Sabotage | Effect | Lasts |
|---|---|---|
| **Invert** | Left is right, up is down (one or both axes) | 6–15 s |
| **Rotate** | Movement rotated by 90° | 6–15 s |
| **Lag** | The cursor follows your hand with a delay (smoothing) | 5–10 s |
| **Sensitivity** | Suddenly very fast, or very slow | 5–10 s |
| **Drift** | The cursor slowly drifts on its own | 5–10 s |
| **Fake Cursor** | Your real cursor becomes invisible; a fake one appears offset from it | 5–10 s |
| **Decoys** | 3–4 cursors appear, each moving with a different transformation of your hand | 6–12 s |
| **Large Cursor** | "Accessibility settings changed": the cursor (and its hitbox) is huge | 5–10 s |
| **Solid Trail** | "Pointer trails enabled": your trail becomes a wall you can't cross (like the snake game) | 5–10 s |
| **Recentre** | "For your convenience", the cursor jumps to the centre of the window | Instant |

**How to find yourself** during Fake Cursor and Decoys: the real cursor always has a faint **glow at its tip**, and wiggling your hand reveals which cursor moves exactly 1:1 with you.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **Mirror Hand** | Move right, go right | You go left | The arrow is drawn mirrored |
| **Aftereffect** | Back to normal is easy | Your brain keeps inverting for a few seconds | — (it's your own brain) |
| **Who Am I?** | You're the only cursor | 4 cursors, only one is you | The real one moves 1:1 and its tip glows |
| **The Ghost** | The visible cursor is you | It's a fake, offset from the real you | Walls react to the real (invisible) one with tiny sparks |
| **Trail of Doom** | Pointer trails are just pretty | Your trail is a wall | The trail is drawn solid, not faded |
| **Swapping Buttons** | "Yes" stays where it is | The buttons swap when you approach | They shiver before swapping |
| **Helpful Recentre** | The OS is helping | It teleports you back to the start area | A notification says "for your convenience" |
| **The Shrinking [X]** | The close button stays the same size | It shrinks as you approach (Fitts's law) | Its border pulses |
| **Freedom** | The final level's [X] closes a window | It closes the OS, and the game hands you back your real cursor | — (the ending) |

---

## 5. Levels & Progression

### Drives (worlds)
| Drive | Name | Levels | Focus |
|---|---|---|---|
| **C:\\** | **Desktop** | 10 | Basics: walls, pop-ups, icons, I-beam and hand shapes |
| **D:\\** | **Control Panel** | 10 | Mouse settings sabotage: invert, sensitivity, lag, large cursor, trails |
| **E:\\** | **Internet** | 10 | Pop-up ads, links that pull, download bars that chase, a CAPTCHA ("Click all the cursors.") |
| **F:\\** | **System32** | 10 | Decoys, fake cursor, busy freezes, the antivirus, the final boss |

### Example levels
- **C:\\-01 "My First Window":** a simple maze, a single pop-up. Click the [X].
- **C:\\-05 "Read Me":** a narrow vertical slot inside a text box. Only the I-beam fits through.
- **D:\\-03 "Mouse Properties":** the mouse settings window itself. Every time you touch a checkbox, a setting changes ("Swap left/right" → Invert).
- **E:\\-07 "Too Many Tabs":** you have to close 5 pop-up ads in a specific order while links pull you around.
- **F:\\-09 "Which One?":** four cursors, a narrow path, and one of them is you.

### Final boss: The Uninstaller
- A giant progress bar reads *"Uninstalling Cursor… 0%"* and slowly fills.
- Each time you close one of its dialog windows (by reaching their [X]s), it drops by 20%.
- At the end, the last [X] closes **DeskOS 98 itself**. The screen goes dark, the game **releases Pointer Lock**, and your real cursor appears in the middle of the screen with a message: *"You're free."*

---

## 6. Features

### MVP (must-have)
- Pointer Lock cursor with custom rendering
- Wall collision (with swept checks, so fast movements can't skip through walls)
- Cursor shapes: arrow, I-beam, resize, hand, busy
- 4 sabotage types (invert, lag, sensitivity, fake cursor)
- C:\\ and D:\\ drives (20 levels)
- Mobile trackpad mode
- Sensitivity calibration

### Full version
- All cursor shapes, hazards and sabotage types
- E:\\ and F:\\ drives (40 levels) + The Uninstaller + ending
- Achievements, best times

### Later
- **Level editor** (levels are simple JSON)
- **Daily window:** a new level every day
- **Two-cursor co-op:** two mice on one PC (an experimental idea)

---

## 7. Scoring, Rewards & Replay Value

- **Per level:** time + crashes, with medals for time.
- **Drive score:** total time and total crashes.
- **Share card:** *"I escaped DeskOS 98 in 23:41 with 212 crashes. My hand still feels inverted."*

### Achievements
| Achievement | How to get it |
|---|---|
| **Steady Hand** | Finish a drive with no crashes |
| **Ambidextrous** | Finish 5 inverted sections without crashing |
| **Identity Crisis** | Pick the right cursor out of 4 decoys within 1 second |
| **Speed Clicker** | Finish C:\\-01 in under 3 seconds |
| **Uninstall Denied** | Defeat The Uninstaller |
| **Free at Last** | See the ending |

---

## 8. Screens & UI

1. **Title:** a retro boot screen ("DeskOS 98 — starting up…"). *"Click to capture the mouse."*
2. **Desktop (level select):** drive icons on a retro desktop. Opening a drive shows its levels as files.
3. **Level:** a retro window with a title bar and the [X]; the maze inside. Notifications appear in the corner.
4. **Crash:** a short "error" bonk sound and a quick shake; instant restart.
5. **Level complete:** the window closes with a satisfying animation, plus time and medal.
6. **Settings:** sensitivity, trackpad mode, steady mode, large hitbox assist, reduce motion, volume.

---

## 9. Art & Audio Direction

### Visuals
- **Retro desktop style:** grey bevelled windows, blue title bars, pixel icons, a teal desktop background. Fictional and original: DeskOS 98 is its own thing, never a copy of a real OS.
- The cursor is crisp and always clearly visible (with a subtle outline, so it shows on any background).
- Hazards are cartoonish versions of real UI annoyances: pop-ups, spinners, the "loading" hourglass.
- Sabotage notifications look like classic system balloon tips.

### Audio
- Satisfying retro UI sounds: clicks, window open/close, the "ding" of an error.
- Startup and shutdown jingles (original, fitting the retro OS style).
- Calm background music, like an old screensaver, that gets glitchier in System32.
- Each sabotage has a short notification sound.

---

## 10. Fairness Rules

1. **Every sabotage is announced** at least 0.75 s before it starts, and announced again when it ends.
2. **Inversions last long enough to adapt** (at least 6 s), and switching back is announced.
3. **Swept collision:** fast mouse movements are checked along their whole path, so you can't accidentally skip through a wall, and you won't die from a wall you never crossed.
4. **The real cursor is always findable:** tip glow, 1:1 movement, and sparks against walls.
5. **Short levels** (60 s or less) and **instant restart**.
6. **Calibration** at the start, so very fast and very slow mice both feel fair.
7. **`Esc` always pauses** and releases the mouse.

---

## 11. Accessibility & Comfort

- **Sensitivity settings** and a calibration step.
- **Steady mode:** reduces sabotage strength (inversions become gentle rotations, lag is halved, drift is slower).
- **Large hitbox assist** for players with less precise mouse control.
- **Trackpad mode on desktop**, for players who prefer not to use Pointer Lock.
- **Reduce motion:** no shake on crash.
- Hazards use shapes and icons, not just colour.
- Mobile trackpad mode lets you set your own sensitivity.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** for everything inside the game (windows, maze, hazards, cursor). The retro UI is drawn as sprites, so collision and visuals always match.
- **React** for menus and settings outside the game canvas.
- **Pointer Lock API:**
  - `canvas.requestPointerLock()` on a click (it needs a user gesture)
  - Read `movementX` / `movementY` from mouse/pointer move events
  - Handle `pointerlockchange` and `pointerlockerror` (pause when lock is lost)
  - Optional `{ unadjustedMovement: true }` in Chromium browsers to disable OS mouse acceleration for more consistent control (fallback when not supported)
  - Use the `engine/browser` helpers
- **Mobile trackpad mode:** touch deltas move the cursor relatively; `touch-action: none` on the canvas.

### Movement pipeline
Every frame, raw mouse movement goes through these steps:
```
raw delta → sensitivity → sabotage transform (invert / rotate matrix)
          → lag (smoothing) → drift → shape rules (axis lock, magnet, freeze)
          → swept collision against walls and hazards → new position
```

### Collision
- Walls are rectangles and line segments.
- **Swept segment tests:** check the line from the previous position to the new one against every wall (the Liang–Barsky line-clipping algorithm works well), so fast "flick" movements can't tunnel through.
- The I-beam uses a swept rectangle instead of a point.

### Data model
```ts
type CursorMode =
  | "arrow" | "ibeam" | "resizeH" | "resizeV" | "hand"
  | "busy" | "crosshair" | "forbidden" | "grab";

type Sabotage =
  | { type: "invert"; axes: "x" | "y" | "xy"; durationMs: number }
  | { type: "rotate"; degrees: 90 | 180 | 270; durationMs: number }
  | { type: "lag"; smoothing: number; durationMs: number }
  | { type: "sensitivity"; multiplier: number; durationMs: number }
  | { type: "drift"; velocity: { x: number; y: number }; durationMs: number }
  | { type: "fakeCursor"; offset: { x: number; y: number }; durationMs: number }
  | { type: "decoys"; count: number; durationMs: number }
  | { type: "largeCursor"; scale: number; durationMs: number }
  | { type: "solidTrail"; trailMs: number; durationMs: number }
  | { type: "recentre" };

interface HazardDef {
  kind: "popup" | "spinner" | "recycleBin" | "selectionBox" | "confirmDialog" | "scanLine" | "notification" | "icon";
  rect: Rect;
  path?: { x: number; y: number }[];   // movement path, if any
  speed?: number;
}

interface LevelDef {
  id: string;                          // "D-07"
  drive: "C" | "D" | "E" | "F";
  title: string;                       // window title, e.g. "Mouse Properties"
  start: { x: number; y: number };
  exit: Rect;                          // the [X] button
  walls: Rect[];
  zones: { rect: Rect; mode: CursorMode }[];
  hazards: HazardDef[];
  sabotage: { atMs: number; effect: Sabotage }[];   // each announced by a notification
  medalTimesMs: { gold: number; silver: number; bronze: number };
}
```

### Folder structure
```
src/games/cursor-escape/
  index.tsx
  input/
    pointer-lock.ts  trackpad.ts  calibration.ts
  cursor/
    pipeline.ts  shapes.ts  sabotage.ts  decoys.ts
  collision/
    swept.ts
  hazards/
    popup.ts  spinner.ts  recycle-bin.ts  …
  levels/
    c-drive.ts  d-drive.ts  e-drive.ts  f-drive.ts  boss.ts
  render/
    retro-ui.ts  cursor-sprites.ts
  ui/
    BootScreen.tsx  DesktopSelect.tsx  Settings.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Pointer Lock behaves differently across browsers (especially Safari) | Test early in every browser; trackpad mode as a fallback everywhere |
| Mouse sensitivity varies a lot between devices | Calibration screen; unadjusted movement where supported |
| Trackpad mode on phones feels bad | Tune acceleration; let players choose sensitivity; bigger levels on mobile |
| Very fast mice tunnel through walls | Swept collision (tested with extreme movements) |

---

## 13. Build Roadmap

- [ ] **M1: Cursor core.** Pointer Lock, custom cursor, movement pipeline, swept wall collision, 3 test levels
- [ ] **M2: Shapes + C:\\.** Cursor shapes and zones, pop-ups and icons, 10 levels, calibration
- [ ] **M3: Sabotage + D:\\.** Notifications, invert/lag/sensitivity/fake cursor/trails, 10 levels
- [ ] **M4: E:\\ + F:\\.** Remaining hazards and sabotage, decoys, 20 levels, The Uninstaller, ending
- [ ] **M5: Mobile + polish.** Trackpad mode tuning, steady mode, achievements, cross-browser testing
- [ ] **Later:** level editor, daily window

---

## 14. Definition of Done

- 40 levels + boss, each finishable in 60 s or less once learned.
- No wall tunnelling, even with extremely fast mouse flicks (tested).
- Every sabotage shows a notification at least 750 ms before it starts.
- `Esc` always pauses and releases the mouse, in every browser.
- The game is completable in trackpad mode on a phone.
- The ending correctly releases Pointer Lock and shows the real cursor.
