"use client";

// The title's background: the Dev runs, played back on a loop like an arcade cabinet's attract
// mode. With reduced motion it's a still frame.
import { useEffect, useRef } from "react";
import { createLoop } from "@/engine/loop";
import { logFromText, Player } from "@/engine/replay";
import { prefersReducedMotion, settingsSave } from "@/engine/settings";
import { createWorld, step, type World } from "../core/world";
import { DEV_RUNS } from "../levels/dev-runs";
import { getLevel } from "../levels";
import { Renderer } from "../render/draw";

const SHOWREEL = ["1-01", "2-07", "3-04", "1-06", "2-05", "3-10", "1-09", "2-02"];

export function Attract({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const reduced = () => prefersReducedMotion(settingsSave.get());
    const renderer = new Renderer(el, reduced);
    const born = performance.now();
    let index = 0;
    let linger = 0;
    let world: World = createWorld(getLevel(SHOWREEL[0]!));
    let inputs = new Player([]);
    let prev = { x: 0, y: 0 };

    const begin = () => {
      const id = SHOWREEL[index % SHOWREEL.length]!;
      const level = getLevel(id);
      world = createWorld(level);
      inputs = new Player(logFromText(DEV_RUNS[id]!.log));
      renderer.setLevel(level);
      renderer.fx.clear();
      prev = { x: world.p.x, y: world.p.y };
      linger = 0;
    };
    begin();

    const draw = (alpha: number) =>
      renderer.draw({
        world,
        prev,
        alpha,
        time: (performance.now() - born) / 1000,
        ghost: null,
        ghostPrev: null,
        markers: [],
        reveal: false,
        hero: world.status !== "dead",
      });

    if (reduced()) {
      for (let i = 0; i < 40; i++) step(world, inputs.next() ?? 0);
      draw(1);
      return;
    }

    const loop = createLoop({
      update: () => {
        if (world.status === "play") {
          prev = { x: world.p.x, y: world.p.y };
          const bits = inputs.next();
          if (bits === null) world.status = "won";
          else {
            const before = world;
            step(world, bits);
            renderer.onEvents(before, world.events);
          }
        } else if (++linger > 70) {
          index++;
          begin();
        }
        renderer.tick(world);
      },
      render: draw,
    });
    loop.start();
    return () => loop.stop();
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden />;
}
