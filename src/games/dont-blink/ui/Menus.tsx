"use client";

// How to play, trophies, options and the photosensitivity notice (Plan/14-dont-blink.md §2, §7, §8.8, §11).
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { DONT_BLINK_ACHIEVEMENTS } from "../achievements";
import { ANOMALY_INFO, ANOMALY_TYPES } from "../core/types";
import { COUNTS, hoursText, SENT_HOME } from "../progress";
import { dontBlinkSave, type DontBlinkSave } from "../save";
import { TYPE_ICONS } from "./icons";

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
  const save = useSave(dontBlinkSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<DontBlinkSave["prefs"]>) => dontBlinkSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="Soft blinks (Reduce flashing)"
        htmlFor="db-flash"
        description="Blinks become a soft fade to dim and a blur, never black; camera static and power cuts become a gentle blur. (An arcade-wide setting.)"
        control={<ToggleSwitch id="db-flash" label="Soft blinks" checked={settings.reduceFlashing} onCheckedChange={(reduceFlashing) => settingsSave.update((s) => ({ ...s, reduceFlashing }))} />}
      />
      <Row
        title="Jump scares"
        htmlFor="db-scares"
        description="Off: losing a night is a slow fade to black. On: it isn't. (An arcade-wide setting.)"
        control={<ToggleSwitch id="db-scares" label="Jump scares" checked={settings.jumpScares} onCheckedChange={(jumpScares) => settingsSave.update((s) => ({ ...s, jumpScares }))} />}
      />
      <Row
        title="Captions"
        htmlFor="db-captions"
        description="Words for the sounds that matter: the stone scrape (and which room it came from), footsteps, creaks, the lights."
        control={<ToggleSwitch id="db-captions" label="Captions" checked={prefs.captions} onCheckedChange={(captions) => setPrefs({ captions })} />}
      />
      <Row
        title="Colour changes"
        htmlFor="db-colour"
        description="Some changes are only a change of colour (a dress, the moon, a rug). Switch them off and other changes take their place. They're off anyway while a colour-blind mode is on in the arcade's settings. Starts with the next night."
        control={<ToggleSwitch id="db-colour" label="Colour changes" checked={prefs.colourChanges} onCheckedChange={(colourChanges) => setPrefs({ colourChanges })} />}
      />
      <Row
        title="Assist mode"
        htmlFor="db-assist"
        description="Unlimited reference photos, slower blinks, and false reports don't count against you. Starts with the next night."
        control={<ToggleSwitch id="db-assist" label="Assist mode" checked={prefs.assist} onCheckedChange={(assist) => setPrefs({ assist })} />}
      />
      <Row
        title="Sound"
        htmlFor="db-sound"
        description={
          <>
            The stone scrape tells you where the Visitor is: headphones help. Volumes live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            .
          </>
        }
        control={<ToggleSwitch id="db-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="dont-blink" eyebrow="Don't Blink" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HowToPlay() {
  return (
    <div className="space-y-3 text-[0.95rem] leading-relaxed">
      <p>
        <strong>You&apos;re the night guard at the Marlow Museum of Curious Things.</strong> Watch the cameras until 6 AM and report anything that
        changes.
      </p>
      <p>
        Every few seconds you blink, and while your eyes are shut, something changes. A portrait turns its head. A vase is gone. A door is open.
        Report a change and it snaps back. Let <strong>five</strong> pile up and they come for you.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Switch cameras</strong> with <kbd>1</kbd>–<kbd>5</kbd> or the buttons. <kbd>6</kbd> or <kbd>O</kbd> turns round to your own office.
        </li>
        <li>
          <strong>Report:</strong> click the thing that changed (or the empty spot where it was; <kbd>R</kbd> first if you like), then say what kind of
          change it was (<kbd>1</kbd>–<kbd>9</kbd>).
        </li>
        <li>
          <strong>Hold your eyes open</strong> with <kbd>Space</kbd> or the eye button. They strain; when they give out you blink for a long time,
          and several things can change at once.
        </li>
        <li>
          <strong>The binder</strong> (<kbd>F</kbd>) has each room&apos;s morning photo. A few a night.
        </li>
        <li>
          <strong>False reports cost credibility.</strong> Too many in an hour and you&apos;re fired.
        </li>
      </ul>
      <p>
        <strong>The Visitor</strong> is a statue in the Sculpture Hall. It only moves while you blink, and never while you&apos;re watching its camera.
        You&apos;ll hear stone scraping when it does, from the side its room is on. If you see it anywhere but its pedestal, report it as an intruder and
        it goes home. Don&apos;t let it reach your office.
      </p>
      <div>
        <p className="font-bold">What can change</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {ANOMALY_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <li key={t} className="flex items-center gap-2 text-sm">
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>
                  <strong>{ANOMALY_INFO[t].label}:</strong> {ANOMALY_INFO[t].about.toLowerCase()}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="dont-blink" eyebrow="Don't Blink" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(dontBlinkSave);
  const cleared = [1, 2, 3, 4, 5].filter((n) => (save.nights[n]?.clears ?? 0) > 0).length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="dont-blink" eyebrow="Don't Blink" title="Trophies">
      <ul className="grid gap-3">
        {DONT_BLINK_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")} data-trophy={a.id} data-got={at ? "" : undefined}>
              <Trophy className={cn("mt-0.5 size-5 shrink-0", at ? "text-[#7CFFB2]" : "text-muted-surface")} aria-hidden />
              <span>
                <strong className="block">{at ? a.title : "???"}</strong>
                <span className="text-sm text-muted-surface">{at ? a.description : a.hint}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted-surface">
        {cleared} of 5 nights survived. {save.stats.reported.toLocaleString("en-US")} changes reported, {save.stats.falseReports.toLocaleString("en-US")} false
        alarms. The statue sent home {Math.min(save.stats.visitorHome, SENT_HOME)} of {SENT_HOME} times; {Math.min(save.stats.counts, COUNTS)} of {COUNTS}{" "}
        counts caught.{save.endless.best > 0 ? ` Endless best: ${hoursText(save.endless.best)}.` : ""}
      </p>
    </Dialog>
  );
}

/** Before the first night (§11): what flickers, and how to soften it. */
export function NoticeDialog({ open, onOpenChange, onContinue }: { open: boolean; onOpenChange: (open: boolean) => void; onContinue: () => void }) {
  const settings = useSave(settingsSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="dont-blink" eyebrow="Before your first night" title="A word about flicker" description="Don't Blink is built on the screen going dark.">
      <div className="space-y-3 text-[0.95rem] leading-relaxed">
        <p>
          The screen darkens every few seconds (your eyes blinking), camera switches show a burst of static, and from Night 3 the lights flicker. If
          flicker or flashing affects you, switch on soft blinks: they fade to a dim blur instead, and the screen never goes black.
        </p>
        <p>Jump scares are off unless you switch them on. Losing a night is a slow fade.</p>
        <Row
          title="Soft blinks"
          htmlFor="db-notice-flash"
          description="Reduce flashing, arcade-wide."
          control={<ToggleSwitch id="db-notice-flash" label="Soft blinks" checked={settings.reduceFlashing} onCheckedChange={(reduceFlashing) => settingsSave.update((s) => ({ ...s, reduceFlashing }))} />}
        />
        <button type="button" className="btn btn-lg w-full" onClick={onContinue} data-notice-continue>
          I understand. Start the night
        </button>
      </div>
    </Dialog>
  );
}
