"use client";

// The big moments: the NOPE! slam, confetti for correct answers, the fake confetti that spells
// N-O-P-E (it's silent: real confetti always dings first), and the skip fly.
import type { CreateTypes } from "canvas-confetti";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { createRng } from "@/engine/rng";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import { Fly } from "../kit/art";
import type { Spot } from "../kit/runaway";
import { sfx } from "../sfx";
import { StampMark } from "./Stamp";

/** The stamp slams onto the stage. */
export function Slam({ id, reducedMotion }: { id: number | null; reducedMotion: boolean }) {
  return (
    <AnimatePresence>
      {id !== null && (
        <m.div
          key={id}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-50 grid place-items-center"
          initial={{ opacity: reducedMotion ? 0 : 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <div className={cn("relative w-[min(78vw,30rem)]", !reducedMotion && styles.slam)} style={{ ["--r" as string]: "-12deg", rotate: reducedMotion ? "-12deg" : undefined }}>
            {!reducedMotion &&
              SPLATS.map((s, i) => (
                <span
                  key={i}
                  className={cn("absolute rounded-full bg-[#D41F22]", styles.splat)}
                  style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: 0.85 }}
                />
              ))}
            <StampMark className="relative w-full drop-shadow-[0_10px_0_rgba(0,0,0,0.25)]" />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

const SPLATS = (() => {
  const rng = createRng("splats");
  return Array.from({ length: 9 }, () => ({
    x: rng() < 0.5 ? -6 + rng() * 14 : 92 + rng() * 14,
    y: -10 + rng() * 120,
    size: 6 + Math.round(rng() * 14),
  }));
})();

// ---------------------------------------------------------------------------------------------

// 5×7 letters for the fake confetti.
const LETTERS: Record<string, string[]> = {
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  P: ["XXXX.", "X...X", "X...X", "XXXX.", "X....", "X....", "X...."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
};
const COLORS = ["#D41F22", "#FFC93C", "#7ED957", "#2B59C3", "#FFF4D6", "#FF8A3D"];

const NOPE_PIECES = (() => {
  const rng = createRng("fake-confetti");
  const pieces: Array<{ tx: number; ty: number; sx: number; delay: number; color: string; spin: number }> = [];
  ["N", "O", "P", "E"].forEach((letter, li) => {
    (LETTERS[letter] ?? []).forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell !== "X") return;
        pieces.push({
          // 4 letters × 5 columns + gaps → percentages of the confetti box.
          tx: ((li * 6 + c + 0.5) / 23) * 100,
          ty: ((r + 0.5) / 7) * 100,
          sx: rng() * 100,
          delay: rng() * 0.35,
          color: COLORS[Math.floor(rng() * COLORS.length)] ?? "#FFC93C",
          spin: -540 + rng() * 1080,
        });
      });
    });
  });
  return pieces;
})();

/** Looks like a win. Lands as N-O-P-E. Makes no sound. */
export function FakeConfetti({ id }: { id: number | null }) {
  return (
    <AnimatePresence>
      {id !== null && (
        <m.div
          key={id}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[22%] z-40 mx-auto aspect-[23/7] w-[min(86vw,34rem)]"
          exit={{ opacity: 0 }}
        >
          {NOPE_PIECES.map((piece, i) => (
            <m.span
              key={i}
              className="absolute block h-[3.2%] w-[2.6%] min-h-1.5 min-w-2 rounded-[2px]"
              style={{ background: piece.color }}
              initial={{ left: `${piece.sx}%`, top: "-220%", rotate: piece.spin, opacity: 1 }}
              animate={{ left: `${piece.tx}%`, top: `${piece.ty}%`, rotate: 0 }}
              transition={{ duration: 0.9, delay: piece.delay, ease: [0.2, 0.7, 0.3, 1] }}
            />
          ))}
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------------------------

/** A canvas over the stage for real confetti. Returns a burst() function. */
export function useConfetti(enabled: boolean) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const instance = useRef<CreateTypes | null>(null);

  useEffect(
    () => () => {
      instance.current?.reset();
      instance.current = null;
    },
    [],
  );

  const burst = useCallback(
    async (origin: { x: number; y: number } = { x: 0.5, y: 0.45 }) => {
      if (!enabled || !canvas.current) return;
      if (!instance.current) {
        const confetti = (await import("canvas-confetti")).default;
        if (!canvas.current) return;
        instance.current = confetti.create(canvas.current, { resize: true, useWorker: false, disableForReducedMotion: true });
      }
      sfx.pop();
      void instance.current({
        particleCount: 90,
        spread: 90,
        startVelocity: 42,
        gravity: 1.1,
        ticks: 160,
        scalar: 0.95,
        origin,
        colors: COLORS,
      });
    },
    [enabled],
  );

  return { canvas, burst };
}

// ---------------------------------------------------------------------------------------------

/** The skip fly: catch it for a skip. It buzzes across the stage and leaves. */
export function SkipFly({
  path,
  reducedMotion,
  onCatch,
  onGone,
}: {
  path: Spot[];
  reducedMotion: boolean;
  onCatch: () => void;
  onGone: () => void;
}) {
  useEffect(() => sfx.buzz(), []);
  const still = path[Math.floor(path.length / 2)] ?? { x: 50, y: 40 };

  return (
    <m.button
      type="button"
      aria-label="A fly! Catch it to earn a skip"
      onClick={onCatch}
      className="absolute z-40 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
      initial={reducedMotion ? { left: `${still.x}%`, top: `${still.y}%`, opacity: 0 } : { left: `${path[0]?.x ?? 0}%`, top: `${path[0]?.y ?? 0}%` }}
      animate={
        reducedMotion
          ? { opacity: [0, 1, 1, 0] }
          : { left: path.map((p) => `${p.x}%`), top: path.map((p) => `${p.y}%`) }
      }
      transition={reducedMotion ? { duration: 5, times: [0, 0.1, 0.9, 1] } : { duration: 6.5, ease: "easeInOut" }}
      onAnimationComplete={onGone}
    >
      <Fly className="h-10 w-12 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]" />
    </m.button>
  );
}

/** Where the fly flies, from the run's seed (no randomness while rendering). */
export function planFly(key: string): { delayMs: number; path: Spot[] } | null {
  const rng = createRng(`fly:${key}`);
  if (rng() > 0.34) return null;
  const fromLeft = rng() < 0.5;
  const mid = () => ({ x: 18 + rng() * 64, y: 18 + rng() * 52 });
  return {
    delayMs: 2500 + rng() * 6500,
    path: [{ x: fromLeft ? -8 : 108, y: 20 + rng() * 40 }, mid(), mid(), mid(), { x: fromLeft ? 108 : -8, y: 15 + rng() * 40 }],
  };
}
