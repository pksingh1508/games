"use client";

// The title (Plan/08-almost-there.md §8.1): Pip at the foot of the mountain, looking up. The summit
// is right there in the distance. (It's painted on. It's the fake one.)
import { CircleHelp, Mountain as MountainIcon, Settings2, Shirt, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { ALMOST_THERE_ACHIEVEMENTS } from "../achievements";
import styles from "../almost-there.module.css";
import { newClimb, type Climb } from "../core/climb";
import { VIEW_H, VIEW_W } from "../core/constants";
import { rowTop } from "../core/mountain";
import { altitude, formatClock, formatMetres } from "../core/progress";
import { countFeathers, FEATHER_COUNT, mirrorUnlocked } from "../core/records";
import { Renderer } from "../render/draw";
import type { AlmostThereSave } from "../save";
import { getMountain, zoneInfo } from "../world";
import { pipZone } from "../core/climb";

const IGNORED_KEYS = new Set(["Tab", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight", "CapsLock"]);

export function TitleScreen({
  save,
  saved,
  reducedMotion,
  onStart,
  onNew,
  onMirror,
  onHelp,
  onTrophies,
  onHats,
  onOptions,
}: {
  save: AlmostThereSave;
  /** The climb in progress, if there is one. */
  saved: Climb | null;
  reducedMotion: boolean;
  onStart: () => void;
  onNew: () => void;
  onMirror: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onHats: () => void;
  onOptions: () => void;
}) {
  const coarse = useCoarsePointer();
  const start = useEffectEvent(() => onStart());

  // Any key starts, unless you're on another button or a dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || IGNORED_KEYS.has(event.code) || /^F\d+$/.test(event.code)) return;
      if (document.querySelector("[role=dialog]")) return;
      const active = document.activeElement;
      if (active && active !== document.body && active.closest("button, a, input, select, textarea") && !active.closest("[data-start]")) return;
      event.preventDefault();
      start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const trophies = Object.keys(save.achievements).length;
  const zone = saved ? zoneInfo(pipZone(getMountain(saved.mirrored), saved)) : null;

  return (
    <section className={cn(styles.title, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-12 text-center")}>
      <TitleScene reducedMotion={reducedMotion} hat={save.hat} />
      <div className={styles.fade} aria-hidden />

      <p className={cn(styles.silk, "text-xs text-white/85")}>Mind Games Arcade presents</p>
      <h1 className={cn(styles.logo, "mt-5")}>Almost There</h1>
      <p className={cn(styles.silk, "mt-5 max-w-xl text-sm text-white sm:text-base")}>You&apos;re so close. You&apos;re always so close.</p>

      <div className="mt-10">
        <button type="button" data-start className={styles.start} onClick={onStart} aria-label={saved ? "Continue your climb" : "Start climbing"}>
          {saved ? "CONTINUE" : "CLIMB"}
        </button>
      </div>
      <p className={cn(styles.silk, styles.blink, "mt-5 min-h-[1.5em] text-xs text-white")} aria-hidden>
        {coarse ? "Tap to start" : "Press any key"}
      </p>
      {saved && zone && (
        <p className={cn(styles.silk, "mt-2 text-xs text-white/90")} data-saved-climb>
          {saved.mirrored ? "Mirror Mountain · " : ""}
          {zone.name} · {formatMetres(altitude(saved))} · {formatClock(saved.stats.ticks, false)}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {saved && (
          <button type="button" onClick={onNew} className="btn btn-secondary" data-sound="click">
            <MountainIcon className="size-5" aria-hidden /> New climb
          </button>
        )}
        {mirrorUnlocked(save) && (
          <button type="button" onClick={onMirror} className="btn btn-secondary" data-sound="click">
            <MountainIcon className="size-5 -scale-x-100" aria-hidden /> Mirror Mountain
          </button>
        )}
        <button type="button" onClick={onHelp} className="btn btn-ghost" data-sound="click">
          <CircleHelp className="size-5" aria-hidden /> How to play
        </button>
        <button type="button" onClick={onTrophies} className="btn btn-ghost" data-sound="click">
          <Trophy className="size-5" aria-hidden /> Trophies{" "}
          <span className="font-mono text-xs">
            {trophies}/{ALMOST_THERE_ACHIEVEMENTS.length}
          </span>
        </button>
        <button type="button" onClick={onHats} className="btn btn-ghost" data-sound="click">
          <Shirt className="size-5" aria-hidden /> Hats{" "}
          <span className="font-mono text-xs">
            {countFeathers(save.feathers)}/{FEATHER_COUNT}
          </span>
        </button>
        <button type="button" onClick={onOptions} className="btn btn-ghost" data-sound="click">
          <Settings2 className="size-5" aria-hidden /> Options
        </button>
      </div>
    </section>
  );
}

/** The foot of the mountain, drawn by the game itself: Pip, Chirp, and the summit far away. */
function TitleScene({ reducedMotion, hat }: { reducedMotion: boolean; hat: number | null }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [scene] = useState(() => {
    const m = getMountain();
    return { m, climb: newClimb(m) };
  });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new Renderer(canvas);
    renderer.setMountain(scene.m);
    const p = scene.climb.sim.pip;
    const born = performance.now();
    let raf = 0;
    const draw = () => {
      const t = (performance.now() - born) / 1000;
      renderer.draw({
        climb: scene.climb,
        prev: { x: p.x, y: p.y },
        alpha: 1,
        time: reducedMotion ? 0 : t,
        cam: { x: 0, y: rowTop(0) },
        chirp: { x: p.x + 22, y: p.y - 14 + (reducedMotion ? 0 : Math.sin(t * 3) * 3), mood: "sincere", right: false },
        hat,
        preview: null,
        flags: { fake: -1, real: -1 },
        hidePip: false,
        reducedMotion,
      });
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [scene, reducedMotion, hat]);
  return <canvas ref={ref} width={VIEW_W} height={VIEW_H} className={styles.scene} aria-hidden />;
}
