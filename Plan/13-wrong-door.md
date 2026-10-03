# Wrong Door

> **"Three doors. Two liars. One way out. Probably."**

| | |
|---|---|
| **Genre** | Deduction roguelite (logic puzzles with doors) |
| **Core mind trick** | Every floor has doors and clues (signs, sounds, light, a doorman), and some clues lie by rules you have to work out. Pick the wrong door and you'll regret it. |
| **Controls** | Click / tap (keyboard shortcuts on desktop) |
| **Session length** | 10–20 minute runs (13 floors) · Daily run · Endless |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/wrong-door` |
| **Code folder** | `src/games/wrong-door/` |

---

## 1. About the Game

### The pitch
You check into **The Ambiguous Hotel**. Your room is on floor 13. There are no elevators, only doors.

Every floor has 2–5 doors and a handful of clues. Signs on the doors make claims, and some of them lie. A plaque on the wall states the floor's rule (*"Exactly one sign tells the truth."*). A tall doorman named **Mr. Hinges** will answer one question, but he lies whenever he wears his red hat. You can knock on doors and listen. You can watch which way the candle flame leans.

Choose the right door and you go up a floor. Choose the wrong one and you might fall back down the stairs, get locked in "The Wrong Room", or lose one of your keys. Reach floor 13 to escape.

### How it messes with your mind
- **Classic logic puzzles.** "Knights and knaves" puzzles (one always lies, one always tells the truth), made famous by the logician Raymond Smullyan, in a spooky, playable form.
- **The Monty Hall problem.** On the "Lucky Floor", the doorman opens a wrong door and offers to let you switch. Your gut says it doesn't matter. Maths says switching wins 2 times out of 3. Players' intuition fails here *every time*.
- **Confirmation bias.** Once you believe a door is right, you start reading every clue as proof. The game rewards players who try to prove themselves *wrong*.
- **Memory and attention.** Some floors are "anomaly floors": if anything has changed from the lobby, take the door you came in through.

### Inspirations
Smullyan's *The Lady or the Tiger?* puzzles, the Monty Hall problem, *The Exit 8* (anomaly-spotting loops), *Return of the Obra Dinn* (pure deduction), the Roblox horror game *Doors*.

---

## 2. How to Play

### Goal
Climb from the lobby to floor 13 without running out of keys.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Choose a door | Click it, or press `1`–`5` | Tap it |
| Read a sign / inspect a clue | Click / hover | Tap |
| Knock on a door | Hold click on the door, or select it and press `K` | Long-press the door |
| Ask Mr. Hinges a question | Click him / `Q` | Tap him |
| Use an item | Click the item, then the target | Tap the item, then the target |
| Open the codex | `C` | 📖 button |
| Pause | `Esc` | ⏸ button |

> Doors only open after a confirmation step ("Open door 2?"), so you never pick a door by accident.

### The core loop
1. **Enter a floor.** Read the plaque (the floor's rule).
2. **Gather clues:** signs, sounds (knock), light under doors, the candle flame, footprints, the doorman.
3. **Use items** if you have them.
4. **Deduce** which door is right.
5. **Open it.** A creaking, suspenseful moment…
6. **Right:** go up. **Wrong:** a consequence, then the **Truth Reveal** shows what each clue really meant.

---

## 3. Game Mechanics

### Keys (lives)
- You start a run with **3 keys**.
- Some wrong doors cost a key. Run out of keys and the run is over.
- Extra keys can be found on some floors.

### Clue types
| Clue | How it works |
|---|---|
| **Signs** | Each door's sign makes a claim. The floor's plaque says how many are true (*"Exactly one sign tells the truth"*, *"All signs lie"*). |
| **Mr. Hinges (the doorman)** | Answers **one** yes/no question from a list. He lies when his hat is red (the hat also has a feather, so colour is never the only signal). |
| **Knocking** | Knock and listen: **wind** = leads up and out (good), **footsteps** = someone's waiting (bad), **ticking** = trap, **silence** = could be anything. 2 knocks per floor. |
| **Light under the door** | Light means the path continues. Darkness means a dead end (on honest floors). |
| **Candle flame** | The flame leans toward the door with an open path behind it (air flows that way). |
| **Footprints** | Footprints lead to a door. Check the heel/toe direction: on some floors they're walking *backwards*. |
| **Numbers** | Door numbers follow a sequence (2, 3, 5, 7, ?). The right door continues it. |
| **Memory** | Clues that refer to earlier floors (*"Take the colour you avoided on floor 3"*). |
| **Anomalies** | Compare the room to the lobby you know. If something has changed, go back the way you came. |

### Asking Mr. Hinges
You pick one question from a list, such as:
- *"Is door 2 the way up?"*
- *"Is your hat red?"*
- *"If I asked you whether door 2 is the way up, would you say yes?"*

The last one is the classic trick: a liar lying about his own lie gives you the truth. Clever players will find it. The game implements the logic properly, so it always works.

### Wrong door consequences
| Consequence | What happens |
|---|---|
| **Down the Stairs** | Go back 1 floor (the floor is re-generated with a new puzzle) |
| **The Wrong Room** | A 20-second mini-challenge (e.g. find the exit in a dark room by sound). Succeed and you're back on the same floor with that wrong door marked. Fail and you lose a key. |
| **Cursed** | The next floor gets a modifier: no knocking, a silent doorman, or scrambled sign letters |
| **Lost Key** | Lose 1 key |

### Items (found on floors)
| Item | Effect |
|---|---|
| **Stethoscope** | +1 knock on every floor for the rest of the run |
| **Lantern** | Shows the light under all doors at once |
| **Truth Coin** | Flip it on one sign to learn whether that sign is true |
| **Crowbar** | Peek through one door's crack for 1 second |
| **Chalk** | Mark doors. Marks stay for the whole run (useful on memory floors) |
| **Lucky Key** | An extra life |

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **The Honest-Looking Sign** | A confident sign is a true sign | The plaque says only one sign is true, and it's not that one | The plaque: always read the plaque first |
| **The Red Hat** | The doorman is helpful | He's lying today | The red hat with a feather |
| **Backwards Footprints** | Footprints lead the way | They were walking backwards, away from the real door | Heel and toe marks are reversed |
| **The Lucky Floor** | 50/50 after one door is opened | Switching wins 2/3 of the time (Monty Hall) | The floor is marked 🎲, and the codex explains the maths after your first visit |
| **Mirror Floor** | Left is left | Everything is mirrored, including "left" and "right" on signs | Sign text is mirrored |
| **Anomaly Floor** | It's just another lobby | Something changed; go back the way you came | One detail differs from the lobby (a painting, a clock time) |
| **Shifting Doors** | Doors stay where they are | The doors shuffle while the lights flicker | Follow the door with the scratch mark |
| **The Final Floor** | The exit is a door | *"None of these doors is the way out."* It's true. | The plaque says so |

---

## 5. Levels & Progression

### Floor types
| Floor type | Description | Usually appears |
|---|---|---|
| **Plain Signs** | 2 doors, one true sign | Floors 1–2 |
| **Knights & Knaves** | 3–4 doors, signs + a rule about how many are true | Floors 2–12 |
| **The Doorman** | One question to Mr. Hinges | Floors 3–12 |
| **Sound Floor** | Knock and listen | Floors 3–10 |
| **Sequence Floor** | Number patterns | Floors 4–11 |
| **Mirror Floor** | Everything flipped | Floors 6–12 |
| **Anomaly Floor** | Spot the difference from the lobby | Floors 5–12 |
| **Lucky Floor** 🎲 | Monty Hall | Once per run |
| **Memory Floor** | Refers to earlier choices | Floors 7–12 |
| **Dark Floor** | Only the candle and sounds work | Floors 8–12 |
| **Liar's Banquet** | Every clue type lies except one (the plaque says which) | Floors 10–12 |
| **Shifting Doors** | Doors move; follow the marked one | Floors 9–12 |
| **The Final Floor** | The exit isn't a door at all | Floor 13 only |

### Floor 13: The Final Floor
Five beautiful doors. The plaque reads: *"None of these doors is the way out."* Every clue points to a different door. The answer is to believe the plaque: the way out is the **painting on the wall** (or the door you came in through, depending on the run's seed). Players who trust the rules win.

### Modes
- **Story Run:** a hand-made 13-floor sequence for your first playthroughs, designed to teach every clue type in a good order.
- **Endless Hotel:** procedurally generated floors, as high as you can go.
- **Daily Door:** a seeded run that's the same for everyone that day, with a share card.

---

## 6. Features

### MVP (must-have)
- Floor engine: doors, signs, plaque rules, door choice
- Knights & knaves puzzle generator + solver (every puzzle has exactly one answer)
- Mr. Hinges with questions and the lie rule
- Knocking + sound clues
- Keys, wrong-door consequences, Truth Reveal
- Story Run (13 floors)
- Codex (explains every clue type you've met)

### Full version
- All floor types, including Monty Hall, mirror, anomaly, memory, dark, shifting
- Items
- Endless Hotel + Daily Door
- Achievements

### Later
- **Floor editor** for custom puzzles
- **Detective mode:** no items, no knocking. Pure logic.
- Personal run history and daily challenge links (friends play the same seeded run on their own device, no server)

---

## 7. Scoring, Rewards & Replay Value

### Run score
- Floors reached, keys left, time.
- **Detective score:** the fewer clues you needed (knocks, items, questions), the higher your score.

### Share card (Daily Door)
```
WRONG DOOR · Daily #57
🚪🚪🚪🚪❌🚪🚪🚪🎲🚪🚪🚪🏁
Floor 13 reached · 1 wrong door · 2 keys left
```

### Achievements
| Achievement | How to get it |
|---|---|
| **The Switch** | Switch doors on the Lucky Floor and win |
| **Double Negative** | Use the "If I asked you…" question on a lying doorman |
| **No Knock Needed** | Clear a run without knocking once |
| **Sharp Eyes** | Spot 10 anomalies |
| **Untouched** | Clear a run without a single wrong door |
| **Believer** | Solve the Final Floor |

---

## 8. Screens & UI

1. **Lobby (title):** the hotel lobby with a grand staircase. "Check in" starts a run.
2. **Floor view:**
   - The doors across the middle of the screen
   - The plaque (floor number and rule) at the top
   - Mr. Hinges standing to one side (when present)
   - Clue elements in the scene: candle, footprints, light under doors
   - **Bottom bar:** keys, items, knocks left, codex button
3. **Door opening:** a slow creak and a suspense swell (about 1.2 s).
4. **Truth Reveal** (after a wrong choice): each sign flips to show TRUE or FALSE, and each clue is explained.
5. **The Wrong Room:** a separate mini-challenge scene.
6. **Codex:** an illustrated notebook with every clue type and rule you've discovered.
7. **Run summary:** floors, keys, Detective score, share card.

---

## 9. Art & Audio Direction

### Visuals
- **A whimsical but eerie grand hotel:** symmetrical compositions, pastel walls with moody lighting, ornate doors.
- **Every door style is distinct** (wooden, iron, velvet, glass, round), so players can refer to them easily.
- Mr. Hinges: tall, thin, polite, unsettling. His hat colour (with or without feather) must be very easy to read.
- Floors get darker and stranger as you go up.

### Audio
- **Sounds behind doors are a core mechanic:** wind, footsteps, ticking and silence must be very easy to tell apart.
- **Stereo panning:** each door's sound comes from its position (left doors sound left).
- Elevator-style music in the lobby (ironic, since there are no elevators).
- Creaks, knocks, and a suspense swell when you choose a door.

---

## 10. Fairness Rules

1. **Every logic floor has exactly one correct door** based on the clues available, checked by the solver for every generated puzzle.
2. **Every lying rule is visible**, on the plaque or in the codex. There are no secret lies.
3. **The Lucky Floor is the only luck-based floor**, it's clearly marked 🎲, and a wrong choice there only sends you down a floor (it never costs a key).
4. **The Truth Reveal** after every wrong door shows exactly why it was wrong.
5. **No time pressure** on normal floors (only in The Wrong Room, which can be turned off in Relaxed mode).
6. **Clues are always readable.** Sign text is plain, clear English with no tricky grammar.

---

## 11. Accessibility & Comfort

- **Visual sound cues:** every sound clue also shows a caption and an icon (*[faint wind]*), essential for deaf and hard-of-hearing players.
- **Colourblind-safe:** no colour-only clues (the red hat also has a feather; signs use text).
- **Relaxed mode:** no Wrong Room timer.
- Text size options for signs and the codex.
- Full keyboard play on desktop.
- No jump scares. The mood is eerie, not frightening.

---

## 12. Technical Plan

### Architecture
- **React + DOM/SVG.** Doors are illustrated components; the door opening uses CSS 3D transforms (`perspective` + `rotateY`).
- **Puzzle generator + solver (pure TypeScript):**
  - A floor has doors 1…n (n ≤ 5), and exactly one of them is correct.
  - Each sign is a statement that can be checked against "which door is correct".
  - The floor rule is a constraint (e.g. "exactly 1 statement is true").
  - **Brute force:** try every possible correct door together with every true/false combination of the signs, and check which ones are consistent with the rule. With at most 5 doors that's only 5 × 32 = 160 cases, so it's instant.
  - Keep the puzzle **only if exactly one door is consistent**. Otherwise generate again.
- **Doorman logic:** evaluate the question truthfully, then apply the lie rule. For the "If I asked you…" question, the liar lies about what he would say, which cancels out and gives the truth. This is unit tested.
- **Seeded RNG** (`engine/rng`) for Endless and Daily Door; the daily seed comes from the UTC date.
- **Run state** saved in localStorage, so runs can be resumed.
- **Audio:** Web Audio with a stereo panner per door.

### Data model
```ts
type Statement =
  | { type: "exitIs"; door: number }
  | { type: "exitIsNot"; door: number }
  | { type: "exitParity"; parity: "even" | "odd" }
  | { type: "exitLeftOf"; door: number }
  | { type: "signIsLying"; door: number };     // self-referential (handled by the solver)

type FloorRule =
  | { type: "exactlyTrue"; count: number }
  | { type: "allLie" }
  | { type: "allTrue" };

type FloorArchetype =
  | "plainSigns" | "knightsKnaves" | "doorman" | "sound" | "sequence" | "mirror"
  | "anomaly" | "montyHall" | "memory" | "dark" | "liarsBanquet" | "shifting" | "final";

interface DoorDef {
  id: number;
  style: "wood" | "iron" | "velvet" | "glass" | "round";
  sign?: Statement;
  sound?: "wind" | "footsteps" | "ticking" | "silence";
  light?: boolean;
  number?: number;              // sequence floors
}

interface FloorDef {
  number: number;               // 1–13
  archetype: FloorArchetype;
  doors: DoorDef[];
  rule?: FloorRule;
  doorman?: { lies: boolean };  // drives the red hat + feather
  correctDoor: number;          // must equal the solver's unique answer (checked in tests)
  wrongConsequence: "downstairs" | "wrongRoom" | "cursed" | "loseKey";
}
```

### Solver sketch
```ts
// Returns every door that could be the exit, given the signs and the floor rule.
// Signs can talk about other signs ("door 2's sign is lying"), so for each possible
// exit we also try every true/false assignment of the signs (at most 2^5 = 32) and
// keep only assignments where each sign's truth matches what it claims.
function consistentExits(floor: FloorDef): number[] {
  const signed = floor.doors.filter((d) => d.sign);
  return floor.doors
    .map((d) => d.id)
    .filter((exit) =>
      allTruthAssignments(signed.length).some(
        (truths) =>
          signed.every((d, i) => evaluate(d.sign!, exit, signed, truths) === truths[i]) &&
          satisfiesRule(truths, floor.rule)
      )
    );
}
// A generated puzzle is accepted only if consistentExits(floor).length === 1.
```

### Monty Hall: must follow the real rules
On the Lucky Floor, Mr. Hinges **always** opens a wrong door that you didn't pick, and **always** offers the switch. Only then does switching win 2/3 of the time. A test simulates 100,000 rounds to confirm the odds.

### Folder structure
```
src/games/wrong-door/
  index.tsx
  logic/
    statements.ts  rules.ts  solver.ts  generator.ts  doorman.ts  monty-hall.ts
  floors/
    story-run.ts                 # hand-made 13-floor sequence
    archetypes/                  # generators per floor type
  run/
    state.ts  items.ts  consequences.ts
  ui/
    FloorView.tsx  Door.tsx  Plaque.tsx  Doorman.tsx  TruthReveal.tsx
    WrongRoom.tsx  Codex.tsx  RunSummary.tsx
```

### Technical risks
| Risk | Plan |
|---|---|
| Puzzles are confusing to read | Statement text templates written and tested with players; plain English only |
| Procedural floors feel repetitive | Many statement templates, varied archetypes, a hand-made Story Run |
| Logic bugs make a floor unsolvable | Solver checks on every generated floor; tests for every archetype |

---

## 13. Build Roadmap

- [ ] **M1: Logic core.** Statements, rules, solver, generator, plain signs + knights & knaves floors
- [ ] **M2: Playable run.** Floor view, door choice, keys, consequences, Truth Reveal, Story Run floors 1–6
- [ ] **M3: More clues.** Doorman, knocking + sound, light, candle, footprints, sequence floors
- [ ] **M4: Special floors.** Mirror, anomaly, Monty Hall, memory, dark, shifting, Liar's Banquet, the Final Floor
- [ ] **M5: Modes + polish.** Items, Endless, Daily Door, codex, achievements, accessibility
- [ ] **Later:** floor editor, Detective mode, run history, daily challenge links

---

## 14. Definition of Done

- 10,000 generated floors per archetype all have exactly one valid answer (automated test).
- Monty Hall simulation confirms that switching wins about 66.7% of the time.
- Doorman logic, including the double-question trick, is fully unit tested.
- Every sound clue has a working caption.
- The same daily seed produces the same run on every device.
- A full run is playable by touch on a phone.
