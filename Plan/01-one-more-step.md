# One More Step

> **"The exit is one step away. It always is."**

| | |
|---|---|
| **Genre** | Turn-based grid puzzle with troll twists |
| **Core mind trick** | The world only moves when you move, nothing is explained, and the exit door is alive. It runs away from you. |
| **Controls** | Arrow keys / WASD (desktop) · Swipe (mobile) |
| **Session length** | 1–4 minutes per level · 40 levels + 1 finale (about 3 hours) |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/one-more-step` |
| **Code folder** | `src/games/one-more-step/` |

---

## 1. About the Game

### The pitch
You are a tiny blob with feet, standing on a grid. The exit door is right there, a few tiles away. A friendly voice says *"Just one more step!"* You take the step… and the door takes one too. Away from you.

**One More Step** looks like a calm turn-based puzzle game where **nothing moves unless you move**. Every step you take is one "tick" of the world. Spikes go up or down, floors crumble, shadows copy you, and the exit door (which has little feet) scurries away whenever you get close. You're never told the rules. You discover them one step at a time, and just when you've mastered them, the game quietly changes one.

### How it messes with your mind
- **The goal-gradient trap.** People rush when they're close to a goal. This game punishes exactly that moment, because the last step is where most traps live.
- **Rules you have to discover.** There are no tutorials and no text explanations. Every level is a tiny science experiment: step, watch, form a theory, test it.
- **Your habits get used against you.** Once a rule feels automatic ("spikes rise every step"), a later world bends it ("spikes only rise when you *wait*"). This is the *Einstellung effect*: a familiar solution blinds you to the new one.
- **The narrator.** It always says "one more step". Early on it's telling the truth. Later… not always.

### Inspirations
*Circle the Cat* (trap a target that runs away), *Hoplite* and *Crypt of the NecroDancer* (the world moves on your turn), *SUPERHOT* (time moves only when you move), *Baba Is You* (rules are the puzzle).

---

## 2. How to Play

### Goal
Step onto the exit door's tile. The hard part is that the door doesn't want you to.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Step (up / down / left / right) | Arrow keys / WASD | Swipe in a direction |
| Wait (stand still for one tick) | `Space` or `.` | ⏸ wait button (or tap your character) |
| Undo last step | `Z` / `Backspace` | ↶ button |
| Restart level | `R` | ⟳ button |
| Pause / menu | `Esc` | ☰ button |

> **Waiting counts as a step.** The world still ticks.

### The core loop
1. **Look** at the level. It's fully visible (except in Fog levels).
2. **Step**, and the world ticks once.
3. **Watch** what changed and form a theory.
4. **Die or get stuck → undo** (unlimited and instant) and try a new theory.
5. **Reach the exit**, compare your step count with par, and move to the next level.
6. Between worlds, a new rule appears, or an old one betrays you.

---

## 3. Game Mechanics

### The tick rule
Every action (step or wait) moves the world forward exactly one tick, always in this order:

1. **Player moves** (or stays). If the player lands on the exit, the level is **won immediately** and nothing else happens.
2. **Tiles react**: crumble tiles break, spikes toggle, conveyors push.
3. **Creatures move**: the exit door, echoes, the mirror twin, sentinels.
4. **Hazard check**: is the player on raised spikes, in a hole, or touching a creature?

Because the order never changes, the game is **100% deterministic**. The same steps always give the same result.

### Tiles
| Tile | Behaviour |
|---|---|
| Floor | Safe. |
| Wall | Blocks you and every creature. |
| Crumble | Breaks the moment you step **off** it and becomes a hole. |
| Spikes | Toggle up/down every tick. Up = deadly. |
| Hole | Falling in means death… except in "Basement" levels, where falling is how you go forward. |
| Conveyor | After each tick, pushes whatever stands on it one tile in its direction. |
| Pressure plate | Opens linked gates while anything stands on it. |
| Gate | Blocks movement unless its plate is pressed. |
| Fog | You can only see tiles within 2 steps of you. |

### Creatures

**The Exit Door ("Doory")** is the star of the game.
- **Still:** never moves (used rarely, so players stop trusting it).
- **Shy:** after each tick, if you're 1 tile away (no diagonals), Doory steps to the neighbouring free tile that's **farthest** from you. Ties are broken in a fixed order (Up → Right → Down → Left), so players can learn to predict it.
- **Cornered:** if no move would get it farther away, Doory freezes, and you can step onto it.
- Doory never steps onto holes, raised spikes or closed gates, so you can **use hazards to block its escape routes**. Your own trail of broken crumble tiles can become the walls of a trap.
- **Brave (World 5 only):** charges *toward* you. If it reaches you before you press the plate, it slams shut on you.

**Echo**: a shadow that replays your exact moves a few ticks late (the delay is the number on its chest). Touching your echo kills you, but an echo standing on a pressure plate holds it down for you.

**Mirror Twin**: moves the opposite way horizontally (you go left, it goes right). You both have to stand on exits **on the same tick**.

**Sentinel**: a stone statue that moves one tile toward you every tick. You can lure it onto crumble tiles and into holes.

### Par and stars
Every level has a **par**: the minimum number of steps found by our level solver, plus a small margin. Beating par earns an extra star.

### Undo
Undo is unlimited and instant, because this is a puzzle game, not a reflex test. The narrator *does* notice ("Taking it back? Bold.").

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Runaway Door** | The exit stays put | It scurries away when you're next to it | It has little feet that twitch when you're 2 tiles away |
| **The Painted Door** | A door is a door | It's painted on the wall, and the real exit is under a crumble tile | Painted doors have no shadow and no feet |
| **The Last Step** | The final step is safe | Spikes next to the exit rise exactly on the tick you arrive | Spikes show a dot pattern that counts down their rhythm |
| **Falling Forward** | Holes mean death | In Basement levels, falling is how you reach the exit | The hole glows faintly from below, with a small "B1" sign |
| **Steps Left: 1** | A step budget | The counter is counting down to the next spike wave, not your steps | The counter is the same colour as the spikes |
| **The Lazy Spikes** | Spikes toggle every tick | In World 5 they only toggle when you *wait* | They're drawn sleepy, with little "zZ" marks |
| **The Brave Door** | Doors run away | This one charges at you | Angry eyebrows and red feet |
| **The Lying Narrator** | "One more step!" is encouragement | In World 5 it lies, e.g. saying "one more step" when you're 9 away | When it lies, its speech bubble's tail points away from you |
| **No Take-Backs** | Undo always works | Two short World 5 levels disable undo | The undo button is visibly taped over |
| **The Last Level** | You win by stepping | You win by **not stepping** (see the finale) | The narrator starts begging, which it has never done before |

---

## 5. Levels & Progression

### Structure
5 worlds × 8 levels = **40 levels**, plus **1 finale**. Each world adds one new idea and mixes it with the old ones.

| World | Name | New idea | Feel |
|---|---|---|---|
| 1 | **Baby Steps** | Shy door, crumble tiles, spikes | "Oh no, the door is alive." |
| 2 | **Catch the Door** | Herding the door in open rooms, using hazards and crumble trails as walls, painted doors | Circle-the-Cat style trapping |
| 3 | **Echoes** | Your delayed echo, pressure plates, gates | Planning your own path so it helps you later |
| 4 | **Mirror, Mirror** | Mirror twin, sentinels | Two bodies, one brain |
| 5 | **Liar's Floor** | Betrayals: lazy spikes, brave door, lying narrator, no-undo levels, Basement falls | Everything you learned is now suspect |
| ★ | **The Last Step** | The finale | A twist on the whole game |

### Example: Level 1-1, "One More Step"
```
#########
#P....E.#
#########
```
`P` = player, `E` = exit door (shy), `#` = wall.

You walk right. When you're right next to the door, it scoots right, into the dead end. You follow, and it's trapped by the wall. You catch it. **6 steps, par 6.** In 10 seconds the player learns: *the door runs, and walls can trap it.*

### Example idea: World 2, "Draw Your Own Trap"
An open room tiled with crumble tiles. Doory can't step onto holes, and every tile you walk over becomes a hole. The solution is to **walk a path that leaves a pocket of holes**, then herd Doory into it. The player's own route becomes the trap.

### Finale: "The Last Step"
A tiny platform. You and Doory stand side by side. The narrator says *"One more step!"*
- If you step onto the door, the level reloads as "Level 41-2", then "41-3", forever, with the narrator getting smugger each time.
- The real solution is to **wait**. Ten times. The narrator gets desperate: *"…Step?" "Please?" "Fine."* Then Doory walks over to *you*.
- Final line: *"Sometimes the best step is no step."* This unlocks the **Zero Steps** achievement.

### Difficulty curve
- Every world starts with a "safe introduction" level where the new rule can't kill you unfairly.
- Levels 1–3 of each world teach, 4–6 combine, and 7–8 test.
- Grids grow from 7×3 (World 1) up to about 12×12 (World 5).

---

## 6. Features

### MVP (must-have)
- 40 levels across 5 worlds, plus the finale
- Unlimited undo and instant restart
- Par steps and a 3-star rating per level
- The narrator, with lines per level (and lies in World 5)
- Musical footsteps (see Audio)
- Progress saving (localStorage)
- Keyboard and swipe controls, with an optional on-screen D-pad
- World map / level select

### Later
- **Daily Step**: one new puzzle every day, generated from a date seed (`engine/rng`) and checked by the solver
- **Level editor** with shareable level codes
- **Solution replay**: after you 3-star a level, watch the optimal solution
- **Hint system**: shows the next correct step (costs that level's third star)
- **Time attack**: clear a world as fast as possible

---

## 7. Scoring, Rewards & Replay Value

### Stars per level
- ★ Clear the level
- ★★ Clear it within par
- ★★★ Clear it in the solver's optimal number of steps (a perfect solution)

### Lifetime stats
Total steps, total undos, total deaths, plus a fun line on the results screen: *"You've walked 4,210 steps. Your doctor would be proud."*

### Achievements
| Achievement | How to get it |
|---|---|
| **Catch Me If You Can** | Catch a shy door within 3 ticks of it first running |
| **Architect** | Trap a door using only holes you created |
| **Echo Chamber** | Get killed by your own echo 10 times |
| **Undo-ne** | Use undo 1,000 times in total |
| **Perfectionist** | 3-star every level in a world |
| **Zero Steps** | Beat the finale |
| **Doctor's Orders** | Walk 10,000 steps in total |

---

## 8. Screens & UI

1. **Title screen**: when you first hover over "Start", it hops one tile away (a gentle troll that only happens once). Click it again to start.
2. **World map**: a path of footprints connecting the levels, with star counts.
3. **Level screen**:
   - Top: world-level number and name, steps taken / par
   - Centre: the grid
   - Bottom: the narrator's speech bubble
   - Buttons: undo, restart, wait, menu
4. **Level complete card**: steps, par, stars, "Next →" (Enter / tap)
5. **Pause / settings**: music and SFX volume, reduce motion, colourblind palette, show grid coordinates, controls help

---

## 9. Art & Audio Direction

### Visuals
- Clean, flat shapes with soft shadows and rounded tiles.
- Each world has its own palette: World 1 mint, World 2 peach, World 3 lavender, World 4 sky blue, World 5 a dark inverted version of World 1.
- Characters have personality: the player blob squashes and stretches on every step, and Doory has a blinking peephole "eye" and tiny feet.
- Small touches: dust puffs when tiles crumble, a light screen shake on falls, and Doory sweating when cornered.

### Audio
- **Musical footsteps:** every step plays the next note of the level's melody (in a pentatonic scale, so it always sounds nice). The melody only resolves to its final "home" note when you catch the door. That unfinished-music feeling is the "one more step" feeling turned into sound.
- Undo plays the note in reverse. Dying plays a sour note.
- Doory makes tiny squeaky footsteps when it runs away.

---

## 10. Fairness Rules

1. **Deterministic.** There's no randomness anywhere in the puzzle logic.
2. **Always solvable.** Every level is checked automatically by a solver before release.
3. **Safe introductions.** A new rule first appears in a level where it can't trap you unfairly.
4. **No mid-world changes.** Rules only change at world boundaries (mostly in World 5), and each betrayal has a visible tell.
5. **Unlimited undo**, except in the clearly marked no-undo levels, which are short (12 steps or fewer).
6. **No hidden information**, except in Fog levels, and those are small.

---

## 11. Accessibility & Comfort

- **No time pressure.** It's turn-based, so you can take as long as you like.
- **Colourblind-safe.** Hazards use shapes and icons as well as colour.
- **Reduce motion** turns off screen shake and squash animations.
- Fully playable with **keyboard only** or **touch only**. Swipe sensitivity is adjustable, and there's an optional on-screen D-pad.
- Menus are normal, accessible HTML.

---

## 12. Technical Plan

### Architecture
- **Rules engine:** a pure TypeScript function, `step(state, action) → { state, events }`. It has no side effects and doesn't touch the DOM.
- **Rendering:** Canvas 2D inside a client component. Animations play back the `events` returned by each step (for example `{ type: "crumble", at: [3, 4] }`). The logic is instant and animations are just cosmetic.
- **Undo:** a stack of previous states. States are tiny, so storing full copies is fine.
- **Solver:** breadth-first search over game states (player position, door position, spike phase, broken tiles, echo history, twin position). It runs as a Node script (`pnpm levels:verify`) and in CI. It outputs the optimal step count, which sets each level's par.
- **Input:** a small input buffer (up to 2 queued steps) so fast players aren't slowed down by the 120 ms step animation. Swipes are detected with pointer events and a 24 px threshold.
- **Saving:** localStorage key `mfg:game:one-more-step` (stars, stats; the value carries its own version number), through `engine/save`. See [gameStack.md](gameStack.md), Section 5.

### Data model
```ts
type Dir = "up" | "down" | "left" | "right";
type Action = { type: "move"; dir: Dir } | { type: "wait" };

interface LevelDef {
  id: string;                 // "1-1"
  name: string;               // "One More Step"
  par: number;                // written by the solver
  map: string[];              // ASCII rows (legend below)
  door?: { behavior: "still" | "shy" | "brave" };
  conveyors?: Record<string, Dir>;     // "x,y" → direction
  links?: Record<string, string[]>;    // plate "x,y" → gate positions
  echoDelay?: number;
  narrator?: { at: "start" | number; text: string; lie?: boolean }[];
}

// Legend:
//  #  wall          .  floor           ~  crumble
//  X  spikes (up)   x  spikes (down)   O  hole
//  P  player        E  exit door       T  mirror twin
//  S  sentinel      _  pressure plate  |  gate
```

```ts
export const level_1_1: LevelDef = {
  id: "1-1",
  name: "One More Step",
  par: 6,
  map: [
    "#########",
    "#P....E.#",
    "#########",
  ],
  door: { behavior: "shy" },
  narrator: [{ at: "start", text: "The exit is right there. Just walk." }],
};
```

### Folder structure
```
src/games/one-more-step/
  index.tsx              # client entry: canvas + HUD
  engine/
    types.ts
    rules.ts             # pure step() function
    solver.ts            # BFS solver (also used by scripts/verify-levels.ts)
  levels/
    world-1.ts … world-5.ts
    finale.ts
  render/
    draw.ts              # canvas drawing + tweens
  audio/
    melody.ts            # musical footsteps
  ui/
    Hud.tsx  LevelSelect.tsx  LevelComplete.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Solver gets too slow with echoes (lots of possible states) | Limit echo delay to 6 or less, limit grid size, hash states, use iterative deepening |
| Animations getting out of sync with logic | Logic is instant; animations only replay emitted events |
| Swipes misfiring on mobile | Dead zone, adjustable threshold, optional D-pad |

---

## 13. Build Roadmap

- [ ] **M1: Core.** Rules engine; floor, wall, crumble and spike tiles; shy door; undo and restart; World 1 (8 levels); placeholder art
- [ ] **M2: Solver + World 2.** Solver script, automatic par, CI check, herding levels
- [ ] **M3: Creatures.** Echoes, plates and gates, mirror twin, sentinels; Worlds 3–4
- [ ] **M4: Betrayal.** World 5 rule changes, lying narrator, no-undo levels, finale
- [ ] **M5: Polish.** Musical footsteps, juice, stars, achievements, mobile swipe tuning
- [ ] **Later:** Daily Step, level editor, solution replays

---

## 14. Definition of Done

- All 41 levels pass the solver check, and every par value comes from the solver.
- Recorded solutions replay to the same result in unit tests (determinism is proven).
- The game is fully playable with keyboard only and with touch only.
- It runs at a steady 60 fps on a mid-range phone, and input responds in under 50 ms.
- Progress survives page reloads.
- At least 5 playtesters laugh at Level 1-1. (This is a real goal.)
