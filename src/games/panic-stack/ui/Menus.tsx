"use client";

// How to play, the item guide, trophies and options (Plan/11-panic-stack.md §8.5, §11). The guide fills in as
// you meet things: an item's picture and name once you've seen it, the truth about a liar (and its tells) once
// you've put one down, an event once it's warned you.
import { RotateCcw, RotateCw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { PANIC_ACHIEVEMENTS } from "../achievements";
import { EVENT_KINDS, EVENTS } from "../core/events";
import { ITEM_IDS, ITEMS, TAP_SOUNDS, type ItemId } from "../core/items";
import { FAKE_PANICS, starTotals } from "../progress";
import { panicStackSave, type PanicStackSave } from "../save";
import { canvasFont, SPRITES } from "../render/sprites";

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
  const save = useSave(panicStackSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<PanicStackSave["prefs"]>) => panicStackSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="Zen mode"
        htmlFor="ps-zen"
        description="No clock, no panic events, nothing to lose: the belt waits for you, and falls don't count. Zen clears open the next level and earn the first star."
        control={<ToggleSwitch id="ps-zen" label="Zen mode" checked={prefs.zen} onCheckedChange={(zen) => setPrefs({ zen })} />}
      />
      <Row
        title="Slow conveyor"
        htmlFor="ps-slow"
        description="The belt runs at 60% speed (the conveyor rush still doubles it). Starts with the next level."
        control={<ToggleSwitch id="ps-slow" label="Slow conveyor" checked={prefs.slowBelt} onCheckedChange={(slowBelt) => setPrefs({ slowBelt })} />}
      />
      <Row
        title="Hold to drop"
        htmlFor="ps-hold"
        description="Letting go of the mouse or lifting your finger keeps hold of the item; the Drop button (or Enter) lets go. For unsteady hands."
        control={<ToggleSwitch id="ps-hold" label="Hold to drop" checked={prefs.holdToDrop} onCheckedChange={(holdToDrop) => setPrefs({ holdToDrop })} />}
      />
      <div className="py-3">
        <span className="font-bold" id="ps-rotate-label">
          Rotation buttons
        </span>
        <p className="text-sm text-muted-surface">
          Turn buttons (<RotateCcw className="inline size-3.5" aria-label="turn left" /> <RotateCw className="inline size-3.5" aria-label="turn right" />) for what you&apos;re holding. Automatic shows them on touch screens.
        </p>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-labelledby="ps-rotate-label">
          {(["auto", "on", "off"] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={prefs.rotateButtons === v} className={cn("btn btn-sm", prefs.rotateButtons === v ? "" : "btn-secondary")} onClick={() => setPrefs({ rotateButtons: v })} data-rotate-buttons={v}>
              {v === "auto" ? "Automatic" : v === "on" ? "Always" : "Never"}
            </button>
          ))}
        </div>
      </div>
      <Row
        title="Reduce shake"
        htmlFor="ps-shake"
        description="Earthquakes still shake the tower, but not the screen."
        control={<ToggleSwitch id="ps-shake" label="Reduce shake" checked={prefs.reduceShake} onCheckedChange={(reduceShake) => setPrefs({ reduceShake })} />}
      />
      <Row
        title="Reduce motion"
        htmlFor="ps-motion"
        description="No screen shake, no confetti, calmer belt and title. (An arcade-wide setting.)"
        control={<ToggleSwitch id="ps-motion" label="Reduce motion" checked={settings.motion === "reduce"} onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))} />}
      />
      <Row
        title="Sound"
        htmlFor="ps-sound"
        description={
          <>
            The tap test is how you hear what things are really made of (every sound has a caption too). Volumes live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            .
          </>
        }
        control={<ToggleSwitch id="ps-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="panic-stack" eyebrow="Panic Stack" title="Options" description="Saved on this device. Changes apply straight away.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HowToPlay() {
  return (
    <div className="space-y-3 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Build a tower up to the goal line, then hold it still for three seconds.</strong> Things ride in on the conveyor along the top: pick
        one up, drag it over, turn it, and let go.
      </p>
      <p>
        <strong>Nothing is what it looks like.</strong> The iron safe floats, the feather weighs a ton, the box has a rounded bottom. Two ways to
        tell: <strong>tap</strong> something on the belt to hear what it&apos;s really made of, and <strong>feel how it follows your hand</strong>{" "}
        (heavy things trail behind on a long rubber band; light ones zip and wobble).
      </p>
      <p>
        <strong>Panic events</strong> always warn you first, with an icon, a sound and two seconds. Some sirens are fake: look at what the siren&apos;s
        made of. Three things falling (off the platform, or off the end of the belt), the clock, or something fragile breaking, and it&apos;s over.
        You get one <strong>Oops</strong> a level: it puts everything back to just before your last drop.
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="py-1">Do</th>
            <th>Mouse / keyboard</th>
            <th>Touch</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Pick up", "Click and hold (or drag), or 1–3", "Touch and hold"],
            ["Tap test", "Click once, or T", "Tap once"],
            ["Move", "Drag, or the arrow keys", "Drag"],
            ["Turn", "Q / E, or the wheel", "Twist two fingers, or the turn buttons"],
            ["Drop", "Let go, or Enter", "Lift your finger"],
            ["Oops (once)", "Space / Backspace", "↶ button"],
            ["Pause", "Esc", "⏸ button"],
          ].map(([a, b, c]) => (
            <tr key={a} className="border-t border-line">
              <td className="py-1 font-semibold">{a}</td>
              <td>{b}</td>
              <td>{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-muted-surface">Stars: ★ clear the level, ★★ with nothing falling, ★★★ with more than half the time left.</p>
    </div>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="panic-stack" eyebrow="Panic Stack" title="How to play" className="w-[min(94vw,40rem)]">
      <HowToPlay />
    </Dialog>
  );
}

/** A small picture of an item. */
export function ItemThumb({ kind, className }: { kind: ItemId; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const family = getComputedStyle(c).getPropertyValue("--font-g-rubik").trim();
    if (family) canvasFont.family = `${family}, system-ui, sans-serif`;
    const px = 96;
    c.width = px;
    c.height = px;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, px, px);
    const size = ITEMS[kind].size;
    const k = (px * 0.8) / Math.max(size.w, size.h);
    g.translate(px / 2, px / 2);
    g.scale(k, k);
    SPRITES[kind](g, { w: size.w, h: size.h, t: 0, seed: 2 });
  }, [kind]);
  return <canvas ref={ref} className={cn("size-12 shrink-0", className)} aria-hidden />;
}

export function GuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(panicStackSave);
  const met = ITEM_IDS.filter((id) => save.seen[id]).length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="panic-stack" eyebrow="Panic Stack" title="The item guide" description={`Everything you've met so far: ${met} of ${ITEM_IDS.length} items. A liar's secret goes in once you've put one down.`} className="w-[min(94vw,46rem)]">
      <div className="grid gap-5" data-guide>
        <section>
          <h3 className="text-lg font-black">Items</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {ITEM_IDS.map((id) => {
              const def = ITEMS[id];
              if (!save.seen[id])
                return (
                  <li key={id} className="rounded-xl border border-dashed border-line p-3 opacity-60" aria-label="Not met yet">
                    <p className="font-bold">???</p>
                    <p className="text-sm">You haven&apos;t met this one.</p>
                  </li>
                );
              const known = !!save.known[id];
              return (
                <li key={id} className="flex gap-3 rounded-xl border border-line p-3" data-guide-item={id}>
                  <ItemThumb kind={id} />
                  <div className="min-w-0">
                    <p className="font-bold">
                      {def.name} <span className="text-sm font-normal opacity-70">· tap: “{TAP_SOUNDS[def.tap].caption}”</span>
                    </p>
                    {def.lie ? (
                      known ? (
                        <>
                          <p className="mt-0.5 text-sm">
                            <strong>Really:</strong> {def.lie.truth}
                          </p>
                          <ul className="mt-0.5 list-disc pl-4 text-sm">
                            {def.lie.tells.map((t) => (
                              <li key={t.text}>{t.text}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="mt-0.5 text-sm">Something about it isn&apos;t right. Put one down to find out what.</p>
                      )
                    ) : (
                      <p className="mt-0.5 text-sm">{def.note}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h3 className="text-lg font-black">Panic events</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {EVENT_KINDS.map((k) =>
              save.seen[k] ? (
                <li key={k} className="rounded-xl border border-line p-3" data-guide-event={k}>
                  <p className="font-bold">{EVENTS[k].name}</p>
                  <p className="text-sm">
                    <strong>Warning:</strong> {EVENTS[k].warning}
                  </p>
                  <p className="text-sm">{k === "fakePanic" ? "Nothing at all. The danger is rushing. Its siren is a cardboard cut-out." : EVENTS[k].doing}</p>
                </li>
              ) : (
                <li key={k} className="rounded-xl border border-dashed border-line p-3 opacity-60">
                  <p className="font-bold">???</p>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(panicStackSave);
  const stars = starTotals(save);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="panic-stack" eyebrow="Panic Stack" title="Trophies">
      <ul className="grid gap-3">
        {PANIC_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")} data-trophy={a.id} data-got={at ? "" : undefined}>
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
        {stars.got} of {stars.of} stars. {save.stats.placed.toLocaleString("en-US")} things stacked, {save.stats.fallen.toLocaleString("en-US")} fell, {Math.min(save.stats.fakePanics, FAKE_PANICS)} of {FAKE_PANICS} fake panics seen through.
      </p>
    </Dialog>
  );
}
