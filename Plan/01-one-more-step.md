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

- [x] **M1: Core.** Rules engine; floor, wall, crumble and spike tiles; shy door; undo and restart; World 1 (8 levels); placeholder art
- [x] **M2: Solver + World 2.** Solver script, automatic par, CI check, herding levels
- [x] **M3: Creatures.** Echoes, plates and gates, mirror twin, sentinels; Worlds 3–4
- [x] **M4: Betrayal.** World 5 rule changes, lying narrator, no-undo levels, finale
- [x] **M5: Polish.** Musical footsteps, juice, stars, achievements, mobile swipe tuning
- [ ] **Later:** Daily Step, level editor, solution replays

---

## 14. Definition of Done

- All 41 levels pass the solver check, and every par value comes from the solver.
- Recorded solutions replay to the same result in unit tests (determinism is proven).
- The game is fully playable with keyboard only and with touch only.
- It runs at a steady 60 fps on a mid-range phone, and input responds in under 50 ms.
- Progress survives page reloads.
- At least 5 playtesters laugh at Level 1-1. (This is a real goal.)

---

## 15. As Built

One More Step is playable at `/games/one-more-step/play`. It has:

- 40 levels in five worlds, then the finale, The Last Step;
- Doory in four moods (still, shy, brave and the finale's), your echo, a mirror twin and stone sentinels;
- crumbling floors, spikes, holes, moving walkways, pressure plates and gates, a painted door, Basement holes, lazy spikes, a spike wave and fog;
- unlimited undo (except in World 5's two taped-over levels), instant restart, and a queue of two steps for quick players;
- par and three stars per level, all from the solver, lifetime stats and seven achievements;
- the narrator, with a line for every level, which lies in World 5;
- musical footsteps;
- keys, swipes, taps and an optional D-pad. Options has the D-pad, the swipe distance, grid coordinates, reduce motion and sound.

Everything is made in code, with no asset files:

- **Art:** the grid, the blob, Doory, the echo, the twin and the sentinels are flat canvas shapes. Each world has its own palette: mint, peach, lavender, sky blue, a dark mint for World 5, and gold for the finale.
- **Music:** each level has its own pentatonic tune, one note per step (in a minor key in World 5). It only comes home to its first note when you catch the door.
- **Sounds:** ZzFX effects: Doory's squeaky feet and its sweat, crumbling, spikes, plates and gates, belts, a sentinel's thud, a slam, a fall, and the finale's reset.

It reuses `engine/rng` (each level's tune), the audio engine and sound bank, `engine/save` and `games/shared`. It doesn't use `engine/loop`: nothing moves between your steps, so the runtime only animates the last step on `requestAnimationFrame`.

The code is in these folders:

- `engine/`: the map legend and types, `course.ts` (reads a map), `rules.ts` (the pure `step()` function) and `solver.ts`.
- `levels/`: the five worlds, the finale, and `solutions.ts`, the solver's recorded solutions.
- `play/`: `runtime.ts` applies your actions, keeps the undo stack and the input queue, and plays the sounds. `narrator.ts` is the narrator.
- `render/draw.ts` and `audio/`.
- `ui/`: the title, the map (the level select), the level screen (HUD, results card, pause menu) and the menus.

### The levels

Par is the shortest solution plus a quarter, and always at least two steps more (`levels/index.ts`). The stars are:

- ★ for clearing the level;
- ★★ for clearing it within par;
- ★★★ for the shortest solution.

| Level | Name | Doory | What's in it | Grid | Fewest steps | Par |
|---|---|---|---|---|---|---|
| 1-1 | One More Step | **Shy** | A corridor with a dead end | 9 × 3 | 6 | 8 |
| 1-2 | Round the Corner | Shy | A dead end round a corner | 8 × 5 | 7 | 9 |
| 1-3 | A Good Door | **Still** | Nothing (it stays) | 7 × 5 | 3 | 5 |
| 1-4 | Crumbs | Shy | **Crumble** | 10 × 3 | 7 | 9 |
| 1-5 | No Way Back | Shy | Crumble | 8 × 5 | 11 | 14 |
| 1-6 | Count the Dots | Still | **Spikes** | 9 × 3 | 7 | 9 |
| 1-7 | Bad Timing | Shy | Spikes | 9 × 3 | 5 | 7 |
| 1-8 | All of It | Shy | Crumble, spikes | 9 × 5 | 8 | 10 |
| 2-1 | Herding | Shy | An open room | 7 × 6 | 12 | 15 |
| 2-2 | Moving Walkway | Shy | **Walkways** | 9 × 4 | 10 | 13 |
| 2-3 | Draw Your Own Trap | Shy | A room of crumble | 7 × 7 | 8 | 10 |
| 2-4 | The Painted Door | Still | **A painted door**, and the real exit under a crumble tile | 7 × 5 | 5 | 7 |
| 2-5 | Holes | Shy | **Holes** | 9 × 7 | 24 | 30 |
| 2-6 | Spike Fence | Shy | Spikes, holes | 9 × 8 | 19 | 24 |
| 2-7 | Rush Hour | Shy | Walkways both ways, holes | 10 × 7 | 16 | 20 |
| 2-8 | Breadcrumbs | Shy | Crumble, spikes | 9 × 7 | 16 | 20 |
| 3-1 | Echo | Still | **Your echo** (3 ticks behind) | 10 × 5 | 7 | 9 |
| 3-2 | Plate | Still | **A plate and a gate**, your echo (3) | 10 × 3 | 7 | 9 |
| 3-3 | Hold the Door | Still | A plate and a gate, your echo (4) | 11 × 3 | 11 | 14 |
| 3-4 | Close Behind | Shy | A plate and a gate, your echo (3) | 9 × 5 | 10 | 13 |
| 3-5 | Echo Chamber | Shy | Crumble, holes, your echo (3) | 10 × 8 | 16 | 20 |
| 3-6 | Two Plates | Still | Plates and gates, your echo (4) | 14 × 3 | 13 | 17 |
| 3-7 | Ahead of Myself | Shy | Crumble, spikes, holes, your echo (3) | 10 × 8 | 18 | 23 |
| 3-8 | Myself, Later | Shy | Crumble, holes, your echo (3) | 10 × 8 | 13 | 17 |
| 4-1 | Twin | Still | **The mirror twin** and its exit | 11 × 3 | 3 | 5 |
| 4-2 | Out of Step | Still | The twin | 11 × 5 | 5 | 7 |
| 4-3 | Sentinel | Still | **A sentinel**, holes | 10 × 5 | 13 | 17 |
| 4-4 | Stone Cold | Shy | Sentinels, crumble | 9 × 5 | 7 | 9 |
| 4-5 | Two Halves | Still | The twin, holes | 11 × 6 | 21 | 27 |
| 4-6 | Statues | Still | Sentinels, crumble, holes | 10 × 7 | 11 | 14 |
| 4-7 | Mirror Room | Still | The twin, spikes, holes | 11 × 6 | 20 | 25 |
| 4-8 | Stone and Shadow | Shy | Sentinels, holes | 11 × 8 | 21 | 27 |
| 5-1 | Lazy Spikes | Still | **Lazy spikes** | 10 × 3 | 10 | 13 |
| 5-2 | The Brave Door | **Brave** | A plate | 10 × 5 | 12 | 15 |
| 5-3 | Basement | Shy | **A Basement hole**; **the narrator lies** | 9 × 7 | 4 | 6 |
| 5-4 | No Take-Backs | Shy | **No undo**, crumble | 8 × 5 | 10 | 13 |
| 5-5 | Steps Left | Still | **The spike wave**; lies | 11 × 5 | 9 | 12 |
| 5-6 | Fog | Still | **Fog** | 9 × 5 | 12 | 15 |
| 5-7 | Liar | Shy | Lazy spikes; lies | 10 × 5 | 12 | 15 |
| 5-8 | No Take-Backs II | Shy | No undo, crumble | 9 × 4 | 8 | 10 |
| ★ | The Last Step | **The finale's** | You and Doory, side by side | 5 × 3 | 10 waits | — |

**Bold** marks a first appearance. Every new idea comes in where it can't trap you unfairly. World 5's betrayals stay in World 5, and the tests check both.

### How the truth is kept

| Lie | The tell |
|---|---|
| The runaway door | Its feet twitch when you're two steps away. Outside World 5, the narrator only says "One more step!" when you really are one step away |
| The painted door | It has no feet and no shadow. The real exit's outline shows faintly in the cracks of the crumble tile it's under |
| Spikes | Two dots under every spike tile: what they are now, and what they'll be next tick |
| Lazy spikes | Sleepy "zZ", and the two dots match: they won't change unless you wait |
| Steps left | The counter is red, the same red as the wave spikes' own countdown: it's counting down to them, not your steps |
| Basement | The hole glows from below, with a "B1" sign |
| The brave door | Angry eyebrows and red feet |
| Your echo | A dashed ghost of you, with its delay on its chest |
| The mirror twin | It's blue, its exit is blue, and its eyes look the other way |
| The lying narrator | When it lies, its speech bubble's tail points away from you |
| No take-backs | The undo button is taped over |
| The last level | The narrator begs, which it has never done before: "…Step?", "Please?", "Fine." |

### Differences from the draft

- **Par:** the draft's par was "the solver's best plus a small margin", and it gave 1-1 a par of 6. As built, 6 steps earns ★★★ in 1-1, and par is 8.
- **The solver runs in the unit tests**, not as a separate `pnpm levels:verify` script. `levels/solutions.test.ts` replays every level's recorded shortest solution (`levels/solutions.ts`), and checks the solver still can't find anything shorter. `UPDATE_SOLUTIONS=1 pnpm test` records them again. Par is worked out from them when the game runs.
- **Levels are maps of characters** with a bigger legend than the draft's (`engine/types.ts`). It adds a second exit, Basement holes, a crumble tile hiding the exit, painted doors, wave spikes, lazy spikes and belts. There's no par in the level data.
- **Plates and gates aren't linked in pairs.** Anything on any plate holds every gate open, and a gate can't shut on whatever is standing in it.
- **Walkways** (the draft's conveyors) come in at 2-2 and come back in 2-7:
  - They push whatever's on them one tile, after you move and before the creatures do.
  - Doory holds on rather than be pushed into a hole or onto raised spikes. You and the sentinels don't.
  - They replace two of World 2's three plain herding rooms.
- **Spikes only have two states**, so their tell is two dots (now and next tick), not a countdown pattern.
- **Your echo** kills you if you walk into it or swap places with it. It presses plates, and it gets in the way of Doory, the twin and the sentinels.
- **The twin** can't step into you, your echo or a sentinel. It has its own blue exit, and you stand on the other one on the same tick. If it falls in a hole or steps onto spikes, you lose too ("Your twin! Noooo.").
- **Sentinels:**
  - They step along the longer gap first.
  - They fall into holes and break crumble tiles behind them.
  - They kill you if they touch you or swap places with you.
- **The brave door** takes the shortest path to you. If you're on a plate when it gets there, you've caught it. If you're not, it slams on you, and walking into it does the same.
- **The finale:**
  - It's numbered 6-1, so the loop counts "Level 6-2, 6-3…" instead of "41-2", and the narrator gets smugger each time.
  - Doory comes over after ten waits *in a row*: a step (even into a wall) starts the count again.
  - The step counter is hidden. The results card says "It came to you.", and the narrator gets the last word.
- **The title's Start button** has its own row. It hops sideways by its own width (as far as the screen allows) into empty space, when a mouse goes over it or on the first tap. It only ever does this once: the save remembers.
- **Fog** shows the tiles within two steps clearly, the next ring faintly, and the rest barely. You can guess the room's shape, but not what's in it.
- **There's no colourblind palette.** Hazards are shapes as well as colours: spike triangles and their dots, dark holes, bars for gates, chevrons for belts. Volume is in the arcade's settings.
- **Taps:** as well as swiping, you can tap the tile next to you to step there, or tap yourself to wait.
- **The play screen covers the whole window**, including the site's header.
- **Stats:**
  - The save keeps steps, undos, deaths, echo deaths, and the most times the finale went round.
  - The results card says "You've walked N steps.", and adds "Your doctor would be proud." from 1,000 steps on.
- **Grids** go up to 14 × 3 and 11 × 8, not 12 × 12: small enough for the solver to prove every one.
