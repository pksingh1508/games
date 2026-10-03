"use client";

// The quiz card: the question number, the fuse (bomb questions) and the question itself.
// While an answer is being judged the card is inert, so nothing can be clicked twice.
import { m } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { QuestionApi, QuestionEntry } from "../questions/types";
import { BombFuse } from "./BombFuse";

export function QuestionCard({
  entry,
  api,
  locked,
  compact,
  reducedMotion,
  onFuseExpire,
  onSpark,
}: {
  entry: QuestionEntry;
  api: QuestionApi;
  locked: boolean;
  /** Stamp-wall questions: a smaller card, out of the way. */
  compact?: boolean;
  reducedMotion: boolean;
  onFuseExpire: () => void;
  onSpark: () => void;
}) {
  const { meta, Component } = entry;
  const card = useRef<HTMLElement | null>(null);

  // A new question: move focus to its prompt (screen readers read it first; keyboard play starts here).
  useEffect(() => {
    card.current?.querySelector<HTMLElement>("[data-prompt]")?.focus({ preventScroll: true });
  }, []);

  return (
    <m.section
      ref={card}
      inert={locked}
      aria-label={meta.boss ? "Boss question" : `Question ${api.number}`}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, rotate: -1.2, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.97, transition: { duration: 0.14 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn(
        "pointer-events-auto relative w-full rounded-[2rem] border-[3px] border-[#161414] bg-[#FFF4D6] text-[#161414] shadow-[0_14px_0_0_rgba(0,0,0,0.45)]",
        compact ? "max-w-xl" : "max-w-[46rem]",
        meta.boss && "border-[#FFC93C] shadow-[0_0_0_4px_#161414,0_14px_0_4px_rgba(0,0,0,0.45),0_0_60px_-10px_#FFC93C]",
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-8 sm:pt-5">
        <p className={cn("pixel-label text-[0.7rem]", meta.boss ? "text-[#8A1416]" : "text-[#615C52]")}>
          {meta.boss ? `★ Boss question · ${api.number}/15 ★` : `Question ${api.number}`}
        </p>
        {api.fails > 0 && (
          <p className="pixel-label text-[0.7rem] text-[#8A1416]" aria-label={`NOPE'd ${api.fails} times on this one`}>
            Try {api.fails + 1}
          </p>
        )}
      </header>
      {meta.bomb && <BombFuse seconds={meta.bomb.seconds} kind={meta.bomb.kind} onExpire={onFuseExpire} onSpark={onSpark} />}
      <div className={cn("px-5 pt-4 sm:px-8", compact ? "pb-6" : "pb-7 sm:pb-9")}>
        <Component api={api} />
      </div>
    </m.section>
  );
}
