// Pointer input for a level (Plan/10-last-pixel.md §2 "Controls", §12 "Smooth strokes"): press and drag to use
// the tool (coalesced events fill in fast strokes), click or tap to catch, Shift-drag (or drag with the net
// tool) to throw a net, tap with the bait tool to put bait down, the wheel or a pinch for the magnifier. The
// mouse is followed even off the canvas: a fleeing Pix watches it, and a mimic copies it.
import type { Rect, Vec } from "../core/geometry";
import { rectOf } from "../core/geometry";
import type { Command, Input } from "../core/world";

export type DragMode = "paint" | "net" | "bait";

export interface InputOptions {
  /** Screen → cells (relative to the canvas). */
  cellOf(clientX: number, clientY: number): Vec;
  /** What a drag does right now (shift: the Shift key's down). */
  mode(shift: boolean): DragMode;
  /** Taking input (not paused). */
  live(): boolean;
  /** The first touch or click (audio may start). */
  onActivity(): void;
  /** The wheel or a pinch: the magnifier on or off. */
  onLens(on: boolean): void;
}

export class CanvasInput {
  /** The pointer right now (cells), or null; for drawing. */
  pointer: Vec | null = null;
  down = false;
  /** The last pointer was a finger (no hover). */
  touch = false;
  /** A net being drawn (cells), for drawing. */
  netRect: Rect | null = null;
  private path: Vec[] = [];
  private commands: Command[] = [];
  private net: { from: Vec; to: Vec; ticks: number } | null = null;
  private shift = false;
  private active: number | null = null;
  private touches = new Map<number, Vec>();
  private pinch = 0;

  constructor(
    private readonly stage: HTMLElement,
    private readonly options: InputOptions,
  ) {}

  attach() {
    this.stage.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    this.stage.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKey);
    document.addEventListener("pointerleave", this.onLeave);
  }

  detach() {
    this.stage.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    this.stage.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKey);
    document.removeEventListener("pointerleave", this.onLeave);
  }

  /** A command from elsewhere (the tool bar, a key, pausing, the tab). */
  push(command: Command) {
    this.commands.push(command);
  }

  /** Let go of everything (pausing, a new level). */
  clear() {
    if (this.down || this.net) this.commands.push({ type: "release" });
    this.down = false;
    this.net = null;
    this.netRect = null;
    this.path = [];
    this.active = null;
    this.touches.clear();
  }

  /** This tick's input (and the queue's emptied). */
  take(): Input {
    const commands = this.commands;
    this.commands = [];
    const path = this.path;
    this.path = [];
    let net: Input["net"] = null;
    if (this.net) {
      this.net.ticks++;
      net = { rect: rectOf(this.net.from, this.net.to), ticks: this.net.ticks };
    }
    const pointer = this.touch && !this.down && !this.net ? null : this.pointer;
    return { pointer, down: this.down, path: this.down ? path : [], net, commands };
  }

  private onDown = (e: PointerEvent) => {
    if (!this.options.live()) return;
    // Buttons and panels on top of the canvas handle their own clicks.
    if ((e.target as HTMLElement).closest("button, [data-hud-handle], [data-grab], [role=dialog]")) return;
    this.options.onActivity();
    this.touch = e.pointerType === "touch";
    if (e.pointerType === "touch") {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touches.size === 2) {
        // Two fingers: a pinch (the magnifier), not a stroke.
        const [a, b] = [...this.touches.values()];
        this.pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        this.clear();
        this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        return;
      }
    }
    if (this.active !== null) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    this.active = e.pointerId;
    try {
      this.stage.setPointerCapture(e.pointerId);
    } catch {
      // Not every pointer can be captured.
    }
    const at = this.options.cellOf(e.clientX, e.clientY);
    this.pointer = at;
    const mode = this.options.mode(this.shift || e.shiftKey);
    if (mode === "net") {
      this.net = { from: at, to: at, ticks: 0 };
      this.netRect = rectOf(at, at);
      return;
    }
    if (mode === "bait") {
      this.commands.push({ type: "bait", at });
      return;
    }
    this.down = true;
    this.path = [at];
    this.commands.push({ type: "press", at });
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" && this.touches.has(e.pointerId)) {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touches.size === 2) {
        const [a, b] = [...this.touches.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        if (this.pinch && Math.abs(d - this.pinch) > 40) {
          this.options.onLens(d > this.pinch);
          this.pinch = d;
        }
        return;
      }
    }
    if (e.pointerType === "mouse") this.touch = false;
    if (this.active !== null && e.pointerId !== this.active) return;
    if (this.active === null && e.pointerType === "touch") return;
    const events = this.active !== null && typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    const samples = events.length ? events : [e];
    for (const s of samples) {
      const at = this.options.cellOf(s.clientX, s.clientY);
      this.pointer = at;
      if (this.net) {
        this.net.to = at;
        this.netRect = rectOf(this.net.from, at);
      } else if (this.down) this.path.push(at);
    }
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") this.touches.delete(e.pointerId);
    if (this.active === null || e.pointerId !== this.active) return;
    this.active = null;
    if (this.net) {
      const rect = rectOf(this.net.from, this.net.to);
      this.commands.push({ type: "net", rect, ticks: this.net.ticks });
      this.net = null;
      this.netRect = null;
      return;
    }
    if (this.down) {
      this.down = false;
      this.commands.push({ type: "release" });
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.options.live()) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) > 2) this.options.onLens(e.deltaY < 0);
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Shift") this.shift = e.type === "keydown";
  };

  private onLeave = () => {
    if (!this.down && !this.net) this.pointer = null;
  };
}
