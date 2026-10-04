"use client";

// The cards between the rooms (Plan/05-fake-floor.md §7, §8.4): a world complete, a time trial's
// splits, and the ending: "You fell through 212 fake floors. The floor thanks you for your trust."
import { ArrowRight, Check, Map as MapIcon, RotateCcw, Share2, Timer } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { useGamepadButtons } from "@/games/shared/gamepad";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { formatClock, formatTime, MEDAL_IDS } from "../core/medals";
import { medalCount, worldStats } from "../core/progress";
import styles from "../fake-floor.module.css";
import { getRoom, ROOM_IDS, roomLabel, WORLDS, type WorldId } from "../rooms";
import type { FakeFloorSave } from "../save";
import { FallIcon, MedalIcon, PebbleIcon } from "./icons";
import type { RoomToast } from "./Play";

/** A line for each world's end (World 5's leads down to The Floor). */
const WORLD_LINES: Record<number, string> = {
  1: "The Showroom thanks you for testing its floors.",
  2: "You can stop looking at puddles now. (You won't.)",
  3: "The lanterns will keep swinging without you.",
  4: "Even the clues lied. You didn't fall for all of them.",
  5: "Something under the building has noticed you.",
};

/** Enter goes on; gamepad A or Start too. */
function useForwardKeys(forward: () => void) {
  const go = useEffectEvent(() => forward());
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || document.querySelector("[role=dialog]")) return;
      const onButton = (document.activeElement as Element | null)?.closest("button, a");
      if ((event.code === "Enter" || event.code === "Space") && !onButton) {
        event.preventDefault();
        go();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useGamepadButtons({ 0: forward, 9: forward });
}

function Shell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section className={cn(styles.showroom, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10")} aria-label={label}>
      <div className={cn(styles.panel, styles.card, "w-[min(94vw,36rem)] p-6 text-center sm:p-8")}>{children}</div>
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#F4F1EA] px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5A636A]">{label}</p>
      <p className={cn(styles.pixel, "mt-0.5 flex items-center justify-center gap-1.5 text-xl tabular-nums")}>
        {icon}
        {value}
      </p>
    </div>
  );
}

export function WorldComplete({
  save,
  world,
  last,
  onNext,
  onMap,
  onTrial,
}: {
  save: FakeFloorSave;
  world: WorldId;
  /** The last room's result. */
  last: RoomToast;
  onNext: () => void;
  onMap: () => void;
  onTrial: () => void;
}) {
  const info = WORLDS.find((w) => w.id === world)!;
  const next = WORLDS.find((w) => w.id === world + 1);
  const stats = worldStats(save, world);
  useForwardKeys(onNext);
  return (
    <Shell label={`${info.name} complete`}>
      <p className={cn(styles.pixel, "text-sm text-[#5A636A]")}>World {world}</p>
      <h1 className={cn(styles.pixel, "mt-1 text-3xl sm:text-4xl")}>{info.name}: complete!</h1>
      <p className="mt-3 font-semibold">{WORLD_LINES[world]}</p>
      <p className="mt-2 text-sm text-[#5A636A]">
        Last room: {roomLabel(last.roomId)} {getRoom(last.roomId).name} in {formatTime(last.ticks)}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Medals" value={`${stats.medals}/30`} />
        <Stat label="Falls" value={String(stats.falls)} icon={<FallIcon size={14} />} />
        <Stat label="Pebbles" value={String(stats.thrown)} icon={<PebbleIcon size={14} />} />
        <Stat label="Hidden" value={`${stats.hidden}/2`} />
      </div>
      {stats.best !== null && (
        <p className="mt-3 text-sm font-semibold text-[#5A636A]">
          Your best times add up to <span className="font-mono">{formatClock(stats.best)}</span>. The time trial puts them on one clock.
        </p>
      )}
      <div className="mt-7 grid gap-3">
        <button type="button" className="btn btn-lg w-full" onClick={onNext} data-sound="click">
          {next ? (
            <>
              Up to {next.id === 6 ? "the foundations" : `World ${next.id}`}: {next.name} <ArrowRight className="size-5" aria-hidden />
            </>
          ) : (
            "Back to the map"
          )}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-secondary" onClick={onTrial} data-sound="click">
            <Timer className="size-4" aria-hidden /> Time trial
          </button>
          <button type="button" className="btn btn-secondary" onClick={onMap} data-sound="click">
            <MapIcon className="size-4" aria-hidden /> Map
          </button>
        </div>
      </div>
    </Shell>
  );
}

export interface TrialResult {
  world: WorldId;
  total: number;
  splits: number[];
  falls: number;
  thrown: number;
  assisted: boolean;
  newBest: boolean;
  previous: number | null;
  bestSplits: number[];
}

export const trialShareText = (r: Pick<TrialResult, "world" | "total" | "falls" | "thrown">) =>
  `Fake Floor, ${WORLDS.find((w) => w.id === r.world)!.name} time trial: ${formatClock(r.total)}, ${r.falls} ${r.falls === 1 ? "fall" : "falls"}, ${r.thrown} ${r.thrown === 1 ? "pebble" : "pebbles"}\n${SITE.url}/games/fake-floor`;

export function TrialResults({ result, onAgain, onMap }: { result: TrialResult; onAgain: () => void; onMap: () => void }) {
  const info = WORLDS.find((w) => w.id === result.world)!;
  const [copied, setCopied] = useState(false);
  useForwardKeys(onMap);
  const share = async () => {
    const outcome = await shareResult(trialShareText(result));
    if (outcome === "copied") {
      setCopied(true);
      toast({ kind: "success", title: "Result copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Select the text and copy it yourself." });
  };
  return (
    <Shell label="Time trial results">
      <p className={cn(styles.pixel, "text-sm text-[#5A636A]")}>Time trial · World {result.world}</p>
      <h1 className={cn(styles.pixel, "mt-1 text-3xl sm:text-4xl")}>{result.newBest ? "New best!" : "Done!"}</h1>
      <p className={cn(styles.pixel, "mt-3 text-4xl tabular-nums")} aria-label={`Total ${formatClock(result.total)}`}>
        {formatClock(result.total)}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#5A636A]">
        {result.assisted ? "Assist on: no record" : result.newBest && result.previous !== null ? `was ${formatClock(result.previous)}` : info.name}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Falls" value={String(result.falls)} icon={<FallIcon size={14} />} />
        <Stat label="Pebbles" value={String(result.thrown)} icon={<PebbleIcon size={14} />} />
      </div>
      <table className="mt-5 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-[#5A636A]">
            <th className="py-1 font-semibold">Room</th>
            <th className="py-1 text-right font-semibold">At the door</th>
            <th className="py-1 text-right font-semibold">vs best</th>
          </tr>
        </thead>
        <tbody>
          {info.rooms.map((id, i) => {
            const at = result.splits[i];
            const best = result.bestSplits[i];
            const diff = at !== undefined && best !== undefined ? at - best : null;
            return (
              <tr key={id} className="border-t border-[#E3DED3]">
                <td className="py-1.5 font-semibold">
                  {roomLabel(id)} <span className="font-normal text-[#5A636A]">{getRoom(id).name}</span>
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums">{at !== undefined ? formatClock(at) : "—"}</td>
                <td className={cn("py-1.5 text-right font-mono tabular-nums", diff !== null && diff < 0 ? "text-[#3E8948]" : "text-[#A22633]")}>
                  {diff === null ? "" : `${diff < 0 ? "−" : "+"}${(Math.abs(diff) / 60).toFixed(1)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-6 grid gap-3">
        <button type="button" className="btn btn-lg w-full" onClick={onAgain} data-sound="click">
          <RotateCcw className="size-5" aria-hidden /> Again
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-secondary" onClick={share} data-sound="click">
            {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
          </button>
          <button type="button" className="btn btn-secondary" onClick={onMap} data-sound="click">
            <MapIcon className="size-4" aria-hidden /> Map
          </button>
        </div>
      </div>
    </Shell>
  );
}

export const endingShareText = (save: Pick<FakeFloorSave, "fakeFalls" | "thrown">, medals: number) =>
  `I crossed Fake Floor. I fell through ${save.fakeFalls} fake ${save.fakeFalls === 1 ? "floor" : "floors"} and threw ${save.thrown} ${save.thrown === 1 ? "pebble" : "pebbles"}. ${medals}/${ROOM_IDS.length * 3} medals.\n${SITE.url}/games/fake-floor`;

export function Ending({ save, onMap }: { save: FakeFloorSave; onMap: () => void }) {
  const medals = medalCount(save, ROOM_IDS);
  const [copied, setCopied] = useState(false);
  useForwardKeys(onMap);
  const minutes = Math.round(save.stats.playTicks / 3600);
  const share = async () => {
    const outcome = await shareResult(endingShareText(save, medals));
    if (outcome === "copied") {
      setCopied(true);
      toast({ kind: "success", title: "Copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Select the text and copy it yourself." });
  };
  return (
    <Shell label="The end">
      <p className={cn(styles.pixel, "text-sm text-[#5A636A]")}>★ The Floor</p>
      <h1 className={cn(styles.pixel, "mt-1 text-3xl sm:text-4xl")}>You crossed The Floor.</h1>
      <p className={cn(styles.pixel, "mt-5 text-xl leading-snug")}>
        You fell through {save.fakeFalls.toLocaleString("en-US")} fake {save.fakeFalls === 1 ? "floor" : "floors"}.
        <br />
        The floor thanks you for your trust.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Falls" value={save.falls.toLocaleString("en-US")} icon={<FallIcon size={14} />} />
        <Stat label="Pebbles" value={save.thrown.toLocaleString("en-US")} icon={<PebbleIcon size={14} />} />
        <Stat label="Medals" value={`${medals}/${ROOM_IDS.length * 3}`} />
        <Stat label="Played" value={`${minutes} min`} />
      </div>
      <p className="mt-4 flex items-center justify-center gap-3 text-sm font-semibold text-[#5A636A]">
        {MEDAL_IDS.map((m) => (
          <span key={m} className="inline-flex items-center gap-1">
            <MedalIcon medal={m} got size={14} /> {ROOM_IDS.filter((id) => save.rooms[id]?.[m]).length}
          </span>
        ))}
      </p>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <button type="button" className="btn btn-lg" onClick={onMap} data-sound="click">
          <MapIcon className="size-5" aria-hidden /> Map
        </button>
        <button type="button" className="btn btn-lg btn-secondary" onClick={share} data-sound="click">
          {copied ? <Check className="size-5" aria-hidden /> : <Share2 className="size-5" aria-hidden />} Share
        </button>
      </div>
    </Shell>
  );
}
