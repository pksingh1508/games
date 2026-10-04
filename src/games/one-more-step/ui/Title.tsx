"use client";

// The title (Plan/01-one-more-step.md §8.1): the first time you go for "Start", it hops one tile away (a
// gentle troll, only ever once). Go for it again and off you go. It has a row to itself, so it lands on
// nothing.
import { CircleHelp, Map as MapIcon, Play, Settings2, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import { GameCover } from "@/games/covers";
import { cn } from "@/lib/cn";
import { LEVEL_IDS } from "../levels";
import styles from "../one-more-step.module.css";
import { starTotals } from "../progress";
import { omsSave, type OmsSave } from "../save";

export function TitleScreen({ save, resume, onPlay, onMap, onHelp, onTrophies, onOptions }: { save: OmsSave; resume: boolean; onPlay(): void; onMap(): void; onHelp(): void; onTrophies(): void; onOptions(): void }) {
  // It hops its own width sideways (to whichever side has more room, as far as the screen allows), once ever.
  const start = useRef<HTMLButtonElement | null>(null);
  const [hop, setHop] = useState(0);
  const flee = () => {
    if (omsSave.get().hopped) return;
    omsSave.update((s) => ({ ...s, hopped: true }));
    const r = start.current?.getBoundingClientRect();
    if (!r) return;
    const want = r.width + 12;
    const right = window.innerWidth - 12 - r.right;
    const left = r.left - 12;
    setHop(right >= left ? Math.min(want, right) : -Math.min(want, left));
  };
  const done = LEVEL_IDS.filter((id) => (save.levels[id]?.clears ?? 0) > 0).length;
  const stars = starTotals(save);
  return (
    <section className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center bg-[#E8F6EF] px-4 py-8")} aria-labelledby="om-title">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <h1 id="om-title" className="text-[clamp(2.8rem,10vw,5.5rem)] font-bold leading-none">
          One More Step
        </h1>
        <p className="mt-2 text-[clamp(1.05rem,2.6vw,1.35rem)] font-semibold opacity-80">The exit is one step away. It always is.</p>
        <div className="mt-5 w-full max-w-md overflow-hidden rounded-[1.6rem] border-[3px] border-[#1F3A33] shadow-[0_6px_0_#1F3A33]">
          <GameCover slug="one-more-step" uid="om-title" className="block h-auto w-full" />
        </div>
        <div className="mt-6 flex w-full justify-center">
          <button
            ref={start}
            type="button"
            className={cn(styles.button, styles.primary, styles.hop, "!px-8 text-lg")}
            style={{ translate: hop ? `${hop}px 0` : undefined }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") flee();
            }}
            onClick={() => {
              if (!omsSave.get().hopped) {
                // A tap (no hover): the hop happens on the first tap instead.
                flee();
                return;
              }
              onPlay();
            }}
            autoFocus
            data-play
          >
            <Play className="size-5" aria-hidden /> {resume ? "Continue" : "Start"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2.5">
          <button type="button" className={styles.button} onClick={onMap} data-open-map>
            <MapIcon className="size-4" aria-hidden /> Map
          </button>
          <button type="button" className={styles.button} onClick={onHelp}>
            <CircleHelp className="size-4" aria-hidden /> How to play
          </button>
          <button type="button" className={styles.button} onClick={onTrophies}>
            <Trophy className="size-4" aria-hidden /> Trophies
          </button>
          <button type="button" className={styles.button} onClick={onOptions}>
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
        </div>
        <p className="mt-4 text-sm font-bold opacity-70" data-totals>
          {done} of {LEVEL_IDS.length} levels · {stars.got} of {stars.of} stars · {save.stats.steps.toLocaleString("en-US")} steps
        </p>
      </div>
    </section>
  );
}
