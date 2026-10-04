"use client";

// The title's background: the solver's runs through a few rooms, played on a loop like an arcade
// cabinet's attract mode (rain, lanterns, the painting). With reduced motion it's a still frame.
import { useEffect, useRef } from "react";
import { createLoop } from "@/engine/loop";
import { logFromText, Player } from "@/engine/replay";
import { prefersReducedMotion, settingsSave } from "@/engine/settings";
import { createWorld, step, type World } from "../core/world";
import { Camera } from "../play/camera";
import { Renderer } from "../render/draw";
import { getRoom, hasRoom } from "../rooms";
import { DEV_RUNS } from "../rooms/dev-runs";

const SHOWREEL = ["1-06", "2-04", "3-05", "4-07", "5-06", "1-10"].filter((id) => hasRoom(id) && DEV_RUNS[id]);

export function Attract({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || SHOWREEL.length === 0) return;
    const reduced = () => prefersReducedMotion(settingsSave.get());
    const renderer = new Renderer(el, reduced);
    const born = performance.now();
    let index = 0;
    let linger = 0;
    let world: World = createWorld(getRoom(SHOWREEL[0]!));
    let camera = new Camera(world.room);
    let inputs = new Player([]);
    let prev = { x: 0, y: 0 };

    const begin = () => {
      const id = SHOWREEL[index % SHOWREEL.length]!;
      const room = getRoom(id);
      world = createWorld(room);
      camera = new Camera(room);
      camera.snap(world.p);
      inputs = new Player(logFromText(DEV_RUNS[id]!.log));
      renderer.setRoom(room);
      prev = { x: world.p.x, y: world.p.y };
      linger = 0;
    };
    begin();

    const seconds = () => (performance.now() - born) / 1000;
    const draw = (alpha: number) =>
      renderer.draw({ world, prev, alpha, time: seconds(), cam: camera.at(alpha), looking: false, sinceThrow: 99, aim: null, highContrast: false, hero: true });

    if (reduced()) {
      for (let i = 0; i < 90; i++) {
        step(world, inputs.next() ?? 0);
        camera.update(world.p, false);
      }
      camera.prev = camera.x;
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
          camera.update(world.p, false);
        } else if (++linger > 80) {
          index++;
          begin();
        }
        renderer.tick(world, camera.x, seconds(), false);
      },
      render: draw,
    });
    loop.start();
    return () => loop.stop();
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden />;
}
