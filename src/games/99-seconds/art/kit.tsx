// The paint box for 99 Seconds' rooms (Plan/03-99-seconds.md §9 "Visuals"): warm, slightly surreal, flat vector
// shading, muted colours, soft lamplight. Every scene is drawn in a 1600 × 900 SVG; walls are seen straight on, a
// band of floor along the bottom. These are the shared pieces: walls, light, the clocks' seven-segment digits, and
// handwriting (your journal's hand, which is also the hand on the walls).
import type { ReactNode } from "react";
import type { ChapterId, ViewId } from "../core/types";

export const W = 1600;
export const H = 900;
/** Where the wall meets the floor. */
export const FLOOR = 760;

/** What a scene needs to know to draw itself. */
export interface ArtState {
  chapter: ChapterId;
  /** The view in the room's own terms. */
  place: ViewId;
  room: string;
  mirrored: boolean;
  flags: ReadonlySet<string>;
  items: readonly string[];
  /** What's been typed on the keypad. */
  entry: string;
  /** Seconds left (exactly), and what the loop clock shows. */
  left: number;
  display: number;
  loopSeconds: number;
  elapsedMs: number;
  /** The hundredth second. */
  extra: boolean;
  /** Loops lived in this chapter (the tally marks in the drawer). */
  loops: number;
  /** The room's memory: scratches in your handwriting. */
  scratches: readonly string[];
}

export const HAND = "var(--font-g-caveat), 'Comic Sans MS', cursive";
export const SERIF = "var(--font-g-fraunces), Georgia, serif";

/** Gradients every scene can use (ids are shared: every definition is identical). */
export function Defs() {
  return (
    <defs>
      <radialGradient id="n9-warm">
        <stop offset="0%" stopColor="#FFD58A" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#FFD58A" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="n9-amber">
        <stop offset="0%" stopColor="#FFB45C" stopOpacity="0.9" />
        <stop offset="60%" stopColor="#E0893A" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#E0893A" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="n9-cool">
        <stop offset="0%" stopColor="#CFE6FF" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#CFE6FF" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="n9-shade">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
      </radialGradient>
      <linearGradient id="n9-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="n9-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0.08" />
      </linearGradient>
    </defs>
  );
}

/** A pool of light (or a glow). */
export function Glow({ cx, cy, r, tone = "warm", opacity = 1 }: { cx: number; cy: number; r: number; tone?: "warm" | "amber" | "cool"; opacity?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={`url(#n9-${tone})`} opacity={opacity} pointerEvents="none" />;
}

/** A soft shadow on the floor. */
export const Shadow = ({ cx, cy, rx, ry = rx * 0.18, opacity = 0.3 }: { cx: number; cy: number; rx: number; ry?: number; opacity?: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity={opacity} />;

export interface WallStyle {
  wall: string;
  stripe?: string;
  /** Lower panelling (its top edge, colour). */
  wainscot?: { top: number; color: string };
  /** Tiles instead of stripes (size, line colour). */
  tiles?: { size: number; line: string; top: number };
  ceiling: string;
  floor: string;
  /** Floorboards or tiles on the floor. */
  boards?: string;
  floorTiles?: string;
  skirting: string;
}

/** A wall seen straight on: ceiling band, wall (striped, tiled or panelled), skirting, floor. */
export function Wall({ s, children }: { s: WallStyle; children?: ReactNode }) {
  return (
    <g>
      <rect width={W} height={FLOOR} fill={s.wall} />
      {s.stripe && Array.from({ length: 27 }, (_, i) => <rect key={i} x={i * 60 + 18} y={60} width={24} height={FLOOR - 60} fill={s.stripe} />)}
      {s.tiles &&
        Array.from({ length: Math.ceil((FLOOR - s.tiles.top) / s.tiles.size) }, (_, r) => (
          <line key={`r${r}`} x1={0} x2={W} y1={s.tiles!.top + r * s.tiles!.size} y2={s.tiles!.top + r * s.tiles!.size} stroke={s.tiles!.line} strokeWidth={2} />
        ))}
      {s.tiles && Array.from({ length: Math.ceil(W / s.tiles.size) + 1 }, (_, c) => <line key={`c${c}`} x1={c * s.tiles!.size} x2={c * s.tiles!.size} y1={s.tiles!.top} y2={FLOOR} stroke={s.tiles!.line} strokeWidth={2} />)}
      {s.wainscot && (
        <>
          <rect y={s.wainscot.top} width={W} height={FLOOR - s.wainscot.top} fill={s.wainscot.color} />
          <rect y={s.wainscot.top - 8} width={W} height={12} fill={s.skirting} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={40 + i * 200} y={s.wainscot!.top + 30} width={160} height={FLOOR - s.wainscot!.top - 70} fill="none" stroke="#000" strokeOpacity={0.18} strokeWidth={4} rx={4} />
          ))}
        </>
      )}
      <rect width={W} height={60} fill={s.ceiling} />
      <rect y={56} width={W} height={8} fill="#000" opacity={0.15} />
      <rect y={FLOOR} width={W} height={H - FLOOR} fill={s.floor} />
      {s.boards && Array.from({ length: 5 }, (_, i) => <line key={i} x1={0} x2={W} y1={FLOOR + 24 + i * 28} y2={FLOOR + 24 + i * 28} stroke={s.boards} strokeWidth={3} />)}
      {s.boards && Array.from({ length: 14 }, (_, i) => <line key={`v${i}`} x1={i * 130 + ((i * 37) % 60)} x2={i * 130 + ((i * 37) % 60)} y1={FLOOR + 24 + (i % 5) * 28} y2={FLOOR + 52 + (i % 5) * 28} stroke={s.boards} strokeWidth={3} />)}
      {s.floorTiles && Array.from({ length: 4 }, (_, i) => <line key={i} x1={0} x2={W} y1={FLOOR + 30 + i * 34} y2={FLOOR + 30 + i * 34} stroke={s.floorTiles} strokeWidth={3} />)}
      {s.floorTiles && Array.from({ length: 17 }, (_, i) => <line key={`v${i}`} x1={i * 100} x2={i * 100 + (i - 8) * 14} y1={FLOOR} y2={H} stroke={s.floorTiles} strokeWidth={3} />)}
      <rect y={FLOOR} width={W} height={60} fill="url(#n9-floor)" />
      <rect y={FLOOR - 22} width={W} height={24} fill={s.skirting} />
      {children}
    </g>
  );
}

type Seg = "a" | "b" | "c" | "d" | "e" | "f" | "g";
const DIGITS: Record<string, Seg[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
  "-": ["g"],
  " ": [],
};

/** Seven-segment digits (the loop clocks), lit segments over dim ones. */
export function SevenSeg({ x, y, h, value, on = "#FF5A36", off = "#2A1612", glow = true }: { x: number; y: number; h: number; value: string; on?: string; off?: string; glow?: boolean }) {
  const w = h * 0.56;
  const t = h * 0.13;
  const half = h / 2;
  const gap = h * 0.2;
  const seg = (k: Seg, ox: number) => {
    const r = { a: [ox + t, y, w - 2 * t, t], g: [ox + t, y + half - t / 2, w - 2 * t, t], d: [ox + t, y + h - t, w - 2 * t, t], f: [ox, y + t, t, half - 1.5 * t], b: [ox + w - t, y + t, t, half - 1.5 * t], e: [ox, y + half + t / 2, t, half - 1.5 * t], c: [ox + w - t, y + half + t / 2, t, half - 1.5 * t] }[k];
    return r as [number, number, number, number];
  };
  return (
    <g>
      {value.split("").map((ch, i) => {
        const ox = x + i * (w + gap);
        const lit = DIGITS[ch] ?? [];
        return (
          <g key={i}>
            {(["a", "b", "c", "d", "e", "f", "g"] as Seg[]).map((k) => {
              const [rx, ry, rw, rh] = seg(k, ox);
              const isOn = lit.includes(k);
              return <rect key={k} x={rx} y={ry} width={rw} height={rh} rx={t / 2} fill={isOn ? on : off} style={isOn && glow ? { filter: `drop-shadow(0 0 ${h * 0.06}px ${on})` } : undefined} />;
            })}
          </g>
        );
      })}
    </g>
  );
}

/** How wide a seven-segment number is. */
export const segWidth = (chars: number, h: number) => chars * h * 0.56 + (chars - 1) * h * 0.2;

/** Words in your handwriting. */
export function Hand({ x, y, size, children, color = "#2A2421", rotate = 0, anchor = "middle", opacity = 1, weight = 600 }: { x: number; y: number; size: number; children: ReactNode; color?: string; rotate?: number; anchor?: "start" | "middle" | "end"; opacity?: number; weight?: number }) {
  return (
    <text x={x} y={y} fontSize={size} fontFamily={HAND} fontWeight={weight} fill={color} textAnchor={anchor} opacity={opacity} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {children}
    </text>
  );
}

/** Words scratched into plaster: pale, as if gouged with a key. */
export function Scratched({ x, y, size, children, rotate = 0, anchor = "middle" }: { x: number; y: number; size: number; children: ReactNode; rotate?: number; anchor?: "start" | "middle" | "end" }) {
  const t = rotate ? `rotate(${rotate} ${x} ${y})` : undefined;
  return (
    <g transform={t}>
      <text x={x + 2} y={y + 2} fontSize={size} fontFamily={HAND} fontWeight={700} fill="#000" opacity={0.35} textAnchor={anchor}>
        {children}
      </text>
      <text x={x} y={y} fontSize={size} fontFamily={HAND} fontWeight={700} fill="#EDE3CF" opacity={0.85} textAnchor={anchor}>
        {children}
      </text>
    </g>
  );
}

/** Break text into lines of at most `per` characters, at spaces. */
export function wrap(text: string, per: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > per) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

/** The room's memory: scratches in your handwriting, each more frantic than the last (the newest that fit). */
export function Scratches({ lines, x, y, width, height }: { lines: readonly string[]; x: number; y: number; width: number; height: number }) {
  if (lines.length === 0) return null;
  const blocks: Array<{ k: number; size: number; rows: string[] }> = [];
  let used = 0;
  for (let k = lines.length - 1; k >= 0; k--) {
    const size = 28 + Math.min(k, 8) * 1.6;
    const rows = wrap(lines[k]!, Math.max(8, Math.floor(width / (size * 0.47))));
    const need = rows.length * size * 1.02 + 12;
    if (blocks.length > 0 && used + need > height) break;
    blocks.unshift({ k, size, rows });
    used += need;
  }
  let cy = y;
  return (
    <g data-scratches={lines.length}>
      {blocks.map(({ k, size, rows }) => {
        const tilt = ((k * 37) % 7) - 3 - Math.min(k, 8) * 0.5;
        const top = cy;
        cy += rows.length * size * 1.02 + 12;
        return (
          <g key={k} transform={`rotate(${tilt} ${x} ${top})`}>
            {rows.map((row, j) => (
              <Scratched key={j} x={x + (((k * 29) % 24) - 12)} y={top + size * 0.8 + j * size * 1.02} size={size} anchor="start">
                {row}
              </Scratched>
            ))}
          </g>
        );
      })}
    </g>
  );
}

/** Seconds left as a clock's face would put it (00–99, or 100). */
export const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");
