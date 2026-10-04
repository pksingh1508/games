"use client";

// The world map (Plan/05-fake-floor.md §8.2): a cross-section of a building, each storey a world
// (of course), and The Floor in the foundations. Pick a storey, then a room. Rooms open one after
// another; a world's time trial opens when all ten are cleared.
import { ArrowLeft, CircleHelp, Settings2, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatClock, formatTime, MEDAL_IDS, MEDALS, parTicks } from "../core/medals";
import { isCleared, medalCount, worldStats } from "../core/progress";
import styles from "../fake-floor.module.css";
import { getRoom, isUnlocked, roomLabel, WORLDS, type WorldId } from "../rooms";
import type { FakeFloorSave } from "../save";
import { FallIcon, LockIcon, MedalIcon, PebbleIcon } from "./icons";

const STOREY_CLASS: Record<WorldId, string> = { 1: styles.w1!, 2: styles.w2!, 3: styles.w3!, 4: styles.w4!, 5: styles.w5!, 6: styles.w6! };
const FLOOR_NAMES: Record<WorldId, string> = { 1: "Ground floor", 2: "1st floor", 3: "2nd floor", 4: "3rd floor", 5: "Top floor", 6: "The foundations" };

export function WorldMap({
  save,
  world,
  onWorld,
  onPlay,
  onTrial,
  onBack,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: FakeFloorSave;
  world: WorldId;
  onWorld: (world: WorldId) => void;
  onPlay: (roomId: string) => void;
  onTrial: (world: WorldId) => void;
  onBack: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const cleared = (id: string) => isCleared(save, id);
  const current = WORLDS.find((w) => w.id === world) ?? WORLDS[0]!;
  const open = (w: (typeof WORLDS)[number]) => isUnlocked(w.rooms[0]!, cleared);
  const nextUp = WORLDS.flatMap((w) => w.rooms).find((id) => isUnlocked(id, cleared) && !cleared(id));
  const stats = worldStats(save, current.id);
  const trial = save.trials[String(current.id)];
  const trialOpen = current.id <= 5 && current.rooms.every(cleared);
  const storeys = [...WORLDS.filter((w) => w.id <= 5)].reverse();
  const floor = WORLDS.find((w) => w.id === 6)!;

  const storeyButton = (w: (typeof WORLDS)[number], foundation = false) => {
    const isOpen = open(w);
    const selected = w.id === current.id;
    return (
      <button
        key={w.id}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-controls="ff-world"
        disabled={!isOpen}
        onClick={() => onWorld(w.id)}
        className={cn(styles.storey, STOREY_CLASS[w.id], foundation && styles.foundation)}
        data-world={w.id}
        data-sound="click"
      >
        <span className={cn(styles.pixel, "grid size-9 shrink-0 place-items-center bg-[#181425]/70 text-lg text-white")}>{w.id === 6 ? "★" : w.id}</span>
        <span className="min-w-0 flex-1">
          <span className={cn(styles.pixel, "block truncate text-base leading-tight sm:text-lg")}>{w.name}</span>
          <span className="block text-xs font-semibold opacity-85">{FLOOR_NAMES[w.id]}</span>
        </span>
        {isOpen ? (
          <span className="text-right font-mono text-xs font-bold leading-tight">
            {w.rooms.filter(cleared).length}/{w.rooms.length}
            <span className="block opacity-80">{medalCount(save, w.rooms)} medals</span>
          </span>
        ) : (
          <LockIcon size={16} />
        )}
      </button>
    );
  };

  return (
    <section className={cn(styles.showroom, "min-h-[calc(100dvh-4rem)] px-4 pb-16 pt-8 sm:px-6")}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onBack} className="btn btn-secondary btn-sm" data-sound="click">
            <ArrowLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 className={cn(styles.pixel, "mr-auto text-2xl sm:text-3xl")}>The building</h1>
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

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* The building: worlds stacked bottom to top, The Floor underneath. */}
          <div className={styles.building} role="tablist" aria-label="Worlds" aria-orientation="vertical">
            <div className={styles.roof} aria-hidden />
            {storeys.map((w) => storeyButton(w))}
            <div className={styles.ground} aria-hidden />
            {storeyButton(floor, true)}
          </div>

          <div id="ff-world" role="tabpanel" aria-label={current.name}>
            <h2 className={cn(styles.pixel, "text-2xl sm:text-3xl")}>
              {current.id === 6 ? "★" : current.id} · {current.name}
            </h2>
            <p className="mt-2 max-w-2xl font-semibold text-[#535C62]">{current.blurb}</p>
            {open(current) && current.id <= 5 && (
              <p className="mt-2 max-w-2xl text-sm">
                <strong>The tell:</strong> {current.tell}
              </p>
            )}

            {open(current) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
                <span>
                  {stats.cleared}/{current.rooms.length} cleared
                </span>
                <span>
                  {stats.medals}/{current.rooms.length * 3} medals
                </span>
                <span className="inline-flex items-center gap-1">
                  <FallIcon size={13} /> {stats.falls} falls
                </span>
                <span className="inline-flex items-center gap-1">
                  <PebbleIcon size={14} /> {stats.thrown} thrown
                </span>
                {current.id <= 5 && (
                  <button type="button" className="btn btn-sm ml-auto" onClick={() => onTrial(current.id)} disabled={!trialOpen} data-sound="click">
                    <Timer className="size-4" aria-hidden /> Time trial
                    {trial?.best != null && <span className="font-mono text-xs opacity-90">best {formatClock(trial.best)}</span>}
                  </button>
                )}
              </div>
            )}
            {open(current) && current.id <= 5 && !trialOpen && <p className="mt-1 text-xs font-semibold text-[#535C62]">The time trial (all ten rooms, one clock) opens when every room is cleared.</p>}
            {!open(current) && (
              <p className={cn(styles.pixel, "mt-4 bg-white/70 px-3 py-2 text-sm")}>
                {current.id === 6 ? "Clear the Painting's last room to go down to The Floor." : "Clear the storey below to get up here."}
              </p>
            )}

            <ol className={cn("mt-6 grid gap-5", current.rooms.length > 1 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5" : "max-w-xs grid-cols-1")}>
              {current.rooms.map((id) => {
                const room = getRoom(id);
                const record = save.rooms[id];
                const isOpen = isUnlocked(id, cleared);
                const done = (record?.clears ?? 0) > 0;
                const par = parTicks(id);
                const hidden = room.pickups.some((p) => p.hidden);
                const label = `${roomLabel(id)} ${room.name}. ${
                  isOpen
                    ? done
                      ? `Cleared. ${MEDAL_IDS.filter((m) => record?.[m])
                          .map((m) => MEDALS[m].name)
                          .join(", ") || "No medals yet"}. Par ${formatTime(par)}.`
                      : `Not cleared yet. Par ${formatTime(par)}.`
                    : "Locked."
                }`;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={cn(styles.room, "w-full", isOpen && id === nextUp && styles.next)}
                      disabled={!isOpen}
                      onClick={() => onPlay(id)}
                      aria-label={label}
                      title={isOpen ? `Par ${formatTime(par)}` : undefined}
                      data-room-tile={id}
                      data-sound="click"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn(styles.pixel, "text-base")}>{roomLabel(id)}</span>
                        {!isOpen && <LockIcon size={14} />}
                        {isOpen && done && hidden && (
                          <span title={record?.hidden ? "Hidden pebble found" : "A hidden pebble is somewhere in here"}>
                            <PebbleIcon size={14} filled={Boolean(record?.hidden)} />
                          </span>
                        )}
                      </span>
                      <span className={cn(styles.pixel, "min-h-[2.4em] text-sm leading-tight")}>{isOpen ? room.name : "???"}</span>
                      {isOpen && (
                        <span className="mt-auto flex items-center gap-1.5" aria-hidden>
                          {MEDAL_IDS.map((m) => (
                            <MedalIcon key={m} medal={m} got={Boolean(record?.[m])} size={15} />
                          ))}
                        </span>
                      )}
                      <span className="flex flex-wrap items-center justify-between gap-x-2 font-mono text-xs font-bold">
                        <span className="tabular-nums">{record?.best != null ? formatTime(record.best) : done ? "cleared" : isOpen ? `par ${formatTime(par)}` : "—"}</span>
                        {record?.falls ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <FallIcon size={11} /> {record.falls}
                          </span>
                        ) : null}
                      </span>
                      {record?.assisted && <span className="font-mono text-[0.6rem] font-bold uppercase text-[#5A636A]">assist</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
