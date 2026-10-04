"use client";

// How to play, the trophy case, and options: control mode, assist (the true arrow, slow motion,
// invincibility), Truth Mode, the clock, touch buttons and key remapping
// (Plan/15-gravity-is-lying.md §8.5, §11).
import { Keyboard, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Segmented, ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { keyLabel } from "@/engine/input";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { GRAVITY_ACHIEVEMENTS } from "../achievements";
import { CEILING_GOAL, isUnlocked } from "../core/progress";
import { defaultKeys, remappable, type Action } from "../play/runtime";
import { WORLDS } from "../rooms";
import { assistOn, gravitySave, type Assist, type GravitySave } from "../save";
import { IsaacFace } from "./icons";

const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;

/** What each world teaches (shown once you've reached it). */
const WORLD_TELLS: Record<number, string> = {
  1: "Levers set the whole room's gravity; coloured zones have their own. The arrow in the corner tells the truth here.",
  2: "Flip gravity yourself (F or ↓), but only standing on something, and never inside a zone.",
  3: "The arrow starts lying, and so do painted zone arrows. Some rooms turn on a timer: listen for the hum.",
  4: "The camera turns. A room that looks upright may pull you sideways. Lamps and the scarf know better.",
  5: "Planets pull toward their middles. Painted ones pull nothing: watch the dust around them.",
  6: "Even the water lies up here. Trust the scarf.",
};

export function HowToPlay() {
  const save = useSave(gravitySave);
  const screen = save.prefs.controls === "screen";
  return (
    <div className="space-y-5 text-[0.95rem] leading-relaxed">
      <p>
        <strong>Reach each room&apos;s portal.</strong> Gravity can point down, up, left or right, and the things that tell you which way it points
        (the arrow, the camera, Isaac) don&apos;t always tell the truth. Spikes, or falling out of the room, start it again straight away.
      </p>
      <ul className="grid gap-2">
        {screen ? (
          <li>
            <strong>Screen controls:</strong> the arrow keys (or <Kbd>W</Kbd> <Kbd>A</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd>) walk the way they point on screen,
            along whatever Newt stands on. <Kbd>Space</Kbd> jumps, <Kbd>F</Kbd> flips.
          </li>
        ) : (
          <li>
            <Kbd>←</Kbd> <Kbd>→</Kbd> or <Kbd>A</Kbd> <Kbd>D</Kbd> walk along Newt&apos;s floor, whichever way that is. <Kbd>Space</Kbd>, <Kbd>↑</Kbd>{" "}
            or <Kbd>W</Kbd> jump away from it (hold to jump higher). <Kbd>F</Kbd> or <Kbd>↓</Kbd> flips gravity, from World 2.
          </li>
        )}
        <li>
          Walk into a <strong>lever</strong> to pull it. <Kbd>R</Kbd> restarts the room, <Kbd>Esc</Kbd> pauses.
        </li>
        <li>Gamepads: stick or D-pad to walk, A to jump, B to flip, Y to restart, Start to pause.</li>
      </ul>
      <div>
        <h3 className="font-extrabold">The world can&apos;t lie</h3>
        <p className="mt-1">
          Newt&apos;s scarf hangs the real way down. Water drips fall the real way, dust drifts the real way, lamps swing the real way. Only the
          interface lies. (Until the very end.)
        </p>
      </div>
      <div className="flex items-start gap-3">
        <IsaacFace size={44} lying className="mt-1 shrink-0" />
        <div>
          <h3 className="font-extrabold">Isaac&apos;s tell</h3>
          <p className="mt-1">
            Isaac, the apple, is the world&apos;s leading expert on gravity (he says). When he lies, the leaf on his head droops. When he tells the
            truth, it stands up.
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-extrabold">The worlds</h3>
        <ul className="mt-1 grid gap-1.5">
          {WORLDS.map((w) => (
            <li key={w.id}>
              <strong>{w.name}:</strong> {isUnlocked(save, w.rooms[0]!) ? WORLD_TELLS[w.id] : "you'll see when you get there."}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-extrabold">Golden apples</h3>
        <p className="mt-1">Three in every room, some in places you&apos;d never look. They count once you reach the portal with them.</p>
      </div>
    </div>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(gravitySave);
  const minutes = Math.floor(save.ceilingTicks / 3600);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="gravity-is-lying" eyebrow="Gravity Is Lying" title="Trophies">
      <ul className="grid gap-3">
        {GRAVITY_ACHIEVEMENTS.map((a) => {
          const at = save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", at ? "border-ink bg-surface-2" : "border-dashed opacity-80")}>
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
        {save.deaths.toLocaleString("en-US")} deaths so far. {minutes} of {CEILING_GOAL / 3600} minutes on ceilings.
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

const ACTION_NAMES: Record<Action, string> = { left: "Left", right: "Right", up: "Up", down: "Down", jump: "Jump", flip: "Flip", restart: "Restart", pause: "Pause" };

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
  const save = useSave(gravitySave);
  const settings = useSave(settingsSave);
  const prefs = save.prefs;
  const setPrefs = (change: Partial<GravitySave["prefs"]>) => gravitySave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  const setAssist = (change: Partial<Assist>) => setPrefs({ assist: { ...prefs.assist, ...change } });
  const keysFor = (action: Action) => prefs.keys?.[action] ?? defaultKeys(prefs.controls)[action];
  const reduce = settings.motion === "reduce";

  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <div className="py-3">
        <p className="font-bold">Controls</p>
        <p className="text-sm text-muted-surface">
          <strong>Newt</strong>: ◀ ▶ walk along Newt&apos;s floor, whichever way it faces. <strong>Screen</strong>: the arrows go the way they point on
          screen (four arrows on a phone).
        </p>
        <div className="mt-2">
          <Segmented
            label="Control mode"
            value={prefs.controls}
            options={[
              { value: "newt", label: "Newt" },
              { value: "screen", label: "Screen" },
            ]}
            onChange={(controls) => setPrefs({ controls })}
          />
        </div>
      </div>

      <Row
        title="Reduce motion"
        htmlFor="gil-motion"
        description="The camera never turns. A little frame by the arrow shows how a room would be turned. Everything stays fair."
        control={
          <ToggleSwitch
            id="gil-motion"
            label="Reduce motion"
            checked={reduce}
            onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))}
          />
        }
      />

      <div className="py-4">
        <p className="font-bold">Assist mode</p>
        <p className="text-sm text-muted-surface">
          Golden apples and best times don&apos;t count while any of these is on. Rooms still open.
          {assistOn(prefs.assist) && <strong className="text-ink"> Assist is on.</strong>}
        </p>
        <div className="mt-1 grid">
          <Row
            title="The true arrow"
            htmlFor="gil-arrow"
            description="The arrow in the corner always tells the truth (it gets a yellow ring)."
            control={<ToggleSwitch id="gil-arrow" label="The true arrow" checked={prefs.assist.trueArrow} onCheckedChange={(trueArrow) => setAssist({ trueArrow })} />}
          />
          <Row
            title="Slow motion"
            htmlFor="gil-slow"
            description="Everything at three-quarter speed."
            control={<ToggleSwitch id="gil-slow" label="Slow motion" checked={prefs.assist.slow} onCheckedChange={(slow) => setAssist({ slow })} />}
          />
          <Row
            title="Invincibility"
            htmlFor="gil-invincible"
            description="Spikes and the void put you back where you last stood instead of restarting the room."
            control={<ToggleSwitch id="gil-invincible" label="Invincibility" checked={prefs.assist.invincible} onCheckedChange={(invincible) => setAssist({ invincible })} />}
          />
        </div>
      </div>

      {save.finished && (
        <Row
          title="Truth Mode"
          htmlFor="gil-truth"
          description="Isaac tells the truth in every room. (He's trying. It's new for him.)"
          control={<ToggleSwitch id="gil-truth" label="Truth Mode" checked={prefs.truthMode} onCheckedChange={(truthMode) => setPrefs({ truthMode })} />}
        />
      )}

      <Row
        title="Show the clock"
        htmlFor="gil-clock"
        description="Time each room. Best times show on the map."
        control={<ToggleSwitch id="gil-clock" label="Show the clock" checked={prefs.clock} onCheckedChange={(clock) => setPrefs({ clock })} />}
      />

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
          <label className="flex items-center gap-3 text-sm font-semibold" htmlFor="gil-swap">
            <ToggleSwitch id="gil-swap" label="Jump on the left" checked={prefs.touchSwap} onCheckedChange={(touchSwap) => setPrefs({ touchSwap })} />
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
          {remappable(prefs.controls).map((action) => (
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
        htmlFor="gil-sound"
        description={
          <>
            Volume and the rest live in the{" "}
            <Link href="/settings" className="underline underline-offset-2">
              arcade&apos;s comfort settings
            </Link>
            . The hum before a timed turn is the most useful sound in the game.
          </>
        }
        control={<ToggleSwitch id="gil-sound" label="Sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} />}
      />
    </div>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="gravity-is-lying" eyebrow="Gravity Is Lying" title="Options" description="Saved on this device.">
      <OptionsPanel />
    </Dialog>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} game="gravity-is-lying" eyebrow="Gravity Is Lying" title="How to play">
      <HowToPlay />
    </Dialog>
  );
}

/** Before Tilted Town (Plan §11): the camera is about to start turning. */
export function MotionWarning({ open, onPlay, onReduce }: { open: boolean; onPlay: () => void; onReduce: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onPlay();
      }}
      game="gravity-is-lying"
      eyebrow="Before Tilted Town"
      title="The camera turns from here"
      description="Some rooms are shown turned or tilted, and in one the whole view turns. If rotating views make you feel unwell, turn on reduce motion: the camera stays still, a little frame shows the tilt, and every room is still fair."
    >
      <div className="grid gap-3">
        <button type="button" className="btn btn-lg" onClick={onPlay} data-sound="click">
          Play with the camera turning
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReduce} data-sound="click">
          Turn on reduce motion
        </button>
      </div>
    </Dialog>
  );
}
