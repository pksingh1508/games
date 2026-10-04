# Gravity Is Lying

> **"Down is a matter of opinion."**

| | |
|---|---|
| **Genre** | Gravity puzzle-platformer |
| **Core mind trick** | Gravity changes direction, and the things that tell you which way is "down" (the arrow, the camera, the narrator) don't always tell the truth |
| **Controls** | Keyboard / gamepad (desktop) · Touch buttons (mobile) |
| **Session length** | 1–4 minutes per room · 5 worlds × 8 rooms + a final world (about 3 hours) |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/gravity-is-lying` |
| **Code folder** | `src/games/gravity-is-lying/` |

---

## 1. About the Game

### The pitch
**Newt** is a small explorer with a very long scarf. Newt's guide is **Isaac**, a talking apple who claims to be the world's leading expert on gravity (because, as he tells everyone, he once fell on a very famous head).

In each room, gravity points somewhere: down, up, left or right. Gravity switches flip it. Coloured zones change it. Later, you can flip it yourself. A gravity arrow in the corner of the screen tells you which way is down. Isaac tells you too.

**They're both lying.** Sometimes the arrow points the wrong way. Sometimes the camera is quietly rotated, so a room that *looks* upright actually pulls you sideways. And Isaac? Isaac lies whenever he feels like it.

The truth is still there, if you know where to look: the way Newt's scarf hangs, the way water drips, the way dust drifts and lamps sway. **The world can't hide which way is down. Only the interface can.**

### How it messes with your mind
- **We trust what we see over what we feel.** In real life, a tilted room can make people misjudge which way is vertical (the *rod-and-frame* effect). This game tilts the room on purpose.
- **Gravity hills.** Real places exist where cars seem to roll uphill, because the horizon is hidden. Some rooms recreate that illusion.
- **Spatial reorientation.** Every gravity change forces your brain to rebuild its sense of "up". It's tiring in a fun way.
- **Reading physics as clues.** Players learn to read the world itself (drips, dust, the scarf) instead of the UI. That's a satisfying skill to grow.

### Inspirations
*VVVVVV* (gravity flipping), *Super Mario Galaxy* (round planetoid gravity), *And Yet It Moves* (rotating the world), *Fez* (perspective tricks), and real gravity-hill illusions.

---

## 2. How to Play

### Goal
Reach each room's exit portal. Collect up to 3 golden apples along the way.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Walk along the floor | `←` `→` / `A` `D` / left stick | ◀ ▶ buttons |
| Jump (away from the floor) | `Space` / `↑` / `W` / gamepad A | Jump button |
| Flip gravity 180° (World 2+) | `F` / `↓` / gamepad B | Flip button |
| Pull a gravity lever | Walk into it / `E` | Walk into it / tap it |
| Restart room | `R` | ⟳ button |
| Pause | `Esc` | ⏸ button |

> **Controls are relative to Newt's current floor** by default: "left/right" always means walking along whatever surface Newt is standing on, and "jump" always means away from it. An option switches to screen-relative controls.

### The core loop
1. **Enter a room.** Work out which way gravity *really* points.
2. **Plan** a route that uses gravity changes.
3. **Move, switch, flip.** Gravity changes are announced with a rising hum.
4. **Fall into spikes / out of the room** → instant restart of the room.
5. **Reach the portal** → apples counted → next room.

---

## 3. Game Mechanics

### Gravity sources
| Source | What it does | Introduced |
|---|---|---|
| **Gravity levers** | Set the whole room's gravity to one direction | World 1 |
| **Gravity zones** | Coloured areas with their own gravity direction (painted arrows show it… usually) | World 1 |
| **Player flip** | Flip gravity 180° (only when standing on a surface) | World 2 |
| **Timed rotation** | The room's gravity rotates 90° every few seconds | World 3 |
| **Planetoids** | Small round worlds that pull everything toward their centre | World 5 |

### Truth anchors (things that never lie)
These always follow the **real** gravity:
- **Newt's scarf** hangs and trails in the real "down" direction.
- **Water drips** fall in the real direction.
- **Dust motes** drift in the real direction.
- **Hanging lamps and chains** hang in the real direction.

> Only in the final world do the outside anchors start lying. Then the only thing left to trust is **Newt's own scarf**. *"Trust yourself."*

### Liars
| Liar | How it lies | Appears |
|---|---|---|
| **The HUD arrow** | Points the wrong way in "liar rooms" | World 3 |
| **Painted zone arrows** | Zone arrows painted in the wrong direction | World 3 |
| **The camera** | The whole view is rotated, so the room looks upright but gravity pulls sideways on screen | World 4 |
| **Isaac** | Makes claims ("Gravity flips in 3… 2… 1…") that may be false | Whole game |
| **Fake planetoids** | Painted background planets with no gravity at all | World 5 |

### Isaac's tell
Isaac has a little leaf on his head. **When he lies, the leaf droops.** When he's telling the truth, it stands up straight.

### Movement physics
- Run, jump (variable height), coyote time and jump buffering, all relative to the current gravity.
- When gravity changes, Newt keeps their momentum and smoothly rotates to face the new "up".
- Gravity changes never teleport Newt or push them inside walls.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Lying Arrow** | The HUD arrow shows gravity | It's wrong in liar rooms | The scarf, drips and dust all disagree with it |
| **The Tilted Room** | The room looks upright, so down is down | The camera is rotated 90°; you fall "sideways" | Lamps hang at an angle; the scarf points sideways |
| **Gravity Hill** | Water flows downhill | The room's "floor" is tilted, so water seems to flow uphill | The drips fall straight in the real direction |
| **The Fake Countdown** | Isaac says gravity will flip | Nothing happens. You jumped for nothing | Drooping leaf |
| **The Mid-Jump Flip** | Gravity stays the same during a jump | It flips mid-air on a timer | A rising hum 0.75 s before |
| **Painted Arrows** | Zone arrows show the zone's gravity | In liar rooms they're painted wrong | Dust inside the zone drifts the real way |
| **The Painted Planet** | Planets pull you in | Some are background paintings | They don't pull the dust around them |
| **Even Water Lies** | Anchors never lie | In the final world, drips and lamps start lying | The scarf is the only honest thing left |

---

## 5. Levels & Progression

### Worlds
| World | Name | Rooms | New ideas |
|---|---|---|---|
| 1 | **The Lab** | 8 | Gravity levers and zones; the HUD arrow is honest; scarf/drip/dust anchors appear quietly |
| 2 | **Flip Facility** | 8 | Player flip; spikes on floors *and* ceilings |
| 3 | **The Liar's Gallery** | 8 | The HUD arrow lies; painted arrows lie; timed rotation; anchors become essential |
| 4 | **Tilted Town** | 8 | Camera rotation; buildings and streets make the tilt convincing; gravity hills |
| 5 | **Orbit** | 8 | Round planetoids with gravity toward their centre; jumping between them; fake planets |
| ★ | **Isaac's Tree** | 4 | Anchors lie; trust only the scarf; the final confrontation |

### Example rooms
- **1-1 "Which Way Is Down?":** a simple room with one lever that flips gravity up. Walk on the ceiling to the portal.
- **2-5 "Spike Sandwich":** spikes on both the floor and the ceiling, with safe gaps that don't line up. Flip at the right moments.
- **3-1 "The Arrow Lies" (signposted):** the HUD arrow points down, but the scarf hangs up. A sign reads *"Don't believe everything you're shown."* There's a safety net.
- **4-3 "Main Street":** a perfectly normal-looking town street, which is actually a wall. You're walking up it.
- **5-6 "Gas Giant":** three planetoids; one is painted; jump between the real two.

### Final world: Isaac's Tree
- Climb a giant tree to reach Isaac, who sits at the top.
- The drips, dust and lamps all start lying. Only the scarf is honest.
- **The reveal:** Isaac admits he never fell down onto anyone's head. *He fell up.* "Gravity was lying all along, and so was I."
- To reach him, you have to make gravity point up and "fall" to the top of the tree.
- **Ending:** Isaac, humbled, becomes an honest guide. A bonus **Truth Mode** unlocks where Isaac comments honestly on every room.

---

## 6. Features

### MVP (must-have)
- Platformer physics with 4-direction gravity (shared `engine/platformer`, generalised)
- Gravity levers and zones
- Truth anchors (scarf, drips, dust)
- Worlds 1–2 (16 rooms) + player flip
- Instant restart, save progress

### Full version
- The lying HUD arrow, painted arrows, Isaac's lies + leaf tell
- Camera rotation (Tilted Town) + gravity hills
- Round planetoid gravity (Orbit)
- Isaac's Tree + ending + Truth Mode
- Golden apples, achievements, speedrun timer

### Later
- Room editor
- Daily room
- A "Zero-G" bonus world with no gravity at all

---

## 7. Scoring, Rewards & Replay Value

### Per room
- Up to **3 golden apples**, placed in tricky spots.
- Best time.

### Achievements
| Achievement | How to get it |
|---|---|
| **Upside Downer** | Spend 10 minutes total walking on ceilings |
| **Never Trusted the Arrow** | Clear World 3 with no deaths |
| **Ground Control** | Clear World 4 with camera rotation on (not in reduce-motion mode) |
| **Orbital** | Jump between 3 planetoids without touching the ground |
| **Apple Picker** | Collect every golden apple |
| **Fell Up** | Finish the game |

---

## 8. Screens & UI

1. **Title:** the logo slowly rotates. Press Start and the menu falls *up* off the screen.
2. **World map:** a tower drawn sideways, then upside down, then sideways again.
3. **Room HUD:**
   - The **gravity arrow** (top right). It lies in some rooms.
   - Golden apples collected
   - Isaac's speech bubble when he talks
4. **Room complete:** a quick toast with apples and time. No waiting.
5. **Pause / settings:** reduce motion, control mode (relative / screen), assist options, volume.

---

## 9. Art & Audio Direction

### Visuals
- **Clean, bold shapes with clear silhouettes**, so rooms are readable at any rotation.
- Art is drawn so that "up" isn't obvious from the art alone (in World 4 the tilt must be convincing: windows, doors and trees all aligned to the fake "up").
- **Truth anchors are always clearly visible**: Newt's scarf is long and bright, drips sparkle, dust motes catch the light.
- Each world has its own palette: lab white and teal, factory orange, gallery gold, town pastels, space purple and black, tree green and gold.

### Audio
- **The gravity hum:** a rising tone before every gravity change, the main warning sound.
- A "whoomp" when gravity flips.
- Isaac speaks in a pompous little babble.
- **Music:** light and floaty, with a melody that literally turns upside down (inverted) when gravity is up.

---

## 10. Fairness Rules

1. **Truth anchors never lie**, except in the final world, which is clearly signposted and still leaves the scarf honest.
2. **Every gravity change is announced** with the hum at least 0.75 s before.
3. **Each liar is introduced in a safe room** (with a safety net) before it's used for real.
4. **Camera rotations are smooth** (90° over at least 0.6 s, never instant snaps).
5. **Short rooms, instant restart.**
6. **Gravity changes never trap Newt inside walls.** The physics resolves collisions safely after every change.

---

## 11. Accessibility & Comfort

> Rotating cameras can cause motion sickness, so comfort options are essential.

- **Reduce motion:** the camera never rotates. Instead, a small rotated "frame" icon in the HUD shows how the room is tilted. Truth anchors still work the same way, so the game stays fair.
- **Motion warning** before World 4.
- **Control mode:** relative to Newt's floor (default) or relative to the screen.
- **Assist mode:** always show the *true* gravity arrow (apples don't count while it's on), slow motion, invincibility.
- Remappable keys and gamepad support.
- Anchors and hazards are readable by shape, not just colour.

---

## 12. Technical Plan

### Architecture
- **Canvas 2D** with the shared `engine/platformer`, generalised to work with any gravity direction.
- **Gravity frames:** for the 4 main directions, the physics converts positions and velocities into a "local" frame where gravity is always "down", runs the normal platformer code, and converts back. This means all the tuned platformer code is reused as-is.
- **Planetoids (World 5):** a separate, small physics path using circle collisions, with gravity pointing to each planetoid's centre.
- **Camera:** a world-to-screen transform with rotation (`ctx.setTransform`), eased smoothly. The HUD is drawn separately in screen space.
- **Newt's rotation:** eases to match the new "up" after a gravity change.
- **The scarf:** a small rope simulation (6–8 linked points using Verlet integration) pulled by the **real** gravity vector. The truth anchor comes straight out of the physics.
- **Particles** (drips, dust) also use the real gravity vector.
- **Level authoring:** LDtk JSON with layers for tiles, gravity zones (real direction + painted direction), levers, anchors, Isaac's lines and camera rotation zones.

### Data model
```ts
type GravityDir = "down" | "up" | "left" | "right";

interface GravityZone {
  rect: Rect;
  direction: GravityDir;          // the truth
  painted: GravityDir;            // what the painted arrows show (a lie when different)
}

interface RoomDef {
  id: string;                     // "3-06"
  world: 1 | 2 | 3 | 4 | 5 | 6;
  startGravity: GravityDir;
  hudArrowLies?: boolean;
  cameraRotation?: 0 | 90 | 180 | 270;
  zones: GravityZone[];
  levers: { at: Vec2; sets: GravityDir }[];
  timedRotation?: { everyMs: number; telegraphMs: number };   // telegraphMs ≥ 750
  planetoids?: { center: Vec2; radius: number; strength: number; fake?: boolean }[];
  anchors: { kind: "lamp" | "drip" | "dust" | "chain"; at: Vec2; lies?: boolean }[];
  isaac?: { at: "start" | Vec2; line: string; lie: boolean }[];  // lie → drooping leaf
  apples: Vec2[];
  spawn: Vec2;
  portal: Vec2;
  safetyNet?: boolean;
}
```

### Folder structure
```
src/games/gravity-is-lying/
  index.tsx
  physics/
    gravity-frame.ts            # convert to/from the local "gravity is down" frame
    planetoid.ts
    scarf.ts                    # Verlet rope
  world/
    zones.ts  levers.ts  timed-rotation.ts
  render/
    camera.ts  anchors.ts  hud-arrow.ts
  story/
    isaac-lines.ts
  rooms/                        # LDtk JSON exports
  ui/
    Hud.tsx  WorldMap.tsx  RoomToast.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Motion sickness from camera rotation | Reduce-motion alternative; smooth easing; motion warning |
| Controls feel confusing when rotated | Relative controls by default; screen-relative option; playtest both |
| Physics bugs at gravity changes (corners, getting stuck in walls) | Resolve collisions right after each change; automated tests for every lever and zone |
| Planetoid physics is different from tile physics | Keep it a separate, small system just for World 5 |

---

## 13. Build Roadmap

- [x] **M1: Gravity physics.** 4-direction gravity frames, levers, zones, scarf rope, World 1
- [x] **M2: Flipping.** Player flip, spikes on both sides, World 2
- [x] **M3: Lies.** Lying HUD arrow, painted arrows, Isaac + leaf tell, timed rotation, World 3
- [x] **M4: Rotation + orbit.** Camera rotation, gravity hills, World 4; planetoids + fake planets, World 5
- [x] **M5: Finale + polish.** Isaac's Tree, lying anchors, ending, Truth Mode, apples, comfort options
- [ ] **Later:** room editor, daily room, Zero-G world

---

## 14. Definition of Done

- Every room is completable, and in every liar room at least one truth anchor shows the real gravity (checked in design review).
- Every gravity change is announced at least 750 ms before it happens (tested).
- No gravity change can push Newt inside a wall (automated tests).
- The whole game is completable with reduce motion on (no camera rotation).
- 60 fps on a mid-range phone, including scarf and particle effects.
- Progress and apples survive page reloads.

---

## 15. As Built

Gravity Is Lying is playable at `/games/gravity-is-lying/play`: 44 rooms (five worlds of eight, then Isaac's Tree), four-way gravity with levers, zones, your own flip and timed turns, round planetoids, every liar from §3 (the HUD arrow, painted zone arrows, the camera, Isaac and his leaf, painted planets, and in the tree the drips, dust and lamps) and every truth anchor (the scarf, drips, dust, lamps), three golden apples in every room, six achievements, the ending and Truth Mode, reduce motion, both control modes, assist, remappable keys, gamepads and touch. The art is drawn in code with vector shapes (crisp at any angle the camera turns to), and the music (a music box over pads, a tune per world, its melody mirrored when Newt is upside down), the hum and the sounds (ZzFX) are generated in code: there are no asset files.

It reuses the platformer kit (`engine/loop`, `input`, `replay`, `platformer/`) unchanged except for one split: `stepRunner` is now `steerRunner` (speeds, jumps, gravity) followed by the moves, so planets can steer Newt with the same feel and move it their own way. Everything else is the game's own.

### The rooms

| Room | Name | What's in it | What lies | Net | Solver (s) |
|---|---|---|---|---|---|
| 1-1 | Which Way Is Down? | 1 lever | — |  | 2.9 |
| 1-2 | Lever Pull | 2 levers | — |  | 3.6 |
| 1-3 | Sideways | 1 lever | — |  | 2.2 |
| 1-4 | Zone In | 1 zone | — |  | 3.0 |
| 1-5 | Four Walls | 3 levers | — |  | 2.9 |
| 1-6 | Drip Drop | 3 zones | — |  | 3.5 |
| 1-7 | Lamp Light | 2 levers | — |  | 3.1 |
| 1-8 | Exit Experiment | 3 levers, 1 zone | — |  | 8.6 |
| 2-1 | Flip Switch | flip | — |  | 3.6 |
| 2-2 | Ceiling Fan | flip | — |  | 6.2 |
| 2-3 | Look Both Ways | flip | — |  | 3.1 |
| 2-4 | No Flip Zone | 1 zone, flip | — |  | 4.3 |
| 2-5 | Spike Sandwich | flip | — |  | 4.5 |
| 2-6 | Wall to Wall | 1 lever, flip | — |  | 6.3 |
| 2-7 | Narrow Escape | flip | — |  | 4.8 |
| 2-8 | The Machine | 1 lever, 1 zone, flip | — |  | 3.8 |
| 3-1 | The Arrow Lies | gravity up, 1 zone | arrow (always down), Isaac | yes | 3.0 |
| 3-2 | Painted Arrows | 2 painted wrong | Isaac | yes | 3.4 |
| 3-3 | Tick Tock | turns upside down every 3.0 s | — | yes | 9.6 |
| 3-4 | Countdown | flip | Isaac | yes | 5.3 |
| 3-5 | Mid-Jump Flip | turns upside down every 2.5 s | — |  | 14.8 |
| 3-6 | Gallery of Lies | 3 painted wrong | arrow (mirrored), Isaac |  | 2.7 |
| 3-7 | Turn Table | turns clockwise every 2.5 s | — |  | 9.0 |
| 3-8 | The Curator | 1 painted wrong, flip, turns upside down every 4.0 s | arrow (always down), Isaac |  | 4.7 |
| 4-1 | Tilted Town | — | camera (turned, right up, turns in front of you), Isaac | yes | 4.5 |
| 4-2 | Lamp Lane | 1 lever | arrow (camera's down), camera (turned, left up), Isaac |  | 2.0 |
| 4-3 | Main Street | flip | arrow (camera's down), camera (upside down) |  | 3.4 |
| 4-4 | Gravity Hill | — | arrow (camera's down), camera (level, tilted 12°), Isaac |  | 1.9 |
| 4-5 | Rooftops | 1 lever | arrow (camera's down), camera (turned, right up, tilted -8°) |  | 3.2 |
| 4-6 | Crooked House | 1 zone | arrow (camera's down), camera (turned, left up) |  | 3.6 |
| 4-7 | Upside Downtown | flip | arrow (camera's down), camera (upside down, tilted 8°) |  | 9.7 |
| 4-8 | Town Square | 1 lever, flip | arrow (camera's down), camera (turned, right up) |  | 4.7 |
| 5-1 | Small World | 2 planets | — |  | 3.5 |
| 5-2 | Hop | 3 planets | — |  | 2.4 |
| 5-3 | Painted Planet | 2 planets, 1 painted | Isaac | yes | 3.7 |
| 5-4 | Asteroid Belt | 1 planet, 2 asteroids | — |  | 4.2 |
| 5-5 | Slingshot | 3 planets | — |  | 1.6 |
| 5-6 | Gas Giant | 2 planets, 1 painted | Isaac |  | 1.6 |
| 5-7 | Moons | 3 planets, 2 asteroids | — |  | 4.0 |
| 5-8 | Orbital | 4 planets, 1 painted, 1 asteroid | — |  | 3.3 |
| 6-1 | Roots | gravity up, 1 zone | arrow (always down), Isaac, drips, dust and lamps | yes | 3.4 |
| 6-2 | Branches | 3 painted wrong | Isaac, drips, dust and lamps |  | 5.0 |
| 6-3 | Canopy | turns upside down every 3.0 s | arrow (always down), Isaac, drips, dust and lamps |  | 15.6 |
| 6-4 | The Top | 2 levers | arrow (always down), Isaac, drips, dust and lamps |  | 5.4 |

"Solver" is the solver's time with all three golden apples, from the first move to the portal (`rooms/dev-runs.ts`). Rooms are 30 × 17 tiles of 16 px (480 × 272), Tilted Town's 17 × 17 (so they fit the screen at any quarter turn), Orbit's open space of the same size.

### The truth, as drawn

| Anchor | How it tells the truth |
|---|---|
| Newt's scarf | Nine linked points (Verlet), each pulled by the real gravity where it is: it hangs, trails and drapes over floors the real way, and its tip dangled into a zone bends that zone's way before you step in. It never lies, even in the tree |
| Drips | Lab droppers whose tips point where their water falls; the drops fall the real way and splash on walls and planets |
| Dust | Motes drift the real way; in space they fall toward real planets only, never painted ones |
| Lamps | Pendulums that swing to hang the real way, wherever the camera has turned the room |
| The hum | A rising tone (and the room's edge glowing faster) for 0.75 s before every timed turn, then a "whoomp" |

### Differences from the draft

- **Rooms are text, not LDtk**, like the other platformers: rows of characters per room (`rooms/world*.ts`), with zones, levers, Isaac's lines and the camera beside them. Tilted Town's houses are scenery (`h` fronts, `w` windows, `D` doors, `r` roofs), built upright for the room's camera. Orbit rooms are planets, asteroids and points in pixels.
- **A solver proves every room**, with all three apples: a beam search over the real simulation following each room's waypoints (`core/solver.ts`). Its runs are replayed by the tests. It also found two shortcuts that were closed (1-8's portal got a back wall, 4-8's ceiling got spikes), and the one physics change: momentum from a gravity change mid-jump (a jump turned into a run along the new floor) now fades in the air instead of carrying Newt forever.
- **The design review is a test** (`rooms/rooms.test.ts`): every room that lies keeps an honest drip, lamp or (in space) dust; only the tree's anchors lie; every liar is first met in a room with a safety net; every timed turn is hummed 45 ticks before, the first one too; nothing on any solver route ever overlaps a wall; every Tilted Town room plays the same with the camera level (reduce motion); nobody dies for standing still at the start; every lie Isaac tells has an honest version for Truth Mode.
- **Gravity frames** (`core/gravity.ts`) are as planned: Newt's square 12 px hitbox goes into a frame where gravity is down, runs the shared platformer code, and comes back; the world velocity carries through a change. Planets steer Newt with the same runner in a frame that turns with the surface, then move it themselves (circle collisions).
- **The camera turns in one room only (4-1)**, in front of you; the other Tilted Town rooms are shown already turned (and two tilted, the gravity hills). Turns are eased and never faster than a quarter turn in 0.6 s, and the room shrinks a little while turning so it always fits. With reduce motion the camera never turns and a little frame in the gravity dial shows how the room would be turned. A motion warning comes before Tilted Town.
- **The arrow's lies**: always one direction, the camera's down (Tilted Town), or mirrored (it swaps left and right, so it still moves when gravity does: the Gallery). The true-arrow assist makes it honest, with a yellow ring.
- **Controls**: in Newt mode ◀ ▶ walk along Newt's floor, matching the screen when that floor looks level and meaning Newt's own left and right on walls; in screen mode the four arrows go the way they point. Either way a held key keeps walking the same way through a flip or round a planet (`play/controls.ts`). Up and jump, down and flip share keys in Newt mode.
- **The HUD has its own strip** above the room (or at its side on wide, short screens), so it never hides anything in it; on phones the room sits between the buttons.
- **Isaac** sits in every room and speaks his lines (at the start, at a tick, or when Newt reaches a spot), in a speech bubble over him, with a pompous babble. His leaf droops when he lies. A line on a clock (his countdown in 3-4) cuts in at once; others wait their turn.
- **Golden apples** stay found for the whole visit, deaths included, and count when you reach the portal; none count with assist on (the true arrow, slow motion or invincibility), and neither do best times. Safety nets put Newt back where it last stood (gravity and all); invincibility puts nets everywhere.
- **Achievements**: Upside Downer (ten minutes standing on ceilings), Never Trusted the Arrow (every Liar's Gallery room cleared without dying), Ground Control (every Tilted Town room cleared with the camera turning), Orbital (three different planets in a row, never resting a second on one), Apple Picker, Fell Up. Clearing the last room unlocks Truth Mode (Options), where Isaac tells the truth.
- **The ending** is a card: Isaac admits he fell up, his leaf standing straight up, with your totals and the Truth Mode switch.

### Testing (as built)

- `rooms/dev-runs.test.ts`: every room replays the solver's run to the portal with all three apples, tick for tick.
- `rooms/rooms.test.ts`: the design review above, plus the room count, unique names, and which room introduces each idea.
- `core/world.test.ts`: gravity frames go there and back exactly; Newt falls, lands and walks every way; jumps; levers, zones, flips and the hum; never inside a wall over 3,000 random ticks; spikes, nets, the void, apples and the portal; planets (round and round, painted ones pull nothing, Orbital).
- `core/session.test.ts`, `core/progress.test.ts`, `save.test.ts`: the clock, deaths and restarts, apples kept, invincibility, ceilings; records, assist, unlocks and every achievement; the save's schema.
- `play/controls.test.ts`, `render/camera.test.ts`: both control modes, through flips and round planets and with the camera turned; the camera's view, fit, speed limit and reduce motion.
- `audio/audio.test.ts`: every sound builds, is short and doesn't clip; Isaac's babble; every tune has whole bars, and turns upside down in its own key.
- `tests/e2e/gravity-is-lying.spec.ts`: the real build in Chromium on a desktop and a phone (Start into 1-1 with Isaac, the lever and the arrow, spikes and R, a clear by hopping between planets with its card and its save, pause and the true arrow, the motion warning and reduce motion, unlocks, touch controls).
- Frame rate: 60 fps in the heaviest rooms on an emulated phone, also with the CPU slowed 4×.

