"use client";

// The play screen (Plan/10-last-pixel.md §2, §8.3–§8.4): the canvas, with the HUD's panels over it, and the
// game's logo above (Pix can hide in its "i"). A card to start, a card when paused, and at 100% a card with
// the stars. Esc (or P) pauses: a real dead pixel would still be there on the pause screen.
import { ChevronLeft, LayoutGrid, Play as PlayIcon, RotateCcw, RotateCw, Settings2, SkipForward, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { onTabVisibility } from "@/engine/browser/tab";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { useFitCanvas } from "@/games/shared/fit";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { GRID_H, GRID_W, STAR_HUNT_TICKS } from "../core/constants";
import type { HuntToolId, ToolId } from "../core/level";
import type { LevelResult } from "../core/world";
import styles from "../last-pixel.module.css";
import { FINAL_LEVEL, getLevel, levelLabel, nextLevelId, worldOf } from "../levels";
import { initialHud, Runtime, type Hud } from "../play/runtime";
import { lastPixelSave } from "../save";
import { clock, PausePanel, ProgressPanel, ToolBar } from "./Hud";
import { Logo } from "./Logo";
import { OptionsDialog } from "./Menus";

/** How a level went, once it's saved. */
export interface Recorded {
  /** Stars this time and best ever (bits). */
  stars: number;
  best: number;
  newBestClean: boolean;
  newBestHunt: boolean;
  assisted: boolean;
}

export interface PlayProps {
  levelId: string;
  onDone(levelId: string, result: LevelResult, stars: [boolean, boolean, boolean]): Recorded;
  onNext(levelId: string): void;
  onLevels(): void;
}

type Phase = "start" | "play" | "paused" | "cleared";

function Stars({ bits, label }: { bits: number; label?: string }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={label ?? `${(bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)} of 3 stars`}>
      {[0, 1, 2].map((k) => (
        <span key={k} className={styles.star} data-on={bits & (1 << k) ? "" : undefined} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

export { Stars };

export function PlayScreen({ levelId, onDone, onNext, onLevels }: PlayProps) {
  const save = useSave(lastPixelSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const [hideRotate, setHideRotate] = useState(false);
  const level = getLevel(levelId);
  const { area, frame } = useFitCanvas(GRID_W, GRID_H, "--lp-scale");
  const root = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const overlay = useRef<HTMLDivElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [phase, setPhaseState] = useState<Phase>("start");
  const phaseRef = useRef<Phase>("start");
  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };
  const [cleared, setCleared] = useState<(Recorded & { result: LevelResult }) | null>(null);
  const [options, setOptions] = useState(false);
  const prefs = save.prefs;

  const done = useEffectEvent((result: LevelResult, stars: [boolean, boolean, boolean]) => {
    const recorded = onDone(levelId, result, stars);
    setCleared({ ...recorded, result });
    setPhase("cleared");
    if (!comfort.reducedMotion) {
      void import("canvas-confetti").then(({ default: confetti }) => {
        const r = frame.current?.getBoundingClientRect();
        const origin = r ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height * 0.45) / window.innerHeight } : { x: 0.5, y: 0.5 };
        void confetti({ particleCount: 110, spread: 75, origin, colors: ["#6F5BF2", "#FF9E7D", "#FFD23F", "#B7ABFF", "#FFFFFF"], disableForReducedMotion: true });
      });
    }
  });
  const motion = useEffectEvent(() => comfort.reducedMotion);

  // One runtime per level.
  useEffect(() => {
    if (!root.current || !frame.current || !canvas.current || !overlay.current) return;
    const p = lastPixelSave.get().prefs;
    const created = new Runtime(
      root.current,
      frame.current,
      canvas.current,
      overlay.current,
      { level: getLevel(levelId), assist: p.assist, zoom: p.zoom, beeps: p.beeps, reduceMotion: () => motion() },
      hudStore,
      { onDone: (result, stars) => done(result, stars) },
    );
    runtime.current = created;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __lp?: unknown }).__lp = { runtime: created };
    created.start();
    if (phaseRef.current === "play") created.resume();
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [levelId, hudStore, frame]);

  useEffect(() => {
    runtime.current?.setPrefs({ assist: prefs.assist, zoom: prefs.zoom, beeps: prefs.beeps });
  }, [prefs]);

  const start = () => {
    setPhase("play");
    runtime.current?.resume();
  };
  const pause = () => {
    if (phaseRef.current !== "play") return;
    runtime.current?.pause();
    setPhase("paused");
  };
  const restart = () => {
    setCleared(null);
    runtime.current?.restart();
    setPhase("play");
    runtime.current?.resume();
  };
  const next = () => {
    setCleared(null);
    setPhase("start");
    onNext(levelId);
  };
  const measure = () => runtime.current?.measure();

  // Looking away (another tab): pause, and tell Pix (it might be hiding in the tab's icon).
  const looked = useEffectEvent((hidden: boolean) => {
    runtime.current?.visibility(hidden);
    if (hidden) pause();
  });
  useEffect(() => onTabVisibility((hidden) => looked(hidden)), []);

  const hunting = hud.phase === "hunt" || hud.phase === "wake" || hud.phase === "escaped";

  // Keys: Esc or P pause, R restarts, 1–4 the tools (or the hunt tools), M the magnifier, F freeze, B bait, N net.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || document.querySelector("[role=dialog]")) return;
    const rt = runtime.current;
    if (!rt) return;
    if ((event.code === "Escape" || event.code === "KeyP") && phaseRef.current === "play") {
      event.preventDefault();
      pause();
      return;
    }
    if (phaseRef.current !== "play") return;
    const n = Number(event.key);
    if (event.code === "KeyR") rt.restart();
    else if (event.code === "KeyM") rt.setLens();
    else if (hunting && event.code === "KeyF") rt.selectHuntTool("freeze");
    else if (hunting && event.code === "KeyB") rt.selectHuntTool("bait");
    else if (hunting && event.code === "KeyN") rt.selectHuntTool("net");
    else if (n >= 1 && n <= 4) {
      if (hunting) rt.selectHuntTool((["catch", "net", "bait", "freeze"] as const)[n - 1]!);
      else if (level.tools[n - 1]) rt.selectTool(level.tools[n - 1]!);
    } else return;
    event.preventDefault();
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const world = worldOf(levelId);
  const playing = phase === "play";
  const target = level.target;

  return (
    <div
      ref={root}
      className={cn(styles.root, styles.area)}
      aria-label={`${level.name}, Last Pixel`}
      data-game-area
      data-level={levelId}
      data-phase={phase}
      data-sim={hud.phase}
      data-ready={hud.ready ? "" : undefined}
      data-progress={hud.progress}
    >
      <div className={styles.bar}>
        <button type="button" className={cn(styles.button, "!px-2.5 !py-1 text-sm")} onClick={onLevels} data-levels>
          <ChevronLeft className="size-4" aria-hidden /> Levels
        </button>
        <Logo complete={save.finished} spot className="text-[1.45rem]" />
        <span className="min-w-0 truncate text-[0.95rem] font-bold opacity-80">
          {levelLabel(levelId)} · {level.name}
        </span>
      </div>

      <div ref={area} className={styles.stageWrap}>
        <div ref={frame} className={styles.stage} style={{ width: GRID_W * 6, height: GRID_H * 6 }} data-painting={hud.painting ? "" : undefined} data-hide-cursor={playing && !coarse ? "" : undefined}>
          <canvas ref={canvas} className={styles.canvas} aria-hidden />
          <ProgressPanel hud={hud} grab={hunting} onMoved={measure} />
          <ToolBar
            hud={hud}
            tools={level.tools}
            kit={level.hunt}
            grab={hunting}
            onTool={(t: ToolId) => runtime.current?.selectTool(t)}
            onHunt={(t: HuntToolId) => runtime.current?.selectHuntTool(t)}
            onLens={() => runtime.current?.setLens()}
            onMoved={measure}
          />
          <PausePanel hud={hud} grab={hunting} onPause={pause} onMoved={measure} />
          <p className="sr-only" aria-live="polite" data-message>
            {hud.message}
          </p>

          {(phase === "start" || phase === "paused") && (
            <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
              <section className={styles.card} aria-labelledby="lp-card-title" data-overlay={phase}>
                <p className="text-sm font-bold uppercase tracking-wide opacity-70">
                  {phase === "paused" ? "Paused" : `${world.id === 5 ? "The finale" : `World ${world.id} · ${world.name}`}`}
                </p>
                <h2 id="lp-card-title" className="text-[1.7rem] font-extrabold leading-tight">
                  {phase === "paused" ? `${hud.progress} done` : level.name}
                </h2>
                <p className="mt-1 leading-snug">{phase === "paused" ? "Take your time. Whatever's left will still be here." : level.hint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={cn(styles.button, styles.primary)} onClick={start} autoFocus data-start>
                    <PlayIcon className="size-4" aria-hidden /> {phase === "paused" ? "Carry on" : "Start"}
                  </button>
                  {phase === "paused" && (
                    <>
                      <button type="button" className={styles.button} onClick={restart} data-restart>
                        <RotateCcw className="size-4" aria-hidden /> Restart
                      </button>
                      <button type="button" className={styles.button} onClick={() => setOptions(true)}>
                        <Settings2 className="size-4" aria-hidden /> Options
                      </button>
                      <button type="button" className={styles.button} onClick={onLevels}>
                        <LayoutGrid className="size-4" aria-hidden /> Levels
                      </button>
                    </>
                  )}
                </div>
                {phase === "start" && (
                  <p className="mt-3 text-sm opacity-70">
                    {coarse ? "Drag to paint. Tap to catch." : "Drag to use the tool. Click to catch. Esc pauses."} Clean-up star: under {clock(target)}.
                  </p>
                )}
              </section>
            </div>
          )}

          {phase === "cleared" && cleared && (
            <div className={styles.overlay} onPointerDown={(e) => e.stopPropagation()}>
              <section className={styles.card} aria-labelledby="lp-done-title" data-cleared>
                <h2 id="lp-done-title" className="text-[2rem] font-extrabold leading-none">
                  100%!
                </h2>
                <div className="mt-2">
                  <Stars bits={cleared.stars} />
                </div>
                <ul className="mt-2 grid gap-0.5 text-[0.95rem]">
                  <li>★ Every last pixel.</li>
                  <li className={cleared.stars & 2 ? "" : "opacity-60"}>
                    ★ Clean-up {clock(cleared.result.cleanTicks)} (under {clock(target)}){cleared.newBestClean && " · best yet!"}
                  </li>
                  <li className={cleared.stars & 4 ? "" : "opacity-60"}>
                    ★ Pix caught in {clock(cleared.result.huntTicks)} (under {clock(STAR_HUNT_TICKS * (level.rounds ? level.rounds.length + 1 : 1))}){cleared.assisted && " · hunt assist on"}
                  </li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(nextLevelId(levelId) || levelId === FINAL_LEVEL) && (
                    <button type="button" className={cn(styles.button, styles.primary)} onClick={next} autoFocus data-next>
                      <SkipForward className="size-4" aria-hidden /> {levelId === FINAL_LEVEL ? "The logo…" : "Next"}
                    </button>
                  )}
                  <button type="button" className={styles.button} onClick={restart} data-retry>
                    <RotateCcw className="size-4" aria-hidden /> Again
                  </button>
                  <button type="button" className={styles.button} onClick={onLevels}>
                    <LayoutGrid className="size-4" aria-hidden /> Levels
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Pix, when it's off the canvas (the runtime moves it). */}
      <div ref={overlay} className={styles.pix} hidden aria-hidden data-pix-overlay />

      {coarse && portrait && !hideRotate && (
        <div className={cn(styles.card, "absolute inset-x-3 top-14 z-[5] flex w-auto items-center gap-3 !p-3")} role="status" onPointerDown={(e) => e.stopPropagation()}>
          <RotateCw className="size-5 shrink-0" aria-hidden />
          <span className="flex-1 text-[0.95rem]">Turn your phone sideways for a bigger canvas.</span>
          <button type="button" className={styles.tool} onClick={() => setHideRotate(true)} aria-label="Dismiss">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <OptionsDialog open={options} onOpenChange={setOptions} />
    </div>
  );
}
