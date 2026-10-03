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

- [ ] **M1: Core.** Blink state machine, strain, one camera scene, 3 anomaly types, reporting
- [ ] **M2: Night 1–2.** 5 cameras, Anomaly Director, credibility, the Visitor
- [ ] **M3: Nights 3–5.** Static blinks, fake blinks, slow changes, office anomalies, lying HUD, mirror
- [ ] **M4: Ending + modes.** Ending sequence, Endless Night, Custom Night, reference photos
- [ ] **M5: Polish.** CCTV effects, audio, comfort settings, achievements
- [ ] **Later:** Real Blink Mode (opt-in webcam)

---

## 14. Definition of Done

- Anomalies are never visible mid-change (tested by checking the blink state on every apply).
- No object ever has two active anomalies.
- Every night is survivable by a tester using the reference photos.
- The Visitor always plays its scraping sound when it moves.
- With "reduce flashing" on, the game never goes fully black.
- The game runs smoothly on a mid-range phone with CCTV effects on (or falls back automatically).
