"use client";

// The world map (Plan/15-gravity-is-lying.md §8.2): Isaac's tower, each storey a world, each built
// a different way up (sideways, upside down, sideways again), with his tree on top. Pick a storey,
// then a room. Rooms open one after another.
import { ArrowLeft, CircleHelp, Settings2, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTime, isCleared, isUnlocked, worldStats } from "../core/progress";
import type { WorldId } from "../core/room";
import styles from "../gravity-is-lying.module.css";
import { getRoom, roomLabel, WORLDS } from "../rooms";
import type { GravitySave } from "../save";
import { AppleIcon, HouseIcon, LockIcon, PlanetIcon, SkullIcon, TreeIcon } from "./icons";

const STOREY_CLASS: Record<WorldId, string> = { 1: styles.w1!, 2: styles.w2!, 3: styles.w3!, 4: styles.w4!, 5: styles.w5!, 6: styles.w6! };

const emblem = (id: WorldId) => (id === 5 ? <PlanetIcon /> : id === 6 ? <TreeIcon /> : <HouseIcon />);

export function WorldMap({
  save,
  world,
  onWorld,
  onPlay,
  onBack,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: GravitySave;
  world: WorldId;
  onWorld: (world: WorldId) => void;
  onPlay: (roomId: string) => void;
  onBack: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const current = WORLDS.find((w) => w.id === world) ?? WORLDS[0]!;
  const open = (w: (typeof WORLDS)[number]) => isUnlocked(save, w.rooms[0]!);
  const nextUp = WORLDS.flatMap((w) => w.rooms).find((id) => isUnlocked(save, id) && !isCleared(save, id));
  const stats = worldStats(save, current.id);
  // The tree on top, the lab at the bottom.
  const storeys = [...WORLDS].reverse();

  return (
    <section className={cn(styles.lab, "min-h-[calc(100dvh-4rem)] px-4 pb-16 pt-8 sm:px-6")}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onBack} className="btn btn-secondary btn-sm" data-sound="click">
            <ArrowLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 className={cn(styles.display, "mr-auto text-2xl sm:text-3xl")}>Isaac&apos;s tower</h1>
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
          <div className={styles.tower} role="tablist" aria-label="Worlds" aria-orientation="vertical">
            {storeys.map((w) => {
              const isOpen = open(w);
              const s = worldStats(save, w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  role="tab"
                  aria-selected={w.id === current.id}
                  aria-controls="gil-world"
                  disabled={!isOpen}
                  onClick={() => onWorld(w.id)}
                  className={cn(styles.storey, STOREY_CLASS[w.id])}
                  data-world={w.id}
                  data-sound="click"
                >
                  <span className={styles.emblem}>{emblem(w.id)}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn(styles.display, "block truncate text-base leading-tight sm:text-lg")}>{w.name}</span>
                    <span className="block text-xs font-semibold opacity-80">{w.id === 6 ? "The top" : `World ${w.id}`}</span>
                  </span>
                  {isOpen ? (
                    <span className="text-right font-mono text-xs font-bold leading-tight">
                      {s.cleared}/{s.rooms}
                      <span className="flex items-center justify-end gap-0.5">
                        <AppleIcon size={11} /> {s.apples}
                      </span>
                    </span>
                  ) : (
                    <LockIcon size={16} />
                  )}
                </button>
              );
            })}
          </div>

          <div id="gil-world" role="tabpanel" aria-label={current.name}>
            <h2 className={cn(styles.display, "text-2xl sm:text-3xl")}>
              {current.id === 6 ? "★" : current.id} · {current.name}
            </h2>
            <p className="mt-2 max-w-2xl font-semibold text-[#4B6267]">{current.blurb}</p>

            {open(current) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold">
                <span>
                  {stats.cleared}/{stats.rooms} cleared
                </span>
                <span className="inline-flex items-center gap-1">
                  <AppleIcon size={14} /> {stats.apples}/{stats.rooms * 3}
                </span>
                <span className="inline-flex items-center gap-1">
                  <SkullIcon size={12} /> {stats.deaths}
                </span>
                {stats.best !== null && <span className="font-mono">best total {formatTime(stats.best)}</span>}
              </div>
            )}
            {!open(current) && <p className={cn(styles.panel, "mt-4 inline-block px-3 py-2 text-sm font-bold")}>Clear the storey below to get up here.</p>}

            <ol className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {current.rooms.map((id) => {
                const room = getRoom(id);
                const record = save.rooms[id];
                const isOpen = isUnlocked(save, id);
                const done = (record?.clears ?? 0) > 0;
                const label = `${roomLabel(id)} ${room.name}. ${
                  isOpen ? (done ? `Cleared. ${[0, 1, 2].filter((i) => (record!.apples & (1 << i)) !== 0).length} of 3 golden apples.` : "Not cleared yet.") : "Locked."
                }`;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={cn(styles.room, "w-full", isOpen && id === nextUp && styles.next)}
                      disabled={!isOpen}
                      onClick={() => onPlay(id)}
                      aria-label={label}
                      data-room-tile={id}
                      data-sound="click"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn(styles.display, "text-base")}>{roomLabel(id)}</span>
                        {!isOpen && <LockIcon size={14} />}
                      </span>
                      <span className="min-h-[2.4em] text-sm font-bold leading-tight">{isOpen ? room.name : "???"}</span>
                      {isOpen && (
                        <span className="mt-auto flex items-center gap-1" aria-hidden>
                          {[0, 1, 2].map((i) => (
                            <AppleIcon key={i} size={15} got={((record?.apples ?? 0) & (1 << i)) !== 0} />
                          ))}
                        </span>
                      )}
                      <span className="flex flex-wrap items-center justify-between gap-x-2 font-mono text-xs font-bold">
                        <span className="tabular-nums">{record?.best != null ? formatTime(record.best) : done ? "cleared" : isOpen ? "new" : "—"}</span>
                        {record?.deaths ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <SkullIcon size={10} /> {record.deaths}
                          </span>
                        ) : null}
                      </span>
                      {record?.assisted && <span className="font-mono text-[0.6rem] font-bold uppercase text-[#4B6267]">assist</span>}
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
