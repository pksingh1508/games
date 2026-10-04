"use client";

// The level screen (Plan/01-one-more-step.md §2, §8.3–§8.4): the world-level and its name with your steps and
// par on top, the grid in the middle, the narrator's speech bubble underneath, and undo, restart, wait and
// the menu. Arrow keys or WASD step, Space waits, Z undoes, R restarts, Esc is the menu; on a phone, swipe
// (or tap a tile next to you; tap yourself to wait), or turn on the D-pad.
import { ChevronLeft, Hourglass, Map as MapIcon, Menu, Play as PlayIcon, RotateCcw, SkipForward, Undo2 } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort } from "@/games/shared/device";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import type { Action, Dir } from "../engine/types";
import { FINAL_LEVEL, getLevel, nextLevelId, worldOf } from "../levels";
import styles from "../one-more-step.module.css";
import { initialHud, Runtime, type Hud, type StatsAdd } from "../play/runtime";
import type { Clear } from "../progress";
import { PALETTES } from "../render/draw";
import { omsSave } from "../save";
import { OptionsDialog } from "./Menus";

export interface Recorded {
  stars: number;
  best: number;
  newBest: boolean;
}

export interface PlayProps {
  levelId: string;
  onWin(levelId: string, clear: Clear): Recorded;
  onStats(add: StatsAdd): void;
  onNext(levelId: string): void;
  onMap(): void;
}

const MOVE = (dir: Dir): Action => ({ type: "move", dir });
const WAIT: Action = { type: "wait" };

export function Stars({ bits, label }: { bits: number; label?: string }) {
  const n = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
  return (
    <span className="inline-flex gap-1" role="img" aria-label={label ?? `${n} of 3 stars`}>
      {[0, 1, 2].map((k) => (
        <span key={k} className={styles.star} data-on={bits & (1 << k) ? "" : undefined} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

export function PlayScreen({ levelId, onWin, onStats, onNext, onMap }: PlayProps) {
  const save = useSave(omsSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const level = getLevel(levelId);
  const world = worldOf(levelId);
  const pal = PALETTES[level.world] ?? PALETTES[1]!;
  const stage = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud(levelId)));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [cleared, setCleared] = useState<(Recorded & { steps: number }) | null>(null);
  const [menu, setMenu] = useState(false);
  const [options, setOptions] = useState(false);
  const prefs = save.prefs;

  const won = useEffectEvent((steps: number, clear: Clear) => {
    const recorded = onWin(levelId, clear);
    setCleared({ ...recorded, steps });
  });
  const stats = useEffectEvent((add: StatsAdd) => onStats(add));
  const motion = useEffectEvent(() => comfort.reducedMotion);
  const coords = useEffectEvent(() => omsSave.get().prefs.coords);

  // One runtime per level.
  useEffect(() => {
    if (!canvas.current || !stage.current) return;
    const created = new Runtime(canvas.current, getLevel(levelId), hudStore, { onWin: (steps, clear) => won(steps, clear), onStats: (add) => stats(add) }, { reduceMotion: () => motion(), coords: () => coords() });
    runtime.current = created;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __oms?: unknown }).__oms = { runtime: created };
    const el = stage.current;
    const fit = () => created.resize(el.clientWidth, el.clientHeight, Math.min(2, window.devicePixelRatio || 1));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    created.start();
    setCleared(null);
    return () => {
      observer.disconnect();
      created.destroy();
      runtime.current = null;
    };
  }, [levelId, hudStore]);

  const act = (a: Action) => {
    if (cleared || menu) return;
    runtime.current?.act(a);
  };

  const next = () => {
    setCleared(null);
    onNext(levelId);
  };

  // Keys.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (document.querySelector("[role=dialog]")) return;
    const rt = runtime.current;
    if (!rt) return;
    if (cleared) {
      if (event.key === "Enter") {
        event.preventDefault();
        next();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu((m) => !m);
      return;
    }
    if (menu) return;
    const dir: Dir | null = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" }[event.key] as Dir | null;
    if (dir) rt.act(MOVE(dir));
    else if (event.key === " " || event.key === ".") rt.act(WAIT);
    else if (event.key === "z" || event.key === "Z" || event.key === "Backspace") rt.undo();
    else if (event.key === "r" || event.key === "R") rt.restart();
    else return;
    event.preventDefault();
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Swipes (and taps: a tile next to you steps there; you, waits).
  const swipe = useRef<{ x: number; y: number; t: number; used: boolean } | null>(null);
  const down = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY, t: performance.now(), used: false };
  };
  const moveP = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s || s.used) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < prefs.swipe) return;
    s.used = true;
    act(MOVE(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up"));
  };
  const up = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    const rt = runtime.current;
    if (!s || s.used || !rt || performance.now() - s.t > 400) return;
    const r = stage.current!.getBoundingClientRect();
    const { tile, ox, oy } = rt.layout;
    const x = Math.floor((e.clientX - r.left - ox) / tile);
    const y = Math.floor((e.clientY - r.top - oy) / tile);
    const p = rt.state.player;
    const d = Math.abs(x - p.x) + Math.abs(y - p.y);
    if (d === 0) act(WAIT);
    else if (d === 1) act(MOVE(x > p.x ? "right" : x < p.x ? "left" : y > p.y ? "down" : "up"));
  };

  const finale = levelId === FINAL_LEVEL;
  const label = finale ? `Level 6-${hud.sub}` : `Level ${levelId}`;

  return (
    <div className={cn(styles.root, styles.area)} style={{ backgroundColor: pal.bg, color: pal.ink, "--om-veil": `color-mix(in srgb, ${pal.bg} 62%, transparent)` } as CSSProperties} aria-label={`${label}, ${level.name}`} data-game-area data-level={levelId} data-status={hud.status} data-steps={hud.steps}>
      <div className={styles.bar}>
        <button type="button" className={cn(styles.button, "!min-h-0 !px-3 !py-1 text-sm")} onClick={onMap} data-map>
          <ChevronLeft className="size-4" aria-hidden /> Map
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold opacity-75">{finale ? "The Last Step" : `World ${world.id} · ${world.name}`}</p>
          <h1 className="truncate text-xl font-bold leading-tight" data-level-title>
            {label} · {level.name}
          </h1>
        </div>
        <p className="text-right text-sm font-bold leading-tight tabular-nums" data-count>
          {finale ? null : hud.wave > 0 ? (
            <span style={{ color: pal.danger }}>Steps left: {hud.wave}</span>
          ) : (
            <>
              {hud.steps} {hud.steps === 1 ? "step" : "steps"}
              <br />
              <span className="opacity-70">par {hud.par}</span>
            </>
          )}
        </p>
      </div>

      <div ref={stage} className={styles.stage} onPointerDown={down} onPointerMove={moveP} onPointerUp={up} onPointerCancel={() => (swipe.current = null)}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />
        {hud.status === "dead" && !cleared && (
          <div className={styles.dead}>
            <div role="alert" data-dead={hud.cause}>
              <p className="text-lg font-bold">{hud.noUndo ? "No take-backs. From the top." : "Ouch. Undo, or start again?"}</p>
              <div className="flex gap-2">
                {!hud.noUndo && (
                  <button type="button" className={cn(styles.button, styles.primary)} onClick={() => runtime.current?.undo()} autoFocus data-undo-death>
                    <Undo2 className="size-4" aria-hidden /> Undo
                  </button>
                )}
                <button type="button" className={styles.button} onClick={() => runtime.current?.restart()} autoFocus={hud.noUndo}>
                  <RotateCcw className="size-4" aria-hidden /> Restart
                </button>
              </div>
            </div>
          </div>
        )}
        {cleared && (
          <div className={styles.overlay}>
            <section className={styles.card} aria-labelledby="om-done" data-cleared>
              <h2 id="om-done" className="text-2xl font-bold leading-tight">
                {finale ? "It came to you." : "Caught it!"}
              </h2>
              {finale ? (
                <p className="mt-2 text-lg">Zero steps. That&apos;s the whole game: thanks for playing!</p>
              ) : (
                <>
                  <div className="mt-2">
                    <Stars bits={cleared.stars} />
                  </div>
                  <p className="mt-2 text-lg">
                    {cleared.steps} steps · par {hud.par} · the fewest {hud.optimal}
                    {cleared.newBest && cleared.best === cleared.steps ? " · best yet!" : ""}
                  </p>
                </>
              )}
              <p className="mt-1 text-sm opacity-75">
                You&apos;ve walked {save.stats.steps.toLocaleString("en-US")} steps.{" "}
                {save.stats.steps >= 1000 ? "Your doctor would be proud." : "Keep going."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={cn(styles.button, styles.primary)} onClick={next} autoFocus data-next>
                  <SkipForward className="size-4" aria-hidden /> {finale || !nextLevelId(levelId) ? "The end" : "Next"}
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setCleared(null);
                    runtime.current?.restart();
                  }}
                  data-again
                >
                  <RotateCcw className="size-4" aria-hidden /> Again
                </button>
                <button type="button" className={styles.button} onClick={onMap}>
                  <MapIcon className="size-4" aria-hidden /> Map
                </button>
              </div>
            </section>
          </div>
        )}
        {menu && !cleared && (
          <div className={styles.overlay}>
            <section className={styles.card} aria-labelledby="om-menu" data-menu>
              <h2 id="om-menu" className="text-2xl font-bold">
                Paused
              </h2>
              <p className="mt-1 opacity-80">No hurry. It&apos;s turn-based: nothing moves until you do.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={cn(styles.button, styles.primary)} onClick={() => setMenu(false)} autoFocus data-resume>
                  <PlayIcon className="size-4" aria-hidden /> Carry on
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setMenu(false);
                    runtime.current?.restart();
                  }}
                >
                  <RotateCcw className="size-4" aria-hidden /> Restart
                </button>
                <button type="button" className={styles.button} onClick={() => setOptions(true)}>
                  Options
                </button>
                <button type="button" className={styles.button} onClick={onMap}>
                  <MapIcon className="size-4" aria-hidden /> Map
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        {coarse && !prefs.dpad && hud.steps === 0 && <p className="text-sm font-semibold opacity-70">Swipe to step · tap yourself to wait</p>}
        {hud.said && (
          <p key={hud.said.key} className={styles.bubble} data-lie={hud.said.lie ? "" : undefined} aria-live="polite" data-narrator>
            {hud.said.text}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {prefs.dpad && (
            <div className={styles.dpad} role="group" aria-label="Step">
              <span />
              <button type="button" onClick={() => act(MOVE("up"))} aria-label="Step up">
                ↑
              </button>
              <span />
              <button type="button" onClick={() => act(MOVE("left"))} aria-label="Step left">
                ←
              </button>
              <button type="button" onClick={() => act(WAIT)} aria-label="Wait">
                ·
              </button>
              <button type="button" onClick={() => act(MOVE("right"))} aria-label="Step right">
                →
              </button>
              <span />
              <button type="button" onClick={() => act(MOVE("down"))} aria-label="Step down">
                ↓
              </button>
              <span />
            </div>
          )}
          <div className={styles.controls}>
            <button
              type="button"
              className={cn(styles.button, hud.noUndo && styles.taped)}
              onClick={() => runtime.current?.undo()}
              disabled={hud.noUndo || !hud.canUndo}
              aria-label={hud.noUndo ? "Undo (taped over: not in this level)" : "Undo (Z)"}
              data-undo
            >
              <Undo2 className="size-4" aria-hidden /> Undo
            </button>
            <button type="button" className={styles.button} onClick={() => runtime.current?.restart()} aria-label="Restart (R)" data-restart>
              <RotateCcw className="size-4" aria-hidden /> Restart
            </button>
            <button type="button" className={styles.button} onClick={() => act(WAIT)} aria-label="Wait one tick (Space)" data-wait>
              <Hourglass className="size-4" aria-hidden /> Wait
            </button>
            <button type="button" className={styles.button} onClick={() => setMenu((m) => !m)} aria-label="Menu (Esc)" data-menu-button>
              <Menu className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <OptionsDialog open={options} onOpenChange={setOptions} />
    </div>
  );
}
