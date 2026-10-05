// Drawing the view: the wall or close-up you're looking at, as the room is right now. A mirrored room's walls are
// drawn flipped (and its east and west swapped, which the loop's view already accounts for); the room's memory
// (scratches in your handwriting) goes on the wall you wake up facing, always readable.
import { memo, type ComponentType } from "react";
import type { ChapterId } from "../core/types";
import { CLOCK_ROOM_ART } from "./clock-room";
import { Defs, H, Scratches, W, type ArtState } from "./kit";
import { KITCHEN_ART } from "./kitchen";
import { WAITING_ROOM_ART } from "./waiting-room";

type Art = {
  walls: Record<"north" | "east" | "south" | "west", ComponentType<{ a: ArtState }>>;
  closeups: Record<string, ComponentType<{ a: ArtState }>>;
  scratches: { wall: string; x: number; y: number; width: number; height: number };
};

export const ART: Record<ChapterId, Art> = {
  "waiting-room": WAITING_ROOM_ART as unknown as Art,
  kitchen: KITCHEN_ART as unknown as Art,
  "clock-room": CLOCK_ROOM_ART as unknown as Art,
};

const isWall = (v: string): v is "north" | "east" | "south" | "west" => v === "north" || v === "east" || v === "south" || v === "west";

/** The view, drawn. Only redrawn when the picture changes: the runtime hands over the same ArtState until it does. */
export const SceneArt = memo(function SceneArt({ a, label }: { a: ArtState; label?: string }) {
  const art = ART[a.chapter];
  const wall = isWall(a.place);
  const Comp = wall ? art.walls[a.place as "north"] : art.closeups[a.place];
  const body = Comp ? <Comp a={a} /> : <rect width={W} height={H} fill="#1A1614" />;
  const s = art.scratches;
  const scratchX = a.mirrored ? W - s.x - s.width : s.x;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label} style={{ display: "block", width: "100%", height: "100%" }}>
      <Defs />
      {wall && a.mirrored ? <g transform={`translate(${W} 0) scale(-1 1)`}>{body}</g> : body}
      {wall && s.wall === a.place && <Scratches lines={a.scratches} x={scratchX} y={s.y} width={s.width} height={s.height} />}
      {a.flags.has("dim") && <rect width={W} height={H} fill="#000" opacity={0.5} pointerEvents="none" />}
      {a.mirrored && <rect width={W} height={H} fill="#6A8CFF" opacity={0.06} pointerEvents="none" />}
      {a.extra && <rect width={W} height={H} fill="#FFB45C" opacity={0.12} pointerEvents="none" />}
    </svg>
  );
});

/** Where a hotspot sits on screen (a mirrored wall flips it). Scene units. */
export function shownBox(box: readonly [number, number, number, number], mirroredWall: boolean): [number, number, number, number] {
  const [x, y, w, h] = box;
  return mirroredWall ? [W - x - w, y, w, h] : [x, y, w, h];
}
