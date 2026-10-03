"use client";

// How to play, the trophy case, and options (Plan/09-one-tap-chaos.md §8.7, §11).
import { Minus, Plus, RotateCcw, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave, TAP_OFFSET_RANGE } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { OTC_ACHIEVEMENTS } from "../achievements";
import { LIVES } from "../core/run";
import { TIERS } from "../core/timing";
import { CARD_ORDER, RULES } from "../rules";
import { otcSave } from "../save";
import styles from "../otc.module.css";
import { RuleIcon } from "./icons";

export function HowToPlay({ cardsUnlocked }: { cardsUnlocked: number }) {
  return (
    <div className="space-y-5 text-[0.95rem] leading-relaxed">
      <p>
        <strong>One button.</strong> Tap anywhere, press <kbd className="rounded border px-1 font-mono text-xs">Space</kbd> or{" "}
        <kbd className="rounded border px-1 font-mono text-xs">Enter</kbd>, or press A on a gamepad. That’s every control.
      </p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>An instruction flashes up: JUMP!, CATCH!, DON’T!… The scene shows what it means.</li>
        <li>Tap (or don’t) before the 8 beat dots run out.</li>
        <li>
          Miss and a bulb smashes. You have {LIVES}. Every 5 rounds the beat speeds up ({TIERS[0]} → {TIERS[TIERS.length - 1]} BPM).
        </li>
        <li>Every 10th round is a boss. Bosses play by their own rules.</li>
      </ol>
      <div>
        <h3 className={cn(styles.show, "text-xl")}>Chaos Cards</h3>
        <p className="mt-1">From round 6, a card flips every 5 rounds and adds a rule. From the third card on, two rules are active at once.</p>
        <ul className="mt-3 grid gap-2">
          {CARD_ORDER.map((id, i) =>
            i < Math.max(1, cardsUnlocked) ? (
              <li key={id} className="flex items-start gap-3 rounded-xl bg-surface-2 p-3">
                <RuleIcon rule={id} className="mt-0.5 size-5 shrink-0" />
                <span>
                  <strong>{RULES[id].name}.</strong> {RULES[id].description}
                </span>
              </li>
            ) : (
              <li key={id} className="rounded-xl border border-dashed p-3 text-muted-surface">
                Card {i + 1}: you’ll meet it in a run.
              </li>
            ),
          )}
        </ul>
      </div>
      <div>
        <h3 className={cn(styles.show, "text-xl")}>Scoring</h3>
        <p className="mt-1">1 point a round, +1 if two rules were active, +5 for a boss. Your best score unlocks more microgames (at 10, 20, 30, 40 and 50).</p>
      </div>
      <div>
        <h3 className={cn(styles.show, "text-xl")}>Fair play</h3>
        <p className="mt-1">
          The instruction is always on screen, active rules are always shown, red always comes with a ✖ pattern, and Simon’s crown has
          an empty slot when it’s missing. Calibrate your tap timing in Options if taps feel late.
        </p>
      </div>
    </div>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(otcSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="one-tap-chaos" eyebrow="One Tap Chaos" title="Trophies">
      <ul className="grid gap-3">
        {OTC_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")}>
              <Trophy className={cn("mt-0.5 size-5 shrink-0", at ? "text-[#E0A100]" : "text-muted-surface")} aria-hidden />
              <span>
                <strong className="block">{at ? a.title : "???"}</strong>
                <span className="text-sm text-muted-surface">{at ? a.description : a.hint}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

function Row({ title, description, control }: { title: string; description: ReactNode; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-muted-surface">{description}</p>
      </div>
      {control}
    </div>
  );
}

export function OptionsPanel({ onCalibrate }: { onCalibrate: () => void }) {
  const save = useSave(otcSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPref = (key: keyof typeof prefs, value: boolean) => otcSave.update((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } }));
  const offset = settings.tapOffsetMs ?? 0;
  const nudge = (by: number) =>
    settingsSave.update((s) => ({ ...s, tapOffsetMs: Math.min(TAP_OFFSET_RANGE[1], Math.max(TAP_OFFSET_RANGE[0], (s.tapOffsetMs ?? 0) + by)) }));

  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <div className="pb-4">
        <p className="flex items-center gap-2 font-bold">
          <Timer className="size-4" aria-hidden /> Tap timing
        </p>
        <p className="text-sm text-muted-surface">
          How late your taps land on this device. Shared with every rhythm game in the arcade.{" "}
          {settings.tapOffsetMs === null && "Not calibrated yet."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => nudge(-10)} aria-label="10 milliseconds earlier" data-sound="click">
            <Minus className="size-4" aria-hidden />
          </button>
          <output className="min-w-20 text-center font-mono text-lg font-bold tabular-nums" aria-live="polite">
            {offset} ms
          </output>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => nudge(10)} aria-label="10 milliseconds later" data-sound="click">
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" className="btn btn-sm" onClick={onCalibrate} data-sound="click">
            Calibrate
          </button>
          {settings.tapOffsetMs !== null && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => settingsSave.update((s) => ({ ...s, tapOffsetMs: null }))}
              data-sound="click"
            >
              <RotateCcw className="size-4" aria-hidden /> Reset
            </button>
          )}
        </div>
      </div>
      <Row
        title="Reduced speed"
        description="The beat never goes above 120 BPM."
        control={<ToggleSwitch id="otc-speed" label="Reduced speed" checked={prefs.reducedSpeed} onCheckedChange={(v) => setPref("reducedSpeed", v)} />}
      />
      <Row
        title="Visual beat"
        description="A ring around the screen pulses on every beat."
        control={<ToggleSwitch id="otc-beat" label="Visual beat" checked={prefs.visualBeat} onCheckedChange={(v) => setPref("visualBeat", v)} />}
      />
      <Row
        title="Captions"
        description="Name the sound cue under the Silent card. Always on when sound is off."
        control={<ToggleSwitch id="otc-captions" label="Captions" checked={prefs.captions} onCheckedChange={(v) => setPref("captions", v)} />}
      />
      <Row
        title="Hold to pump"
        description="In PUMP!, hold the button instead of tapping fast."
        control={<ToggleSwitch id="otc-hold" label="Hold to pump" checked={prefs.holdMode} onCheckedChange={(v) => setPref("holdMode", v)} />}
      />
      <Row
        title="Sound"
        description={
          <>
            Volume, motion and flashing live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade’s comfort settings
            </Link>
            . Lights Out turns into a dim when flashing is reduced.
          </>
        }
        control={<ToggleSwitch id="otc-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}
