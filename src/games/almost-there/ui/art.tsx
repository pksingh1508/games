"use client";

// Pip in a hat, for the menus: the same sprites as the game, drawn to a small canvas.
import { useEffect, useRef } from "react";
import { HATS, PIP, PIP_ART_X, sprite } from "../render/sprites";

export function PipPortrait({ hat, scale = 4, className, label }: { hat: number | null; scale?: number; className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    const body = sprite(PIP.idle!, "pip:idle");
    const x = 4;
    const y = canvas.height - body.height - 1;
    g.drawImage(body, x, y);
    const h = hat === null ? null : HATS[hat];
    if (h) {
      const art = sprite(h.rows, `hat:${hat}`);
      g.drawImage(art, x + PIP_ART_X + Math.round((8 - art.width) / 2) + 1, y + 1 - art.height + 1);
    }
  }, [hat]);
  return (
    <canvas
      ref={ref}
      width={19}
      height={19}
      className={className}
      style={{ width: 19 * scale, height: 19 * scale, imageRendering: "pixelated" }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
