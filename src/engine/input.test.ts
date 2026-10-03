import { describe, expect, it } from "vitest";
import { Input, keyLabel } from "./input";

type Action = "left" | "jump";
const bindings = { left: { keys: ["ArrowLeft", "KeyA"] }, jump: { keys: ["Space"] } };

function key(target: EventTarget, type: "keydown" | "keyup", code: string) {
  target.dispatchEvent(new KeyboardEvent(type, { code, cancelable: true }));
}

describe("Input", () => {
  it("never loses a tap that happened between two ticks", () => {
    const target = new EventTarget() as Window;
    const input = new Input<Action>(bindings);
    input.attach(target);
    key(target, "keydown", "Space");
    key(target, "keyup", "Space");
    expect(input.isDown("jump")).toBe(false);
    expect(input.sample("jump")).toBe(true);
    expect(input.sample("jump")).toBe(false);
    input.detach();
  });

  it("maps several keys and on-screen buttons to one action", () => {
    const target = new EventTarget() as Window;
    const input = new Input<Action>(bindings);
    input.attach(target);
    key(target, "keydown", "KeyA");
    expect(input.isDown("left")).toBe(true);
    key(target, "keyup", "KeyA");
    input.press("left");
    input.press("left");
    input.release("left");
    expect(input.isDown("left")).toBe(true);
    input.release("left");
    expect(input.isDown("left")).toBe(false);
  });

  it("tells listeners about presses once, not on key repeat", () => {
    const target = new EventTarget() as Window;
    const input = new Input<Action>(bindings);
    input.attach(target);
    const presses: Action[] = [];
    input.onPress((a) => presses.push(a));
    key(target, "keydown", "Space");
    target.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", repeat: true }));
    key(target, "keyup", "Space");
    expect(presses).toEqual(["jump"]);
  });

  it("names keys for the controls screen", () => {
    expect(keyLabel("ArrowLeft")).toBe("←");
    expect(keyLabel("KeyW")).toBe("W");
    expect(keyLabel("Space")).toBe("Space");
  });
});
