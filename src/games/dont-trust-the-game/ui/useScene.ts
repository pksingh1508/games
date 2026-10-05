"use client";

// What a scene sets up on the way in: the touch pad (moving, jumping, the ☰ menu), Esc for the fiction's pause
// menu, and the step it starts on (for hints).
import { useEffect, useEffectEvent } from "react";
import { useGame } from "./context";

/** `fill`: on a phone held upright, the scene wants the whole screen (a page, a menu under the picture). A plain
 * platformer doesn't: the monitor shrinks to HELPER and the picture. */
export function useScene({ move, menu, jump = "JUMP", fill = !move, onMenu }: { move: boolean; menu: boolean; jump?: string; fill?: boolean; onMenu?: () => void }) {
  const { director } = useGame();
  const open = useEffectEvent(() => onMenu?.());

  useEffect(() => {
    director.setPad({ move, menu, jump, fill });
  }, [director, move, menu, jump, fill]);

  useEffect(() => {
    if (!menu) return;
    director.setMenu(() => open());
    const key = (e: KeyboardEvent) => {
      if (e.code !== "Escape" || e.repeat) return;
      // Not while a real dialog (the real settings) is open, and not while typing.
      if (document.querySelector("[role=dialog][data-state=open]")) return;
      e.preventDefault();
      open();
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      director.setMenu(null);
    };
  }, [director, menu]);

  useEffect(() => () => director.setPad({ move: false, menu: false, jump: "JUMP", fill: true }), [director]);
}
