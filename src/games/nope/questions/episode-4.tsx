"use client";

// Episode 4: The Final NOPE. Everything you've learned, faster, then the last question.
// Boss: "Want to play again? [YES] [NO]". Saying no stamps Mr. Nope himself (Plan/02-nope.md §4).
import { AnimatePresence, m } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MrNope } from "../components/MrNope";
import { StampMark } from "../components/Stamp";
import { Fly, Ketchup, TriangleFigure } from "../kit/art";
import { normalize, useSequence } from "../kit/hooks";
import { NumberAnswer, TypeAnswer } from "../kit/inputs";
import { Runaway } from "../kit/runaway";
import { AnswerButton, Choices, Note, Prompt, Token, type Tone } from "../kit/ui";
import { Wires, WIRES } from "../kit/wires";
import styles from "../nope.module.css";
import { OnStage, useGameTimeout, useHotspot } from "../play/context";
import { sfx } from "../sfx";
import { defineQuestion, type QuestionProps } from "./types";

const TONE_ROW: Tone[] = ["blue", "green", "yellow", "red"];

// --- 1. The Biggest Button, Final Form -------------------------------------------------------------

function BiggestFinal({ api }: QuestionProps) {
  const win = () => {
    api.correct("The WHOLE STAGE. The biggest button there is.");
  };
  useHotspot("stage", win);
  useHotspot("sky", win);
  return (
    <>
      {/* The tell: tonight the stage itself is framed like a giant button. */}
      <OnStage>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-[2.5rem] border-[6px] border-[#FFC93C]/50 shadow-[inset_0_-14px_0_0_rgb(0_0_0/0.35),inset_0_0_0_3px_#161414]"
        />
      </OnStage>
      <h2 data-prompt tabIndex={-1} className="outline-none">
        <button
          type="button"
          onClick={() => api.wrong("Big. Not the BIGGEST. Not tonight.")}
          className={cn(
            styles.show,
            "block w-full rounded-2xl border-[3px] border-[#161414] bg-white px-5 py-7 text-center text-[clamp(1.8rem,5.5vw,2.7rem)] leading-none text-[#161414]",
            "shadow-[0_8px_0_0_#D8CDB0] transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-1.5 active:shadow-[0_2px_0_0_#D8CDB0]",
          )}
        >
          Click the biggest button.
        </button>
      </h2>
      <div className="mt-9 flex flex-wrap items-end justify-center gap-3 sm:gap-4">
        {(["A", "B", "C", "D"] as const).map((label, i) => (
          <AnswerButton
            key={label}
            tone={TONE_ROW[i]}
            className={cn("px-0", ["h-12 w-14", "h-14 w-16", "h-12 w-16", "h-16 w-24"][i])}
            aria-label={`Answer ${label}`}
            onClick={() => api.wrong("Tiny. Think bigger. MUCH bigger.")}
          >
            {label}
          </AnswerButton>
        ))}
      </div>
      <p className="sr-only">The whole stage around the card is a button too.</p>
    </>
  );
}

// --- 2. Ketchup -------------------------------------------------------------------------------

function Shaker({ onShaken, onPoke, children }: { onShaken: () => void; onPoke: () => void; children: ReactNode }) {
  const state = useRef({ dir: 0, flips: 0, moved: false, done: false, lastKey: "" });

  const flip = () => {
    const s = state.current;
    s.flips += 1;
    sfx.squeak();
    if (s.flips >= 4 && !s.done) {
      s.done = true;
      onShaken();
    }
  };

  return (
    <m.div
      role="button"
      tabIndex={0}
      aria-label="The ketchup bottle"
      drag="x"
      dragConstraints={{ left: -90, right: 90 }}
      dragElastic={0.25}
      dragSnapToOrigin
      dragMomentum={false}
      whileDrag={{ rotate: 8, scale: 1.04 }}
      style={{ touchAction: "none" }}
      className="cursor-grab select-none active:cursor-grabbing [-webkit-touch-callout:none]"
      onPointerDown={() => {
        state.current.moved = false;
      }}
      onDragStart={() => {
        state.current.moved = true;
        state.current.dir = 0;
      }}
      onDrag={(_, info) => {
        const s = state.current;
        const dir = Math.sign(info.delta.x);
        if (dir === 0 || dir === s.dir) return;
        if (s.dir !== 0) flip();
        s.dir = dir;
      }}
      onTap={() => {
        if (!state.current.moved) onPoke();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (state.current.lastKey && state.current.lastKey !== event.key) flip();
          state.current.lastKey = event.key;
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPoke();
        }
      }}
    >
      {children}
    </m.div>
  );
}

function KetchupQuestion({ api }: QuestionProps) {
  const [out, setOut] = useState(false);
  return (
    <>
      <Prompt size="xl">Get the ketchup out.</Prompt>
      <div className="mt-6 flex justify-center">
        <Shaker
          onPoke={() => api.wrong("You tapped it. Ketchup laughs at taps.")}
          onShaken={() => {
            setOut(true);
            sfx.pop();
            setTimeout(() => api.correct("SPLORT. You read the label. Shake well!"), 350);
          }}
        >
          <Ketchup squirt={out} className="h-48 w-auto sm:h-56" />
        </Shaker>
      </div>
      <Note>{api.coarse ? "Drag it, tap it, do your worst." : "Drag it, click it, do your worst. (Keyboard: arrow keys.)"}</Note>
    </>
  );
}

// --- 3. Fast Wink -----------------------------------------------------------------------------

function FastWink({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">Pick the safe button!</Prompt>
      <Choices className="sm:grid-cols-3">
        {[1, 2, 3].map((n, i) => (
          <AnswerButton
            key={n}
            tone={TONE_ROW[i]}
            size="lg"
            className={cn(n === 3 && "col-span-2 sm:col-span-1")}
            onClick={() =>
              n === 1 ? api.correct("Button 1! I winked. You flipped it. Fast.") : api.wrong({ line: "KABOOM. I winked! Flip it!", winked: true })
            }
          >
            {n}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 4. Cut It ---------------------------------------------------------------------------------

function CutIt({ api }: QuestionProps) {
  const [cut, setCut] = useState<string | null>(null);
  return (
    <>
      <Prompt size="lg">Cut the wire before the fuse runs out.</Prompt>
      <Wires
        wires={[WIRES.yellow]}
        cut={cut}
        onCut={(id) => {
          setCut(id);
          api.correct("You cut it. Green fuse or not, the question is the law.");
        }}
      />
    </>
  );
}

// --- 5. No Question ---------------------------------------------------------------------------

function NoQuestion({ api }: QuestionProps) {
  useGameTimeout(6000, () => api.correct("There was no question, and you did nothing. Perfect."));
  return (
    <>
      <h2 data-prompt tabIndex={-1} className="sr-only">
        There is no question here.
      </h2>
      <button
        type="button"
        aria-label="An empty space where the question should be"
        onClick={() => api.wrong("Clicking nothing is still clicking.")}
        className="grid min-h-48 w-full place-items-center rounded-2xl border-[3px] border-dashed border-[#161414]/20 transition-colors hover:bg-[#161414]/[0.03]"
      >
        <span className={cn(styles.show, "text-xl text-[#161414]/25")}>?</span>
      </button>
    </>
  );
}

// --- 6. Triangles ------------------------------------------------------------------------------

function Triangles({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="lg">How many triangles are in this picture?</Prompt>
      <div className="mt-5 flex justify-center">
        <TriangleFigure className="w-48 sm:w-56" />
      </div>
      <NumberAnswer
        onSubmit={(value) => {
          if (value === 6) api.correct("Six. Three small, two medium, one big. Show-off.");
          else if (value === 3) api.wrong("Three small ones, sure. Bigger ones count too.");
          else api.wrong("Count again. Try every pair of lines.");
        }}
      />
    </>
  );
}

// --- 7. Five to One ----------------------------------------------------------------------------

type Num = "1" | "2" | "3" | "4" | "5";
const DOWN: Num[] = ["5", "4", "3", "2", "1"];
const TILES: Array<{ n: Exclude<Num, "5">; tone: Tone }> = [
  { n: "2", tone: "orange" },
  { n: "4", tone: "purple" },
  { n: "1", tone: "blue" },
  { n: "3", tone: "green" },
];

function FiveToOne({ api }: QuestionProps) {
  const { press, done } = useSequence(DOWN, {
    onDone: () => api.correct("Backwards! And the five was in the question. Again."),
    onWrong: () => api.wrong("Five, four, three, two, one. Like a countdown."),
  });
  return (
    <>
      <Prompt size="xl">
        Click the numbers from{" "}
        <Token onClick={() => press("5")} label="5">
          5
        </Token>{" "}
        to 1.
      </Prompt>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TILES.map((tile) => (
          <AnswerButton
            key={tile.n}
            tone={done(tile.n) ? "ink" : tile.tone}
            size="lg"
            aria-pressed={done(tile.n)}
            onClick={() => press(tile.n)}
          >
            {done(tile.n) ? "✓" : tile.n}
          </AnswerButton>
        ))}
      </div>
    </>
  );
}

// --- 8. Stroop Speed ----------------------------------------------------------------------------

const INK: Array<{ word: string; ink: string; name: string }> = [
  { word: "YELLOW", ink: "#7ED957", name: "green" },
  { word: "RED", ink: "#FFC93C", name: "yellow" },
  { word: "BLUE", ink: "#FF5A5D", name: "red" },
  { word: "GREEN", ink: "#6FA0FF", name: "blue" },
];

const CASES = [
  { word: "capitals", caps: false },
  { word: "LOWERCASE", caps: true },
  { word: "small", caps: false },
  { word: "tiny", caps: false },
];

function StroopSpeed({ api }: QuestionProps) {
  if (api.colorblind) {
    return (
      <>
        <Prompt size="xl">Click the word written in capitals.</Prompt>
        <Choices>
          {CASES.map((w) => (
            <AnswerButton
              key={w.word}
              tone="ink"
              className="font-sans text-lg font-bold normal-case sm:text-xl"
              onClick={() =>
                w.caps
                  ? api.correct("Written in capitals. It just says lowercase.")
                  : api.wrong(w.word === "capitals" ? "It SAYS capitals. It's written in small letters." : "Those are small letters.")
              }
            >
              {w.word}
            </AnswerButton>
          ))}
        </Choices>
      </>
    );
  }
  return (
    <>
      <Prompt size="xl">Click the yellow word.</Prompt>
      <Choices>
        {INK.map((w) => (
          <AnswerButton
            key={w.word}
            tone="ink"
            className="text-xl sm:text-2xl"
            style={{ color: w.ink }}
            onClick={() =>
              w.name === "yellow"
                ? api.correct("The yellow word. It just SAYS red.")
                : api.wrong(w.word === "YELLOW" ? "That word SAYS yellow. It's written in green." : "That's not yellow. Look at the ink.")
            }
          >
            {w.word}
            <span className="sr-only"> (written in {w.name})</span>
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 9. Let It Go -----------------------------------------------------------------------------

const FLY_LOOP = { left: ["20%", "70%", "80%", "35%", "15%", "55%", "20%"], top: ["30%", "22%", "55%", "68%", "45%", "35%", "30%"] };

function LetItGo({ api }: QuestionProps) {
  useGameTimeout(7000, () => api.correct("It flew away. You let it. Personal growth."));
  return (
    <>
      <Prompt size="xl">Let the fly go.</Prompt>
      <Note>It&apos;s buzzing around somewhere. Probably near your face.</Note>
      <OnStage>
        <m.button
          type="button"
          aria-label="The fly"
          onClick={() => api.wrong("You SWATTED it. It had a family!")}
          className="absolute z-40 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          initial={{ left: "20%", top: "30%" }}
          animate={api.reducedMotion ? { left: "70%", top: "28%" } : FLY_LOOP}
          transition={api.reducedMotion ? { duration: 0.3 } : { duration: 6, ease: "easeInOut", repeat: Infinity }}
        >
          <Fly className="h-10 w-12" />
        </m.button>
      </OnStage>
    </>
  );
}

// --- 10. Mirror Name ---------------------------------------------------------------------------

function MirrorName({ api }: QuestionProps) {
  return (
    <>
      <h2 data-prompt tabIndex={-1} aria-label="What is my name?" className="outline-none">
        <span aria-hidden className={cn(styles.show, "block -scale-x-100 text-center text-[clamp(2.1rem,6.6vw,3.2rem)] leading-tight text-[#161414]")}>
          What is my name?
        </span>
      </h2>
      <TypeAnswer
        placeholder="My name is…"
        check={(text) => /^(mr|mister) ?nope$/.test(normalize(text))}
        onCorrect={() => api.correct("Mr. Nope. Correct. Backwards or forwards.")}
        onWrong={(text) =>
          api.wrong(normalize(text) === "nope" ? "MISTER Nope, to you. Full name, please." : "It's on the logo. It's on every stamp. It's me!")
        }
      />
    </>
  );
}

// --- 11. Give a Heart -------------------------------------------------------------------------

function GiveAHeart({ api }: QuestionProps) {
  useHotspot("hearts", () => {
    api.correct("For me? …I'll give it back. I'm not a monster.");
  });
  const words = () => api.wrong("Words aren't hearts. Give me a real one.");
  return (
    <>
      <Prompt size="xl">Give Mr. Nope one of your hearts.</Prompt>
      <Choices className="sm:grid-cols-2">
        <AnswerButton tone="red" onClick={words}>
          Here you go
        </AnswerButton>
        <AnswerButton tone="ink" onClick={words}>
          No way
        </AnswerButton>
      </Choices>
    </>
  );
}

// --- 12. Wait for GO ---------------------------------------------------------------------------

function WaitForGo({ api }: QuestionProps) {
  const [ready, setReady] = useState(false);
  useGameTimeout(12000, () => setReady(true));
  useGameTimeout(ready ? 5000 : null, () => api.say("…GO? Hello? That was your cue."));
  return (
    <>
      <Prompt size="lg">When the fuse runs out, click GO.</Prompt>
      <div className="mt-7 flex justify-center">
        <button
          type="button"
          onClick={() =>
            ready ? api.correct("GO! You read the WHOLE question. Rare.") : api.wrong("Not yet! WHEN the fuse runs out. Read it again.")
          }
          className={cn(
            styles.comic,
            "grid size-32 place-items-center rounded-full border-[4px] border-[#161414] text-5xl transition-colors",
            ready ? cn("bg-[#7ED957] text-[#161414]", styles.pulse) : "bg-[#C9C0AE] text-[#615C52]",
          )}
        >
          GO
        </button>
      </div>
    </>
  );
}

// --- 13. Not a Rule -----------------------------------------------------------------------------

function NotARule({ api }: QuestionProps) {
  const options: Array<[string, boolean]> = [
    ["Read it literally.", false],
    ["Everything is clickable.", false],
    ["The biggest button wins.", true],
    ["Mr. Nope lies when he winks.", false],
  ];
  return (
    <>
      <Prompt size="lg">Which of these is NOT one of NOPE!&apos;s secret rules?</Prompt>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map(([rule, fake], i) => (
          <AnswerButton
            key={rule}
            tone={TONE_ROW[i]}
            size="sm"
            className="min-h-16 px-4 text-lg"
            onClick={() =>
              fake ? api.correct("Right. Buttons win when they WANT to.") : api.wrong("That one's real. You've been using it all game.")
            }
          >
            {rule}
          </AnswerButton>
        ))}
      </div>
    </>
  );
}

// --- 14. The Last Normal Question ------------------------------------------------------------------

function LastNormal({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">What&apos;s 1 + 1?</Prompt>
      <Choices>
        {["2", "11", "Window", "Fish"].map((answer, i) => (
          <AnswerButton
            key={answer}
            tone={TONE_ROW[i]}
            onClick={() => {
              if (answer === "2") api.correct("Two. Sometimes it really is just a normal question.");
              else if (answer === "Fish") api.wrong({ line: "Fish?! I didn't even WINK!", fakeConfetti: true });
              else api.wrong("I said no tricks. I meant no tricks.");
            }}
          >
            {answer}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 15. BOSS: Play Again? -----------------------------------------------------------------------

function PlayAgain({ api }: QuestionProps) {
  const [stamped, setStamped] = useState(false);
  const stubborn = api.attempt % 2 === 1;

  const no = () => {
    if (stamped) return;
    setStamped(true);
    sfx.thunk();
    sfx.applause(2.5);
    setTimeout(() => api.correct("…You NOPE'd me. Me! I… I'm actually proud of you."), 1700);
  };

  return (
    <>
      <div className="relative mx-auto flex w-fit flex-col items-center">
        <p className={cn(styles.show, "relative rounded-2xl border-[3px] border-[#161414] bg-white px-5 py-2 text-center text-2xl text-[#161414] sm:text-3xl")}>
          {stamped ? "N-n-nope?!" : "Want to play again?"}
          <span aria-hidden className="absolute -bottom-[11px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-[#161414] bg-white" />
        </p>
        <div className="relative mt-4">
          <MrNope mood={stamped ? "stamped" : "smug"} className={cn("h-36 w-auto sm:h-44", !stamped && styles.bob)} title={stamped ? "Mr. Nope, stamped NOPE" : "Mr. Nope"} />
          <AnimatePresence>
            {stamped && !api.reducedMotion && (
              <m.div
                aria-hidden
                className="pointer-events-none absolute inset-x-[-40%] top-[30%]"
                initial={{ y: -260, scale: 2.2, rotate: -20, opacity: 0 }}
                animate={{ y: 0, scale: 1, rotate: -12, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.1, times: [0, 0.2, 0.7, 1], ease: "easeIn" }}
              >
                <StampMark className="w-full" />
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <h2 data-prompt tabIndex={-1} className="sr-only">
        Mr. Nope asks: want to play again? Yes or no.
      </h2>
      <div className="relative mx-auto mt-6 h-44 w-full max-w-lg">
        <div className={cn("absolute top-1/2 -translate-y-1/2", stubborn ? "right-[4%]" : "left-[4%]")}>
          <button
            type="button"
            disabled={stamped}
            onClick={() => api.wrong("Ha! You LOVE it here. NOPE. Ask me again some time.")}
            className={cn(
              styles.comic,
              !stamped && styles.pulse,
              "grid h-28 w-40 place-items-center rounded-3xl border-[4px] border-[#161414] bg-[#D41F22] text-5xl text-white sm:h-32 sm:w-48",
            )}
          >
            YES!
          </button>
        </div>
        {!stamped && (
          <Runaway
            spots={
              stubborn
                ? [
                    { x: 22, y: 50 },
                    { x: 80, y: 12 },
                    { x: 50, y: 88 },
                    { x: 14, y: 14 },
                    { x: 30, y: 82 },
                  ]
                : [
                    { x: 78, y: 50 },
                    { x: 20, y: 12 },
                    { x: 50, y: 88 },
                    { x: 86, y: 14 },
                  ]
            }
            escapes={stubborn ? 4 : 3}
            tone="cream"
            onCatch={no}
            label="No"
          >
            no
          </Runaway>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------

export const EPISODE_4 = [
  defineQuestion(
    {
      id: "e4-q01",
      title: "The Biggest Button, Final Form",
      prompt: "Click the biggest button.",
      rules: [1, 2],
      kinds: ["hotspot"],
      solution: "Click the stage itself, anywhere around the card. Tonight the whole stage is a button.",
      tell: "The stage has a button's border and shadow this time.",
      hint: "Bigger than the question. Bigger than the card. Look at the edges of the stage.",
      touch: "Tap the stage around the card (or the sky).",
    },
    BiggestFinal,
  ),
  defineQuestion(
    {
      id: "e4-q02",
      title: "Ketchup",
      prompt: "Get the ketchup out.",
      rules: [1],
      kinds: ["drag"],
      solution: "Shake the bottle: drag it left and right a few times. Tapping does nothing for ketchup.",
      tell: "The label says SHAKE WELL!",
      hint: "Read the label. Then do what it says. Left, right, left, right.",
      touch: "Drag the bottle back and forth with your finger.",
    },
    KetchupQuestion,
  ),
  defineQuestion(
    {
      id: "e4-q03",
      title: "Fast Wink",
      prompt: "Pick the safe button!",
      rules: [5],
      kinds: ["choice"],
      solution: "Button 1. Mr. Nope winks when he says “not 1”.",
      tell: "The wink.",
      hint: "I winked. Flip what I said.",
      host: { text: "Not 1! Anything but 1!", wink: true },
      bomb: { seconds: 10, kind: "red" },
    },
    FastWink,
  ),
  defineQuestion(
    {
      id: "e4-q04",
      title: "Cut It",
      prompt: "Cut the wire before the fuse runs out.",
      rules: [1],
      kinds: ["choice"],
      solution: "Cut the wire. The fuse is green, but the question says to cut it, and the question is the law.",
      tell: "There's only one wire, and the question tells you exactly what to do.",
      hint: "Green or not, the question is the law. It says CUT.",
      bomb: { seconds: 10, kind: "green", expire: "fail" },
      calm: true,
    },
    CutIt,
  ),
  defineQuestion(
    {
      id: "e4-q05",
      title: "No Question",
      prompt: "(There is no question.)",
      rules: [3],
      kinds: ["wait"],
      solution: "Do nothing. There's no question to answer.",
      tell: "There's nothing to click, except temptation.",
      hint: "No question. No answer. No clicking.",
      calm: true,
    },
    NoQuestion,
  ),
  defineQuestion(
    {
      id: "e4-q06",
      title: "Triangles",
      prompt: "How many triangles are in this picture?",
      rules: [1],
      kinds: ["type"],
      solution: "6: three small, two made of two small ones, and the big one.",
      tell: "Triangles can share sides. Big ones count.",
      hint: "Three small ones, two medium ones, one big one.",
    },
    Triangles,
  ),
  defineQuestion(
    {
      id: "e4-q07",
      title: "Five to One",
      prompt: "Click the numbers from 5 to 1.",
      rules: [2, 4],
      kinds: ["sequence", "hotspot"],
      solution: "Click the 5 in the question, then 4, 3, 2 and 1.",
      tell: "Same trick as episode 1, backwards: only four tiles.",
      hint: "Remember episode 1? Where was the 5?",
    },
    FiveToOne,
  ),
  defineQuestion(
    {
      id: "e4-q08",
      title: "Stroop Speed",
      prompt: "Click the yellow word.",
      rules: [1],
      kinds: ["choice"],
      solution: "Click the word written in yellow ink (it says RED). In colour-vision mode: the one written in capitals (it says LOWERCASE).",
      tell: "“The yellow word” is about the ink.",
      hint: "Look at the ink, not the word.",
      bomb: { seconds: 12, kind: "red" },
    },
    StroopSpeed,
  ),
  defineQuestion(
    {
      id: "e4-q09",
      title: "Let It Go",
      prompt: "Let the fly go.",
      rules: [3],
      kinds: ["wait"],
      solution: "Don't touch the fly. Wait, and it leaves.",
      tell: "“Let it go” means do nothing.",
      hint: "Hands off the fly. Let it go.",
      calm: true,
    },
    LetItGo,
  ),
  defineQuestion(
    {
      id: "e4-q10",
      title: "Mirror Name",
      prompt: "What is my name?",
      rules: [1],
      kinds: ["type"],
      solution: "“Mr. Nope” (the question is written backwards).",
      tell: "It's mirror writing, and the name is on everything.",
      hint: "Read it in a mirror. Then: MISTER Nope.",
    },
    MirrorName,
  ),
  defineQuestion(
    {
      id: "e4-q11",
      title: "Give a Heart",
      prompt: "Give Mr. Nope one of your hearts.",
      rules: [2],
      kinds: ["hotspot"],
      solution: "Click one of your hearts in the top bar.",
      tell: "Your hearts are right there at the top, and they're clickable.",
      hint: "Your hearts are at the top of the screen. Give me one.",
    },
    GiveAHeart,
  ),
  defineQuestion(
    {
      id: "e4-q12",
      title: "Wait for GO",
      prompt: "When the fuse runs out, click GO.",
      rules: [1, 3],
      kinds: ["wait", "choice"],
      solution: "Wait for the green fuse to run out, then press GO.",
      tell: "The question says WHEN, and the fuse is a kind one.",
      hint: "Wait for the fuse. THEN press GO.",
      bomb: { seconds: 12, kind: "green", expire: "none" },
      calm: true,
    },
    WaitForGo,
  ),
  defineQuestion(
    {
      id: "e4-q13",
      title: "Not a Rule",
      prompt: "Which of these is NOT one of NOPE!'s secret rules?",
      rules: [4],
      kinds: ["choice", "memory"],
      solution: "“The biggest button wins.” The real rules: read it literally, everything is clickable, doing nothing is an answer, remember everything, and Mr. Nope lies when he winks.",
      tell: "You've been playing by the other three all game.",
      hint: "Three of these you've used all game. One of them sometimes worked, but isn't a rule.",
    },
    NotARule,
  ),
  defineQuestion(
    {
      id: "e4-q14",
      title: "The Last Normal Question",
      prompt: "What's 1 + 1?",
      rules: [5],
      kinds: ["choice"],
      solution: "2. Mr. Nope says “no tricks” with a straight face, and means it.",
      tell: "No wink. Sometimes it's just a normal question.",
      hint: "No wink. No tricks. It's 2.",
      host: { text: "It's 2. No tricks. I promise." },
      bomb: { seconds: 10, kind: "red" },
    },
    LastNormal,
  ),
  defineQuestion(
    {
      id: "e4-q15",
      title: "Play Again?",
      prompt: "Want to play again?",
      rules: [1, 2],
      kinds: ["choice", "hotspot"],
      solution: "Say no: catch the runaway “no” button. It tires out after a few escapes.",
      tell: "The little “no” gets out of breath. The big shiny YES is the temptation.",
      hint: "Say NO. Chase it. It gets tired.",
      touch: "Keep tapping the “no” button: it dodges a few times, then gives up.",
      boss: true,
      hostless: true,
      calm: true,
    },
    PlayAgain,
  ),
];
