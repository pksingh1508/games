"use client";

// How to play, the trophy case, and options: high-contrast tells, the clock, assist mode, touch
// buttons and key remapping (Plan/05-fake-floor.md §8.5, §11).
import { Keyboard, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Segmented, ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { keyLabel } from "@/engine/input";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { FAKE_FLOOR_ACHIEVEMENTS } from "../achievements";
import { MEDAL_IDS, MEDALS } from "../core/medals";
import { isCleared } from "../core/progress";
import styles from "../fake-floor.module.css";
import { DEFAULT_KEYS, REMAPPABLE, type Action } from "../play/runtime";
import { isUnlocked, WORLDS } from "../rooms";
import { assistOn, fakeFloorSave, type Assist, type FakeFloorSave } from "../save";
import { MedalIcon } from "./icons";

const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;

export function HowToPlay() {
  const save = useSave(fakeFloorSave);
  const cleared = (id: string) => isCleared(save, id);
  return (
    <div className="space-y-5 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Cross each room to the door.</strong> The danger isn&apos;t enemies, it&apos;s the ground: some floors are fake, some crumble, and
        some &quot;nothing&quot; is solid. There&apos;s no clock unless you want one, so look before you leap.
      </p>
      <ul className="grid gap-2">
        <li>
          <Kbd>←</Kbd> <Kbd>→</Kbd> or <Kbd>A</Kbd> <Kbd>D</Kbd> to walk. <Kbd>Space</Kbd>, <Kbd>↑</Kbd> or <Kbd>W</Kbd> to jump: hold it to jump
          higher.
        </li>
        <li>
          <strong>Throw a pebble</strong> by clicking the floor you want to test, or tap <Kbd>F</Kbd> (hold it to aim further). On a phone, tap the
          floor.
        </li>
        <li>
          Hold <Kbd>Shift</Kbd> to <strong>look ahead</strong> (the eye button on a phone). <Kbd>R</Kbd> restarts the room, <Kbd>Esc</Kbd> pauses.
        </li>
        <li>Gamepads: stick or D-pad, A to jump, X or a trigger to throw (aim with the right stick), a shoulder to look, Y to restart.</li>
      </ul>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>The pebble never lies</h3>
        <p className="mt-1">
          <strong>Tok</strong>: the floor is real. <strong>Tink</strong>: an invisible floor (it glows for a moment). <strong>Nothing at all</strong>:
          there&apos;s no floor there. You only get a few per room, so spend them on the floors you can&apos;t read.
        </p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>Every lie has a tell</h3>
        <ul className="mt-1 grid gap-1.5">
          {WORLDS.slice(0, 5).map((w) => (
            <li key={w.id}>
              <strong>{w.name}:</strong> {isUnlocked(w.rooms[0]!, cleared) ? w.tell : "you'll see when you get there."}
            </li>
          ))}
        </ul>
        <p className="mt-1">Crumbling floors look cracked and hold you for a moment: keep moving. Some floors only hold you once.</p>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>Medals</h3>
        <ul className="mt-1 grid gap-1.5">
          {MEDAL_IDS.map((m) => (
            <li key={m} className="flex items-center gap-2">
              <MedalIcon medal={m} got size={18} /> <strong>{MEDALS[m].name}:</strong> {MEDALS[m].rule.toLowerCase()} in one visit to the room
              {m === "quick" ? " (par is shown on the map)" : ""}.
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className={cn(styles.pixel, "text-base")}>Assist mode</h3>
        <p className="mt-1">Slow motion, unlimited pebbles or safety nets everywhere, in Options. Medals are off while it&apos;s on, but rooms still open.</p>
      </div>
    </div>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(fakeFloorSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="fake-floor" eyebrow="Fake Floor" title="Trophies">
      <ul className="grid gap-3">
        {FAKE_FLOOR_ACHIEVEMENTS.map((a) => {
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
        {save.falls.toLocaleString("en-US")} falls so far, {save.fakeFalls.toLocaleString("en-US")} of them through floors that lied.{" "}
        {save.thrown.toLocaleString("en-US")} pebbles thrown.
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

const ACTION_NAMES: Record<Action, string> = { left: "Left", right: "Right", jump: "Jump", throw: "Throw", look: "Look ahead", restart: "Restart", pause: "Pause" };

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
  const save = useSave(fakeFloorSave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<FakeFloorSave["prefs"]>) => fakeFloorSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  const setAssist = (change: Partial<Assist>) => setPrefs({ assist: { ...prefs.assist, ...change } });
  const keysFor = (action: Action) => prefs.keys?.[action] ?? DEFAULT_KEYS[action];

  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Row
        title="High-contrast tells"
        htmlFor="ff-contrast"
        description="Thicker grout, bigger splashes, darker shadows. Every tell, easier to see."
        control={<ToggleSwitch id="ff-contrast" label="High-contrast tells" checked={prefs.highContrast} onCheckedChange={(highContrast) => setPrefs({ highContrast })} />}
      />
      <Row
        title="Show the clock"
        htmlFor="ff-clock"
        description="Time each room (for the Quick medal). Time trials always show it."
        control={<ToggleSwitch id="ff-clock" label="Show the clock" checked={prefs.clock} onCheckedChange={(clock) => setPrefs({ clock })} />}
      />

      <div className="py-4">
        <p className="font-bold">Assist mode</p>
        <p className="text-sm text-muted-surface">
          No medals while any of these is on. Rooms still open.
          {assistOn(prefs.assist) && <strong className="text-ink"> Assist is on.</strong>}
        </p>
        <div className="mt-3 grid gap-3">
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
          <Row
            title="Unlimited pebbles"
            htmlFor="ff-unlimited"
            description="Test every floor you like."
            control={<ToggleSwitch id="ff-unlimited" label="Unlimited pebbles" checked={prefs.assist.unlimited} onCheckedChange={(unlimited) => setAssist({ unlimited })} />}
          />
          <Row
            title="Safety nets everywhere"
            htmlFor="ff-nets"
            description="A fall puts you back on the last safe floor instead of restarting the room."
            control={<ToggleSwitch id="ff-nets" label="Safety nets everywhere" checked={prefs.assist.nets} onCheckedChange={(nets) => setAssist({ nets })} />}
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
          <label className="flex items-center gap-3 text-sm font-semibold" htmlFor="ff-swap">
            <ToggleSwitch id="ff-swap" label="Jump on the left" checked={prefs.touchSwap} onCheckedChange={(touchSwap) => setPrefs({ touchSwap })} />
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
        htmlFor="ff-sound"
        description={
          <>
            Volume, reduce motion and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            . With reduce motion on, painted floors wear a frame instead of sliding.
          </>
        }
        control={<ToggleSwitch id="ff-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="fake-floor" eyebrow="Fake Floor" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="fake-floor" eyebrow="Fake Floor" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}
