// Gamepad buttons on a menu screen: each fires once per press. Buttons already held when the screen
// opens (the jump that finished a level) must be let go first.
import { useEffect, useEffectEvent } from "react";

export function useGamepadButtons(handlers: Partial<Record<number, () => void>>) {
  const fire = useEffectEvent((button: number) => {
    handlers[button]?.();
  });
  useEffect(() => {
    if (typeof navigator.getGamepads !== "function") return;
    const held = new Set<number>([0, 1, 2, 3, 9]);
    const timer = setInterval(() => {
      const down = new Set<number>();
      for (const pad of navigator.getGamepads()) pad?.buttons.forEach((b, i) => b.pressed && down.add(i));
      for (const i of down) if (!held.has(i)) fire(i);
      held.clear();
      down.forEach((i) => held.add(i));
    }, 50);
    return () => clearInterval(timer);
  }, []);
}
