"use client";

// The real settings (Plan/04-dont-trust-the-game.md §8.5): outside the fiction, so they always do what they say.
// Sound and volume, motion and flashing (the arcade's own), captions, text speed, HELPER's eyes in words,
// invincibility, sooner hints, and resetting this game's data (really).
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Segmented, SettingRow, ToggleSwitch, VolumeSlider } from "@/components/settings/Controls";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { defaultDttgSave, dttgSave, type Prefs } from "../save";

export function RealSettings({ open, onOpenChange, onReset }: { open: boolean; onOpenChange: (open: boolean) => void; onReset: () => void }) {
  const save = useSave(dttgSave);
  const settings = useSave(settingsSave);
  const [confirm, setConfirm] = useState(false);
  const prefs = save.prefs;
  const set = (change: Partial<Prefs>) => dttgSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirm(false);
        onOpenChange(next);
      }}
      game="dont-trust-the-game"
      eyebrow="Outside the game"
      title="Real settings"
      description="These are the arcade's. They do exactly what they say, and nothing in the game can change them."
    >
      <div className="divide-y divide-line" data-real-settings>
        <SettingRow
          label="Sound"
          control={<ToggleSwitch id="dttg-sound" checked={settings.sound} onCheckedChange={(sound) => settingsSave.update((s) => ({ ...s, sound }))} label="Sound" />}
        />
        <SettingRow
          label="Volume"
          control={<VolumeSlider label="Volume" value={settings.volume.master} disabled={!settings.sound} onChange={(master) => settingsSave.update((s) => ({ ...s, volume: { ...s.volume, master } }))} />}
        />
        <SettingRow
          label="Reduce motion"
          description="No bobbing, no shaking, no fluttering."
          control={<ToggleSwitch id="dttg-motion" checked={settings.motion === "reduce"} onCheckedChange={(on) => settingsSave.update((s) => ({ ...s, motion: on ? "reduce" : "system" }))} label="Reduce motion" />}
        />
        <SettingRow
          label="Reduce flashing"
          description="Crashes and glitches fade gently instead."
          control={<ToggleSwitch id="dttg-flash" checked={settings.reduceFlashing} onCheckedChange={(reduceFlashing) => settingsSave.update((s) => ({ ...s, reduceFlashing }))} label="Reduce flashing" />}
        />
        <SettingRow
          label="Captions"
          description="Every sound that's a clue, in words (like the whisper)."
          control={<ToggleSwitch id="dttg-captions" checked={prefs.captions} onCheckedChange={(captions) => set({ captions })} label="Captions" />}
        />
        <SettingRow
          label="Text speed"
          control={
            <Segmented
              label="Text speed"
              value={prefs.speed}
              options={[
                { value: "slow", label: "Slow" },
                { value: "normal", label: "Normal" },
                { value: "fast", label: "Fast" },
                { value: "instant", label: "Instant" },
              ]}
              onChange={(speed) => set({ speed })}
            />
          }
        />
        <SettingRow
          label="Describe HELPER's eyes"
          description="Says when HELPER looks away (its tell), for players who can't see the glance."
          control={<ToggleSwitch id="dttg-eyes" checked={prefs.describeEyes} onCheckedChange={(describeEyes) => set({ describeEyes })} label="Describe HELPER's eyes" />}
        />
        <SettingRow
          label="Assist: invincibility"
          description="Spikes, saws and coins can't hurt you."
          control={<ToggleSwitch id="dttg-invincible" checked={prefs.invincible} onCheckedChange={(invincible) => set({ invincible })} label="Invincibility" />}
        />
        <SettingRow
          label="Hints sooner"
          description="TRUTH.exe turns up after 1 minute instead of 3 (and the skip after 5)."
          control={<ToggleSwitch id="dttg-sooner" checked={prefs.sooner} onCheckedChange={(sooner) => set({ sooner })} label="Hints sooner" />}
        />
        <div className="py-5">
          {!confirm ? (
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(true)} data-reset>
              Reset all data for this game
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">Really? Your progress, secrets and trophies go. This one isn&apos;t a joke.</span>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  dttgSave.set({ ...defaultDttgSave(), prefs: save.prefs });
                  dttgSave.flush();
                  setConfirm(false);
                  onReset();
                }}
                data-reset-confirm
              >
                Reset
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
                Keep it
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
