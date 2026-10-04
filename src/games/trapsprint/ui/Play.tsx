"use client";

// The play screen (Plan/06-trapsprint.md §8.3): the level fills the screen (the arcade's header
// hides underneath), scaled up in whole pixels where it fits. HUD: level name top left, timer top
// centre, deaths top right. Nothing else, except on-screen buttons on touch screens.
import { Grid3x3, Pause, Play as PlayIcon, RotateCcw, RotateCw, Settings2, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { expandLog } from "@/engine/replay";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { Store } from "@/games/shared/store";
import { useFitCanvas } from "@/games/shared/fit";
import { cn } from "@/lib/cn";
import { HEIGHT, WIDTH } from "../core/constants";
import { loadBestRun } from "../core/ghosts";
import { levelTitle } from "../core/level";
import { unpackMark } from "../core/progress";
import type { LevelSession } from "../core/session";
import { tracePath, type DeathCause } from "../core/world";
import { getLevel, levelLabel, type ZoneId } from "../levels";
import { initialHud, Runtime, type Action, type Hud } from "../play/runtime";
import { assistOn, trapSprintSave } from "../save";
import styles from "../trapsprint.module.css";
import { CompleteCard, type CompleteInfo } from "./Complete";
import { SkullIcon } from "./icons";
import { OptionsPanel } from "./Menus";

export interface ZoneRunInfo {
  zone: ZoneId;
  /** Which level of the zone (0–9). */
  index: number;
  count: number;
  /** Ticks on the clock before this level. */
  base: number;
}

export interface PlayProps {
  levelId: string;
  zoneRun: ZoneRunInfo | null;
  result: CompleteInfo | null;
  hasNext: boolean;
  onDeath(levelId: string, cause: DeathCause, x: number, y: number): void;
  onFakeHop(): void;
  onWin(session: LevelSession, assisted: boolean): void;
  onRetry(): void;
  onNext(): void;
  onLevels(): void;
  onWatch(): void;
}

const TOUCH_SIZE = { s: 64, m: 80, l: 96 } as const;

export function PlayScreen({ levelId, zoneRun, result, hasNext, onDeath, onFakeHop, onWin, onRetry, onNext, onLevels, onWatch }: PlayProps) {
  const save = useSave(trapSprintSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const { area, frame } = useFitCanvas(WIDTH, HEIGHT, "--ts-scale");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const timer = useRef<HTMLSpanElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const jumps = useRef(0);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [menu, setMenu] = useState<"pause" | "options" | null>(null);
  const [hideRotate, setHideRotate] = useState(false);
  const level = getLevel(levelId);
  const record = save.levels[levelId];
  const zoneBase = zoneRun ? zoneRun.base : null;

  const openMenu = () => {
    runtime.current?.pause();
    setMenu("pause");
  };
  const closeMenu = () => {
    setMenu(null);
    runtime.current?.resume();
    area.current?.focus({ preventScroll: true });
  };

  const died = useEffectEvent((cause: DeathCause, x: number, y: number) => onDeath(levelId, cause, x, y));
  const hopped = useEffectEvent(() => onFakeHop());
  const won = useEffectEvent((session: LevelSession) => onWin(session, runtime.current?.assisted ?? false));
  const togglePause = useEffectEvent(() => {
    if (result) return;
    if (menu) closeMenu();
    else openMenu();
  });
  const reducedMotion = useEffectEvent(() => comfort.reducedMotion);

  // One runtime per visit: it loads your best run first (the ghost), then starts.
  useEffect(() => {
    let cancelled = false;
    let created: Runtime | null = null;
    const lvl = getLevel(levelId);
    void (async () => {
      const best = await loadBestRun(levelId);
      if (cancelled || !canvas.current) return;
      const current = trapSprintSave.get();
      const prefs = current.prefs;
      created = new Runtime(
        canvas.current,
        {
          level: lvl,
          ghost: prefs.ghost && best && !lvl.ghostTrap ? { log: best.log, attempt: best.attempt } : null,
          ghostTrap: lvl.ghostTrap && best ? tracePath(lvl, expandLog(best.log), { attempt: best.attempt }) : null,
          assist: prefs.assist,
          priorDeaths: current.levels[levelId]?.deaths ?? 0,
          markers: (current.levels[levelId]?.marks ?? []).map(unpackMark),
          showMarkers: prefs.markers,
          keys: prefs.keys,
          reducedMotion: () => reducedMotion(),
          zoneBase,
          fastMusic: zoneBase !== null,
        },
        hudStore,
        {
          onDeath: (cause, x, y) => died(cause, x, y),
          onFakeHop: () => hopped(),
          onJump: () => {
            jumps.current++;
          },
          onWin: (session) => won(session),
          onPauseToggle: () => togglePause(),
        },
      );
      runtime.current = created;
      created.bindTimer(timer.current);
      created.start();
      area.current?.focus({ preventScroll: true });
    })();
    return () => {
      cancelled = true;
      if (created) {
        // Lifetime stats, written once per visit (not on every jump).
        const ticks = created.session.elapsed;
        const count = jumps.current;
        trapSprintSave.update((s) => ({ ...s, stats: { jumps: s.stats.jumps + count, playTicks: s.stats.playTicks + ticks } }));
        jumps.current = 0;
        created.destroy();
      }
      runtime.current = null;
    };
  }, [levelId, zoneBase, hudStore, area]);

  // Options changed (from the pause menu): apply them now.
  useEffect(() => {
    runtime.current?.setPrefs({ assist: save.prefs.assist, showMarkers: save.prefs.markers, showGhost: save.prefs.ghost, keys: save.prefs.keys });
  }, [save.prefs]);

  const firstVisit = levelId === "1-01" && !record?.deaths && !record?.clears;
  const assisted = assistOn(save.prefs.assist);

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={cn(styles.root, styles.area)}
      aria-label={`Level ${levelLabel(levelId)}: ${levelTitle(level)}`}
      data-playing={levelId}
      data-ready={hud.ready ? "" : undefined}
      data-status={hud.status}
    >
      <div ref={frame} className={styles.frame}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />

        {/* HUD: level, timer, deaths. */}
        <div className={cn(styles.hud, "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-[calc(var(--ts-scale,2)*4px)] text-[clamp(0.55rem,calc(var(--ts-scale,2)*5px),1.15rem)]")}>
          <p className="min-w-0 flex-1 truncate leading-relaxed">
            {levelLabel(levelId)} <span className="max-sm:hidden">{levelTitle(level)}</span>
            {zoneRun && (
              <span className="block text-[0.8em] text-[#FFCD75]">
                {zoneRun.zone === "R" ? "Remix" : `Zone ${zoneRun.zone}`} · {zoneRun.index + 1}/{zoneRun.count}
              </span>
            )}
            {assisted && <span className="block text-[0.8em] text-[#73EFF7]">Assist</span>}
          </p>
          <p className="text-[1.25em] tabular-nums" aria-label="Time">
            <span ref={timer}>0.00</span>
          </p>
          <div className="flex flex-1 items-start justify-end gap-2">
            <p className="flex items-center gap-1.5 tabular-nums" aria-label={`${hud.deaths} ${hud.deaths === 1 ? "death" : "deaths"}`} data-deaths={hud.deaths}>
              <SkullIcon size={14} /> {hud.deaths}
            </p>
            <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={() => runtime.current?.restart()} aria-label="Restart (R)" title="Restart (R)">
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={openMenu} aria-label="Pause (Esc)" title="Pause (Esc)">
              <Pause className="size-4" fill="currentColor" aria-hidden />
            </button>
          </div>
        </div>

        {firstVisit && !hud.started && hud.deaths === 0 && (
          <p className={cn(styles.hud, styles.toast, "pointer-events-none absolute inset-x-0 bottom-[12%] text-center text-[clamp(0.5rem,calc(var(--ts-scale,2)*4px),0.9rem)] leading-loose")}>
            {coarse ? "◀ ▶ run · JUMP jumps" : "← → run · Space jumps · R restarts"}
            <br />
            Reach the door.
          </p>
        )}
        {hud.revealing && !result && (
          <p className={cn(styles.hud, "pointer-events-none absolute inset-x-0 bottom-2 text-center text-[clamp(0.45rem,calc(var(--ts-scale,2)*3.5px),0.75rem)] text-[#F4A6C8]")}>
            Assist: trap triggers shown
          </p>
        )}
      </div>

      {coarse && !result && <TouchControls runtime={runtime} size={TOUCH_SIZE[save.prefs.touchSize]} swap={save.prefs.touchSwap} />}

      {coarse && portrait && !hideRotate && !result && (
        <div className="absolute inset-x-3 top-20 z-[5] flex items-center gap-3 rounded-xl bg-[#1a1c2c]/85 p-3 text-sm font-semibold text-white" role="status">
          <RotateCw className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">Turn your phone sideways for a bigger view.</span>
          <button type="button" className="grid size-9 place-items-center" onClick={() => setHideRotate(true)} aria-label="Dismiss">
            <X className="size-5" aria-hidden />
          </button>
        </div>
      )}

      {result && (
        <CompleteCard info={result} hasNext={hasNext} onNext={onNext} onRetry={onRetry} onLevels={onLevels} onWatch={result.attempts.some((a) => a.end === "dead") ? onWatch : null} />
      )}

      <Dialog
        open={menu === "pause"}
        onOpenChange={(open) => {
          if (!open) closeMenu();
        }}
        game="trapsprint"
        eyebrow={`${levelLabel(levelId)} · ${levelTitle(level)}`}
        title="Paused"
        description={zoneRun ? "The zone clock stops while you're here." : "The clock stops while you're here."}
      >
        <div className="grid gap-3">
          <button type="button" className="btn btn-lg" onClick={closeMenu} data-sound="click">
            <PlayIcon className="size-5" aria-hidden /> Resume
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMenu(null);
              onRetry();
            }}
            data-sound="click"
          >
            <RotateCcw className="size-4" aria-hidden /> {zoneRun ? "Restart the zone run" : "Restart the level"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setMenu("options")} data-sound="click">
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMenu(null);
              onLevels();
            }}
            data-sound="click"
          >
            <Grid3x3 className="size-4" aria-hidden /> Quit to the levels
          </button>
        </div>
      </Dialog>
      <Dialog
        open={menu === "options"}
        onOpenChange={(open) => {
          if (!open) setMenu("pause");
        }}
        game="trapsprint"
        eyebrow="TrapSprint"
        title="Options"
        description="Saved on this device. Changes apply straight away."
      >
        <OptionsPanel />
      </Dialog>
    </div>
  );
}

/** Left/right on one pad (slide between them), jump on its own; sides can swap. */
function TouchControls({ runtime, size, swap }: { runtime: { current: Runtime | null }; size: number; swap: boolean }) {
  const [held, setHeld] = useState<Record<string, boolean>>({});
  const pad = useRef<Map<number, Action | null>>(new Map());

  const set = (action: Action, down: boolean) => {
    if (down) runtime.current?.press(action);
    else runtime.current?.release(action);
    setHeld((h) => ({ ...h, [action]: down }));
  };

  /** Which half of the pad a finger is over. */
  const sideOf = (event: ReactPointerEvent<HTMLDivElement>): Action => {
    const box = event.currentTarget.getBoundingClientRect();
    return event.clientX < box.left + box.width / 2 ? "left" : "right";
  };
  const padMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pad.current.has(event.pointerId)) return;
    const before = pad.current.get(event.pointerId) ?? null;
    const now = sideOf(event);
    if (before === now) return;
    if (before) set(before, false);
    set(now, true);
    pad.current.set(event.pointerId, now);
  };
  const padUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const before = pad.current.get(event.pointerId);
    if (before) set(before, false);
    pad.current.delete(event.pointerId);
  };

  const gap = 16;
  const padStyle = { width: size * 2 + 8, height: size, bottom: gap + 8, [swap ? "right" : "left"]: gap + 8 };
  const jumpStyle = { width: size * 1.15, height: size * 1.15, bottom: gap + 8, [swap ? "left" : "right"]: gap + 8 };

  return (
    <>
      <div
        className="absolute flex touch-none gap-2"
        style={padStyle}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pad.current.set(event.pointerId, null);
          padMove(event);
        }}
        onPointerMove={padMove}
        onPointerUp={padUp}
        onPointerCancel={padUp}
        role="group"
        aria-label="Move"
      >
        <div className={styles.touch} style={{ position: "relative", width: size, height: size }} data-held={held.left ? "" : undefined} aria-hidden>
          <TriangleArrow dir="left" />
        </div>
        <div className={styles.touch} style={{ position: "relative", width: size, height: size }} data-held={held.right ? "" : undefined} aria-hidden>
          <TriangleArrow dir="right" />
        </div>
      </div>
      <div
        className={cn(styles.touch, styles.pixel, "text-[0.7rem]")}
        style={jumpStyle}
        data-held={held.jump ? "" : undefined}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          set("jump", true);
        }}
        onPointerUp={() => set("jump", false)}
        onPointerCancel={() => set("jump", false)}
        role="button"
        aria-label="Jump"
      >
        JUMP
      </div>
    </>
  );
}

function TriangleArrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 10 10" className="size-1/2" shapeRendering="crispEdges" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={dir === "right" ? 2 + i : 7 - i} y={1 + i} width={1} height={8 - i * 2} fill="#fff" />
      ))}
    </svg>
  );
}
