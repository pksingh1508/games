// Your hand (Plan/12-cursor-escape.md §2, §12): mouse movement, gathered between ticks. On a computer
// the pointer is locked (Pointer Lock: the real cursor's hidden, the game draws its own, Esc lets go)
// and every movement counts. In trackpad mode (phones, and computers without the lock) you drag: the
// cursor moves with your finger (or the mouse, with a button held), and a quick tap is a click.
// Movement is turned into desktop pixels: screen pixels × your sensitivity ÷ the desktop's scale.
import type { Input } from "../core/sim";

export type HandMode = "lock" | "drag";

/** A tap: this short, and this still (screen px). */
const TAP_MS = 260;
const TAP_SLOP = 9;

export interface PointerOptions {
  mode: () => HandMode;
  /** Movement multiplier (from the options, or calibration). */
  sensitivity: () => number;
  /** Screen px per desktop px. */
  scale: () => number;
  /** Whether the game wants input right now (not paused). */
  live: () => boolean;
  /** Something happened (the first movement, a click): for audio, which needs a gesture. */
  onActivity?: () => void;
}

export class PointerInput {
  private dx = 0;
  private dy = 0;
  private clicks = 0;
  private drag: { id: number; x: number; y: number; at: number; moved: number } | null = null;
  private off: Array<() => void> = [];

  constructor(
    private readonly el: HTMLElement,
    private readonly options: PointerOptions,
  ) {}

  attach() {
    this.detach();
    const doc = document;
    const locked = () => doc.pointerLockElement === this.el;
    const move = (e: MouseEvent) => {
      if (this.options.mode() !== "lock" || !locked() || !this.options.live()) return;
      this.dx += e.movementX;
      this.dy += e.movementY;
    };
    const down = (e: MouseEvent) => {
      if (this.options.mode() !== "lock" || !locked() || !this.options.live() || e.button !== 0) return;
      this.clicks++;
      this.options.onActivity?.();
    };
    doc.addEventListener("mousemove", move);
    doc.addEventListener("mousedown", down);
    this.off.push(() => doc.removeEventListener("mousemove", move));
    this.off.push(() => doc.removeEventListener("mousedown", down));

    // Trackpad mode: drag to move, tap to click.
    const pdown = (e: PointerEvent) => {
      if (this.options.mode() !== "drag" || !this.options.live() || this.drag) return;
      // The taskbar's own buttons aren't the trackpad.
      if (e.target instanceof Element && e.target.closest("button")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this.el.setPointerCapture(e.pointerId);
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), moved: 0 };
      this.options.onActivity?.();
    };
    const pmove = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      const mx = e.clientX - d.x;
      const my = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      d.moved += Math.abs(mx) + Math.abs(my);
      if (this.options.live()) {
        this.dx += mx;
        this.dy += my;
      }
    };
    const pup = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      if (e.type === "pointerup" && performance.now() - d.at < TAP_MS && d.moved < TAP_SLOP && this.options.live()) this.clicks++;
    };
    this.el.addEventListener("pointerdown", pdown);
    this.el.addEventListener("pointermove", pmove);
    this.el.addEventListener("pointerup", pup);
    this.el.addEventListener("pointercancel", pup);
    this.off.push(() => this.el.removeEventListener("pointerdown", pdown));
    this.off.push(() => this.el.removeEventListener("pointermove", pmove));
    this.off.push(() => this.el.removeEventListener("pointerup", pup));
    this.off.push(() => this.el.removeEventListener("pointercancel", pup));
  }

  detach() {
    this.off.forEach((off) => off());
    this.off = [];
    this.drag = null;
  }

  /** Forget anything gathered (a pause, a restart). */
  clear() {
    this.dx = this.dy = 0;
    this.clicks = 0;
  }

  /** This tick's input: everything since the last one. */
  take(): Input {
    const k = this.options.sensitivity() / Math.max(0.1, this.options.scale());
    const input: Input = { dx: this.dx * k, dy: this.dy * k, click: this.clicks > 0 };
    this.dx = this.dy = 0;
    if (this.clicks > 0) this.clicks--;
    return input;
  }
}
