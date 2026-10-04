// Scale a pixel-art canvas to fill its container. Whole-pixel scales are crispest, so a whole
// number close to the best fit wins; otherwise it just fills the screen (on a big or high-density
// screen, uneven pixels don't show). Returns the refs for the container and the canvas's box; the
// scale is also written to a CSS variable, so the HUD can size itself in canvas pixels.
import { useEffect, useRef } from "react";

export function useFitCanvas(width: number, height: number, scaleVar: string) {
  const area = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = area.current;
    const box = frame.current;
    if (!el || !box) return;
    const fit = () => {
      let scale = Math.min(el.clientWidth / width, el.clientHeight / height);
      if (scale >= 2 && Math.floor(scale) / scale > 0.9) scale = Math.floor(scale);
      box.style.width = `${Math.floor(width * scale)}px`;
      box.style.height = `${Math.floor(height * scale)}px`;
      box.style.setProperty(scaleVar, String(scale));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width, height, scaleVar]);
  return { area, frame };
}
