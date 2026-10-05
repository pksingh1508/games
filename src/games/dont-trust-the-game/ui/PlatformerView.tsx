"use client";

// A platformer scene's canvas (Plan/04-dont-trust-the-game.md §12 "Canvas platformer scenes … embedded inside the
// game frame"): one runtime per mount, handed to the scene (to set flags, place the hero…) and to the director (so
// the touch pad and the real pause reach it). World events go to the scene.
import { useEffect, useEffectEvent, useRef } from "react";
import type { Level } from "../core/level";
import type { World, WorldEvent, WorldFlags } from "../core/world";
import styles from "../dttg.module.css";
import { Runtime } from "../play/runtime";
import { dttgSave } from "../save";
import { useGame } from "./context";

export interface ViewState {
  brightness: number;
  zoom: boolean;
  glitch: number;
}

export function PlatformerView({
  level,
  flags,
  jumpKeys,
  view,
  onEvents,
  onReady,
  label,
}: {
  level: Level;
  flags?: Partial<WorldFlags>;
  jumpKeys?: readonly string[];
  /** Read every frame. */
  view?: { current: ViewState };
  onEvents?: (events: readonly WorldEvent[], world: World) => void;
  onReady?: (runtime: Runtime) => void;
  label: string;
}) {
  const { director, reducedMotion, reduceFlashing } = useGame();
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const events = useEffectEvent((e: readonly WorldEvent[], w: World) => onEvents?.(e, w));
  const ready = useEffectEvent((r: Runtime) => onReady?.(r));
  const comfort = useEffectEvent(() => ({ reducedMotion, reduceFlashing }));
  const initial = useEffectEvent(() => ({ flags: { ...flags, invincible: dttgSave.get().prefs.invincible }, jumpKeys }));

  useEffect(() => {
    if (!canvas.current) return;
    const start = initial();
    const runtime = new Runtime(canvas.current, {
      level,
      flags: start.flags,
      jumpKeys: start.jumpKeys,
      view: () => ({ ...(view?.current ?? { brightness: 1, zoom: false, glitch: 0 }), ...comfort() }),
    });
    const off = runtime.onEvents((e, w) => {
      // What every level counts: deaths, and doing what HELPER said (or didn't).
      for (const ev of e) {
        if (ev.type === "die") {
          dttgSave.update((s) => ({ ...s, deaths: s.deaths + 1 }));
          if (ev.cause === "coin") director.act("coin");
          if (ev.cause === "saw") director.act("saw");
          if (ev.cause === "spike") director.act("real-spikes");
        }
        if (ev.type === "door" && ev.kind === "fake") director.act("cardboard");
      }
      events(e, w);
    });
    director.attach(runtime);
    ready(runtime);
    runtime.start();
    if (director.store.get().held) runtime.pause();
    const unsubscribe = dttgSave.subscribe(() => runtime.setFlags({ invincible: dttgSave.get().prefs.invincible }));
    return () => {
      off();
      unsubscribe();
      runtime.destroy();
      director.detach(runtime);
    };
  }, [level, director, view]);

  return <canvas ref={canvas} className={styles.canvas} role="img" aria-label={label} data-canvas />;
}
