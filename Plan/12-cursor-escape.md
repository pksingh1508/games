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

- [x] **M1: Cursor core.** Pointer Lock, custom cursor, movement pipeline, swept wall collision, 3 test levels
- [x] **M2: Shapes + C:\\.** Cursor shapes and zones, pop-ups and icons, 10 levels, calibration
- [x] **M3: Sabotage + D:\\.** Notifications, invert/lag/sensitivity/fake cursor/trails, 10 levels
- [x] **M4: E:\\ + F:\\.** Remaining hazards and sabotage, decoys, 20 levels, The Uninstaller, ending
- [x] **M5: Mobile + polish.** Trackpad mode tuning, steady mode, achievements, cross-browser testing (automated in Chromium, on a computer and a phone; Safari and Firefox, where Pointer Lock differs most, still want a try by hand)
- [ ] **Later:** level editor, daily window

---

## 14. Definition of Done

- 40 levels + boss, each finishable in 60 s or less once learned.
- No wall tunnelling, even with extremely fast mouse flicks (tested).
- Every sabotage shows a notification at least 750 ms before it starts.
- `Esc` always pauses and releases the mouse, in every browser.
- The game is completable in trackpad mode on a phone.
- The ending correctly releases Pointer Lock and shows the real cursor.

---

## 15. As Built

Cursor Escape is playable at `/games/cursor-escape/play`: 40 windows in four drives, then The Uninstaller, with all nine cursor shapes, all eight hazards and all ten kinds of sabotage. It has:

- the Pointer Lock cursor, and trackpad mode on phones (and on computers, if you choose it);
- the pointer-speed check, Steady mode, the forgiving hitbox and reduce motion;
- medals and best times, each drive's score and six achievements;
- the ending that hands your real cursor back, with a share line.

Everything is made in code, with no asset files:

- **Art:** DeskOS 98's windows, icons and hazards, drawn in Canvas 2D, and the cursors as pixel sprites.
- **Music:** six chiptune songs (the menu, one per drive and the boss) plus the startup and shutdown jingles.
- **Sounds:** ZzFX.

It reuses these shared pieces:

- `engine/loop` (stepping at 120 ticks a second);
- `engine/sprites`, the audio engine and the sound bank;
- `games/shared` (the save store, the comfort hooks, canvas fitting, achievements, sharing and the one-tab guard).

It adds one shared module, `engine/browser/pointer-lock.ts`. It locks the pointer with `unadjustedMovement` and falls back quietly where that isn't supported, and it handles unlocking and the change events. Last Pixel and Don't Trust The Game can use it later.

### The windows

The solver's time is how long its run takes (below). Gold is that time plus 35%, rounded up to a tenth of a second; silver is gold × 1.6 and bronze is gold × 2.4.

| Window | Name | What's new | Solver | Gold |
|---|---|---|---|---|
| C:\\-01 | My First Window | Walls, and one pop-up bouncing between them | 3.1 s | 4.2 s |
| C:\\-02 | Narrow Escape | Tight corridors | 9.1 s | 12.4 s |
| C:\\-03 | Shortcuts | Icons that open pop-ups, lining the short way | 1.9 s | 2.6 s |
| C:\\-04 | Pop-up Party | Five bouncing pop-ups (their [X]s close them) | 2.2 s | 3.0 s |
| C:\\-05 | Read Me | The I-beam: a narrow upright slot it fits, a low one it doesn't | 2.5 s | 3.4 s |
| C:\\-06 | Click Here | Links that pull you in (the hand) | 5.2 s | 7.1 s |
| C:\\-07 | Window Manager | Resize edges (one way only), and a window you drag by its title bar | 3.7 s | 5.1 s |
| C:\\-08 | Loading… | Loading zones (frozen for 1.5 s), pop-ups on patrol | 10.6 s | 14.4 s |
| C:\\-09 | Spin Cycle | Three loading spinners that chase you through the walls | 3.8 s | 5.2 s |
| C:\\-10 | My Computer | All of it, and the [X] shrinks as you come near | 3.7 s | 5.1 s |
| D:\\-01 | Mouse Properties | Checkboxes that change a setting when you touch them | 4.4 s | 5.9 s |
| D:\\-02 | Swap Buttons | Left and right inverted for 13 s (the arrow's drawn mirrored) | 5.8 s | 7.8 s |
| D:\\-03 | Upside Down | Up and down inverted, then a recentre "for your convenience" | 10.7 s | 14.4 s |
| D:\\-04 | Pointer Speed | Two checkbox doorways: fastest, then slowest | 2.9 s | 4.0 s |
| D:\\-05 | Precision | Crosshair corridors (half speed), then lag | 9.7 s | 13.1 s |
| D:\\-06 | Accessibility | The large cursor (three times the size, hitbox and all) | 4.3 s | 5.9 s |
| D:\\-07 | Pointer Trails | The solid trail, with pop-ups in the way | 3.1 s | 4.2 s |
| D:\\-08 | Rotation | A quarter turn, a half, then three quarters (6 s each) | 5.3 s | 7.2 s |
| D:\\-09 | Drift | Drift, and restricted zones that push you out | 3.1 s | 4.2 s |
| D:\\-10 | Control Freak | Every setting, some twice | 4.8 s | 6.6 s |
| E:\\-01 | Homepage | Six links pulling at once | 4.9 s | 6.7 s |
| E:\\-02 | Pop-up Blocker (Off) | Pop-ups across the way: close them to get by | 5.0 s | 6.9 s |
| E:\\-03 | Download Speed | Download bars that chase | 2.3 s | 3.1 s |
| E:\\-04 | Cookie Banner | Notifications sliding in, and "Accept cookies?" (say no) | 5.5 s | 7.4 s |
| E:\\-05 | Are You Sure? | Two dialogs whose buttons swap | 5.3 s | 7.3 s |
| E:\\-06 | Captcha | "I'm not a robot" runs away twice, then three cursors to click | 8.7 s | 11.8 s |
| E:\\-07 | Too Many Tabs | Five tabs to close in order before the [X] works, and two links | 5.9 s | 8.0 s |
| E:\\-08 | Buffering | Loading zones and spinners | 11.2 s | 15.1 s |
| E:\\-09 | 404 | The [X] hops away, twice | 7.2 s | 9.7 s |
| E:\\-10 | Dark Web | All of the internet | 5.0 s | 6.8 s |
| F:\\-01 | Who's There? | The fake cursor (yours is invisible) | 4.9 s | 6.6 s |
| F:\\-02 | Double Click | Two decoys | 3.8 s | 5.2 s |
| F:\\-03 | Hall of Mirrors | Four decoys, mirrored and turned | 2.8 s | 3.9 s |
| F:\\-04 | Not Responding | The selection box, with loading zones and spinners | 7.3 s | 9.9 s |
| F:\\-05 | Antivirus | The scan line; hide in the safe files | 4.7 s | 6.4 s |
| F:\\-06 | Quarantine | Scans both ways, and a selection box | 3.9 s | 5.3 s |
| F:\\-07 | Ghost in the Shell | Invisible, and leaving a solid trail | 3.0 s | 4.1 s |
| F:\\-08 | Registry Editor | The Recycle Bin, decoys, then inverted | 4.7 s | 6.4 s |
| F:\\-09 | Which One? | Four cursors, a narrow path, and one of them is you | 8.0 s | 10.8 s |
| F:\\-10 | Kernel | The scan, the bin, decoys, then inverted | 4.7 s | 6.4 s |
| F:\\uninstall.exe | The Uninstaller | Five dialogs against a filling progress bar | 7.7 s | 10.4 s |

The maps are text, like the platformers' rooms: 38 × 21 cells of 16 px, plus finer walls in pixels. A small script (kept out of the repo) builds the maps from coordinates. It checks each one's size, its single start, the opening to the [X], and that the [X] can be reached.

### How the truth is kept

| Lie | The tell |
|---|---|
| Inverted or rotated movement | The arrow is drawn mirrored or turned the same way |
| The fake cursor | Your real cursor is invisible, but its tip glows and it sparks near walls |
| Decoys | Yours moves exactly with your hand, and its tip glows |
| The solid trail | It's drawn solid, not faded (and its newest bit is safe) |
| Swapping buttons | They shiver for 0.35 s before they swap |
| The helpful recentre | Its notification says "for your convenience" |
| The shrinking [X] | Its border pulses |
| The hopping [X] | It shivers before each hop |
| The scan line | Its start line flashes for 0.9 s before it sweeps; safe files are marked |
| The selection box | It's drawn from a corner over 1.6 s before it closes |
| Every sabotage | A balloon tip (with a chime) a second before it starts and again when it ends; the tray shows what's on |

### Differences from the draft

- **120 ticks a second.** The simulation runs at 120 Hz, so each of a mouse's many small moves is swept on its own. It works in desktop pixels (a 640 × 400 desktop with a 22 px taskbar) and is scaled to fit the screen.
- **The movement pipeline.** Your hand's movement goes through these steps in order:
  1. sensitivity;
  2. the sabotage matrix (invert, rotate, speed);
  3. drift;
  4. pulls (links, the Recycle Bin, restricted zones);
  5. shape rules (crosshair half speed, resize axis lock, busy freeze);
  6. lag;
  7. swept collision.
- **Walls are rectangles only.** The arrow's tip is a 3 px circle, swept as a rounded rectangle. The I-beam is a 2 × 16 px box. A flick is checked along its whole path and stops at the first thing in the way.
- **Windows have a notch.** A pop-up is solid except for its [X] corner, which you reach into from outside to click. Notifications are solid all over. A draggable window's title bar is where you grab it; click to let go.
- **"Are you sure?" dialogs sit across corridors you're climbing.** Their buttons are along the bottom edge, facing you. Within 34 px they shiver, then swap. The right answer closes the dialog; the wrong one crashes you.
- **Medal times come from the solver's runs** (see the table above).
- **Trackpad mode works on computers too** (in Options). You drag to move, and a tap (under 260 ms and 9 px) is a click. It has its own sensitivity, and it's what you get wherever Pointer Lock isn't available. Raw mouse input (`unadjustedMovement`) is an option, off by default.
- **The CAPTCHA** (E:\\-06) is "I'm not a robot": a checkbox that hops away twice when you come near (shivering first), then three cursors to click. Once they're all done, its window closes and the way opens.
- **Too Many Tabs** keeps the [X] locked until all five tabs are closed in order. A tab clicked out of turn says so and stays open.
- **Icons open pop-ups** (new walls that bounce around) rather than whole windows.
- **The [X] also hops** (E:\\-09), as well as shrinking (C:\\-10).
- **Trophies as built:**
  - Identity Crisis: move your own cursor 60 px within a second of decoys appearing.
  - Ambidextrous: get to the end of five inverted or rotated stretches without crashing, across the whole game.
  - Steady Hand: close every window of a drive without a crash (each window once; they don't have to be in one sitting).
- **The Uninstaller's level ID is X-01.** It's shown as `F:\uninstall.exe`, the last file in System32.
  - Its bar fills 3% a second.
  - Each of its five dialogs opens when the one before closes. Closing one takes 15% off the bar, and the first four each set off a sabotage (inverted, decoys, a trail, lag).
  - At 100% you're uninstalled: a crash, and the bar starts again from nothing.
  - Its [X] is DeskOS 98's own. Clicking it shuts the OS down ("It's now safe to turn off your computer"), lets go of the mouse, and says "You're free."
- **Sabotage is announced a second ahead** (never less than 0.75 s). The checkboxes and the boss's dialogs set theirs off the same way.
- **Steady mode** softens all of it:
  - inversions and rotations become gentle turns (25–35°);
  - lag and drift are halved;
  - speed changes are smaller (the square root);
  - there's one decoy fewer (two at least);
  - the large cursor and trails are half as big or as long.
- **The forgiving hitbox** makes the tip's circle 1 px instead of 3 and makes buttons a little bigger to hit. Windows closed with it on count, but earn no medal or best time.
- **Each drive's score** (total time and crashes) is in the drive's status bar on the desktop: windows closed, best times added up (once they're all closed), and crashes.
- **The first window opens after a pointer-speed check:** a test pad with two targets, and the speed slider. It's in Options too.
- **On phones**, you drag anywhere and tap to click, with ⟳ and ⏸ in the taskbar. Landscape is best, and a hint asks you to turn the phone.
- **Performance:** the heaviest windows hold 60 fps on a phone profile with the CPU slowed 4×. Drawing a frame takes about 1 ms at most: the walls and windows that don't move are drawn once and kept.
- **Not built yet** (Later): the level editor, the daily window and two-cursor co-op.

### The solver

Every window is proven by a beam search through the real simulation (`core/solver.ts`):

- **Moves:** every 6 ticks it tries 33 moves (staying still, or 16 directions at two speeds).
- **The beam:** it keeps the best 160 states, at most 6 for each 24 px cell. "Best" is measured by walking distance to the next goal, round the walls.
- **Waypoints:** where a window needs clicks, the route (`levels/routes.ts`) gives them in order: closing pop-ups, answering dialogs, tabs in order, the CAPTCHA, the boss's dialogs.
- **Output:** its runs are one character a move (`levels/runs.ts`). The unit tests play each run back through the real simulation, and the medal times come from them (`levels/medals.ts`).
- **After a window or rule changes:** `UPDATE_DEV_RUNS=1 pnpm vitest run src/games/cursor-escape/levels/runs.test.ts` re-solves every window (`ONLY=C-01,E-04` for just some) and rewrites both files.

### Testing (as built)

- **`core/sim.test.ts`** covers:
  - swept collision (a flick through a thin wall, grazing, round corners, and wild flicks that never tunnel);
  - the clock starting on your first move, the [X], the bar under the title bar, and determinism;
  - every cursor shape's rule;
  - every sabotage, its warning and its end;
  - Steady mode;
  - every hazard and window: the notch, tab order, chasers, the bin, the selection box, the scan line, dialogs, icons, the CAPTCHA, the hopping and shrinking [X], and the checkboxes;
  - a session's crashes and restarts.
- **`core/progress.test.ts` and `save.test.ts`** cover medals, records, the forgiving hitbox (no medal), windows opening in order, every trophy, and the save's schema.
- **`levels/levels.test.ts`** checks:
  - four drives of ten, then The Uninstaller;
  - every start is clear of everything, with a way to the [X];
  - every sabotage is announced at least 0.75 s ahead, and every inversion lasts at least 6 s;
  - each idea arrives where the plan says.
- **`levels/runs.test.ts`** plays every solver run back and checks that it escapes its window in under 60 s, and that the medal times match the runs and are in order.
- **`engine/browser/pointer-lock.test.ts`** checks locking with raw input and its fallback, unlocking, and the change events.
- **`games/progress.test.ts`** checks the cabinet's summary (windows closed, gold medals, crashes, trophies).
- **`tests/e2e/cursor-escape.spec.ts`** covers, on a computer and a phone:
  - the boot and the pointer-speed check;
  - a crash in trackpad mode;
  - a real escape from C:\\-01 (round the walls, past the pop-up, up to the [X], click);
  - `Esc` pausing;
  - the desktop (windows opening one after another, and the drive's score);
  - options being saved;
  - a touch drag on a phone.
