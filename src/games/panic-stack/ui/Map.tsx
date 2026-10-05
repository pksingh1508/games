"use client";

// The location map (Plan/11-panic-stack.md §8.2): six locations with their star counts, and each one's six
// levels. Levels open one by one; Zen mode (no clock, no events, no fail) can be switched on here.
import { ChevronLeft, Lock } from "lucide-react";
import { useState } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { cn } from "@/lib/cn";
import type { LocationId } from "../core/level";
import { LOCATIONS } from "../levels";
import styles from "../panic-stack.module.css";
import { countStars, isCleared, isOpen } from "../progress";
import { PALETTES } from "../render/scenery";
import { panicStackSave, type PanicStackSave } from "../save";
import { clock, Stars } from "./Play";

export function MapScreen({ save, location: first, current, onPlay, onBack }: { save: PanicStackSave; location: LocationId; current: string; onPlay(id: string): void; onBack(): void }) {
  const [open, setOpen] = useState<LocationId>(first);
  const info = LOCATIONS.find((l) => l.id === open)!;
  return (
    <section className={cn(styles.root, "min-h-[calc(100dvh-4rem)] bg-[#FFF1E0] px-3 py-4 sm:px-6")} aria-labelledby="ps-map-title" data-map-screen>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={cn(styles.btn, "!px-2.5 !py-1 text-sm")} onClick={onBack}>
            <ChevronLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 id="ps-map-title" className={cn(styles.display, "text-[1.9rem]")}>
            Where to?
          </h1>
          <label className="ml-auto flex items-center gap-2 text-sm font-bold" htmlFor="ps-map-zen">
            Zen mode
            <ToggleSwitch id="ps-map-zen" label="Zen mode" checked={save.prefs.zen} onCheckedChange={(zen) => panicStackSave.update((s) => ({ ...s, prefs: { ...s.prefs, zen } }))} />
          </label>
        </div>
        {save.prefs.zen && <p className="mt-1 text-sm font-bold">Zen: no clock, no panic events, nothing to lose. Just stacking.</p>}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LOCATIONS.map((l) => {
            const unlocked = isOpen(save, l.levels[0]!.id);
            const got = l.levels.reduce((n, v) => n + countStars(save.levels[v.id]?.stars ?? 0), 0);
            const p = PALETTES[l.id];
            return (
              <button key={l.id} type="button" className={styles.location} aria-pressed={open === l.id} disabled={!unlocked} onClick={() => setOpen(l.id)} data-location={l.id}>
                <span className={styles.swatch} style={{ background: `linear-gradient(180deg, ${p.wall2}, ${p.wall} 60%, ${p.floor} 60%)` }} aria-hidden />
                <span className="flex items-center gap-1.5 font-black">
                  {!unlocked && <Lock className="size-4" aria-hidden />}
                  {l.number}. {l.name}
                </span>
                <span className="text-sm font-bold opacity-75">★ {got} / 18</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 font-bold opacity-80">{info.about}</p>
        <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {info.levels.map((v) => {
            const unlocked = isOpen(save, v.id);
            const record = save.levels[v.id];
            return (
              <li key={v.id}>
                <button type="button" className={cn(styles.tile, "w-full")} disabled={!unlocked} onClick={() => onPlay(v.id)} aria-current={current === v.id ? "true" : undefined} data-level-tile={v.id}>
                  <span className="flex items-center gap-1.5 text-sm font-black">
                    {!unlocked && <Lock className="size-3.5" aria-hidden />}
                    {v.id} · {v.name}
                  </span>
                  <span className="text-xs font-bold opacity-70">
                    Goal {v.goal.toFixed(1)} m · {clock(v.time)}
                  </span>
                  <span className="flex items-center justify-between gap-1 text-xs font-bold">
                    <Stars bits={record?.stars ?? 0} small />
                    <span className="tabular-nums opacity-70">{record?.best != null ? clock(record.best / 60) : isCleared(save, v.id) ? "Zen" : ""}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
