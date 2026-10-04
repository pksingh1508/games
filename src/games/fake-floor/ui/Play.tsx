"use client";

// The play screen (Plan/05-fake-floor.md §8.3): the room fills the screen (the arcade's header hides
// underneath). A minimal HUD so you can see the floor: room name, falls and pebbles. Click (or tap)
// a floor to throw a pebble at it; on touch screens there are buttons for the rest. When you clear
// a room, a little card tells you how it went while the next room is already starting.
import { Map as MapIcon, Pause, Play as PlayIcon, RotateCcw, RotateCw, Settings2, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { useCoarsePointer, useComfort, usePortrait } from "@/games/shared/device";
import { useFitCanvas } from "@/games/shared/fit";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { VIEW_H, VIEW_W } from "../core/constants";
import { formatTime, MEDAL_IDS, MEDALS, type MedalId } from "../core/medals";
import type { RoomSession } from "../core/session";
import type { FallCause } from "../core/world";
import styles from "../fake-floor.module.css";
import { initialHud, Runtime, type Action, type Hud } from "../play/runtime";
import { getRoom, roomLabel, WORLDS, type WorldId } from "../rooms";
import { assistOn, fakeFloorSave } from "../save";
import { EyeIcon, FallIcon, KeyIcon, MedalIcon, PebbleIcon } from "./icons";
import { OptionsPanel } from "./Menus";

/** How the room you just left went (shown over the next one). */
export interface RoomToast {
  roomId: string;
  ticks: number;
  earned: Record<MedalId, boolean>;
  fresh: MedalId[];
  eligible: boolean;
  newBest: boolean;
}

export interface TrialInfo {
  world: WorldId;
  /** Which room of the world (0–9). */
  index: number;
  /** Ticks on the clock before this room. */
  base: number;
}

export interface PlayProps {
  roomId: string;
  trial: TrialInfo | null;
  toast: RoomToast | null;
  onFall(roomId: string, cause: FallCause): void;
  onThrow(roomId: string): void;
  onHidden(roomId: string): void;
  onLeap(): void;
  onWin(session: RoomSession, assisted: boolean): void;
  /** Restart the room (or the whole time trial). */
  onRestart(): void;
  onMap(): void;
}

const TOUCH_SIZE = { s: 64, m: 80, l: 96 } as const;

/** One-time help, for the rooms that introduce something. */
const HINTS: Record<string, { keys: string; touch: string }> = {
  "1-01": { keys: "← → walk · Space jumps · R restarts", touch: "◀ ▶ walk · JUMP jumps" },
  "1-03": { keys: "Click a tile to throw a pebble at it · or tap F (hold it to aim further)", touch: "Tap a tile to throw a pebble at it" },
  "2-03": { keys: "Watch where the rain splashes", touch: "Watch where the rain splashes" },
  "3-01": { keys: "Watch the shadows on the wall", touch: "Watch the shadows on the wall" },
  "5-01": { keys: "Hold Shift to look ahead", touch: "Hold the eye to look ahead" },
};

export function PlayScreen({ roomId, trial, toast, onFall, onThrow, onHidden, onLeap, onWin, onRestart, onMap }: PlayProps) {
  const save = useSave(fakeFloorSave);
  const comfort = useComfort();
  const coarse = useCoarsePointer();
  const portrait = usePortrait();
  const { area, frame } = useFitCanvas(VIEW_W, VIEW_H, "--ff-scale");
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const clock = useRef<HTMLSpanElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [menu, setMenu] = useState<"pause" | "options" | null>(null);
  const [hideRotate, setHideRotate] = useState(false);
  const room = getRoom(roomId);
  const record = save.rooms[roomId];
  const trialBase = trial ? trial.base : null;
  const showClock = Boolean(trial) || save.prefs.clock;

  const openMenu = () => {
    runtime.current?.pause();
    setMenu("pause");
  };
  const closeMenu = () => {
    setMenu(null);
    runtime.current?.resume();
    area.current?.focus({ preventScroll: true });
  };

  const fell = useEffectEvent((cause: FallCause) => onFall(roomId, cause));
  const threw = useEffectEvent(() => onThrow(roomId));
  const found = useEffectEvent(() => onHidden(roomId));
  const leapt = useEffectEvent(() => onLeap());
  const won = useEffectEvent((session: RoomSession) => onWin(session, runtime.current?.assisted ?? false));
  const togglePause = useEffectEvent(() => {
    if (menu) closeMenu();
    else openMenu();
  });
  const reducedMotion = useEffectEvent(() => comfort.reducedMotion);

  // One runtime per visit.
  useEffect(() => {
    if (!canvas.current) return;
    const prefs = fakeFloorSave.get().prefs;
    const created = new Runtime(
      canvas.current,
      {
        room: getRoom(roomId),
        assist: prefs.assist,
        highContrast: prefs.highContrast,
        keys: prefs.keys,
        reducedMotion: () => reducedMotion(),
        trial: trialBase === null ? null : { base: trialBase },
        showClock: trialBase !== null || prefs.clock,
      },
      hudStore,
      {
        onFall: (cause) => fell(cause),
        onThrow: () => threw(),
        onHidden: () => found(),
        onLeap: () => leapt(),
        onWin: (session) => won(session),
        onPauseToggle: () => togglePause(),
      },
    );
    runtime.current = created;
    // Dev builds only: a handle for the QA scripts.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __ff?: unknown }).__ff = { runtime: created };
    created.bindClock(clock.current);
    created.start();
    area.current?.focus({ preventScroll: true });
    return () => {
      // Play time, written once per visit.
      const ticks = created.session.elapsed;
      fakeFloorSave.update((s) => ({ ...s, stats: { playTicks: s.stats.playTicks + ticks } }));
      created.destroy();
      runtime.current = null;
    };
  }, [roomId, trialBase, hudStore, area]);

  // Options changed (from the pause menu): apply them now.
  useEffect(() => {
    runtime.current?.setPrefs({ assist: save.prefs.assist, highContrast: save.prefs.highContrast, keys: save.prefs.keys });
  }, [save.prefs]);

  useEffect(() => {
    runtime.current?.bindClock(clock.current);
  }, [showClock]);

  /** Canvas pixels from a pointer event. */
  const toCanvas = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * VIEW_W, y: ((event.clientY - box.top) / box.height) * VIEW_H };
  };

  const hint = HINTS[roomId];
  const showHint = hint && !record?.clears && !hud.started && hud.falls === 0 && !trial;
  const assisted = assistOn(save.prefs.assist);
  const world = WORLDS.find((w) => w.id === trial?.world);

  return (
    <div
      ref={area}
      tabIndex={-1}
      className={cn(styles.root, styles.area)}
      aria-label={`Room ${roomLabel(roomId)}: ${room.name}`}
      data-room={roomId}
      data-ready={hud.ready ? "" : undefined}
      data-status={hud.status}
    >
      <div ref={frame} className={styles.frame}>
        <canvas
          ref={canvas}
          className={styles.canvas}
          aria-hidden
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse") return;
            const at = toCanvas(event);
            runtime.current?.pointerMove(at.x, at.y);
          }}
          onPointerLeave={() => runtime.current?.pointerLeave()}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            const at = toCanvas(event);
            runtime.current?.throwAt(at.x, at.y);
          }}
        />

        {/* HUD: room, clock, falls, pebbles. */}
        <div className={cn(styles.hud, "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-[calc(var(--ff-scale,2)*4px)] text-[clamp(0.7rem,calc(var(--ff-scale,2)*6.5px),1.35rem)]")}>
          <p className="min-w-0 flex-1 truncate leading-tight">
            {roomLabel(roomId)} <span className="max-sm:hidden">{room.name}</span>
            {trial && world && (
              <span className="block text-[0.75em] text-[#FEAE34]">
                Time trial · {trial.index + 1}/{world.rooms.length}
              </span>
            )}
            {assisted && <span className="block text-[0.75em] text-[#2CE8F5]">Assist</span>}
          </p>
          {showClock && (
            <p className="text-[1.2em] tabular-nums" aria-label="Time">
              <span ref={clock}>0.0</span>
            </p>
          )}
          <div className="flex flex-1 items-start justify-end gap-2.5">
            {room.key && (
              <span className={cn("mt-1", hud.hasKey ? "opacity-100" : "opacity-35")} aria-label={hud.hasKey ? "You have the key" : "The door needs a key"} role="img">
                <KeyIcon size={18} />
              </span>
            )}
            <p className="flex items-center gap-1 tabular-nums" aria-label={`${hud.falls} ${hud.falls === 1 ? "fall" : "falls"}`} data-falls={hud.falls}>
              <FallIcon size={15} /> {hud.falls}
            </p>
            <p className="flex items-center gap-1 tabular-nums" aria-label={hud.unlimited ? "Unlimited pebbles" : `${hud.pebbles} ${hud.pebbles === 1 ? "pebble" : "pebbles"}`} data-pebbles={hud.unlimited ? "unlimited" : hud.pebbles}>
              <PebbleIcon size={16} /> {hud.unlimited ? "∞" : hud.pebbles}
            </p>
            <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={() => runtime.current?.restart()} aria-label="Restart the room (R)" title="Restart the room (R)">
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <button type="button" className={cn(styles.hudButton, "pointer-events-auto size-10")} onClick={openMenu} aria-label="Pause (Esc)" title="Pause (Esc)">
              <Pause className="size-4" fill="currentColor" aria-hidden />
            </button>
          </div>
        </div>

        {toast && <ClearedToast key={toast.roomId} toast={toast} />}
        <p className="sr-only" aria-live="polite" data-message>
          {hud.message}
        </p>

        {showHint && (
          <p className={cn(styles.hud, styles.hint, "pointer-events-none absolute inset-x-0 bottom-[14%] px-4 text-center text-[clamp(0.65rem,calc(var(--ff-scale,2)*5px),1.05rem)] leading-snug")}>
            {coarse ? hint.touch : hint.keys}
          </p>
        )}
      </div>

      {coarse && <TouchControls runtime={runtime} size={TOUCH_SIZE[save.prefs.touchSize]} swap={save.prefs.touchSwap} />}

      {coarse && portrait && !hideRotate && (
        <div className="absolute inset-x-3 top-20 z-[5] flex items-center gap-3 rounded-xl bg-[#181425]/85 p-3 text-sm font-semibold text-white" role="status">
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
        game="fake-floor"
        eyebrow={`${roomLabel(roomId)} · ${room.name}`}
        title="Paused"
        description={trial ? "The time trial's clock stops while you're here." : "Take your time. The floor isn't going anywhere."}
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
              onRestart();
            }}
            data-sound="click"
          >
            <RotateCcw className="size-4" aria-hidden /> {trial ? "Restart the time trial" : "Restart the room"}
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
        game="fake-floor"
        eyebrow="Fake Floor"
        title="Options"
        description="Saved on this device. Changes apply straight away."
      >
        <OptionsPanel />
      </Dialog>
    </div>
  );
}

/** The room you just cleared: time and medals, while the next room starts. */
function ClearedToast({ toast }: { toast: RoomToast }) {
  const room = getRoom(toast.roomId);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[16%] flex justify-center px-3" role="status" aria-live="polite">
      <div className={cn(styles.toast, styles.panel, "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm")} data-toast={toast.roomId}>
        <p className={cn(styles.pixel, "text-base")}>
          {roomLabel(toast.roomId)} {room.name} <span className="text-[#5A636A]">· {formatTime(toast.ticks)}</span>
          {toast.newBest && toast.eligible && <span className="ml-2 text-[#8A5D12]">best!</span>}
        </p>
        {toast.eligible ? (
          <ul className="flex items-center gap-3" aria-label="Medals">
            {MEDAL_IDS.map((m) => (
              <li key={m} className="flex items-center gap-1 font-semibold">
                <MedalIcon medal={m} got={toast.earned[m]} size={16} />
                <span className={toast.earned[m] ? "" : "text-[#9a958a] line-through"}>{MEDALS[m].name}</span>
                {toast.fresh.includes(m) && <span className={cn(styles.pixel, "text-[0.65rem] text-[#C8224B]")}>NEW</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-semibold text-[#5A636A]">Assist on: no medals</p>
        )}
      </div>
    </div>
  );
}

/** Left/right on one pad (slide between them); jump and look on the other side. Sides can swap. */
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
  const hold = (action: Action) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      set(action, true);
    },
    onPointerUp: () => set(action, false),
    onPointerCancel: () => set(action, false),
  });

  const gap = 24;
  const padStyle = { width: size * 2 + 8, height: size, bottom: gap, [swap ? "right" : "left"]: gap };
  const jumpStyle = { width: size * 1.15, height: size * 1.15, bottom: gap, [swap ? "left" : "right"]: gap };
  const lookStyle = { width: size * 0.8, height: size * 0.8, bottom: gap + size * 1.15 + 14, [swap ? "left" : "right"]: gap + size * 0.18 };

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
      <div className={cn(styles.touch, styles.pixel, "text-sm")} style={jumpStyle} data-held={held.jump ? "" : undefined} role="button" aria-label="Jump" {...hold("jump")}>
        JUMP
      </div>
      <div className={styles.touch} style={lookStyle} data-held={held.look ? "" : undefined} role="button" aria-label="Look ahead" {...hold("look")}>
        <EyeIcon size={size * 0.38} />
      </div>
    </>
  );
}
