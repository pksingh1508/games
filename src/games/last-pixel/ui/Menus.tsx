"use client";

// Help, trophies and options (Plan/10-last-pixel.md §8.5, §11): hunt assist (a slower Pix that shimmers more
// often, a bigger catch radius), the magnifier's zoom, the detector's beeps, reduce motion and sound.
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { PIXEL_ACHIEVEMENTS } from "../achievements";
import { NET_WORTH, starTotals } from "../core/progress";
import { lastPixelSave, type LastPixelSave } from "../save";

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
  const save = useSave(lastPixelSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<LastPixelSave["prefs"]>) => lastPixelSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="Hunt assist"
        htmlFor="lp-assist"
        description="Pix moves slower, shimmers twice as often when it blends in, and is easier to tap. (The third star's for catching it without.)"
        control={<ToggleSwitch id="lp-assist" label="Hunt assist" checked={prefs.assist} onCheckedChange={(assist) => setPrefs({ assist })} />}
      />
      <div className="py-3">
        <span className="font-bold" id="lp-zoom-label">
          Magnifier strength
        </span>
        <p className="text-sm text-muted-surface">How close the lens brings things. It always pushes the contrast right up.</p>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-labelledby="lp-zoom-label">
          {([2, 3, 4] as const).map((z) => (
            <button key={z} type="button" role="radio" aria-checked={prefs.zoom === z} className={cn("btn btn-sm", prefs.zoom === z ? "" : "btn-secondary")} onClick={() => setPrefs({ zoom: z })} data-zoom={z}>
              {z}×
            </button>
          ))}
        </div>
      </div>
      <Row
        title="Detector beeps"
        htmlFor="lp-beeps"
        description="The pixel detector beeps faster as you get closer to Pix. Its ring round your pointer always shows."
        control={<ToggleSwitch id="lp-beeps" label="Detector beeps" checked={prefs.beeps} onCheckedChange={(beeps) => setPrefs({ beeps })} />}
      />
      <Row
        title="Reduce motion"
        htmlFor="lp-motion"
        description="A softer celebration, no confetti; panels that hide Pix get an outline instead of a wobble. (An arcade-wide setting.)"
        control={<ToggleSwitch id="lp-motion" label="Reduce motion" checked={settings.motion === "reduce"} onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))} />}
      />
      <Row
        title="Sound"
        htmlFor="lp-sound"
        description={
          <>
            Volume and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            .
          </>
        }
        control={<ToggleSwitch id="lp-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="last-pixel" eyebrow="Last Pixel" title="Options" description="Saved on this device. Changes apply straight away.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HowToPlay() {
  return (
    <div className="space-y-4 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Get the canvas to 100%.</strong> Paint the wall, mow the lawn, wipe the window: drag over it with the tool until every cell&apos;s
        done. The bar fills up: 80%… 95%… 99.99%. Near the end, the cells you missed sparkle.
      </p>
      <p>
        <strong>Then the last pixel moves.</strong> That&apos;s Pix. Catch it to get a true 100%: tap it (it&apos;s a generous tap), or…
      </p>
      <ul className="grid gap-1.5">
        <li>
          <strong>Net</strong>: Shift-drag a box round it (or pick the net and drag). Quick, or it slips out.
        </li>
        <li>
          <strong>Magnifier</strong> (M, the mouse wheel, a pinch): bigger, and the contrast right up. Nothing blends in under it.
        </li>
        <li>
          <strong>Bait</strong>: a shiny pixel Pix can&apos;t resist. <strong>Freeze</strong>: Pix stops for a second.
        </li>
        <li>
          <strong>The detector</strong> is always on: a ring round your pointer that turns hot and pulses faster (and beeps) as you get close.
        </li>
      </ul>
      <p>
        Pix has tricks, one level at a time, and every trick has a tell. It tires after 30 seconds and gives up after a minute, so there&apos;s no
        way to lose: just faster ways to win. <kbd>Esc</kbd> pauses, <kbd>R</kbd> starts again, <kbd>1</kbd>–<kbd>4</kbd> pick tools.
      </p>
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="last-pixel" eyebrow="Last Pixel" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(lastPixelSave);
  const stars = starTotals(save);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="last-pixel" eyebrow="Last Pixel" title="Trophies">
      <ul className="grid gap-3">
        {PIXEL_ACHIEVEMENTS.map((a) => {
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
        {stars.got} of {stars.of} stars. Pix caught {save.stats.catches.toLocaleString("en-US")} times, {Math.min(save.stats.netCatches, NET_WORTH)} of {NET_WORTH} in the net.
      </p>
    </Dialog>
  );
}
