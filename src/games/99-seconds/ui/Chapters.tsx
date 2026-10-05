"use client";

// The chapters (Plan/03-99-seconds.md §5, §7): the story's three rooms, each opened by escaping the last; a chapter's
// title card before you go in; and the card when you get out (loops, real time, scratches read, your rank). Escaped
// chapters can be played as a Single Loop challenge.
import { Check, ChevronLeft, Lock, Share2, Timer } from "lucide-react";
import { useState } from "react";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { CHAPTERS, type ChapterId } from "../core/types";
import styles from "../ninety.module.css";
import { isDone, isOpen, rankFor, RANK_NAMES, realTime, shareText } from "../progress";
import { CHAPTER_DEFS } from "../rooms";
import type { NinetySave } from "../save";

export const INTROS: Record<ChapterId, string[]> = {
  "waiting-room": ["You wake up in a chair in a locked room.", "A big clock on the wall reads 99. It's counting down."],
  kitchen: ["Down the stairs, through a door that wasn't there, into a kitchen.", "And into a chair. The clock is gone. Somewhere, a radio is playing."],
  "clock-room": ["Down again, and up, and in.", "You're inside the clock now. It's very loud in here."],
};

export function ChapterSelect({ save, onPlay, onSingle, onBack }: { save: NinetySave; onPlay(id: ChapterId): void; onSingle(id: ChapterId): void; onBack(): void }) {
  return (
    <div className={cn(styles.root, "min-h-[calc(100dvh-4rem)] px-4 py-6")} data-chapters-screen>
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <button type="button" className={cn(styles.btn, "!min-h-10 !px-3")} onClick={onBack} data-back>
            <ChevronLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 className={cn(styles.display, "text-4xl")}>Chapters</h1>
        </div>
        <ol className="mt-6 grid gap-3">
          {CHAPTERS.map((id) => {
            const def = CHAPTER_DEFS[id];
            const rec = save.chapters[id];
            const open = isOpen(save, id);
            const done = isDone(save, id);
            const clues = Object.keys(rec.progress.clues).length;
            return (
              <li key={id} className={cn(styles.card, "flex flex-wrap items-center gap-4 p-4", !open && "opacity-60")} data-chapter-card={id} data-open={open ? "" : undefined} data-done={done ? "" : undefined}>
                <span className={cn(styles.display, "w-12 text-center text-5xl text-[var(--n9-amber)]")}>{def.number}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn(styles.display, "block text-2xl")}>{def.title}</span>
                  <span className="block text-sm text-[var(--n9-dim)]">
                    {!open ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="size-4" aria-hidden /> Escape {CHAPTER_DEFS[CHAPTERS[def.number - 2]!].title} first
                      </span>
                    ) : done && rec.escapedIn !== null ? (
                      <>
                        Out in {rec.escapedIn} loop{rec.escapedIn === 1 ? "" : "s"} · {RANK_NAMES[rankFor(rec.escapedIn)]}
                        {rec.single.best && ` · Single loop in ${realTime(rec.single.best.realMs)}`}
                      </>
                    ) : rec.progress.loops > 0 ? (
                      `Loop ${rec.progress.loops + 1}. ${clues} thing${clues === 1 ? "" : "s"} in your journal.`
                    ) : (
                      "Not started."
                    )}
                  </span>
                </span>
                {open && (
                  <span className="flex gap-2">
                    <button type="button" className={cn(styles.btn, !done && styles.primary)} onClick={() => onPlay(id)} data-play-chapter={id}>
                      {done ? "Go back in" : rec.progress.loops > 0 ? "Continue" : "Start"}
                    </button>
                    {done && (
                      <button type="button" className={cn(styles.btn, styles.primary)} onClick={() => onSingle(id)} data-single={id}>
                        <Timer className="size-4" aria-hidden /> Single Loop
                      </button>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {save.endings.true > 0 && (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--n9-dim)]">
            <Check className="size-4" aria-hidden /> The loop is closed. You&apos;ve been here before.
          </p>
        )}
      </div>
    </div>
  );
}

export function ChapterIntro({ id, single, onStart, onBack }: { id: ChapterId; single: boolean; onStart(): void; onBack(): void }) {
  const def = CHAPTER_DEFS[id];
  return (
    <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-intro={id}>
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--n9-amber)]">{single ? "Single Loop" : `Chapter ${def.number}`}</p>
        <h1 className={cn(styles.display, "mt-2 text-6xl")}>{def.title}</h1>
        <div className="mt-6 space-y-2 text-lg text-[var(--n9-dim)]">
          {(single ? ["One loop. No second chances. You know the way out."] : INTROS[id]).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={onBack} data-back>
            <ChevronLeft className="size-4" aria-hidden /> Back
          </button>
          <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6 text-lg")} onClick={onStart} data-start>
            Wake up
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChapterDone({ id, save, single, result, onNext, onChapters, onRetry }: { id: ChapterId; save: NinetySave; single: boolean; result: string; onNext: (() => void) | null; onChapters(): void; onRetry(): void }) {
  const [shared, setShared] = useState<string | null>(null);
  const def = CHAPTER_DEFS[id];
  const rec = save.chapters[id];
  const loops = rec.escapedIn ?? rec.progress.loops;
  const rank = rankFor(loops);
  const caught = result === "reset";
  const share = async () => {
    const outcome = await shareResult(shareText(def.number, def.title, loops, rank, `${window.location.origin}/games/99-seconds`));
    setShared(outcome === "copied" ? "Copied to your clipboard." : outcome === "shared" ? "Shared." : "Couldn't share that, sorry.");
  };
  return (
    <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-done={id} data-result={result}>
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--n9-amber)]">{single ? "Single Loop" : `Chapter ${def.number}`}</p>
        <h1 className={cn(styles.display, "mt-2 text-6xl")}>{caught ? "The loop caught you" : "You're out"}</h1>
        {single ? (
          <p className="mt-4 text-lg text-[var(--n9-dim)]">
            {caught ? "Zero came first. You know the way: try again." : `${def.title} in a single loop.`}
            {rec.single.best && ` Best: ${realTime(rec.single.best.realMs)}.`}
          </p>
        ) : (
          <>
            <div className="mt-6 grid w-full grid-cols-3 gap-2">
              {[
                ["Loops", String(loops)],
                ["Real time", realTime(rec.realMs)],
                ["Scratches read", String(rec.hints)],
              ].map(([label, value]) => (
                <div key={label} className={cn(styles.card, "px-3 py-3")} data-stat={label}>
                  <div className={cn(styles.display, "text-3xl text-[var(--n9-amber)]")}>{value}</div>
                  <div className="mt-1 text-xs text-[var(--n9-dim)]">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border-2 border-[var(--n9-amber)] px-6 py-3" data-rank={rank}>
              <p className="text-xs tracking-[0.3em] text-[var(--n9-dim)]">RANK</p>
              <p className={cn(styles.display, "text-4xl")}>{RANK_NAMES[rank]}</p>
            </div>
          </>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {caught && (
            <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6")} onClick={onRetry} data-retry>
              Try again
            </button>
          )}
          {!caught && onNext && (
            <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6")} onClick={onNext} data-next>
              Keep going
            </button>
          )}
          <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={onChapters} data-to-chapters>
            <ChevronLeft className="size-4" aria-hidden /> Chapters
          </button>
          {!caught && !single && (
            <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={() => void share()} data-share>
              <Share2 className="size-4" aria-hidden /> Share
            </button>
          )}
        </div>
        {shared && (
          <p className="mt-3 text-sm" role="status">
            {shared}
          </p>
        )}
      </div>
    </div>
  );
}
