"use client";

import { Accessibility, Monitor, RotateCcw, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/toast-store";
import { unlockAchievement } from "@/engine/achievements";
import { playSound } from "@/engine/audio/ui-sound";
import { useSave } from "@/engine/save";
import { DEFAULT_SETTINGS, settingsSave, type Settings } from "@/engine/settings";
import { Segmented, SettingRow, ToggleSwitch, VolumeSlider } from "./Controls";

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface px-6 pt-6 text-ink sm:px-8" aria-label={title}>
      <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold">
        <span className="grid size-10 place-items-center rounded-xl bg-surface-2">{icon}</span>
        {title}
      </h2>
      <div className="mt-2 divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">{children}</div>
    </section>
  );
}

export function SettingsPanel() {
  const settings = useSave(settingsSave);

  const change = (next: Partial<Settings>, sound: Parameters<typeof playSound>[0] = "toggleOn") => {
    settingsSave.update((s) => ({ ...s, ...next }));
    unlockAchievement("comfort-zone");
    // Play after the update, so the new volume/sound switch is used.
    setTimeout(() => playSound(sound), 0);
  };

  const setVolume = (key: keyof Settings["volume"], value: number) =>
    settingsSave.update((s) => ({ ...s, volume: { ...s.volume, [key]: value } }));

  return (
    <div className="space-y-6">
      <Panel icon={<Volume2 className="size-5" aria-hidden />} title="Sound">
        <SettingRow
          label="Sound"
          htmlFor="setting-sound"
          description="The master switch. Also in the header, as the speaker button."
          control={
            <ToggleSwitch
              id="setting-sound"
              label="Sound"
              checked={settings.sound}
              onCheckedChange={(sound) => change({ sound }, sound ? "toggleOn" : "toggleOff")}
            />
          }
        />
        <SettingRow
          label="Master volume"
          control={
            <VolumeSlider
              label="Master volume"
              value={settings.volume.master}
              disabled={!settings.sound}
              onChange={(v) => setVolume("master", v)}
              onCommit={() => {
                unlockAchievement("comfort-zone");
                playSound("coin");
              }}
            />
          }
        />
        <SettingRow
          label="Music"
          description="Used by the games' soundtracks."
          control={
            <VolumeSlider
              label="Music volume"
              value={settings.volume.music}
              disabled={!settings.sound}
              onChange={(v) => setVolume("music", v)}
              onCommit={() => unlockAchievement("comfort-zone")}
            />
          }
        />
        <SettingRow
          label="Sound effects"
          control={
            <VolumeSlider
              label="Sound effects volume"
              value={settings.volume.sfx}
              disabled={!settings.sound}
              onChange={(v) => setVolume("sfx", v)}
              onCommit={() => {
                unlockAchievement("comfort-zone");
                playSound("click");
              }}
            />
          }
        />
      </Panel>

      <Panel icon={<Accessibility className="size-5" aria-hidden />} title="Comfort">
        <SettingRow
          label="Motion"
          description="“System” follows your device. “Reduce” calms animations, camera moves and screen shake everywhere."
          control={
            <Segmented
              label="Motion"
              value={settings.motion}
              onChange={(motion) => change({ motion }, "click")}
              options={[
                { value: "system", label: "System" },
                { value: "reduce", label: "Reduce" },
                { value: "full", label: "Full" },
              ]}
            />
          }
        />
        <SettingRow
          label="Reduce flashing"
          htmlFor="setting-flashing"
          description="No strobes or full-screen flashes; never more than three flashes a second."
          control={
            <ToggleSwitch
              id="setting-flashing"
              label="Reduce flashing"
              checked={settings.reduceFlashing}
              onCheckedChange={(reduceFlashing) => change({ reduceFlashing }, reduceFlashing ? "toggleOn" : "toggleOff")}
            />
          }
        />
        <SettingRow
          label="Allow jump scares"
          htmlFor="setting-scares"
          description="Off by default. When off, scary moments become gentle fades."
          control={
            <ToggleSwitch
              id="setting-scares"
              label="Allow jump scares"
              checked={settings.jumpScares}
              onCheckedChange={(jumpScares) => change({ jumpScares }, jumpScares ? "toggleOn" : "toggleOff")}
            />
          }
        />
      </Panel>

      <Panel icon={<Monitor className="size-5" aria-hidden />} title="Display">
        <SettingRow
          label="Text size"
          description="Scales all text across the arcade."
          control={
            <Segmented
              label="Text size"
              value={settings.textSize}
              onChange={(textSize) => change({ textSize }, "click")}
              options={[
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
                { value: "xl", label: "Extra large" },
              ]}
            />
          }
        />
        <SettingRow
          label="Colour vision"
          description="Nothing in the arcade relies on colour alone. Pick your type and games will tune their patterns and tells for it."
          control={
            <Segmented
              label="Colour vision"
              value={settings.colorblind}
              onChange={(colorblind) => change({ colorblind }, "click")}
              options={[
                { value: "off", label: "Default" },
                { value: "deuteranopia", label: "Deutan" },
                { value: "protanopia", label: "Protan" },
                { value: "tritanopia", label: "Tritan" },
              ]}
            />
          }
        />
      </Panel>

      <div className="flex flex-col items-start justify-between gap-4 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-5 sm:flex-row sm:items-center sm:px-8">
        <p className="text-muted">Settings are saved instantly, on this device only.</p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          data-sound="click"
          onClick={() => {
            settingsSave.set(structuredClone(DEFAULT_SETTINGS));
            toast({ kind: "success", title: "Settings reset", description: "Everything is back to the defaults." });
          }}
        >
          <RotateCcw className="size-4" aria-hidden /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
