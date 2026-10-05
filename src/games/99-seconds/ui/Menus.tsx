"use client";

// How to play, trophies and options (Plan/03-99-seconds.md §2, §3 "Modes", §7, §8.7, §11).
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { NINETY_ACHIEVEMENTS } from "../achievements";
import { STRETCH_MAX_MS } from "../core/loop";
import { GROUNDHOG } from "../progress";
import { ninetySave, type NinetySave } from "../save";

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

const MODES: Array<{ id: NinetySave["prefs"]["mode"]; name: string; about: string }> = [
  { id: "normal", name: "Normal", about: "Your journal writes itself, and opening it stops the clock." },
  { id: "relaxed", name: "Relaxed", about: "150-second loops, and the clock waits while you read." },
  { id: "hardcore", name: "Hardcore", about: "No journal, and nothing stops the clock. Bring a pen and paper." },
];

export function OptionsPanel() {
  const save = useSave(ninetySave);
  const settings = useSave(settingsSave);
  const setPrefs = (change: Partial<NinetySave["prefs"]>) => ninetySave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <div className="py-3">
        <span className="font-bold" id="n9-mode-label">
          Mode
        </span>
        <p className="text-sm text-muted-surface">From the next loop.</p>
        <div className="mt-2 grid gap-2" role="radiogroup" aria-labelledby="n9-mode-label">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={save.prefs.mode === m.id} onClick={() => setPrefs({ mode: m.id })} className={cn("rounded-xl border p-3 text-left", save.prefs.mode === m.id ? "border-ink bg-surface-2" : "border-dashed opacity-80")} data-mode-option={m.id}>
              <strong className="block">{m.name}</strong>
              <span className="text-sm text-muted-surface">{m.about}</span>
            </button>
          ))}
        </div>
      </div>
      <Row
        title="Subtitles"
        htmlFor="n9-subtitles"
        description="Words for every sound that matters: [the phone rings, West wall]."
        control={<ToggleSwitch id="n9-subtitles" label="Subtitles" checked={save.prefs.subtitles} onCheckedChange={(subtitles) => setPrefs({ subtitles })} />}
      />
      <Row
        title="Reduce flashing"
        htmlFor="n9-flash"
        description="The reset between loops becomes a gentle fade instead of a white flash. (An arcade-wide setting.)"
        control={<ToggleSwitch id="n9-flash" label="Reduce flashing" checked={settings.reduceFlashing} onCheckedChange={(reduceFlashing) => settingsSave.update((s) => ({ ...s, reduceFlashing }))} />}
      />
      <Row
        title="Sound"
        htmlFor="n9-sound"
        description={
          <>
            The tick, the music (exactly one loop long) and the sounds from other walls all help you keep time. Volumes and text size live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            .
          </>
        }
        control={<ToggleSwitch id="n9-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="99-seconds" eyebrow="99 Seconds" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HowToPlay() {
  return (
    <div className="space-y-3 text-[0.95rem] leading-relaxed">
      <p>
        <strong>You have 99 seconds. You&apos;ve had them before.</strong> When the clock hits zero, the room resets: the doors lock again, your pockets
        empty, and you&apos;re back in the chair. But you remember, and so does your journal.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Turn</strong> to another wall with <kbd>←</kbd> <kbd>→</kbd>, the arrows, or a swipe. <strong>Click</strong> things to look closer or use them.
          Back out of a close-up with <kbd>↓</kbd>, <kbd>Esc</kbd> or Back.
        </li>
        <li>
          <strong>Things you pick up</strong> go in your pockets. Click one to hold it, then click what to use it on (or drag it there).
        </li>
        <li>
          <strong>Some things take time</strong>: searching a coat, turning a screw. The ring shows how long, and the clock keeps running.
        </li>
        <li>
          <strong>Some things happen at the same second every loop.</strong> Watch, listen, and plan.
        </li>
        <li>
          <strong>Your journal</strong> (<kbd>J</kbd>) keeps every clue, code and note, with the second it happened. Stuck? <kbd>H</kbd> outlines everything you can use.
        </li>
      </ul>
      <p>If you go a while without learning anything, the room starts to remember you. Read the walls.</p>
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="99-seconds" eyebrow="99 Seconds" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(ninetySave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="99-seconds" eyebrow="99 Seconds" title="Trophies">
      <ul className="grid gap-3">
        {NINETY_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")} data-trophy={a.id} data-got={at ? "" : undefined}>
              <Trophy className={cn("mt-0.5 size-5 shrink-0", at ? "text-[#D98E3F]" : "text-muted-surface")} aria-hidden />
              <span>
                <strong className="block">{at ? a.title : "???"}</strong>
                <span className="text-sm text-muted-surface">{at ? a.description : a.hint}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted-surface">
        {save.totalLoops.toLocaleString("en-US")} loop{save.totalLoops === 1 ? "" : "s"} lived ({Math.min(save.totalLoops, GROUNDHOG)} of {GROUNDHOG} for Groundhog). The most time you&apos;ve stretched out of one loop by glancing at clocks:{" "}
        {(save.stretchBest / 1000).toFixed(1)} of {STRETCH_MAX_MS / 1000} seconds.
      </p>
    </Dialog>
  );
}
