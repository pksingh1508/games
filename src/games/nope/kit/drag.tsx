"use client";

// Drag and drop that works three ways (Plan/02-nope.md §11):
// - mouse or finger: drag it (Motion's drag gesture)
// - click/tap without dragging: pick it up, then click/tap where it goes
// - keyboard: Enter or Space picks it up, then Tab to a drop spot and press Enter (Esc cancels)
// "Move it out of the way" items (a card, a stamp, the host) slide aside instead of dropping.
import { animate, m, useMotionValue } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { sfx } from "../sfx";

interface DragContextValue {
  held: { id: string; label: string } | null;
  over: string | null;
  setHeld(item: { id: string; label: string } | null): void;
  setOver(zone: string | null): void;
  registerZone(id: string, node: HTMLElement): () => void;
  registerItem(id: string, onDrop: (zone: string | null) => void): () => void;
  /** The drop spot under an element's centre. */
  zoneUnder(node: HTMLElement | null): string | null;
  dropHeld(zone: string): void;
}

const DragContext = createContext<DragContextValue | null>(null);

function useDragArea(): DragContextValue {
  const value = useContext(DragContext);
  if (!value) throw new Error("Draggable and DropZone need a <DragArea>");
  return value;
}

/** Wrap a question's draggable things and drop spots. */
export function DragArea({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const zones = useRef(new Map<string, HTMLElement>());
  const items = useRef(new Map<string, (zone: string | null) => void>());
  const [held, setHeld] = useState<{ id: string; label: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const registerZone = useCallback((id: string, node: HTMLElement) => {
    zones.current.set(id, node);
    return () => {
      if (zones.current.get(id) === node) zones.current.delete(id);
    };
  }, []);

  const registerItem = useCallback((id: string, onDrop: (zone: string | null) => void) => {
    items.current.set(id, onDrop);
    return () => {
      items.current.delete(id);
    };
  }, []);

  const zoneUnder = useCallback((node: HTMLElement | null) => {
    if (!node) return null;
    const box = node.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    let best: { id: string; area: number } | null = null;
    for (const [id, zone] of zones.current) {
      const r = zone.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const area = r.width * r.height;
        // The smallest zone wins (a key-hole inside a door, say).
        if (!best || area < best.area) best = { id, area };
      }
    }
    return best?.id ?? null;
  }, []);

  const dropHeld = useCallback(
    (zone: string) => {
      if (!held) return;
      setHeld(null);
      items.current.get(held.id)?.(zone);
    },
    [held],
  );

  const value = useMemo<DragContextValue>(
    () => ({ held, over, setHeld, setOver, registerZone, registerItem, zoneUnder, dropHeld }),
    [held, over, registerZone, registerItem, zoneUnder, dropHeld],
  );

  return (
    <DragContext.Provider value={value}>
      <div
        className={cn("relative", className)}
        style={style}
        onKeyDown={(event) => {
          if (event.key === "Escape" && held) {
            event.stopPropagation();
            setHeld(null);
          }
        }}
      >
        {children}
        <p aria-live="polite" className="sr-only">
          {held ? `Holding ${held.label}. Choose where to put it, or press Escape.` : ""}
        </p>
      </div>
    </DragContext.Provider>
  );
}

export interface AsideOptions {
  /** Where it slides when moved with the keyboard (px). */
  x: number;
  y: number;
  /** How far a drag must move it to count (px, default 70). */
  threshold?: number;
  onAside: () => void;
}

/** Something you can pick up and move. */
export function Draggable({
  id,
  label,
  children,
  className,
  style,
  onDrop,
  aside,
  disabled,
  constraints,
  title,
}: {
  id: string;
  /** Accessible name: "the elephant". */
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Where it was dropped (null: nowhere useful). It snaps back unless it moved somewhere new. */
  onDrop?: (zone: string | null) => void;
  /** It's in the way: moving it far enough reveals what's behind it. */
  aside?: AsideOptions;
  disabled?: boolean;
  constraints?: RefObject<HTMLElement | null>;
  title?: string;
}) {
  const area = useDragArea();
  const { registerItem } = area;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const node = useRef<HTMLDivElement | null>(null);
  const moved = useRef(false);
  const isHeld = area.held?.id === id;

  // Motion only reads a ref callback once, so the latest drop handler lives in a ref instead.
  const latestDrop = useRef(onDrop);
  useEffect(() => {
    latestDrop.current = onDrop;
  });
  useEffect(() => registerItem(id, (zone) => latestDrop.current?.(zone)), [registerItem, id]);

  const slideAside = () => {
    if (!aside) return;
    void animate(x, aside.x, { type: "spring", stiffness: 260, damping: 24 });
    void animate(y, aside.y, { type: "spring", stiffness: 260, damping: 24 });
    aside.onAside();
  };

  const pickUp = () => {
    if (disabled) return;
    if (aside) {
      slideAside();
      return;
    }
    sfx.boop();
    area.setHeld(isHeld ? null : { id, label });
  };

  return (
    <m.div
      ref={node}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={aside ? `Move ${label} out of the way` : isHeld ? `Put down ${label}` : `Pick up ${label}`}
      aria-pressed={aside ? undefined : isHeld}
      aria-disabled={disabled || undefined}
      title={title}
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0.12}
      dragSnapToOrigin={!aside}
      dragConstraints={constraints}
      whileDrag={{ scale: 1.06, zIndex: 40 }}
      onDragStart={() => {
        moved.current = true;
        area.setHeld(null);
      }}
      onDrag={() => area.setOver(area.zoneUnder(node.current))}
      onDragEnd={() => {
        const zone = area.zoneUnder(node.current);
        area.setOver(null);
        if (aside) {
          if (Math.hypot(x.get(), y.get()) >= (aside.threshold ?? 70)) aside.onAside();
          return;
        }
        onDrop?.(zone);
      }}
      onTap={() => {
        if (moved.current) {
          moved.current = false;
          return;
        }
        pickUp();
      }}
      onPointerDown={() => {
        moved.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pickUp();
        }
      }}
      style={{ x, y, touchAction: "none", ...style }}
      className={cn(
        "relative cursor-grab select-none outline-offset-4 active:cursor-grabbing [-webkit-touch-callout:none]",
        isHeld && "z-30 rounded-2xl ring-4 ring-[#3DE0FF] ring-offset-2 ring-offset-transparent",
        disabled && "cursor-default",
        className,
      )}
    >
      {children}
    </m.div>
  );
}

/** Somewhere a held thing can go. */
export function DropZone({
  id,
  label,
  children,
  className,
  style,
}: {
  id: string;
  /** Accessible name: "the fridge". */
  label: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const area = useDragArea();
  const ref = useCallback((el: HTMLDivElement | null) => (el ? area.registerZone(id, el) : undefined), [area, id]);
  const over = area.over === id;

  return (
    <div ref={ref} data-zone={id} className={cn("relative", className)} style={style}>
      {children}
      {(over || area.held) && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-1.5 rounded-[1.25rem] border-[3px] border-dashed",
            over ? "border-[#3DE0FF] bg-[#3DE0FF]/15" : "border-[#2B59C3]/70",
          )}
        />
      )}
      {area.held && (
        <button
          type="button"
          className="absolute inset-0 z-30 rounded-[1.25rem] focus-visible:outline-[3px] focus-visible:outline-[#2B59C3]"
          aria-label={`Put ${area.held.label} on ${label}`}
          onClick={() => area.dropHeld(id)}
        />
      )}
    </div>
  );
}
