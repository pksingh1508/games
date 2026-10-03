"use client";

// How to play, the trophy case, and options: markers, ghost, assist mode, touch buttons and key
// remapping (Plan/06-trapsprint.md §8.6, §11).
import { Keyboard, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Segmented, ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { keyLabel } from "@/engine/input";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { TRAPSPRINT_ACHIEVEMENTS } from "../achievements";
import { DEFAULT_KEYS, REMAPPABLE, type Action } from "../play/runtime";
import { assistOn, trapSprintSave, type Assist, type TrapSprintSave } from "../save";
import styles from "../trapsprint.module.css";

const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;

export function HowToPlay() {
  return (
    <div className="space-y-5 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Reach the door. Then reach it faster.</strong> Every level is one screen, packed with traps that fire exactly when you
        think you&apos;re safe. You&apos;ll die a lot. You respawn instantly, and every death teaches you something.
      </p>
      <ul className="grid gap-2">
        <li>
          <Kbd>←</Kbd> <Kbd>→</Kbd> or <Kbd>A</Kbd> <Kbd>D</Kbd> to run. <Kbd>Space</Kbd>, <Kbd>↑</Kbd> or <Kbd>W</Kbd> to jump: hold it to
          jump higher.
        </li>
        <li>
          <Kbd>R</Kbd> restarts the level instantly (it isn&apos;t a death). <Kbd>Esc</Kbd> pauses.
        </li>
        <li>Gamepads work too: stick or D-pad, A to jump, Y to restart, Start to pause. On a phone, use the on-screen buttons.</li>
      </ul>
      <div>
        <h3 className={cn(styles.pixel, "text-sm")}>Every trap has a tell</h3>
        <p className="mt-2">
          Tiny holes in the floor. A hairline seam. Dust from a crack. Wheels on a door. A flag that doesn&apos;t wave. A coin spinning the
          wrong way. Nothing is random: the same thing happens every time, so once you know a level, you can sprint it.
        </p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-sm")}>Medals</h3>
        <p className="mt-2">
          The clock starts on your first input. Beat the Bronze, Silver and Gold times, and if you&apos;re very good, match the Dev time:
          the designer&apos;s own best run. Your best run becomes a ghost that races you.
        </p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-sm")}>A &quot;?&quot; after a name</h3>
        <p className="mt-2">One trap in that level moves after your first death. Learned it? It moved.</p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-sm")}>Assist mode</h3>
        <p className="mt-2">
          Slow motion, trap outlines after 10 deaths, or invincibility, in Options. Medals are off while it&apos;s on, but clears still open
          the next level.
        </p>
      </div>
    </div>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(trapSprintSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="trapsprint" eyebrow="TrapSprint" title="Trophies">
      <ul className="grid gap-3">
        {TRAPSPRINT_ACHIEVEMENTS.map((a) => {
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
        {save.deaths.toLocaleString("en-US")} deaths so far. {Object.keys(save.causes).length} different ways.
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

const ACTION_NAMES: Record<Action, string> = { left: "Left", right: "Right", jump: "Jump", restart: "Restart", pause: "Pause" };

/** Press-a-key remapping for one action. */
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
  const save = useSave(trapSprintSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<TrapSprintSave["prefs"]>) => trapSprintSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  const setAssist = (change: Partial<Assist>) => setPrefs({ assist: { ...prefs.assist, ...change } });
  const keysFor = (action: Action) => prefs.keys?.[action] ?? DEFAULT_KEYS[action];

  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="Death markers"
        htmlFor="ts-markers"
        description="Little skulls where you died before."
        control={<ToggleSwitch id="ts-markers" label="Death markers" checked={prefs.markers} onCheckedChange={(markers) => setPrefs({ markers })} />}
      />
      <Row
        title="Ghost"
        htmlFor="ts-ghost"
        description="Race a see-through replay of your best run."
        control={<ToggleSwitch id="ts-ghost" label="Ghost" checked={prefs.ghost} onCheckedChange={(ghost) => setPrefs({ ghost })} />}
      />

      <div className="py-4">
        <p className="font-bold">Assist mode</p>
        <p className="text-sm text-muted-surface">
          Medals and best times are off while any of these is on. Clears still open the next level.
          {assistOn(prefs.assist) && <strong className="text-ink"> Assist is on.</strong>}
        </p>
        <div className="mt-3 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold">Game speed</span>
            <Segmented
              label="Game speed"
              value={String(prefs.assist.speed) as "1" | "0.75" | "0.5"}
              options={[
                { value: "1", label: "100%" },
                { value: "0.75", label: "75%" },
                { value: "0.5", label: "50%" },
              ]}
              onChange={(v) => setAssist({ speed: Number(v) as Assist["speed"] })}
            />
          </div>
          <Row
            title="Reveal traps"
            htmlFor="ts-reveal"
            description="After 10 deaths in a level, faint outlines show where traps trigger."
            control={<ToggleSwitch id="ts-reveal" label="Reveal traps" checked={prefs.assist.reveal} onCheckedChange={(reveal) => setAssist({ reveal })} />}
          />
          <Row
            title="Invincible"
            htmlFor="ts-invincible"
            description="Traps and spikes can't hurt you. Falling still sends you back."
            control={
              <ToggleSwitch id="ts-invincible" label="Invincible" checked={prefs.assist.invincible} onCheckedChange={(invincible) => setAssist({ invincible })} />
            }
          />
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
          <label className="flex items-center gap-3 text-sm font-semibold" htmlFor="ts-swap">
            <ToggleSwitch id="ts-swap" label="Jump on the left" checked={prefs.touchSwap} onCheckedChange={(touchSwap) => setPrefs({ touchSwap })} />
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
            <KeyBinder
              key={action}
              action={action}
              keys={keysFor(action)}
              onChange={(keys) => setPrefs({ keys: { ...(prefs.keys ?? {}), [action]: keys } })}
            />
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
        htmlFor="ts-sound"
        description={
          <>
            Volume, screen shake (reduce motion) and colours live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            .
          </>
        }
        control={<ToggleSwitch id="ts-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="trapsprint" eyebrow="TrapSprint" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="trapsprint" eyebrow="TrapSprint" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}
