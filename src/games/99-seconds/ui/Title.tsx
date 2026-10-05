"use client";

// The title (Plan/03-99-seconds.md §8.1): a clock counting down from 99. Wait until zero and "Press Start" changes to
// "You've been here before." (After the credits, it always says that.)
import { BookOpen, ListOrdered, Settings2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SevenSeg, pad2 } from "../art/kit";
import styles from "../ninety.module.css";
import { storyChapter } from "../progress";
import { CHAPTER_DEFS } from "../rooms";
import type { NinetySave } from "../save";

export interface TitleProps {
  save: NinetySave;
  onStart(): void;
  onChapters(): void;
  onHelp(): void;
  onTrophies(): void;
  onOptions(): void;
}

export function TitleScreen({ save, onStart, onChapters, onHelp, onTrophies, onOptions }: TitleProps) {
  const [left, setLeft] = useState(99);
  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  const been = left <= 0 || save.credits;
  const next = storyChapter(save);
  const started = save.totalLoops > 0;
  return (
    <div className={cn(styles.root, styles.title)} data-title-screen data-left={left}>
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className={styles.bigClock} aria-label={`${left} seconds`} role="timer" data-title-clock>
          <svg viewBox="0 0 176 120" aria-hidden>
            <SevenSeg x={10} y={10} h={100} value={pad2(left)} />
          </svg>
        </div>
        <h1 className={cn(styles.display, "mt-8 text-6xl sm:text-7xl")}>99 Seconds</h1>
        <p className="mt-3 text-[var(--n9-dim)]">You have 99 seconds. You&apos;ve had them before.</p>
        <div className="mt-8 grid w-full max-w-sm gap-2.5">
          <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 text-lg")} onClick={onStart} data-play data-been={been ? "" : undefined}>
            {been ? "You've been here before." : started && next ? `Continue: ${CHAPTER_DEFS[next].title}` : "Press Start"}
          </button>
          <button type="button" className={styles.btn} onClick={onChapters} data-chapters>
            <ListOrdered className="size-4" aria-hidden /> Chapters
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className={cn(styles.btn, "whitespace-nowrap !px-2 text-sm")} onClick={onHelp} data-open="help">
              <BookOpen className="size-4" aria-hidden />
              <span className="max-[380px]:sr-only">How to play</span>
            </button>
            <button type="button" className={cn(styles.btn, "!px-2 text-sm")} onClick={onTrophies} data-open="trophies">
              <Trophy className="size-4" aria-hidden />
              <span className="max-[380px]:sr-only">Trophies</span>
            </button>
            <button type="button" className={cn(styles.btn, "!px-2 text-sm")} onClick={onOptions} data-open="options">
              <Settings2 className="size-4" aria-hidden />
              <span className="max-[380px]:sr-only">Options</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
