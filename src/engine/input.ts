// Keyboard, gamepad and on-screen buttons, mapped to a game's actions (Plan/gameStack.md §6.2,
// §14). Keys use `event.code` (the physical key), so WASD also works on AZERTY keyboards, and
// bindings can be remapped. Games read actions, never keys.
//
// A quick tap is never lost: a press is latched until the game samples it, even if the key went
// back up between two simulation ticks.

export interface Binding {
  /** KeyboardEvent.code values, e.g. "ArrowLeft", "KeyA", "Space". */
  keys: string[];
  /** Standard-mapping gamepad buttons (0 = A, 3 = Y, 9 = Start, 14/15 = D-pad left/right). */
  buttons?: number[];
  /** A stick direction: axis index and sign. */
  axis?: { index: number; dir: -1 | 1 };
}

export type Bindings<A extends string> = Record<A, Binding>;

const AXIS_DEADZONE = 0.4;

/** Names for keys in the controls screen. */
export function keyLabel(code: string): string {
  const named: Record<string, string> = {
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    ArrowDown: "↓",
    Space: "Space",
    Enter: "Enter",
    Escape: "Esc",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    ControlLeft: "Ctrl",
    ControlRight: "Ctrl",
    Backspace: "⌫",
    Tab: "Tab",
  };
  if (named[code]) return named[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num ${code.slice(6)}`;
  return code;
}

export class Input<A extends string> {
  private keys = new Set<A>();
  private latched = new Set<A>();
  private pad = new Set<A>();
  private touches = new Map<A, number>();
  private pressListeners = new Set<(action: A) => void>();
  private attached: (() => void) | null = null;

  constructor(private bindings: Bindings<A>) {}

  setBindings(bindings: Bindings<A>) {
    this.bindings = bindings;
    this.clear();
  }

  private actionsFor(code: string): A[] {
    return (Object.keys(this.bindings) as A[]).filter((a) => this.bindings[a].keys.includes(code));
  }

  /** Listen to the keyboard. `capture` decides which key events the game takes (default: all mapped ones). */
  attach(target: Window = window, capture: (event: KeyboardEvent) => boolean = () => true) {
    this.detach();
    const down = (event: KeyboardEvent) => {
      if (!capture(event)) return;
      const actions = this.actionsFor(event.code);
      if (!actions.length) return;
      event.preventDefault();
      for (const a of actions) {
        if (!event.repeat && !this.keys.has(a)) {
          this.latched.add(a);
          this.pressListeners.forEach((listener) => listener(a));
        }
        this.keys.add(a);
      }
    };
    const up = (event: KeyboardEvent) => {
      for (const a of this.actionsFor(event.code)) this.keys.delete(a);
    };
    const blur = () => this.clear();
    target.addEventListener("keydown", down);
    target.addEventListener("keyup", up);
    target.addEventListener("blur", blur);
    this.attached = () => {
      target.removeEventListener("keydown", down);
      target.removeEventListener("keyup", up);
      target.removeEventListener("blur", blur);
    };
  }

  detach() {
    this.attached?.();
    this.attached = null;
  }

  /** Read every connected gamepad. Call once per frame. */
  pollGamepads() {
    const before = new Set(this.pad);
    this.pad.clear();
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;
    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad) continue;
      for (const a of Object.keys(this.bindings) as A[]) {
        const binding = this.bindings[a];
        const button = binding.buttons?.some((b) => gamepad.buttons[b]?.pressed);
        const axis = binding.axis && (gamepad.axes[binding.axis.index] ?? 0) * binding.axis.dir > AXIS_DEADZONE;
        if (button || axis) this.pad.add(a);
      }
    }
    for (const a of this.pad) {
      if (!before.has(a)) {
        this.latched.add(a);
        this.pressListeners.forEach((listener) => listener(a));
      }
    }
  }

  /** On-screen buttons: several fingers can hold the same action. */
  press(action: A) {
    const count = this.touches.get(action) ?? 0;
    this.touches.set(action, count + 1);
    if (count === 0) {
      this.latched.add(action);
      this.pressListeners.forEach((listener) => listener(action));
    }
  }

  release(action: A) {
    const count = this.touches.get(action) ?? 0;
    if (count <= 1) this.touches.delete(action);
    else this.touches.set(action, count - 1);
  }

  /** Held right now, by any device. */
  isDown(action: A): boolean {
    return this.keys.has(action) || this.pad.has(action) || (this.touches.get(action) ?? 0) > 0;
  }

  /** Held now, or pressed since the last sample (which forgets the press). Call once per tick. */
  sample(action: A): boolean {
    const result = this.isDown(action) || this.latched.has(action);
    this.latched.delete(action);
    return result;
  }

  /** A press of an action (menus, pause, restart): fires once per press. */
  onPress(listener: (action: A) => void): () => void {
    this.pressListeners.add(listener);
    return () => this.pressListeners.delete(listener);
  }

  clear() {
    this.keys.clear();
    this.latched.clear();
    this.pad.clear();
    this.touches.clear();
  }
}
