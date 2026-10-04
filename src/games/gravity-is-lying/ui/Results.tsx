"use client";

// The cards between the rooms (Plan/15-gravity-is-lying.md §5, §7): a world complete, and the
// ending at the top of Isaac's tree, where he finally tells the truth: he never fell down onto
// anyone's head. He fell up.
import { ArrowRight, Check, Map as MapIcon, Share2 } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { useGamepadButtons } from "@/games/shared/gamepad";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { appleCount, formatTime, worldStats } from "../core/progress";
import type { WorldId } from "../core/room";
import styles from "../gravity-is-lying.module.css";
import { getRoom, ROOM_IDS, roomLabel, WORLDS } from "../rooms";
import { gravitySave, type GravitySave } from "../save";
import { AppleIcon, IsaacFace, NewtFigure, SkullIcon } from "./icons";
import type { RoomToast } from "./Play";

/** A line for each world's end. */
const WORLD_LINES: Record<number, string> = {
  1: "The Lab thanks you. From here on, gravity is partly your decision.",
  2: "Floors, ceilings. Honestly, what's the difference?",
  3: "The gallery's arrows will go on lying. You don't have to listen.",
  4: "The town is still crooked. You aren't.",
  5: "Space: no up, no down, no excuses. Isaac's tree is waiting.",
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
    <section className={cn(styles.lab, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10")} aria-label={label}>
      <div className={cn(styles.panel, styles.card, "w-[min(94vw,36rem)] p-6 text-center sm:p-8")}>{children}</div>
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#E8F4F2] px-3 py-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#4B6267]">{label}</p>
      <p className={cn(styles.display, "mt-0.5 flex items-center justify-center gap-1.5 text-xl tabular-nums")}>
        {icon}
        {value}
      </p>
    </div>
  );
}

export function WorldComplete({ save, world, last, onNext, onMap }: { save: GravitySave; world: WorldId; last: RoomToast; onNext: () => void; onMap: () => void }) {
  const info = WORLDS.find((w) => w.id === world)!;
  const next = WORLDS.find((w) => w.id === world + 1);
  const stats = worldStats(save, world);
  useForwardKeys(onNext);
  return (
    <Shell label={`${info.name} complete`}>
      <p className="text-sm font-bold text-[#4B6267]">World {world}</p>
      <h1 className={cn(styles.display, "mt-1 text-3xl sm:text-4xl")}>{info.name}: complete!</h1>
      <p className="mt-3 font-semibold">{WORLD_LINES[world]}</p>
      <p className="mt-2 text-sm text-[#4B6267]">
        Last room: {roomLabel(last.roomId)} {getRoom(last.roomId).name} in {formatTime(last.ticks)}
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Apples" value={`${stats.apples}/${stats.rooms * 3}`} icon={<AppleIcon size={16} />} />
        <Stat label="Deaths" value={String(stats.deaths)} icon={<SkullIcon size={14} />} />
        <Stat label="Best total" value={stats.best !== null ? formatTime(stats.best) : "—"} />
      </div>
      <div className="mt-7 grid gap-3">
        <button type="button" className="btn btn-lg w-full" onClick={onNext} data-sound="click">
          {next ? (
            <>
              Up to {next.id === 6 ? "the top" : `World ${next.id}`}: {next.name} <ArrowRight className="size-5" aria-hidden />
            </>
          ) : (
            "Back to the map"
          )}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onMap} data-sound="click">
          <MapIcon className="size-4" aria-hidden /> Map
        </button>
      </div>
    </Shell>
  );
}

export const endingShareText = (save: Pick<GravitySave, "deaths">, apples: number) =>
  `I reached the top of Isaac's tree in Gravity Is Lying. ${save.deaths} ${save.deaths === 1 ? "death" : "deaths"}, ${apples}/${ROOM_IDS.length * 3} golden apples. Gravity was lying all along.\n${SITE.url}/games/gravity-is-lying`;

export function Ending({ save, onMap }: { save: GravitySave; onMap: () => void }) {
  const apples = appleCount(save, ROOM_IDS);
  const [copied, setCopied] = useState(false);
  useForwardKeys(onMap);
  const minutes = Math.round(save.stats.playTicks / 3600);
  const share = async () => {
    const outcome = await shareResult(endingShareText(save, apples));
    if (outcome === "copied") {
      setCopied(true);
      toast({ kind: "success", title: "Copied", description: "Paste it anywhere you like." });
    } else if (outcome === "failed") toast({ kind: "info", title: "Couldn't copy", description: "Select the text and copy it yourself." });
  };
  return (
    <Shell label="The end">
      <p className="text-sm font-bold text-[#4B6267]">★ Isaac&apos;s Tree</p>
      <div className="mt-4 flex items-end justify-center gap-6" aria-hidden>
        <NewtFigure size={64} />
        <IsaacFace size={72} className={styles.fellUp} />
      </div>
      <h1 className={cn(styles.display, "mt-4 text-3xl sm:text-4xl")}>He fell up.</h1>
      <div className={cn(styles.speech, "mx-auto mt-4 max-w-md space-y-2 text-lg leading-snug")}>
        <p>&ldquo;I never fell on anyone&apos;s head. Nobody&apos;s. Not once.&rdquo;</p>
        <p>&ldquo;I fell <em>up</em>. Off a branch, into the sky, all the way to the top of this tree.&rdquo;</p>
        <p>&ldquo;Gravity was lying all along. And so was I.&rdquo;</p>
      </div>
      <p className="mt-4 text-sm font-semibold text-[#4B6267]">Look: his leaf is standing straight up.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Apples" value={`${apples}/${ROOM_IDS.length * 3}`} icon={<AppleIcon size={16} />} />
        <Stat label="Deaths" value={save.deaths.toLocaleString("en-US")} icon={<SkullIcon size={14} />} />
        <Stat label="On ceilings" value={`${Math.floor(save.ceilingTicks / 3600)} min`} />
        <Stat label="Played" value={`${minutes} min`} />
      </div>
      <div className={cn(styles.panel, "mt-6 flex flex-wrap items-center justify-between gap-3 p-4 text-left")}>
        <p className="min-w-0 flex-1 basis-56 text-sm">
          <strong className="block text-base">Truth Mode unlocked</strong>
          Play any room again and Isaac tells you the truth, every time. (He&apos;s trying. It&apos;s new for him.)
        </p>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => gravitySave.update((s) => ({ ...s, prefs: { ...s.prefs, truthMode: !s.prefs.truthMode } }))}
          aria-pressed={save.prefs.truthMode}
          data-sound="click"
        >
          {save.prefs.truthMode ? (
            <>
              <Check className="size-4" aria-hidden /> On
            </>
          ) : (
            "Turn it on"
          )}
        </button>
      </div>
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
