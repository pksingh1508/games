"use client";

// The play screen (Plan/15-gravity-is-lying.md §8.3): the room fills the screen (the arcade's
// header hides underneath). The HUD: the room, golden apples, deaths and the gravity arrow in the
// top right (it lies in some rooms). Isaac's speech bubble pops up over him when he talks. On touch
// screens there are buttons; when you clear a room, a little card tells you how it went while the
// next room is already starting.
import { Map as MapIcon, Pause, Play as PlayIcon, RotateCcw, RotateCw, Settings2, X } from "lucide-react";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { VIEW_H, VIEW_W } from "../core/constants";
import { formatTime } from "../core/progress";
import type { RoomSession } from "../core/session";
import styles from "../gravity-is-lying.module.css";
import { initialHud, Runtime, type Action, type Hud } from "../play/runtime";
import { getRoom, roomLabel } from "../rooms";
import { assistOn, gravitySave, type ControlMode } from "../save";
import { AppleIcon, ArrowNeedle, SkullIcon } from "./icons";
import { OptionsPanel } from "./Menus";

/** How the room you just left went (shown over the next one). */
export interface RoomToast {
  roomId: string;
  ticks: number;
  /** Golden apples brought through (none counted with assist). */
  apples: number;
  freshApples: number;
  eligible: boolean;
  newBest: boolean;
}

export interface VisitEnd {
  ceilingTicks: number;
  elapsed: number;
}

export interface PlayProps {
  roomId: string;
  toast: RoomToast | null;
  onDeath(roomId: string): void;
  onOrbital(): void;
  onWin(session: RoomSession, info: { assisted: boolean; rotated: boolean }): void;
  /** Leaving the room (any way): time on ceilings and play time to add up. */
  onLeave(visit: VisitEnd): void;
  onMap(): void;
}

const TOUCH_SIZE = { s: 64, m: 78, l: 94 } as const;
/** The buttons' distance from the screen's edges. */
const TOUCH_GAP = 22;

/** The HUD has its own strip, so it never hides part of the room: on top, or (on wide, short screens) at the side. */
const TOP_STRIP = 52;
const SIDE_STRIP = 72;

type Layout = { mode: "top" | "side"; scale: number };

/**
 * Fit the room and its HUD strip into the screen, whichever way round gives the bigger room. On a
 * touch screen the strip goes on top, and the room keeps clear of the buttons at the sides when it
 * can (`reserve`: the space they need on the left and the right).
 */
function useStage(reserve: { left: number; right: number } | null) {
  const area = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<Layout>({ mode: "top", scale: 1 });
  const left = reserve?.left ?? 0;
  const right = reserve?.right ?? 0;
  const touch = reserve !== null;
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const top = Math.min(w / VIEW_W, (h - TOP_STRIP) / VIEW_H);
      let mode: Layout["mode"] = "top";
      let scale = top;
      if (touch) {
        // Between the buttons, unless that would make the room much smaller.
        scale = Math.max(Math.min((w - left - right) / VIEW_W, (h - TOP_STRIP) / VIEW_H), top * 0.8);
      } else {
        const side = Math.min((w - SIDE_STRIP) / VIEW_W, h / VIEW_H);
        if (side > top * 1.03) {
          mode = "side";
          scale = side;
        }
      }
      scale = Math.max(0.4, scale);
      setLayout((now) => (now.mode === mode && Math.abs(now.scale - scale) < 0.001 ? now : { mode, scale }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [touch, left, right]);
  return { area, layout };
}

/** One-time help, for the rooms that bring in something new. */
const HINTS: Record<string, { keys: string; touch: string }> = {
  "1-01": { keys: "← → walk · Space jumps · walk into a lever to pull it · R restarts", touch: "◀ ▶ walk · JUMP jumps · walk into a lever to pull it" },
  "1-04": { keys: "Coloured zones have their own gravity", touch: "Coloured zones have their own gravity" },
  "1-06": { keys: "Watch the water: it always falls the real way down", touch: "Watch the water: it always falls the real way down" },
  "2-01": { keys: "F (or ↓) flips gravity: only when you're standing on something", touch: "FLIP flips gravity: only when you're standing on something" },
  "3-01": { keys: "Watch Newt's scarf", touch: "Watch Newt's scarf" },
  "4-01": { keys: "The camera can turn. Gravity doesn't care", touch: "The camera can turn. Gravity doesn't care" },
  "5-01": { keys: "Planets pull you toward their middle: jump to leap between them", touch: "Planets pull you toward their middle: jump to leap between them" },
};

export function PlayScreen({ roomId, toast, onDeath, onOrbital, onWin, onLeave, onMap }: PlayProps) {
  const save = useSave(gravitySave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const prefsNow = save.prefs;
  const touchSize = TOUCH_SIZE[prefsNow.touchSize];
  const walkWidth = (prefsNow.controls === "screen" ? touchSize * 2.4 : touchSize * 2 + 10) + TOUCH_GAP * 2;
  const jumpWidth = touchSize * 1.1 + TOUCH_GAP * 2;
  // Sideways, the buttons sit either side of the room; upright, they sit underneath it.
  const reserve = coarse && !portrait ? (prefsNow.touchSwap ? { left: jumpWidth, right: walkWidth } : { left: walkWidth, right: jumpWidth }) : null;
  const { area, layout } = useStage(reserve);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const clock = useRef<HTMLSpanElement | null>(null);
  const needle = useRef<SVGSVGElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [menu, setMenu] = useState<"pause" | "options" | null>(null);
  const [hideRotate, setHideRotate] = useState(false);
  const room = getRoom(roomId);
  const record = save.rooms[roomId];
  const prefs = save.prefs;

  const openMenu = () => {
    runtime.current?.pause();
    setMenu("pause");
  };
  const closeMenu = () => {
    setMenu(null);
    runtime.current?.resume();
    area.current?.focus({ preventScroll: true });
  };

  const died = useEffectEvent(() => onDeath(roomId));
  const orbital = useEffectEvent(() => onOrbital());
  const won = useEffectEvent((session: RoomSession) => onWin(session, { assisted: runtime.current?.assisted ?? false, rotated: runtime.current?.rotated ?? false }));
  const left = useEffectEvent((visit: VisitEnd) => onLeave(visit));
  const togglePause = useEffectEvent(() => {
    if (menu) closeMenu();
    else openMenu();
  });
  const reducedMotion = useEffectEvent(() => comfort.reducedMotion);

  // One runtime per visit.
  useEffect(() => {
    if (!canvas.current) return;
    const p = gravitySave.get().prefs;
    const created = new Runtime(
      canvas.current,
      { room: getRoom(roomId), assist: p.assist, controls: p.controls, keys: p.keys, truthMode: p.truthMode && gravitySave.get().finished, reducedMotion: () => reducedMotion() },
      hudStore,
      {
        onDeath: () => died(),
        onOrbital: () => orbital(),
        onWin: (session) => won(session),
        onPauseToggle: () => togglePause(),
      },
    );
    runtime.current = created;
    // Dev builds only: a handle for the QA scripts.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __gil?: unknown }).__gil = { runtime: created, runs: () => import("../rooms/dev-runs"), replay: () => import("@/engine/replay") };
    }
    created.bindClock(clock.current);
    created.bindArrow(needle.current);
    created.start();
    area.current?.focus({ preventScroll: true });
    return () => {
      left({ ceilingTicks: created.session.ceilingTicks, elapsed: created.session.elapsed });
      created.destroy();
      runtime.current = null;
    };
  }, [roomId, hudStore, area]);

  // Options changed (from the pause menu): apply them now.
  const finished = save.finished;
  useEffect(() => {
    runtime.current?.setPrefs({ assist: prefs.assist, controls: prefs.controls, keys: prefs.keys, truthMode: prefs.truthMode && finished });
  }, [prefs, finished]);

  useEffect(() => {
    runtime.current?.bindClock(clock.current);
  }, [prefs.clock]);

  const hint = HINTS[roomId];
  const showHint = hint && !record?.clears && !hud.started && hud.deaths === 0;
  const assisted = assistOn(prefs.assist);
  const truth = prefs.truthMode && finished;

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={cn(styles.root, styles.area)}
      aria-label={`Room ${roomLabel(roomId)}: ${room.name}`}
      data-game-area
      data-room={roomId}
      data-ready={hud.ready ? "" : undefined}
      data-status={hud.status}
    >
      <div
        className={cn(styles.shell, layout.mode === "side" ? "flex-row-reverse" : "flex-col")}
        style={{ "--gil-scale": layout.scale, marginLeft: reserve ? reserve.left - reserve.right : undefined } as React.CSSProperties}
        data-layout={layout.mode}
      >
        {/* HUD: room, clock, apples, deaths, the arrow. */}
        <div
          className={cn(
            styles.hud,
            "flex shrink-0 gap-2 text-[clamp(0.7rem,calc(var(--gil-scale,2)*5.5px),1.05rem)]",
            layout.mode === "top" ? "items-center justify-between px-1" : "flex-col items-center justify-start py-1",
          )}
          style={layout.mode === "top" ? { width: VIEW_W * layout.scale, height: TOP_STRIP } : { width: SIDE_STRIP, height: VIEW_H * layout.scale }}
        >
          <div className={cn("flex min-w-0 items-center gap-1.5", layout.mode === "top" ? "flex-1" : "flex-col")}>
            <p className={cn(styles.chip, "max-w-full truncate leading-tight")} title={room.name}>
              <span>{roomLabel(roomId)}</span>
              {layout.mode === "top" && <span className="truncate font-semibold max-sm:hidden">{room.name}</span>}
            </p>
            {assisted && <span className={cn(styles.chip, "bg-[#FFF4D6] text-[0.8em]")}>Assist</span>}
            {truth && <span className={cn(styles.chip, "bg-[#DFF5E8] text-[0.8em]")}>Truth</span>}
          </div>
          {prefs.clock && (
            <p className={cn(styles.chip, "tabular-nums")} aria-label="Time">
              <span ref={clock}>0.0</span>
            </p>
          )}
          <div className={cn("flex items-center gap-2", layout.mode === "top" ? "flex-1 justify-end" : "flex-1 flex-col")}>
            <p className={cn(styles.chip, "gap-0.5", layout.mode === "side" && "flex-col px-1 py-1.5")} aria-label={`${appleBits(hud.apples)} of 3 golden apples`} data-apples={hud.apples}>
              {[0, 1, 2].map((i) => (
                <AppleIcon key={i} size={15} got={(hud.apples & (1 << i)) !== 0} />
              ))}
            </p>
            <p className={cn(styles.chip, "tabular-nums")} aria-label={`${hud.deaths} ${hud.deaths === 1 ? "death" : "deaths"}`} data-deaths={hud.deaths}>
              <SkullIcon size={13} /> {hud.deaths}
            </p>
            <div className={cn(styles.dial, prefs.assist.trueArrow && styles.trueDial, "size-11")} role="img" aria-label="Gravity arrow" title={prefs.assist.trueArrow ? "The true arrow (assist)" : "Gravity"}>
              {hud.frame !== null ? (
                <span className={styles.tiltFrame} style={{ transform: `rotate(${hud.frame}deg)` }} title="How this room is turned (reduce motion keeps the camera still)" />
              ) : null}
              <ArrowNeedle ref={needle} className={cn(styles.needle, hud.frame !== null && "absolute")} data-needle />
              <span className={styles.zeroG} aria-hidden>
                0g
              </span>
            </div>
            {layout.mode === "side" && <span className="flex-1" aria-hidden />}
            <button type="button" className={cn(styles.hudButton, "size-10")} onClick={() => runtime.current?.restart()} aria-label="Restart the room (R)" title="Restart the room (R)">
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <button type="button" className={cn(styles.hudButton, "size-10")} onClick={openMenu} aria-label="Pause (Esc)" title="Pause (Esc)">
              <Pause className="size-4" fill="currentColor" aria-hidden />
            </button>
          </div>
        </div>

        <div className={styles.stage} style={{ width: VIEW_W * layout.scale, height: VIEW_H * layout.scale }}>
          <canvas ref={canvas} className={styles.canvas} aria-hidden />

          {hud.isaac && <SpeechBubble key={`i${hud.isaac.key}`} bubble={hud.isaac} speaker="Isaac" />}
          {hud.sign && <SpeechBubble key={`s${hud.sign.key}`} bubble={hud.sign} sign />}

          {toast && <ClearedToast key={toast.roomId} toast={toast} />}
          <p className="sr-only" aria-live="polite" data-message>
            {hud.message}
          </p>

          {showHint && (
            <p className={cn(styles.hint, "pointer-events-none absolute inset-x-0 top-[calc(var(--gil-scale,2)*3px)] flex justify-center px-4")} data-hint>
              <span className={cn(styles.chip, "text-center text-[clamp(0.65rem,calc(var(--gil-scale,2)*5.5px),1.05rem)] font-bold leading-snug")}>{coarse ? hint.touch : hint.keys}</span>
            </p>
          )}
        </div>
      </div>

      {coarse && <TouchControls runtime={runtime} size={TOUCH_SIZE[prefs.touchSize]} swap={prefs.touchSwap} mode={prefs.controls} canFlip={room.flip} />}

      {coarse && portrait && !hideRotate && (
        <div className="absolute inset-x-3 top-20 z-[5] flex items-center gap-3 rounded-xl bg-[#163238]/90 p-3 text-sm font-semibold text-white" role="status">
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
        game="gravity-is-lying"
        eyebrow={`${roomLabel(roomId)} · ${room.name}`}
        title="Paused"
        description="Gravity will wait. (Isaac says it won't. Isaac is lying.)"
      >
        <div className="grid gap-3">
          <button type="button" className="btn btn-lg" onClick={closeMenu} data-sound="click">
            <PlayIcon className="size-5" aria-hidden /> Resume
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              closeMenu();
              runtime.current?.restart();
            }}
            data-sound="click"
          >
            <RotateCcw className="size-4" aria-hidden /> Restart the room
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setMenu("options")} data-sound="click">
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMenu(null);
              onMap();
            }}
            data-sound="click"
          >
            <MapIcon className="size-4" aria-hidden /> Back to the map
          </button>
        </div>
      </Dialog>
      <Dialog
        open={menu === "options"}
        onOpenChange={(open) => {
          if (!open) setMenu("pause");
        }}
        game="gravity-is-lying"
        eyebrow="Gravity Is Lying"
        title="Options"
        description="Saved on this device. Changes apply straight away."
      >
        <OptionsPanel />
      </Dialog>
    </div>
  );
}

const appleBits = (n: number) => (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1);

/** Isaac's words (or a sign's), over him: above, unless he's near the top of the screen; never off its edges. */
function SpeechBubble({ bubble, speaker, sign = false }: { bubble: { text: string; x: number; y: number }; speaker?: string; sign?: boolean }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const below = bubble.y < 30;
  useLayoutEffect(() => {
    const el = ref.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    const width = el.offsetWidth;
    const room = stage.clientWidth;
    const centre = (bubble.x / 100) * room;
    el.style.left = `${Math.max(4, Math.min(room - width - 4, centre - width / 2))}px`;
  });
  return (
    <p
      ref={ref}
      className={cn(styles.bubble, below && styles.below, sign && styles.sign, "text-[clamp(0.68rem,calc(var(--gil-scale,2)*6px),1.15rem)]")}
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        transform: below ? "translateY(calc(var(--gil-scale, 2) * 16px))" : "translateY(calc(-100% - var(--gil-scale, 2) * 16px))",
      }}
      data-bubble={sign ? "sign" : "isaac"}
    >
      {speaker && <span className="sr-only">{speaker}: </span>}
      {bubble.text}
    </p>
  );
}

/** The room you just cleared: time and golden apples, while the next room starts. */
function ClearedToast({ toast }: { toast: RoomToast }) {
  const room = getRoom(toast.roomId);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[17%] flex justify-center px-3" role="status" aria-live="polite">
      <div className={cn(styles.toast, styles.panel, "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-sm")} data-toast={toast.roomId}>
        <p className="font-bold">
          {roomLabel(toast.roomId)} {room.name} <span className="font-semibold text-[#4B6267]">· {formatTime(toast.ticks)}</span>
          {toast.newBest && toast.eligible && <span className="ml-2 text-[#0F7366]">best!</span>}
        </p>
        {toast.eligible ? (
          <p className="flex items-center gap-1" aria-label={`${appleBits(toast.apples)} of 3 golden apples`}>
            {[0, 1, 2].map((i) => (
              <AppleIcon key={i} size={16} got={(toast.apples & (1 << i)) !== 0} />
            ))}
            {toast.freshApples !== 0 && <span className="ml-1 text-xs font-extrabold text-[#E63946]">NEW</span>}
          </p>
        ) : (
          <p className="font-semibold text-[#4B6267]">Assist on: apples not counted</p>
        )}
      </div>
    </div>
  );
}

/** Walking on one pad (slide between the buttons); jump and flip on the other side. Sides can swap. */
function TouchControls({ runtime, size, swap, mode, canFlip }: { runtime: { current: Runtime | null }; size: number; swap: boolean; mode: ControlMode; canFlip: boolean }) {
  const [held, setHeld] = useState<Record<string, boolean>>({});
  const pad = useRef<Map<number, Action | null>>(new Map());
  const screen = mode === "screen";

  const set = (action: Action, down: boolean) => {
    if (down) runtime.current?.press(action);
    else runtime.current?.release(action);
    setHeld((h) => ({ ...h, [action]: down }));
  };

  /** Which button of the pad a finger is over (the cross in screen mode: the nearest arm). */
  const sideOf = (event: ReactPointerEvent<HTMLDivElement>): Action => {
    const box = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    if (screen && Math.abs(dy) > Math.abs(dx)) return dy < 0 ? "up" : "down";
    return dx < 0 ? "left" : "right";
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
  const hold = (action: Action) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      set(action, true);
    },
    onPointerUp: () => set(action, false),
    onPointerCancel: () => set(action, false),
  });

  const gap = TOUCH_GAP;
  const padW = screen ? size * 2.4 : size * 2 + 10;
  const padH = screen ? size * 2.4 : size;
  const padStyle = { width: padW, height: padH, bottom: gap, [swap ? "right" : "left"]: gap };
  const jumpStyle = { width: size * 1.1, height: size * 1.1, bottom: gap, [swap ? "left" : "right"]: gap };
  const flipStyle = { width: size * 0.9, height: size * 0.9, bottom: gap + size * 1.1 + 12, [swap ? "left" : "right"]: gap + size * 0.1 };
  const arrow = (dir: "left" | "right" | "up" | "down") => {
    const turn = { left: 180, right: 0, up: -90, down: 90 }[dir];
    return (
      <svg viewBox="-10 -10 20 20" className="size-1/2" aria-hidden style={{ transform: `rotate(${turn}deg)` }}>
        <path d="M-4 -7 L6 0 L-4 7 Z" fill="#fff" />
      </svg>
    );
  };
  const button = (dir: "left" | "right" | "up" | "down", style: React.CSSProperties) => (
    <div key={dir} className={styles.touch} style={{ width: size, height: size, ...style }} data-held={held[dir] ? "" : undefined} aria-hidden>
      {arrow(dir)}
    </div>
  );

  return (
    <>
      <div
        className="absolute touch-none"
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
        aria-label="Walk"
      >
        {screen ? (
          <>
            {button("up", { left: (padW - size) / 2, top: 0 })}
            {button("left", { left: 0, top: (padH - size) / 2 })}
            {button("right", { right: 0, top: (padH - size) / 2 })}
            {button("down", { left: (padW - size) / 2, bottom: 0 })}
          </>
        ) : (
          <>
            {button("left", { left: 0, top: 0 })}
            {button("right", { right: 0, top: 0 })}
          </>
        )}
      </div>
      <div className={cn(styles.touch, "text-sm")} style={jumpStyle} data-held={held.jump ? "" : undefined} role="button" aria-label="Jump" {...hold("jump")}>
        JUMP
      </div>
      <div className={cn(styles.touch, "text-xs")} style={flipStyle} data-held={held.flip ? "" : undefined} data-off={canFlip ? undefined : ""} role="button" aria-label="Flip gravity" {...hold("flip")}>
        FLIP
      </div>
    </>
  );
}
