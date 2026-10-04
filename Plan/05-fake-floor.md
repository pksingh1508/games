# Fake Floor

> **"Look before you leap. Then look again."**

| | |
|---|---|
| **Genre** | Perception platformer (slow, observation-based) |
| **Core mind trick** | Some floors are fake, some "nothing" is solid, and the clues you learn to trust will eventually lie to you |
| **Controls** | Keyboard / gamepad (desktop) · Touch buttons + tap-to-throw (mobile) |
| **Session length** | 15–40 seconds per room · 5 worlds × 10 rooms + a final room (about 2 hours) |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/fake-floor` |
| **Code folder** | `src/games/fake-floor/` |

---

## 1. About the Game

### The pitch
A side-view platformer where the danger isn't enemies. **It's the ground.**

Every room is a short path across floors that might be solid, **fake** (you fall straight through), crumbling, invisible-but-real, or just **painted onto the background**. You carry a few **pebbles** to throw and test the floor ahead: *tok* means solid, silence means trouble.

Each world teaches you a "tell": fake floors have misaligned grout lines, don't get wet in the rain, don't cast a shadow, or drift slightly when the camera moves. You get good at spotting them. You start feeling clever.

Then World 4 arrives, and the fake floors start **faking their tells**.

### How it messes with your mind
- **Perceptual learning.** Players slowly become experts at spotting tiny differences. They'll *feel* themselves getting sharper.
- **Broken affordances.** A floor "says" *stand on me*. This game makes you question the most basic promise in platformers.
- **Trust and betrayal.** When a learned tell gets faked, you have to find a *deeper* tell. It's a game about calibrating how much you trust your own eyes.
- **Resource tension.** Throw a pebble to be sure, or save it and trust your eyes?

### Inspirations
The glass-bridge scene from *Squid Game* (which panel is real?), the falling floors of *Level Devil*, the fake walls of *Hollow Knight*, and spot-the-difference puzzles.

---

## 2. How to Play

### Goal
Cross each room from the entrance to the exit door without falling.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Move | `←` `→` / `A` `D` / left stick | ◀ ▶ buttons |
| Jump (hold for higher) | `Space` / `↑` / `W` / gamepad A | Jump button |
| Throw a pebble | Aim with the mouse + click (or `F` to throw at the floor in front) / right stick + RT | Tap the floor you want to test (auto-aimed arc) |
| Look ahead | Hold `Shift` (camera pans ahead) | Hold 👁 button |
| Restart room | `R` | ⟳ button |
| Pause | `Esc` | ☰ button |

### The core loop
1. **Enter a room.** Look ahead (there's no timer, so take your time).
2. **Read the floor.** Check the grout, the rain, the shadows, the parallax.
3. **Test** suspicious floors with a pebble, if you can spare one.
4. **Commit** and walk or jump.
5. **Fall** → instant restart of the room (rooms are short). **Reach the door** → next room.

---

## 3. Game Mechanics

### Player movement
- Run and jump with variable jump height. No double jump.
- **Coyote time** (80 ms) and **jump buffering** (100 ms) so jumps feel fair.
- No fall damage. Falling into the void restarts the room.

### Floor types
| Floor | What it does | Introduced |
|---|---|---|
| **Solid** | Normal floor | World 1 |
| **Fake** | Looks solid, you fall straight through | World 1 |
| **Crumbling** | Holds you for 0.4 s after you land, then falls | World 1 |
| **Invisible** | Real floor you can't see. Revealed by rain splashes, dust or pebbles | World 2 |
| **Painted** | Part of the background art; lines up with the real floor only when the camera stands still | World 5 |
| **Mimic** | A fake floor that also fakes its tell (a fake shadow, fake splashes) | World 4 |
| **Return-trip** | Solid the first time, fake the second time you cross it | World 3 |

### Pebbles
- Each room gives a set number of pebbles (shown in the HUD). Extra pebbles can be found in rooms.
- **Thrown at a solid floor:** bounces with a *tok*.
- **At a fake floor:** passes straight through, silently.
- **At an invisible floor:** bounces with a glassy *tink*, and the floor's outline glows for 3 seconds.
- **At a crumbling floor:** triggers the crumble (useful, or a disaster).
- **The pebble never lies.** It's the one tool in the game that is always honest, from the first room to the last.

### Tells by world
| World | The tell (truth) | Later betrayal |
|---|---|---|
| 1. Showroom | Fake floors have **grout lines that don't line up** with their neighbours | — |
| 2. Rainy Rooftops | Rain **splashes** on real floors; fakes stay dry | World 4: mimics show fake splashes that are **out of sync** with the rain sound |
| 3. Lantern Mines | Real floors cast **shadows** on the back wall as the lantern swings | World 4: mimics have fake shadows that **don't move** when the lantern swings |
| 4. Hall of Mirrors | Meta-tells: sound sync and shadow motion | — |
| 5. The Painting | **Parallax:** painted floors slide slightly when the camera moves | Final room: everything at once |

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **Welcome Mat** | The first floor tile is safe | It's fake, and you fall in the first second (onto a safety net, just this once) | Misaligned grout |
| **Dry Tile** | All floors look wet in the rain | The dry one is fake | No splashes |
| **Invisible Bridge** | A gap means a pit | There's an invisible floor across it | Raindrops splash on "nothing" |
| **Shadowless** | Floors are floors | The one with no shadow is fake | No shadow on the back wall |
| **Return Trip** | A floor you already crossed is safe | It's fake on the way back | A faint crack appears after the first crossing |
| **Mimic Shadow** | Shadow means real | The shadow is painted on | It doesn't move with the swinging lantern |
| **Mimic Splash** | Splashes mean real | The splashes are fake | They don't match the rhythm of the rain sound |
| **Painted Floor** | Lined-up floors are real | It's part of the background painting | It slides when the camera moves (use "look ahead" to check) |
| **The Fake Checkpoint** | Flags are safe spots | The flag stands on a fake floor | The flag doesn't flutter |

---

## 5. Levels & Progression

### Worlds
| World | Name | Rooms | Theme |
|---|---|---|---|
| 1 | **The Showroom** | 10 | A clean floor showroom. Teaches fake floors, crumbling floors and pebbles. |
| 2 | **Rainy Rooftops** | 10 | Night rooftops in the rain. Splashes reveal truth, and invisible floors appear. |
| 3 | **Lantern Mines** | 10 | Dark mines and a swinging lantern. Shadows reveal truth; return-trip floors. |
| 4 | **Hall of Mirrors** | 10 | The betrayal world. Mimic floors fake the old tells, and you find the deeper ones. |
| 5 | **The Painting** | 10 | A world inside a giant painting. Parallax tells and all earlier tells combined. |
| ★ | **The Floor** | 1 | The floor itself is a creature, flipping tiles between real and fake in patterns. Read every tell at once. |

### Example rooms
- **1-1 "Welcome Mat":** the very first tile is fake. You fall onto a net and bounce back up, with a little "lol" from the game. Lesson learned: *don't trust the floor*.
- **1-3 "Pebble Pusher":** a row of 5 identical tiles and 3 pebbles. Two are fake. Use your pebbles wisely, or spot the grout.
- **2-4 "Bridge of Nothing":** a wide gap with no floor at all, but the rain is splashing on something.
- **3-7 "Round Trip":** cross a bridge, grab a key, and come back over the *same* bridge. One of the tiles has changed.
- **4-1 "Betrayal" (signposted):** a sign reads *"Things are not what they seem… even the clues."* This is the first mimic floor, placed over a safety net.
- **5-6 "Gallery":** a room where half the floors are painted. Hold "look ahead" and watch which ones slide.

### Difficulty curve
- Each world: rooms 1–3 teach the tell (with safety nets), 4–7 use it, 8–10 combine it with earlier tells.
- Pebbles per room shrink as you get better: there are enough pebbles to test every ambiguous floor in World 1, but later you have to deduce some.

---

## 6. Features

### MVP (must-have)
- Platformer controls (shared `engine/platformer`)
- Solid, fake, crumbling and invisible floors
- Pebbles with honest sounds
- Worlds 1–2 (20 rooms) with the grout and rain tells
- Instant restart and save progress

### Full version
- Worlds 3–5 + the final room (51 rooms)
- Lantern lighting and shadows, mimic floors, painted floors with parallax
- Medals and achievements
- Time trial mode

### Later
- **Room editor** with share codes
- **Daily Room** (a new room every day)
- **Blindfold mode:** only sound tells (pebble sounds and footstep echoes)

---

## 7. Scoring, Rewards & Replay Value

### Medals per room
- **Clean:** no falls
- **Barefoot:** no pebbles used
- **Quick:** under the par time

### World stats
Falls, pebbles used and time, with a final summary: *"You fell through 212 fake floors. The floor thanks you for your trust."*

### Achievements
| Achievement | How to get it |
|---|---|
| **Trust Issues** | Throw 100 pebbles |
| **Barefoot Champion** | Clear a whole world without using a pebble |
| **Eagle Eye** | Clear World 4 with no falls |
| **Floor Inspector** | Find every hidden pebble |
| **Gravity Tourist** | Fall 500 times |

---

## 8. Screens & UI

1. **Title:** the logo sits on a floor, and when you press Start, the logo falls through. (Every time. It's tradition.)
2. **World map:** a cross-section of a building. Each floor is a world (of course).
3. **Room HUD:** pebble count, room name, falls counter. Minimal, so players can see the floor clearly.
4. **Room complete:** a quick toast with the medals. It doesn't block you, and the next room starts right away.
5. **Pause / settings:** volume, high-contrast tells, reduce motion, controls, assist options.

---

## 9. Art & Audio Direction

### Visuals
- Crisp pixel art at 480×270 logical resolution (scales cleanly to 960×540, 1920×1080 and so on).
- Floors get extra care. Tells must be **subtle but visible at phone size**, so test every tell on a real phone.
- Each world has a clear mood: the Showroom is bright and clean, the Rooftops are blue and rainy, the Mines are warm lantern-orange against black, the Hall of Mirrors is silver and cold, and The Painting looks like brushstrokes.

### Audio
- Different footstep sounds per material.
- Pebbles: *tok* (solid), *tink* (invisible), silence → faint *fwip* (fake).
- Ambience: rain on rooftops, creaking lantern chains, the hum of the gallery.
- Music: calm and curious (soft marimba and synth pads). It never rushes you, because this is a careful game.

---

## 10. Fairness Rules

1. **Every world's tell is introduced in a safe room** with a safety net below.
2. **No blind leaps.** Every required floor has at least one honest tell, or can be tested with a pebble you have in that room.
3. **The pebble never lies**, ever.
4. **Consistency:** within a world a tell's meaning never changes, except at the signposted "Betrayal" room.
5. **Short rooms, instant restart** (under 0.5 s).
6. **Look-ahead is always available**, so players can see the next floor before committing.

---

## 11. Accessibility & Comfort

- **Tells never rely on colour.** They're based on shape, motion, particles and sound.
- **High-contrast tells** assist option: exaggerates every tell (thicker grout, bigger splashes).
- **Reduce motion:** parallax tells still need to work, so in this mode painted floors get a faint frame outline instead.
- **Slow-motion assist** (75% speed), like *Celeste*'s assist mode.
- Remappable keys and full gamepad support.
- Mobile buttons are large and placed in the bottom corners.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** with the shared `engine/platformer` (fixed 60 Hz updates, tile collisions, camera).
- **Floors are entities**, not plain tiles, because they have state: crumble timers, reveal timers, the return-trip flag.
- **Render layers (back to front):**
  1. Far background (parallax 0.3)
  2. **Painted-floor layer** (parallax 0.85). It's drawn so it lines up perfectly with the real floor **when the camera is at the room's starting position**. When the camera moves, it slides.
  3. Main layer (parallax 1.0): real floors, player, pebbles
  4. Particles: rain, splashes, dust
  5. Lighting (World 3): a dark overlay with the lantern light cut out (radial gradient + `destination-out` compositing)
  6. HUD
- **Shadows:** each real floor gets a dark shape on the back wall, offset by the lantern's angle. Mimic floors use a fixed offset that doesn't follow the lantern (that's the betrayal tell).
- **Rain:** a pooled particle system (~300 drops) that collides with "splashable" surfaces. Mimic floors spawn splashes on a deliberately off-beat timer.
- **Level authoring:** LDtk (a free 2D level editor) exporting JSON, with layers for tiles, floor entities, pickups, spawn and exit.

### Data model
```ts
type FloorKind =
  | "solid" | "fake" | "crumble" | "invisible"
  | "painted" | "mimic" | "returnTrip";

interface FloorEntity {
  id: string;
  kind: FloorKind;
  x: number; y: number; w: number; h: number;     // in tiles
  look: "stone" | "wood" | "glass" | "tile";      // what it pretends to be
  tells?: {
    grout?: "aligned" | "offset";
    splash?: "real" | "none" | "fakeOffbeat";
    shadow?: "real" | "none" | "fakeStatic";
    parallax?: number;                             // painted floors: 0.85
  };
  crumbleMs?: number;                              // default 400
}

interface RoomDef {
  id: string;                    // "2-04"
  name: string;                  // "Bridge of Nothing"
  world: 1 | 2 | 3 | 4 | 5 | 6;
  pebbles: number;
  floors: FloorEntity[];
  pickups: { x: number; y: number; type: "pebble" }[];
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  safetyNet?: boolean;           // teaching rooms
  parTimeMs: number;
}
```

### Folder structure
```
src/games/fake-floor/
  index.tsx
  floors/
    types.ts  behaviours.ts       # crumble, reveal, return-trip logic
  render/
    layers.ts  shadows.ts  rain.ts  lighting.ts
  rooms/                          # LDtk JSON exports
  ui/
    Hud.tsx  WorldMap.tsx  RoomToast.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Tells too subtle on small screens | Test on real phones early; high-contrast tells option |
| Rain + lighting too slow on mobile | Particle cap, pre-rendered light masks, lower particle count on low-end devices |
| Painted floors confusing in screenshots/videos | That's the point. Make sure the "look ahead" tool always exposes them |

---

## 13. Build Roadmap

- [x] **M1: Movement + floors.** Platformer kit integration, solid/fake/crumbling floors, pebbles, World 1
- [x] **M2: Rain world.** Particle rain, splashes, invisible floors, World 2
- [x] **M3: Lantern world.** Lighting, shadows, return-trip floors, World 3
- [x] **M4: Betrayal + painting.** Mimic floors, parallax painted floors, Worlds 4–5, final room
- [x] **M5: Polish.** Medals, achievements, accessibility options, mobile controls tuning
- [ ] **Later:** room editor, Daily Room, Blindfold mode

---

## 14. Definition of Done

- All 51 rooms are completable, and every required floor has an honest tell or an available pebble (checked in a design review spreadsheet for every room).
- Restart takes under 0.5 seconds.
- Tells are readable on a 6-inch phone screen (checked with 3+ testers).
- Steady 60 fps on a mid-range phone in the rain and lantern worlds.
- Progress and medals survive page reloads.

---

## 15. As Built

Fake Floor is playable at `/games/fake-floor/play`: 50 rooms in five worlds and The Floor (51), all seven floor kinds plus the Floor's flipping tiles, pebbles that never lie, every tell from §3 (grout, rain, lantern shadows, dust, parallax, and World 4's faked ones), look-ahead, safety nets, the three medals, time trials, ten hidden pebbles, seven achievements, high-contrast tells, assist mode, remappable keys, gamepads and touch. The art (Endesga 32 pixel art), the music (marimba and pads, a tune per world) and the sounds (ZzFX) are all generated in code: there are no asset files.

It reuses the platformer kit TrapSprint built (`engine/loop`, `input`, `replay`, `sprites`, `platformer/`) and adds a few shared pieces: `engine/pixel-font.ts` (the 3 × 5 font, moved from TrapSprint), `engine/audio/sfx-bank.ts` (ZzFX sounds through the arcade's audio engine, now used by both games), `games/shared/fit.ts` (whole-pixel canvas scaling) and `games/shared/gamepad.ts` (gamepad buttons on menus).

### The rooms

| Room | Name | Floors | Tells there | Pebbles | Par (s) |
|---|---|---|---|---|---|
| 1-01 | Welcome Mat | fake (nets) | grout | 0 | 7.0 |
| 1-02 | Grout Expectations | fake (nets) | grout | 0 | 9.0 |
| 1-03 | Pebble Pusher | fake (nets) | grout | 3 | 7.0 |
| 1-04 | Crumble Zone | crumbling (nets) | grout | 1 | 9.0 |
| 1-05 | Showroom Floor | fake | grout | 2 | 11.0 |
| 1-06 | Steps | fake (hidden pebble) | grout | 2 | 10.5 |
| 1-07 | Checkerboard | fake | grout | 2 | 9.5 |
| 1-08 | Clearance Sale | crumbling, fake | grout | 2 | 11.0 |
| 1-09 | Odd One Out | fake (hidden pebble) | grout | 1 | 12.5 |
| 1-10 | Grand Opening | fake, crumbling | grout | 3 | 17.0 |
| 2-01 | The Dry Tile | fake (nets) | rain | 0 | 7.0 |
| 2-02 | Puddle Jumping | fake (nets) | rain | 1 | 9.0 |
| 2-03 | Splash Zone | invisible (nets) | rain | 1 | 9.0 |
| 2-04 | Bridge of Nothing | invisible | rain | 1 | 11.0 |
| 2-05 | Skylights | invisible, fake, crumbling | rain | 2 | 11.0 |
| 2-06 | Fire Escape | invisible, fake (hidden pebble) | rain | 2 | 9.5 |
| 2-07 | Downpour | fake, invisible, crumbling | heavy rain | 2 | 13.0 |
| 2-08 | Drizzle | fake, invisible | light rain | 3 | 11.0 |
| 2-09 | Leap of Faith | invisible (hidden pebble) | rain | 2 | 12.0 |
| 2-10 | Storm | crumbling, fake, invisible | heavy rain | 3 | 17.0 |
| 3-01 | Shadowless | fake (nets) | lanterns, dust | 0 | 6.5 |
| 3-02 | Swing Shift | fake (nets) | lanterns, dust | 1 | 9.0 |
| 3-03 | Dust Bowl | invisible, fake (nets) | lanterns, dust | 1 | 9.0 |
| 3-04 | Plank Walk | fake, crumbling | lanterns, dust | 2 | 11.0 |
| 3-05 | Two Lanterns | fake | lanterns, dust | 2 | 11.0 |
| 3-06 | Cave-In | crumbling, invisible, fake (hidden pebble) | lanterns, dust | 2 | 11.5 |
| 3-07 | Round Trip | return-trip, fake (nets, key) | lanterns, dust | 1 | 18.0 |
| 3-08 | Echo | return-trip, fake, crumbling (key, hidden pebble) | lanterns, dust | 2 | 23.5 |
| 3-09 | Pitch Black | fake, invisible | lanterns, dust | 3 | 11.0 |
| 3-10 | Deep Shaft | return-trip, fake, crumbling, invisible (key) | lanterns, dust | 3 | 25.0 |
| 4-01 | Betrayal | fake, mimic (nets) | chandeliers | 1 | 7.0 |
| 4-02 | Off-Beat | fake, mimic (nets) | rain | 1 | 8.0 |
| 4-03 | Still Life | mimic, fake (nets) | chandeliers | 1 | 9.0 |
| 4-04 | Reflections | mimic, fake, invisible | rain | 2 | 11.0 |
| 4-05 | Chandelier | mimic, fake (hidden pebble) | chandeliers | 2 | 11.0 |
| 4-06 | Smoke and Mirrors | invisible, mimic, fake | chandeliers, dust | 2 | 11.5 |
| 4-07 | Funhouse | mimic, fake, invisible | rain, chandeliers | 2 | 12.0 |
| 4-08 | Double Take | return-trip, mimic, fake (key) | chandeliers | 2 | 20.5 |
| 4-09 | Trust Nothing | fake, mimic, invisible (hidden pebble) | rain, chandeliers | 2 | 11.5 |
| 4-10 | Mirror, Mirror | invisible, mimic, fake, crumbling | rain, chandeliers | 3 | 17.0 |
| 5-01 | Wet Paint | painted (nets) | paint (depth 0.88) | 0 | 9.5 |
| 5-02 | Brushwork | painted (nets) | paint (depth 0.88) | 1 | 11.0 |
| 5-03 | Landscape | painted, invisible, fake (nets) | rain, paint (depth 0.9) | 1 | 11.5 |
| 5-04 | Crackle Glaze | crumbling, painted | paint (depth 0.9) | 2 | 11.5 |
| 5-05 | Starry Night | painted, fake | lanterns, paint (depth 0.9) | 2 | 12.0 |
| 5-06 | Gallery | painted (hidden pebble) | paint (depth 0.92) | 3 | 12.5 |
| 5-07 | Mosaic | fake, painted | grout, paint (depth 0.9) | 2 | 11.5 |
| 5-08 | Restoration | return-trip, painted (key) | paint (depth 0.9) | 2 | 22.0 |
| 5-09 | Perspective | painted (hidden pebble) | paint (depth 0.95) | 2 | 13.0 |
| 5-10 | The Frame | painted, crumbling, invisible, fake | rain, paint (depth 0.93) | 3 | 17.5 |
| ★ | The Floor | flipping, fake, invisible, mimic | grout, rain, lanterns, dust | 3 | 19.5 |

Par is the solver's time from your first step to the door, plus a third and a second and a half, rounded up to half a second.

### The tells, as drawn

| Floor | Tell |
|---|---|
| Fake (Showroom, The Floor) | Its grout grid is shifted 3 px across and 2 px down, so the lines jog where it meets a real tile |
| Fake (rain) | Raindrops fall straight through it: no splashes, while every real floor splashes |
| Fake (lanterns) | No shadow on the back wall; real floors' shadows swing with the lantern |
| Invisible | Rain splashes on nothing; dust settles on nothing; a pebble makes it "tink" and glow for 3 s |
| Crumbling | Honestly cracked; it shakes and sheds dust for 0.4 s once you're on it |
| Return-trip | Holds you once; when you've left it, a faint crack appears and it behaves like a fake (no splashes, no shadow, shifted grout) |
| Mimic (rain) | It splashes, but between the gusts: the rain (and its sound) swells every 2.4 s, and its splashes come in the lulls |
| Mimic (lanterns) | It has a shadow, but it's painted on: it stays put while the lantern swings |
| Painted | It's on the background, a little deeper than the floors, so it slides when the view moves (it lines up where you'd stand to look at it); in the rain it stays dry; under a lantern its shadow is still. With reduce motion on it doesn't slide, it wears a dashed frame |
| Flipping (The Floor) | Whatever it is right now shows every tell at once, and a bright shimmer sweeps across it in the half second before it flips |

### Differences from the draft

- **Rooms are text, not LDtk**, like TrapSprint's: a few rows of characters per room (`rooms/world*.ts`); rock carries on down as pillars (`rooms/build.ts`), so a map is just the rows where something happens. Rooms are 17 rows tall and 30 to 100 columns wide; the view is 480 × 272 (TrapSprint's), not 480 × 270.
- **A solver proves every room**, like TrapSprint's: a beam search on the real simulation (`core/solver.ts`, with a navigation map for direction). Its runs (`rooms/dev-runs.ts`, regenerated with `UPDATE_DEV_RUNS=1`) set the par times and are replayed by the tests.
- **The design review is a test.** `rooms/rooms.test.ts` checks, room by room, that every floor that lies has at least one honest tell (`core/tells.ts`, the same rules the renderer draws), that every world's tell and every new floor is introduced over a safety net, that lanterns light every floor that lies, that paint only appears where the view can move, and that every hidden pebble can be reached (the solver goes and gets it).
- **Safety nets put you back on the last safe floor** (and mend any crumbled floors) instead of restarting the room; they still count as a fall. They're under the whole pit in each world's first rooms. Assist can put them everywhere.
- **Painted floors line up from where you'd stand to look at them** (the camera settled just before them), rather than from the room's start: on long rooms the slide would otherwise be far too big. Their depth varies by room (0.88 in the first rooms, 0.95 in Perspective).
- **Mimic splashes are off the beat of the gusts.** The rain comes in gusts every 2.4 s, which you can see (more drops) and hear (the rain swells); real floors splash most in the gusts, mimics in the lulls.
- **Return-trip floors turn as soon as you've stepped off them**, not on a second crossing, and they hold as long as you're on them. Five rooms (3-07, 3-08, 3-10, 4-08 and 5-08) put the key at the far end, so you come back over them.
- **The Floor** has breathing tiles (all flip together), two rolling waves (a little slower than you can walk) and a checkerboard that swaps every 0.75 s, among plain fakes, mimics and invisible floors, under rain and lanterns, with eyes in its rock that follow you.
- **Medals are per visit and kept once earned**: Clean (no falls in the visit, safety nets included), Barefoot (no pebbles thrown in the visit) and Quick (under par). The clock starts on your first step: looking ahead and throwing pebbles are free. R restarts the room but doesn't forget the visit's falls and pebbles.
- **The room-complete card** is a toast over the next room, which is already running. A world's last room ends on a "world complete" card; The Floor ends on the closing line.
- **Time trials** play a world's ten rooms on one clock (from your first step, falls included) with splits. **Barefoot Champion** is a time trial without a pebble, **Eagle Eye** is the Hall of Mirrors' time trial without a fall. Two achievements were added to the plan's five: **Leap of Faith** (stepping onto an invisible floor no pebble has tested) and **Grounded** (crossing The Floor).
- **Assist** is slow motion (75%), unlimited pebbles and safety nets everywhere; any of them turns medals off for the room but still opens the next. **High-contrast tells** isn't an assist: thicker grout and a bigger jog, bigger and more splashes, darker and longer shadows.
- **Aiming**: click (or tap) any floor to lob a pebble at it; the arc is shown while you aim. With a keyboard or gamepad, tap F (X) to throw at the floor two tiles ahead, or hold it to walk the target out to eight tiles and back; the right stick aims freely.
- **Screen readers** hear the signs, the pebble's answer ("Tok", "Tink", "Silence") and every fall, from a live region over the canvas.

### Testing (as built)

- `rooms/dev-runs.test.ts`: every room replays the solver's run to the door, tick for tick, within a minute.
- `rooms/rooms.test.ts`: the design review above, plus the room count, unique names, unlock order, and which room introduces each kind of floor.
- `core/world.test.ts`: each floor behaves as described; a pebble at each kind of floor gives the true answer; lobs land where aimed; nets, keys, pickups.
- `core/session.test.ts`: the clock starts on your first step (not on looking or throwing), falls restart the room in 22 ticks, R isn't a fall, nets don't restart, time trials' clock, assist mid-room.
- `core/progress.test.ts`: falls and pebble counts, medals and their rules, assist, time trials and every achievement, par times.
- `audio/audio.test.ts`: every sound builds, is short and doesn't clip; the pebble's three answers differ; each world's footsteps; every tune has whole bars and stays calm.
- `tests/e2e/fake-floor.spec.ts`: the real build in Chromium on a desktop and a phone (the logo falling through the floor, the Welcome Mat's net and a clear with its medal card, pebbles by key, click and tap, a fall and a restart, pause and assist, unlocks, time trials, touch controls).
- Frame rate: 60 fps in the heaviest rooms (heavy rain, rain under chandeliers, The Floor), also with the CPU slowed 4×.

