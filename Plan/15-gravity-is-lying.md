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

- [ ] **M1: Gravity physics.** 4-direction gravity frames, levers, zones, scarf rope, World 1
- [ ] **M2: Flipping.** Player flip, spikes on both sides, World 2
- [ ] **M3: Lies.** Lying HUD arrow, painted arrows, Isaac + leaf tell, timed rotation, World 3
- [ ] **M4: Rotation + orbit.** Camera rotation, gravity hills, World 4; planetoids + fake planets, World 5
- [ ] **M5: Finale + polish.** Isaac's Tree, lying anchors, ending, Truth Mode, apples, comfort options
- [ ] **Later:** room editor, daily room, Zero-G world

---

## 14. Definition of Done

- Every room is completable, and in every liar room at least one truth anchor shows the real gravity (checked in design review).
- Every gravity change is announced at least 750 ms before it happens (tested).
- No gravity change can push Newt inside a wall (automated tests).
- The whole game is completable with reduce motion on (no camera rotation).
- 60 fps on a mid-range phone, including scarf and particle effects.
- Progress and apples survive page reloads.
