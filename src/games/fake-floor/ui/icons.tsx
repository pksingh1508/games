// Small pixel-art icons as SVG rectangles (crisp at any size): the three medals, pebbles, falls,
// locks, keys, the eye. Medals differ in shape, not just colour (Plan §11).
import type { MedalId } from "../core/medals";
import { E } from "../render/palette";

type Px = readonly [x: number, y: number, w: number, h: number, fill: string];

function PixelSvg({ size, w, h, pixels, label, className }: { size: number; w: number; h: number; pixels: readonly Px[]; label?: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {pixels.map(([x, y, pw, ph, fill], i) => (
        <rect key={i} x={x} y={y} width={pw} height={ph} fill={fill} />
      ))}
    </svg>
  );
}

const K = E.ink;
const DIM = "#b9b4a8";

/** Clean: a sparkle. Barefoot: a footprint. Quick: a stopwatch. Dimmed when not earned. */
export function MedalIcon({ medal, got, size = 18, label }: { medal: MedalId; got: boolean; size?: number; label?: string }) {
  const c = (colour: string) => (got ? colour : DIM);
  const shapes: Record<MedalId, Px[]> = {
    clean: [
      [5, 0, 2, 12, c(E.amber)],
      [0, 5, 12, 2, c(E.amber)],
      [3, 3, 6, 6, c(E.yellow)],
      [5, 5, 2, 2, c(E.white)],
      [1, 1, 2, 2, c(E.yellow)],
      [9, 9, 2, 2, c(E.yellow)],
    ],
    barefoot: [
      [3, 4, 6, 7, c(E.tanSkin)],
      [4, 3, 4, 9, c(E.skin)],
      [2, 0, 2, 2, c(E.skin)],
      [4, 0, 2, 2, c(E.skin)],
      [6, 0, 2, 2, c(E.skin)],
      [8, 1, 2, 2, c(E.skin)],
      [4, 11, 4, 1, c(E.tanSkin)],
    ],
    quick: [
      [4, 0, 4, 1, c(K)],
      [5, 1, 2, 1, c(K)],
      [2, 2, 8, 1, c(K)],
      [1, 3, 10, 8, c(K)],
      [2, 3, 8, 8, c(E.white)],
      [2, 11, 8, 1, c(K)],
      [5, 4, 2, 4, c(E.red)],
      [6, 7, 3, 1, c(E.red)],
    ],
  };
  return <PixelSvg size={size} w={12} h={12} pixels={shapes[medal]} label={label} />;
}

export function PebbleIcon({ size = 14, filled = true }: { size?: number; filled?: boolean }) {
  const fill = filled ? E.steel : "transparent";
  const light = filled ? E.mist : "transparent";
  return (
    <PixelSvg
      size={size}
      w={6}
      h={5}
      pixels={[
        [1, 0, 4, 1, K],
        [0, 1, 1, 3, K],
        [5, 1, 1, 3, K],
        [1, 4, 4, 1, K],
        [1, 1, 4, 3, fill],
        [2, 1, 2, 1, light],
      ]}
    />
  );
}

/** Falls: a little figure tumbling down. */
export function FallIcon({ size = 14 }: { size?: number }) {
  return (
    <PixelSvg
      size={size}
      w={9}
      h={11}
      pixels={[
        [2, 0, 5, 2, E.amber],
        [1, 2, 7, 1, K],
        [2, 3, 5, 4, E.night],
        [4, 4, 2, 2, E.white],
        [1, 7, 2, 2, K],
        [6, 7, 2, 2, K],
        [3, 9, 1, 2, E.mist],
        [5, 9, 1, 2, E.mist],
      ]}
    />
  );
}

export function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <PixelSvg
      size={size}
      w={8}
      h={10}
      pixels={[
        [2, 0, 4, 1, K],
        [1, 1, 1, 3, K],
        [6, 1, 1, 3, K],
        [0, 4, 8, 6, K],
        [1, 5, 6, 4, E.amber],
        [3, 6, 2, 2, K],
      ]}
    />
  );
}

export function KeyIcon({ size = 14 }: { size?: number }) {
  return (
    <PixelSvg
      size={size}
      w={11}
      h={6}
      pixels={[
        [0, 1, 4, 4, K],
        [1, 2, 2, 2, E.amber],
        [4, 2, 7, 2, E.amber],
        [8, 4, 1, 2, E.amber],
        [10, 4, 1, 2, E.amber],
      ]}
    />
  );
}

export function EyeIcon({ size = 20 }: { size?: number }) {
  return (
    <PixelSvg
      size={size}
      w={11}
      h={7}
      pixels={[
        [3, 0, 5, 1, "#fff"],
        [1, 1, 2, 1, "#fff"],
        [8, 1, 2, 1, "#fff"],
        [0, 2, 1, 3, "#fff"],
        [10, 2, 1, 3, "#fff"],
        [1, 5, 2, 1, "#fff"],
        [8, 5, 2, 1, "#fff"],
        [3, 6, 5, 1, "#fff"],
        [4, 2, 3, 3, "#fff"],
      ]}
    />
  );
}

/** A floor tile (the Showroom's), as on the title: "offset" is a fake one, its grout out of line. */
export function TileArt({ fake = false, className }: { fake?: boolean; className?: string }) {
  const sx = fake ? 3 : 0;
  const sy = fake ? 2 : 0;
  const mid = 8 + sy;
  const lines: Px[] = [[0, mid, 16, 1, E.brown]];
  for (let x = 0; x < 24; x += 8) {
    lines.push([(x + sx) % 16, 2, 1, mid - 2, E.brown]);
    lines.push([(x + 4 + sx) % 16, mid + 1, 1, 15 - mid - 1, E.brown]);
  }
  return (
    <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden preserveAspectRatio="none">
      <rect width="16" height="16" fill={E.tan} />
      {lines.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
      <rect width="16" height="2" fill={E.cream} />
      <rect width="16" height="1" fill={E.white} />
      <rect y="15" width="16" height="1" fill={E.umber} />
    </svg>
  );
}
