"use client";

// How to play, the trophy case, the options (Plan/07-glitch-run.md §8.5, §11): reduce flashing and
// reduce motion (the arcade's own comfort settings), gentle glitches, the beat bar, touch sides, keys
// and sound. And the photosensitivity warning, before the first run.
import { Keyboard, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { keyLabel } from "@/engine/input";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { GLITCH_ACHIEVEMENTS } from "../achievements";
import { BITS_PER_CHARGE, MAX_CHARGES } from "../core/constants";
import { DANGER_TICKS, isOpen, TEARS_GOAL } from "../core/progress";
import { GLITCH_KINDS, GLITCHES, type GlitchKind } from "../glitches/kinds";
import { DEFAULT_KEYS, REMAPPABLE, type Action } from "../play/runtime";
import { glitchSave, type GlitchSave } from "../save";
import { STAGES } from "../stages/stages";
import { Bolt, GlitchIcon } from "./icons";

const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;

/** The first stage that brings each glitch in (its file opens up its entry in the help). */
function firstStageWith(kind: GlitchKind): string | null {
  return STAGES.find((s) => s.glitches?.some((g) => g.kind === kind))?.id ?? null;
}

export function HowToPlay() {
  const save = useSave(glitchSave);
  const seen = (kind: GlitchKind) => {
    const id = firstStageWith(kind);
    return id === null || isOpen(save, id) || save.endless.runs > 0;
  };
  return (
    <div className="space-y-5 text-[0.95rem] leading-relaxed">
      <p>
        <strong>You&apos;re a bug, running through a game that wants you gone.</strong> You run on your own: jump over, slide under, and get to the
        exit before The Debugger patches you.
      </p>
      <ul className="grid gap-2">
        <li>
          <Kbd>Space</Kbd>, <Kbd>↑</Kbd> or <Kbd>W</Kbd> jumps (hold it to go higher). <Kbd>↓</Kbd> or <Kbd>S</Kbd> slides (and drops you faster
          in the air).
        </li>
        <li>
          <Kbd>Shift</Kbd> or <Kbd>J</Kbd> <strong>Clips</strong>: for a moment you&apos;re a ghost, through walls, spikes and scan lines. It costs a
          glitch charge <Bolt size="0.9em" className="inline align-[-0.1em] text-[#FFC857]" />: {BITS_PER_CHARGE} bits make one, and you can hold{" "}
          {MAX_CHARGES}.
        </li>
        <li>
          <Kbd>R</Kbd> restarts, <Kbd>Esc</Kbd> pauses. Phones: tap the right half to jump, the left half to slide, and ⚡ to Clip. Gamepads: A
          jumps, B slides, X (or a shoulder button) clips.
        </li>
      </ul>
      <div>
        <h3 className="font-extrabold">The golden rule</h3>
        <p className="mt-1">
          The glitches only ever break the <em>screen</em> and the <em>controls</em>, never the game itself. Every one is announced first: a
          crackle, and its name at the top of the screen with how to beat it.
        </p>
      </div>
      <div>
        <h3 className="font-extrabold">What never lies</h3>
        <ul className="mt-1 grid gap-1.5">
          <li>
            <strong>Your shadow</strong> is always under where you really are.
          </li>
          <li>
            <strong>The sounds</strong>: a blip one beat before every move you&apos;ll need (high for a jump, low for a slide, a zap for Clip).
          </li>
          <li>
            <strong>The beat bar</strong> along the bottom draws the same blips: each one sits right under the spot where you make the move.
          </li>
          <li>
            <strong>The HUD</strong>: when the controls swap, so do the keys it shows.
          </li>
        </ul>
      </div>
      <div>
        <h3 className="font-extrabold">Corruption</h3>
        <p className="mt-1">
          Clipping corrupts the game further (and endless runs corrupt slowly by themselves); green patches fix it. The more corrupt, the more your
          score is multiplied, and the more often things break. At 100%: a <strong>Kernel Panic</strong>. Survive ten seconds of it for a big bonus.
        </p>
      </div>
      <div>
        <h3 className="font-extrabold">The glitches</h3>
        <ul className="mt-2 grid gap-2">
          {GLITCH_KINDS.map((kind) => (
            <li key={kind} className="flex items-start gap-3">
              <GlitchIcon kind={kind} size="1.4em" className={cn("mt-0.5 shrink-0", seen(kind) ? "text-[#00F5D4]" : "text-muted-surface")} />
              <span>
                {seen(kind) ? (
                  <>
                    <strong>{GLITCHES[kind].name}:</strong> {GLITCHES[kind].what} <em>{GLITCHES[kind].tell}</em>
                  </>
                ) : (
                  <span className="text-muted-surface">▓▒░ not found yet ░▒▓</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(glitchSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="glitch-run" eyebrow="Glitch Run" title="Trophies">
      <ul className="grid gap-3">
        {GLITCH_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")} data-trophy={a.id} data-got={at ? "" : undefined}>
              <Trophy className={cn("mt-0.5 size-5 shrink-0", at ? "text-[#FFC857]" : "text-muted-surface")} aria-hidden />
              <span>
                <strong className="block">{at ? a.title : "???"}</strong>
                <span className="text-sm text-muted-surface">{at ? a.description : a.hint}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted-surface">
        {save.totals.runs.toLocaleString("en-US")} runs, {save.totals.metres.toLocaleString("en-US")} m run, {save.totals.clips.toLocaleString("en-US")}{" "}
        clips. {Math.min(save.totals.tears, TEARS_GOAL)} of {TEARS_GOAL} Screen Tears survived. Living Dangerously takes {DANGER_TICKS / 3600} minute
        above 80%.
      </p>
    </Dialog>
  );
}

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

const ACTION_NAMES: Record<Action, string> = { jump: "Jump", slide: "Slide", glitch: "Clip", restart: "Restart", pause: "Pause" };

function KeyBinder({ action, keys, onChange }: { action: Action; keys: string[]; onChange: (keys: string[]) => void }) {
  const [listening, setListening] = useState(false);
  useEffect(() => {
    if (!listening) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.code !== "Escape") onChange([event.code]);
      setListening(false);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [listening, onChange]);
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="font-semibold">{ACTION_NAMES[action]}</span>
      <button
        type="button"
        className={cn("btn btn-secondary btn-sm min-w-36 font-mono", listening && "animate-pulse")}
        onClick={() => setListening((v) => !v)}
        aria-label={`${ACTION_NAMES[action]}: ${keys.map(keyLabel).join(" or ")}. Press to change.`}
        data-sound="click"
      >
        {listening ? "Press a key…" : keys.map(keyLabel).join(" / ")}
      </button>
    </div>
  );
}

export function OptionsPanel() {
  const save = useSave(glitchSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<GlitchSave["prefs"]>) => glitchSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  const keysFor = (action: Action) => prefs.keys?.[action] ?? DEFAULT_KEYS[action];

  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="Reduce flashing"
        htmlFor="gr-flashing"
        description="Nothing flashes more than three times a second; Invert becomes a soft colour shift. (An arcade-wide setting.)"
        control={
          <ToggleSwitch
            id="gr-flashing"
            label="Reduce flashing"
            checked={settings.reduceFlashing}
            onCheckedChange={(reduceFlashing) => settingsSave.update((s) => ({ ...s, reduceFlashing }))}
          />
        }
      />
      <Row
        title="Gentle glitches"
        htmlFor="gr-gentle"
        description="Every glitch at 30%: smaller tears, softer splits, shorter freezes. Everything else stays the same."
        control={<ToggleSwitch id="gr-gentle" label="Gentle glitches" checked={prefs.gentle} onCheckedChange={(gentle) => setPrefs({ gentle })} />}
      />
      <Row
        title="Reduce motion"
        htmlFor="gr-motion"
        description="No screen shake, and Upside Down shows a warning instead of turning the screen over. (An arcade-wide setting.)"
        control={
          <ToggleSwitch
            id="gr-motion"
            label="Reduce motion"
            checked={settings.motion === "reduce"}
            onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))}
          />
        }
      />
      <Row
        title="Beat bar"
        htmlFor="gr-beatbar"
        description="Every sound cue, drawn along the bottom of the screen. The way to play Not Responding without sound."
        control={<ToggleSwitch id="gr-beatbar" label="Beat bar" checked={prefs.beatBar} onCheckedChange={(beatBar) => setPrefs({ beatBar })} />}
      />
      <Row
        title="Jump on the left"
        htmlFor="gr-touch"
        description="Phones and tablets: swap the halves of the screen (slide on the right)."
        control={<ToggleSwitch id="gr-touch" label="Jump on the left" checked={prefs.touchSwap} onCheckedChange={(touchSwap) => setPrefs({ touchSwap })} />}
      />

      <div className="py-4">
        <p className="flex items-center gap-2 font-bold">
          <Keyboard className="size-4" aria-hidden /> Keys
        </p>
        <p className="text-sm text-muted-surface">Press a button, then the key you want. Esc keeps the old one. Pause is always Esc.</p>
        <div className="mt-2">
          {REMAPPABLE.map((action) => (
            <KeyBinder key={action} action={action} keys={keysFor(action)} onChange={(keys) => setPrefs({ keys: { ...(prefs.keys ?? {}), [action]: keys } })} />
          ))}
        </div>
        {prefs.keys && (
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setPrefs({ keys: null })} data-sound="click">
            <RotateCcw className="size-4" aria-hidden /> Default keys
          </button>
        )}
      </div>

      <Row
        title="Sound"
        htmlFor="gr-sound"
        description={
          <>
            Volume and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            . The cues are half the game: every move has its sound, a beat ahead.
          </>
        }
        control={<ToggleSwitch id="gr-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="glitch-run" eyebrow="Glitch Run" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="glitch-run" eyebrow="Glitch Run" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

/** Before the first run (Plan §11): what's coming, and the comfort settings, right there. */
export function FlashWarning({ open, onPlay }: { open: boolean; onPlay: () => void }) {
  const save = useSave(glitchSave);
  const settings = useSave(settingsSave);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onPlay();
      }}
      game="glitch-run"
      eyebrow="Before you run"
      title="Photosensitivity warning"
      description="This game breaks its own screen on purpose: flickering, colour inversion, tearing, freezes and fast flashes. A small number of people may have seizures from flashing lights or patterns. If you or anyone in your family has epilepsy, or you feel unwell while playing, stop at once."
    >
      <div className="grid gap-1">
        <Row
          title="Reduce flashing"
          htmlFor="gr-warn-flashing"
          description="Never more than three flashes a second; no full-screen inversions."
          control={
            <ToggleSwitch
              id="gr-warn-flashing"
              label="Reduce flashing"
              checked={settings.reduceFlashing}
              onCheckedChange={(reduceFlashing) => settingsSave.update((s) => ({ ...s, reduceFlashing }))}
            />
          }
        />
        <Row
          title="Gentle glitches"
          htmlFor="gr-warn-gentle"
          description="Every effect at 30% strength."
          control={
            <ToggleSwitch
              id="gr-warn-gentle"
              label="Gentle glitches"
              checked={save.prefs.gentle}
              onCheckedChange={(gentle) => glitchSave.update((s) => ({ ...s, prefs: { ...s.prefs, gentle } }))}
            />
          }
        />
        <button type="button" className="btn btn-lg mt-4" onClick={onPlay} data-sound="click" data-warning-play>
          Run
        </button>
        <p className="mt-2 text-center text-sm text-muted-surface">You can change these any time in Options.</p>
      </div>
    </Dialog>
  );
}
