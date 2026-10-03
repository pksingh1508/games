"use client";

// Episode 3: Memory Lane. Callbacks to earlier episodes, answers that depend on your run, and
// the stamp wall. Boss: "Answer questions 3, 7 and 12 again, in reverse order." (Plan/02-nope.md §4)
import { Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { StampMark } from "../components/Stamp";
import { Heart } from "../components/Hud";
import { Elephant, Giraffe, StickyNote } from "../kit/art";
import { DragArea, Draggable } from "../kit/drag";
import { Fridge } from "../kit/fridge";
import { normalize, useSequence } from "../kit/hooks";
import { NumberAnswer, TypeAnswer } from "../kit/inputs";
import { AnswerButton, Choices, Note, Prompt, Quote, type Tone } from "../kit/ui";
import styles from "../nope.module.css";
import { useGameTimeout } from "../play/context";
import { defineQuestion, type QuestionProps } from "./types";

const TONE_ROW: Tone[] = ["blue", "green", "yellow", "red"];

// --- 1. The Sky, Back Then ------------------------------------------------------------------------

function SkyBackThen({ api }: QuestionProps) {
  const typed = api.recall("sky");
  const colours = ["Blue", "Green", "Orange", "Purple"];
  return (
    <>
      <Prompt size="xl">What colour was the sky in episode 1?</Prompt>
      <Choices>
        {colours.map((colour, i) => (
          <AnswerButton
            key={colour}
            tone={TONE_ROW[i]}
            onClick={() =>
              colour === "Green"
                ? api.correct("Green. You remembered. The sunset is new.")
                : api.wrong(
                    colour === "Orange"
                      ? "That's the sky NOW. I asked about episode 1."
                      : typed
                        ? `It was green. You typed “${typed}” yourself!`
                        : "It was green. It's been green since question 1.",
                  )
            }
          >
            {colour}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 2. Fridge Check ------------------------------------------------------------------------------

function FridgeCheck({ api }: QuestionProps) {
  const [open, setOpen] = useState(false);
  // Whoever you left in there in episode 1 (the giraffe, unless you skipped it).
  const inside = api.recall("fridge") === "elephant" ? "Elephant" : "Giraffe";
  const options = ["Elephant", "Giraffe", "Nobody", "Mr. Nope"];
  return (
    <>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <Prompt size="lg">Who is in the fridge right now?</Prompt>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {options.map((who, i) => (
              <AnswerButton
                key={who}
                tone={TONE_ROW[i]}
                size="sm"
                onClick={() =>
                  who === inside
                    ? api.correct(open ? "You checked. Smart. Annoying, but smart." : "Right from memory. Impressive.")
                    : api.wrong(who === "Mr. Nope" ? "I'm out HERE. I'd never fit." : "You could have just looked.")
                }
              >
                {who}
              </AnswerButton>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <DragArea>
            <Fridge open={open} onToggle={() => setOpen(!open)} className="w-32 sm:w-40">
              {inside === "Giraffe" ? <Giraffe className="w-[60%]" /> : <Elephant className="w-[88%]" />}
            </Fridge>
          </DragArea>
        </div>
      </div>
    </>
  );
}

// --- 3. Three Plus Three (part of the boss) --------------------------------------------------------

function ThreePlusThree({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">What&apos;s 3 + 3?</Prompt>
      <Choices>
        {["6", "33", "Fish", "Window"].map((answer, i) => (
          <AnswerButton
            key={answer}
            tone={TONE_ROW[i]}
            onClick={() =>
              answer === "Fish"
                ? api.correct("Fish. I didn't wink, so it was true. Weird, right?")
                : api.wrong(answer === "6" ? "Six? I looked you RIGHT in the eye. No wink." : "No. I told you the answer. Straight face.")
            }
          >
            {answer}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 4. Under the Stamp -----------------------------------------------------------------------------

function UnderTheStamp({ api }: QuestionProps) {
  const [moved, setMoved] = useState(false);
  const notThe = () => api.wrong("That's AN answer. I asked for THE answer.");
  return (
    <>
      <Prompt size="xl">Click the answer.</Prompt>
      <DragArea className="mx-auto mt-6 grid h-36 max-w-sm place-items-center">
        <AnswerButton tone="green" onClick={() => api.correct("It was under your stamp all along. Ironic.")}>
          The answer
        </AnswerButton>
        <div className={cn("absolute inset-0 grid place-items-center", moved && "pointer-events-none")}>
          <Draggable id="stamp" label="the stamp" aside={{ x: 0, y: -110, threshold: 50, onAside: () => setMoved(true) }}>
            <div
              className={cn(
                "w-64 rotate-[-8deg] rounded-xl bg-[#FFF4D6]/90",
                // The tell: it wobbles. With reduced motion, a dashed outline says the same thing.
                !moved && (api.reducedMotion ? "outline-dashed outline-2 outline-offset-4 outline-[#161414]/35" : styles.wobble),
              )}
            >
              <StampMark className="w-full" />
            </div>
          </Draggable>
        </div>
      </DragArea>
      <Choices className="sm:grid-cols-2">
        <AnswerButton tone="blue" size="sm" onClick={notThe}>
          An answer
        </AnswerButton>
        <AnswerButton tone="yellow" size="sm" onClick={notThe}>
          Some answer
        </AnswerButton>
      </Choices>
    </>
  );
}

// --- 5. Don't Press Anything (Again) ------------------------------------------------------------------

function DontPressAgain({ api }: QuestionProps) {
  useGameTimeout(6000, () => api.correct("You pressed nothing at all. Also correct. Smug."));
  return (
    <>
      <Prompt size="xl">Don&apos;t press anything.</Prompt>
      <Choices className="sm:grid-cols-3">
        <AnswerButton tone="red" onClick={() => api.wrong("You pressed “anything”. I said DON'T.")}>
          anything
        </AnswerButton>
        <AnswerButton tone="green" onClick={() => api.correct("You pressed “nothing”. Technically perfect.")}>
          nothing
        </AnswerButton>
        <AnswerButton tone="blue" className="col-span-2 sm:col-span-1" onClick={() => api.wrong("That's “something”. Something is anything.")}>
          something
        </AnswerButton>
      </Choices>
    </>
  );
}

// --- 6. Hearts Left ------------------------------------------------------------------------------

function HeartsLeft({ api }: QuestionProps) {
  const [picked, setPicked] = useState<boolean[]>([false, false, false, false, false]);
  const count = picked.filter(Boolean).length;
  return (
    <>
      <Prompt size="lg">Click as many hearts as you have left.</Prompt>
      <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Hearts to pick">
        {picked.map((on, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={on}
            aria-label={`Heart ${i + 1}`}
            onClick={() => setPicked((all) => all.map((v, j) => (j === i ? !v : v)))}
            className={cn(
              "grid size-16 place-items-center rounded-2xl border-[3px] transition-transform active:scale-95",
              on ? "border-[#161414] bg-white" : "border-dashed border-[#161414]/25",
            )}
          >
            <Heart broken={!on} className={cn("size-10", !on && "opacity-40")} />
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <AnswerButton
          tone="red"
          size="sm"
          className="px-8"
          onClick={() =>
            count === api.hearts
              ? api.correct(`${count === 1 ? "One heart" : `${count} hearts`}. You counted your own lives. Morbid.`)
              : api.wrong("Look at the top of the screen. Count. Then click that many.")
          }
        >
          Done ({count})
        </AnswerButton>
      </div>
    </>
  );
}

// --- 7. Not Wrong (part of the boss) ---------------------------------------------------------------

function NotWrong({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">What&apos;s the opposite of “not wrong”?</Prompt>
      <Choices>
        {["Right", "Wrong", "Correct", "Left"].map((answer, i) => (
          <AnswerButton
            key={answer}
            tone={TONE_ROW[i]}
            onClick={() =>
              answer === "Wrong"
                ? api.correct("Wrong. Which is right. I hate this question.")
                : api.wrong(answer === "Left" ? "Left is the opposite of RIGHT. Close, but no." : "“Not wrong” already means right. Flip it.")
            }
          >
            {answer}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 8. The Biggest Button, Again ------------------------------------------------------------------

function BiggestAgain({ api }: QuestionProps) {
  const small = (label: string) => () => api.wrong(`${label}? That's one of the small ones.`);
  return (
    <>
      <div
        onClick={() => api.wrong("That's not a button this time. No shadow. No bounce.")}
        className="cursor-default rounded-2xl border-[3px] border-dashed border-[#161414]/20 px-5 py-6"
      >
        <Prompt size="lg">Click the biggest button.</Prompt>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-center gap-3 sm:gap-4">
        <AnswerButton tone="blue" className="h-12 w-14 px-0" onClick={small("A")} aria-label="Answer A">
          A
        </AnswerButton>
        <AnswerButton tone="green" className="h-14 w-16 px-0" onClick={small("B")} aria-label="Answer B">
          B
        </AnswerButton>
        <AnswerButton tone="yellow" className="h-12 w-16 px-0" onClick={small("C")} aria-label="Answer C">
          C
        </AnswerButton>
        <AnswerButton
          tone="red"
          className="h-24 w-36 px-0 text-5xl sm:h-28 sm:w-48"
          onClick={() => api.correct("D. The question wasn't a button this time. You checked!")}
          aria-label="Answer D"
        >
          D
        </AnswerButton>
      </div>
    </>
  );
}

// --- 9. Two Plus Two, Remembered ----------------------------------------------------------------------

function TwoPlusTwoAgain({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="lg">In episode 1, what was the right answer to “What&apos;s 2 + 2?”</Prompt>
      <Choices>
        {["4", "22", "Fish", "Window"].map((answer, i) => (
          <AnswerButton
            key={answer}
            tone={TONE_ROW[i]}
            onClick={() =>
              answer === "4"
                ? api.correct("Four. Some things never change. Unlike my answers.")
                : api.wrong(answer === "Fish" ? { line: "Fish? I winked AGAIN. Some people never learn.", winked: true } : "No. It was the boring one.")
            }
          >
            {answer}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 10. Count Every Stamp ---------------------------------------------------------------------------

function CountEveryStamp({ api }: QuestionProps) {
  const total = api.stamps + 1;
  return (
    <div className="relative">
      <div aria-hidden className={cn("absolute -right-3 -top-6 w-24 rotate-12 sm:w-28", styles.wobble)}>
        <StampMark className="w-full" />
      </div>
      <Prompt size="md" className="pr-16">
        How many NOPE stamps are on your screen now?
      </Prompt>
      <p className="sr-only">
        There {api.stamps === 1 ? "is 1 stamp" : `are ${api.stamps} stamps`} on the stage, and one more on this card.
      </p>
      <NumberAnswer
        onSubmit={(value) =>
          value === total
            ? api.correct("Including the one on the card! Nobody counts the card.")
            : value === api.stamps
              ? api.wrong("You forgot the one on the CARD. And now there's another.")
              : api.wrong("Count again. Every stamp on the screen. Every. One.")
        }
      />
    </div>
  );
}

// --- 11. The Shiny Button -----------------------------------------------------------------------------

function ShinyButton({ api }: QuestionProps) {
  const no = () => api.wrong("It didn't say that. It was shiny, red and very needy.");
  return (
    <>
      <Prompt size="lg">In episode 1, what did the shiny button say?</Prompt>
      <div className="mt-7 grid grid-cols-2 items-center justify-items-center gap-5 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => api.correct("PRESS ME. And this time, you were allowed to.")}
          className={cn(styles.comic, styles.pulse, "grid size-28 place-items-center rounded-full border-[4px] border-[#161414] bg-[#D41F22] text-3xl leading-none text-white")}
        >
          PRESS
          <br />
          ME
        </button>
        <AnswerButton tone="ink" size="sm" onClick={no}>
          DON&apos;T
        </AnswerButton>
        <AnswerButton tone="blue" size="sm" onClick={no}>
          CLICK ME
        </AnswerButton>
        <AnswerButton tone="green" size="sm" onClick={no}>
          START
        </AnswerButton>
      </div>
    </>
  );
}

// --- 12. Fruit or Not (part of the boss) -------------------------------------------------------------

function FruitOrNot({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">Which of these is a fruit?</Prompt>
      <Choices>
        {["Tomato", "Carrot", "Potato", "Onion"].map((answer, i) => (
          <AnswerButton
            key={answer}
            tone={TONE_ROW[i]}
            size="sm"
            onClick={() =>
              answer === "Tomato"
                ? api.correct("Tomato! It grows from a flower and it's full of seeds. A fruit.")
                : api.wrong("That one grows in the ground. Think: flowers and seeds.")
            }
          >
            {answer}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 13. The Sticky Note -------------------------------------------------------------------------------

function StickyAgain({ api }: QuestionProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Prompt size="lg" className="flex-1 sm:text-left">
          In episode 1, what password was written on the sticky note?
        </Prompt>
        <StickyNote rotate={5} className="shrink-0">
          <span className="block text-xs uppercase tracking-wider opacity-70">Password:</span>
          <span className="text-2xl">?????</span>
        </StickyNote>
      </div>
      <TypeAnswer
        placeholder="The note said…"
        check={(text) => /^bananas?$/.test(normalize(text))}
        onCorrect={() => api.correct("Banana. The note was wrong, but you remembered what it SAID.")}
        onWrong={(text) =>
          api.wrong(
            /^pickles?$/.test(normalize(text))
              ? "Pickles was the REAL password. I asked what the NOTE said."
              : "That's not what the note said. It was a yellow fruit.",
          )
        }
      />
    </>
  );
}

// --- 14. In Order -------------------------------------------------------------------------------------

type Moment = "maths" | "hands" | "elephant" | "leave";
const MOMENTS: Array<{ id: Moment; text: string; tone: Tone }> = [
  { id: "elephant", text: "The elephant in the fridge", tone: "blue" },
  { id: "leave", text: "“Leave the quiz.”", tone: "red" },
  { id: "maths", text: "“What's 2 + 2?”", tone: "yellow" },
  { id: "hands", text: "“Don't press anything.”", tone: "green" },
];
const ORDER: Moment[] = ["maths", "hands", "elephant", "leave"];

function InOrder({ api }: QuestionProps) {
  const { press, done, step } = useSequence(ORDER, {
    onDone: () => api.correct("In order! You have a terrifying memory."),
    onWrong: () => api.wrong("That came later. Think back to the start of episode 1."),
  });
  return (
    <>
      <Prompt size="lg">Click these in the order they happened in episode 1.</Prompt>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MOMENTS.map((moment) => {
          const position = ORDER.indexOf(moment.id) + 1;
          return (
            <AnswerButton
              key={moment.id}
              tone={done(moment.id) ? "ink" : moment.tone}
              size="sm"
              className="min-h-16 justify-start gap-3 px-4 text-left text-lg"
              aria-pressed={done(moment.id)}
              onClick={() => press(moment.id)}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/90 text-base text-[#161414]">
                {done(moment.id) ? position : "?"}
              </span>
              {moment.text}
            </AnswerButton>
          );
        })}
      </div>
      <Note>{step} of 4 in order</Note>
    </>
  );
}

// --- 15. BOSS: Encore ---------------------------------------------------------------------------------

interface Encore {
  n: number;
  prompt: string;
  options: string[];
  answer: string;
  quote?: string;
}

const ENCORE: Encore[] = [
  { n: 3, prompt: "What's 3 + 3?", options: ["6", "33", "Fish", "Window"], answer: "Fish", quote: "“It's Fish this time. Honest.”" },
  { n: 7, prompt: "What's the opposite of “not wrong”?", options: ["Right", "Wrong", "Correct", "Left"], answer: "Wrong" },
  { n: 12, prompt: "Which of these is a fruit?", options: ["Tomato", "Carrot", "Potato", "Onion"], answer: "Tomato" },
];

function EncoreBoss({ api }: QuestionProps) {
  // On every other attempt the order flips, so you have to read it again.
  const reverse = api.attempt % 2 === 0;
  const order = reverse ? [12, 7, 3] : [3, 7, 12];
  const [answered, setAnswered] = useState<number[]>([]);

  const answer = (card: Encore, option: string) => {
    const expected = order[answered.length];
    if (card.n !== expected) {
      api.wrong(reverse ? "REVERSE order! Twelve, then seven, then three." : "In ORDER this time! Three, then seven, then twelve.");
      return;
    }
    if (option !== card.answer) {
      api.wrong(`You answered question ${card.n} once already! It was ${card.answer}.`);
      return;
    }
    const next = [...answered, card.n];
    setAnswered(next);
    if (next.length === order.length) api.correct("Encore! You remembered EVERYTHING. That's creepy.");
  };

  return (
    <>
      <Prompt size="lg">
        Answer questions 3, 7 and 12 again, {reverse ? "in reverse order" : "in the original order"}.
      </Prompt>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ENCORE.map((card) => {
          const done = answered.includes(card.n);
          return (
            <section
              key={card.n}
              aria-label={`Question ${card.n} again`}
              className={cn("relative rounded-2xl border-[3px] border-[#161414] bg-white p-4", done && "opacity-60")}
            >
              <p className="pixel-label text-[0.65rem] text-[#615C52]">Question {card.n}</p>
              <p className={cn(styles.show, "mt-1 text-lg leading-tight text-[#161414]")}>{card.prompt}</p>
              {card.quote && (
                <Quote className="mt-2 px-3 py-1.5 text-sm">
                  {card.quote}
                </Quote>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {card.options.map((option, i) => (
                  <AnswerButton
                    key={option}
                    tone={TONE_ROW[i]}
                    size="sm"
                    className="min-h-11 px-2 text-base"
                    disabled={done}
                    onClick={() => answer(card, option)}
                  >
                    {option}
                  </AnswerButton>
                ))}
              </div>
              {done && (
                <span className="absolute -right-2 -top-2 grid size-9 place-items-center rounded-full border-[3px] border-[#161414] bg-[#7ED957]" aria-label="Answered">
                  <Check className="size-5" strokeWidth={3} aria-hidden />
                </span>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------

export const EPISODE_3 = [
  defineQuestion(
    {
      id: "e3-q01",
      title: "The Sky, Back Then",
      prompt: "What colour was the sky in episode 1?",
      rules: [4],
      kinds: ["memory", "choice"],
      solution: "Green. Tonight's sky is a sunset, but episode 1's was green.",
      tell: "You typed it yourself back in episode 1.",
      hint: "Not tonight's sky. Episode 1's. You typed it once.",
    },
    SkyBackThen,
  ),
  defineQuestion(
    {
      id: "e3-q02",
      title: "Fridge Check",
      prompt: "Who is in the fridge right now?",
      rules: [2, 4],
      kinds: ["memory", "choice", "hotspot"],
      solution: "The giraffe (the last animal you put in). Or just open the fridge and look.",
      tell: "The fridge door opens. You're allowed to check.",
      hint: "Who did you put in last? Or… open the fridge. Nobody said you couldn't.",
    },
    FridgeCheck,
  ),
  defineQuestion(
    {
      id: "e3-q03",
      title: "Three Plus Three",
      prompt: "What's 3 + 3?",
      rules: [4, 5],
      kinds: ["choice"],
      solution: "Fish. Mr. Nope says so with a straight face, and a straight face means the truth.",
      tell: "No wink this time.",
      hint: "No wink. I mean it. Fish.",
      host: { text: "It's Fish this time. Honest." },
    },
    ThreePlusThree,
  ),
  defineQuestion(
    {
      id: "e3-q04",
      title: "Under the Stamp",
      prompt: "Click the answer.",
      rules: [2],
      kinds: ["drag", "hotspot"],
      solution: "Drag the wobbling stamp aside. “The answer” is underneath it.",
      tell: "The stamp wobbles. Stamps wobble when they matter.",
      hint: "Stamps can be moved. The answer is under that one.",
      touch: "Drag the stamp with your finger.",
    },
    UnderTheStamp,
  ),
  defineQuestion(
    {
      id: "e3-q05",
      title: "Don't Press Anything (Again)",
      prompt: "Don't press anything.",
      rules: [1, 3, 4],
      kinds: ["wait", "choice"],
      solution: "Wait it out, or press the button labelled “nothing”.",
      tell: "The same rule as episode 1, and one of the buttons is literally called “nothing”.",
      hint: "Same as before: don't press anything. Or press… nothing.",
      calm: true,
    },
    DontPressAgain,
  ),
  defineQuestion(
    {
      id: "e3-q06",
      title: "Hearts Left",
      prompt: "Click as many hearts as you have left.",
      rules: [4],
      kinds: ["dynamic"],
      solution: "Select exactly as many hearts as you have in the top bar, then press Done.",
      tell: "Your hearts are always shown at the top of the screen.",
      hint: "Look at the top of the screen. Count your hearts. Click that many.",
    },
    HeartsLeft,
  ),
  defineQuestion(
    {
      id: "e3-q07",
      title: "Not Wrong",
      prompt: "What's the opposite of “not wrong”?",
      rules: [1],
      kinds: ["choice"],
      solution: "Wrong. “Not wrong” means right, and the opposite of right is wrong.",
      tell: "Read it slowly. Two negatives.",
      hint: "“Not wrong” means right. What's the opposite of right? (Not left.)",
    },
    NotWrong,
  ),
  defineQuestion(
    {
      id: "e3-q08",
      title: "The Biggest Button, Again",
      prompt: "Click the biggest button.",
      rules: [1, 4],
      kinds: ["choice"],
      solution: "D. This time the question isn't a button at all.",
      tell: "The question has no button shadow and doesn't react when you hover over it.",
      hint: "Last time the question was a button. Is it now? No shadow, no bounce.",
    },
    BiggestAgain,
  ),
  defineQuestion(
    {
      id: "e3-q09",
      title: "Two Plus Two, Remembered",
      prompt: "In episode 1, what was the right answer to “What's 2 + 2?”",
      rules: [4, 5],
      kinds: ["memory", "choice"],
      solution: "4. Fish was the wink.",
      tell: "Mr. Nope winks when he says “Fish”. Again.",
      hint: "It was 4. Fish was a lie. I winked then, and I'm winking now.",
      host: { text: "It was Fish. You remember.", wink: true },
      bomb: { seconds: 12, kind: "red" },
    },
    TwoPlusTwoAgain,
  ),
  defineQuestion(
    {
      id: "e3-q10",
      title: "Count Every Stamp",
      prompt: "How many NOPE stamps are on your screen now?",
      rules: [2, 4],
      kinds: ["dynamic", "type"],
      solution: "Count the stamps on the stage, plus the one on the card itself.",
      tell: "The stamp on the card wobbles too.",
      hint: "Count the stage AND the card. The card got stamped too.",
      wall: true,
    },
    CountEveryStamp,
  ),
  defineQuestion(
    {
      id: "e3-q11",
      title: "The Shiny Button",
      prompt: "In episode 1, what did the shiny button say?",
      rules: [4, 5],
      kinds: ["memory", "choice"],
      solution: "Press the shiny PRESS ME button. It's the right answer this time.",
      tell: "Mr. Nope winks when he tells you not to press it.",
      hint: "It said PRESS ME. And this time, pressing it is the answer.",
      host: { text: "Don't press it. Not this time either.", wink: true },
    },
    ShinyButton,
  ),
  defineQuestion(
    {
      id: "e3-q12",
      title: "Fruit or Not",
      prompt: "Which of these is a fruit?",
      rules: [1],
      kinds: ["choice"],
      solution: "Tomato: it grows from a flower and carries seeds, which makes it a fruit.",
      tell: "Only one of them grows from a flower.",
      hint: "One of them grows from a flower and is full of seeds.",
    },
    FruitOrNot,
  ),
  defineQuestion(
    {
      id: "e3-q13",
      title: "The Sticky Note",
      prompt: "In episode 1, what password was written on the sticky note?",
      rules: [1, 4],
      kinds: ["memory", "type"],
      solution: "Banana. (The real password was pickles, but that's not what the note said.)",
      tell: "The question asks what the note SAID, not what the password was.",
      hint: "Not the real password. What the NOTE said. A yellow fruit.",
    },
    StickyAgain,
  ),
  defineQuestion(
    {
      id: "e3-q14",
      title: "In Order",
      prompt: "Click these in the order they happened in episode 1.",
      rules: [4],
      kinds: ["memory", "sequence"],
      solution: "“What's 2 + 2?”, “Don't press anything.”, the elephant, then “Leave the quiz.”",
      tell: "Episode 1 started with a sum and ended with an exit.",
      hint: "The sum came first. The exit came last. The fridge was in the middle.",
    },
    InOrder,
  ),
  defineQuestion(
    {
      id: "e3-q15",
      title: "Encore",
      prompt: "Answer questions 3, 7 and 12 again, in reverse order.",
      rules: [1, 4],
      kinds: ["memory", "sequence", "choice"],
      solution: "Answer question 12 (Tomato), then 7 (Wrong), then 3 (Fish). On some tries the order flips to 3, 7, 12.",
      tell: "The question tells you the order. Read it every time: it changes.",
      hint: "Read the order again. Then: Tomato, Wrong, Fish.",
      boss: true,
      calm: true,
    },
    EncoreBoss,
  ),
];
