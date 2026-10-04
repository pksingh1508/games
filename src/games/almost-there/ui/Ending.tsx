"use client";

// The real summit (Plan/08-almost-there.md §5, §7, §8.5): the stats, the zone splits and a share
// card. "You climbed 420 m. You fell 3,812 m." Then Mirror Mountain, if you dare.
import { Check, Copy, Home, Mountain as MountainIcon, Share2 } from "lucide-react";
import { useState } from "react";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import styles from "../almost-there.module.css";
import type { Climb } from "../core/climb";
import { formatClock, formatMetres, landmarks, pxToMetres } from "../core/progress";
import { countFeathers, FEATHER_COUNT, type SummitResult } from "../core/records";
import { getMountain, ZONES } from "../world";
import { PipPortrait } from "./art";

export function endingShareText(climb: Climb): string {
  const m = getMountain(climb.mirrored);
  const { base, real } = landmarks(m);
  const s = climb.stats;
  const where = climb.mirrored ? "the top of Mirror Mountain" : "the real summit";
  return (
    `I reached ${where} in Almost There: ${formatClock(s.ticks, false)}${climb.assisted ? " (assisted)" : ""}. ` +
    `I climbed ${formatMetres(real - base)} and fell ${formatMetres(pxToMetres(s.fallen))} in ${s.falls.toLocaleString("en-US")} ${s.falls === 1 ? "fall" : "falls"}. ` +
    `${countFeathers(climb.sim.feathers)}/${FEATHER_COUNT} Lost Feathers.\n${SITE.url}/games/almost-there`
  );
}

export function Ending({ climb, result, hat, onMirror, onTitle }: { climb: Climb; result: SummitResult | null; hat: number | null; onMirror: () => void; onTitle: () => void }) {
  const [shared, setShared] = useState<"shared" | "copied" | "failed" | null>(null);
  const m = getMountain(climb.mirrored);
  const { base, real } = landmarks(m);
  const s = climb.stats;
  const best = result?.previous ?? null;

  const share = async () => setShared(await shareResult(endingShareText(climb)));

  const splits = ZONES.filter((z) => climb.splits[z.id] !== undefined);

  return (
    <section className={cn(styles.title, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-12")} data-ending>
      <div className={cn(styles.panel, styles.card, "w-full max-w-xl p-6 sm:p-8")}>
        <div className="flex items-center gap-4">
          <PipPortrait hat={hat} scale={4} label="Pip at the summit" />
          <div>
            <p className={cn(styles.silk, "text-xs text-[#9d7853]")}>{climb.mirrored ? "Mirror Mountain" : "The summit (really)"}</p>
            <h1 className={cn(styles.silk, "text-2xl font-bold sm:text-3xl")}>You made it.</h1>
            {!climb.mirrored && <p className="mt-1 text-sm italic text-[#545d6f]">“We&apos;re… actually there.”</p>}
          </div>
        </div>

        <p className={cn(styles.stat, "mt-6 text-lg leading-relaxed sm:text-xl")} data-ending-line>
          You climbed {formatMetres(real - base)}. You fell {formatMetres(pxToMetres(s.fallen))}.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Stat label="Time" value={formatClock(s.ticks, false)} highlight={result?.newBest} note={result?.newBest ? "Best!" : best ? `Best ${formatClock(best.ticks, false)}` : undefined} />
          <Stat label="Jumps" value={s.jumps.toLocaleString("en-US")} />
          <Stat label="Falls" value={s.falls.toLocaleString("en-US")} />
          <Stat label="Biggest fall" value={formatMetres(pxToMetres(s.biggest))} />
          <Stat label="Lost Feathers" value={`${countFeathers(climb.sim.feathers)}/${FEATHER_COUNT}`} />
          <Stat label="Assist" value={climb.assisted ? "Yes" : "No"} />
        </dl>

        <details className="mt-5 rounded-2xl border p-3 text-sm">
          <summary className="cursor-pointer font-bold">Zone splits</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-[#545d6f]">
                <th className="py-1 font-semibold">Zone</th>
                <th className="py-1 text-right font-semibold">Reached</th>
                {best && <th className="py-1 text-right font-semibold">Best run</th>}
              </tr>
            </thead>
            <tbody>
              {splits.map((z) => {
                const at = climb.splits[z.id]!;
                const was = best?.splits[z.id];
                return (
                  <tr key={z.id} className="border-t">
                    <td className="py-1">{z.name}</td>
                    <td className="py-1 text-right font-mono tabular-nums">{formatClock(at, false)}</td>
                    {best && <td className="py-1 text-right font-mono tabular-nums text-[#545d6f]">{was !== undefined ? formatClock(was, false) : "–"}</td>}
                  </tr>
                );
              })}
              <tr className="border-t font-bold">
                <td className="py-1">The summit</td>
                <td className="py-1 text-right font-mono tabular-nums">{formatClock(s.ticks, false)}</td>
                {best && <td className="py-1 text-right font-mono tabular-nums text-[#545d6f]">{formatClock(best.ticks, false)}</td>}
              </tr>
            </tbody>
          </table>
        </details>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn btn-lg sm:col-span-2" onClick={share} data-sound="click">
            {shared === "copied" ? <Check className="size-5" aria-hidden /> : shared === "shared" ? <Check className="size-5" aria-hidden /> : <Share2 className="size-5" aria-hidden />}
            {shared === "copied" ? "Copied!" : shared === "shared" ? "Shared!" : shared === "failed" ? "Couldn't share" : "Share"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onMirror} data-sound="click">
            <MountainIcon className="size-4 -scale-x-100" aria-hidden /> {climb.mirrored ? "Climb it again" : "Mirror Mountain"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onTitle} data-sound="click">
            <Home className="size-4" aria-hidden /> Title
          </button>
        </div>
        {!climb.mirrored && <p className="mt-4 text-sm text-[#545d6f]">Mirror Mountain: the whole climb, flipped. And no Chirp to keep you company.</p>}
        {shared === "copied" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#545d6f]">
            <Copy className="size-3.5" aria-hidden /> The result is on your clipboard.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, note, highlight }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-[#545d6f]">{label}</dt>
      <dd className={cn("font-mono text-base font-bold tabular-nums", highlight && "text-[#9d7853]")}>
        {value}
        {note && <span className="ml-1.5 text-xs font-semibold text-[#9d7853]">{note}</span>}
      </dd>
    </div>
  );
}
