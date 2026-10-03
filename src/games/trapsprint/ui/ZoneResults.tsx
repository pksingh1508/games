"use client";

// A finished zone speedrun (Plan/06-trapsprint.md §7): the total, deaths, and every split against
// your best run's.
import { Check, Grid3x3, RotateCcw, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/toast-store";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { levelTitle } from "../core/level";
import { formatClock } from "../core/medals";
import { getLevel, levelLabel, ZONES, type ZoneId } from "../levels";
import styles from "../trapsprint.module.css";
import { SkullIcon } from "./icons";

export interface ZoneResult {
  zone: ZoneId;
  total: number;
  splits: number[];
  deaths: number;
  assisted: boolean;
  newBest: boolean;
  previous: number | null;
  /** The best run's splits before this one (for the deltas). */
  bestSplits: number[];
}

export function ZoneResults({ result, onAgain, onLevels }: { result: ZoneResult; onAgain: () => void; onLevels: () => void }) {
  const [copied, setCopied] = useState(false);
  const zone = ZONES.find((z) => z.id === result.zone)!;
  const name = zone.id === "R" ? "Remix" : `Zone ${zone.id}, ${zone.name}`;
  const share = async () => {
    const text = `TrapSprint ${zone.id === "R" ? "Remix" : `Zone ${zone.id}`} speedrun — ${formatClock(result.total)} s, ${result.deaths} ${result.deaths === 1 ? "death" : "deaths"}${result.deaths === 0 ? " 🏆" : ""}\n${SITE.url}/games/trapsprint`;
    const outcome = await shareResult(text);
    if (outcome === "copied") {
      setCopied(true);
      toast({ kind: "success", title: "Result copied", description: "Paste it anywhere you like." });
    }
  };

  return (
    <section className={cn(styles.sky, "flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10")}>
      <div className={cn(styles.panel, styles.card, "w-[min(94vw,36rem)] p-5 sm:p-8")}>
        <p className={cn(styles.pixel, "text-center text-[0.6rem] text-[#675E78]")}>{name}</p>
        <h1 className={cn(styles.pixel, "mt-3 text-center text-xl text-[#C8224B] sm:text-2xl")}>{result.newBest ? "New best run!" : "Run complete"}</h1>
        <p className={cn(styles.pixel, "mt-5 text-center text-3xl tabular-nums")}>{formatClock(result.total)}</p>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold">
          <SkullIcon size={14} /> {result.deaths === 0 ? "No deaths. Untouchable." : `${result.deaths} ${result.deaths === 1 ? "death" : "deaths"}`}
          {result.previous !== null && !result.newBest && <span className="text-[#675E78]">· best {formatClock(result.previous)}</span>}
          {result.assisted && <span className="text-[#675E78]">· assist on, not a record</span>}
        </p>
        <table className="mt-6 w-full text-left text-sm">
          <caption className="sr-only">Splits</caption>
          <thead>
            <tr className="font-mono text-xs uppercase text-[#675E78]">
              <th className="py-1 font-bold">Level</th>
              <th className="py-1 text-right font-bold">Split</th>
              <th className="py-1 text-right font-bold">vs best</th>
            </tr>
          </thead>
          <tbody>
            {zone.levels.map((id, i) => {
              const split = result.splits[i];
              const best = result.bestSplits[i];
              const delta = split !== undefined && best !== undefined ? split - best : null;
              return (
                <tr key={id} className="border-t border-[#23153C]/10">
                  <td className="py-1.5">
                    <span className="font-mono font-bold">{levelLabel(id)}</span> <span className="text-[#675E78]">{levelTitle(getLevel(id))}</span>
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{split !== undefined ? formatClock(split) : "—"}</td>
                  <td className={cn("py-1.5 text-right font-mono tabular-nums", delta !== null && (delta <= 0 ? "text-[#257179]" : "text-[#C8224B]"))}>
                    {delta === null ? "" : `${delta <= 0 ? "−" : "+"}${(Math.abs(delta) / 60).toFixed(2)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button type="button" className="btn" onClick={onAgain} data-sound="click">
            <RotateCcw className="size-4" aria-hidden /> Again
          </button>
          <button type="button" className="btn btn-secondary" onClick={share} data-sound="click">
            {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />} Share
          </button>
          <button type="button" className="btn btn-secondary" onClick={onLevels} data-sound="click">
            <Grid3x3 className="size-4" aria-hidden /> Levels
          </button>
        </div>
      </div>
    </section>
  );
}
