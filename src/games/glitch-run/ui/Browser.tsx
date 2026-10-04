"use client";

// Stage select (Plan/07-glitch-run.md §8.2): a file browser into the game's corrupted memory. Every
// stage is a program (stage_01.exe…); the ones you can't run yet are still corrupted. Endless and
// today's Daily Corruption sit at the bottom.
import { ArrowLeft, Play } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { bpmOf } from "../core/constants";
import { endlessOpen, isCleared, isOpen } from "../core/progress";
import { dailyFor } from "../gen/generator";
import styles from "../glitch-run.module.css";
import { GLITCHES, type GlitchKind } from "../glitches/kinds";
import type { GlitchSave } from "../save";
import { fileName, FINAL_STAGE, getStage, STAGE_IDS, stageSource } from "../stages";
import { FileIcon, GlitchIcon } from "./icons";
import type { PlayTarget } from "./Play";

/** A file's id in the browser: a stage's id, "endless" or "daily". */
export type FileId = string;

/** A name still being eaten by corruption (the same garbling every time). */
function corrupt(name: string, salt: number): string {
  const blocks = "▓▒░█";
  return [...name].map((ch, i) => (ch !== "." && ((i * 7 + salt * 13) % 5 === 0 || (i + salt) % 4 === 0) ? blocks[(i + salt) % blocks.length] : ch)).join("");
}

const fmt = (n: number) => n.toLocaleString("en-US");

export function Browser({ save, selected, onSelect, onRun, onBack }: { save: GlitchSave; selected: FileId; onSelect: (id: FileId) => void; onRun: (target: PlayTarget) => void; onBack: () => void }) {
  const list = useRef<HTMLDivElement | null>(null);
  const daily = dailyFor(new Date());
  const open = endlessOpen(save);
  const files: Array<{ id: FileId; locked: boolean }> = [
    ...STAGE_IDS.map((id) => ({ id, locked: !isOpen(save, id) })),
    { id: "endless", locked: !open },
    { id: "daily", locked: !open },
  ];
  const corrupted = files.filter((f) => f.locked).length;

  const targetOf = (id: FileId): PlayTarget => (id === "endless" ? { kind: "endless" } : id === "daily" ? { kind: "daily" } : { kind: "stage", id });
  const choose = (id: FileId) => {
    if (id === selected) onRun(targetOf(id));
    else onSelect(id);
  };

  // The chosen file, in view (the list scrolls; the page stays put).
  useEffect(() => {
    const box = list.current;
    const row = box?.querySelector(`[data-file="${selected}"]`);
    if (!box || !row) return;
    const a = row.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (a.top < b.top) box.scrollTop -= b.top - a.top;
    else if (a.bottom > b.bottom) box.scrollTop += a.bottom - b.bottom;
  }, [selected]);

  // Get the chosen stage ready while you read about it (each one proves itself clearable as it's built).
  useEffect(() => {
    if (!STAGE_IDS.includes(selected)) return;
    const timer = setTimeout(() => getStage(selected), 250);
    return () => clearTimeout(timer);
  }, [selected]);

  // Up and down move through the files.
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const usable = files.filter((f) => !f.locked);
    const at = usable.findIndex((f) => f.id === selected);
    const next = usable[Math.max(0, Math.min(usable.length - 1, at + (event.key === "ArrowDown" ? 1 : -1)))];
    if (!next) return;
    onSelect(next.id);
    list.current?.querySelector<HTMLButtonElement>(`[data-file="${next.id}"]`)?.focus();
  };

  const name = (id: FileId) => (id === "endless" ? "endless.exe" : id === "daily" ? `daily_corruption_${String(daily.number).padStart(2, "0")}.exe` : fileName(id));

  return (
    <section className={cn(styles.root, styles.screen, "flex min-h-[calc(100dvh-4rem)] items-start justify-center px-3 py-6 sm:items-center sm:px-6 sm:py-10")}>
      <div className={cn(styles.window, "relative z-[1] w-[min(100%,58rem)]")}>
        <div className={styles.titlebar}>
          <span className={styles.dots} aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <h1 className="flex-1 truncate">memory://glitch_run/</h1>
          <button type="button" className={cn(styles.quiet, "px-2.5 py-1 text-xs")} onClick={onBack} data-sound="click">
            <ArrowLeft className="size-3.5" aria-hidden /> Title
          </button>
        </div>
        <p className={styles.pathbar}>
          C:\GLITCH_RUN\MEMORY\ · {files.length} files{corrupted ? `, ${corrupted} corrupted` : ""}
        </p>
        <div className="grid md:grid-cols-[minmax(0,1fr)_19rem]">
          <div ref={list} className="max-h-[min(58vh,36rem)] overflow-y-auto py-1 md:border-r md:border-[#2A2C48]" onKeyDown={onKeyDown} role="group" aria-label="Files">
            {files.map((f, i) => {
              const id = f.id;
              const stage = STAGE_IDS.includes(id);
              const record = stage ? save.stages[id] : undefined;
              const src = stage ? stageSource(id) : null;
              return (
                <button
                  key={id}
                  type="button"
                  className={styles.file}
                  disabled={f.locked}
                  aria-current={selected === id ? "true" : undefined}
                  onClick={() => choose(id)}
                  data-file={id}
                  data-locked={f.locked ? "" : undefined}
                  data-sound="click"
                >
                  <FileIcon kind={f.locked ? "locked" : id === "endless" ? "endless" : id === "daily" ? "daily" : id === FINAL_STAGE ? "root" : "exe"} className={f.locked ? "" : selected === id ? "text-[#00F5D4]" : "text-[#9AA1B5]"} />
                  <span className="min-w-0">
                    <span className={cn("block truncate font-bold", f.locked && styles.corrupt)}>{f.locked ? corrupt(name(id), i) : name(id)}</span>
                    <span className="block truncate text-xs text-[#9AA1B5]">
                      {f.locked ? "corrupted: clear the one before" : src ? src.name : id === "endless" ? "Endless" : `Daily Corruption #${daily.number}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {record?.clean && <span className={cn(styles.tag, "text-[#7CFF6B]")}>clean</span>}
                    {record?.clears ? (
                      <span className={cn(styles.tag, "text-[#00F5D4]")}>ok</span>
                    ) : stage && !f.locked ? (
                      <span className={cn(styles.tag, "text-[#FFC857]")}>new</span>
                    ) : null}
                    {f.locked && <span className={cn(styles.tag, "text-[#9AA1B5]")}>locked</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <Details id={selected} save={save} name={name(selected)} onRun={() => onRun(targetOf(selected))} />
        </div>
      </div>
    </section>
  );
}

function Details({ id, save, name, onRun }: { id: FileId; save: GlitchSave; name: string; onRun: () => void }) {
  const daily = dailyFor(new Date());
  if (id === "endless" || id === "daily") {
    const today = save.daily[daily.key];
    return (
      <aside className="border-t border-[#2A2C48] p-5 md:border-t-0" aria-label="File details" data-details={id}>
        <FileIcon kind={id} size="2rem" className="text-[#00F5D4]" />
        <h2 className="mt-2 break-all text-lg font-extrabold">{name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#C9D1E3]">
          {id === "endless"
            ? "Track that never ends, faster and faster. Corruption creeps up on its own, and the glitches come whenever they like."
            : "Today's run: the same track and the same glitches for everyone. A new one at midnight (UTC)."}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {id === "endless" ? (
            <>
              <Fact label="Best score" value={save.endless.best ? fmt(save.endless.best) : "—"} />
              <Fact label="Best distance" value={save.endless.metres ? `${fmt(save.endless.metres)} m` : "—"} />
              <Fact label="Runs" value={fmt(save.endless.runs)} />
            </>
          ) : (
            <>
              <Fact label="Today's best" value={today?.best ? fmt(today.best) : "—"} />
              <Fact label="Furthest" value={today?.metres ? `${fmt(today.metres)} m` : "—"} />
              <Fact label="Runs today" value={fmt(today?.runs ?? 0)} />
            </>
          )}
        </dl>
        <RunButton onRun={onRun} />
      </aside>
    );
  }
  const src = stageSource(id);
  const record = save.stages[id];
  const kinds = [...new Set((src.glitches ?? []).map((g) => g.kind))] as GlitchKind[];
  const scans = src.chase?.length ?? 0;
  const full = src.chase?.filter((s) => s.kind === "full").length ?? 0;
  return (
    <aside className="border-t border-[#2A2C48] p-5 md:border-t-0" aria-label="File details" data-details={id}>
      <FileIcon kind={id === FINAL_STAGE ? "root" : "exe"} size="2rem" className="text-[#00F5D4]" />
      <h2 className="mt-2 text-lg font-extrabold">{name}</h2>
      <p className="text-sm font-bold text-[#FFC857]">{src.name}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#C9D1E3]">{src.teaches}</p>
      {kinds.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Glitches in this stage">
          {kinds.map((kind) => (
            <li key={kind} className={styles.chip} title={GLITCHES[kind].what}>
              <GlitchIcon kind={kind} size="1.1em" /> {GLITCHES[kind].name}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-[#9AA1B5]">
        {Math.round(bpmOf(src.ticks))} bpm · The Debugger: {scans} scan lines{full ? `, ${full} you'll have to Clip through` : ""}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Fact label="Best score" value={record?.best ? fmt(record.best) : "—"} />
        <Fact label="Cleared" value={record?.clears ? `${fmt(record.clears)}×` : "not yet"} />
        <Fact label="Patched" value={`${fmt(record?.deaths ?? 0)}×`} />
        <Fact label="Clean Code" value={record?.clean ? "yes" : "—"} />
      </dl>
      <RunButton onRun={onRun} cleared={isCleared(save, id)} />
    </aside>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9AA1B5]">{label}</dt>
      <dd className="mt-0.5 font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}

function RunButton({ onRun, cleared = false }: { onRun: () => void; cleared?: boolean }) {
  return (
    <button type="button" className={cn(styles.go, "mt-5 w-full")} onClick={onRun} data-run>
      <Play className="size-4" fill="currentColor" aria-hidden /> {cleared ? "Run again" : "Run"}
    </button>
  );
}
