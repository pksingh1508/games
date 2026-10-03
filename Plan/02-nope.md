# NOPE!

> **"Wrong. Also wrong. NOPE."**

| | |
|---|---|
| **Genre** | Troll quiz / lateral-thinking puzzles |
| **Core mind trick** | The obvious answer is almost always wrong. The question, the buttons, the timer and even the screen itself can be the answer. |
| **Controls** | Mouse / touch (plus the keyboard for a few questions) |
| **Session length** | 4 episodes × 15 questions · 10–20 minutes per episode |
| **Platforms** | Desktop & mobile browsers |
| **Route** | `/games/nope` |
| **Code folder** | `src/games/nope/` |

---

## 1. About the Game

### The pitch
A loud, colourful quiz show hosted by **Mr. Nope**, a big red rubber stamp with eyebrows. The questions look easy: *"Click the biggest button." "What's 2 + 2?" "Don't press anything."* But this quiz plays dirty. The biggest button might be the question itself. The shiny button begs to be pressed. Sometimes the right answer is to do nothing at all.

Get it wrong and Mr. Nope slams down with a giant **NOPE!** The stamp mark stays on the screen as a souvenir of your failure. Lose all 3 hearts and you're back at the start of the episode. Your stamps stay with you, and the quiz remembers everything.

### How it messes with your mind
- **Fast brain vs. slow brain.** Every question is built to trigger a quick, intuitive answer that's wrong, like the famous bat-and-ball question from the *Cognitive Reflection Test*. You win by slowing down.
- **Functional fixedness.** You assume buttons are for clicking and text is for reading. In NOPE! text can be clicked, buttons can be dragged, and the timer can be part of the answer.
- **The Stroop effect.** *"Click the BLUE button."* When the word BLUE is printed in red ink, your brain argues with itself.
- **Memory callbacks.** Question 41 asks about question 7. Were you paying attention?
- **Your failures become content.** *"How many times have you been NOPE'd this episode?"* The answer is the number of stamps on your screen.

### Inspirations
*The Impossible Quiz* (the classic Flash troll quiz), *Brain Test: Tricky Puzzles* (lateral thinking) and TV game shows.

> ⚠️ **All questions must be original.** We borrow the *style* of these games, never their questions. The only exceptions are old public-domain folk riddles, like the elephant-in-the-fridge joke.

---

## 2. How to Play

### Goal
Answer all 15 questions in an episode before you run out of hearts. Clear all 4 episodes to beat the game.

### Controls
| Action | Desktop | Mobile |
|---|---|---|
| Answer / interact | Click | Tap |
| Drag things | Click + drag | Touch + drag |
| Type answers | Keyboard | On-screen keyboard |
| "Press a key" questions | Any physical key | A mobile version of the question (always provided) |
| Hover questions | Hold the cursor still on something | Press and hold |
| Pause | `Esc` | ⏸ button |

### The core loop
1. Read the question (carefully, or don't, and learn the hard way).
2. Interact: pick, click, drag, type, hover or wait.
3. **Correct** → confetti and the next question. **Wrong** → **NOPE!**, a stamp mark, −1 heart.
4. Lose all hearts → restart the episode. Questions you've seen are now "known", but the boss question changes slightly.
5. Beat the episode's boss question to unlock the next episode.

---

## 3. Game Mechanics

### Hearts, skips & bombs
- **Hearts:** 3 per episode attempt. A wrong answer costs 1.
- **Skips:** a hidden **skip fly** 🪰 sometimes buzzes across the screen. Click it to earn a skip (you can hold 1 at a time). Skips don't work on boss questions.
- **Bomb questions:** a fuse burns across the top. Answer within 10 seconds or lose a heart. A few bomb questions want you to *let* the fuse run out; their fuse is green instead of red.

### Answer types
| Type | Example |
|---|---|
| Multiple choice | The classic 4 buttons, but the right one is rarely the obvious one |
| Hotspot | Click something that isn't an answer button: a word, the logo, the host, a heart |
| Drag | Move the question card aside to see what's under it |
| Type | Type a word or number |
| Wait | Do nothing for a few seconds |
| Key | Press a physical key (there's always a mobile version) |
| Hover | Hold the cursor over something (mobile: press and hold) |
| Sequence | Click things in a specific order |
| Memory | Recall an earlier answer or event |
| Dynamic | The answer depends on your run: stamp count, hearts left, time spent |

### The 5 secret rules of NOPE!
Players are never told these rules, but every question follows at least one. Figuring them out is the real game.

1. **Read it literally.** The question means exactly what it says, not what you think it means.
2. **Everything is clickable.** The title, the timer, the hearts, the host, the question text.
3. **Doing nothing is an answer.**
4. **Remember everything.** The quiz will test you on the quiz.
5. **Mr. Nope lies when he winks.** His hints are true when he looks straight at you and false when he winks.

### Mr. Nope (the host)
- Reacts to everything: smug when you're wrong, offended when you're right.
- Gives "hints" on some questions (see rule 5).
- After you've failed the same question twice, he gives a cryptic but **honest** nudge, with a straight face.

### The stamp wall
Every NOPE leaves a red stamp on the background, and the stamps stay for the whole episode. They look like decoration… until a question asks you to count them, or one of them is covering the answer and you need to drag it away.

---

## 4. Mind Tricks Catalogue

| Trick | What you expect | What actually happens | The tell |
|---|---|---|---|
| **Button in disguise** | The answers are the 4 buttons | The question banner itself is "the biggest button" | The banner has a button-style shadow and reacts on hover |
| **Just a normal question** | Every question is a trick | Sometimes 2 + 2 really is 4 | Mr. Nope winks while giving his "hint" |
| **Temptation** | A button says PRESS ME, so press it | The question says "Don't press anything" | The question text is always the law |
| **Stroop buttons** | "BLUE button" means the button labelled BLUE | It means the blue-coloured one | "Button" refers to the button, not its label |
| **Missing answer** | Pick from what's shown | Click the empty gap | The gap has a faint dashed outline |
| **Runaway answer** | Answers stay still | One answer runs from your cursor | It tires out after 3 escapes and can be cornered |
| **Ghosts of questions past** | Each question stands alone | Episode 3 asks about Episodes 1–2 | Episode 3 is literally called "Memory Lane" |
| **Living stamps** | Stamps are decoration | You need to count or move them | Stamps wobble when they're relevant |
| **Fake confetti** | Confetti means correct | The confetti spells N-O-P-E as it lands | Real confetti plays a "ding" first; fake confetti is silent |
| **The kind fuse** | A timer means hurry | The answer is to let it run out | The fuse is green instead of red |

### Example questions (all original)

| # | Question | Looks like | Real answer | Secret rule |
|---|---|---|---|---|
| 1 | "Click the biggest button." | Four small buttons | The question banner, which is styled like a giant button | 1, 2 |
| 2 | "What's 2 + 2?" `[4] [22] [Fish] [Window]` | Surely a trick… | **4**. Mr. Nope winks: *"Psst… it's Fish."* | 5 |
| 3 | "Don't press anything." A shiny **PRESS ME** button pulses for 5 seconds | Press it! | Wait it out | 3 |
| 4 | "Click the BLUE button." Buttons labelled RED / BLUE / GREEN / YELLOW in mismatched ink colours | The one labelled BLUE | The one *coloured* blue (it's labelled GREEN) | 1 |
| 5 | "Pick the answer that isn't here." Slots A, B, *(empty)*, D | Pick A, B or D | Click the empty slot | 1 |
| 6 | "Put the elephant in the fridge." | Drag the elephant | Open the fridge, drag the elephant in, close the fridge | 1 |
| 7 | "Now put the giraffe in the fridge." | Drag the giraffe | Open the fridge, **take the elephant out**, put the giraffe in, close it | 4 |
| 8 | "Type the colour of the sky." | Blue | **Green**, because the quiz-show set has a green sky painted behind the host | 1 |
| 9 | "Click the smallest number." `[9] [7] [5] [3]` | 3 | A tiny **1** sitting in the corner of the screen | 2 |
| 10 | "How many NOPE stamps are on your screen?" | Any number | The real count (dynamic) | 4 |
| 11 | "Press any key." `[Esc] [Enter] [Space] [Any]` | Pick one | Any physical key, **or** the `[Any]` button (mobile version: "Tap any key.") | 1 |
| 12 | "The answer is under this question." | Look for it | Drag the question card down to reveal the answer button | 2 |

### Episodes
| Episode | Name | Focus | Boss question |
|---|---|---|---|
| 1 | **Easy Peasy (Lies)** | Introduces the 5 secret rules one at a time | "Leave the quiz." The exit is behind Mr. Nope, so you drag the host aside |
| 2 | **Brain Freeze** | Rule combos, bomb questions, Stroop | A 5-part bomb question where each part uses a different rule |
| 3 | **Memory Lane** | Callbacks, dynamic answers, the stamp wall | "Answer questions 3, 7 and 12 again, in reverse order" |
| 4 | **The Final NOPE** | Everything, faster | Mr. Nope asks *"Want to play again? [YES] [NO]"*. Clicking NO makes the stamp slam down **on Mr. Nope himself**. You finally NOPE'd him. Credits roll. |

---

## 5. Levels & Progression

- **60 questions**: 4 episodes × 15, including 4 boss questions.
- Episodes unlock in order. A replay mode lets you play any cleared episode for a better score.
- **Difficulty curve inside an episode:**
  - Q1–5: one rule each, generous
  - Q6–10: rule combos, first bomb question
  - Q11–14: hardest regular questions
  - Q15: boss question (multi-step)
- **Checkpoint:** each episode is its own checkpoint. You never restart the whole game.

---

## 6. Features

### MVP (must-have)
- 60 original questions (including 4 boss questions)
- Hearts, skips (the skip fly) and bomb questions
- Mr. Nope with reactions and lying hints
- The stamp wall
- A mobile version for every keyboard or hover question
- Results screen with a shareable emoji grid
- Progress saved per episode

### Later
- **Explain-o-Matic**: after clearing an episode, a review mode that explains each trick
- **Daily NOPE**: one new question per day, with streaks
- **Speedrun mode**: all 60 questions in a row with 3 hearts in total
- **Question editor** for the simple question types, with community packs
- **Localisation** (wordplay is hard to translate, so each question gets "translation notes")

---

## 7. Scoring, Rewards & Replay Value

### Episode score
`1000 + (hearts left × 250) + (unused skip × 100) − time penalty`, plus a proudly displayed **NOPE count**.

### Share card (Wordle-style)
```
NOPE! Episode 2 — cleared
✅✅❌✅✅✅❌❌✅✅✅✅✅✅✅
NOPE'd 3 times · 06:42
```

### Achievements
| Achievement | How to get it |
|---|---|
| **Didn't Even Read** | Fail question 1 in under 2 seconds |
| **Patience Is a Virtue** | Pass every "wait" question on the first try |
| **Stamp Collector** | Get NOPE'd 100 times in total |
| **Mr. Nope's Nightmare** | Clear an episode without losing a heart |
| **Winked At** | Believe a lying hint 3 times |
| **Fly Swatter** | Catch 10 skip flies |

---

## 8. Screens & UI

1. **Title screen**: the giant NOPE! logo and a START button. The first click on START gets stamped "NOPE!", then a little *"…just kidding, go ahead"* appears and the second click works.
2. **Episode select**: styled like TV channels.
3. **Question screen**:
   - Header: episode, question number, hearts, skip slot
   - The question banner
   - The answer area
   - Mr. Nope standing to the side
   - The stamp wall in the background
4. **NOPE! moment**: the stamp slams down (0.6 s), a heart cracks, the next attempt starts.
5. **Episode failed**: "Try again" (fast, one tap).
6. **Episode cleared**: score, share card, next episode.
7. **Settings**: volume, laugh track on/off, text size, reduce motion, colourblind mode.

---

## 9. Art & Audio Direction

### Visuals
- A game-show stage: bold red, yellow and black, stage lights, sparkles.
- Chunky, rounded, friendly type.
- The stamp feels heavy and rubbery, with a slightly uneven ink splatter.
- Elastic, squishy animation: buttons wobble, the host bounces.
- The **green sky** behind the host is there from the start, because it's the answer to a later question.

### Audio
- A big satisfying stamp **THUNK** for every NOPE.
- An optional audience laugh track (on by default at low volume, easy to turn off).
- A "ding" and confetti pop for correct answers.
- A ticking fuse and a rising tone for bomb questions.
- Mr. Nope "speaks" in gibberish babble that matches the speech bubble text.

---

## 10. Fairness Rules

1. Every question follows **at least one** of the 5 secret rules (enforced by a test).
2. **No pixel hunting.** Every clickable target has a hit area of at least 44×44 px, even if it looks tiny.
3. **No pure guessing.** If a question can only be solved by luck, it's broken.
4. Every keyboard or hover question has a **touch version that's just as fair**.
5. Bomb timers last at least 10 seconds and **pause when the tab is hidden**.
6. Wordplay must make sense to non-native English speakers. Avoid obscure idioms and slang, and test with a mix of players.
7. After 2 failures on the same question, Mr. Nope gives an honest hint.

---

## 11. Accessibility & Comfort

- Text size options, plus a dyslexia-friendly font option.
- **Colourblind mode:** every colour-based question (like the Stroop ones) switches to a shape version (*"Click the STAR button"*, where the labels don't match the shapes).
- **Reduce motion:** the stamp fades in instead of slamming, with no screen shake.
- The laugh track can be turned off.
- **Keyboard assist mode:** Tab focuses every interactive element, including hidden ones. This makes some questions easier, and that's okay.
- No flashing effects at all.

---

## 12. Technical Plan

### Architecture
- **Pure React + DOM.** No canvas is needed.
- Each question is a React component. Simple question types are generated from data, and complex ones are custom components that load lazily.
- **Run state** (hearts, skips, stamps, answers given, timings) lives in a small store and is saved to localStorage.
- **Animations:** CSS keyframes for the stamp slam, shakes and confetti. The `motion` library is an optional upgrade.
- **Timers:** based on `performance.now()`, paused on `visibilitychange`.

### Data model
```ts
type QuestionKind =
  | "choice" | "hotspot" | "drag" | "type" | "wait"
  | "key" | "hover" | "sequence" | "custom";

interface QuestionDef {
  id: string;                         // "e1-q04"
  episode: 1 | 2 | 3 | 4;
  kind: QuestionKind;
  prompt: string;                     // may contain clickable tokens, e.g. "Click the biggest [[button]]."
  choices?: { id: string; label: string; className?: string }[];
  answer?: string | ((run: RunState) => string);   // static or dynamic
  timeLimitMs?: number;               // bomb questions
  kindFuse?: boolean;                 // bomb where waiting is correct
  host?: { text: string; wink: boolean };
  mobileVariant?: Partial<QuestionDef>;
  component?: () => Promise<{ default: React.ComponentType<QuestionProps> }>;
  rules: Array<1 | 2 | 3 | 4 | 5>;    // which secret rules it uses (checked in tests)
}

interface QuestionProps {
  run: RunState;
  correct(): void;
  wrong(reason?: string): void;
}

interface RunState {
  episode: 1 | 2 | 3 | 4;
  questionIndex: number;
  hearts: number;
  skips: number;
  stamps: { x: number; y: number; rotation: number }[];
  answers: Record<string, string>;    // for memory questions
  startedAt: number;
}
```

### Folder structure
```
src/games/nope/
  index.tsx
  state/
    run.ts                    # run store + save/load
  questions/
    episode-1.ts … episode-4.ts   # data-driven questions
    custom/                       # complex question components (lazy-loaded)
  components/
    QuestionShell.tsx  Host.tsx  Stamp.tsx  StampWall.tsx
    Hearts.tsx  SkipFly.tsx  BombFuse.tsx  ShareCard.tsx
```

### Testing
- **Unit tests:** every question declares at least one rule, has an answer or a custom component, and has a valid mobile solution.
- **End-to-end (Playwright):** a script plays Episode 1 with the correct answers on desktop and on a mobile viewport.

### Technical risks
| Risk | Plan |
|---|---|
| Writing good questions is the hardest part | Budget real time for writing and playtesting. Aim for a 30–70% first-try failure rate per question. |
| Mobile and desktop behave differently (hover, keys) | Every question gets a mobile test |
| Translation breaks wordplay | English first; translation notes per question |

---

## 13. Build Roadmap

- [ ] **M1: Shell.** Hearts, the NOPE stamp, Mr. Nope, results screen, Episode 1 (15 questions)
- [ ] **M2: All answer types.** Episodes 2–3, bombs, skips, the stamp wall as a mechanic
- [ ] **M3: Finale.** Episode 4, boss questions, the ending, share card
- [ ] **M4: Playtest pass.** Tune difficulty, add accessibility variants
- [ ] **Later:** Explain-o-Matic, Daily NOPE, speedrun mode

---

## 14. Definition of Done

- 60 questions, each tagged with its secret rule(s), each with a working touch solution.
- In playtesting, every question fools at least 20% of testers on the first try, and at least 80% solve it within 3 tries.
- Fully playable with mouse, keyboard and touch.
- Timers pause correctly when the tab is hidden.
- Progress survives page reloads.
- No question depends on colour alone when colourblind mode is on.
