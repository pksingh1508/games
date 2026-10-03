"use client";

import { AnimatePresence, m } from "motion/react";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { unlockAchievement } from "@/engine/achievements";
import { playSound } from "@/engine/audio/ui-sound";
import { cn } from "@/lib/cn";

const SMALL_BUTTONS = [
  { label: "A", bg: "#2B59C3", base: "#1C3A7F", ink: "#FFFFFF", size: "h-10 w-12 sm:h-12 sm:w-14" },
  { label: "B", bg: "#7ED957", base: "#4E9A2F", ink: "#161414", size: "h-12 w-16 sm:h-14 sm:w-20" },
  { label: "C", bg: "#FFC93C", base: "#C99316", ink: "#161414", size: "h-10 w-14 sm:h-12 sm:w-16" },
  { label: "D", bg: "#D41F22", base: "#8A1416", ink: "#FFFFFF", size: "h-14 w-20 sm:h-16 sm:w-24" },
];

type State = "idle" | "nope" | "won";

function MrNope({ mood }: { mood: "smug" | "shocked" }) {
  return (
    <svg viewBox="0 0 90 96" className="h-24 w-auto" aria-hidden>
      <circle cx="45" cy="16" r="14" fill="#D41F22" />
      <rect x="38" y="26" width="14" height="16" fill="#8A1416" />
      <rect x="6" y="40" width="78" height="50" rx="14" fill="#D41F22" />
      {mood === "smug" ? (
        <>
          <path d="M20 54 l15 5 M70 54 l-15 5" stroke="#FFF4D6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="30" cy="65" r="4" fill="#FFF4D6" />
          <path d="M55 64 h8" stroke="#FFF4D6" strokeWidth="4" strokeLinecap="round" />
          <path d="M33 77 q12 7 24 -3" stroke="#FFF4D6" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M20 52 l15 -3 M70 52 l-15 -3" stroke="#FFF4D6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="30" cy="63" r="5" fill="#FFF4D6" />
          <circle cx="60" cy="63" r="5" fill="#FFF4D6" />
          <ellipse cx="45" cy="78" rx="6" ry="7" fill="#FFF4D6" />
        </>
      )}
    </svg>
  );
}

export function SpotTheTell() {
  const [state, setState] = useState<State>("idle");
  const [fails, setFails] = useState(0);
  const [stampKey, setStampKey] = useState(0);
  const [shaking, setShaking] = useState(false);

  const nope = () => {
    setState("nope");
    setFails((f) => f + 1);
    setStampKey((k) => k + 1);
    // Restart the shake without re-mounting (keeps keyboard focus on the button).
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    playSound("nope");
    unlockAchievement("fell-for-it");
  };

  const win = () => {
    if (state === "won") return;
    setState("won");
    playSound("success");
    unlockAchievement("spot-the-tell");
  };

  const reset = () => {
    setState("idle");
    setFails(0);
  };

  return (
    <section
      id="spot-the-tell"
      data-game="nope"
      className="relative mt-32 overflow-clip bg-bg py-24 text-ink-on-bg"
      aria-labelledby="spot-title"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-line" />
      <div aria-hidden className="absolute -right-24 top-10 size-[28rem] rounded-full bg-[#7ED957]/10 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading
            id="spot-title"
            level="Level 02"
            eyebrow="Try it now"
            title={
              <>
                Spot the <span className="text-accent">tell.</span>
              </>
            }
            description={
              <>
                Here&apos;s one question from <strong className="text-ink-on-bg">NOPE!</strong>, the troll quiz. The
                obvious answer is wrong. The right one was in front of you all along. Every game in this arcade
                works like this: tricky, never unfair.
              </>
            }
          />
          <p className="mt-6 font-mono text-sm text-muted">
            Attempts: <span className="text-ink-on-bg">{fails + (state === "won" ? 1 : 0)}</span> ·{" "}
            {state === "won" ? (
              <span className="text-[#7ED957]">Solved</span>
            ) : (
              <span>Unsolved</span>
            )}
          </p>
        </div>

        {/* The quiz card */}
        <div className="relative">
          <div className="absolute -right-2 -top-14 z-10 sm:-right-6">
            <m.div
              key={state}
              initial={{ rotate: -8, y: 6 }}
              animate={{ rotate: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
            >
              <MrNope mood={state === "won" ? "shocked" : "smug"} />
            </m.div>
          </div>

          <div
            className={cn(
              "relative rounded-[2rem] bg-surface p-6 text-ink shadow-[0_14px_0_0_#00000055] sm:p-9",
              shaking && "animate-shake",
            )}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) setShaking(false);
            }}
          >
            <p className="pixel-label text-[0.7rem] text-muted-surface">Question 1 of 1</p>

            {/* The tell: the question is the biggest button. */}
            <button
              type="button"
              onClick={win}
              className="mt-4 block w-full rounded-2xl border-[3px] border-[#161414] bg-white px-5 py-6 text-center shadow-[0_7px_0_0_#D8CDB0] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_0_#D8CDB0]"
            >
              <span className="block text-[clamp(1.7rem,4vw,2.6rem)] leading-none tracking-wide" style={{ fontFamily: "var(--font-g-bangers)" }}>
                Click the biggest button
              </span>
            </button>

            <div className="mt-8 flex flex-wrap items-end justify-center gap-3 sm:gap-4">
              {SMALL_BUTTONS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={nope}
                  className={cn(
                    "rounded-xl text-2xl transition-transform hover:-translate-y-0.5 active:translate-y-1",
                    b.size,
                  )}
                  style={{
                    background: b.bg,
                    color: b.ink,
                    boxShadow: `0 6px 0 0 ${b.base}`,
                    fontFamily: "var(--font-g-bangers)",
                  }}
                  aria-label={`Answer ${b.label}`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[3.5rem] text-center" aria-live="polite">
              {state === "idle" && <p className="text-muted-surface">Pick an answer. Take your time.</p>}
              {state === "nope" && (
                <p className="font-semibold">
                  {fails >= 2 ? "Psst… read the question literally." : "The obvious answer is almost always wrong."}
                </p>
              )}
              {state === "won" && (
                <div>
                  <p className="font-display text-xl font-extrabold">You found the tell!</p>
                  <p className="mt-1 text-muted-surface">The question itself was the biggest button.</p>
                </div>
              )}
            </div>

            {state !== "idle" && (
              <div className="mt-2 flex justify-center">
                <button type="button" onClick={reset} className="btn btn-secondary btn-sm" data-sound="click">
                  <RotateCcw className="size-4" aria-hidden /> Try again
                </button>
              </div>
            )}

            {/* The stamp */}
            <AnimatePresence>
              {state === "nope" && (
                <m.div
                  key={stampKey}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span
                    className="animate-stamp rounded-2xl border-[6px] border-[#D41F22] px-6 py-1 text-[5.5rem] leading-none text-[#D41F22] opacity-90 sm:text-[7rem]"
                    style={{ fontFamily: "var(--font-g-bangers)" }}
                  >
                    NOPE!
                  </span>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
