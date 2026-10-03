"use client";

// "Episode 2: Brain Freeze" — the title card before an episode. A click skips it.
import { m, useIsPresent } from "motion/react";
import { useEffect, useEffectEvent } from "react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import type { EpisodeInfo } from "../questions/episodes";
import { sfx } from "../sfx";

export type IntroMode = "start" | "retry" | "continue";

export function EpisodeIntro({
  episode,
  mode,
  attempt,
  number,
  onDone,
}: {
  episode: EpisodeInfo;
  mode: IntroMode;
  attempt: number;
  number: number;
  onDone: () => void;
}) {
  const done = useEffectEvent(onDone);
  // While it fades out, clicks go straight through to the question.
  const present = useIsPresent();

  useEffect(() => {
    sfx.drumroll(mode === "start" ? 1.2 : 0.7);
    const cheer = mode === "start" ? setTimeout(() => sfx.applause(1.4), 1250) : undefined;
    const timer = setTimeout(() => done(), mode === "start" ? 2600 : 1700);
    return () => {
      clearTimeout(cheer);
      clearTimeout(timer);
    };
  }, [mode]);

  return (
    <m.div
      className={cn(
        "absolute inset-0 z-50 grid cursor-pointer place-items-center bg-[#0B0909]/80 px-6 backdrop-blur-sm",
        !present && "pointer-events-none",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      onClick={onDone}
      role="presentation"
    >
      <div className="text-center">
        <m.p
          className="pixel-label text-[#FFC93C]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Episode {episode.id}
        </m.p>
        <m.h2
          className={cn(styles.comic, styles.logoText, "mt-3 text-[clamp(3rem,11vw,7rem)] leading-[0.9]")}
          initial={{ opacity: 0, scale: 1.6, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
        >
          {episode.name}
        </m.h2>
        <m.p
          className={cn(styles.show, "mt-6 text-xl text-[#FFF4D6] sm:text-2xl")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {mode === "retry" ? `Take ${attempt + 1}. The quiz remembers.` : mode === "continue" ? `Back to question ${number}.` : episode.tagline}
        </m.p>
        <p className="mt-10 font-mono text-xs uppercase tracking-widest text-[#9B9483]">Click anywhere to skip</p>
      </div>
    </m.div>
  );
}
