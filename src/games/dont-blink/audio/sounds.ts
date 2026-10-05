// Don't Blink's sounds (Plan/14-dont-blink.md §9 "Audio"): a low hum, ticking, distant creaks; the Visitor's
// stone scrape, the most important sound in the game, panned toward its room (and quieter the further away it
// is); camera static; the report button's click, accepted and denied; a heartbeat that rises with the count of
// unreported changes; the 6 AM bell. Almost no music: silence makes the tension. All synthesized on the arcade's
// audio engine, so the sound switch and volumes apply.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

const clampPan = (pan: number) => Math.max(-1, Math.min(1, pan));

/** A gain (and stereo position) into a bus. */
function out(audio: AudioEngine, { pan = 0, gain = 1, bus = "sfx" }: { pan?: number; gain?: number; bus?: "sfx" | "music" } = {}): GainNode {
  const level = audio.ctx.createGain();
  level.gain.value = gain;
  if (pan !== 0 && typeof audio.ctx.createStereoPanner === "function") {
    const panner = audio.ctx.createStereoPanner();
    panner.pan.value = clampPan(pan);
    level.connect(panner);
    panner.connect(audio.buses[bus]);
  } else level.connect(audio.buses[bus]);
  return level;
}

export const sounds = {
  /** The Visitor moved: stone dragging on stone. `far` 0 (right outside) … 1 (the far end of the museum). */
  scrape(pan: number, far: number) {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime + 0.02;
    const level = out(audio, { pan, gain: 1.15 - far * 0.65 });
    // The grind: noise through a narrow band that wobbles, in uneven pulls.
    const band = filter(audio, envelope(audio, level, at, { peak: 0.9, attack: 0.08, hold: 0.9, decay: 0.5 }), "bandpass", 420, 2.2);
    band.frequency.setValueAtTime(380, at);
    band.frequency.linearRampToValueAtTime(520, at + 0.5);
    band.frequency.linearRampToValueAtTime(340, at + 1.2);
    const grit = audio.ctx.createGain();
    grit.gain.setValueAtTime(0.4, at);
    for (let i = 0; i < 9; i++) grit.gain.setValueAtTime(i % 2 ? 0.35 : 1, at + i * 0.15 + (i % 3) * 0.02);
    grit.connect(band);
    playNoise(audio, grit, at, 1.5, Math.random());
    // Weight underneath it: a low rumble.
    playTone(audio, envelope(audio, level, at, { peak: 0.35, attack: 0.1, hold: 0.8, decay: 0.5 }), at, 1.45, 46, "sine", 38);
    // Far away, the high end is lost.
    if (far > 0.6) band.Q.value = 3;
  },

  /** Camera static: a short hiss. */
  static() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const hiss = filter(audio, envelope(audio, out(audio, { gain: 0.32 }), at, { peak: 0.6, attack: 0.005, hold: 0.1, decay: 0.06 }), "highpass", 900);
    playNoise(audio, hiss, at, 0.2, Math.random());
  },

  /** The tiny click of the report button. */
  click() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    playTone(audio, envelope(audio, out(audio, { gain: 0.3 }), at, { peak: 0.5, attack: 0.002, decay: 0.04 }), at, 0.05, 1900, "square");
  },

  /** REPORT ACCEPTED: two clean notes up. */
  accepted() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { gain: 0.32 });
    playTone(audio, envelope(audio, o, at, { peak: 0.6, attack: 0.005, decay: 0.18 }), at, 0.2, 660, "triangle");
    playTone(audio, envelope(audio, o, at + 0.09, { peak: 0.6, attack: 0.005, decay: 0.3 }), at + 0.09, 0.32, 990, "triangle");
  },

  /** No anomaly found: a low buzz. */
  denied() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = filter(audio, out(audio, { gain: 0.28 }), "lowpass", 900);
    playTone(audio, envelope(audio, o, at, { peak: 0.7, attack: 0.01, hold: 0.22, decay: 0.08 }), at, 0.32, 110, "sawtooth");
    playTone(audio, envelope(audio, o, at, { peak: 0.5, attack: 0.01, hold: 0.22, decay: 0.08 }), at, 0.32, 116, "sawtooth");
  },

  /** The statue sent home: a heavy settle, far off, from the Sculpture Hall. */
  home(pan: number) {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime + 0.15;
    const o = out(audio, { pan, gain: 0.6 });
    playTone(audio, envelope(audio, o, at, { peak: 0.8, attack: 0.01, decay: 0.6 }), at, 0.7, 70, "sine", 42);
    const thud = filter(audio, envelope(audio, o, at, { peak: 0.5, attack: 0.005, decay: 0.25 }), "lowpass", 300);
    playNoise(audio, thud, at, 0.3);
  },

  /** The manager's warning: a phone, buzzing twice. */
  warned() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { gain: 0.22 });
    for (const t of [0, 0.35]) playTone(audio, envelope(audio, o, at + t, { peak: 0.6, attack: 0.01, hold: 0.2, decay: 0.05 }), at + t, 0.26, 220, "square");
  },

  /** A door creaking somewhere (Night 4's fake blinks: there's nothing behind it). */
  creak(pan: number) {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime + 0.05;
    const o = filter(audio, out(audio, { pan, gain: 0.25 }), "bandpass", 900, 3);
    const osc = playTone(audio, envelope(audio, o, at, { peak: 0.5, attack: 0.2, hold: 0.5, decay: 0.3 }), at, 1, 95, "sawtooth");
    osc.frequency.setValueAtTime(95, at);
    for (let i = 1; i < 8; i++) osc.frequency.linearRampToValueAtTime(i % 2 ? 140 : 88, at + i * 0.12);
  },

  /** Footsteps (Night 5's misdirection): soft and heavy, from one side. */
  footsteps(pan: number) {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime + 0.05;
    const o = filter(audio, out(audio, { pan, gain: 0.55 }), "lowpass", 380);
    for (let i = 0; i < 4; i++) {
      const t = at + i * 0.48;
      playNoise(audio, envelope(audio, o, t, { peak: 0.7 - i * 0.08, attack: 0.005, decay: 0.12 }), t, 0.15, i * 0.3);
      playTone(audio, envelope(audio, o, t, { peak: 0.4, attack: 0.005, decay: 0.1 }), t, 0.12, 80, "sine", 50);
    }
  },

  /** The lights buzzing as the power dips. */
  flicker() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { gain: 0.16 });
    const buzz = playTone(audio, envelope(audio, o, at, { peak: 0.6, attack: 0.01, hold: 0.12, decay: 0.05 }), at, 0.18, 100, "sawtooth");
    buzz.frequency.setValueAtTime(100, at);
    buzz.frequency.setValueAtTime(60, at + 0.06);
    buzz.frequency.setValueAtTime(120, at + 0.11);
  },

  /** The binder's photo: a page turning. */
  photo() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = filter(audio, out(audio, { gain: 0.25 }), "bandpass", 2400, 0.8);
    playNoise(audio, envelope(audio, o, at, { peak: 0.6, attack: 0.03, decay: 0.18 }), at, 0.25, 0.7);
  },

  /** The top of an hour: one soft chime. At 6 AM, the bell. */
  hour(final = false) {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { gain: final ? 0.45 : 0.16 });
    const notes = final ? [523.25, 659.25, 783.99, 1046.5] : [392];
    notes.forEach((f, i) => {
      const t = at + i * 0.32;
      playTone(audio, envelope(audio, o, t, { peak: 0.6, attack: 0.005, decay: final ? 2.2 : 1.2 }), t, final ? 2.3 : 1.3, f, "sine");
      playTone(audio, envelope(audio, o, t, { peak: 0.15, attack: 0.005, decay: 0.8 }), t, 0.9, f * 2.76, "sine");
    });
  },

  /** One heartbeat (lub-dub). */
  heartbeat(strength: number) {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { gain: 0.25 + strength * 0.5 });
    for (const [t, peak] of [
      [0, 0.9],
      [0.16, 0.6],
    ] as const) {
      playTone(audio, envelope(audio, o, at + t, { peak, attack: 0.008, decay: 0.14 }), at + t, 0.16, 62, "sine", 38);
    }
  },

  /** The scare (only with jump scares switched on). */
  sting() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { gain: 0.8 });
    for (const f of [233, 247, 349, 466]) playTone(audio, envelope(audio, o, at, { peak: 0.5, attack: 0.005, hold: 0.4, decay: 0.9 }), at, 1.4, f, "sawtooth", f * 0.94);
    playNoise(audio, envelope(audio, filter(audio, o, "lowpass", 2400), at, { peak: 0.6, attack: 0.005, decay: 0.8 }), at, 0.9);
  },

  /** The night ends badly: a slow fall. */
  fade() {
    const audio = getAudio();
    if (!audio) return;
    const at = audio.ctx.currentTime;
    const o = filter(audio, out(audio, { gain: 0.4 }), "lowpass", 600);
    playTone(audio, envelope(audio, o, at, { peak: 0.7, attack: 0.4, hold: 1.2, decay: 2 }), at, 3.6, 110, "sawtooth", 55);
    playTone(audio, envelope(audio, o, at, { peak: 0.5, attack: 0.4, hold: 1.2, decay: 2 }), at, 3.6, 116.5, "sawtooth", 52);
  },
};

/** The museum at night: a low electrical hum and a ticking clock, under everything. */
export class Ambience {
  private nodes: { stop(): void }[] = [];
  private level: GainNode | null = null;

  start() {
    const audio = getAudio();
    if (!audio || this.level) return;
    const at = audio.ctx.currentTime;
    const level = audio.ctx.createGain();
    level.gain.setValueAtTime(0.0001, at);
    level.gain.exponentialRampToValueAtTime(0.5, at + 2);
    level.connect(audio.buses.music);
    this.level = level;
    const hum = filter(audio, level, "lowpass", 240);
    for (const [f, g] of [
      [55, 0.22],
      [110, 0.1],
      [165, 0.03],
    ] as const) {
      const gain = audio.ctx.createGain();
      gain.gain.value = g;
      gain.connect(hum);
      const osc = audio.ctx.createOscillator();
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start(at);
      this.nodes.push(osc);
    }
    const air = audio.ctx.createGain();
    air.gain.value = 0.05;
    air.connect(filter(audio, level, "lowpass", 400));
    const noise = audio.ctx.createBufferSource();
    noise.buffer = audio.noise;
    noise.loop = true;
    noise.connect(air);
    noise.start(at);
    this.nodes.push(noise);
  }

  /** A tick of the clock (the runtime calls it once a second of play). */
  tick(tock: boolean) {
    const audio = getAudio();
    if (!audio || !this.level) return;
    const at = audio.ctx.currentTime;
    const o = out(audio, { pan: -0.2, gain: 0.07 });
    playTone(audio, envelope(audio, filter(audio, o, "bandpass", tock ? 2600 : 3200, 4), at, { peak: 0.8, attack: 0.001, decay: 0.03 }), at, 0.04, tock ? 2600 : 3200, "square");
  }

  stop() {
    const audio = getAudio();
    const level = this.level;
    this.level = null;
    if (!audio || !level) {
      this.nodes = [];
      return;
    }
    const at = audio.ctx.currentTime;
    level.gain.cancelScheduledValues(at);
    level.gain.setValueAtTime(Math.max(0.0001, level.gain.value), at);
    level.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
    const nodes = this.nodes;
    this.nodes = [];
    window.setTimeout(() => {
      for (const n of nodes) {
        try {
          n.stop();
        } catch {
          // Already stopped.
        }
      }
      level.disconnect();
    }, 700);
  }
}
