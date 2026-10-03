"use client";

// The level select (Plan/06-trapsprint.md §8.2): a grid per zone with medals, best times, deaths
// and coins. Levels open one after another; a zone's speedrun opens when all ten are cleared.
import { ArrowLeft, CircleHelp, Settings2, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { levelTitle } from "../core/level";
import { formatClock, formatTime, MEDAL_NAMES, medalTimes } from "../core/medals";
import { isCleared, medalCount } from "../core/progress";
import { getLevel, isUnlocked, levelLabel, ZONES, type ZoneId } from "../levels";
import type { TrapSprintSave } from "../save";
import styles from "../trapsprint.module.css";
import { CoinIcon, LockIcon, MedalIcon, SkullIcon } from "./icons";

export function LevelSelect({
  save,
  zone,
  onZone,
  onPlay,
  onZoneRun,
  onBack,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: TrapSprintSave;
  zone: ZoneId;
  onZone: (zone: ZoneId) => void;
  onPlay: (levelId: string) => void;
  onZoneRun: (zone: ZoneId) => void;
  onBack: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const cleared = (id: string) => isCleared(save, id);
  const current = ZONES.find((z) => z.id === zone) ?? ZONES[0]!;
  const zoneOpen = (z: (typeof ZONES)[number]) => isUnlocked(z.levels[0]!, cleared);
  const nextUp = ZONES.flatMap((z) => z.levels).find((id) => isUnlocked(id, cleared) && !cleared(id));
  const allCleared = current.levels.every(cleared);
  const run = save.zoneRuns[String(current.id)];

  return (
    <section className={cn(styles.sky, "min-h-[calc(100dvh-4rem)] px-4 pb-16 pt-8 sm:px-6")}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onBack} className="btn btn-secondary btn-sm" data-sound="click">
            <ArrowLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 className={cn(styles.pixel, "mr-auto text-lg text-[#23153C] sm:text-2xl")}>Levels</h1>
          <button type="button" onClick={onHelp} className="btn btn-ghost btn-sm" data-sound="click" aria-label="How to play">
            <CircleHelp className="size-4" aria-hidden />
            <span className="max-sm:hidden">How to play</span>
          </button>
          <button type="button" onClick={onTrophies} className="btn btn-ghost btn-sm" data-sound="click" aria-label="Trophies">
            <Trophy className="size-4" aria-hidden />
            <span className="max-sm:hidden">Trophies</span>
          </button>
          <button type="button" onClick={onOptions} className="btn btn-ghost btn-sm" data-sound="click" aria-label="Options">
            <Settings2 className="size-4" aria-hidden />
            <span className="max-sm:hidden">Options</span>
          </button>
        </div>

        <div role="tablist" aria-label="Zones" className="mt-6 flex flex-wrap gap-3">
          {ZONES.map((z) => {
            const open = zoneOpen(z);
            const selected = z.id === current.id;
            return (
              <button
                key={z.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onZone(z.id)}
                className={cn(
                  styles.pixel,
                  "flex items-center gap-2 px-3 py-2.5 text-[0.6rem] sm:text-xs",
                  selected ? "bg-[#23153C] text-white" : "bg-white/80 text-[#23153C] hover:bg-white",
                  !open && "opacity-70",
                )}
                data-sound="click"
              >
                {!open && <LockIcon size={12} />}
                {z.id === "R" ? "Remix" : `${z.id} ${z.name}`}
                <span className={cn("font-mono text-[0.7rem]", selected ? "text-[#FFCD75]" : "text-[#675E78]")}>
                  {medalCount(save, z.levels)}/{z.levels.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={cn(styles.pixel, "flex items-center gap-3 text-base text-[#23153C] sm:text-xl")}>
              {current.id === "R" ? "Remix" : current.name}
              {current.id === "R" && <span className={styles.stamp}>REMIX</span>}
            </h2>
            <p className="mt-2 max-w-xl text-sm font-semibold text-[#40446B]">{current.blurb}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onZoneRun(current.id)}
            disabled={!allCleared}
            title={allCleared ? undefined : "Clear all ten levels first"}
            data-sound="click"
          >
            <Timer className="size-4" aria-hidden /> Zone speedrun
            {run?.best != null && <span className="font-mono text-xs opacity-90">best {formatClock(run.best)}</span>}
          </button>
        </div>
        {!allCleared && <p className="mt-2 text-xs font-semibold text-[#40446B]">The zone speedrun opens when all ten levels are cleared.</p>}
        {!zoneOpen(current) && (
          <p className={cn(styles.pixel, "mt-4 bg-white/70 px-3 py-2 text-[0.6rem] leading-relaxed text-[#23153C]")}>
            {current.id === "R" ? "Clear 3-10 to open Remix: every level mirrored, with meaner traps." : "Clear the zone before to get in."}
          </p>
        )}

        <ol className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {current.levels.map((id) => {
            const level = getLevel(id);
            const record = save.levels[id];
            const open = isUnlocked(id, cleared);
            const done = (record?.clears ?? 0) > 0;
            const times = medalTimes(id);
            const medal = record?.medal ?? null;
            const label = `${levelLabel(id)} ${levelTitle(level)}. ${
              open ? (done ? `Best ${record?.best != null ? formatTime(record.best) : "none"}${medal ? `, ${MEDAL_NAMES[medal]} medal` : ""}.` : "Not cleared yet.") : "Locked."
            } ${record?.deaths ? `${record.deaths} deaths.` : ""}`;
            return (
              <li key={id}>
                <button
                  type="button"
                  className={cn(styles.tile, "w-full", open && id === nextUp && styles.next)}
                  disabled={!open}
                  onClick={() => onPlay(id)}
                  aria-label={label}
                  title={open ? `Gold ${formatTime(times.gold)} · Silver ${formatTime(times.silver)} · Bronze ${formatTime(times.bronze)}` : undefined}
                  data-sound="click"
                  data-level={id}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn(styles.pixel, "text-xs sm:text-sm")}>{levelLabel(id)}</span>
                    {open ? done && <MedalIcon medal={medal} size={22} /> : <LockIcon size={16} />}
                  </span>
                  <span className={cn(styles.pixel, "min-h-[2.4em] text-[0.55rem] leading-relaxed sm:text-[0.6rem]")}>{open ? levelTitle(level) : "???"}</span>
                  <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 font-mono text-xs font-bold">
                    <span className="tabular-nums">{record?.best != null ? formatTime(record.best) : done ? "cleared" : "—"}</span>
                    {record?.deaths ? (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <SkullIcon size={12} /> {record.deaths}
                      </span>
                    ) : null}
                  </span>
                  {level.coins.length > 0 && open && (
                    <span className="flex gap-1">
                      {level.coins.map((_, i) => (
                        <CoinIcon key={i} size={10} got={Boolean((record?.coins ?? 0) & (1 << i))} />
                      ))}
                    </span>
                  )}
                  {record?.assisted && <span className="font-mono text-[0.6rem] font-bold uppercase text-[#675E78]">assist</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
