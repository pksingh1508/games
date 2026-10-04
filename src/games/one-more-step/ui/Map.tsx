"use client";

// The world map (Plan/01-one-more-step.md §8.2): each world's levels joined by a trail of footprints, with
// their stars. Levels open one after another.
import { ChevronLeft, Footprints, Lock } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { countStars, isCleared, isOpen } from "../progress";
import { stepsOf, WORLDS } from "../levels";
import styles from "../one-more-step.module.css";
import type { OmsSave } from "../save";
import { Stars } from "./Play";

export function WorldMap({ save, current, onPlay, onBack }: { save: OmsSave; current: string; onPlay(id: string): void; onBack(): void }) {
  return (
    <section className={cn(styles.root, "min-h-[calc(100dvh-4rem)] bg-[#E8F6EF] px-3 py-4 sm:px-6")} aria-labelledby="om-map">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <button type="button" className={cn(styles.button, "!min-h-0 !px-3 !py-1 text-sm")} onClick={onBack}>
            <ChevronLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 id="om-map" className="text-3xl font-bold">
            The map
          </h1>
        </div>
        <ol className="mt-4 grid gap-5">
          {WORLDS.map((w) => {
            const open = isOpen(save, w.levels[0]!.id);
            const got = w.levels.reduce((n, l) => n + countStars(save.levels[l.id]?.stars ?? 0), 0);
            return (
              <li key={w.id} className={cn("rounded-[1.6rem] border-[3px] border-[#1F3A33] bg-white p-4 shadow-[0_5px_0_#1F3A33]", !open && "opacity-60")} data-world={w.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-bold">
                    {w.id === 6 ? "★" : `World ${w.id}`} · {w.name}
                  </h2>
                  <span className="text-sm font-bold opacity-70">
                    {open ? `${got} of ${w.levels.length * 3} stars` : "Locked"} · {w.feel}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {w.levels.map((l, k) => {
                    const usable = isOpen(save, l.id);
                    const rec = save.levels[l.id];
                    return (
                      <Fragment key={l.id}>
                        {k > 0 && (
                          <span className={styles.prints} aria-hidden>
                            <Footprints className="size-4 rotate-90" />
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.node}
                          disabled={!usable}
                          onClick={() => onPlay(l.id)}
                          aria-current={current === l.id ? "true" : undefined}
                          aria-label={`${l.id} ${l.name}${rec ? `, ${countStars(rec.stars)} stars, best ${rec.best} steps` : ""}${usable ? "" : ", locked"}`}
                          title={`${l.id} ${l.name} (par ${stepsOf(l.id).par})`}
                          data-node={l.id}
                        >
                          {usable ? <span className="text-lg leading-none">{w.id === 6 ? "★" : l.id.slice(2)}</span> : <Lock className="size-5 opacity-60" aria-hidden />}
                          {usable && isCleared(save, l.id) && (
                            <span className="absolute -bottom-3 scale-[0.45]">
                              <Stars bits={rec?.stars ?? 0} />
                            </span>
                          )}
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
