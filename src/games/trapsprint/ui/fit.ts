// Scale the 480 × 272 canvas to fill its container. Whole-pixel scales are crispest, so a whole
// number close to the best fit wins; otherwise it just fills the screen (on a big or high-density
// screen, uneven pixels don't show). Returns the refs for the container and the canvas's box.
import { useEffect, useRef } from "react";
import { HEIGHT, WIDTH } from "../core/constants";

export function useFitCanvas() {
  const area = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = area.current;
    const box = frame.current;
    if (!el || !box) return;
    const fit = () => {
      let scale = Math.min(el.clientWidth / WIDTH, el.clientHeight / HEIGHT);
      if (scale >= 2 && Math.floor(scale) / scale > 0.9) scale = Math.floor(scale);
      box.style.width = `${Math.floor(WIDTH * scale)}px`;
      box.style.height = `${Math.floor(HEIGHT * scale)}px`;
      box.style.setProperty("--ts-scale", String(scale));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { area, frame };
}
