"use client";

// The HUD (Plan/10-last-pixel.md §8.3): panels over the canvas, the progress on top, the tools at the
// bottom, the pause button in the corner. Pix hides under them, so they can be dragged about: by the grip,
// or anywhere in the hunt. While you paint they fade and let your strokes through.
import { Candy, Coins, Eraser, Grid3x3, GripVertical, Hand, Paintbrush, PaintRoller, Pause, Search, Shovel, Snowflake, Sparkles, SprayCan, Tractor, type LucideIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HZ } from "../core/constants";
import type { HuntKit, HuntToolId, ToolId } from "../core/level";
import { TOOLS } from "../core/tools";
import styles from "../last-pixel.module.css";
import type { Hud } from "../play/runtime";

export const TOOL_ICONS: Record<ToolId, LucideIcon> = {
  roller: PaintRoller,
  brush: Paintbrush,
  sponge: Sparkles,
  scratch: Coins,
  mower: Tractor,
  shovel: Shovel,
  washer: SprayCan,
  eraser: Eraser,
};

export const clock = (ticks: number) => {
  const s = ticks / HZ;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

/** A panel over the canvas you can drag about (index: which HUD panel it is, for Pix). */
export function Panel({
  index,
  grab,
  wobble,
  place,
  label,
  onMoved,
  children,
  className,
}: {
  index: number;
  /** The hunt: the whole panel's a handle. */
  grab: boolean;
  wobble: boolean;
  /** Where it starts (CSS). */
  place: React.CSSProperties;
  label: string;
  onMoved(): void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const swallow = useRef(false);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const onHandle = (e.target as HTMLElement).closest("[data-hud-handle]");
    if (!grab && !onHandle) return;
    const el = ref.current!;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop, moved: false };
    if (onHandle) e.preventDefault();
    e.stopPropagation();
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      try {
        ref.current!.setPointerCapture(e.pointerId);
      } catch {
        // Fine without it.
      }
    }
    const el = ref.current!;
    const parent = el.offsetParent as HTMLElement | null;
    const maxL = (parent?.clientWidth ?? 0) - el.offsetWidth;
    const maxT = (parent?.clientHeight ?? 0) - el.offsetHeight;
    setPos({ left: Math.max(0, Math.min(maxL, d.left + dx)), top: Math.max(0, Math.min(maxT, d.top + dy)) });
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) {
      // A drag isn't a click on whatever button it started on.
      swallow.current = true;
      setTimeout(() => (swallow.current = false), 0);
      setDragging(false);
      onMoved();
    }
  };

  return (
    <div
      ref={ref}
      className={cn(styles.panel, className)}
      style={pos ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto", translate: "none" } : place}
      data-pix-hud={index}
      data-grab={grab ? "" : undefined}
      data-wobble={wobble ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={(e) => {
        if (swallow.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      role="group"
      aria-label={label}
    >
      <span className={styles.handle} data-hud-handle aria-hidden title="Drag me">
        <GripVertical className="size-4" />
      </span>
      {children}
    </div>
  );
}

export function ProgressPanel({ hud, grab, onMoved }: { hud: Hud; grab: boolean; onMoved(): void }) {
  const hunting = hud.phase === "hunt" || hud.phase === "wake" || hud.phase === "escaped";
  const text = hud.progress.replace("%", "");
  return (
    <Panel index={0} grab={grab} wobble={hud.wobble === 0} place={{ top: "0.5rem", left: "50%", translate: "-50% 0" }} label="Progress" onMoved={onMoved}>
      <div className="flex flex-col items-center gap-1 px-1">
        <span className={styles.progress} aria-label={`${hud.progress} done`} data-progress={hud.progress}>
          {text}
          <span data-pix-spot="percent">%</span>
        </span>
        <span className={styles.meter} aria-hidden>
          <span style={{ width: `${Math.min(100, hud.progressValue * 100)}%` }} />
        </span>
      </div>
      <span className="min-w-[3.4rem] text-center text-[0.8rem] font-bold leading-tight tabular-nums" data-clock>
        {hunting ? (hud.round > 0 || hud.rounds > 1 ? `catch ${hud.round + 1}/${hud.rounds}` : "catch it!") : hud.phase === "revenge" ? "repaint!" : hud.started ? "" : "ready"}
        <br />
        {clock(hud.ticks)}
      </span>
    </Panel>
  );
}

export function ToolBar({
  hud,
  tools,
  kit,
  grab,
  onTool,
  onHunt,
  onLens,
  onMoved,
}: {
  hud: Hud;
  tools: readonly ToolId[];
  kit: HuntKit;
  grab: boolean;
  onTool(tool: ToolId): void;
  onHunt(tool: HuntToolId): void;
  onLens(): void;
  onMoved(): void;
}) {
  const hunting = hud.phase === "hunt" || hud.phase === "wake" || hud.phase === "escaped";
  const button = (key: string, label: string, Icon: LucideIcon, pressed: boolean, onClick: () => void, count?: number, disabled = false, data?: string) => (
    <button key={label} type="button" className={styles.tool} aria-pressed={pressed} aria-label={count !== undefined ? `${label} (${count} left)` : label} title={`${label} (${key})`} onClick={onClick} disabled={disabled} data-tool={data}>
      <span className={styles.key} aria-hidden>
        {key}
      </span>
      <Icon className="size-5" aria-hidden />
      {count !== undefined && (
        <span className={styles.count} aria-hidden>
          {count}
        </span>
      )}
    </button>
  );
  return (
    <Panel index={1} grab={grab} wobble={hud.wobble === 1} place={{ bottom: "0.5rem", left: "50%", translate: "-50% 0" }} label="Tools" onMoved={onMoved}>
      {hunting ? (
        <>
          {button("1", "Catch (tap it)", Hand, hud.huntTool === "catch", () => onHunt("catch"), undefined, false, "catch")}
          {kit.net > 0 && button("2", "Net (or Shift-drag)", Grid3x3, hud.huntTool === "net", () => onHunt("net"), hud.nets, hud.nets === 0, "net")}
          {kit.bait > 0 && button("3", "Bait", Candy, hud.huntTool === "bait", () => onHunt("bait"), hud.baits, hud.baits === 0, "bait")}
          {kit.freeze > 0 && button("4", "Freeze", Snowflake, false, () => onHunt("freeze"), hud.freezes, hud.freezes === 0, "freeze")}
          {kit.magnifier && button("M", "Magnifier", Search, hud.lens, onLens, undefined, false, "lens")}
        </>
      ) : (
        tools.map((t, k) => button(String(k + 1), TOOLS[t].name, TOOL_ICONS[t], hud.tool === t, () => onTool(t), undefined, false, t))
      )}
    </Panel>
  );
}

export function PausePanel({ hud, grab, onPause, onMoved }: { hud: Hud; grab: boolean; onPause(): void; onMoved(): void }) {
  return (
    <Panel index={2} grab={grab} wobble={hud.wobble === 2} place={{ top: "0.5rem", right: "0.5rem" }} label="Pause" onMoved={onMoved} className="!px-1.5">
      <button type="button" className={styles.tool} onClick={onPause} aria-label="Pause (Esc)" data-pix-spot="pause" data-pause>
        <Pause className="size-5" aria-hidden />
      </button>
    </Panel>
  );
}
