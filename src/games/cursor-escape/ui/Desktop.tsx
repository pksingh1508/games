"use client";

// The desktop (level select, Plan/12-cursor-escape.md §8.2): drive icons on a retro desktop. Opening a
// drive shows its windows as files, with their medals and best times; the ones you can't open yet are
// greyed out. The taskbar's Start button goes back to the boot screen.
import { CircleHelp, Play, Settings2, Trophy } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { HZ } from "../core/constants";
import { isCleared, isOpen } from "../core/progress";
import styles from "../cursor-escape.module.css";
import { DRIVES, levelLabel, type DriveInfo } from "../levels";
import type { CursorSave } from "../save";

const clock = (ticks: number) => {
  const s = ticks / HZ;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

/** A drive's score (§7): its windows closed, their best times added up (once they all are), its crashes. */
function driveScore(save: CursorSave, d: DriveInfo) {
  const records = d.levels.map((l) => save.levels[l.id]);
  const closed = records.filter((r) => (r?.clears ?? 0) > 0).length;
  const done = closed === d.levels.length && records.every((r) => r?.best != null);
  return {
    closed,
    time: done ? records.reduce((n, r) => n + (r?.best ?? 0), 0) : null,
    crashes: records.reduce((n, r) => n + (r?.crashes ?? 0), 0),
  };
}

function DriveIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 32 24" className="h-9 w-12" aria-hidden>
      <rect x="1" y="5" width="30" height="16" fill={locked ? "#8A8A8A" : "#C3C3C3"} stroke="#111" strokeWidth="1.5" />
      <rect x="4" y="15" width="10" height="3" fill="#2EE65E" opacity={locked ? 0.3 : 1} />
      <rect x="20" y="9" width="8" height="2" fill="#555" />
    </svg>
  );
}

export function Desktop({
  save,
  drive,
  selected,
  onDrive,
  onSelect,
  onPlay,
  onBoot,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: CursorSave;
  drive: DriveInfo["id"] | null;
  selected: string;
  onDrive: (drive: DriveInfo["id"] | null) => void;
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
  onBoot: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const list = useRef<HTMLDivElement | null>(null);
  const open = DRIVES.find((d) => d.id === drive) ?? null;
  const driveOpen = (d: DriveInfo) => isOpen(save, d.levels[0]!.id);

  // The chosen file in view.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-file="${selected}"]`)?.focus({ preventScroll: false });
  }, [drive, selected]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!open || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault();
    const usable = open.levels.filter((l) => isOpen(save, l.id));
    const at = usable.findIndex((l) => l.id === selected);
    const next = usable[Math.max(0, Math.min(usable.length - 1, at + (event.key === "ArrowDown" ? 1 : -1)))];
    if (next) onSelect(next.id);
  };

  return (
    <section className={cn(styles.root, styles.desk, "relative flex min-h-[calc(100dvh-4rem)] flex-col")} aria-label="DeskOS 98 desktop">
      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-start">
        {/* The desktop's icons. */}
        <nav className="flex flex-row flex-wrap gap-2 sm:flex-col" aria-label="Drives">
          {DRIVES.map((d) => {
            const locked = !driveOpen(d);
            return (
              <button key={d.id} type="button" className={styles.icon} disabled={locked} aria-current={drive === d.id ? "true" : undefined} onClick={() => onDrive(d.id)} data-drive={d.id}>
                <DriveIcon locked={locked} />
                <span>
                  {d.id}:\ {d.name}
                </span>
              </button>
            );
          })}
          <button type="button" className={styles.icon} onClick={onHelp}>
            <CircleHelp className="size-9 text-white" aria-hidden />
            <span>Help.txt</span>
          </button>
          <button type="button" className={styles.icon} onClick={onTrophies}>
            <Trophy className="size-9 text-[#FFE14D]" aria-hidden />
            <span>Trophies</span>
          </button>
          <button type="button" className={styles.icon} onClick={onOptions}>
            <Settings2 className="size-9 text-white" aria-hidden />
            <span>Control Panel</span>
          </button>
        </nav>

        {/* An open drive: its windows, as files. */}
        {open && (
          <section className={cn(styles.raised, styles.window, "w-full max-w-[44rem]")} aria-labelledby="ce-drive-title">
            <div className={styles.titlebar}>
              <h2 id="ce-drive-title" className="flex-1 truncate">
                {open.id}:\ {open.name}
              </h2>
              <button type="button" className={styles.tiny} onClick={() => onDrive(null)} aria-label="Close the drive">
                ✕
              </button>
            </div>
            <p className="px-2 py-1 text-[1.05rem]">{open.about}</p>
            <div ref={list} className={cn(styles.sunken, "m-1 max-h-[55vh] overflow-y-auto p-1")} role="group" aria-label="Windows" onKeyDown={onKeyDown}>
              {open.levels.map((l) => {
                const usable = isOpen(save, l.id);
                const record = save.levels[l.id];
                return (
                  <button
                    key={l.id}
                    type="button"
                    className={styles.file}
                    disabled={!usable}
                    aria-current={selected === l.id ? "true" : undefined}
                    onClick={() => (selected === l.id ? onPlay(l.id) : onSelect(l.id))}
                    onDoubleClick={() => usable && onPlay(l.id)}
                    data-file={l.id}
                  >
                    <span aria-hidden>{usable ? (isCleared(save, l.id) ? "✔" : "▣") : "🔒"}</span>
                    <span className="truncate">
                      {levelLabel(l.id)} {l.name}
                    </span>
                    <span className="tabular-nums">{record?.best != null ? clock(record.best) : ""}</span>
                    <span className={styles.medal} data-medal={record?.medal ?? "none"} style={{ width: "1.4em", height: "1.4em", fontSize: "0.8em" }} aria-label={record?.medal ? `${record.medal} medal` : "No medal"}>
                      {record?.medal ? record.medal[0]!.toUpperCase() : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            {selected && open.levels.some((l) => l.id === selected) && (
              <div className="flex flex-wrap items-center gap-3 px-2 pb-1 pt-2">
                <p className="min-w-0 flex-1 text-[1.05rem]">{open.levels.find((l) => l.id === selected)!.hint}</p>
                <button type="button" className={styles.button} onClick={() => onPlay(selected)} data-open>
                  <Play className="size-4" aria-hidden /> Open
                </button>
              </div>
            )}
            {(() => {
              const score = driveScore(save, open);
              return (
                <p className={cn(styles.sunken, "m-1 flex flex-wrap gap-x-5 px-2 py-0.5 text-[1rem] tabular-nums")} data-drive-score>
                  <span>
                    {score.closed}/{open.levels.length} closed
                  </span>
                  <span>Drive time {score.time === null ? "—" : clock(score.time)}</span>
                  <span>
                    {score.crashes.toLocaleString("en-US")} {score.crashes === 1 ? "crash" : "crashes"}
                  </span>
                </p>
              );
            })()}
          </section>
        )}
      </div>

      {/* The taskbar. */}
      <div className={cn(styles.raised, "flex h-11 items-center gap-2 px-2")}>
        <button type="button" className={styles.start} style={{ height: "2.2rem", fontSize: "1.2rem" }} onClick={onBoot}>
          <span aria-hidden>❖</span> Start
        </button>
        <span className="ml-auto px-2 text-[1.1rem]">
          {DRIVES.reduce((n, d) => n + d.levels.filter((l) => isCleared(save, l.id)).length, 0)} closed · {save.crashes} crashes
        </span>
      </div>
    </section>
  );
}
