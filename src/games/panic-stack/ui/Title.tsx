"use client";

// The title (Plan/11-panic-stack.md §8.1): a wobbly tower of toy blocks spells PANIC STACK, in a little physics
// world of its own. Press Play and it collapses into the map.
import { BookOpen, CircleHelp, Infinity as InfinityIcon, Play, Settings2, Sun, Trophy } from "lucide-react";
import { Box, World, type Body } from "planck";
import { useEffect, useEffectEvent, useRef } from "react";
import { createLoop } from "@/engine/loop";
import { useComfort } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { LEVEL_IDS } from "../levels";
import styles from "../panic-stack.module.css";
import { isCleared, starTotals } from "../progress";
import { canvasFont, INK, rr, text } from "../render/sprites";
import type { PanicStackSave } from "../save";

const COLOURS = ["#E63946", "#2B7FFF", "#FFD23F", "#2BB673", "#9B5DE5"];
const S = 0.86;

interface Block {
  body: Body;
  letter: string;
  colour: string;
}

export function TitleScreen({
  save,
  daily,
  dailyOpen,
  onPlay,
  onEndless,
  onDaily,
  onHelp,
  onGuide,
  onTrophies,
  onOptions,
  collapse,
}: {
  save: PanicStackSave;
  daily: { key: string; number: number };
  dailyOpen: boolean;
  onPlay(): void;
  onEndless(): void;
  onDaily(): void;
  onHelp(): void;
  onGuide(): void;
  onTrophies(): void;
  onOptions(): void;
  /** Set when Play's been pressed: the tower falls over. */
  collapse: boolean;
}) {
  const comfort = useComfort();
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const tower = useRef<{ fall(): void } | null>(null);
  const still = useEffectEvent(() => comfort.reducedMotion);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const family = getComputedStyle(c).getPropertyValue("--font-g-rubik").trim();
    if (family) canvasFont.family = `${family}, system-ui, sans-serif`;
    const world = new World({ gravity: { x: 0, y: -10 } });
    const base = world.createBody({ type: "kinematic", position: { x: 0, y: 0 } });
    base.createFixture({ shape: new Box(2.7, 0.15, { x: 0, y: -0.15 }), friction: 0.9 });
    const blocks: Block[] = [];
    ["STACK", "PANIC"].forEach((word, row) => {
      [...word].forEach((letter, k) => {
        const body = world.createBody({ type: "dynamic", position: { x: (k - 2) * (S + 0.02), y: S / 2 + row * (S + 0.012) + 0.002 } });
        body.createFixture({ shape: new Box(S / 2, S / 2), density: 1, friction: 0.8 });
        blocks.push({ body, letter, colour: COLOURS[(k + row * 2) % COLOURS.length]! });
      });
    });
    let t = 0;
    let falling = false;
    const g = c.getContext("2d")!;
    const draw = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const scale = Math.min(w / 6.4, h / 3.2);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.translate(w / 2, h - 0.35 * scale);
      g.scale(scale, scale);
      // The platform (y down from here on).
      g.save();
      g.rotate(-base.getAngle());
      rr(g, -2.7, 0, 5.4, 0.3, 0.06);
      g.fillStyle = "#3E3A63";
      g.fill();
      g.lineWidth = 0.04;
      g.strokeStyle = INK;
      g.stroke();
      g.restore();
      for (const b of blocks) {
        const p = b.body.getPosition();
        g.save();
        g.translate(p.x, -p.y);
        g.rotate(-b.body.getAngle());
        rr(g, -S / 2, -S / 2, S, S, 0.08);
        g.fillStyle = b.colour;
        g.fill();
        g.lineWidth = 0.045;
        g.strokeStyle = INK;
        g.stroke();
        rr(g, -S / 2 + 0.09, -S / 2 + 0.09, S - 0.18, S - 0.18, 0.06);
        g.fillStyle = "rgba(255,255,255,0.92)";
        g.fill();
        g.fillStyle = b.colour === "#FFD23F" ? INK : b.colour;
        text(g, b.letter, 0, 0.03, S * 0.62);
        g.restore();
      }
    };
    const loop = createLoop({
      update: () => {
        t += 1 / 60;
        if (!falling && !still()) base.setAngularVelocity(Math.cos(t * 1.6) * 0.035);
        else if (!falling) base.setAngularVelocity(0);
        for (let s = 0; s < 4; s++) world.step(1 / 240, 8, 4);
      },
      render: draw,
    });
    tower.current = {
      fall() {
        falling = true;
        base.setAngularVelocity(0.9);
        blocks.forEach((b, k) => b.body.applyLinearImpulse({ x: (k % 5) - 2 + Math.random(), y: 2 + Math.random() * 2 }, b.body.getWorldCenter(), true));
      },
    };
    loop.start();
    return () => {
      loop.stop();
      tower.current = null;
    };
  }, []);

  useEffect(() => {
    if (collapse) tower.current?.fall();
  }, [collapse]);

  const done = LEVEL_IDS.filter((id) => isCleared(save, id)).length;
  const stars = starTotals(save);
  const today = save.daily[daily.key];
  return (
    <section className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center bg-[#FFF1E0] px-4 py-6")} aria-labelledby="ps-title">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <h1 id="ps-title" className="sr-only">
          Panic Stack
        </h1>
        <canvas ref={canvas} className={styles.titleCanvas} role="img" aria-label="A wobbly tower of toy blocks spelling PANIC STACK." data-title-tower />
        <p className="mt-2 text-[clamp(1.05rem,2.6vw,1.3rem)] font-bold">Stack it high. Don&apos;t trust anything you stack.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <button type="button" className={cn(styles.btn, styles.primary, "!px-6 !py-2.5 text-lg")} onClick={onPlay} autoFocus data-play>
            <Play className="size-5" aria-hidden /> {done > 0 ? "Continue" : "Play"}
          </button>
          <button type="button" className={styles.btn} onClick={onEndless} data-endless>
            <InfinityIcon className="size-4" aria-hidden /> Endless Tower
          </button>
          <button type="button" className={styles.btn} onClick={onDaily} disabled={!dailyOpen} data-daily title={dailyOpen ? undefined : "Opens once you've finished the Toy Room"}>
            <Sun className="size-4" aria-hidden /> Daily Stack #{daily.number}
            {today && <span className="text-sm opacity-70"> · {today.height.toFixed(1)} m</span>}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onHelp}>
            <CircleHelp className="size-4" aria-hidden /> How to play
          </button>
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onGuide} data-open-guide>
            <BookOpen className="size-4" aria-hidden /> Item guide
          </button>
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onTrophies}>
            <Trophy className="size-4" aria-hidden /> Trophies
          </button>
          <button type="button" className={cn(styles.btn, styles.ghost)} onClick={onOptions}>
            <Settings2 className="size-4" aria-hidden /> Options
          </button>
        </div>
        <p className="mt-4 text-sm font-bold opacity-70" data-totals>
          {done} of {LEVEL_IDS.length} levels · {stars.got} of {stars.of} stars · best Endless {save.endless.best ? `${save.endless.best.toFixed(1)} m` : "—"}
          {!dailyOpen && " · the Daily Stack opens after the Toy Room"}
        </p>
      </div>
    </section>
  );
}
