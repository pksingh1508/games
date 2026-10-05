// Your hands (Plan/11-panic-stack.md §2 "Controls"). On the belt: press and hold (or press and drag) to pick an
// item up; a quick tap is the tap test. Drag to move it, let go to drop it, or with hold-to-drop on, lifting
// your finger keeps hold and the Drop button lets go. Q / E or the mouse wheel turn it (on a phone: a second
// finger twisting, or the turn buttons). With no mouse at all: 1–3 pick up a belt item, the arrow keys carry
// it, Q / E turn it, Enter drops it, T taps the next item. Fingers carry things a little above themselves, so
// you can see what you're holding.
import type { Vec } from "../core/geometry";
import type { Command, TickInput } from "../core/sim";

export interface InputHost {
  beltAt(x: number, y: number, touch: boolean): number | null;
  beltCentre(uid: number): Vec | null;
  /** The belt's uids, front (nearest the drop) first. */
  beltOrder(): number[];
  toWorld(x: number, y: number): Vec;
  /** The held item's centre (m), or null. */
  heldAt(): Vec | null;
  live(): boolean;
  holdToDrop(): boolean;
  /** The first touch or key (audio may start). */
  onActivity(): void;
}

/** A press shorter than this, that doesn't move, is a tap test. */
const HOLD_MS = 180;
const MOVE_PX = 8;
/** How far above a finger a held item rides (m). */
const FINGER_LIFT = 0.6;
/** Arrow keys carry things this fast (m/s). */
const KEY_SPEED = 2.4;

export class StackInput {
  /** The pointer in the world and on screen, for drawing and hovering. */
  pointer: Vec | null = null;
  screen: Vec | null = null;
  touch = false;
  /** The belt item under the pointer. */
  hover: number | null = null;
  /** Where on the held item the hand holds (its own frame, m): the rubber band's end. */
  grip: Vec | null = null;
  private aim: Vec | null = null;
  /** The held item's centre, from the pointer (m). */
  private offset: Vec | null = null;
  private commands: Command[] = [];
  private pending: { id: number; uid: number; x: number; y: number; at: number; touch: boolean } | null = null;
  private drag: number | null = null;
  private twist: { id: number; last: number; turned: number } | null = null;
  private keys = new Set<string>();
  private keyCarry = false;
  /** A pick-up's been asked for and the simulation hasn't made it yet (don't forget the grip meanwhile). */
  private grabbing = false;
  private touches = new Map<number, Vec>();

  constructor(
    private readonly stage: HTMLElement,
    private readonly host: InputHost,
  ) {}

  attach() {
    this.stage.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    this.stage.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
  }

  detach() {
    this.stage.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    this.stage.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  push(c: Command) {
    this.commands.push(c);
  }

  /** Let go of everything (pausing, a new level, the end). */
  clear() {
    this.pending = null;
    this.grabbing = false;
    this.drag = null;
    this.twist = null;
    this.offset = null;
    this.grip = null;
    this.aim = null;
    this.keyCarry = false;
    this.keys.clear();
    this.touches.clear();
  }

  /** This tick's input; `dt` is a tick (s). */
  take(dt: number): TickInput {
    // A press held long enough on a belt item picks it up.
    if (this.pending && performance.now() - this.pending.at >= HOLD_MS) this.pickUp();
    const held = this.host.heldAt();
    if (held) this.grabbing = false;
    if (!held && !this.grabbing) {
      this.offset = null;
      this.grip = null;
      this.keyCarry = false;
      if (!this.pending) this.aim = null;
    } else if (!held) {
      // Waiting for the pick-up to happen.
    } else if (this.drag !== null && this.pointer && this.offset) {
      // Fingers carry things above themselves.
      if (this.touch) this.offset = { x: this.offset.x * 0.85, y: this.offset.y + (FINGER_LIFT - this.offset.y) * 0.15 };
      this.aim = { x: this.pointer.x + this.offset.x, y: this.pointer.y + this.offset.y };
    } else if (this.keyCarry || (this.keys.size && held)) {
      this.aim ??= { ...held };
      const step = KEY_SPEED * dt;
      if (this.keys.has("ArrowLeft")) this.aim.x -= step;
      if (this.keys.has("ArrowRight")) this.aim.x += step;
      if (this.keys.has("ArrowUp")) this.aim.y += step;
      if (this.keys.has("ArrowDown")) this.aim.y -= step;
    } else if (held && !this.aim) {
      this.aim = { ...held };
    }
    const commands = this.commands;
    this.commands = [];
    return { aim: this.aim, commands };
  }

  private where(e: PointerEvent) {
    const r = this.stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private pickUp() {
    const p = this.pending!;
    this.pending = null;
    const at = this.host.beltCentre(p.uid);
    if (!at) return;
    this.commands.push({ type: "grab", uid: p.uid, at });
    this.grabbing = true;
    const w = this.pointer ?? at;
    this.offset = { x: at.x - w.x, y: at.y - w.y };
    this.grip = { x: w.x - at.x, y: w.y - at.y };
    this.aim = { ...at };
    this.drag = p.id;
  }

  private onDown = (e: PointerEvent) => {
    if (!this.host.live()) return;
    if ((e.target as HTMLElement).closest("button, [role=dialog], [data-hud]")) return;
    this.host.onActivity();
    this.touch = e.pointerType === "touch";
    const at = this.where(e);
    this.screen = at;
    this.pointer = this.host.toWorld(at.x, at.y);
    if (e.pointerType === "touch") this.touches.set(e.pointerId, this.pointer);
    // A second finger while carrying something: twist to turn it.
    if (this.drag !== null && e.pointerId !== this.drag) {
      if (e.pointerType === "touch") this.twist = { id: e.pointerId, last: this.twistAngle(e.pointerId), turned: 0 };
      return;
    }
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    try {
      this.stage.setPointerCapture(e.pointerId);
    } catch {
      // Fine without it.
    }
    const held = this.host.heldAt();
    if (held) {
      // Hold-to-drop: you put it down for a moment; touch again to carry on moving it.
      this.drag = e.pointerId;
      this.offset = { x: held.x - this.pointer.x, y: held.y - this.pointer.y };
      this.keyCarry = false;
      return;
    }
    const uid = this.host.beltAt(at.x, at.y, this.touch);
    if (uid !== null) this.pending = { id: e.pointerId, uid, x: at.x, y: at.y, at: performance.now(), touch: this.touch };
  };

  private onMove = (e: PointerEvent) => {
    const at = this.where(e);
    const world = this.host.toWorld(at.x, at.y);
    if (e.pointerType === "touch") this.touches.set(e.pointerId, world);
    if (this.twist && e.pointerId === this.twist.id) {
      this.twistMove();
      return;
    }
    if (this.drag !== null && e.pointerId !== this.drag) {
      this.twistMove();
      return;
    }
    this.screen = at;
    this.pointer = world;
    if (e.pointerType === "mouse") this.touch = false;
    this.hover = this.host.heldAt() ? null : this.host.beltAt(at.x, at.y, this.touch);
    const p = this.pending;
    if (p && p.id === e.pointerId && Math.hypot(at.x - p.x, at.y - p.y) > MOVE_PX) this.pickUp();
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") this.touches.delete(e.pointerId);
    if (this.twist && e.pointerId === this.twist.id) {
      this.twist = null;
      return;
    }
    const p = this.pending;
    if (p && p.id === e.pointerId) {
      // A quick tap: the tap test.
      this.pending = null;
      this.commands.push({ type: "tap", uid: p.uid });
      return;
    }
    if (this.drag === e.pointerId) {
      this.drag = null;
      this.twist = null;
      if (!this.host.holdToDrop()) this.commands.push({ type: "release" });
    }
    if (e.pointerType === "touch") {
      this.pointer = null;
      this.hover = null;
    }
  };

  private twistAngle(second: number): number {
    const a = this.touches.get(this.drag ?? -1) ?? this.pointer;
    const b = this.touches.get(second);
    if (!a || !b) return 0;
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  private twistMove() {
    const t = this.twist;
    if (!t) return;
    const now = this.twistAngle(t.id);
    let d = now - t.last;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    t.last = now;
    t.turned += d;
    const step = Math.PI / 12;
    while (Math.abs(t.turned) >= step) {
      const s = Math.sign(t.turned);
      this.commands.push({ type: "rotate", steps: s });
      t.turned -= s * step;
    }
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.host.live() || !this.host.heldAt()) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) < 1) return;
    this.commands.push({ type: "rotate", steps: e.deltaY > 0 ? -1 : 1 });
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.host.live() || document.querySelector("[role=dialog]")) return;
    if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select")) return;
    const held = this.host.heldAt();
    let used = true;
    switch (e.code) {
      case "KeyQ":
        if (held) this.commands.push({ type: "rotate", steps: 1 });
        break;
      case "KeyE":
        if (held) this.commands.push({ type: "rotate", steps: -1 });
        break;
      case "Space":
      case "Backspace":
        if (!e.repeat) this.commands.push({ type: "oops" });
        break;
      case "Enter":
        if (held && !e.repeat) {
          this.commands.push({ type: "release" });
          this.drag = null;
        } else used = false;
        break;
      case "Digit1":
      case "Digit2":
      case "Digit3": {
        if (held || e.repeat) break;
        const uid = this.host.beltOrder()[Number(e.code.slice(5)) - 1];
        const at = uid !== undefined ? this.host.beltCentre(uid) : null;
        if (uid === undefined || !at) break;
        this.host.onActivity();
        this.commands.push({ type: "grab", uid, at });
        this.grabbing = true;
        this.aim = { ...at };
        this.offset = null;
        this.grip = { x: 0, y: 0 };
        this.keyCarry = true;
        this.drag = null;
        break;
      }
      case "KeyT": {
        const uid = this.host.beltOrder()[0];
        if (uid !== undefined && !e.repeat) this.commands.push({ type: "tap", uid });
        break;
      }
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        if (held) {
          this.keys.add(e.code);
          this.keyCarry = true;
        } else used = false;
        break;
      default:
        used = false;
    }
    if (used) {
      this.host.onActivity();
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
}
