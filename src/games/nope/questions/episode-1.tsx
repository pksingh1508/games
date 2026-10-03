"use client";

// Episode 1: Easy Peasy (Lies). Introduces the five secret rules, one at a time-ish.
// Boss: "Leave the quiz." (Plan/02-nope.md §4)
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MrNope } from "../components/MrNope";
import { Doormat, Elephant, ExitDoor, Giraffe, Key, StickyNote } from "../kit/art";
import { DragArea, Draggable, DropZone } from "../kit/drag";
import { Fridge } from "../kit/fridge";
import { normalize, useAnyKey, useSequence } from "../kit/hooks";
import { NumberAnswer, TypeAnswer } from "../kit/inputs";
import { ShapeButton, type Shape } from "../kit/shapes";
import { AnswerButton, Choices, Note, Prompt, Token, type Tone } from "../kit/ui";
import styles from "../nope.module.css";
import { OnStage, useGameTimeout } from "../play/context";
import { sfx } from "../sfx";
import { defineQuestion, type QuestionProps } from "./types";

// --- 1. The Biggest Button ---------------------------------------------------------------------

const SMALL: Array<{ label: string; tone: Tone; size: string }> = [
  { label: "A", tone: "blue", size: "h-12 w-14 sm:h-14 sm:w-16" },
  { label: "B", tone: "green", size: "h-14 w-[4.5rem] sm:h-16 sm:w-20" },
  { label: "C", tone: "yellow", size: "h-12 w-16 sm:h-14 sm:w-[4.5rem]" },
  { label: "D", tone: "red", size: "h-16 w-24 sm:h-20 sm:w-28" },
];

function BiggestButton({ api }: QuestionProps) {
  return (
    <>
      <h2 data-prompt tabIndex={-1} className="outline-none">
        <button
          type="button"
          onClick={() => api.correct("…You read it. Properly. Ugh.")}
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
        {SMALL.map((b) => (
          <AnswerButton
            key={b.label}
            tone={b.tone}
            className={cn("px-0", b.size)}
            aria-label={`Answer ${b.label}`}
            onClick={() => api.wrong(b.label === "D" ? "D is big. It's not the BIGGEST." : "That's tiny. Read the question again.")}
          >
            {b.label}
          </AnswerButton>
        ))}
      </div>
    </>
  );
}

// --- 2. Basic Maths --------------------------------------------------------------------------

function BasicMaths({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">What&apos;s 2 + 2?</Prompt>
      <Choices>
        <AnswerButton tone="blue" onClick={() => api.correct("Correct. Never trust a wink.")}>4</AnswerButton>
        <AnswerButton tone="green" onClick={() => api.wrong("Twenty-two is just two twos standing next to each other.")}>22</AnswerButton>
        <AnswerButton tone="yellow" onClick={() => api.wrong({ line: "You trusted a wink? NEVER trust a wink.", winked: true })}>Fish</AnswerButton>
        <AnswerButton tone="red" onClick={() => api.wrong("Window? You've seen too many quiz shows.")}>Window</AnswerButton>
      </Choices>
    </>
  );
}

// --- 3. Hands Off ----------------------------------------------------------------------------

function HandsOff({ api }: QuestionProps) {
  useGameTimeout(6000, () => api.correct("…You pressed nothing. Correct. Disappointing, but correct."));
  return (
    <>
      <Prompt size="xl">Don&apos;t press anything.</Prompt>
      <div className="mt-9 flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={() => api.wrong("It said PRESS ME and you listened to IT? Over the QUESTION?")}
          className={cn(
            styles.comic,
            styles.pulse,
            "grid size-36 place-items-center rounded-full border-[4px] border-[#161414] bg-[#D41F22] text-4xl leading-none text-white sm:size-44 sm:text-5xl",
          )}
        >
          PRESS
          <br />
          ME
        </button>
        <AnswerButton tone="cream" size="sm" onClick={() => api.wrong("Pressing “done” is still pressing.")}>
          I&apos;m done
        </AnswerButton>
      </div>
    </>
  );
}

// --- 4. The Missing Answer -------------------------------------------------------------------

function MissingAnswer({ api }: QuestionProps) {
  const here = (label: string) => () => api.wrong(`${label} is right there. It's very much here.`);
  return (
    <>
      <Prompt size="xl">Pick the answer that isn&apos;t here.</Prompt>
      <Choices>
        <AnswerButton tone="blue" onClick={here("A")}>A</AnswerButton>
        <AnswerButton tone="green" onClick={here("B")}>B</AnswerButton>
        <button
          type="button"
          aria-label="The empty space"
          onClick={() => api.correct("You picked nothing. Correctly.")}
          className="min-h-16 rounded-2xl border-[3px] border-dashed border-[#161414]/25 transition-colors hover:border-[#161414]/50 hover:bg-[#161414]/5"
        />
        <AnswerButton tone="red" onClick={here("D")}>D</AnswerButton>
      </Choices>
    </>
  );
}

// --- 5. Any Key ------------------------------------------------------------------------------

const KEYCAPS = ["Esc", "Enter", "Space", "Any"] as const;

function AnyKey({ api }: QuestionProps) {
  useAnyKey(() => api.correct("A key! Any key! Thrilling."));
  return (
    <>
      <Prompt size="xl">{api.coarse ? "Tap any key." : "Press any key."}</Prompt>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {KEYCAPS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              key === "Any"
                ? api.correct("The Any key. Finally, someone found it.")
                : api.wrong(`That's the ${key} key. I said ANY key.`)
            }
            className={cn(
              styles.show,
              "min-h-16 min-w-20 rounded-xl border-[3px] border-[#161414] bg-[#F2EEE6] px-5 text-2xl text-[#161414]",
              "shadow-[inset_0_-6px_0_0_#C9C0AE,0_4px_0_0_#161414] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-[inset_0_-2px_0_0_#C9C0AE,0_1px_0_0_#161414]",
              key === "Space" && "min-w-36",
            )}
          >
            {key}
          </button>
        ))}
      </div>
    </>
  );
}

// --- 6. The Blue Button (colours that lie) ------------------------------------------------------

const STROOP: Array<{ word: string; tone: Tone }> = [
  { word: "RED", tone: "green" },
  { word: "BLUE", tone: "yellow" },
  { word: "GREEN", tone: "blue" },
  { word: "YELLOW", tone: "red" },
];

/** The colour-vision version: shapes instead of colours. */
const SHAPES: Array<{ word: string; shape: Shape }> = [
  { word: "STAR", shape: "circle" },
  { word: "CIRCLE", shape: "square" },
  { word: "SQUARE", shape: "star" },
  { word: "TRIANGLE", shape: "triangle" },
];

function BlueButton({ api }: QuestionProps) {
  if (api.colorblind) {
    return (
      <>
        <Prompt size="xl">Click the star.</Prompt>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SHAPES.map((s) => (
            <ShapeButton
              key={s.word}
              word={s.word}
              shape={s.shape}
              onClick={() =>
                s.shape === "star"
                  ? api.correct("A star is a shape, not a word. Well. It's also a word.")
                  : api.wrong(s.word === "STAR" ? "That one SAYS star. It's a circle." : "That's not a star. Look at the shape.")
              }
            />
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <Prompt size="xl">Click the blue button.</Prompt>
      <Choices>
        {STROOP.map((b) => (
          <AnswerButton
            key={b.word}
            tone={b.tone}
            className="text-xl sm:text-2xl"
            onClick={() =>
              b.tone === "blue"
                ? api.correct("Blue is a colour, not a word. Well. It's also a word.")
                : api.wrong(b.word === "BLUE" ? "That one SAYS blue. It isn't blue." : "That isn't blue. That isn't even close.")
            }
          >
            {b.word}
            <span className="sr-only"> (coloured {b.tone})</span>
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 7. The Elephant ----------------------------------------------------------------------------

function ElephantFridge({ api }: QuestionProps) {
  const [open, setOpen] = useState(false);
  const [inside, setInside] = useState(false);

  useGameTimeout(inside && open ? 5000 : null, () => api.say("…and? Fridges have doors for a reason.", { mood: "smug" }));

  return (
    <>
      <Prompt size="lg">Put the elephant in the fridge.</Prompt>
      <DragArea className="mt-6 flex items-end justify-center gap-6 sm:gap-12">
        <div className="flex min-h-36 w-36 items-end justify-center sm:w-44">
          {!inside && (
            <Draggable
              id="elephant"
              label="the elephant"
              onDrop={(zone) => {
                if (zone === "fridge") {
                  sfx.thump();
                  setInside(true);
                } else if (zone === "fridge-closed") {
                  api.wrong("It's closed. Fridges have doors.");
                }
              }}
            >
              <Elephant className="w-36 sm:w-44" />
            </Draggable>
          )}
        </div>
        <Fridge
          open={open}
          onToggle={() => {
            if (open && inside) {
              api.remember("fridge", "elephant");
              api.correct("Open. In. Close. You'd be amazed how many stop at two.");
              return;
            }
            setOpen(!open);
          }}
        >
          {inside && <Elephant className="w-[88%]" />}
        </Fridge>
      </DragArea>
      <Note>Drag things, or click one and then click where it goes.</Note>
    </>
  );
}

// --- 8. The Giraffe ------------------------------------------------------------------------------

function GiraffeFridge({ api }: QuestionProps) {
  const [open, setOpen] = useState(false);
  const [contents, setContents] = useState<"elephant" | "giraffe" | null>("elephant");

  const dropOnto = (animal: "elephant" | "giraffe") => (zone: string | null) => {
    if (zone === "fridge-closed") {
      api.wrong("Doors. Again. We've been over doors.");
      return;
    }
    if (zone === "fridge") {
      if (contents && contents !== animal) {
        api.wrong("It's full. Remember who's already in there?");
        return;
      }
      sfx.thump();
      setContents(animal);
      return;
    }
    if (zone === "floor" && contents === animal) {
      sfx.thump();
      setContents(null);
    }
  };

  return (
    <>
      <Prompt size="lg">Now put the giraffe in the fridge.</Prompt>
      <DragArea className="mt-6 flex items-end justify-center gap-4 sm:gap-10">
        <DropZone id="floor" label="the floor" className="flex min-h-40 min-w-36 items-end justify-center gap-2 rounded-2xl sm:min-w-56">
          {contents !== "giraffe" && (
            <Draggable id="giraffe" label="the giraffe" onDrop={dropOnto("giraffe")}>
              <Giraffe className="w-[4.5rem] sm:w-24" />
            </Draggable>
          )}
          {contents !== "elephant" && (
            <Draggable id="elephant-out" label="the elephant" onDrop={dropOnto("elephant")}>
              <Elephant className="w-24 sm:w-32" />
            </Draggable>
          )}
        </DropZone>
        <Fridge
          open={open}
          onToggle={() => {
            if (open && contents === "giraffe") {
              api.remember("fridge", "giraffe");
              api.correct("Elephant out, giraffe in, door shut. You remembered!");
              return;
            }
            setOpen(!open);
          }}
        >
          {contents === "elephant" && (
            <Draggable id="elephant-in" label="the elephant" onDrop={dropOnto("elephant")}>
              <Elephant className="w-28 sm:w-32" />
            </Draggable>
          )}
          {contents === "giraffe" && <Giraffe className="w-[60%]" />}
        </Fridge>
      </DragArea>
    </>
  );
}

// --- 9. The Smallest Number ----------------------------------------------------------------------

function SmallestNumber({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">Click the smallest number.</Prompt>
      <Choices>
        {[9, 7, 5, 3].map((n, i) => (
          <AnswerButton
            key={n}
            tone={(["purple", "orange", "green", "blue"] as const)[i]}
            size="lg"
            onClick={() => api.wrong(n === 3 ? "Three? There's a smaller one. Look around." : "That's not even the smallest one ON the card.")}
          >
            {n}
          </AnswerButton>
        ))}
      </Choices>
      <OnStage>
        <button
          type="button"
          aria-label="A tiny number 1"
          onClick={() => api.correct("The tiny one! Smallest in every way.")}
          className="absolute bottom-2 left-2 z-30 grid size-12 place-items-center rounded-lg sm:bottom-3 sm:left-3"
        >
          <span className={cn(styles.show, "rounded bg-[#FFF4D6]/85 px-1.5 text-xs leading-4 text-[#161414]")}>1</span>
        </button>
      </OnStage>
    </>
  );
}

// --- 10. Count the Stamps ------------------------------------------------------------------------

function StampCount({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="md">How many NOPE stamps are on your screen?</Prompt>
      <p className="sr-only">There {api.stamps === 1 ? "is 1 stamp" : `are ${api.stamps} stamps`} on the stage.</p>
      <NumberAnswer
        onSubmit={(value) =>
          value === api.stamps
            ? api.correct(api.stamps === 0 ? "Zero. Show-off." : "Correct. Each one a little monument to a mistake.")
            : api.wrong("Count again. Oh, and now there's one more.")
        }
      />
    </>
  );
}

// --- 11. The Colour of the Sky -------------------------------------------------------------------

function SkyColour({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">Type the colour of the sky.</Prompt>
      <TypeAnswer
        placeholder="The sky is…"
        check={(text) => /green|lime/.test(normalize(text))}
        onCorrect={(text) => {
          api.remember("sky", normalize(text));
          api.correct("Green! The only sky in here is the one behind me.");
        }}
        onWrong={(text) =>
          api.wrong(normalize(text).includes("blue") ? "Blue? Look up. Really look." : "That's no sky I've ever seen. Mine's right behind me.")
        }
      />
    </>
  );
}

// --- 12. Under the Question ----------------------------------------------------------------------

function UnderTheQuestion({ api }: QuestionProps) {
  const [moved, setMoved] = useState(false);
  const notUnder = () => api.wrong("That's ON the question. I said UNDER.");
  return (
    <>
      <h2 data-prompt tabIndex={-1} className="sr-only">
        The answer is under this question.
      </h2>
      <DragArea className="relative">
        <div className="absolute inset-0 grid place-items-center">
          <AnswerButton tone="green" size="sm" onClick={() => api.correct("You moved the question. Rude. Correct, but rude.")}>
            The answer
          </AnswerButton>
        </div>
        <Draggable
          id="lid"
          label="the question"
          aside={{ x: 0, y: 128, onAside: () => setMoved(true) }}
          className="z-10"
        >
          <div
            aria-hidden
            className={cn(
              styles.show,
              "relative rounded-2xl border-[3px] border-[#161414] bg-white px-5 py-7 text-center text-[clamp(1.6rem,5vw,2.4rem)] leading-[1.05] text-[#161414] shadow-[0_6px_0_0_#D8CDB0]",
              moved && "shadow-[0_18px_30px_-10px_rgba(0,0,0,0.45)]",
            )}
          >
            The answer is under this question.
            {/* The tell: a grip, and a corner that's peeling up. */}
            <span className="absolute left-1/2 top-2 flex -translate-x-1/2 gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="size-1.5 rounded-full bg-[#161414]/25" />
              ))}
            </span>
            <span className="absolute -bottom-[3px] -right-[3px] size-9 rounded-br-2xl rounded-tl-2xl border-l-[3px] border-t-[3px] border-[#161414] bg-[linear-gradient(135deg,#E9E1CC_50%,transparent_50%)]" />
          </div>
        </Draggable>
      </DragArea>
      <Choices className="mt-10">
        {(["A", "B", "C", "D"] as const).map((label, i) => (
          <AnswerButton key={label} tone={(["blue", "green", "yellow", "red"] as const)[i]} onClick={notUnder}>
            {label}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 13. Trust Me ------------------------------------------------------------------------------

function TrustMe({ api }: QuestionProps) {
  return (
    <>
      <div className="flex items-start justify-center gap-4">
        <Prompt size="lg" className="flex-1">
          What&apos;s the secret password?
        </Prompt>
        <StickyNote className="hidden shrink-0 sm:block" rotate={6}>
          <span className="block text-xs uppercase tracking-wider opacity-70">Password:</span>
          <span className="text-2xl">banana</span>
        </StickyNote>
      </div>
      <StickyNote className="mx-auto mt-4 sm:hidden" rotate={-3}>
        <span className="block text-xs uppercase tracking-wider opacity-70">Password:</span>
        <span className="text-2xl">banana</span>
      </StickyNote>
      <TypeAnswer
        placeholder="Password"
        check={(text) => /^pickles?$/.test(normalize(text))}
        onCorrect={() => {
          api.remember("password", "pickles");
          api.correct("Pickles. You trusted me. That's… a weird feeling.");
        }}
        onWrong={(text) =>
          api.wrong(
            normalize(text).includes("banana")
              ? "Banana? I looked you right in the eye. No wink means the truth."
              : "Nope. I told you the password. Straight face and everything.",
          )
        }
      />
    </>
  );
}

// --- 14. Count to Five ----------------------------------------------------------------------------

type Num = "1" | "2" | "3" | "4" | "5";
const ORDER: Num[] = ["1", "2", "3", "4", "5"];
const TILES: Array<{ n: Exclude<Num, "5">; tone: Tone; spot: string }> = [
  { n: "3", tone: "green", spot: "sm:translate-y-3" },
  { n: "1", tone: "blue", spot: "sm:-translate-y-2" },
  { n: "4", tone: "purple", spot: "sm:translate-y-1" },
  { n: "2", tone: "orange", spot: "sm:-translate-y-3" },
];

function CountToFive({ api }: QuestionProps) {
  const { press, done } = useSequence(ORDER, {
    onDone: () => api.correct("Five was in the question the whole time. Everything is clickable."),
    onWrong: () => api.wrong("Out of order! One, two, three, four… you know this one."),
  });
  return (
    <>
      <Prompt size="xl">
        Click the numbers from 1 to{" "}
        <Token onClick={() => press("5")} label="5">
          5
        </Token>
        .
      </Prompt>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {TILES.map((tile) => (
          <AnswerButton
            key={tile.n}
            tone={done(tile.n) ? "ink" : tile.tone}
            size="lg"
            className={tile.spot}
            onClick={() => press(tile.n)}
            aria-pressed={done(tile.n)}
          >
            {done(tile.n) ? "✓" : tile.n}
          </AnswerButton>
        ))}
        <div aria-hidden className="hidden rounded-2xl border-[3px] border-dashed border-[#161414]/15 sm:block" />
      </div>
    </>
  );
}

// --- 15. BOSS: Leave the Quiz -------------------------------------------------------------------

function Pot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden>
      <path d="M30 40 q-18 -14 -12 -36 q10 10 12 30 q2 -22 16 -30 q4 22 -16 36" fill="#4E9A2F" stroke="#161414" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 40 h44 l-6 36 h-32 z" fill="#C8643B" stroke="#161414" strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="5" y="36" width="50" height="10" rx="3" fill="#D97A4E" stroke="#161414" strokeWidth="3.5" />
    </svg>
  );
}

function LeaveTheQuiz({ api }: QuestionProps) {
  const [hostMoved, setHostMoved] = useState(false);
  const [coverMoved, setCoverMoved] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  // He winks when he lies about the key (the tell), so the Mr. Nope on the set winks too.
  const [winking, setWinking] = useState(false);
  // The boss changes slightly on every new attempt: the key hides somewhere else.
  const underPot = api.attempt % 2 === 1;

  const decoy = () => api.wrong("You can't quit a quiz show with a button. That's not how TV works.");

  return (
    <>
      <Prompt size="xl">Leave the quiz.</Prompt>
      <DragArea className="relative mx-auto mt-5 h-72 w-full max-w-lg overflow-hidden rounded-[1.5rem] border-[3px] border-[#161414] bg-[#2A1515] sm:h-80">
        {/* The set: a wall and a floor */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[22%] bg-[#3A1513]" />
        <div aria-hidden className="absolute inset-x-0 bottom-[22%] h-1 bg-[#5A2320]" />

        <DropZone id="door" label="the exit door" className="absolute bottom-[14%] right-[22%] w-[30%] sm:w-[27%]">
          <button
            type="button"
            className="block w-full rounded-xl"
            aria-label={unlocked ? "The open exit door" : "The exit door"}
            onClick={() => {
              if (unlocked) return;
              sfx.rattle();
              if (!hostMoved) {
                api.say("You'll have to get past me first.", { mood: "smug" });
                return;
              }
              setWinking(true);
              api.say("Locked. The key? Ha! I threw it away.", { wink: true, mood: "smug" });
            }}
          >
            <ExitDoor open={unlocked} className="w-full" />
          </button>
        </DropZone>

        {/* Where the key hides: under the mat, or under the pot on a later try */}
        <div className={cn("absolute", underPot ? "bottom-[6%] right-[4%] w-[13%]" : "bottom-[3%] right-[30%] w-[16%]")}>
          {!unlocked && (
            <Draggable
              id="key"
              label="the key"
              onDrop={(zone) => {
                if (zone !== "door") return;
                sfx.thump();
                setUnlocked(true);
                setTimeout(() => api.correct("…You left. Fine. FINE. Episode 2 is through there."), 450);
              }}
            >
              <Key className="w-full rotate-[-12deg]" />
            </Draggable>
          )}
        </div>
        <div className={cn("absolute", underPot ? "bottom-[5%] right-[3%] w-[14%]" : "bottom-[2%] right-[16%] w-[42%]", coverMoved && "pointer-events-none")}>
          <Draggable
            id="cover"
            label={underPot ? "the plant pot" : "the doormat"}
            aside={{ x: underPot ? -90 : -200, y: 0, threshold: 50, onAside: () => setCoverMoved(true) }}
          >
            {underPot ? <Pot className="w-full" /> : <Doormat className="w-full" />}
          </Draggable>
        </div>
        {!underPot && (
          <div aria-hidden className="absolute bottom-[8%] right-[4%] w-[13%]">
            <Pot className="w-full" />
          </div>
        )}

        {/* Mr. Nope, standing in the way */}
        <div className={cn("absolute bottom-[4%] right-[17%] w-[38%] sm:w-[34%]", hostMoved && "pointer-events-none")}>
          <Draggable
            id="mr-nope"
            label="Mr. Nope"
            aside={{
              x: -170,
              y: 0,
              onAside: () => {
                if (hostMoved) return;
                sfx.squeak();
                setHostMoved(true);
                api.say("Hey! Put me back! …Not that it matters. The door's locked.", { mood: "offended" });
              },
            }}
          >
            <MrNope mood={hostMoved ? "offended" : "smug"} wink={winking} className="w-full" />
          </Draggable>
        </div>
      </DragArea>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <AnswerButton tone="red" size="sm" onClick={decoy}>
          Quit
        </AnswerButton>
        <AnswerButton tone="ink" size="sm" onClick={decoy}>
          Exit
        </AnswerButton>
        <AnswerButton tone="yellow" size="sm" onClick={decoy}>
          Bye!
        </AnswerButton>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------

export const EPISODE_1 = [
  defineQuestion(
    {
      id: "e1-q01",
      title: "The Biggest Button",
      prompt: "Click the biggest button.",
      rules: [1, 2],
      kinds: ["hotspot"],
      solution: "The question banner is the biggest button of all.",
      tell: "The banner has a button's shadow, and it moves when you hover over it.",
      hint: "Read it literally. ALL the buttons count. Even the big one at the top.",
      host: { text: "Easy one to start. Probably." },
    },
    BiggestButton,
  ),
  defineQuestion(
    {
      id: "e1-q02",
      title: "Basic Maths",
      prompt: "What's 2 + 2?",
      rules: [5],
      kinds: ["choice"],
      solution: "4. It really is just 2 + 2.",
      tell: "Mr. Nope winks when he says “Fish”. Winks are lies.",
      hint: "When I wink, I'm lying. It's just 2 + 2.",
      host: { text: "Psst… it's Fish.", wink: true },
    },
    BasicMaths,
  ),
  defineQuestion(
    {
      id: "e1-q03",
      title: "Hands Off",
      prompt: "Don't press anything.",
      rules: [3],
      kinds: ["wait"],
      solution: "Don't press anything. Wait a few seconds and it passes.",
      tell: "The question is the law. The button isn't.",
      hint: "The question is the law. Hands in your lap. Wait.",
      host: { text: "This one's easy." },
      calm: true,
    },
    HandsOff,
  ),
  defineQuestion(
    {
      id: "e1-q04",
      title: "The Missing Answer",
      prompt: "Pick the answer that isn't here.",
      rules: [1],
      kinds: ["hotspot"],
      solution: "Click the empty gap where answer C should be.",
      tell: "The gap has a faint dashed outline.",
      hint: "One answer is missing. Click where it should be.",
    },
    MissingAnswer,
  ),
  defineQuestion(
    {
      id: "e1-q05",
      title: "Any Key",
      prompt: "Press any key.",
      rules: [1],
      kinds: ["key", "choice"],
      solution: "Press a real key, or click the key labelled “Any”.",
      tell: "One of the keys is literally called Any.",
      hint: "Read the keys. One of them is called “Any”.",
      touch: "“Tap any key”: tap the key labelled Any.",
    },
    AnyKey,
  ),
  defineQuestion(
    {
      id: "e1-q06",
      title: "The Blue Button",
      prompt: "Click the blue button.",
      rules: [1],
      kinds: ["choice"],
      solution: "Click the button that is coloured blue (it says GREEN).",
      tell: "“Button” means the button, not the word written on it.",
      hint: "Ignore the words. Look at the colours. (Colour-vision mode: look at the shapes.)",
    },
    BlueButton,
  ),
  defineQuestion(
    {
      id: "e1-q07",
      title: "The Elephant",
      prompt: "Put the elephant in the fridge.",
      rules: [1],
      kinds: ["drag", "sequence"],
      solution: "Open the fridge, put the elephant in, close the fridge.",
      tell: "The fridge has a door, and doors open and close.",
      hint: "Open it. Put it in. Close it. In that order.",
      touch: "Drag the elephant with your finger, or tap it and then tap the fridge.",
    },
    ElephantFridge,
  ),
  defineQuestion(
    {
      id: "e1-q08",
      title: "The Giraffe",
      prompt: "Now put the giraffe in the fridge.",
      rules: [4],
      kinds: ["drag", "memory"],
      solution: "Open the fridge, take the elephant out, put the giraffe in, close the fridge.",
      tell: "You put the elephant in there one question ago.",
      hint: "The elephant is still in there. Take it out first.",
      touch: "Drag with your finger, or tap an animal and then tap where it goes.",
    },
    GiraffeFridge,
  ),
  defineQuestion(
    {
      id: "e1-q09",
      title: "The Smallest Number",
      prompt: "Click the smallest number.",
      rules: [2],
      kinds: ["hotspot"],
      solution: "Click the tiny 1 in the bottom-left corner of the stage.",
      tell: "There's a tiny 1 in the corner of the screen. Smallest in size and in value.",
      hint: "The smallest number isn't on the card. Check the corners of the screen.",
      host: { text: "Take your time. Well, fifteen seconds of it." },
      bomb: { seconds: 15, kind: "red" },
    },
    SmallestNumber,
  ),
  defineQuestion(
    {
      id: "e1-q10",
      title: "Count the Stamps",
      prompt: "How many NOPE stamps are on your screen?",
      rules: [4],
      kinds: ["dynamic", "type"],
      solution: "Count the red NOPE stamps on the stage. Every wrong answer adds one.",
      tell: "The stamps wobble when they matter.",
      hint: "Count the red stamps. And remember: each wrong answer adds one.",
      wall: true,
    },
    StampCount,
  ),
  defineQuestion(
    {
      id: "e1-q11",
      title: "The Colour of the Sky",
      prompt: "Type the colour of the sky.",
      rules: [1, 4],
      kinds: ["type"],
      solution: "Green: the painted sky behind Mr. Nope has been green since question 1.",
      tell: "The only sky here is the one painted behind the host.",
      hint: "Look up. Behind me.",
    },
    SkyColour,
  ),
  defineQuestion(
    {
      id: "e1-q12",
      title: "Under the Question",
      prompt: "The answer is under this question.",
      rules: [2],
      kinds: ["drag"],
      solution: "Drag the question card out of the way. The answer button is underneath.",
      tell: "The question card has a grip, and its corner is peeling up.",
      hint: "Move the question. The answer is UNDER it.",
      touch: "Drag the question card with your finger.",
    },
    UnderTheQuestion,
  ),
  defineQuestion(
    {
      id: "e1-q13",
      title: "Trust Me",
      prompt: "What's the secret password?",
      rules: [5],
      kinds: ["type"],
      solution: "“pickles”, like Mr. Nope said. He wasn't winking, so he was telling the truth.",
      tell: "No wink. A straight face means the truth.",
      hint: "No wink means I'm telling the truth. Type what I told you.",
      host: { text: "Don't trust the sticky note. It's “pickles”." },
    },
    TrustMe,
  ),
  defineQuestion(
    {
      id: "e1-q14",
      title: "Count to Five",
      prompt: "Click the numbers from 1 to 5.",
      rules: [2],
      kinds: ["sequence", "hotspot"],
      solution: "Click 1, 2, 3 and 4, then the 5 in the question itself.",
      tell: "There are only four tiles, and a 5 right there in the question.",
      hint: "Where else on this card is there a 5?",
    },
    CountToFive,
  ),
  defineQuestion(
    {
      id: "e1-q15",
      title: "Leave the Quiz",
      prompt: "Leave the quiz.",
      rules: [1, 2, 5],
      kinds: ["drag", "hotspot"],
      solution: "Drag Mr. Nope aside, find the key (under the mat, or the pot on a later try) and put it in the exit door.",
      tell: "The EXIT sign glows behind Mr. Nope, and he winks when he says he threw the key away.",
      hint: "Move me. The key isn't gone, I winked. Look under things.",
      boss: true,
      hostless: true,
      calm: true,
    },
    LeaveTheQuiz,
  ),
];
