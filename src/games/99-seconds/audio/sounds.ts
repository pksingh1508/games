// 99 Seconds' sounds (Plan/03-99-seconds.md §9 "Audio"): the constant tick (the game's heartbeat, stretched when you
// glance at a clock), the reversed whoosh of a reset, and a sound for everything you do and every timed event, clear
// enough to hear from another wall (and panned toward it). All synthesized on the arcade's audio engine.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

function out(audio: AudioEngine, pan = 0, gain = 1): GainNode {
  const level = audio.ctx.createGain();
  level.gain.value = gain;
  if (pan !== 0 && typeof audio.ctx.createStereoPanner === "function") {
    const p = audio.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    level.connect(p);
    p.connect(audio.buses.sfx);
  } else level.connect(audio.buses.sfx);
  return level;
}

type Synth = (audio: AudioEngine, o: GainNode, at: number) => void;

const tone = (audio: AudioEngine, o: AudioNode, at: number, dur: number, f: number, type: OscillatorType = "sine", peak = 0.6, glide?: number) =>
  playTone(audio, envelope(audio, o, at, { peak, attack: 0.005, decay: dur }), at, dur + 0.02, f, type, glide);

const noise = (audio: AudioEngine, o: AudioNode, at: number, dur: number, kind: BiquadFilterType, f: number, peak = 0.6, q = 1) => playNoise(audio, envelope(audio, filter(audio, o, kind, f, q), at, { peak, attack: 0.005, decay: dur }), at, dur + 0.05, Math.random());

const SOUNDS: Record<string, Synth> = {
  beep: (a, o, t) => tone(a, o, t, 0.06, 1250, "square", 0.25),
  click: (a, o, t) => tone(a, o, t, 0.03, 2400, "square", 0.2),
  buzz: (a, o, t) => {
    tone(a, filter(a, o, "lowpass", 900), t, 0.32, 110, "sawtooth", 0.5);
    tone(a, filter(a, o, "lowpass", 900), t, 0.32, 117, "sawtooth", 0.4);
  },
  unlock: (a, o, t) => {
    tone(a, o, t, 0.04, 1800, "square", 0.3);
    tone(a, o, t + 0.08, 0.04, 1500, "square", 0.3);
    tone(a, o, t + 0.14, 0.25, 90, "sine", 0.7, 60);
  },
  door: (a, o, t) => {
    const c = tone(a, filter(a, o, "bandpass", 700, 3), t, 0.7, 110, "sawtooth", 0.35);
    c.frequency.linearRampToValueAtTime(160, t + 0.3);
    c.frequency.linearRampToValueAtTime(95, t + 0.7);
    tone(a, o, t + 0.7, 0.3, 70, "sine", 0.7, 45);
  },
  spring: (a, o, t) => {
    tone(a, o, t, 0.5, 260, "triangle", 0.5, 820);
    noise(a, o, t, 0.12, "bandpass", 2400, 0.5, 2);
  },
  slam: (a, o, t) => {
    noise(a, o, t, 0.3, "lowpass", 600, 0.9);
    tone(a, o, t, 0.4, 70, "sine", 0.9, 40);
  },
  ratchet: (a, o, t) => {
    for (let i = 0; i < 4; i++) tone(a, o, t + i * 0.06, 0.02, 1600, "square", 0.2);
  },
  screw: (a, o, t) => {
    for (let i = 0; i < 3; i++) noise(a, o, t + i * 0.12, 0.08, "bandpass", 3200, 0.35, 6);
  },
  lift: (a, o, t) => noise(a, o, t, 0.4, "bandpass", 900, 0.3),
  pickup: (a, o, t) => {
    tone(a, o, t, 0.04, 900, "square", 0.25);
    noise(a, o, t + 0.05, 0.6, "bandpass", 1800, 0.2, 2);
  },
  ring: (a, o, t) => {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) tone(a, o, t + r * 1.4 + i * 0.05, 0.045, i % 2 ? 840 : 680, "square", 0.18);
  },
  dip: (a, o, t) => {
    tone(a, filter(a, o, "lowpass", 400), t, 1.2, 120, "sawtooth", 0.4, 55);
    noise(a, o, t, 0.2, "lowpass", 800, 0.3);
  },
  glitch: (a, o, t) => {
    for (let i = 0; i < 6; i++) tone(a, o, t + i * 0.05, 0.04, i % 2 ? 60 : 1900, "square", 0.25);
    noise(a, o, t, 0.3, "highpass", 3000, 0.25);
  },
  bird: (a, o, t) => {
    for (let i = 0; i < 3; i++) tone(a, o, t + i * 0.18, 0.08, 3000, "sine", 0.3, 4300);
    for (let i = 0; i < 6; i++) noise(a, o, t + 0.5 + i * 0.07, 0.04, "bandpass", 1500, 0.25, 2);
  },
  hum: (a, o, t) => {
    const h = tone(a, o, t, 2.6, 220, "triangle", 0.35);
    h.frequency.setValueAtTime(220, t);
    h.frequency.linearRampToValueAtTime(232, t + 2.5);
  },
  ignite: (a, o, t) => noise(a, o, t, 0.5, "lowpass", 500, 0.6),
  pour: (a, o, t) => {
    for (let i = 0; i < 10; i++) noise(a, o, t + i * 0.25, 0.3, "bandpass", 600 + (i % 3) * 200, 0.35, 3);
  },
  tap: (a, o, t) => noise(a, o, t, 1.0, "highpass", 1500, 0.3),
  creak: (a, o, t) => {
    const c = tone(a, filter(a, o, "bandpass", 900, 3), t, 0.6, 120, "sawtooth", 0.3);
    for (let i = 1; i < 6; i++) c.frequency.linearRampToValueAtTime(i % 2 ? 160 : 105, t + i * 0.1);
  },
  thunk: (a, o, t) => tone(a, o, t, 0.25, 90, "sine", 0.8, 55),
  whistle: (a, o, t) => {
    const w = tone(a, o, t, 2.2, 1750, "sine", 0.25);
    for (let i = 0; i < 20; i++) w.frequency.setValueAtTime(i % 2 ? 1790 : 1720, t + i * 0.1);
    for (let i = 0; i < 8; i++) noise(a, o, t + i * 0.25, 0.2, "bandpass", 500, 0.25, 2);
  },
  ding: (a, o, t) => {
    tone(a, o, t, 1.3, 2200, "sine", 0.4);
    tone(a, o, t, 0.9, 4400, "sine", 0.15);
  },
  hiss: (a, o, t) => noise(a, o, t, 1.6, "highpass", 3000, 0.5),
  hatch: (a, o, t) => {
    SOUNDS.creak!(a, o, t);
    tone(a, o, t + 0.6, 0.4, 70, "sine", 0.8, 40);
  },
  catch: (a, o, t) => {
    for (let i = 0; i < 4; i++) noise(a, o, t + i * 0.06, 0.04, "bandpass", 1200, 0.3, 2);
    tone(a, o, t + 0.25, 0.1, 700, "triangle", 0.3, 1100);
  },
  wind: (a, o, t) => {
    for (let i = 0; i < 10; i++) tone(a, o, t + i * 0.12, 0.02, 1400 + (i % 2) * 200, "square", 0.22);
  },
  gears: (a, o, t) => {
    tone(a, filter(a, o, "lowpass", 300), t, 1.4, 48, "sawtooth", 0.6);
    noise(a, o, t, 1.2, "bandpass", 400, 0.3, 2);
    tone(a, o, t + 1.2, 0.3, 80, "sine", 0.8, 50);
  },
  clunk: (a, o, t) => {
    noise(a, o, t, 0.15, "lowpass", 900, 0.6);
    tone(a, o, t, 0.3, 110, "sine", 0.8, 70);
  },
  pencil: (a, o, t) => {
    for (let i = 0; i < 9; i++) noise(a, o, t + i * 0.1, 0.06, "bandpass", 3800 + (i % 3) * 400, 0.18, 4);
  },
  tear: (a, o, t) => noise(a, o, t, 0.4, "highpass", 2500, 0.5),
  wings: (a, o, t) => {
    for (let i = 0; i < 9; i++) noise(a, o, t + i * 0.12, 0.08, "bandpass", 700, 0.35, 1.5);
  },
  flutter: (a, o, t) => {
    for (let i = 0; i < 4; i++) noise(a, o, t + i * 0.1, 0.06, "bandpass", 800, 0.3, 1.5);
  },
  hundred: (a, o, t) => {
    for (const [f, g] of [
      [110, 0.7],
      [220, 0.35],
      [331, 0.2],
      [554, 0.12],
    ] as const)
      playTone(a, envelope(a, o, t, { peak: g, attack: 0.01, decay: 4 }), t, 4.1, f, "sine");
  },
};

export function playSound(id: string, pan = 0, gain = 1) {
  const audio = getAudio();
  const synth = SOUNDS[id];
  if (!audio || !synth) return;
  synth(audio, out(audio, pan, gain), audio.ctx.currentTime + 0.01);
}

/** The tick. Stretched (a glance at a clock): lower, longer, a little slurred. */
export function tick(stretched: boolean) {
  const audio = getAudio();
  if (!audio) return;
  const at = audio.ctx.currentTime;
  const o = out(audio, 0, stretched ? 0.5 : 0.35);
  if (stretched) {
    playTone(audio, envelope(audio, filter(audio, o, "bandpass", 1300, 2), at, { peak: 0.6, attack: 0.02, decay: 0.42 }), at, 0.5, 1300, "square", 900);
  } else {
    playTone(audio, envelope(audio, filter(audio, o, "bandpass", 2400, 3), at, { peak: 0.7, attack: 0.001, decay: 0.04 }), at, 0.05, 2400, "square");
  }
}

/** The reset: a whoosh played backwards, as if everything's being sucked back to the start. */
export function whoosh() {
  const audio = getAudio();
  if (!audio) return;
  const at = audio.ctx.currentTime;
  const o = out(audio, 0, 0.8);
  const f = filter(audio, o, "lowpass", 400, 1.2);
  f.frequency.setValueAtTime(400, at);
  f.frequency.exponentialRampToValueAtTime(6000, at + 1.1);
  const g = audio.ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.9, at + 1.1);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 1.18);
  g.connect(f);
  playNoise(audio, g, at, 1.25);
  playTone(audio, envelope(audio, o, at, { peak: 0.4, attack: 1.0, decay: 0.15 }), at, 1.2, 60, "sine", 240);
}

/** A chapter's done (or the loop closes). */
export function chime() {
  const audio = getAudio();
  if (!audio) return;
  const at = audio.ctx.currentTime;
  const o = out(audio, 0, 0.5);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(audio, envelope(audio, o, at + i * 0.18, { peak: 0.5, attack: 0.005, decay: 1.6 }), at + i * 0.18, 1.7, f, "sine"));
}
