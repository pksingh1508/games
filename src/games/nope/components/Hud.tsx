"use client";

// The scoreboard along the top: the show's logo, the question counter, hearts, the skip slot and
// pause. Every piece of it is clickable (secret rule 2); most of the time it just makes
// Mr. Nope talk.
import { Pause } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import type { HotspotName } from "../play/context";
import { MAX_HEARTS, QUESTIONS_PER_EPISODE, type QuestionResult } from "../save";
import { Fly } from "../kit/art";

export function Heart({ broken, className }: { broken?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 32 30" className={className} aria-hidden>
      <path
        d="M16 28 C7 21 2 16 2 9.5 C2 5 5.5 2 9.5 2 C12.5 2 14.8 3.8 16 6 C17.2 3.8 19.5 2 22.5 2 C26.5 2 30 5 30 9.5 C30 16 25 21 16 28 z"
        fill={broken ? "#4A4440" : "#FF3B4E"}
        stroke="#161414"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {broken ? (
        <path d="M16 6 l-3 7 l5 4 l-3 6" stroke="#161414" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      ) : (
        <path d="M8 8 q2 -3 5 -2" stroke="#FFC2C8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

const PIP: Record<QuestionResult, string> = {
  first: "bg-[#7ED957]",
  retry: "bg-[#FF3B4E]",
  skip: "bg-[#3DE0FF]",
};

export function Hud({
  episode,
  episodeName,
  number,
  hearts,
  lostHeart,
  hasSkip,
  results,
  onHotspot,
  onPause,
}: {
  episode: number;
  episodeName: string;
  /** 1–15 */
  number: number;
  hearts: number;
  /** The heart that just broke (animates). */
  lostHeart: number | null;
  hasSkip: boolean;
  results: readonly QuestionResult[];
  onHotspot: (name: HotspotName, detail?: { index?: number }) => void;
  onPause: () => void;
}) {
  return (
    <header className="pointer-events-auto relative z-20 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-6xl items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0B0909]/85 p-1.5 shadow-[0_10px_30px_-12px_#000,inset_0_1px_0_0_#ffffff14] backdrop-blur-md sm:w-[calc(100%-3rem)] sm:gap-3 sm:p-2">
      <button
        type="button"
        onClick={() => onHotspot("logo")}
        className="hidden h-11 shrink-0 place-items-center rounded-xl px-2.5 hover:bg-white/5 min-[420px]:grid"
        aria-label="NOPE! logo"
      >
        <span className={cn(styles.comic, styles.logoText, "text-2xl leading-none sm:text-[1.7rem]")}>NOPE!</span>
      </button>
      <p className="hidden min-w-0 truncate font-mono text-xs font-semibold uppercase tracking-wider text-[#9B9483] lg:block">
        <span className="text-[#FFF4D6]">EP {episode}</span> · {episodeName}
      </p>

      <button
        type="button"
        onClick={() => onHotspot("counter")}
        className="mr-auto flex h-11 shrink-0 items-center gap-3 rounded-xl px-2 hover:bg-white/5 sm:mx-auto sm:px-2.5"
        aria-label={`Question ${number} of ${QUESTIONS_PER_EPISODE}`}
      >
        <span className={cn(styles.show, "whitespace-nowrap text-xl leading-none text-[#FFC93C] sm:text-2xl")}>
          <span className="max-sm:hidden">Q{String(number).padStart(2, "0")}</span>
          <span className="sm:hidden">Q{number}</span>
          <span className="text-[#9B9483]">/{QUESTIONS_PER_EPISODE}</span>
        </span>
        <span aria-hidden className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: QUESTIONS_PER_EPISODE }, (_, i) => {
            const result = results[i];
            return (
              <span
                key={i}
                className={cn(
                  "block size-2 rounded-full",
                  result ? PIP[result] : i === number - 1 ? "bg-[#FFC93C] ring-2 ring-[#FFC93C]/40" : "bg-white/15",
                  i === QUESTIONS_PER_EPISODE - 1 && !result && "size-2.5 rounded-[3px] bg-[#D41F22]/70",
                )}
              />
            );
          })}
        </span>
      </button>

      <div className="flex shrink-0 items-center" role="group" aria-label={`Hearts: ${hearts} of ${MAX_HEARTS}`}>
        {Array.from({ length: MAX_HEARTS }, (_, i) => {
          const alive = i < hearts;
          return alive ? (
            <button
              key={i}
              type="button"
              onClick={() => onHotspot("hearts", { index: i })}
              className="grid size-11 place-items-center rounded-xl hover:bg-white/5"
              aria-label={`Heart ${i + 1}`}
            >
              <Heart className="size-7" />
            </button>
          ) : (
            <span key={i} className="grid size-11 place-items-center" aria-hidden>
              <Heart broken className={cn("size-7 opacity-70", lostHeart === i && styles.heartCrack)} />
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onHotspot("skip")}
        className={cn(
          "relative grid h-11 shrink-0 place-items-center rounded-xl border-2 border-dashed px-1.5 hover:bg-white/5 sm:px-2",
          hasSkip ? "border-[#3DE0FF] bg-[#3DE0FF]/10" : "border-white/15",
        )}
        aria-label={hasSkip ? "Use your skip" : "Skip slot (empty)"}
      >
        <span className="flex items-center gap-1">
          <Fly className={cn("h-6 w-8", !hasSkip && "opacity-25 grayscale")} />
          <span className="hidden font-mono text-[0.65rem] font-bold uppercase tracking-wider text-[#FFF4D6] sm:inline">
            {hasSkip ? "Skip" : "0"}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onPause}
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/8 text-[#FFF4D6] hover:bg-white/15"
        aria-label="Pause"
        title="Pause (Esc)"
      >
        <Pause className="size-5" strokeWidth={2.6} fill="currentColor" />
      </button>
    </header>
  );
}
