"use client";

import { Volume2, VolumeX } from "lucide-react";
import { playSound } from "@/engine/audio/ui-sound";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";

export function SoundToggle({ className }: { className?: string }) {
  const settings = useSave(settingsSave);
  const on = settings.sound;
  return (
    <button
      type="button"
      onClick={() => {
        settingsSave.update((s) => ({ ...s, sound: !s.sound }));
        if (!on) setTimeout(() => playSound("toggleOn"), 0);
      }}
      className={cn("grid size-10 place-items-center rounded-xl text-ink-on-bg hover:bg-white/8", className)}
      aria-pressed={on}
      aria-label={on ? "Sound on" : "Sound off"}
      title={on ? "Sound on" : "Sound off"}
    >
      {on ? <Volume2 className="size-5" strokeWidth={2.2} /> : <VolumeX className="size-5 text-muted" strokeWidth={2.2} />}
    </button>
  );
}
