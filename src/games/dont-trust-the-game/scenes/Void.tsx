"use client";

// Chapter 4, the void (Plan/04-dont-trust-the-game.md §3 "Window size / rotation", "Page reload"): a wall all the way
// up. Narrow the window (or turn your phone) and it squeezes; the crank does the same. Past it, a door frame with no
// door: "door.png not found". HELPER, looking right at you: "Reload the page to fix it!" It's true.
import { RotateCw } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { playSfx } from "../audio/sound";
import { armReload, consumeReload, setRoomParam } from "../browser/tricks";
import { TILE } from "../core/constants";
import type { WorldEvent } from "../core/world";
import styles from "../dttg.module.css";
import { getLevel } from "../levels";
import type { Runtime } from "../play/runtime";
import { useGame } from "../ui/context";
import { PlatformerView, type ViewState } from "../ui/PlatformerView";
import { useScene } from "../ui/useScene";

/** Quarter turns of the crank that squeeze the wall. */
export const CRANK_TURNS = 4;
/** How much the window's shape has to change to squeeze it. */
const RESHAPE = 0.18;

export function VoidScene({ onExit, onReloaded }: { onExit: () => void; onReloaded: () => void }) {
  const { director, screen } = useGame();
  const level = getLevel("void");
  const runtime = useRef<Runtime | null>(null);
  const view = useRef<ViewState>({ brightness: 1, zoom: false, glitch: 0.5 });
  const [turns, setTurns] = useState(0);
  const [squeezed, setSqueezed] = useState(false);
  // A reload counts if HELPER told you to reload (the flag survives the reload in sessionStorage).
  const [fixed] = useState(() => consumeReload());
  const [standalone] = useState(() => typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches);
  const [armed, setArmed] = useState(false);
  useScene({ move: true, menu: false });

  const reloaded = useEffectEvent(() => onReloaded());
  useEffect(() => {
    setRoomParam(null, "replace");
    director.setStep(fixed ? "void:reload" : "void:wall");
    if (fixed) {
      director.say("v.fixed", { now: true });
      reloaded();
    }
  }, [director, fixed]);

  const squeeze = () => {
    if (squeezed) return;
    setSqueezed(true);
    runtime.current?.setFlags({ squeezed: true });
    playSfx("flip");
    director.say("v.squeezed", { now: true });
    director.setStep("void:reload");
  };
  const reshaped = useEffectEvent(() => squeeze());

  // Narrow the window, or turn the phone: the screen changes shape (from how it was when you came in), and the
  // wall gives.
  useEffect(() => {
    const el = screen.current;
    if (!el || fixed) return;
    const start = el.clientWidth / Math.max(1, el.clientHeight);
    const observer = new ResizeObserver(() => {
      const now = el.clientWidth / Math.max(1, el.clientHeight);
      if (Math.abs(now - start) / start > RESHAPE) reshaped();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [screen, fixed]);

  const crank = () => {
    if (squeezed) return;
    playSfx("lever");
    const next = turns + 1;
    setTurns(next);
    if (next >= CRANK_TURNS) squeeze();
  };

  const onEvents = (events: readonly WorldEvent[]) => {
    for (const e of events) {
      if (e.type === "zone" && e.id === "wall" && !director.hasSaid("v.wall") && !squeezed) director.say("v.wall", { soon: true });
      if ((e.type === "zone" && e.id === "door") || (e.type === "door" && !fixed)) {
        if (!fixed) {
          armReload();
          setArmed(true);
          director.say("v.door", { now: director.hasSaid("v.door") });
        }
      }
      if (e.type === "door" && fixed) onExit();
      if (e.type === "sticker") {
        director.secret("void-note");
        director.toast("A note: “If you're reading this, I'm stuck in a video game. Don't tell HELPER.”");
      }
    }
  };

  return (
    <div className={styles.view} data-scene-view="void" data-squeezed={squeezed || fixed ? "" : undefined} data-fixed={fixed ? "" : undefined}>
      <PlatformerView
        level={level}
        flags={fixed ? { squeezed: true, fixed: true } : undefined}
        view={view}
        onEvents={onEvents}
        onReady={(r) => {
          runtime.current = r;
          // After the reload, you're already past the wall.
          if (fixed) r.placeHero(20 * TILE + 3, 15 * TILE - 14);
        }}
        label="The void: a dark room with a wall all the way up, and past it an empty door frame."
      />
      {!fixed && (
        <button type="button" className={cn(styles.fakeBtn, "!absolute left-[1.5cqw] top-[40%] z-[6] !min-h-12 !rounded-full !px-3")} onClick={crank} aria-label={`Turn the crank (${turns} of ${CRANK_TURNS})`} data-crank={turns}>
          <RotateCw className="size-6" style={{ transform: `rotate(${turns * 90}deg)`, transition: "transform 0.2s" }} aria-hidden />
        </button>
      )}
      {standalone && armed && !fixed && (
        <button type="button" className={cn(styles.fakeBtn, "!absolute bottom-[3cqh] left-1/2 z-[6] -translate-x-1/2")} onClick={() => window.location.reload()} data-reload>
          ↻ Reload (there&apos;s no reload button in an installed app)
        </button>
      )}
    </div>
  );
}
