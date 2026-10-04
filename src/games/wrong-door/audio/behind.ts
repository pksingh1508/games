// What you hear behind a door when you knock (Plan/13-wrong-door.md §9 "Sounds behind doors are a core
// mechanic"): wind, footsteps, ticking, whispers or silence, made from noise and tones so they're easy to
// tell apart, and panned to where the door is (left doors sound left). Every one also has a caption.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";
import type { Sound } from "../logic/types";

export const CAPTIONS: Record<Sound, { text: string; icon: string }> = {
  wind: { text: "wind, rushing up", icon: "🌬️" },
  footsteps: { text: "footsteps, coming closer", icon: "👣" },
  ticking: { text: "ticking", icon: "⏱️" },
  whispers: { text: "whispers", icon: "💬" },
  silence: { text: "silence", icon: "…" },
};

function panned(a: AudioEngine, pan: number): AudioNode {
  if (typeof a.ctx.createStereoPanner !== "function") return a.buses.sfx;
  const p = a.ctx.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(a.buses.sfx);
  return p;
}

/** Play what's behind a door, `delay` seconds from now (after your knocks). */
export function playBehind(sound: Sound, pan: number, delay = 0.55) {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime + delay;
  const out = panned(a, pan);
  switch (sound) {
    case "wind": {
      // A rising, howling draft: band-passed noise that sweeps up.
      const g = envelope(a, out, t, { peak: 0.5, attack: 0.45, hold: 0.6, decay: 0.6 });
      const band = filter(a, g, "bandpass", 420, 1.4);
      band.frequency.setValueAtTime(380, t);
      band.frequency.exponentialRampToValueAtTime(950, t + 1.1);
      band.frequency.exponentialRampToValueAtTime(600, t + 1.65);
      playNoise(a, band, t, 1.7);
      const low = filter(a, envelope(a, out, t, { peak: 0.25, attack: 0.5, hold: 0.5, decay: 0.6 }), "lowpass", 260);
      playNoise(a, low, t, 1.7, 0.6);
      break;
    }
    case "footsteps":
      // Four heavy steps, each a little louder.
      for (let k = 0; k < 4; k++) {
        const at = t + k * 0.36;
        const peak = 0.35 + k * 0.12;
        playNoise(a, filter(a, envelope(a, out, at, { peak, attack: 0.005, decay: 0.16 }), "lowpass", 320), at, 0.2, k * 0.3);
        playTone(a, envelope(a, out, at, { peak: peak * 0.8, attack: 0.004, decay: 0.12 }), at, 0.14, 78, "sine", 52);
      }
      break;
    case "ticking":
      // A clock: tick, tock.
      for (let k = 0; k < 8; k++) {
        const at = t + k * 0.2;
        playNoise(a, filter(a, envelope(a, out, at, { peak: 0.45, attack: 0.002, decay: 0.03 }), "bandpass", k % 2 ? 2600 : 3400, 4), at, 0.05, k * 0.05);
      }
      break;
    case "whispers": {
      // Breathy syllables at speech pitch, on and off.
      const gaps = [0, 0.16, 0.27, 0.5, 0.62, 0.9, 1.02, 1.2];
      gaps.forEach((at0, k) => {
        const at = t + at0;
        const syll = filter(a, envelope(a, out, at, { peak: 0.32, attack: 0.03, decay: 0.09 + (k % 3) * 0.02 }), "bandpass", 1800 + (k % 4) * 450, 5);
        playNoise(a, syll, at, 0.16, k * 0.11);
      });
      break;
    }
    case "silence":
      // Nothing. (A breath of room tone, so you know you listened.)
      playNoise(a, filter(a, envelope(a, out, t, { peak: 0.03, attack: 0.3, hold: 0.6, decay: 0.5 }), "lowpass", 180), t, 1.4);
      break;
  }
}

/** The swell as a door opens (about 1.2 s): creak, and rising suspense. */
export function playSwell() {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime;
  const g = envelope(a, a.buses.sfx, t, { peak: 0.22, attack: 1.0, decay: 0.3 });
  const band = filter(a, g, "bandpass", 300, 2);
  band.frequency.setValueAtTime(220, t);
  band.frequency.exponentialRampToValueAtTime(1400, t + 1.15);
  playNoise(a, band, t, 1.35);
  playTone(a, envelope(a, a.buses.sfx, t, { peak: 0.07, attack: 1.0, decay: 0.3 }), t, 1.3, 110, "triangle", 220);
}

/** Where a door's sound comes from: the door's place across the hall (mirror floors flip it). */
export const panFor = (place: number, doors: number, mirror: boolean) => {
  const x = doors <= 1 ? 0 : ((place - 1) / (doors - 1)) * 1.6 - 0.8;
  return mirror ? -x : x;
};
