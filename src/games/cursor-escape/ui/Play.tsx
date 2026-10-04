"use client";

// The play screen (Plan/12-cursor-escape.md §2, §8): DeskOS 98 fills the window. A click captures the
// mouse (Pointer Lock; Esc lets go and pauses); in trackpad mode you drag anywhere instead, and tap to
// click. The taskbar is the HUD: the level, the clock, crashes and the sabotage in force; notifications
// pop up over its tray. Escape a window and it closes; a card says how it went.
import { FolderOpen, Pause, Play as PlayIcon, RotateCcw, RotateCw, Settings2, SkipForward, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { lockPointer, onPointerLockChange, pointerLockSupported, unlockPointer } from "@/engine/browser/pointer-lock";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { useFitCanvas } from "@/games/shared/fit";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { DESK_H, DESK_W, HZ } from "../core/constants";
import type { EffectType } from "../core/level";
import styles from "../cursor-escape.module.css";
import { getLevel, levelLabel, nextLevelId } from "../levels";
import { initialHud, Runtime, type Hud, type LevelResult } from "../play/runtime";
import { cursorSave } from "../save";
import { OptionsPanel } from "./Menus";

/** How a level went, once it's saved. */
export interface Recorded {
  medal: "gold" | "silver" | "bronze" | null;
  best: number;
  newBest: boolean;
  assisted: boolean;
}

export interface PlayProps {
  levelId: string;
  onWin(levelId: string, result: LevelResult): Recorded;
  onCrash(levelId: string): void;
  onStat(kind: "turned" | "found"): void;
  /** On to the next window (null: the end of a drive). */
  onNext(levelId: string): void;
  onDesktop(): void;
}

type Phase = "start" | "play" | "paused" | "cleared";

export const clock = (ticks: number) => {
  const s = ticks / HZ;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

const EFFECT_ICONS: Record<EffectType, { label: string; name: string }> = {
  invert: { label: "⇄", name: "Inverted" },
  rotate: { label: "↻", name: "Rotated" },
  lag: { label: "…", name: "Lag" },
  sensitivity: { label: "±", name: "Pointer speed" },
  drift: { label: "~", name: "Drift" },
  fakeCursor: { label: "?", name: "Fake cursor" },
  decoys: { label: "×4", name: "Decoys" },
  largeCursor: { label: "▲", name: "Large cursor" },
  solidTrail: { label: "≡", name: "Solid trail" },
  recentre: { label: "◎", name: "Recentre" },
};

export function PlayScreen({ levelId, onWin, onCrash, onStat, onNext, onDesktop }: PlayProps) {
  const save = useSave(cursorSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const [hideRotate, setHideRotate] = useState(false);
  const { area, frame } = useFitCanvas(DESK_W, DESK_H, "--ce-scale");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [phase, setPhaseState] = useState<Phase>("start");
  /** The phase, for code that runs outside a render (a new level's runtime starts paused unless you're playing). */
  const phaseRef = useRef<Phase>("start");
  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };
  const [menu, setMenu] = useState<"pause" | "options" | null>(null);
  const [cleared, setCleared] = useState<(Recorded & { result: LevelResult }) | null>(null);
  const [lockFailed, setLockFailed] = useState(false);
  const level = getLevel(levelId);
  const prefs = save.prefs;
  // Phones (and anyone who'd rather) drag instead of locking the pointer.
  const hand = coarse || prefs.trackpad || !pointerLockSupported() ? "drag" : "lock";

  const won = useEffectEvent((result: LevelResult) => {
    unlockPointer();
    const recorded = onWin(levelId, result);
    setCleared({ ...recorded, result });
    setPhase("cleared");
  });
  const crashed = useEffectEvent(() => onCrash(levelId));
  const stat = useEffectEvent((kind: "turned" | "found") => onStat(kind));
  const motion = useEffectEvent(() => comfort.reducedMotion);
  const handNow = useEffectEvent(() => hand);

  // One runtime per level (the area stays, so the mouse can stay captured from one level to the next).
  useEffect(() => {
    if (!canvas.current || !area.current) return;
    const p = cursorSave.get().prefs;
    const h = handNow();
    const box = frame.current;
    const created = new Runtime(
      canvas.current,
      area.current,
      {
        level: getLevel(levelId),
        steady: p.steady,
        assist: p.assist,
        sensitivity: h === "drag" ? p.trackpadSensitivity : p.sensitivity,
        hand: h,
        scale: () => (box?.clientWidth ?? DESK_W) / DESK_W,
        reduceMotion: () => motion(),
      },
      hudStore,
      { onWin: (result) => won(result), onCrash: () => crashed(), onStat: (kind) => stat(kind) },
    );
    runtime.current = created;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __ce?: unknown }).__ce = { runtime: created, runs: () => import("../levels/runs") };
    created.start();
    if (phaseRef.current !== "play") created.pause();
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [levelId, hudStore, area, frame]);

  // Options changed: apply them now.
  useEffect(() => {
    runtime.current?.setPrefs({ steady: prefs.steady, assist: prefs.assist, sensitivity: hand === "drag" ? prefs.trackpadSensitivity : prefs.sensitivity });
  }, [prefs, hand]);

  // Losing the lock (Esc, a tab switch) pauses.
  const lockLost = useEffectEvent((locked: boolean) => {
    if (locked || hand !== "lock") return;
    if (phase === "play") {
      runtime.current?.pause();
      setPhase("paused");
    }
  });
  useEffect(() => onPointerLockChange((locked) => lockLost(locked)), []);

  /** Into the game: capture the mouse (from a click), or just go (trackpad mode). */
  const capture = async () => {
    setLockFailed(false);
    if (hand === "lock") {
      const ok = await lockPointer(area.current!, { raw: cursorSave.get().prefs.raw });
      if (!ok) {
        setLockFailed(true);
        return false;
      }
    }
    runtime.current?.resume();
    setPhase("play");
    setMenu(null);
    return true;
  };

  const pause = () => {
    if (phase !== "play") return;
    if (hand === "lock") unlockPointer();
    runtime.current?.pause();
    setPhase("paused");
  };

  const next = () => {
    setCleared(null);
    const after = nextLevelId(levelId);
    onNext(levelId);
    if (!after) return;
    if (hand === "drag") {
      setPhase("play");
      return;
    }
    // The click that asked for the next window captures the mouse for it too.
    setPhase("start");
    void lockPointer(area.current!, { raw: cursorSave.get().prefs.raw }).then((ok) => {
      setLockFailed(!ok);
      if (!ok) return;
      runtime.current?.resume();
      setPhase("play");
    });
  };

  const retry = () => {
    setCleared(null);
    runtime.current?.again();
    setPhase("start");
    void capture();
  };

  // Keys: R restarts, P pauses (Esc pauses by letting go of the mouse), Enter goes on from the card.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || document.querySelector("[role=dialog]")) return;
    if (event.code === "KeyR" && phase === "play") {
      event.preventDefault();
      runtime.current?.restart();
    } else if (event.code === "KeyP" && phase === "play") {
      event.preventDefault();
      pause();
    } else if (event.code === "Escape" && phase === "play" && hand === "drag") {
      event.preventDefault();
      pause();
    }
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // The paused / start windows' Enter: carry on.
  const label = levelLabel(levelId);
  const playing = phase === "play";

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={cn(styles.root, styles.area)}
      data-hide-cursor={playing && hand === "lock" ? "" : undefined}
      aria-label={`${label} ${level.name}`}
      data-game-area
      data-level={levelId}
      data-phase={phase}
      data-status={hud.status}
      data-ready={hud.ready ? "" : undefined}
      data-crashes={hud.crashes}
    >
      <div ref={frame} className={styles.stage} style={{ width: DESK_W * 2, height: DESK_H * 2 }}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />

        {/* The taskbar: the HUD. */}
        <div className={styles.taskbar}>
          <button
            type="button"
            className={styles.start}
            onClick={(event) => {
              event.stopPropagation();
              pause();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Pause (Esc)"
          >
            <span aria-hidden>❖</span> Start
          </button>
          <span className={styles.task} title={level.name}>
            <span className="truncate">
              {label} {level.name}
            </span>
          </span>
          <span className={styles.tray} data-tray>
            {hud.effects.map((e) => (
              <span key={e} className={styles.trayIcon} title={EFFECT_ICONS[e].name} aria-label={EFFECT_ICONS[e].name}>
                {EFFECT_ICONS[e].label}
              </span>
            ))}
            <span aria-label={`${hud.crashes} crashes`} data-crash-count>
              ✕ {hud.crashes}
            </span>
            <span className="tabular-nums" aria-label="Time" data-clock>
              {clock(hud.ticks)}
            </span>
            {hand === "drag" && (
              <>
                <button type="button" className={styles.tiny} onPointerDown={(e) => e.stopPropagation()} onClick={() => runtime.current?.restart()} aria-label="Restart">
                  <RotateCcw className="size-[0.8em]" aria-hidden />
                </button>
                <button type="button" className={styles.tiny} onPointerDown={(e) => e.stopPropagation()} onClick={pause} aria-label="Pause">
                  <Pause className="size-[0.8em]" aria-hidden />
                </button>
              </>
            )}
          </span>
        </div>

        {/* Notifications. */}
        <div className={styles.balloons} aria-hidden>
          {hud.notices.map((n) => (
            <p key={n.id} className={styles.balloon} data-kind={n.kind} data-notice={n.kind}>
              <strong>{n.title}</strong>
              {n.body}
            </p>
          ))}
        </div>
        <p className="sr-only" aria-live="polite" data-message>
          {hud.message}
        </p>

        {playing && hud.waiting && level.hint && (
          <p className={styles.hint} data-hint>
            {level.hint}
          </p>
        )}

        {phase !== "play" && phase !== "cleared" && (
          <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
            <section className={cn(styles.raised, styles.window, styles.dialog)} aria-labelledby="ce-start-title" data-overlay={phase}>
              <h2 id="ce-start-title" className={styles.titlebar}>
                {phase === "paused" ? "Paused" : `${label} ${level.name}`}
              </h2>
              <div className="grid gap-3 p-4">
                <p>
                  {phase === "paused"
                    ? "DeskOS 98 is waiting. (So is the [X].)"
                    : hand === "lock"
                      ? "Click to capture the mouse. Reach the [X] and click it. Esc lets go."
                      : "Drag anywhere to move the cursor. Tap to click. Reach the [X] and tap it."}
                </p>
                {lockFailed && <p className="text-[#B00020]">The browser didn&apos;t hand over the mouse. Click again (or turn on trackpad mode in Options).</p>}
                <button type="button" className={styles.button} onClick={() => void capture()} autoFocus data-capture>
                  <PlayIcon className="size-4" aria-hidden /> {phase === "paused" ? "Continue" : hand === "lock" ? "Capture the mouse" : "Start"}
                </button>
                {phase === "paused" && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => {
                        runtime.current?.restart();
                        void capture();
                      }}
                    >
                      <RotateCcw className="size-4" aria-hidden /> Restart
                    </button>
                    <button type="button" className={styles.button} onClick={() => setMenu("options")}>
                      <Settings2 className="size-4" aria-hidden /> Options
                    </button>
                    <button type="button" className={styles.button} onClick={onDesktop}>
                      <FolderOpen className="size-4" aria-hidden /> Desktop
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {phase === "cleared" && cleared && (
          <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
            <section className={cn(styles.raised, styles.window, styles.dialog)} aria-labelledby="ce-cleared-title" data-cleared>
              <h2 id="ce-cleared-title" className={styles.titlebar}>
                Window closed
              </h2>
              <div className="grid gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className={styles.medal} data-medal={cleared.medal ?? "none"} aria-label={cleared.medal ? `${cleared.medal} medal` : "No medal"}>
                    {cleared.medal ? cleared.medal[0]!.toUpperCase() : "–"}
                  </span>
                  <div>
                    <p className="text-[1.3em] leading-none">{clock(cleared.result.ticks)}</p>
                    <p>
                      {cleared.result.crashes} {cleared.result.crashes === 1 ? "crash" : "crashes"} · best {clock(cleared.best)}
                      {cleared.newBest && " · new best!"}
                    </p>
                    {cleared.assisted && <p>Assist on: no medal.</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" className={styles.button} onClick={next} autoFocus data-next>
                    <SkipForward className="size-4" aria-hidden /> Next
                  </button>
                  <button type="button" className={styles.button} onClick={retry}>
                    <RotateCcw className="size-4" aria-hidden /> Retry
                  </button>
                  <button type="button" className={styles.button} onClick={onDesktop}>
                    <FolderOpen className="size-4" aria-hidden /> Desktop
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {coarse && portrait && !hideRotate && (
        <div className={cn(styles.raised, "absolute inset-x-3 top-4 z-[5] flex items-center gap-3 p-3 text-[1.1rem]")} role="status" onPointerDown={(e) => e.stopPropagation()}>
          <RotateCw className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">Turn your phone sideways for a bigger desktop. (Drag anywhere to move the cursor.)</span>
          <button type="button" className={styles.tiny} onClick={() => setHideRotate(true)} aria-label="Dismiss">
            <X className="size-3" aria-hidden />
          </button>
        </div>
      )}

      <Dialog
        open={menu === "options"}
        onOpenChange={(open) => {
          if (!open) setMenu(null);
        }}
        game="cursor-escape"
        eyebrow="DeskOS 98"
        title="Options"
        description="Saved on this device. Changes apply straight away."
      >
        <OptionsPanel />
      </Dialog>
    </div>
  );
}
