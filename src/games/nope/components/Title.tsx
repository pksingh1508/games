"use client";

// The title screen. The first press of START gets stamped NOPE!… then "just kidding, go ahead"
// (Plan/02-nope.md §8).
import { HelpCircle, Play, Settings2, Trophy } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useSave } from "@/engine/save";
import { NOPE_ACHIEVEMENTS } from "../achievements";
import styles from "../nope.module.css";
import { EPISODES } from "../questions/episodes";
import { nopeSave, MAX_HEARTS } from "../save";
import { sfx } from "../sfx";
import { Backdrop } from "./Backdrop";
import { Heart } from "./Hud";
import { MrNope } from "./MrNope";
import { StampDefs, StampMark } from "./Stamp";

export function TitleScreen({
  jokeDone,
  onJoke,
  onStart,
  onContinue,
  onHelp,
  onTrophies,
  onOptions,
  reducedMotion,
}: {
  /** The START joke happens once per visit. */
  jokeDone: boolean;
  onJoke: () => void;
  onStart: () => void;
  onContinue: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
  reducedMotion: boolean;
}) {
  const save = useSave(nopeSave);
  const [stamped, setStamped] = useState(false);
  const run = save.run;
  const cleared = Object.values(save.episodes).filter((e) => e.clears > 0).length;
  const trophies = Object.keys(save.achievements).length;

  const pressStart = () => {
    if (!jokeDone) {
      sfx.thunk();
      sfx.laugh();
      setStamped(true);
      onJoke();
      return;
    }
    sfx.boop();
    onStart();
  };

  return (
    <div className={cn(styles.stage, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 pb-16 pt-14")}>
      <StampDefs />
      <Backdrop theme="day" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <p className="pixel-label rounded-full border border-[#FFC93C]/40 bg-[#161414]/70 px-4 py-1.5 text-[0.7rem] text-[#FFC93C]">
          Mind Games Arcade presents
        </p>

        <div className="relative mt-6 flex items-end justify-center gap-2 sm:gap-6">
          <m.h1
            className={cn(styles.comic, styles.logoText, "text-[clamp(6rem,24vw,13rem)] leading-[0.8]")}
            initial={reducedMotion ? false : { scale: 1.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -3, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
          >
            NOPE!
          </m.h1>
          <MrNope mood={stamped && !jokeDone ? "laughing" : "smug"} className={cn("mb-2 h-28 w-auto shrink-0 sm:h-44", styles.bob)} />
        </div>

        <p className={cn(styles.show, "mt-6 max-w-xl text-balance rounded-2xl bg-[#161414]/80 px-5 py-2 text-xl text-[#FFF4D6] sm:text-2xl")}>
          The quiz show where the obvious answer is wrong.
        </p>

        <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-4">
          {run && (
            <button type="button" onClick={onContinue} className="btn btn-lg w-full" data-sound="coin">
              <Play className="size-5" fill="currentColor" aria-hidden />
              Continue: Episode {run.episode}, Q{run.index + 1}
              <span className="ml-1 flex" aria-label={`${run.hearts} hearts`}>
                {Array.from({ length: MAX_HEARTS }, (_, i) => (
                  <Heart key={i} broken={i >= run.hearts} className="size-4" />
                ))}
              </span>
            </button>
          )}
          <div className="relative w-full">
            <button
              type="button"
              onClick={pressStart}
              className={cn("btn btn-lg w-full text-2xl", run && "btn-secondary")}
              aria-describedby="start-joke"
            >
              ▶ {run ? "Channel guide" : "Start"}
            </button>
            <AnimatePresence>
              {stamped && (
                <m.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center"
                  initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
                  animate={{ opacity: 1, scale: 1, rotate: -8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                >
                  <StampMark color="#FFF4D6" className="w-60 drop-shadow-[0_4px_0_rgba(0,0,0,0.55)]" />
                </m.div>
              )}
            </AnimatePresence>
          </div>
          <p id="start-joke" className="min-h-10" aria-live="polite">
            {stamped && (
              <span className={cn(styles.show, "inline-block rounded-full bg-[#161414]/85 px-4 py-1.5 text-lg text-[#FFC93C]")}>
                …just kidding. Go ahead.
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onHelp} className="btn btn-ghost btn-sm text-[#FFF4D6]" data-sound="click">
            <HelpCircle className="size-4" aria-hidden /> How to play
          </button>
          <button type="button" onClick={onTrophies} className="btn btn-ghost btn-sm text-[#FFF4D6]" data-sound="click">
            <Trophy className="size-4" aria-hidden /> Trophies <span className="font-mono text-xs opacity-70">
              {trophies}/{NOPE_ACHIEVEMENTS.length}
            </span>
          </button>
          <button type="button" onClick={onOptions} className="btn btn-ghost btn-sm text-[#FFF4D6]" data-sound="click">
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-wider text-[#9B9483]">
          {cleared}/{Object.keys(EPISODES).length} episodes cleared · NOPE&apos;d {save.stats.nopes.toLocaleString("en-US")}{" "}
          {save.stats.nopes === 1 ? "time" : "times"} ·{" "}
          <Link href="/games/nope" className="underline underline-offset-4 hover:text-[#FFF4D6]">
            About the game
          </Link>
        </p>
      </div>
    </div>
  );
}
