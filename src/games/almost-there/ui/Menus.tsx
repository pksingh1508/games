"use client";

// How to play, the trophy case, the hats, and options: assist mode, the clock, Chirp's text size,
// vibration, touch buttons and key remapping (Plan/08-almost-there.md §3, §8.6, §11).
import { Keyboard, Lock, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Segmented, ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { keyLabel } from "@/engine/input";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { ALMOST_THERE_ACHIEVEMENTS } from "../achievements";
import styles from "../almost-there.module.css";
import { formatClock, formatMetres, pxToMetres } from "../core/progress";
import { countFeathers, FEATHER_COUNT } from "../core/records";
import { DEFAULT_KEYS, REMAPPABLE, type Action } from "../play/runtime";
import { HATS } from "../render/sprites";
import { almostThereSave, assistOn, type AlmostThereSave, type Assist } from "../save";
import { PipPortrait } from "./art";

const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;

export function HowToPlay() {
  return (
    <div className="space-y-5 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Climb the mountain. Plant your flag on the summit.</strong> There&apos;s no dying and no lives, only falling: miss a ledge and you land
        wherever gravity takes you. Maybe one screen down. Maybe five.
      </p>
      <ul className="grid gap-2">
        <li>
          <strong>Hold</strong> <Kbd>Space</Kbd> (or <Kbd>↑</Kbd> / <Kbd>W</Kbd>) to charge a jump: Pip squats lower and the tone rises. <strong>Let go</strong>{" "}
          to leap. A full charge goes by itself.
        </li>
        <li>
          Hold <Kbd>←</Kbd> or <Kbd>→</Kbd> (<Kbd>A</Kbd> / <Kbd>D</Kbd>) <strong>as you let go</strong> to jump that way; nothing for straight up. On
          the ground they walk.
        </li>
        <li>There&apos;s no steering in the air. Walls bounce you back at half speed. Ceilings stop you.</li>
        <li>
          <Kbd>Esc</Kbd> pauses. On a phone: the arrows on one side, a big jump button on the other. Gamepads: stick or D-pad, A to jump.
        </li>
      </ul>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>The climb saves itself</h3>
        <p className="mt-1">
          All the time, even in the air. There&apos;s one climb and no undo: refreshing the page mid-fall just carries on falling. Close the tab and come
          back, and you&apos;re exactly where you were.
        </p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>Things on the mountain</h3>
        <ul className="mt-1 grid gap-1.5">
          <li>
            <strong>Gears</strong> move on a timer. <strong>Flags</strong> show which way the wind blows, and how hard.
          </li>
          <li>
            <strong>Ice</strong> slides. <strong>Snow</strong> makes your jumps weaker. <strong>Cracked ledges</strong> crumble a second after you land.
          </li>
          <li>
            <strong>Mushrooms</strong> throw you up. <strong>Clouds</strong> hold you for a second, then vanish. They come back.
          </li>
          <li>Worn footprints mark the real route.</li>
        </ul>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>Chirp</h3>
        <p className="mt-1">
          The sparrow means well. Mostly. When Chirp looks at Pip, it means it. When it looks at <em>you</em>, don&apos;t listen.
        </p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>The truth</h3>
        <p className="mt-1">The progress bar is optimistic. The altitude in the pause menu is always honest.</p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>Assist mode</h3>
        <p className="mt-1">
          Checkpoint flags (three per zone), a preview of where your jump will land, and 75% speed, in Options. Assisted climbs are marked and
          don&apos;t set best times.
        </p>
      </div>
    </div>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(almostThereSave);
  const t = save.totals;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="almost-there" eyebrow="Almost There" title="Trophies">
      <ul className="grid gap-3">
        {ALMOST_THERE_ACHIEVEMENTS.map((a) => {
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
      <p className="mt-4 text-sm text-muted-surface">
        {t.jumps.toLocaleString("en-US")} jumps and {t.falls.toLocaleString("en-US")} falls so far. You&apos;ve fallen {formatMetres(pxToMetres(t.fallen))} in
        all{t.biggest > 0 ? `, ${formatMetres(pxToMetres(t.biggest))} at once` : ""}. {countFeathers(save.feathers)}/{FEATHER_COUNT} Lost Feathers.
        {save.best.normal && <> Best climb: {formatClock(save.best.normal.ticks, false)}.</>}
        {save.best.mirror && <> Best Mirror climb: {formatClock(save.best.mirror.ticks, false)}.</>}
      </p>
    </Dialog>
  );
}

/** Every Lost Feather is a hat (Plan §6). */
export function Wardrobe() {
  const save = useSave(almostThereSave);
  const wear = (hat: number | null) => almostThereSave.update((s) => ({ ...s, hat }));
  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4" aria-label="Hats">
        <li>
          <button
            type="button"
            className={cn("flex w-full flex-col items-center gap-1 rounded-2xl border p-2 text-xs font-semibold", save.hat === null && "border-ink bg-surface-2")}
            aria-pressed={save.hat === null}
            onClick={() => wear(null)}
            data-sound="click"
          >
            <PipPortrait hat={null} scale={3} />
            No hat
          </button>
        </li>
        {HATS.map((h, i) => {
          const found = (save.feathers & (1 << i)) !== 0;
          return (
            <li key={h.name}>
              <button
                type="button"
                disabled={!found}
                className={cn("flex w-full flex-col items-center gap-1 rounded-2xl border p-2 text-xs font-semibold disabled:opacity-60", save.hat === i && "border-ink bg-surface-2")}
                aria-pressed={save.hat === i}
                onClick={() => wear(i)}
                data-sound="click"
                data-hat={i}
              >
                {found ? <PipPortrait hat={i} scale={3} /> : <Lock className="my-4 size-6" aria-hidden />}
                {found ? h.name : "A Lost Feather"}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-surface">
        {countFeathers(save.feathers)}/{FEATHER_COUNT} found. They&apos;re hidden in the risky spots, one or two in each zone.
      </p>
    </div>
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

const ACTION_NAMES: Record<Action, string> = { left: "Left", right: "Right", jump: "Jump", checkpoint: "Plant a checkpoint", back: "Back to checkpoint", pause: "Pause" };

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
  const save = useSave(almostThereSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<AlmostThereSave["prefs"]>) => almostThereSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  const setAssist = (change: Partial<Assist>) => setPrefs({ assist: { ...prefs.assist, ...change } });
  const keysFor = (action: Action) => prefs.keys?.[action] ?? DEFAULT_KEYS[action];
  const canVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="Show the clock"
        htmlFor="at-clock"
        description="The speedrun timer, with zone splits at the end."
        control={<ToggleSwitch id="at-clock" label="Show the clock" checked={prefs.clock} onCheckedChange={(clock) => setPrefs({ clock })} />}
      />
      <Row
        title="Larger text"
        htmlFor="at-big"
        description="Chirp's lines and the signs, bigger."
        control={<ToggleSwitch id="at-big" label="Larger text" checked={prefs.bigText} onCheckedChange={(bigText) => setPrefs({ bigText })} />}
      />
      {canVibrate && (
        <Row
          title="Buzz on landing"
          htmlFor="at-vibrate"
          description="A little vibration when you land (Android)."
          control={<ToggleSwitch id="at-vibrate" label="Buzz on landing" checked={prefs.vibrate} onCheckedChange={(vibrate) => setPrefs({ vibrate })} />}
        />
      )}

      <div className="py-4">
        <p className="font-bold">Assist mode</p>
        <p className="text-sm text-muted-surface">
          Climbs with assist are marked and don&apos;t set best times.
          {assistOn(prefs.assist) && <strong className="text-ink"> Assist is on.</strong>}
        </p>
        <div className="mt-3 grid gap-3">
          <Row
            title="Checkpoint flags"
            htmlFor="at-checkpoints"
            description="Plant up to three per zone (C), and go back to the last one (R)."
            control={<ToggleSwitch id="at-checkpoints" label="Checkpoint flags" checked={prefs.assist.checkpoints} onCheckedChange={(checkpoints) => setAssist({ checkpoints })} />}
          />
          <Row
            title="Jump preview"
            htmlFor="at-preview"
            description="While you charge, a dotted line shows where you'd land."
            control={<ToggleSwitch id="at-preview" label="Jump preview" checked={prefs.assist.preview} onCheckedChange={(preview) => setAssist({ preview })} />}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold">Game speed</span>
            <Segmented
              label="Game speed"
              value={String(prefs.assist.speed) as "1" | "0.75"}
              options={[
                { value: "1", label: "100%" },
                { value: "0.75", label: "75%" },
              ]}
              onChange={(v) => setAssist({ speed: Number(v) as Assist["speed"] })}
            />
          </div>
        </div>
      </div>

      <div className="py-4">
        <p className="font-bold">On-screen buttons</p>
        <p className="text-sm text-muted-surface">For phones and tablets.</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Segmented
            label="Button size"
            value={prefs.touchSize}
            options={[
              { value: "s", label: "Small" },
              { value: "m", label: "Medium" },
              { value: "l", label: "Large" },
            ]}
            onChange={(touchSize) => setPrefs({ touchSize })}
          />
          <label className="flex items-center gap-3 text-sm font-semibold" htmlFor="at-swap">
            <ToggleSwitch id="at-swap" label="Jump on the left" checked={prefs.touchSwap} onCheckedChange={(touchSwap) => setPrefs({ touchSwap })} />
            Jump on the left
          </label>
        </div>
      </div>

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
        htmlFor="at-sound"
        description={
          <>
            Volume, reduce motion and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            . With reduce motion on, the summit doesn&apos;t shake and falls whoosh more quietly.
          </>
        }
        control={<ToggleSwitch id="at-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="almost-there" eyebrow="Almost There" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="almost-there" eyebrow="Almost There" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

export function WardrobeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="almost-there" eyebrow="Almost There" title="Hats" description="Every Lost Feather is a hat.">
      <Wardrobe />
    </Dialog>
  );
}
