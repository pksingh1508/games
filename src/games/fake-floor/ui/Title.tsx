"use client";

// The title screen (Plan/05-fake-floor.md §8.1): the logo sits on a row of floor tiles, and when you
// press Start, the tiles under it turn out to be fake and the logo falls through. Every time. It's
// tradition. (Look closely: their grout doesn't line up.)
import { CircleHelp, Map as MapIcon, Settings2, Trophy } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCoarsePointer } from "@/games/shared/device";
import { cn } from "@/lib/cn";
import { FAKE_FLOOR_ACHIEVEMENTS } from "../achievements";
import { medalCount } from "../core/progress";
import styles from "../fake-floor.module.css";
import { ROOM_IDS } from "../rooms";
import type { FakeFloorSave } from "../save";
import { Attract } from "./Attract";
import { FallIcon, TileArt } from "./icons";

const IGNORED_KEYS = new Set(["Tab", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight", "CapsLock"]);
/** Which tiles under the logo are fake (the ones it falls through). */
const TILES = [false, false, true, true, true, true, false, false];

export function TitleScreen({
  save,
  reducedMotion,
  onStart,
  onMap,
  onHelp,
  onTrophies,
  onOptions,
}: {
  save: FakeFloorSave;
  reducedMotion: boolean;
  onStart: () => void;
  onMap: () => void;
  onHelp: () => void;
  onTrophies: () => void;
  onOptions: () => void;
}) {
  const [dropping, setDropping] = useState(false);
  const coarse = useCoarsePointer();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (dropping) return;
    setDropping(true);
    timer.current = setTimeout(onStart, reducedMotion ? 120 : 1050);
  };
  const startFromKey = useEffectEvent(() => start());

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Any key starts, unless you're on another button or a dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || IGNORED_KEYS.has(event.code) || /^F\d+$/.test(event.code)) return;
      if (document.querySelector("[role=dialog]")) return;
      const active = document.activeElement;
      if (active && active !== document.body && active.closest("button, a, input, select, textarea") && !active.closest("[data-start]")) return;
      event.preventDefault();
      startFromKey();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cleared = ROOM_IDS.filter((id) => (save.rooms[id]?.clears ?? 0) > 0).length;
  const medals = medalCount(save, ROOM_IDS);
  const trophies = Object.keys(save.achievements).length;

  return (
    <section className={cn(styles.showroom, dropping && styles.dropping, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-12 text-center")}>
      <Attract className={styles.attract} />
      <div className={styles.fade} aria-hidden />

      <p className={cn(styles.pixel, "text-sm text-[#5A636A]")}>Mind Games Arcade presents</p>
      <div className="mt-6 flex flex-col items-center">
        <h1 className={styles.logo}>
          Fake <span className={styles.logoFloor}>Floor</span>
        </h1>
        <div className={cn(styles.tiles, "mt-5")} aria-hidden>
          {TILES.map((fake, i) => (
            <TileArt key={i} fake={fake} className={cn(styles.tile, fake && styles.fakeTile)} />
          ))}
        </div>
      </div>
      <p className={cn(styles.pixel, "mt-6 max-w-xl text-base text-[#26323B] sm:text-lg")}>Look before you leap. Then look again.</p>

      <div className="mt-10">
        <button type="button" data-start className={styles.start} onClick={start} aria-label="Start">
          START
        </button>
      </div>
      <p className={cn(styles.pixel, styles.blink, "mt-5 min-h-[1.5em] text-sm text-[#26323B]")} aria-hidden>
        {coarse ? "Tap START" : "Press any key"}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onMap} className="btn btn-secondary" data-sound="click">
          <MapIcon className="size-5" aria-hidden /> Map
        </button>
        <button type="button" onClick={onHelp} className="btn btn-ghost" data-sound="click">
          <CircleHelp className="size-5" aria-hidden /> How to play
        </button>
        <button type="button" onClick={onTrophies} className="btn btn-ghost" data-sound="click">
          <Trophy className="size-5" aria-hidden /> Trophies{" "}
          <span className="font-mono text-xs">
            {trophies}/{FAKE_FLOOR_ACHIEVEMENTS.length}
          </span>
        </button>
        <button type="button" onClick={onOptions} className="btn btn-ghost" data-sound="click">
          <Settings2 className="size-5" aria-hidden /> Options
        </button>
      </div>

      <p className={cn(styles.pixel, "mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#26323B]")}>
        <span>
          {cleared}/{ROOM_IDS.length} rooms
        </span>
        <span>
          {medals}/{ROOM_IDS.length * 3} medals
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FallIcon size={14} /> {save.falls.toLocaleString("en-US")} falls
        </span>
      </p>
    </section>
  );
}
