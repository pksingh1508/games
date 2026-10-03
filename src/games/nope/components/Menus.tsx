"use client";

// The pause menu ("commercial break"), how to play, options and the trophy case.
import { Lock, Play, RotateCcw, Trophy, Tv } from "lucide-react";
import { Switch } from "radix-ui";
import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { playSound } from "@/engine/audio/ui-sound";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { NOPE_ACHIEVEMENTS } from "../achievements";
import { nopeSave } from "../save";

function Toggle({ id, label, description, checked, onChange }: { id: string; label: string; description?: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="font-display text-base font-bold">
          {label}
        </label>
        {description && <p className="text-sm text-muted-surface">{description}</p>}
      </div>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={(on) => {
          onChange(on);
          setTimeout(() => playSound(on ? "toggleOn" : "toggleOff"), 0);
        }}
        className="relative h-8 w-14 shrink-0 rounded-full bg-surface-2 ring-1 ring-[color-mix(in_oklab,var(--ink)_18%,transparent)] transition-colors data-[state=checked]:bg-accent"
      >
        <Switch.Thumb className="block size-6 translate-x-1 rounded-full bg-ink shadow transition-transform duration-200 data-[state=checked]:translate-x-7 data-[state=checked]:bg-on-accent" />
      </Switch.Root>
    </div>
  );
}

/** Sound and the laugh track. The rest of the comfort settings live on the arcade's settings page. */
export function SoundOptions() {
  const settings = useSave(settingsSave);
  const save = useSave(nopeSave);
  return (
    <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
      <Toggle
        id="nope-sound"
        label="Sound"
        checked={settings.sound}
        onChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))}
      />
      <Toggle
        id="nope-laughs"
        label="Laugh track"
        description="The studio audience: laughs, groans and applause."
        checked={save.prefs.laughTrack}
        onChange={(laughTrack) => nopeSave.update((s) => ({ ...s, prefs: { ...s.prefs, laughTrack } }))}
      />
    </div>
  );
}

export function HowToPlay() {
  const items: Array<[string, ReactNode]> = [
    ["❤️", <>Answer all <strong>15 questions</strong> to clear an episode. You have <strong>3 hearts</strong>.</>],
    ["🟥", <>A wrong answer is a <strong>NOPE</strong>: you lose a heart, and the stamp stays on the wall for the rest of the episode.</>],
    ["🔁", <>Out of hearts? The episode starts again. Your stamps stay. So does the quiz&apos;s memory.</>],
    ["🪰", <>Now and then a fly buzzes past. Catch it to earn a <strong>skip</strong>. You can hold one at a time, and bosses can&apos;t be skipped.</>],
    ["🧨", <>Bomb questions burn a fuse across the card. Red fuses mean hurry. Green ones are… different.</>],
    ["🗯️", <>Mr. Nope gives hints. Some of them are even true. NOPE&apos;d twice on one question? He&apos;ll give you an honest one.</>],
    ["🤫", <>There are <strong>five secret rules</strong>. Nobody will tell you what they are.</>],
  ];
  return (
    <div>
      <ul className="space-y-3">
        {items.map(([icon, text]) => (
          <li key={icon} className="flex gap-3">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg">
              {icon}
            </span>
            <span className="pt-1 leading-snug">{text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted-surface">
        Click or tap to answer, drag things around, type when asked. <strong className="text-ink">Esc</strong> (or ⏸) pauses.
        No question needs a keyboard on a phone, or a mouse on a computer.
      </p>
    </div>
  );
}

export function PauseMenu({
  open,
  onResume,
  onRestart,
  onQuit,
}: {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}) {
  const [view, setView] = useState<"menu" | "help" | "restart">("menu");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setView("menu");
          onResume();
        }
      }}
      game="nope"
      eyebrow="Paused"
      title={view === "help" ? "How to play" : view === "restart" ? "Start the episode again?" : "Commercial break"}
      description={
        view === "menu"
          ? "Mr. Nope is touching up his eyebrows. Fuses, flies and timers are frozen."
          : view === "restart"
            ? "Your hearts refill and you go back to question 1. Your stamps stay on the wall."
            : undefined
      }
    >
      {view === "menu" && (
        <div>
          <button type="button" className="btn btn-lg w-full" data-sound="click" onClick={onResume} autoFocus>
            <Play className="size-5" fill="currentColor" aria-hidden /> Resume
          </button>
          <div className="mt-4">
            <SoundOptions />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button type="button" className="btn btn-secondary btn-sm" data-sound="click" onClick={() => setView("help")}>
              How to play
            </button>
            <button type="button" className="btn btn-secondary btn-sm" data-sound="click" onClick={() => setView("restart")}>
              <RotateCcw className="size-4" aria-hidden /> Restart
            </button>
            <button type="button" className="btn btn-secondary btn-sm" data-sound="click" onClick={onQuit}>
              <Tv className="size-4" aria-hidden /> Channels
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-surface">Your run is saved. Quit any time and pick it up later.</p>
        </div>
      )}
      {view === "help" && (
        <div>
          <HowToPlay />
          <button type="button" className="btn btn-sm mt-6 w-full" data-sound="click" onClick={() => setView("menu")}>
            Back
          </button>
        </div>
      )}
      {view === "restart" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="btn"
            data-sound="click"
            onClick={() => {
              setView("menu");
              onRestart();
            }}
          >
            <RotateCcw className="size-4" aria-hidden /> Start again
          </button>
          <button type="button" className="btn btn-secondary" data-sound="click" onClick={() => setView("menu")} autoFocus>
            Keep playing
          </button>
        </div>
      )}
    </Dialog>
  );
}

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSave(nopeSave);
  const unlocked = NOPE_ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      game="nope"
      eyebrow={`${unlocked} of ${NOPE_ACHIEVEMENTS.length} unlocked`}
      title="Trophy case"
      description="NOPE!'s achievements. Saved on this device only."
    >
      <ul className="grid gap-2.5">
        {NOPE_ACHIEVEMENTS.map((achievement) => {
          const at = save.achievements[achievement.id];
          return (
            <li
              key={achievement.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-3.5",
                at ? "border-accent/40 bg-accent/8" : "border-[color-mix(in_oklab,var(--ink)_12%,transparent)]",
              )}
            >
              <span
                className={cn("grid size-10 shrink-0 place-items-center rounded-xl", at ? "bg-accent text-on-accent" : "bg-surface-2 text-muted-surface")}
                aria-hidden
              >
                {at ? <Trophy className="size-5" /> : <Lock className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="font-display font-bold leading-tight">{at ? achievement.title : "???"}</p>
                <p className="mt-0.5 text-sm text-muted-surface">{at ? achievement.description : `Hint: ${achievement.hint}`}</p>
                {at && <p className="mt-1 font-mono text-xs text-muted-surface">Unlocked {dateFormat.format(at)}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
