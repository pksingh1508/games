// Small pixel-art icons as SVG rectangles (crisp at any size): medals, skulls, coins, locks.
import type { Medal } from "../core/medals";

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

const MEDAL_COLOURS: Record<Medal, [string, string, string]> = {
  dev: ["#73eff7", "#41a6f6", "#f4f4f4"],
  gold: ["#ffcd75", "#ef7d57", "#fff3c4"],
  silver: ["#c2d3e0", "#94b0c2", "#f4f4f4"],
  bronze: ["#e3a06b", "#a0603e", "#f4d0b0"],
};

export function MedalIcon({ medal, size = 24, className }: { medal: Medal | null; size?: number; className?: string }) {
  const K = "#1a1c2c";
  if (!medal) {
    return (
      <PixelSvg
        size={size}
        w={12}
        h={14}
        className={className}
        pixels={[
          [3, 6, 6, 1, "#94b0c2"],
          [2, 7, 1, 5, "#94b0c2"],
          [9, 7, 1, 5, "#94b0c2"],
          [3, 12, 6, 1, "#94b0c2"],
        ]}
      />
    );
  }
  const [fill, dark, light] = MEDAL_COLOURS[medal];
  const ribbon = medal === "dev" ? "#5d275d" : "#c8224b";
  return (
    <PixelSvg
      size={size}
      w={12}
      h={14}
      className={className}
      label={`${medal === "dev" ? "Dev" : medal[0]!.toUpperCase() + medal.slice(1)} medal`}
      pixels={[
        [2, 0, 3, 5, ribbon],
        [7, 0, 3, 5, ribbon],
        [3, 0, 1, 5, "#f4f4f4"],
        [8, 0, 1, 5, "#f4f4f4"],
        [3, 4, 6, 1, K],
        [2, 5, 8, 1, K],
        [1, 6, 10, 6, K],
        [2, 12, 8, 1, K],
        [3, 13, 6, 1, K],
        [3, 5, 6, 1, fill],
        [2, 6, 8, 6, fill],
        [3, 12, 6, 1, dark],
        [9, 7, 1, 5, dark],
        [3, 6, 2, 1, light],
        [2, 7, 1, 3, light],
        // Dev: a diamond. The rest: a stamped stripe.
        ...(medal === "dev"
          ? ([
              [5, 7, 2, 1, "#f4f4f4"],
              [4, 8, 4, 2, "#f4f4f4"],
              [5, 10, 2, 1, "#f4f4f4"],
            ] as Px[])
          : ([[5, 7, 2, 4, dark]] as Px[])),
      ]}
    />
  );
}

export function SkullIcon({ size = 16, className }: { size?: number; className?: string }) {
  const W = "#f4f4f4";
  const K = "#1a1c2c";
  return (
    <PixelSvg
      size={size}
      w={9}
      h={9}
      className={className}
      pixels={[
        [1, 0, 7, 1, K],
        [0, 1, 9, 5, K],
        [1, 6, 7, 3, K],
        [1, 1, 7, 5, W],
        [2, 6, 5, 2, W],
        [2, 3, 2, 2, K],
        [5, 3, 2, 2, K],
        [4, 5, 1, 1, K],
        [3, 7, 1, 1, K],
        [5, 7, 1, 1, K],
      ]}
    />
  );
}

export function CoinIcon({ size = 14, got = true, className }: { size?: number; got?: boolean; className?: string }) {
  const K = "#1a1c2c";
  const fill = got ? "#ffcd75" : "#c9cfd6";
  const dark = got ? "#ef7d57" : "#94a3b0";
  return (
    <PixelSvg
      size={size}
      w={8}
      h={10}
      className={className}
      label={got ? "Coin collected" : "Coin not collected"}
      pixels={[
        [2, 0, 4, 1, K],
        [1, 1, 6, 1, K],
        [0, 2, 8, 6, K],
        [1, 8, 6, 1, K],
        [2, 9, 4, 1, K],
        [2, 1, 4, 1, fill],
        [1, 2, 6, 6, fill],
        [2, 8, 4, 1, dark],
        [6, 3, 1, 5, dark],
        [2, 3, 1, 3, "#fff3c4"],
      ]}
    />
  );
}

export function LockIcon({ size = 18, className }: { size?: number; className?: string }) {
  const K = "#23153c";
  return (
    <PixelSvg
      size={size}
      w={10}
      h={12}
      className={className}
      pixels={[
        [2, 0, 6, 1, K],
        [1, 1, 2, 4, K],
        [7, 1, 2, 4, K],
        [0, 5, 10, 7, K],
        [1, 6, 8, 5, "#ffcd75"],
        [4, 7, 2, 3, K],
      ]}
    />
  );
}
