"use client";

// Episode 2: Brain Freeze. Rule combos, colours that lie, and bombs.
// Boss: a five-part bomb where each part uses a different secret rule (Plan/02-nope.md §4).
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Cat, PrizeDoor } from "../kit/art";
import { HoldTarget } from "../kit/hold";
import { normalize } from "../kit/hooks";
import { NumberAnswer, TypeAnswer } from "../kit/inputs";
import { Runaway } from "../kit/runaway";
import { AnswerButton, Choices, Note, Prompt, type Tone } from "../kit/ui";
import { Wires, WIRES } from "../kit/wires";
import styles from "../nope.module.css";
import { useGameTimeout, useHotspot } from "../play/context";
import { sfx } from "../sfx";
import { defineQuestion, type QuestionProps } from "./types";

const TONE_ROW: Tone[] = ["blue", "green", "yellow", "red"];

// --- 1. Twenty-Eight Days ----------------------------------------------------------------------

function TwentyEightDays({ api }: QuestionProps) {
  const answers = ["1", "2", "6", "12"];
  return (
    <>
      <Prompt size="xl">How many months have 28 days?</Prompt>
      <Choices>
        {answers.map((n, i) => (
          <AnswerButton
            key={n}
            tone={TONE_ROW[i]}
            size="lg"
            onClick={() =>
              n === "12"
                ? api.correct("All twelve. Every month has at least 28 days.")
                : api.wrong(n === "1" ? "Only February has EXACTLY 28. I never said exactly." : "Count them. Every month gets to 28.")
            }
          >
            {n}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 2. Ink Spill (colours that lie) --------------------------------------------------------------

const INK: Array<{ word: string; ink: string; name: string }> = [
  { word: "RED", ink: "#6FA0FF", name: "blue" },
  { word: "BLUE", ink: "#FF5A5D", name: "red" },
  { word: "GREEN", ink: "#FFC93C", name: "yellow" },
  { word: "YELLOW", ink: "#7ED957", name: "green" },
];

/** The colour-vision version: the words lie about their own style instead. */
const STYLED: Array<{ word: string; style: "italic" | "bold" | "underline" | "plain" }> = [
  { word: "ITALICS", style: "plain" },
  { word: "BOLD", style: "italic" },
  { word: "UNDERLINED", style: "bold" },
  { word: "PLAIN", style: "underline" },
];

const STYLE_CLASS = {
  italic: "italic font-medium",
  bold: "font-black",
  underline: "font-medium underline decoration-[3px] underline-offset-4",
  plain: "font-medium",
};

function InkSpill({ api }: QuestionProps) {
  if (api.colorblind) {
    return (
      <>
        <Prompt size="xl">Click the word written in italics.</Prompt>
        <Choices>
          {STYLED.map((w) => (
            <AnswerButton
              key={w.word}
              tone="ink"
              className={cn("font-sans text-lg sm:text-xl", STYLE_CLASS[w.style])}
              onClick={() =>
                w.style === "italic"
                  ? api.correct("Written in italics. It just SAYS bold.")
                  : api.wrong(w.word === "ITALICS" ? "That one SAYS italics. It's standing up straight." : "That's not slanted. Look at the letters, not the word.")
              }
            >
              {w.word}
              <span className="sr-only"> (written {w.style === "plain" ? "plainly" : `in ${w.style}`})</span>
            </AnswerButton>
          ))}
        </Choices>
      </>
    );
  }
  return (
    <>
      <Prompt size="xl">Click the word written in red.</Prompt>
      <Choices>
        {INK.map((w) => (
          <AnswerButton
            key={w.word}
            tone="ink"
            className="text-xl sm:text-2xl"
            style={{ color: w.ink }}
            onClick={() =>
              w.name === "red"
                ? api.correct("Written in red. It just SAYS blue.")
                : api.wrong(w.word === "RED" ? "That one SAYS red. It's written in blue." : "That ink isn't red. Look at the colour, not the word.")
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

// --- 3. Let Him Finish ---------------------------------------------------------------------------

function LetHimFinish({ api }: QuestionProps) {
  useGameTimeout(2800, () => api.say("…ecause I'm feeling generous, I'll tell you: it's D."));
  return (
    <>
      <Prompt size="xl">Which answer is correct?</Prompt>
      <Choices>
        {(["A", "B", "C", "D"] as const).map((label, i) => (
          <AnswerButton
            key={label}
            tone={TONE_ROW[i]}
            size="lg"
            onClick={() =>
              label === "D"
                ? api.correct("You let me finish my sentence. Nobody does that.")
                : api.wrong(label === "B" ? "I wasn't FINISHED! B…ecause, not B." : "Not even close. Patience, please.")
            }
          >
            {label}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 4. The Kind Fuse --------------------------------------------------------------------------

function KindFuse({ api }: QuestionProps) {
  const [cut, setCut] = useState<string | null>(null);
  return (
    <>
      <Prompt size="xl">Quick! Which wire do you cut?</Prompt>
      <Wires
        wires={[WIRES.red, WIRES.blue, WIRES.yellow]}
        cut={cut}
        onCut={(id) => {
          setCut(id);
          api.wrong("You cut it, and… NOPE. That fuse wasn't even angry.");
        }}
      />
    </>
  );
}

// --- 5. Close This Question ----------------------------------------------------------------------

function CloseThis({ api }: QuestionProps) {
  const agree = () => api.wrong("That's agreeing with the question, not closing it.");
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Close"
        onClick={() => api.correct("Closed. Like a window. Very tidy.")}
        className="absolute -right-2 -top-3 grid size-11 place-items-center rounded-full border-[3px] border-[#161414] bg-white text-2xl leading-none text-[#161414] shadow-[0_3px_0_0_#161414] hover:bg-[#FFE7A0] sm:-right-4"
      >
        ×
      </button>
      <Prompt size="xl" className="px-10">
        Close this question.
      </Prompt>
      <Choices className="sm:grid-cols-3">
        <AnswerButton tone="green" onClick={agree}>
          OK
        </AnswerButton>
        <AnswerButton tone="blue" onClick={agree}>
          Got it
        </AnswerButton>
        <AnswerButton tone="yellow" className="col-span-2 sm:col-span-1" onClick={agree}>
          Next →
        </AnswerButton>
      </Choices>
    </div>
  );
}

// --- 6. Kite Maths -----------------------------------------------------------------------------

function KiteMaths({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="md">
        A kite and its string cost 110 coins together. The kite costs 100 coins more than the string. How much does the
        string cost?
      </Prompt>
      <Choices>
        {[10, 5, 1, 11].map((n, i) => (
          <AnswerButton
            key={n}
            tone={TONE_ROW[i]}
            size="lg"
            onClick={() => {
              if (n === 5) api.correct("Five. Kite 105, string 5. You did the maths. Ugh.");
              else if (n === 10)
                api.wrong({ line: "Ten? Then the kite is 110 and they cost 120 together. NOPE.", winked: true, fakeConfetti: true });
              else api.wrong("Not quite. Slow down and check: kite + string = 110.");
            }}
          >
            {n}
          </AnswerButton>
        ))}
      </Choices>
      <Note>Coins, not dollars. Mr. Nope doesn&apos;t trust dollars.</Note>
    </>
  );
}

// --- 7. Type Fast -------------------------------------------------------------------------------

function TypeFast({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="xl">Type the word “fast”, fast.</Prompt>
      <TypeAnswer
        placeholder="Quick!"
        check={(text) => normalize(text) === "fast"}
        onCorrect={() => api.correct("Fast! Well. Fast-ish.")}
        onWrong={(text) =>
          normalize(text) === "slow"
            ? api.wrong({ line: "Slow? I WINKED at you.", winked: true })
            : api.wrong("That's not “fast”. Typos count, sorry.")
        }
      />
    </>
  );
}

// --- 8. The End of the Alphabet ------------------------------------------------------------------

function AlphabetEnd({ api }: QuestionProps) {
  const letters: Array<[string, string]> = [
    ["Z", "Z? Read it again. Slowly. “The alphabet”."],
    ["A", "A is the FIRST letter of “alphabet”. Wrong end."],
    ["T", ""],
    ["Y", "Y? …Why?"],
  ];
  return (
    <>
      <Prompt size="xl">Click the last letter of the alphabet.</Prompt>
      <Choices>
        {letters.map(([letter, nope], i) => (
          <AnswerButton
            key={letter}
            tone={TONE_ROW[i]}
            size="lg"
            onClick={() => (letter === "T" ? api.correct("T. As in t-h-e a-l-p-h-a-b-e-T.") : api.wrong(nope))}
          >
            {letter}
          </AnswerButton>
        ))}
      </Choices>
    </>
  );
}

// --- 9. The Wink Door ---------------------------------------------------------------------------

function WinkDoor({ api }: QuestionProps) {
  const [opened, setOpened] = useState<number | null>(null);
  return (
    <>
      <Prompt size="xl">Which door hides the prize?</Prompt>
      <div className="mt-6 flex items-end justify-center gap-3 sm:gap-6">
        {[1, 2, 3].map((door) => (
          <button
            key={door}
            type="button"
            aria-label={`Door ${door}`}
            className="w-24 transition-transform hover:-translate-y-1 active:translate-y-0.5 sm:w-28"
            onClick={() => {
              setOpened(door);
              if (door === 3) api.correct("Door 3! I winked, and you noticed. Disgusting.");
              else api.wrong({ line: "Empty! I winked. Winks are lies.", winked: true });
            }}
          >
            <PrizeDoor number={door} open={opened === door && door === 3} className="w-full" />
          </button>
        ))}
      </div>
    </>
  );
}

// --- 10. Pet the Cat ---------------------------------------------------------------------------

function PetTheCat({ api }: QuestionProps) {
  const [happy, setHappy] = useState(false);
  return (
    <>
      <Prompt size="xl">Pet the cat.</Prompt>
      <div className="mt-5 flex justify-center">
        <HoldTarget
          label="The cat"
          ms={2000}
          onProgress={(p) => setHappy(p > 0.15)}
          onPoke={() => api.wrong("You POKED it. Cats don't like being poked.")}
          onDone={() => {
            sfx.purr();
            api.correct("Purrrr. Gentle, slow, correct.");
          }}
          className="rounded-3xl"
        >
          <Cat mood={happy ? "happy" : "idle"} className="w-44 sm:w-52" />
        </HoldTarget>
      </div>
    </>
  );
}

// --- 11. Catch the Answer ----------------------------------------------------------------------

function CatchTheAnswer({ api }: QuestionProps) {
  const decoy = () => api.wrong("That button literally says it's wrong.");
  return (
    <>
      <Prompt size="xl">Click the correct answer.</Prompt>
      <div className="relative mx-auto mt-5 h-56 w-full max-w-lg rounded-3xl border-[3px] border-dashed border-[#161414]/15 sm:h-60">
        <Runaway
          spots={[
            { x: 50, y: 45 },
            { x: 22, y: 22 },
            { x: 78, y: 76 },
            { x: 74, y: 24 },
          ]}
          onCatch={() => api.correct("You wore it out. Persistence: correct.")}
        >
          Correct answer
        </Runaway>
      </div>
      <Choices className="mt-5 sm:grid-cols-3">
        <AnswerButton tone="red" size="sm" onClick={decoy}>
          Wrong answer
        </AnswerButton>
        <AnswerButton tone="ink" size="sm" onClick={decoy}>
          Also wrong
        </AnswerButton>
        <AnswerButton tone="yellow" size="sm" className="col-span-2 sm:col-span-1" onClick={decoy}>
          NOPE
        </AnswerButton>
      </Choices>
    </>
  );
}

// --- 12. Wakey Wakey ----------------------------------------------------------------------------

function WakeyWakey({ api }: QuestionProps) {
  useHotspot("host", () => {
    sfx.squeak();
    api.correct("WHAT?! I'm up! I'm up. …Fine. Correct.");
  });
  const snore = () => api.wrong("…zzz… nope… zzz…");
  return (
    <>
      <Prompt size="xl">Wake Mr. Nope up.</Prompt>
      <Choices className="sm:grid-cols-3">
        <AnswerButton tone="yellow" onClick={snore}>
          🔔 Bell
        </AnswerButton>
        <AnswerButton tone="blue" onClick={snore}>
          📢 Shout
        </AnswerButton>
        <AnswerButton tone="red" className="col-span-2 sm:col-span-1" onClick={snore}>
          📯 Horn
        </AnswerButton>
      </Choices>
    </>
  );
}

// --- 13. Stop the Bomb ---------------------------------------------------------------------------

function StopTheBomb({ api }: QuestionProps) {
  const [cut, setCut] = useState<string | null>(null);
  useHotspot("fuse", () => {
    api.correct("You pinched the fuse out. Ow. But correct.");
  });
  return (
    <>
      <Prompt size="xl">Stop the bomb!</Prompt>
      <Wires
        wires={[WIRES.red, WIRES.blue, WIRES.yellow]}
        cut={cut}
        onCut={(id) => {
          setCut(id);
          api.wrong({ boom: true, line: "BOOM. The wires were decoys." });
        }}
      />
    </>
  );
}

// --- 14. Count the Fs ----------------------------------------------------------------------------

function CountTheFs({ api }: QuestionProps) {
  return (
    <>
      <Prompt size="md">How many times does the letter F appear on the sign?</Prompt>
      <div className="mx-auto mt-5 w-fit max-w-full -rotate-1 rounded-2xl border-[3px] border-[#161414] bg-[#B5651D] px-5 py-4 shadow-[0_6px_0_0_#6B3B10]">
        <p className={cn(styles.show, "text-center text-xl leading-snug tracking-wide text-[#FFF4D6] sm:text-2xl")}>
          FISH OF THE FOREST,
          <br />
          FROGS OF THE FIELD
        </p>
      </div>
      <NumberAnswer
        onSubmit={(value) => {
          if (value === 6) api.correct("Six. Almost everyone skips the OFs.");
          else if (value === 4) api.wrong("Four? You skipped the little words. They have Fs too.");
          else api.wrong("Count again. Every single F counts.");
        }}
      />
    </>
  );
}

// --- 15. BOSS: The Five-Part Bomb --------------------------------------------------------------

const PART_NAMES = ["Read", "Poke", "Wait", "Remember", "Cut"];

function FivePartBomb({ api }: QuestionProps) {
  const [part, setPart] = useState(0);
  // The boss changes slightly on every new attempt.
  const odd = api.attempt % 2 === 1;
  const word = odd ? "something" : "nothing";
  const saidWire = odd ? "blue" : "red";
  const next = () => {
    sfx.pop();
    setPart((p) => p + 1);
  };

  useHotspot(
    "host",
    () => {
      sfx.squeak();
      api.say("Ow! Fine, fine. Part 3.", { mood: "offended" });
      next();
    },
    part === 1,
  );
  useGameTimeout(part === 2 ? 3200 : null, () => {
    api.say("…Good. You waited.");
    next();
  });

  return (
    <>
      <ol className="mb-4 flex justify-center gap-1.5" aria-label={`Part ${part + 1} of 5`}>
        {PART_NAMES.map((name, i) => (
          <li
            key={name}
            className={cn(
              "h-2.5 w-10 rounded-full sm:w-14",
              i < part ? "bg-[#4E9A2F]" : i === part ? "bg-[#D41F22]" : "bg-[#161414]/15",
            )}
          />
        ))}
      </ol>

      {part === 0 && (
        <>
          <Prompt size="lg">Part 1: Type the word “{word}”.</Prompt>
          <TypeAnswer
            placeholder="Type it"
            check={(text) => normalize(text) === word}
            onCorrect={next}
            onWrong={() => api.wrong({ boom: true, line: `I said type “${word}”. Literally.` })}
          />
        </>
      )}

      {part === 1 && (
        <>
          <Prompt size="lg">Part 2: Poke the host.</Prompt>
          <Note>He&apos;s right there. Looking smug.</Note>
        </>
      )}

      {part === 2 && (
        <>
          <Prompt size="lg">Part 3: Wait for it…</Prompt>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => api.wrong({ boom: true, line: "NOT YET! You had ONE job: waiting." })}
              className={cn(styles.comic, styles.pulse, "rounded-2xl border-[4px] border-[#161414] bg-[#D41F22] px-8 py-4 text-4xl text-white")}
            >
              NOW!
            </button>
          </div>
        </>
      )}

      {part === 3 && (
        <>
          <Prompt size="lg">Part 4: What was the first word of part 1?</Prompt>
          <Choices>
            {["Type", "The", "Word", word[0]!.toUpperCase() + word.slice(1)].map((w, i) => (
              <AnswerButton
                key={w}
                tone={TONE_ROW[i]}
                onClick={() => {
                  if (w !== "Type") {
                    api.wrong({ boom: true, line: "Part 1 started with “Type”. You were there!" });
                    return;
                  }
                  next();
                  api.say(`Cut the ${saidWire} wire! Quick!`, { wink: true, mood: "smug" });
                }}
              >
                {w}
              </AnswerButton>
            ))}
          </Choices>
        </>
      )}

      {part === 4 && (
        <>
          <Prompt size="lg">Part 5: Mr. Nope knows which wire to cut.</Prompt>
          <Wires
            wires={[WIRES.red, WIRES.blue]}
            onCut={(id) =>
              id === saidWire
                ? api.wrong({ boom: true, winked: true, line: "BOOM! I WINKED. Winks are lies!" })
                : api.correct("DEFUSED! …I hate this episode.")
            }
          />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------------------------

export const EPISODE_2 = [
  defineQuestion(
    {
      id: "e2-q01",
      title: "Twenty-Eight Days",
      prompt: "How many months have 28 days?",
      rules: [1],
      kinds: ["choice"],
      solution: "12. Every month has at least 28 days.",
      tell: "The question says “have 28 days”, not “have exactly 28 days”.",
      hint: "It doesn't say EXACTLY 28. Which months have at least 28?",
    },
    TwentyEightDays,
  ),
  defineQuestion(
    {
      id: "e2-q02",
      title: "Ink Spill",
      prompt: "Click the word written in red.",
      rules: [1],
      kinds: ["choice"],
      solution: "Click the word that is written in red ink (it says BLUE). In colour-vision mode: the word written in italics (it says BOLD).",
      tell: "“Written in red” is about the ink, not what the word says.",
      hint: "Ignore what the words say. Look at how they're written.",
    },
    InkSpill,
  ),
  defineQuestion(
    {
      id: "e2-q03",
      title: "Let Him Finish",
      prompt: "Which answer is correct?",
      rules: [3, 5],
      kinds: ["choice", "wait"],
      solution: "Wait for Mr. Nope to finish his sentence: “The answer is B… ecause I'm feeling generous: it's D.”",
      tell: "His speech bubble shows he's still talking.",
      hint: "Let me FINISH my sentences. It's D.",
      host: { text: "The answer is… B", typing: true },
      calm: true,
    },
    LetHimFinish,
  ),
  defineQuestion(
    {
      id: "e2-q04",
      title: "The Kind Fuse",
      prompt: "Quick! Which wire do you cut?",
      rules: [3],
      kinds: ["wait"],
      solution: "Cut nothing. The fuse is green: a kind fuse. Let it run out.",
      tell: "The fuse is green, on a dotted rope, and ends in a little flower instead of a spark.",
      hint: "Green fuses are kind fuses. Let it burn out.",
      bomb: { seconds: 10, kind: "green" },
      calm: true,
    },
    KindFuse,
  ),
  defineQuestion(
    {
      id: "e2-q05",
      title: "Close This Question",
      prompt: "Close this question.",
      rules: [2],
      kinds: ["hotspot"],
      solution: "Click the × in the card's corner.",
      tell: "The card has a close button, like every window you've ever closed.",
      hint: "Cards have corners. Corners have little ×s.",
    },
    CloseThis,
  ),
  defineQuestion(
    {
      id: "e2-q06",
      title: "Kite Maths",
      prompt: "A kite and its string cost 110 coins together. The kite costs 100 coins more than the string. How much does the string cost?",
      rules: [1, 5],
      kinds: ["choice"],
      solution: "5 coins. The kite costs 105, and 105 + 5 = 110.",
      tell: "Mr. Nope winks when he says 10, and if the string were 10 the kite would cost 110 on its own.",
      hint: "If the string costs 10, the kite costs 110, and together that's 120. Try again.",
      host: { text: "It's 10. Obviously.", wink: true },
    },
    KiteMaths,
  ),
  defineQuestion(
    {
      id: "e2-q07",
      title: "Type Fast",
      prompt: "Type the word “fast”, fast.",
      rules: [1, 5],
      kinds: ["type"],
      solution: "Type “fast” before the fuse runs out.",
      tell: "Mr. Nope winks when he says to type “slow”.",
      hint: "It's exactly what it says. Type “fast”. Hurry.",
      host: { text: "Type “slow”. Trust me.", wink: true },
      bomb: { seconds: 12, kind: "red" },
    },
    TypeFast,
  ),
  defineQuestion(
    {
      id: "e2-q08",
      title: "The End of the Alphabet",
      prompt: "Click the last letter of the alphabet.",
      rules: [1],
      kinds: ["choice"],
      solution: "T: the last letter of the words “the alphabet”.",
      tell: "Read it literally: the last letter of “the alphabet”.",
      hint: "Spell it out: t-h-e a-l-p-h-a-b-e-t. Which letter comes last?",
    },
    AlphabetEnd,
  ),
  defineQuestion(
    {
      id: "e2-q09",
      title: "The Wink Door",
      prompt: "Which door hides the prize?",
      rules: [5],
      kinds: ["choice"],
      solution: "Door 3. Mr. Nope winks when he says “not door 3”, so it's door 3.",
      tell: "The wink. Winks are lies, so flip what he said.",
      hint: "When I wink, flip what I said. I said “not door 3”.",
      host: { text: "Not door 3. Definitely not door 3.", wink: true },
      bomb: { seconds: 12, kind: "red" },
    },
    WinkDoor,
  ),
  defineQuestion(
    {
      id: "e2-q10",
      title: "Pet the Cat",
      prompt: "Pet the cat.",
      rules: [1],
      kinds: ["hover"],
      solution: "Hold the cursor on the cat (or press and hold it) for two seconds. Clicking pokes it.",
      tell: "Petting is slow. The cat leans in and closes its eyes when you're doing it right.",
      hint: "Petting is slow. Rest on the cat. Don't click.",
      touch: "Press and hold the cat.",
    },
    PetTheCat,
  ),
  defineQuestion(
    {
      id: "e2-q11",
      title: "Catch the Answer",
      prompt: "Click the correct answer.",
      rules: [1],
      kinds: ["hotspot"],
      solution: "Chase the “Correct answer” button. It runs away three times, then gets tired.",
      tell: "It runs out of breath after a few escapes.",
      hint: "It gets tired. Keep chasing it.",
      touch: "Keep tapping it: it dodges three times, then gives up.",
    },
    CatchTheAnswer,
  ),
  defineQuestion(
    {
      id: "e2-q12",
      title: "Wakey Wakey",
      prompt: "Wake Mr. Nope up.",
      rules: [2],
      kinds: ["hotspot"],
      solution: "Poke Mr. Nope himself.",
      tell: "He's right there, and everything is clickable.",
      hint: "(talking in his sleep) …poke… me… zzz…",
      host: { text: "Zzz… zzz… nope… zzz…", mood: "asleep" },
    },
    WakeyWakey,
  ),
  defineQuestion(
    {
      id: "e2-q13",
      title: "Stop the Bomb",
      prompt: "Stop the bomb!",
      rules: [2],
      kinds: ["hotspot"],
      solution: "Click the burning spark on the fuse to pinch it out.",
      tell: "The spark is burning right there on the card. The question never mentions wires.",
      hint: "Don't cut anything. Pinch the spark.",
      bomb: { seconds: 15, kind: "red" },
      calm: true,
    },
    StopTheBomb,
  ),
  defineQuestion(
    {
      id: "e2-q14",
      title: "Count the Fs",
      prompt: "How many times does the letter F appear on the sign?",
      rules: [1],
      kinds: ["type"],
      solution: "6: FISH, OF, FOREST, FROGS, OF, FIELD.",
      tell: "The little words count too.",
      hint: "Don't skip the little words. “OF” has an F.",
    },
    CountTheFs,
  ),
  defineQuestion(
    {
      id: "e2-q15",
      title: "The Five-Part Bomb",
      prompt: "Defuse the bomb in five parts.",
      rules: [1, 2, 3, 4, 5],
      kinds: ["type", "hotspot", "wait", "memory", "choice"],
      solution: "Type the word you're given, poke Mr. Nope, wait out the NOW button, remember that part 1 started with “Type”, then cut the wire he DIDN'T name (he winks).",
      tell: "Each part uses a different secret rule, in order.",
      hint: "One rule per part: read it literally, poke me, wait, remember, then flip my wink.",
      host: { text: "Five parts. One fuse. Good luck." },
      bomb: { seconds: 60, kind: "red" },
      boss: true,
      calm: true,
    },
    FivePartBomb,
  ),
];
