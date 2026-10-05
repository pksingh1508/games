"use client";

// The play screen (Plan/11-panic-stack.md §8.3–§8.4): the bar along the top (the clock, the three fall marks,
// the panic meter), the canvas with the belt and the tower, event warnings (an icon, words and a countdown),
// the 3… 2… 1… while the tower holds, tap-test captions, the turn / Oops / Drop buttons, and the cards: start,
// paused, cleared (stars) or failed (with Oops, if you've still got it).
import {
  ChevronLeft,
  CloudLightning,
  Cat,
  Bird,
  Droplets,
  Flag,
  Gauge,
  Lightbulb,
  Map as MapIcon,
  MoveHorizontal,
  Pause,
  Play as PlayIcon,
  RotateCcw,
  RotateCw,
  Shuffle,
  Siren,
  Snowflake,
  Sparkles,
  Timer,
  Undo2,
  Wind,
  Waves,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { onTabVisibility } from "@/engine/browser/tab";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort } from "@/games/shared/device";
import { shareResult } from "@/games/shared/share";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { MAX_FALLS } from "../core/constants";
import { EVENTS } from "../core/events";
import { ITEMS } from "../core/items";
import type { EventKind, LevelDef } from "../core/level";
import type { Mode } from "../core/sim";
import { locationOf, newIn } from "../levels";
import styles from "../panic-stack.module.css";
import { initialHud, Runtime, type Hud, type RunResult } from "../play/runtime";
import { countStars, MEDALS, shareText } from "../progress";
import { panicStackSave } from "../save";
import { OptionsDialog } from "./Menus";

const EVENT_ICONS: Record<EventKind, LucideIcon> = {
  earthquake: Waves,
  wind: Wind,
  cat: Cat,
  tilt: Gauge,
  lowGravity: Sparkles,
  iceAge: Snowflake,
  bird: Bird,
  platformShrink: MoveHorizontal,
  lightsOut: Lightbulb,
  fakePanic: Siren,
  reskin: Shuffle,
  conveyorRush: CloudLightning,
};

/** How a run went, once it's saved. */
export interface Recorded {
  /** Stars this time and best ever (bits), for levels. */
  stars: number;
  best: number;
  newBest: boolean;
  /** Endless and the Daily Stack: metres this time and best. */
  height?: number;
  bestHeight?: number;
}

export interface PlayProps {
  mode: Mode;
  level: LevelDef;
  seed: number;
  /** The Daily Stack's number. */
  daily?: number;
  zen: boolean;
  onDone(result: RunResult): Recorded;
  onNext: (() => void) | null;
  onMap(): void;
  onMeet(what: string, known: boolean): void;
  onStat(stat: "placed" | "fallen" | "broken" | "fakePanics" | "taps" | "oopses"): void;
}

type Phase = "start" | "play" | "paused" | "end";

export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function Stars({ bits, label, small = false }: { bits: number; label?: string; small?: boolean }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={label ?? `${countStars(bits)} of 3 stars`}>
      {[0, 1, 2].map((k) => (
        <span key={k} className={cn(styles.star, small && "!text-base")} data-on={bits & (1 << k) ? "" : undefined} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

const LOSE_TEXT = {
  falls: "Three things fell.",
  time: "Time's up.",
  broke: "Something fragile broke.",
} as const;

export function PlayScreen({ mode, level, seed, daily, zen, onDone, onNext, onMap, onMeet, onStat }: PlayProps) {
  const save = useSave(panicStackSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const stage = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const beltLayer = useRef<HTMLDivElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [phase, setPhaseState] = useState<Phase>("start");
  const phaseRef = useRef<Phase>("start");
  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };
  const [ended, setEnded] = useState<(Recorded & { result: RunResult }) | null>(null);
  const [options, setOptions] = useState(false);
  const [shared, setShared] = useState<string | null>(null);
  const prefs = save.prefs;

  const done = useEffectEvent((result: RunResult) => {
    const recorded = onDone(result);
    setEnded({ ...recorded, result });
    setPhase("end");
    if (result.status === "won" && !comfort.reducedMotion) {
      void import("canvas-confetti").then(({ default: confetti }) => {
        void confetti({ particleCount: 110, spread: 80, origin: { x: 0.5, y: 0.35 }, colors: ["#B8460C", "#FFD23F", "#E63946", "#2B7FFF", "#FFFFFF"], disableForReducedMotion: true });
      });
    }
  });
  const meet = useEffectEvent((what: string, known: boolean) => onMeet(what, known));
  const stat = useEffectEvent((s: Parameters<PlayProps["onStat"]>[0]) => onStat(s));
  const motion = useEffectEvent(() => comfort.reducedMotion);
  const flashing = useEffectEvent(() => comfort.reduceFlashing);
  const shake = useEffectEvent(() => !panicStackSave.get().prefs.reduceShake);
  const holdToDrop = useEffectEvent(() => panicStackSave.get().prefs.holdToDrop);

  // One runtime per level (and per attempt at the Daily Stack or Endless).
  useEffect(() => {
    if (!stage.current || !canvas.current) return;
    const p = panicStackSave.get().prefs;
    const created = new Runtime(
      stage.current,
      canvas.current,
      beltLayer.current,
      {
        level,
        mode,
        seed,
        zen: mode === "level" && zen,
        slowBelt: p.slowBelt,
        holdToDrop: () => holdToDrop(),
        shake: () => shake(),
        reduceMotion: () => motion(),
        reduceFlashing: () => flashing(),
      },
      hudStore,
      {
        onEnd: (result) => done(result),
        onMeet: (what, known) => meet(what, known),
        onStat: (s) => stat(s),
      },
    );
    runtime.current = created;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __ps?: unknown }).__ps = { runtime: created };
    created.start();
    if (phaseRef.current === "play") created.resume();
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [level, mode, seed, zen, hudStore]);

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
    setEnded(null);
    setShared(null);
    runtime.current?.restart();
    setPhase("play");
    runtime.current?.resume();
  };
  const oops = () => {
    const rt = runtime.current;
    if (!rt || !rt.oops()) return;
    if (phaseRef.current === "end") {
      setEnded(null);
      setPhase("play");
      rt.resume();
    }
  };

  // Looking away pauses.
  const looked = useEffectEvent((hidden: boolean) => {
    if (hidden) pause();
  });
  useEffect(() => onTabVisibility((hidden) => looked(hidden)), []);

  // Keys: Esc or P pause (and carry on), R starts again from a card.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || document.querySelector("[role=dialog]")) return;
    if (event.code === "Escape" || event.code === "KeyP") {
      event.preventDefault();
      if (phaseRef.current === "play") pause();
      else if (phaseRef.current === "paused") start();
      return;
    }
    if (event.code === "KeyR" && (phaseRef.current === "paused" || phaseRef.current === "end")) {
      event.preventDefault();
      restart();
    }
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const location = mode === "level" ? locationOf(level.id) : null;
  const fresh = mode === "level" ? newIn(level.id) : { items: [], events: [] };
  const rotateButtons = prefs.rotateButtons === "on" || (prefs.rotateButtons === "auto" && coarse);
  const playing = phase === "play";
  const event = hud.event;
  const EventIcon = event ? (event.siren ? Siren : EVENT_ICONS[event.kind]) : null;
  const title = mode === "level" ? `${level.id} · ${level.name}` : mode === "endless" ? "Endless Tower" : `Daily Stack #${daily ?? ""}`;
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/games/panic-stack`;

  return (
    <div className={cn(styles.root, styles.area)} aria-label={`${title}, Panic Stack`} data-game-area data-level={level.id} data-mode={mode} data-phase={phase} data-status={hud.status} data-ready={hud.ready ? "" : undefined} data-falls={hud.falls} data-top={hud.top}>
      <div className={styles.bar} data-hud>
        <button type="button" className={cn(styles.btn, "!px-2.5 !py-1 text-sm")} onClick={onMap} aria-label={mode === "level" ? "Map" : "Title"} data-map>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="max-sm:hidden">{mode === "level" ? "Map" : "Title"}</span>
        </button>
        <span className="min-w-0 flex-1 truncate font-black">
          <span className="sm:hidden">{mode === "level" ? level.id : ""}</span>
          <span className="max-sm:hidden">{title}</span>
          {zen && mode === "level" && (
            <span className="ml-2 rounded-full border-2 border-current px-2 text-xs" data-zen>
              ZEN
            </span>
          )}
        </span>
        {mode === "level" && !zen && hud.timeLeft !== null && (
          <span className={styles.stat} aria-label={`${hud.timeLeft} seconds left`} data-clock>
            <Timer className="size-4" aria-hidden />
            {clock(hud.timeLeft)}
          </span>
        )}
        {mode !== "level" && (
          <span className={styles.stat} data-height>
            <Flag className="size-4" aria-hidden />
            {hud.top.toFixed(1)} m <span className="text-sm opacity-60 max-sm:hidden">best {hud.best.toFixed(1)}</span>
            {mode === "daily" && hud.timeLeft !== null && <span className="ml-1 text-sm">· {clock(hud.timeLeft)}</span>}
          </span>
        )}
        {!(zen && mode === "level") && (
          <>
            <span className={styles.falls} role="img" aria-label={`${hud.falls} of ${MAX_FALLS} falls`} data-fall-marks>
              {Array.from({ length: MAX_FALLS }, (_, k) => (
                <span key={k} className={styles.fall} data-on={k < hud.falls ? "" : undefined} aria-hidden>
                  {k < hud.falls ? "✕" : ""}
                </span>
              ))}
            </span>
            <span className={styles.stat} title="Panic">
              <Siren className="size-4 sm:hidden" aria-hidden />
              <span className="text-xs max-sm:hidden">PANIC</span>
              <span className={styles.meter} role="meter" aria-label="Panic" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hud.panic} data-panic={hud.panic}>
                <span style={{ width: `${hud.panic}%` }} />
              </span>
              <span className="w-9 text-sm tabular-nums max-sm:hidden">{hud.panic}%</span>
            </span>
          </>
        )}
        <button type="button" className={cn(styles.btn, "!px-2.5 !py-1")} onClick={pause} aria-label="Pause (Esc)" disabled={!playing} data-pause>
          <Pause className="size-4" aria-hidden />
        </button>
      </div>

      <div ref={stage} className={styles.stage} data-stage>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />
        <div ref={beltLayer} className={styles.beltLayer} aria-hidden data-belt-layer />
        <p className="sr-only" aria-live="polite" data-message>
          {hud.message}
        </p>
        <p className="sr-only" data-belt-summary>
          On the belt, nearest the end first: {hud.beltNames || "nothing yet"}. {hud.holdingItem ? `You're holding the ${hud.holdingItem}. ` : ""}
          The tower is {hud.top.toFixed(1)} m tall{mode === "level" ? ` of the ${level.goal.toFixed(1)} m line` : ""}.
        </p>

        {playing && event && EventIcon && (
          <div className={styles.banner} data-phase={event.phase} data-siren={event.siren ? "" : undefined} data-event={event.kind} data-hud>
            <EventIcon className="size-7 shrink-0" aria-hidden />
            <span className="leading-tight">{event.text}</span>
            {event.phase === "warn" && event.left > 0 && <span className={styles.countdown}>{event.left}</span>}
          </div>
        )}
        {playing && hud.holding > 0 && <span hidden data-holding={hud.holding} />}
        {hud.caption && (
          <div className={styles.caption} style={{ left: hud.caption.x, top: hud.caption.y }} data-caption>
            {hud.caption.text}
          </div>
        )}
        {hud.xray && playing && (
          <div className={cn(styles.banner, "!bottom-auto top-3")} data-hud>
            <Sparkles className="size-5" aria-hidden /> X-ray: true shapes and weights
          </div>
        )}

        {playing && (
          <>
            {rotateButtons && (
              <div className={cn(styles.controls, "left-3")} data-hud>
                <button type="button" className={styles.round} onClick={() => runtime.current?.rotate(1)} aria-label="Turn left (Q)" disabled={!hud.holdingItem} data-rotate="left">
                  <RotateCcw className="size-6" aria-hidden />
                </button>
                <button type="button" className={styles.round} onClick={() => runtime.current?.rotate(-1)} aria-label="Turn right (E)" disabled={!hud.holdingItem} data-rotate="right">
                  <RotateCw className="size-6" aria-hidden />
                </button>
              </div>
            )}
            <div className={cn(styles.controls, "right-3")} data-hud>
              {prefs.holdToDrop && hud.holdingItem && (
                <button type="button" className={cn(styles.btn, styles.primary)} onClick={() => runtime.current?.drop()} data-drop>
                  Drop
                </button>
              )}
              <button type="button" className={styles.round} onClick={oops} aria-label={hud.oopsUsed ? "Oops (used)" : "Oops: undo the last drop, once (Space)"} disabled={!hud.canOops} data-oops>
                <Undo2 className="size-6" aria-hidden />
                {!hud.oopsUsed && !zen && <span className={styles.badge}>1</span>}
              </button>
            </div>
          </>
        )}

        {(phase === "start" || phase === "paused") && (
          <div className={styles.overlay}>
            <section className={styles.card} aria-labelledby="ps-card-title" data-card={phase}>
              <p className="text-sm font-bold uppercase tracking-wide opacity-70">
                {phase === "paused" ? "Paused" : location ? `${location.number}. ${location.name}` : mode === "endless" ? "Endless Tower" : `Daily Stack #${daily ?? ""}`}
              </p>
              <h2 id="ps-card-title" className={cn(styles.display, "mt-1 text-[1.9rem]")}>
                {phase === "paused" ? title : mode === "level" ? level.name : mode === "endless" ? "How high?" : "Two minutes"}
              </h2>
              {phase === "start" && (
                <>
                  <p className="mt-2 leading-snug">{level.hint}</p>
                  {mode === "level" && (
                    <p className="mt-2 text-sm font-bold">
                      Goal: {level.goal.toFixed(1)} m{!zen && ` · ${clock(level.time)} on the clock`} · three falls and it&apos;s over{zen && " (not in Zen)"}
                    </p>
                  )}
                  {(fresh.items.length > 0 || fresh.events.length > 0) && (
                    <p className="mt-2 text-sm" data-new>
                      <strong>New here:</strong> {[...fresh.items.map((k) => (k === "xray" ? "X-ray glasses" : ITEMS[k].name)), ...fresh.events.map((e) => EVENTS[e].name)].join(", ")}
                    </p>
                  )}
                  <p className="mt-2 text-sm opacity-75">
                    {coarse ? "Touch and hold an item on the belt to pick it up; tap it to hear what it's made of." : "Click and hold an item on the belt to pick it up; click it once to hear what it's made of. Q / E turn it."}
                  </p>
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={cn(styles.btn, styles.primary)} onClick={start} autoFocus data-start>
                  <PlayIcon className="size-4" aria-hidden /> {phase === "paused" ? "Carry on" : "Start"}
                </button>
                {phase === "paused" && (
                  <>
                    <button type="button" className={styles.btn} onClick={restart} data-restart>
                      <RotateCcw className="size-4" aria-hidden /> Start again
                    </button>
                    <button type="button" className={styles.btn} onClick={() => setOptions(true)}>
                      Options
                    </button>
                    <button type="button" className={styles.btn} onClick={onMap}>
                      <MapIcon className="size-4" aria-hidden /> Map
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {phase === "end" && ended && (
          <div className={styles.overlay}>
            <section className={styles.card} aria-labelledby="ps-end-title" data-end={ended.result.status}>
              {ended.result.status === "won" ? (
                <>
                  <h2 id="ps-end-title" className={cn(styles.display, "text-[2.2rem]")}>
                    It held!
                  </h2>
                  <div className="mt-2" data-stars={countStars(ended.stars)}>
                    <Stars bits={ended.stars} />
                  </div>
                  <ul className="mt-2 grid gap-0.5 text-[0.95rem]">
                    <li>★ Up to the line, and held still.</li>
                    <li className={ended.stars & 2 ? "" : "opacity-60"}>★ Nothing fell{ended.result.falls ? ` (${ended.result.falls} did)` : ""}.</li>
                    <li className={ended.stars & 4 ? "" : "opacity-60"}>
                      ★ More than half the time left ({clock(ended.result.ticks / 60)} of {clock(ended.result.limit / 60)}){ended.newBest && " · best yet!"}
                    </li>
                  </ul>
                  {ended.result.zen && <p className="mt-2 text-sm">Zen clears earn the first star. Play it with the clock for the other two.</p>}
                </>
              ) : mode === "level" ? (
                <>
                  <h2 id="ps-end-title" className={cn(styles.display, "text-[2rem]")}>
                    {ended.result.lost ? LOSE_TEXT[ended.result.lost] : "Over"}
                  </h2>
                  <p className="mt-2">
                    {ended.result.lost === "broke" ? "It was fragile. Lower things gently onto it, and it onto things." : ended.result.lost === "time" ? "Build up to the line and hold it still for three seconds." : "Every item that falls off the platform, or off the end of the belt, counts."}
                  </p>
                </>
              ) : (
                <>
                  <h2 id="ps-end-title" className={cn(styles.display, "text-[2rem]")}>
                    {(ended.height ?? 0).toFixed(1)} m
                  </h2>
                  <p className="mt-1">
                    {mode === "daily" ? `Daily Stack #${daily ?? ""}: your best today is ${(ended.bestHeight ?? 0).toFixed(1)} m.` : `Your best Endless Tower: ${(ended.bestHeight ?? 0).toFixed(1)} m.`}
                    {ended.newBest && " New best!"}
                  </p>
                  {mode === "endless" && (
                    <p className="mt-1 font-bold" data-medals>
                      {MEDALS.map((m) => (
                        <span key={m} className={cn("mr-2", (ended.height ?? 0) >= m ? "" : "opacity-35")}>
                          ★ {m} m
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="mt-1 text-sm opacity-75">Heights count once they&apos;ve held still for three seconds.</p>
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {ended.result.status === "won" && onNext && (
                  <button type="button" className={cn(styles.btn, styles.primary)} onClick={onNext} autoFocus data-next>
                    Next level
                  </button>
                )}
                {ended.result.status !== "won" && mode === "level" && hud.canOops && (
                  <button type="button" className={cn(styles.btn, styles.yellow)} onClick={oops} autoFocus data-oops-card>
                    <Undo2 className="size-4" aria-hidden /> Oops! Undo that drop
                  </button>
                )}
                <button type="button" className={cn(styles.btn, ended.result.status !== "won" && !hud.canOops && styles.primary)} onClick={restart} data-retry>
                  <RotateCcw className="size-4" aria-hidden /> {ended.result.status === "won" ? "Again" : "Try again"}
                </button>
                {mode !== "level" && (
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={async () => {
                      const outcome = await shareResult(shareText(mode, ended.height ?? 0, daily ?? null, url));
                      setShared(outcome === "copied" ? "Copied!" : outcome === "shared" ? "Shared!" : "Couldn't share.");
                    }}
                    data-share
                  >
                    <Share2 className="size-4" aria-hidden /> Share
                  </button>
                )}
                <button type="button" className={styles.btn} onClick={onMap}>
                  <MapIcon className="size-4" aria-hidden /> {mode === "level" ? "Map" : "Title"}
                </button>
              </div>
              {shared && (
                <p className="mt-2 text-sm font-bold" role="status">
                  {shared}
                </p>
              )}
              {ended.result.status !== "won" && mode === "level" && (
                <p className="mt-3 flex items-center gap-1.5 text-sm opacity-75">
                  <Droplets className="size-4" aria-hidden /> Tap things on the belt before you trust them.
                </p>
              )}
            </section>
          </div>
        )}
      </div>

      <OptionsDialog open={options} onOpenChange={setOptions} />
    </div>
  );
}
