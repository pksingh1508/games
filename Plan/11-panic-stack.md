# Panic Stack

> **"Stack it high. Don't trust anything you stack."**

| | |
|---|---|
| **Genre** | Physics stacking under pressure (arcade puzzle) |
| **Core mind trick** | Objects lie about their weight and shape. The "iron safe" floats, the "feather" weighs a ton, and panic events hit right when your tower looks stable. |
| **Controls** | Drag to place · Rotate · Release to drop |
| **Session length** | 1–3 minutes per level · 36 levels + Endless + Zen |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/panic-stack` |
| **Code folder** | `src/games/panic-stack/` |

---

## 1. About the Game

### The pitch
Items roll in on a conveyor belt. Drag them onto the platform and build a tower that reaches the **goal line**, then keep it standing for **3 seconds**. Simple?

Except the items lie. The heavy iron safe is full of helium and floats away. The feather weighs as much as an anvil. The neat cardboard box has a hidden rounded bottom. The balloon keeps inflating, pushing everything apart. And just when your tower looks perfect: **EARTHQUAKE.** Or a cat walks in. Or the siren goes off and… nothing happens. That was the trick: the panic made you drop your next item badly.

### How it messes with your mind
- **The size–weight illusion** (also called the *Charpentier illusion*). In real life, people misjudge weight based on size and appearance. Here, appearance is actively lying.
- **Judging by looks.** We assume objects behave like their category ("safes are heavy"). The game breaks that mental shortcut.
- **The Yerkes–Dodson law.** A bit of pressure makes you sharper; too much makes you sloppy. The panic meter pushes you past that point.
- **Fake panic.** Some alarms are fake. The real damage comes from your own rushed reaction.

### Inspirations
*Tricky Towers* (physics stacking under pressure), *Jenga*, *Tower Bloxx* and Ketchapp's *Stack*, *Overcooked* (panic and chaos).

---

## 2. How to Play

### Goal
Build a tower that reaches the goal line and holds steady for 3 seconds, before the timer runs out.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Pick up an item | Click and hold on it (on the conveyor) | Touch and hold |
| Move it | Drag | Drag |
| Rotate | `Q` / `E` or mouse wheel | Two-finger twist, or the ⟲ ⟳ buttons |
| Drop | Release | Lift your finger |
| Tap-test an item (hear what it's made of) | Click an item on the conveyor once | Tap an item on the conveyor once |
| "Oops" (undo the last placement, once per level) | `Space` / `Backspace` | ↶ button |
| Pause | `Esc` | ⏸ button |

### The core loop
1. **Look** at the next items on the conveyor (the next 3 are visible).
2. **Test** suspicious items: tap them, or feel how they move when you drag them.
3. **Place** each item before the conveyor pushes it off the edge.
4. **React** to panic events.
5. **Reach the line** → 3-second stability check → **clear!**
6. Too many items fall off, or the time runs out → fail → instant retry.

---

## 3. Game Mechanics

### Win & lose
- **Win:** the top of the tower is above the goal line, and nothing moves much for **3 seconds**.
- **Lose:** 3 items fall off the platform, **or** the timer runs out, **or** a fragile item breaks.
- Items that fall off the conveyor without being placed count as fallen.

### The panic meter (0–100%)
| Goes up when… | Goes down when… |
|---|---|
| Time is running low | You place an item gently |
| Items fall | The tower stays still for a few seconds |
| The tower wobbles | You survive a panic event |
| A panic event hits | |

**Effects of high panic:** faster music, a heartbeat sound, a pulsing red vignette, a slightly faster conveyor, and more frequent events. **At 100%: PANIC!** A big random event hits.

### Items that lie
| Item | Looks like | Really is | Tell |
|---|---|---|---|
| **Iron Safe** | Very heavy | Full of helium. It floats up unless something sits on it | Snappy, floaty drag; hollow "tink" |
| **Feather** | Weightless | As heavy as an anvil | It lags far behind your cursor; "THUD" |
| **Cardboard Box** | Flat-bottomed | A hidden rounded bottom; it rolls | It rocks slightly when picked up |
| **Rubber Duck** | Bouncy | Sticky, like glue | A "squelch" tap sound |
| **Jelly** | Solid | Wobbly and slippery | Jiggles on the conveyor |
| **Ice Cube** | Solid block | Melts and shrinks over 20 s | Little drips |
| **Balloon** | Light | Keeps inflating, pushing other items apart | Grows slowly on the conveyor |
| **Vase** | Decorative | Fragile. It breaks on a hard landing (instant fail) | A "crack" icon and a delicate chime |
| **Cake** | Solid | Squishes flatter under weight | Soft "pff" sound |
| **Magnet** | A normal block | Pulls metal items (safes, anvils) toward it | Paper clips stuck to it |
| **Brick** | A brick | A brick. (Sometimes things are what they look like, which keeps you guessing.) | Normal everything |
| **Bowling Ball** | Heavy and round | Heavy and round | Honest |

### Tells, in general
- **Drag weight:** heavy items lag behind your cursor; light items zip ahead and wobble. *How an item follows your hand reveals its true weight.*
- **Tap test:** tapping an item on the conveyor plays its true sound (thud / tink / boing / squish).
- **X-ray glasses** (power-up, rare): show every item's true shape and weight for 5 seconds.

### Panic events
Every event has a **warning of at least 1.5 seconds**.

| Event | What happens | Warning |
|---|---|---|
| **Earthquake** | The platform shakes side to side | A seismograph icon + rumble |
| **Wind** | A strong push left or right | Flags start waving + whoosh |
| **Cat** | A cat walks onto the platform, bumps the tower, and maybe sits on top | A meow + a paw at the screen edge |
| **Tilt** | Gravity tilts 10° for 3 s | A spirit-level bubble slides |
| **Low Gravity** | Items float slightly for 4 s | Everything starts to sparkle |
| **Ice Age** | Everything becomes slippery | Frost creeps in from the corners |
| **Bird** | A bird lands on top (extra weight) | Its shadow grows |
| **Platform Shrink** | The platform gets narrower | Warning stripes on the edges |
| **Lights Out** | Only silhouettes are visible | Lights flicker |
| **Fake Panic** | A siren, flashing "PANIC!"… and nothing happens | The siren light is a cardboard cut-out |
| **Re-skin** | All items swap appearances mid-level (physics stay the same) | A brief "texture loading" shimmer |
| **Conveyor Rush** | The conveyor doubles its speed for 5 s | Gears spin up with a whine |

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Floating Safe** | Heavy things go at the bottom | It floats away unless something holds it down | Floaty drag + "tink" |
| **The Lead Feather** | Light things go on top | It crushes everything below | Heavy drag lag + "THUD" |
| **The Rolling Box** | Boxes stack nicely | It rolls off | Rocks when picked up |
| **The Growing Balloon** | It stays the same size | It inflates and pushes the tower apart | Slowly growing on the belt |
| **Fake Panic** | An alarm means danger | Nothing happens. Your rushed placement is the danger | The siren is a cardboard cut-out |
| **Re-skin** | You know what each item does by now | Their looks shuffle, but their physics don't | "Texture loading" shimmer |
| **The Honest Brick** | Everything lies | Some things don't | — (keeps you humble) |
| **Last-Second Event** | 3 seconds of stability = safe | Events can start during the stability check | The warning plays first; be ready |

---

## 5. Levels & Progression

### Campaign: 6 locations × 6 levels
| Location | Theme | New ideas |
|---|---|---|
| 1. **The Kitchen** | Plates, cakes, jelly | Basic stacking, the first liar (the rolling box), Earthquake |
| 2. **The Warehouse** | Boxes, safes, anvils | Floating safe, lead feather, Wind, conveyor rush |
| 3. **The Toy Room** | Blocks, ducks, balloons | Sticky duck, balloon, the Cat |
| 4. **The Museum** | Vases, statues, frames | Fragile items, Lights Out, careful placement |
| 5. **The Bakery** | Cakes, dough, ice | Squishing and melting, Ice Age |
| 6. **Space Station** | Floating cargo | Low gravity, magnets, Tilt, Re-skin, everything combined |

### Level difficulty within a location
- **Levels 1–2:** introduce the location's new items in a calm setting.
- **Levels 3–4:** add events.
- **Levels 5–6:** tighter timers, higher goal lines, combos.

### Other modes
- **Endless Tower:** stack forever as the camera rises. Events get more frequent. Score = height.
- **Zen Mode:** no timer, no panic events, no fail. Just stacking (accessibility and relaxation).
- **Daily Stack:** a seeded daily challenge with the same items and events for everyone.

---

## 6. Features

### MVP (must-have)
- Physics stacking with drag, rotate and drop
- Goal line + 3-second stability check
- 8 item types (including 4 liars) with drag-weight and tap-test tells
- 4 panic events (Earthquake, Wind, Cat, Fake Panic) + panic meter
- Locations 1–2 (12 levels)
- Zen mode

### Full version
- All 12 items, all 12 events
- All 6 locations (36 levels)
- Endless Tower, Daily Stack
- X-ray glasses power-up
- Achievements

### Later
- **Local versus:** two players, two towers, events hit both
- Custom level editor
- Global endless leaderboard

---

## 7. Scoring, Rewards & Replay Value

### Stars per level
- ★ Clear the level
- ★★ Clear with no fallen items
- ★★★ Clear with more than half the time left

### Endless score
Height reached, in metres, with milestone medals (10 m, 25 m, 50 m, 100 m).

### Achievements
| Achievement | How to get it |
|---|---|
| **Didn't Fall For It** | Survive 10 Fake Panics without dropping an item |
| **Cat Person** | Finish a level with the cat sitting on top of your tower |
| **Steady Hands** | Clear the Museum without breaking anything |
| **Floating Foundation** | Use a floating safe as the base of a successful tower |
| **Skyscraper** | Reach 50 m in Endless |
| **Never Oops** | Clear a location without using Oops |

---

## 8. Screens & UI

1. **Title:** a wobbly tower spells "PANIC STACK". Clicking Start makes it collapse into the menu.
2. **Location map:** six locations with star counts.
3. **Level screen:**
   - The platform and the goal line (a dashed line with a flag)
   - The conveyor with the next 3 items
   - **Top:** timer, fallen items (❌❌❌), panic meter
   - Event warning icons
   - Stability countdown (3… 2… 1…) when the tower reaches the line
4. **Clear / fail screen:** stars, time, retry/next.
5. **Settings:** volume, reduce shake, rotation buttons on/off, slow conveyor assist, colourblind icons.

---

## 9. Art & Audio Direction

### Visuals
- Bright, chunky, toy-like cartoon objects with thick outlines, easy to read at a glance.
- Each location has its own palette and props.
- **Item art must look convincing.** The lie only works if the safe really looks heavy.
- The panic vignette is a soft red pulse at the screen edges (never flashing).
- Items squash slightly on landing, and towers creak as they wobble.

### Audio
- **Each item has a true sound** (the tap test). This is a core mechanic, not just decoration.
- Music: a bouncy track that **speeds up with panic** and adds a heartbeat layer above 70%.
- Event sounds: rumble, whoosh, meow, siren (the fake one sounds slightly cheap and tinny).
- A satisfying "ding-ding-ding" stability countdown, then a cheer.

---

## 10. Fairness Rules

1. **Every lying item has at least 2 tells** (drag weight + tap sound, at minimum).
2. **Each liar is introduced in a low-stakes level** before it appears under pressure.
3. **Every event has a warning** of at least 1.5 seconds, and Fake Panic never causes physical damage.
4. **Stable physics:** towers only fall because of player decisions or events, never because of physics jitter.
5. **One "Oops" per level** to undo a bad placement.
6. **No items appear that make the level impossible** (each level's item sequence is tested to have at least one valid solution).

---

## 11. Accessibility & Comfort

- **Zen mode:** no timer, no events, no failure.
- **Slow conveyor assist.**
- **Rotation buttons** for players who can't twist two fingers or use a mouse wheel.
- **Hold-to-drop option:** items drop with a button press instead of on release (for unsteady hands).
- **Reduce shake:** earthquakes are shown with icons and gentler motion.
- Event warnings use icons + sounds + text (never colour alone).
- Tap-test sounds have captions ("THUD", "tink").

---

## 12. Technical Plan

### Architecture
- **Physics:** **Planck.js**, a JavaScript port of Box2D. Box2D-style solvers handle tall stacks steadily, with sleeping bodies and stable contacts.
  - Fixed 60 Hz steps, 8 velocity / 3 position iterations (the standard Box2D defaults), with extra sub-steps for tall towers if needed.
  - *Alternative:* Rapier (WebAssembly), if we need more performance or exact cross-device determinism later.
- **Rendering:** Canvas 2D. Sprites are drawn at each body's position and rotation. **The visual sprite and the physics shape are deliberately separate**: that's how items lie about their shape.
- **Dragging:** a Box2D **mouse joint** with `maxForce` proportional to the item's mass. Heavy items naturally lag behind the cursor, so the "drag weight" tell comes straight out of the physics, with no fake animation needed.
- **Item behaviours:** small update hooks per item:
  - inflate: rebuild the shape slightly bigger every 0.5 s
  - melt: shrink over time
  - fragile: check impact strength after collisions and break the item into pieces
  - float: apply an upward force
  - magnet: pull metal items within a radius
- **Events:** a scheduler picks events based on the level's list, the panic meter and a seeded RNG (`engine/rng`), and runs the warning timer before applying each one.
- **Stability check:** every body's speed stays below a small threshold for 3 s, **and** the highest point is above the goal line.

### Data model
```ts
interface ItemDef {
  id: string;                               // "lead-feather"
  name: string;                             // shown to the player: "Feather"
  sprite: string;
  looksLike: { weight: "light" | "medium" | "heavy"; shape: "box" | "round" | "odd" };
  body: {
    fixtures: Array<{
      shape: "box" | "circle" | "polygon";
      size: number[];                       // box: [w, h]; circle: [r]; polygon: points
      offset?: [number, number];
    }>;
    density: number;
    friction: number;
    restitution: number;                    // bounciness
  };
  behaviours?: Array<
    | { type: "float"; lift: number }
    | { type: "inflate"; ratePerSec: number; maxScale: number }
    | { type: "melt"; secondsToVanish: number }
    | { type: "squish"; maxSquash: number }
    | { type: "fragile"; breakImpulse: number }
    | { type: "sticky" }
    | { type: "magnet"; strength: number; radius: number }
  >;
  tapSound: "thud" | "tink" | "boing" | "squish" | "chime" | "clunk";
}

type EventKind =
  | "earthquake" | "wind" | "cat" | "tilt" | "lowGravity" | "iceAge"
  | "bird" | "platformShrink" | "lightsOut" | "fakePanic" | "reskin" | "conveyorRush";

interface LevelDef {
  id: string;                               // "4-03"
  location: "kitchen" | "warehouse" | "toyroom" | "museum" | "bakery" | "space";
  timeLimitSec: number;
  goalHeight: number;                       // metres above the platform
  platformWidth: number;
  items: string[];                          // item ids in conveyor order
  events: { kind: EventKind; atSec?: number; chance?: number }[];
  gravity?: number;                         // e.g. lower for space
}
```

### Folder structure
```
src/games/panic-stack/
  index.tsx
  physics/
    world.ts  drag.ts  stability.ts      # Planck.js world, mouse joint, stability check
  items/
    catalogue.ts  behaviours.ts
  events/
    scheduler.ts  earthquake.ts  cat.ts  fake-panic.ts  …
  panic/
    meter.ts
  levels/
    kitchen.ts … space.ts
  ui/
    Hud.tsx  Conveyor.tsx  LocationMap.tsx  Result.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Tall stacks jitter or collapse for no reason | Box2D-style solver, sleeping bodies, sub-steps, careful friction values; automated "tower stands for 60 s" tests |
| Too many bodies slow down mobile | Cap items per level (~60); remove fallen items quickly |
| Changing shapes at runtime (inflate/melt) is unstable | Rebuild fixtures in small steps; wake nearby bodies gently |
| Two-finger rotation feels awkward | Rotation buttons as the default on mobile; test with players |

---

## 13. Build Roadmap

- [ ] **M1: Physics core.** Planck.js world, conveyor, drag with mouse joint, rotate, drop, goal line, stability check
- [ ] **M2: Liars + tells.** The first 8 items, tap-test sounds, Kitchen + Warehouse (12 levels)
- [ ] **M3: Panic.** Panic meter, event scheduler, Earthquake/Wind/Cat/Fake Panic, Zen mode
- [ ] **M4: All content.** Remaining items and events, Toy Room → Space Station (24 more levels)
- [ ] **M5: Modes + polish.** Endless Tower, Daily Stack, X-ray glasses, achievements, accessibility options
- [ ] **Later:** local versus, level editor, leaderboards

---

## 14. Definition of Done

- A tower built from honest items (bricks) stands for 60 s with no events (no physics jitter collapse), tested automatically.
- Every liar has at least 2 working tells.
- Every level has at least one tested solution.
- Every event shows a warning at least 1.5 s before it hits.
- 60 fps with 60 bodies on a mid-range phone.
- Zen mode can be played start to finish without any pressure elements.
