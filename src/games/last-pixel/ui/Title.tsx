"use client";

// The title (Plan/10-last-pixel.md §8.1): "Last Pıxel", the dot on its "i" missing. Pix has it.
import { CircleHelp, LayoutGrid, Play, Settings2, Trophy } from "lucide-react";
import { GameCover } from "@/games/covers";
import { cn } from "@/lib/cn";
import { LEVEL_IDS } from "../levels";
import { starTotals } from "../core/progress";
import styles from "../last-pixel.module.css";
import type { LastPixelSave } from "../save";
import { Logo } from "./Logo";

export function TitleScreen({
  save,
  resume,
  onPlay,
  onLevels,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: LastPixelSave;
  /** There's a level in progress (or done): Continue rather than Play. */
  resume: boolean;
  onPlay(): void;
  onLevels(): void;
  onHelp(): void;
  onTrophies(): void;
  onOptions(): void;
}) {
  const done = LEVEL_IDS.filter((id) => (save.levels[id]?.clears ?? 0) > 0).length;
  const stars = starTotals(save);
  return (
    <section className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center bg-[#FDF6EC] px-4 py-8")} aria-labelledby="lp-title">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <h1 id="lp-title" className="text-[clamp(3.2rem,12vw,6.5rem)]">
          <Logo complete={save.finished} />
        </h1>
        <p className="mt-2 text-[clamp(1.05rem,2.6vw,1.35rem)] font-bold opacity-80">
          {save.finished ? "100%. Every last pixel, in its place." : "99.99% complete. The last pixel disagrees."}
        </p>
        <div className={cn("relative mt-5 w-full max-w-md overflow-hidden rounded-[1.6rem] border-[3px] border-[#3B3355] shadow-[0_6px_0_#3B3355]", styles.float)}>
          <GameCover slug="last-pixel" uid="lp-title" className="block h-auto w-full" />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button type="button" className={cn(styles.button, styles.primary, "!px-6 !py-2.5 text-lg")} onClick={onPlay} autoFocus data-play>
            <Play className="size-5" aria-hidden /> {resume ? "Continue" : "Play"}
          </button>
          <button type="button" className={styles.button} onClick={onLevels} data-open-levels>
            <LayoutGrid className="size-4" aria-hidden /> Levels
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
          {done} of {LEVEL_IDS.length} canvases at 100% · {stars.got} of {stars.of} stars
        </p>
      </div>
    </section>
  );
}
