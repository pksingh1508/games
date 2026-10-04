"use client";

// Help, trophies, options and the pointer-speed check (Plan/12-cursor-escape.md §8.6, §11): pointer
// speed (with a pad to try it on), trackpad mode, raw input, steady mode (gentler sabotage), the
// forgiving hitbox (assist), reduce motion and sound.
import { Trophy } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { CURSOR_ACHIEVEMENTS } from "../achievements";
import { TURNED_GOAL } from "../core/progress";
import { cursorSave, type CursorSave } from "../save";

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

/** A pad to try the pointer speed on: move over it (no capturing), and the dot moves at the game's speed. */
function TestPad({ speed }: { speed: number }) {
  const [pad, setPad] = useState({ x: 40, y: 60, target: 1 as 0 | 1, hits: 0 });
  const W = 280;
  const H = 120;
  const targets = [
    { x: 30, y: 60 },
    { x: W - 30, y: 60 },
  ];
  return (
    <div
      className="relative mt-2 cursor-none touch-none select-none overflow-hidden rounded-md border border-line bg-white"
      style={{ width: W, height: H, maxWidth: "100%" }}
      onPointerMove={(event) => {
        const mx = event.movementX * speed;
        const my = event.movementY * speed;
        setPad((p) => {
          const x = Math.max(0, Math.min(W, p.x + mx));
          const y = Math.max(0, Math.min(H, p.y + my));
          const t = targets[p.target]!;
          if (Math.hypot(x - t.x, y - t.y) < 12) return { x, y, target: p.target ? 0 : 1, hits: p.hits + 1 };
          return { ...p, x, y };
        });
      }}
      aria-label="Test pad: move the mouse over it to try the pointer speed"
      role="img"
    >
      {targets.map((t, i) => (
        <span
          key={i}
          className={cn("absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2", pad.target === i ? "border-[#0A2A8A] bg-[#FFE14D]" : "border-dashed border-[#7E7E7E]")}
          style={{ left: t.x, top: t.y }}
        />
      ))}
      <svg viewBox="0 0 12 20" className="pointer-events-none absolute w-3" style={{ left: pad.x, top: pad.y }} aria-hidden>
        <path d="M0 0 V17 L4 13 L7 20 L9 19 L6 12 H11 Z" fill="#fff" stroke="#000" strokeWidth="1" />
      </svg>
      <span className="absolute bottom-1 right-2 text-xs text-[#555]">{pad.hits} hits</span>
    </div>
  );
}

export function SpeedControl({ which }: { which: "sensitivity" | "trackpadSensitivity" }) {
  const save = useSave(cursorSave);
  const value = save.prefs[which];
  const set = (v: number) => cursorSave.update((s) => ({ ...s, calibrated: true, prefs: { ...s.prefs, [which]: v } }));
  return (
    <div className="py-3">
      <label className="font-bold" htmlFor={`ce-${which}`}>
        {which === "sensitivity" ? "Pointer speed" : "Trackpad speed"}
      </label>
      <p className="text-sm text-muted-surface">
        {which === "sensitivity" ? "How far the cursor goes for how far your mouse goes. Move over the pad: the dot goes at this speed. Bounce between the targets." : "How far the cursor goes for how far your finger drags."}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <input
          id={`ce-${which}`}
          type="range"
          min={0.25}
          max={4}
          step={0.05}
          value={value}
          onChange={(event) => set(Number(event.target.value))}
          className="w-56 accent-[#0A2A8A]"
          data-speed={which}
        />
        <span className="w-12 font-mono text-sm tabular-nums">{value.toFixed(2)}×</span>
      </div>
      {which === "sensitivity" && <TestPad speed={value} />}
    </div>
  );
}

export function OptionsPanel() {
  const save = useSave(cursorSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<CursorSave["prefs"]>) => cursorSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <SpeedControl which="sensitivity" />
      <SpeedControl which="trackpadSensitivity" />
      <Row
        title="Trackpad mode"
        htmlFor="ce-trackpad"
        description="Drag to move the cursor (hold the mouse button) and click by tapping, instead of capturing the mouse. Phones always work this way."
        control={<ToggleSwitch id="ce-trackpad" label="Trackpad mode" checked={prefs.trackpad} onCheckedChange={(trackpad) => setPrefs({ trackpad })} />}
      />
      <Row
        title="Raw mouse input"
        htmlFor="ce-raw"
        description="Turn off your system's mouse acceleration while you play (where the browser allows it). Steadier, but it may feel slower: set the speed again."
        control={<ToggleSwitch id="ce-raw" label="Raw mouse input" checked={prefs.raw} onCheckedChange={(raw) => setPrefs({ raw })} />}
      />
      <Row
        title="Steady mode"
        htmlFor="ce-steady"
        description="Gentler sabotage: inversions become small turns, lag is halved, drift slows down, the big cursor's smaller and trails are shorter."
        control={<ToggleSwitch id="ce-steady" label="Steady mode" checked={prefs.steady} onCheckedChange={(steady) => setPrefs({ steady })} />}
      />
      <Row
        title="Forgiving hitbox"
        htmlFor="ce-assist"
        description="Only the very tip of the cursor can crash, and buttons are easier to click. An assist: no medals while it's on."
        control={<ToggleSwitch id="ce-assist" label="Forgiving hitbox" checked={prefs.assist} onCheckedChange={(assist) => setPrefs({ assist })} />}
      />
      <Row
        title="Reduce motion"
        htmlFor="ce-motion"
        description="No shake when you crash. (An arcade-wide setting.)"
        control={<ToggleSwitch id="ce-motion" label="Reduce motion" checked={settings.motion === "reduce"} onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))} />}
      />
      <Row
        title="Sound"
        htmlFor="ce-sound"
        description={
          <>
            Volume and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            . Every sabotage has its own chime.
          </>
        }
        control={<ToggleSwitch id="ce-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="cursor-escape" eyebrow="DeskOS 98" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

/** Before the first level: set the pointer speed. */
export function Calibration({ open, onDone }: { open: boolean; onDone: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDone();
      }}
      game="cursor-escape"
      eyebrow="DeskOS 98 · Mouse Properties"
      title="Pointer speed"
      description="Every mouse is different. Move over the pad and bounce between the two targets: when it feels comfortable, you're set. (You can change it any time in Options.)"
    >
      <SpeedControl which="sensitivity" />
      <button type="button" className="btn btn-lg mt-4 w-full" onClick={onDone} data-sound="click" data-calibrated>
        That feels right
      </button>
    </Dialog>
  );
}

export function HowToPlay() {
  return (
    <div className="space-y-4 text-[0.95rem] leading-relaxed">
      <p>
        <strong>You are the cursor.</strong> DeskOS 98 wants you uninstalled. Each level is a window: get the cursor from where it starts to the
        window&apos;s <strong>[X]</strong>, and click it. Touch a wall, a pop-up or anything else solid and you crash (and start again, at once).
      </p>
      <ul className="grid gap-1.5">
        <li>
          <strong>On a computer</strong> the game captures your mouse when you click (it draws its own cursor). <kbd>Esc</kbd> lets go and pauses,{" "}
          <kbd>R</kbd> starts the window again.
        </li>
        <li>
          <strong>On a phone</strong> (or in trackpad mode) drag anywhere to move the cursor, and tap to click.
        </li>
        <li>Only the cursor&apos;s tip touches things.</li>
      </ul>
      <div>
        <h3 className="font-extrabold">Shapes have rules</h3>
        <ul className="mt-1 grid gap-1 text-sm">
          <li>
            <strong>I-beam</strong> (over text): tall and thin: it fits through narrow upright slots, but not low ones.
          </li>
          <li>
            <strong>↔ ↕ Resize</strong> (window edges): you can only move one way.
          </li>
          <li>
            <strong>Hand</strong> (links): links pull you in.
          </li>
          <li>
            <strong>Hourglass</strong> (loading): frozen for a moment. Everything else keeps moving.
          </li>
          <li>
            <strong>Crosshair</strong> (precision areas): half speed.
          </li>
          <li>
            <strong>No entry</strong> (restricted areas): you get pushed out.
          </li>
          <li>
            <strong>Fist</strong> (a window&apos;s title bar): you drag the window along. Click to let go.
          </li>
        </ul>
      </div>
      <div>
        <h3 className="font-extrabold">The OS fights back</h3>
        <p className="mt-1">
          It can swap your directions, turn them, slow you down, speed you up, make you drift, hide you behind a fake, surround you with decoys,
          blow you up to a huge size, make your trail solid, and move you back to the middle &ldquo;for your convenience&rdquo;. It always tells
          you a second before, in a notification by the clock, and again when it&apos;s over.
        </p>
        <p className="mt-1">
          <strong>Lost?</strong> Your real cursor&apos;s tip glows, and only it moves exactly with your hand. Wiggle.
        </p>
      </div>
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="cursor-escape" eyebrow="DeskOS 98" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(cursorSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="cursor-escape" eyebrow="DeskOS 98" title="Trophies">
      <ul className="grid gap-3">
        {CURSOR_ACHIEVEMENTS.map((a) => {
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
        {save.crashes.toLocaleString("en-US")} crashes so far. {Math.min(save.stats.turnedClean, TURNED_GOAL)} of {TURNED_GOAL} turned stretches got through.
      </p>
    </Dialog>
  );
}
