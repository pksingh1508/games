"use client";

// The climb view (Plan/08-almost-there.md §8.2–8.4): the screen Pip is on, full size, with a minimal
// HUD: the progress bar on the right edge (it lies) and Chirp's speech bubble. The pause menu has
// the honest altitude. On a phone: arrows on one side, a big jump button on the other.
import { Flag, Home, Pause, Play as PlayIcon, RotateCw, Settings2, Shirt, Undo2, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { useFitCanvas } from "@/games/shared/fit";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import styles from "../almost-there.module.css";
import { cloneWhole, type Climb } from "../core/climb";
import { VIEW_H, VIEW_W } from "../core/constants";
import type { Mountain } from "../core/mountain";
import { altitude, bestAltitude, formatClock, formatMetres, pxToMetres } from "../core/progress";
import { countFeathers, FEATHER_COUNT } from "../core/records";
import { initialHud, Runtime, type Action, type Hud } from "../play/runtime";
import { almostThereSave, assistOn } from "../save";
import { zoneInfo } from "../world";
import { OptionsPanel, Wardrobe } from "./Menus";

export interface PlayProps {
  mountain: Mountain;
  climb: Climb;
  resumed: boolean;
  onJump(): void;
  onFall(drop: number): void;
  onFeather(index: number): void;
  onFakeSummit(): void;
  onSummit(climb: Climb): void;
  onQuit(): void;
}

const TOUCH_SIZE = { s: 64, m: 80, l: 96 } as const;

/** The fake credits (Plan §5): everyone who helped… so far. */
const CREDIT_LINES: Array<[string, string]> = [
  ["A Game About", "Almost"],
  ["Climbing", "You"],
  ["Encouragement", "Chirp"],
  ["Physics", "Gravity"],
  ["Level Design", "The Mountain"],
  ["Progress Bar", "Did Its Best"],
  ["Catering", "Pip's Backpack"],
  ["Special Thanks", "Everyone Who Fell"],
];

export function PlayScreen({ mountain, climb, resumed, onJump, onFall, onFeather, onFakeSummit, onSummit, onQuit }: PlayProps) {
  const save = useSave(almostThereSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const { area, frame } = useFitCanvas(VIEW_W, VIEW_H, "--at-scale");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const clock = useRef<HTMLSpanElement | null>(null);
  const chirpBubble = useRef<HTMLDivElement | null>(null);
  const signBubble = useRef<HTMLDivElement | null>(null);
  const roll = useRef<HTMLDListElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [menu, setMenu] = useState<"pause" | "options" | "wardrobe" | null>(null);
  const [hideRotate, setHideRotate] = useState(false);
  const [snapshot, setSnapshot] = useState<Climb | null>(null);

  const openMenu = () => {
    runtime.current?.pause();
    setSnapshot(runtime.current ? cloneWhole(runtime.current.climb) : null);
    setMenu("pause");
  };
  const closeMenu = () => {
    setMenu(null);
    runtime.current?.resume();
    area.current?.focus({ preventScroll: true });
  };

  const jumped = useEffectEvent(() => onJump());
  const fell = useEffectEvent((drop: number) => onFall(drop));
  const feather = useEffectEvent((index: number) => onFeather(index));
  const fake = useEffectEvent(() => onFakeSummit());
  const summit = useEffectEvent((c: Climb) => onSummit(c));
  const togglePause = useEffectEvent(() => {
    if (menu) closeMenu();
    else openMenu();
  });
  const reducedMotion = useEffectEvent(() => comfort.reducedMotion);

  // One runtime per visit.
  useEffect(() => {
    if (!canvas.current) return;
    const prefs = almostThereSave.get().prefs;
    const created = new Runtime(
      canvas.current,
      {
        mountain,
        climb,
        resumed,
        seenCredits: almostThereSave.get().seen.fakeSummit,
        assist: prefs.assist,
        keys: prefs.keys,
        hat: almostThereSave.get().hat,
        vibrate: prefs.vibrate,
        reducedMotion: () => reducedMotion(),
      },
      hudStore,
      {
        onPauseToggle: () => togglePause(),
        onJump: () => jumped(),
        onFall: (drop) => fell(drop),
        onFeather: (index) => feather(index),
        onFakeSummit: () => fake(),
        onSummit: (c) => summit(c),
      },
    );
    runtime.current = created;
    // Dev builds only: a handle for the QA scripts.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __at?: unknown }).__at = {
        runtime: created,
        routes: () => import("../world/routes"),
        replay: () => import("@/engine/replay"),
        climb: () => import("../core/climb"),
      };
    }
    created.bind({ clock: clock.current, chirp: chirpBubble.current, sign: signBubble.current, credits: roll.current });
    created.start();
    area.current?.focus({ preventScroll: true });
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [mountain, climb, resumed, hudStore, area]);

  // Options changed (from the pause menu): apply them now.
  useEffect(() => {
    runtime.current?.setPrefs({ assist: save.prefs.assist, keys: save.prefs.keys, hat: save.hat, vibrate: save.prefs.vibrate });
  }, [save.prefs, save.hat]);

  // The bubbles and the credits mount and unmount: tell the runtime where they are now.
  useEffect(() => {
    runtime.current?.bind({ chirp: chirpBubble.current, sign: signBubble.current, credits: roll.current, clock: clock.current });
  }, [hud.chirp?.id, hud.sign?.id, hud.credits, save.prefs.clock]);

  const zone = zoneInfo(hud.zone);
  const assisted = assistOn(save.prefs.assist);
  const progress = hud.progress;
  const barValue = progress.kind === "bar" ? progress.value : progress.kind === "done" ? 1 : 0.999;
  const barText = progress.kind === "bar" ? `${Math.floor(progress.value * 100)}%` : progress.kind === "stuck" ? "99.9%" : progress.kind === "broken" ? "Progress bar broke. Sorry." : "100%";

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={cn(styles.root, styles.area)}
      aria-label={`Almost There: ${zone.name}`}
      data-game-area
      data-zone={hud.zone}
      data-story={hud.story}
      data-ready={hud.ready ? "" : undefined}
    >
      <div ref={frame} className={styles.frame}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />

        {/* HUD: where you are, the clock, the bar. */}
        <div className={cn(styles.hud, "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-[calc(var(--at-scale,2)*4px)] text-[clamp(0.7rem,calc(var(--at-scale,2)*6px),1.3rem)]")}>
          <p className="min-w-0 flex-1 truncate leading-tight">
            {zone.name}
            {climb.mirrored && <span className="block text-[0.75em] text-[#a884f3]">Mirror Mountain</span>}
            {assisted && <span className="block text-[0.75em] text-[#30e1b9]">Assist</span>}
          </p>
          {save.prefs.clock && (
            <p className="text-[1.1em] tabular-nums" aria-label="Time">
              <span ref={clock}>0:00.0</span>
            </p>
          )}
          <div className="flex flex-1 items-start justify-end gap-2.5">
            {save.prefs.assist.checkpoints && (
              <>
                <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={() => runtime.current?.plant()} aria-label="Plant a checkpoint (C)" title="Plant a checkpoint (C)">
                  <Flag className="size-4" aria-hidden />
                </button>
                <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={() => runtime.current?.back()} aria-label="Back to your checkpoint (R)" title="Back to your checkpoint (R)">
                  <Undo2 className="size-4" aria-hidden />
                </button>
              </>
            )}
            <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={openMenu} aria-label="Pause (Esc)" title="Pause (Esc)">
              <Pause className="size-4" fill="currentColor" aria-hidden />
            </button>
          </div>
        </div>

        {/* The progress bar. It lies. */}
        <div className={cn(styles.bar, progress.kind === "broken" && styles.barBroken)} role="img" aria-label={`Progress: ${barText}`} data-progress={barText}>
          {progress.kind !== "broken" && <div className={styles.barFill} style={{ height: `${barValue * 100}%` }} />}
          <span className={cn(styles.hud, styles.barLabel)} style={{ bottom: `${progress.kind === "broken" ? 50 : barValue * 100}%` }}>
            {barText}
          </span>
        </div>

        {hud.chirp && (
          <div ref={chirpBubble} key={hud.chirp.id} className={cn(styles.bubble, hud.chirp.mood === "troll" && styles.troll, save.prefs.bigText && styles.big)} data-chirp={hud.chirp.mood}>
            {hud.chirp.text}
          </div>
        )}
        {hud.sign && !hud.credits && (
          <div ref={signBubble} key={`${hud.sign.id}:${hud.sign.text}`} className={cn(styles.bubble, hud.sign.warning ? styles.warningBubble : styles.signBubble, save.prefs.bigText && styles.big)} data-sign>
            {hud.sign.text}
          </div>
        )}

        {hud.credits && <CreditsLayer phase={hud.credits} skippable={hud.skippable} coarse={coarse} rollRef={roll} />}

        <p className="sr-only" aria-live="polite" data-message>
          {hud.message}
        </p>
      </div>

      {coarse && <TouchControls runtime={runtime} size={TOUCH_SIZE[save.prefs.touchSize]} swap={save.prefs.touchSwap} />}

      {coarse && portrait && !hideRotate && (
        <div className="absolute inset-x-3 top-20 z-[5] flex items-center gap-3 rounded-xl bg-[#2e222f]/85 p-3 text-sm font-semibold text-white" role="status">
          <RotateCw className="size-5 shrink-0" aria-hidden />
          <span className="flex-1">Turn your phone sideways for a bigger view.</span>
          <button type="button" className="grid size-9 place-items-center" onClick={() => setHideRotate(true)} aria-label="Dismiss">
            <X className="size-5" aria-hidden />
          </button>
        </div>
      )}

      <Dialog
        open={menu === "pause"}
        onOpenChange={(open) => {
          if (!open) closeMenu();
        }}
        game="almost-there"
        eyebrow={zone.name}
        title="Paused"
        description="Your climb is saved. Every metre of it."
      >
        {snapshot && <HonestStats climb={snapshot} />}
        <div className="mt-5 grid gap-3">
          <button type="button" className="btn btn-lg" onClick={closeMenu} data-sound="click">
            <PlayIcon className="size-5" aria-hidden /> Resume
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setMenu("options")} data-sound="click">
              <Settings2 className="size-4" aria-hidden /> Options
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setMenu("wardrobe")} data-sound="click">
              <Shirt className="size-4" aria-hidden /> Hats
            </button>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setMenu(null);
              onQuit();
            }}
            data-sound="click"
          >
            <Home className="size-4" aria-hidden /> Back to the title
          </button>
        </div>
      </Dialog>
      <Dialog
        open={menu === "options"}
        onOpenChange={(open) => {
          if (!open) setMenu("pause");
        }}
        game="almost-there"
        eyebrow="Almost There"
        title="Options"
        description="Saved on this device. Changes apply straight away."
      >
        <OptionsPanel />
      </Dialog>
      <Dialog
        open={menu === "wardrobe"}
        onOpenChange={(open) => {
          if (!open) setMenu("pause");
        }}
        game="almost-there"
        eyebrow="Almost There"
        title="Hats"
        description="Every Lost Feather is a hat."
      >
        <Wardrobe />
      </Dialog>
    </div>
  );
}

/** The pause menu's numbers: the altitude here is always the truth (Plan §10.6). */
function HonestStats({ climb }: { climb: Climb }) {
  const s = climb.stats;
  const rows: Array<[string, string]> = [
    ["Altitude", formatMetres(altitude(climb))],
    ["Highest so far", formatMetres(bestAltitude(climb))],
    ["Time", formatClock(s.ticks, false)],
    ["Jumps", s.jumps.toLocaleString("en-US")],
    ["Falls", s.falls.toLocaleString("en-US")],
    ["Fallen", formatMetres(pxToMetres(s.fallen))],
    ["Lost Feathers", `${countFeathers(climb.sim.feathers)}/${FEATHER_COUNT}`],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-2xl border p-4 text-sm" data-honest-altitude={Math.round(altitude(climb))}>
      {rows.map(([label, value]) => (
        <div key={label} className={cn("flex items-baseline justify-between gap-3", label === "Altitude" && "col-span-2 text-base")}>
          <dt className="text-muted-surface">{label}</dt>
          <dd className="font-mono font-bold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CreditsLayer({ phase, skippable, coarse, rollRef }: { phase: NonNullable<Hud["credits"]>; skippable: boolean; coarse: boolean; rollRef: RefObject<HTMLDListElement | null> }) {
  return (
    <div className={styles.creditsLayer} data-credits={phase}>
      {phase === "end" && <p className={styles.theEnd}>THE END</p>}
      {phase === "roll" && (
        <dl ref={rollRef} className={styles.roll} style={{ transform: "translateY(100%)" }}>
          <dd className="text-[1.6em]">ALMOST THERE</dd>
          {CREDIT_LINES.map(([role, who]) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{who}</dd>
            </div>
          ))}
          <dd className="text-[1.2em]">Thanks for playing… so far</dd>
        </dl>
      )}
      {phase === "kidding" && <p className={styles.kidding}>…just kidding.</p>}
      {skippable && (phase === "end" || phase === "roll") && (
        <p className={cn(styles.silk, "absolute bottom-[6%] right-[4%] text-[clamp(0.55rem,calc(var(--at-scale,2)*4px),0.85rem)] text-white/80")}>{coarse ? "Tap jump to skip" : "Space to skip"}</p>
      )}
    </div>
  );
}

/** Left/right on one pad (slide between them); a big jump button on the other side. */
function TouchControls({ runtime, size, swap }: { runtime: { current: Runtime | null }; size: number; swap: boolean }) {
  const [held, setHeld] = useState<Record<string, boolean>>({});
  const pad = useRef<Map<number, Action | null>>(new Map());

  const set = (action: Action, down: boolean) => {
    if (down) runtime.current?.press(action);
    else runtime.current?.release(action);
    setHeld((h) => ({ ...h, [action]: down }));
  };

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

  const gap = 24;
  const padStyle = { width: size * 2 + 8, height: size, bottom: gap, [swap ? "right" : "left"]: gap };
  const jumpStyle = { width: size * 1.3, height: size * 1.3, bottom: gap, [swap ? "left" : "right"]: gap };

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
        aria-label="Direction (hold one as you let go of jump)"
      >
        {(["left", "right"] as const).map((dir) => (
          <div key={dir} className={styles.touch} style={{ position: "relative", width: size, height: size }} data-held={held[dir] ? "" : undefined} aria-hidden>
            <svg viewBox="0 0 10 10" className="size-1/2" shapeRendering="crispEdges" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={dir === "right" ? 2 + i : 7 - i} y={1 + i} width={1} height={8 - i * 2} fill="#fff" />
              ))}
            </svg>
          </div>
        ))}
      </div>
      <div
        className={cn(styles.touch, styles.silk, "text-sm")}
        style={jumpStyle}
        data-held={held.jump ? "" : undefined}
        role="button"
        aria-label="Jump: hold to charge, let go to leap"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          set("jump", true);
        }}
        onPointerUp={() => set("jump", false)}
        onPointerCancel={() => set("jump", false)}
      >
        JUMP
      </div>
    </>
  );
}
