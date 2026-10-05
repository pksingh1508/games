# Don't Blink

> **"Something changes every time you blink. You will blink."**

| | |
|---|---|
| **Genre** | Observation / anomaly-spotting thriller (spooky, not gory) |
| **Core mind trick** | Your character blinks automatically, and during every blink something in the scene changes. Spot the changes before they pile up. |
| **Controls** | Click / tap to switch cameras and report · Hold to keep your eyes open |
| **Session length** | Nights of 6–8 minutes · 5 nights + Endless + Custom Night |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/dont-blink` |
| **Code folder** | `src/games/dont-blink/` |

---

## 1. About the Game

### The pitch
You're the new night guard at **The Marlow Museum of Curious Things**. Your job is simple: sit in the office, watch the security cameras, and report anything unusual until 6 AM. The previous guard? *He blinked.*

Every few seconds your eyes blink: the screen goes dark for a split second. **During every blink, something changes.** A portrait turns its head. A vase disappears. A door that was closed is now open. A statue is… closer than it was.

Spot each change and report it to fix it. Let 5 changes pile up unreported, and *they* come for you. You can hold your eyes open to stop blinking, but your eyes get strained, and when they give up, you'll blink for a long time.

### How it messes with your mind
- **Change blindness.** This is a real effect: people often miss big changes in a scene when the change happens during a brief interruption, like a blink or a flicker. Psychologists study it with the *flicker paradigm* (Rensink, O'Regan & Clark, 1997). This game *is* the flicker paradigm.
- **Inattentional blindness.** While you focus on one camera, you miss what's happening on another.
- **Gradual change blindness.** Some changes happen slowly with no blink at all, and people miss those even more.
- **Being watched.** The Visitor (a statue) only moves when you're not looking. The tension comes from your own eyelids.

### Inspirations
*I'm on Observation Duty* (anomaly reporting on cameras), *Five Nights at Freddy's* (camera-watching tension), Doctor Who's Weeping Angels (they move when you blink), and real change-blindness experiments.

---

## 2. How to Play

### Goal
Survive from **00:00 to 06:00** without letting 5 anomalies stay unreported at once, and keep the Visitor out of your office.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Switch camera | `1`–`5` or click a thumbnail | Tap a thumbnail |
| Look at your own office | `6` / `O` | 🪑 button |
| Report an anomaly | `R`, then click the changed object (or where it used to be), then choose the type | Report button → tap the object → choose the type |
| Keep eyes open (delay blinking) | Hold `Space` | Hold the 👁 button |
| Check the reference photo | `F` (limited uses) | 📷 button |
| Pause | `Esc` | ⏸ button |

### The core loop
1. **Watch** the current camera.
2. **Blink** (automatically, every few seconds).
3. **Notice** what changed, or switch cameras to check others.
4. **Report** it: click the object and pick the type of change.
5. **Correct report** → the anomaly is fixed. **Wrong report** → you lose credibility.
6. **Survive** until 6 AM.

---

## 3. Game Mechanics

### Blinking
- You blink automatically every **3.5–6.5 seconds** (it varies by night).
- A blink lasts about **0.28 s** (eyes closing 80 ms, closed 120 ms, opening 80 ms).
- **Changes only ever happen while your eyes are fully closed**, never halfway through, so you never "see" the change itself.

### Keeping your eyes open
- **Hold Space / 👁** to delay blinking for up to 8 seconds.
- While holding, your **eye strain meter** rises.
- At 100% strain you're forced into a **long blink of 1.5 seconds**, and several anomalies can happen at once.
- Strain recovers when you let yourself blink normally.

### Anomaly types
| Type | Example |
|---|---|
| **Moved** | A chair has shifted to the other side of the room |
| **Missing** | A vase is gone |
| **Extra** | There's a new painting on the wall |
| **Changed** | A portrait's eyes now look left |
| **Intruder** | A figure is standing in the corner |
| **Light** | A lamp has switched on |
| **Door** | A closed door is now open |
| **Count** | There were 7 books on the shelf; now there are 6 |
| **Mirror** | The whole camera image is flipped left to right (look at the text on the signs) |

### Reporting
- Click the object that changed (or the empty spot where something used to be), then choose the type.
- **Correct:** *"REPORT ACCEPTED"*, the object snaps back to normal, and your active anomaly count drops.
- **Wrong:** you lose **credibility**. After 3 false reports in one hour you get a warning; after 5, you're **fired** (game over). This stops players from spamming reports.
- Some flexibility: if an object moved off-screen, both "Moved" and "Missing" are accepted.

### The Visitor
- A pale statue that starts on its pedestal in the Sculpture Hall.
- It only moves **while you blink** and while you're **not looking at its camera**.
- It travels room by room toward your office: Sculpture Hall → Gallery → Lobby → Corridor → Office.
- **Report it as an "Intruder"** on the camera where it currently is, and it returns to its pedestal.
- Every time it moves, you hear a **stone scraping sound**, panned toward its room.
- If it reaches your office: game over.

### Camera switching
- Switching cameras shows a short burst of static (150 ms).
- **From Night 3, changes can happen during camera static too.** The switch is a second kind of blink.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Blink** | You'd notice if something changed | You often won't (change blindness) | Memorise the scene before blinks |
| **Static Blink** | Switching cameras is safe | The static hides changes too (Night 3+) | Changes cluster right after switches |
| **Fake Blink** | Every blink brings a change | Some blinks change nothing, so you start doubting everything | — (paranoia is the point) |
| **The Slow Change** | Changes happen during blinks | Some happen slowly with no blink at all, like a painting fading to a different colour over 30 s | Stare long enough and you'll catch it moving |
| **Mirror World** | The camera shows the room | The whole image has been flipped | The text on signs is backwards |
| **The Count** | Shelves look the same | One fewer book, one more chair | Count things during calm moments |
| **Your Own Office** | Only the museum is haunted | Your office changes too (Night 4+): the mug moves, the poster changes | The office view has a tiny reflection in the monitor |
| **The Lying HUD** | The HUD is safe | On Night 5 your clock runs backwards for a minute, and the report button labels swap | The HUD font flickers |
| **Sound Misdirection** | Sounds point to danger | On Night 5, footsteps come from one side while the change happens on the other | Rare, and only on the last night |

---

## 5. Levels & Progression

### Nights
| Night | What's new | Feel |
|---|---|---|
| **1. Training** | 3 cameras, slow blinks, big obvious anomalies (a whole statue missing) | "Oh, I get it." |
| **2. Full Shift** | All 5 cameras, medium anomalies, the Visitor starts moving | "Wait, where did that go?" |
| **3. Static** | Camera static acts as a blink; power flickers | "I can't even switch cameras safely." |
| **4. Doubt** | Fake blinks, slow changes, anomalies in your own office | "Did that change, or am I imagining it?" |
| **5. It Knows** | Anomalies favour cameras you haven't checked recently; the Visitor is faster; mirror anomalies; the lying HUD | Pure paranoia |

### The ending
At 6:00 AM, the sun rises. The day guard arrives, looks at you and says: *"Who are you? We don't have a night guard."*

**Post-credits:** a morning photo of the Sculpture Hall. The Visitor is back on its pedestal… wearing your guard's hat.

### Other modes
- **Endless Night:** survive as long as possible as difficulty keeps climbing. Score = hours survived.
- **Custom Night:** set blink speed, Visitor aggression, anomaly subtlety and more.

---

## 6. Features

### MVP (must-have)
- 5 camera scenes with object layers
- Blink system + eye strain
- 6 anomaly types (moved, missing, extra, changed, door, light)
- Reporting with credibility
- Nights 1–2
- Comfort settings (reduce flashing, no jump scares)

### Full version
- All 9 anomaly types, the Visitor, camera static blinks
- Nights 3–5, fake blinks, slow changes, office anomalies, lying HUD
- The ending + post-credits scene
- Endless Night, Custom Night, achievements

### Later: experimental "Real Blink Mode"
- **Opt-in only.** The game uses your webcam to detect when *you* blink, and the game blinks when you do.
- Built with MediaPipe Face Landmarker, which can detect blinks from facial expressions on your own device.
- **Strict privacy rules:**
  - Off by default, with a clear explanation screen before asking for the camera
  - Everything is processed on your device; nothing is recorded or uploaded
  - The MediaPipe model and WebAssembly files are served from our own site, not a third-party CDN
  - A visible "camera on" indicator the whole time
  - One click to turn it off; falls back to automatic blinking
- Loaded only when someone turns it on, so it doesn't slow down the normal game.

---

## 7. Scoring, Rewards & Replay Value

- **Per night:** anomalies reported, missed, false reports, average reaction time.
- **Rank:** *Hawk Eye* (fast and accurate) → *Night Owl* → *Sleepy* → *Fired*.
- **Endless score:** hours survived.

### Achievements
| Achievement | How to get it |
|---|---|
| **Perfect Shift** | Finish a night with no false reports |
| **Eagle Eye** | Report an anomaly within 1 second of the blink |
| **Iron Eyes** | Hold your eyes open for a total of 5 minutes in one night |
| **Statue of Limitations** | Send the Visitor back 10 times |
| **Counted It** | Catch 5 "count" anomalies |
| **Who Are You?** | See the ending |

---

## 8. Screens & UI

1. **Title:** a black screen with the title. Every few seconds, the screen "blinks", and something on the title screen changes. (Players notice on their own.)
2. **Night intro:** *"Night 1 — 00:00"*, plus a short note from the museum manager.
3. **Main view:**
   - The current camera, large, with a CCTV look (grain, timestamp, camera name)
   - Camera thumbnails along the bottom
   - **HUD:** clock, active anomaly count, eye strain meter, credibility, report button, reference photos left
4. **Report flow:** click object → type picker (icons + words) → result stamp.
5. **Reference photo:** the camera's "morning photo" from the guard binder, shown side by side with the live view (limited uses per night).
6. **Game over:** a slow fade (or a scare, if scares are turned on).
7. **6 AM:** sunrise, stats, rank.
8. **Settings:** jump scares on/off, reduce flashing, blink style (dark / soft fade), volume, captions.

---

## 9. Art & Audio Direction

### Visuals
- **Painted, slightly uncanny museum rooms** seen through CCTV: film grain, scanlines, a timestamp, slight colour fringing.
- **Every changeable object is a separate layer** (and every anomaly needs its own art variant). This is the biggest art task in the game.
- The museum is full of curious objects: taxidermy, portraits, clocks, statues, masks, maps. Lots to remember, lots to change.
- Blinks are drawn as eyelids closing from the top and bottom, not just a black flash.

### Audio
- A low ambient hum, ticking clocks, distant creaks.
- **The Visitor's stone scrape:** the most important sound in the game, panned toward its room.
- Camera switch static, the tiny click of the report button.
- Heartbeat that rises with the anomaly count.
- **Music:** almost none. Silence makes the tension.

---

## 10. Fairness Rules

1. **Every anomaly is a single, clear change to one object.** Never two changes on the same object at once.
2. **Difficulty rises gradually.** Night 1 anomalies are huge; subtle ones only come later.
3. **Reference photos** let you check what the room should look like (limited per night; unlimited in assist mode).
4. **The Visitor always makes a sound when it moves.**
5. **Changes only happen during full closure** (blink or static), except slow changes, which are introduced on Night 4.
6. **Flexible report matching** for genuinely ambiguous cases.
7. False-report penalties start gentle.

---

## 11. Accessibility & Comfort

- **No jump scares** setting (on by default for the first launch; players can turn scares on). Game over becomes a slow fade.
- **Reduce flashing:** blinks become a soft fade to dim (not black), and static becomes a gentle blur.
- **Photosensitivity notice** before the first night.
- **Colour-change anomalies** can be turned off for colourblind players (they're replaced by other types).
- **Captions** for all important sounds (*[stone scraping — Gallery]*).
- **Assist mode:** unlimited reference photos, slower blinks, no credibility penalty.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** per camera view, with layered sprites (one per object).
- **CCTV effects** (grain, scanlines, vignette, slight colour fringing) through the shared `engine/postfx` WebGL2 pass, with a fallback of CSS overlay textures.
- **Scene model:** each camera has a background and a list of objects; each object has a state (position, visible, variant, transform, tint).
- **An anomaly is a small change** applied to one object's state. Fixing it restores the original state.
- **Blink state machine:** `OPEN → CLOSING → CLOSED → OPENING`. Queued anomalies are applied **only in the `CLOSED` state**, so a change is never visible mid-way.
- **Anomaly Director:** decides what changes and when:
  - A difficulty budget per night and hour
  - Picks from each scene's anomaly catalogue
  - One anomaly per object at a time, spread across cameras, with cooldowns
  - On Night 5, favours cameras the player hasn't checked recently
  - Random choices are seeded (`engine/rng`), so any night can be replayed exactly for testing and tuning
- **Reporting:** hit-testing on objects, plus invisible "ghost" hit areas where missing objects used to be.
- **Visitor AI:** a path between rooms; moves one step during qualifying blinks, with a chance that depends on the night; stone-scrape sound through a Web Audio stereo panner.
- **Saving:** nights unlocked, best Endless score, settings.
- **Real Blink Mode** (later): loaded with a dynamic `import()` only when the player opts in.

### Data model
```ts
type CameraId = "lobby" | "gallery" | "sculpture" | "storage" | "corridor" | "office";

type AnomalyType =
  | "moved" | "missing" | "extra" | "changed" | "intruder"
  | "light" | "door" | "count" | "mirror";

interface SceneObjectState {
  x: number; y: number;
  visible: boolean;
  variant: string;          // e.g. "eyes-forward" | "eyes-left"
  rotation: number;
  scale: number;
  tint?: string;
}

interface AnomalyDef {
  id: string;               // "gallery-portrait-eyes-left"
  camera: CameraId;
  objectId: string;
  type: AnomalyType;
  subtlety: 1 | 2 | 3 | 4 | 5;               // 1 = obvious, 5 = very subtle
  apply: Partial<SceneObjectState>;          // the change
  gradualMs?: number;                        // slow change instead of a blink change
}

interface NightConfig {
  night: 1 | 2 | 3 | 4 | 5;
  blinkIntervalMs: [number, number];
  hourLengthMs: number;
  maxActive: number;                         // 5
  subtlety: [number, number];
  visitorAggression: number;                 // 0..1
  features: Array<"staticBlink" | "fakeBlink" | "gradual" | "officeAnomalies" | "mirror" | "itKnows" | "lyingHud">;
}
```

### Folder structure
```
src/games/dont-blink/
  index.tsx
  scenes/
    lobby/  gallery/  sculpture/  storage/  corridor/  office/   # scene.json + art layers
  core/
    blink.ts  strain.ts  director.ts  report.ts  visitor.ts  night.ts
  render/
    camera-view.ts  cctv.ts
  experimental/
    real-blink.ts            # opt-in webcam blink detection (lazy-loaded)
  ui/
    Hud.tsx  CameraStrip.tsx  ReportPicker.tsx  ReferencePhoto.tsx  NightIntro.tsx  Morning.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Art workload (6 scenes + a variant for every anomaly) | Plan a catalogue of ~15 anomalies per scene; reuse objects across rooms; use simple transforms (move/hide/flip) where possible |
| Too subtle = unfair, too obvious = boring | Subtlety ratings per anomaly; tune with playtest data per night |
| Fake blinks and scares cause discomfort | Strong comfort settings; scares off by default on first launch |
| Webcam feature raises privacy concerns | Opt-in only, on-device only, clear indicator, never required |

---

## 13. Build Roadmap

- [x] **M1: Core.** Blink state machine, strain, one camera scene, 3 anomaly types, reporting
- [x] **M2: Night 1–2.** 5 cameras, Anomaly Director, credibility, the Visitor
- [x] **M3: Nights 3–5.** Static blinks, fake blinks, slow changes, office anomalies, lying HUD, mirror
- [x] **M4: Ending + modes.** Ending sequence, Endless Night, Custom Night, reference photos
- [x] **M5: Polish.** CCTV effects, audio, comfort settings, achievements
- [ ] **Later:** Real Blink Mode (opt-in webcam)

---

## 14. Definition of Done

- Anomalies are never visible mid-change (tested by checking the blink state on every apply).
- No object ever has two active anomalies.
- Every night is survivable by a tester using the reference photos.
- The Visitor always plays its scraping sound when it moves.
- With "reduce flashing" on, the game never goes fully black.
- The game runs smoothly on a mid-range phone with CCTV effects on (or falls back automatically).

---

## 15. As Built

Don't Blink is playable at `/games/dont-blink/play`. It has:

- five nights, Endless Night and Custom Night, the ending and the photo after the credits;
- six rooms: the five cameras and your own office, with 65 objects and 93 changes (11 to 17 a room) across all nine types;
- the Visitor, reference photos, credibility, eye strain and long blinks;
- each night's tricks: static and power cuts (Night 3); fake blinks, slow changes and your office (Night 4); mirrors, "it knows", the lying HUD and footsteps from the wrong side (Night 5);
- six trophies, three ranks (and Fired), a share card, assist mode and captions.

Everything is made in code, with no asset files:

- **Art:** Canvas 2D. Each room is a one-point-perspective box painted in flat shapes (marble checks, damask, flagstones, concrete, a long corridor), and every object is a small drawing function of its state. The CCTV look is a green cast, a grain tile and a slow rolling band on the canvas, with scanlines, the vignette and the on-screen text (camera, REC, time) in CSS. Your office has no grade at all: it's your own eyes. The eyelids are two DOM layers with curved edges, moved every frame.
- **Sound:** synthesized with Web Audio. A low hum and a ticking clock; the Visitor's stone scrape (filtered noise in uneven pulls over a low rumble), panned to its room's side of the museum and quieter the further away it is; static, the report click, accepted and denied, the statue settling home, the manager's buzz, creaks, footsteps, the lights buzzing, a heartbeat from three unreported changes (racing at five), the hour chime and the 6 AM bell. There's no music.

It reuses:

- `engine/loop` (the fixed 60 Hz loop) and `engine/rng` (every night is seeded);
- the audio engine and `engine/save` (plus `engine/save/runs` for run history);
- `games/shared`: achievements, the one-tab guard, sharing, comfort hooks and the HUD store;
- the arcade's `Dialog` and `ToggleSwitch`, and the arcade-wide Reduce flashing, jump scares and colour-blind settings.

It adds no libraries.

The code is in these folders:

- `core/`: the blink (`blink.ts`: eyelids, strain, long blinks), the rooms' data (`catalogue.ts`), the Anomaly Director (`director.ts`), reporting (`report.ts`), the nights (`nights.ts`), the night itself (`game.ts`: the clock, cameras, changes, the Visitor, credibility, the HUD's lies) and a careful tester (`bot.ts`) for the tests and QA.
- `scenes/`: one file per room (its objects, their drawings and their changes), the paint kit, the perspective box, the Visitor's drawing and the scene renderer.
- `render/`: the camera view (`view.ts`) and the eyelids' maths (`lids.ts`).
- `play/`: the runtime (the loop, sounds, captions, the HUD store).
- `audio/` and `ui/` (the title, the nights, the play screen, results, the ending, the menus), and the save, progress and trophies.

### A night

- **Blinks** every 5–6.5 s on Night 1, down to 3.5–5 s on Night 5 (35% slower in assist mode). A blink is 5 ticks closing, 7 closed and 5 opening (0.28 s); the lids are only fully shut in the closed phase, which is when changes are made.
- **Holding your eyes open** stops the blink timer and fills the strain meter in 8 s. At 100% the eyes shut for 1.5 s, and two or three changes land at once. Letting go drains it in 6 s, and each blink takes off 10%.
- **The director** fills a budget at the night's rate (3 changes an hour on Night 1, 5.5 on Night 5) and spends it when the screen is covered, with at least 5 s between changes. It picks a camera first (rooms that already have changes are less likely; the room you're watching is twice as likely, three times on Night 1, so you see the trick; on Night 5 rooms you haven't looked at are up to four times as likely), then a change in it, never on an object that's already changed.
- **Five unreported changes** start an 8-second countdown (the edge of the screen pulses red, your heart races). Report one in time and it stops; otherwise they come for you.
- **The Visitor** starts on its pedestal in the Sculpture Hall and walks Gallery → Lobby → Corridor → your office, one room per move. It only moves during a blink, never while you're watching its camera, and never sooner than 30 s into the night or 12 s after its last move (16 s from the corridor, outside your door). It's half as likely to step off its pedestal as to keep coming, and rests there 25 s after you send it home. Every move scrapes, panned toward its room, with a caption: *[stone scraping — Gallery]*. Reporting it anywhere but its pedestal (as an intruder, something extra, or something moved) sends it home. It isn't one of the five changes.
- **Credibility:** false reports in an hour; a warning (the manager texts you) at 4 and fired at 7 on Night 1, then 3 and 6, then 3 and 5. A new hour wipes the slate. Assist mode counts them but never fires you.
- **Reference photos:** the camera's morning photo beside the live view (under it, on a phone held upright) for 8 s: 5 on Night 1, 4 on Nights 2–4, 3 on Night 5, unlimited in assist mode.

| Night | Hour | Changes an hour | Subtlety | The Visitor | Brings in |
|---|---|---|---|---|---|
| 1. Training | 50 s | 3 | 1–2 | stays put | Three cameras |
| 2. Full Shift | 60 s | 4 | 1–3 | 35% a blink | All five cameras, the Visitor |
| 3. Static | 65 s | 4.5 | 1–4 | 45% | Camera static hides changes; power cuts every 22–45 s |
| 4. Doubt | 70 s | 4.6 | 2–4 | 50% | Fake blinks; slow changes (about one an hour, 26–30 s each); your office |
| 5. It Knows | 75 s | 5.5 | 2–5 | 65% | Mirrors; it favours rooms you haven't watched; the lying HUD; footsteps from the other side |

### Reporting

Click (or tap) what changed, or where it was; the type picker opens (`R` first if you like). Pick one of the nine types (`1`–`9`). Every object is clickable where it is and, if it's moved or gone, where it was. Things that only appear as changes (an extra painting, a figure) aren't clickable until they're there, so clicking around gives nothing away. A wrong type on a changed object, or anything on an unchanged one, is a false report. Matching is flexible where it's genuinely ambiguous: a light also counts as Changed, a door as Changed, a count as Missing, a figure as Extra, and anything missing as Moved (gone, or moved out of sight?). A mirror is reported as Mirror anywhere on the picture, and clicks on a mirrored picture are read the right way round. Reporting the empty pedestal as Missing gets a hint ("It isn't gone"), not a false report.

### How it's proven fair

- **Changes only while the screen is covered** (`core/game.test.ts`): every change made across five nights played by the tester is checked against the eyelids, the static and the power cut at the moment it's made. Slow changes are the exception the plan allows: they creep in by at most a few pixels a tick.
- **One change per object:** every few ticks of five nights, no two changes share an object, and every object without a change is exactly as it was in the morning (fixes put things back).
- **The Visitor always scrapes:** every move, on Nights 2–5 over three seeds, comes with a scrape from the room it moved to, during a blink. Watched all night, it never leaves its pedestal.
- **Every night is survivable by a tester with the reference photos:** a careful tester plays every night on six seeds and makes it to 6 AM every time, with no false reports. It only knows what a player could: what's on the camera it's watching (once it's looked for 0.7 s plus 0.5 s per subtlety level, 60% longer for subtle changes without a photo up), the HUD's count, and where the scrape came from. It takes 0.9 s to file a report, gives a camera 3.5 s when it's hunting, uses its photos on subtle nights and never holds its eyes open. A guard who never switches cameras loses Nights 2–5. At a slower human pace (1.2 s plus 0.9 s a level to spot, 1.6 s to file, 5 s a camera), it survives Nights 1–3 every time, Night 4 nine times in ten and Night 5 four in ten. In Endless the careful tester lasts 10–18 hours and the slower pace 5–9.
- **Soft blinks never go black** (`render/lids.test.ts`, and end to end): with Reduce flashing on, the lids are at most 72% opaque and never meet, and the picture behind them dims by at most half and blurs, so a change can't be made out.
- **The rest:** blinks, strain and long blinks; every report rule (ghost boxes, mirrors, the Visitor, the hint); credibility per hour and in assist mode; the photo budget; the countdown; static and power cuts hiding changes only from Night 3; the lying HUD (every label moves, the clock runs backwards, Endless never lies); colour changes switched off; the nights' order and catalogues (every camera has plenty to change on every night); Custom Night; the rank; the save and the cabinet's summary.
- **End to end,** on a computer and a phone: the title's blinks, the flicker notice and the manager's note, cameras by click, tap and key, a real change reported (the test fixes the night's seed and plays the same night itself to know where it'll be), a false report, the photo, holding your eyes open by key and by a held touch, pausing and leaving, getting fired, unlocks, and soft blinks.

### Speed

Each room is drawn once into its own buffer and only redrawn when something in it changes (a slow change redraws it a few times a second). A frame is one picture, one fill, one small noise tile and a band. On a Pixel 7 with its processor slowed four times, and on a desktop at 2566 × 1604, it holds 60 frames a second (95th percentile 17.6 ms). If frames run long (two seconds averaging over 24 ms), the canvas drops to one pixel per CSS pixel and loses its grain: at 40 times slower, that's what happened.

### Differences from the draft

- **The CCTV look** is Canvas 2D plus CSS, not a WebGL pass: the arcade has no shared `engine/postfx`, and cached room buffers keep phones at 60 fps. There's no colour fringing.
- **The camera thumbnails** are buttons, not live pictures: watching one camera means not watching the others.
- **Five changes start a countdown** instead of ending the night at once, so the fifth change, which can land on a camera you aren't watching, can still be answered.
- **Clicking the picture** opens the type picker straight away; `R` (or the Report button) is there too.
- **The data model** has `x`, `y`, `visible`, `variant` and `tint` (for colour and for slow changes like a door creaking open), but no rotation or scale; slow changes move position and tint.
- **Fake blinks** are flutters: the lids drop halfway and lift again, sometimes with a creak from somewhere. Nothing ever changes in them.
- **The lying HUD** comes once on Night 5, for a minute, between 2:00 and 4:30: the clock runs backwards and the report labels swap places, while their icons stay true. The tell is the HUD's font, flickering.
- **Footsteps** come with 30% of Night 5's changes, from a room on the other side of the museum.
- **Night 4** stops at subtlety 4 (5 waits for Night 5) and has 4.6 changes an hour and four photos: with everything else it brings, the measured difficulty was a cliff.
- **Endless** climbs from Night 2's settings to Night 5's over its first six hours, then adds 0.75 changes an hour, shorter gaps between changes and faster blinks every hour. Its clock never lies (it's your score). Endless and Custom open once you've survived Night 2.
- **The ranks:** Hawk Eye is 90% accuracy, at most one change missed and an average reaction within 6 + 2.5 × the night's number seconds; Night Owl is 70% and at most three missed; then Sleepy. Fired if you were.
- **The scare** (only with jump scares on) is the Visitor's face, suddenly far too close, with a sting. It never flashes.
- **Colour changes** can be switched off in the game's options, and are off anyway while one of the arcade's colour-blind modes is on.
- **Real Blink Mode isn't built.** It's "Later" in this plan; it needs MediaPipe's model and WebAssembly files hosted on our own site (several megabytes) and a webcam permission flow, so it waits.
- **The folders** are `core/`, `scenes/` (one file per room, not `scene.json` and art layers), `render/`, `play/`, `audio/` and `ui/`. The strain lives in `blink.ts`; there's no `experimental/` yet.
