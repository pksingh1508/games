"use client";

// Level select (Plan/10-last-pixel.md §8.2): the levels as small pictures, finished if you've done them,
// as they start if you haven't, and greyed out (locked) until the one before is done.
import { ChevronLeft, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { LevelDef, Scene } from "../core/level";
import { countStars, isCleared, isOpen } from "../core/progress";
import styles from "../last-pixel.module.css";
import { BONUS_LEVEL, levelLabel, WORLDS, type WorldInfo } from "../levels";
import type { LastPixelSave } from "../save";
import { clock } from "./Hud";
import { Stars } from "./Play";

const scenes = new Map<string, Scene>();
const sceneOf = (level: LevelDef) => {
  let s = scenes.get(level.id);
  if (!s) {
    s = level.scene();
    scenes.set(level.id, s);
  }
  return s;
};

function Thumb({ level, done }: { level: LevelDef; done: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const s = sceneOf(level);
    c.width = s.w;
    c.height = s.h;
    const g = c.getContext("2d")!;
    const img = g.createImageData(s.w, s.h);
    new Uint32Array(img.data.buffer).set((done ? s.after : s.before).data);
    g.putImageData(img, 0, 0);
  }, [level, done]);
  return <canvas ref={ref} className={styles.thumb} aria-hidden />;
}

export function LevelSelect({ save, world: first, current, onPlay, onBack }: { save: LastPixelSave; world: WorldInfo["id"]; current: string; onPlay(id: string): void; onBack(): void }) {
  const [world, setWorld] = useState(first);
  const info = WORLDS.find((w) => w.id === world)!;
  return (
    <section className={cn(styles.root, "min-h-[calc(100dvh-4rem)] bg-[#FDF6EC] px-3 py-4 sm:px-6")} aria-labelledby="lp-levels-title">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={cn(styles.button, "!px-2.5 !py-1 text-sm")} onClick={onBack}>
            <ChevronLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 id="lp-levels-title" className="text-[1.8rem] font-extrabold">
            Levels
          </h1>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Worlds">
          {WORLDS.map((w) => {
            const open = isOpen(save, w.levels[0]!.id);
            return (
              <button key={w.id} type="button" role="tab" aria-selected={w.id === world} className={cn(styles.button, "!py-1.5 text-[0.95rem]", w.id === world && styles.primary)} onClick={() => setWorld(w.id)} disabled={!open} data-world={w.id}>
                {!open && <Lock className="size-3.5" aria-hidden />}
                {w.id === 5 ? "★" : w.id}. {w.name}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-bold opacity-75">{info.about}</p>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {info.levels.map((l) => {
            const open = isOpen(save, l.id);
            const record = save.levels[l.id];
            const done = isCleared(save, l.id);
            return (
              <li key={l.id}>
                <button type="button" className={cn(styles.levelCard, "w-full")} disabled={!open} onClick={() => onPlay(l.id)} aria-current={current === l.id ? "true" : undefined} data-level-card={l.id}>
                  {open ? <Thumb level={l} done={done} /> : <span className={cn(styles.thumb, "grid place-items-center bg-[#ECE6F9]")}><Lock className="size-6 opacity-50" aria-hidden /></span>}
                  <span className="flex items-center justify-between gap-1 text-sm font-extrabold">
                    <span className="truncate">
                      {levelLabel(l.id)} {l.name}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-1 text-xs font-bold">
                    <Stars bits={record?.stars ?? 0} label={`${countStars(record?.stars ?? 0)} of 3 stars`} />
                    <span className="tabular-nums opacity-70">{record?.bestClean != null ? clock(record.bestClean) : l.id === BONUS_LEVEL ? "bonus" : ""}</span>
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
