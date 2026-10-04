"use client";

// Help, trophies and options (Plan/01-one-more-step.md §8.5, §11): the D-pad, how far a swipe goes, grid
// coordinates, reduce motion and sound.
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { OMS_ACHIEVEMENTS } from "../achievements";
import { starTotals } from "../progress";
import { omsSave, type OmsSave } from "../save";

function Row({ title, description, control, htmlFor }: { title: string; description: ReactNode; control: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-56">
        <label className="font-bold" htmlFor={htmlFor}>
          {title}
        </label>
        <p className="text-sm text-muted-surface">{description}</p>
      </div>
      {control}
    </div>
  );
}

export function OptionsPanel() {
  const save = useSave(omsSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<OmsSave["prefs"]>) => omsSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="On-screen D-pad"
        htmlFor="om-dpad"
        description="Arrow buttons under the grid (and a wait button in the middle), as well as swiping."
        control={<ToggleSwitch id="om-dpad" label="On-screen D-pad" checked={prefs.dpad} onCheckedChange={(dpad) => setPrefs({ dpad })} />}
      />
      <div className="py-3">
        <label className="font-bold" htmlFor="om-swipe">
          Swipe distance
        </label>
        <p className="text-sm text-muted-surface">How far a finger has to go before it counts as a step. Shorter is quicker; longer is harder to do by accident.</p>
        <div className="mt-2 flex items-center gap-3">
          <input id="om-swipe" type="range" min={12} max={64} step={2} value={prefs.swipe} onChange={(e) => setPrefs({ swipe: Number(e.target.value) })} className="w-56 accent-[#1E7D5E]" data-swipe />
          <span className="w-14 font-mono text-sm tabular-nums">{prefs.swipe} px</span>
        </div>
      </div>
      <Row
        title="Grid coordinates"
        htmlFor="om-coords"
        description="Letters along the top and numbers down the side, for talking about solutions."
        control={<ToggleSwitch id="om-coords" label="Grid coordinates" checked={prefs.coords} onCheckedChange={(coords) => setPrefs({ coords })} />}
      />
      <Row
        title="Reduce motion"
        htmlFor="om-motion"
        description="No screen shake, no squash and stretch. (An arcade-wide setting.)"
        control={<ToggleSwitch id="om-motion" label="Reduce motion" checked={settings.motion === "reduce"} onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))} />}
      />
      <Row
        title="Sound"
        htmlFor="om-sound"
        description={
          <>
            Your footsteps play a tune. Volume and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            .
          </>
        }
        control={<ToggleSwitch id="om-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="one-more-step" eyebrow="One More Step" title="Options" description="Saved on this device. Changes apply straight away.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HowToPlay() {
  return (
    <div className="space-y-4 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Step onto the exit.</strong> That&apos;s all. The world only moves when you do: every step, and every wait, is one tick.
      </p>
      <ul className="grid gap-1.5">
        <li>
          <strong>Step</strong>: arrow keys or WASD; on a phone, swipe (or tap the tile next to you).
        </li>
        <li>
          <strong>Wait</strong> one tick: Space (or tap yourself). Waiting counts as a step.
        </li>
        <li>
          <strong>Undo</strong>: Z, as often as you like (nearly always). <strong>Restart</strong>: R. <strong>Menu</strong>: Esc.
        </li>
      </ul>
      <p>
        Nobody explains the rules. Step, watch what happens, make a theory, test it. Every level has a <strong>par</strong> (a few steps more than
        the fewest possible): finish within it for a second star, in the fewest for a third.
      </p>
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="one-more-step" eyebrow="One More Step" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(omsSave);
  const stars = starTotals(save);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="one-more-step" eyebrow="One More Step" title="Trophies">
      <ul className="grid gap-3">
        {OMS_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")} data-trophy={a.id}>
              <Trophy className={cn("mt-0.5 size-5 shrink-0", at ? "text-[#C58B00]" : "text-muted-surface")} aria-hidden />
              <span>
                <strong className="block">{at ? a.title : "???"}</strong>
                <span className="text-sm text-muted-surface">{at ? a.description : a.hint}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted-surface">
        {stars.got} of {stars.of} stars · {save.stats.steps.toLocaleString("en-US")} steps · {save.stats.undos.toLocaleString("en-US")} undos ·{" "}
        {save.stats.deaths.toLocaleString("en-US")} ouches.
      </p>
    </Dialog>
  );
}
