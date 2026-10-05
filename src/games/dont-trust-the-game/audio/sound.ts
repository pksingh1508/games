// Super Happy Jump!'s sounds (Plan/04-dont-trust-the-game.md §9 "Audio"): bouncy synthesized effects, HELPER's
// chirpy babble (slightly off-key when it lies), and a cheerful chiptune jingle that detunes a little more every
// chapter, goes silent when the game "crashes", and comes back slow and sweet for the credits.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";
import { babble } from "../core/helper";

export type Sfx =
  | "jump"
  | "land"
  | "coin"
  | "die"
  | "paper"
  | "push"
  | "door"
  | "cardboard"
  | "click"
  | "bonk"
  | "portal"
  | "lever"
  | "loaded"
  | "tone"
  | "beep"
  | "key"
  | "sticker"
  | "buzz"
  | "tap"
  | "flip"
  | "secret";

type Synth = (a: AudioEngine, out: AudioNode, t: number) => void;

const SYNTHS: Record<Sfx, Synth> = {
  jump: (a, o, t) => playTone(a, envelope(a, o, t, { peak: 0.18, attack: 0.005, decay: 0.16 }), t, 0.16, 330, "square", 660),
  land: (a, o, t) => playNoise(a, envelope(a, filter(a, o, "lowpass", 700), t, { peak: 0.2, attack: 0.002, decay: 0.07 }), t, 0.08),
  coin: (a, o, t) => {
    playTone(a, envelope(a, o, t, { peak: 0.14, attack: 0.003, decay: 0.08 }), t, 0.08, 988, "square");
    playTone(a, envelope(a, o, t + 0.07, { peak: 0.14, attack: 0.003, decay: 0.22 }), t + 0.07, 0.22, 1319, "square");
  },
  die: (a, o, t) => {
    playTone(a, envelope(a, o, t, { peak: 0.2, attack: 0.004, decay: 0.32 }), t, 0.32, 520, "square", 90);
    playNoise(a, envelope(a, filter(a, o, "bandpass", 1600, 1.2), t, { peak: 0.14, attack: 0.002, decay: 0.12 }), t, 0.14);
  },
  paper: (a, o, t) => {
    for (let k = 0; k < 4; k++) playNoise(a, envelope(a, filter(a, o, "highpass", 3000 + k * 400), t + k * 0.035, { peak: 0.12, attack: 0.002, decay: 0.03 }), t + k * 0.035, 0.04, k * 0.13);
  },
  push: (a, o, t) => playNoise(a, envelope(a, filter(a, o, "lowpass", 400), t, { peak: 0.08, attack: 0.01, decay: 0.08 }), t, 0.1),
  door: (a, o, t) => {
    [523, 659, 784, 1047].forEach((f, i) => playTone(a, envelope(a, o, t + i * 0.07, { peak: 0.13, attack: 0.004, decay: 0.24 }), t + i * 0.07, 0.24, f, "triangle"));
  },
  cardboard: (a, o, t) => {
    playNoise(a, envelope(a, filter(a, o, "lowpass", 500), t, { peak: 0.3, attack: 0.003, decay: 0.18 }), t, 0.2);
    playTone(a, envelope(a, o, t, { peak: 0.12, attack: 0.003, decay: 0.12 }), t, 0.12, 110, "triangle");
  },
  click: (a, o, t) => playTone(a, envelope(a, o, t, { peak: 0.1, attack: 0.002, decay: 0.05 }), t, 0.05, 1500, "square"),
  bonk: (a, o, t) => playTone(a, envelope(a, o, t, { peak: 0.16, attack: 0.003, decay: 0.1 }), t, 0.1, 180, "square", 120),
  portal: (a, o, t) => {
    playTone(a, envelope(a, o, t, { peak: 0.15, attack: 0.05, decay: 0.6 }), t, 0.65, 220, "sine", 1760);
    playNoise(a, envelope(a, filter(a, o, "bandpass", 2400, 3), t, { peak: 0.06, attack: 0.1, decay: 0.5 }), t, 0.6);
  },
  lever: (a, o, t) => {
    playTone(a, envelope(a, o, t, { peak: 0.14, attack: 0.002, decay: 0.05 }), t, 0.05, 700, "square");
    playTone(a, envelope(a, o, t + 0.06, { peak: 0.14, attack: 0.002, decay: 0.08 }), t + 0.06, 0.08, 420, "square");
  },
  loaded: (a, o, t) => {
    [392, 523, 659, 784, 1047].forEach((f, i) => playTone(a, envelope(a, o, t + i * 0.09, { peak: 0.13, attack: 0.004, decay: 0.3 }), t + i * 0.09, 0.3, f, "square"));
  },
  // The crash: a single flat tone after the silence.
  tone: (a, o, t) => playTone(a, envelope(a, o, t, { peak: 0.16, attack: 0.01, hold: 1.2, decay: 0.4 }), t, 1.7, 440, "sine"),
  beep: (a, o, t) => playTone(a, envelope(a, o, t, { peak: 0.08, attack: 0.002, decay: 0.06 }), t, 0.06, 880, "square"),
  key: (a, o, t) => playNoise(a, envelope(a, filter(a, o, "highpass", 2500), t, { peak: 0.06, attack: 0.001, decay: 0.025 }), t, 0.03),
  sticker: (a, o, t) => {
    [1319, 1568, 2093].forEach((f, i) => playTone(a, envelope(a, o, t + i * 0.05, { peak: 0.09, attack: 0.002, decay: 0.16 }), t + i * 0.05, 0.16, f, "sine"));
  },
  buzz: (a, o, t) => playTone(a, envelope(a, filter(a, o, "lowpass", 900), t, { peak: 0.16, attack: 0.005, decay: 0.22 }), t, 0.22, 110, "sawtooth"),
  tap: (a, o, t) => playNoise(a, envelope(a, filter(a, o, "bandpass", 900, 2), t, { peak: 0.22, attack: 0.002, decay: 0.05 }), t, 0.06),
  flip: (a, o, t) => playNoise(a, envelope(a, filter(a, o, "bandpass", 1200, 1), t, { peak: 0.12, attack: 0.02, decay: 0.18 }), t, 0.22),
  secret: (a, o, t) => {
    [784, 988, 1175, 1568].forEach((f, i) => playTone(a, envelope(a, o, t + i * 0.08, { peak: 0.1, attack: 0.003, decay: 0.3 }), t + i * 0.08, 0.3, f, "triangle"));
  },
};

export function playSfx(name: Sfx, volume = 1) {
  const a = getAudio();
  if (!a) return;
  const out = a.ctx.createGain();
  out.gain.value = volume;
  out.connect(a.buses.sfx);
  SYNTHS[name](a, out, a.ctx.currentTime + 0.005);
}

/** HELPER's voice for a line: chirps, a little off-key when it lies. */
export function helperVoice(text: string, lie: boolean) {
  const a = getAudio();
  if (!a) return;
  const t0 = a.ctx.currentTime + 0.01;
  for (const n of babble(text, lie).slice(0, 18)) {
    playTone(a, envelope(a, a.buses.sfx, t0 + n.at, { peak: 0.05, attack: 0.004, decay: 0.05 }), t0 + n.at, 0.06, n.hz, "square");
  }
}

/** The volume puzzle's whisper, as taps for each number (the words themselves are whispered by a voice, if any). */
export function whisperTaps(digits: readonly number[], volume: number) {
  const a = getAudio();
  if (!a) return;
  const out = a.ctx.createGain();
  out.gain.value = volume;
  out.connect(a.buses.sfx);
  let t = a.ctx.currentTime + 0.1;
  for (const d of digits) {
    for (let k = 0; k < d; k++) {
      playNoise(a, envelope(a, filter(a, out, "bandpass", 1800, 4), t, { peak: 0.12, attack: 0.004, decay: 0.08 }), t, 0.1);
      t += 0.16;
    }
    t += 0.55;
  }
}

// -- Music --------------------------------------------------------------------------------------------------

/** "Super Happy Jump!": eight bars in C major. Notes are [beat, length in beats, midi]. */
const MELODY: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0.5, 72], [0.5, 0.5, 76], [1, 0.5, 79], [1.5, 0.5, 76], [2, 1, 84], [3, 1, 79],
  [4, 0.5, 77], [4.5, 0.5, 81], [5, 0.5, 84], [5.5, 0.5, 81], [6, 1, 86], [7, 1, 84],
  [8, 0.5, 76], [8.5, 0.5, 79], [9, 0.5, 84], [9.5, 0.5, 79], [10, 1, 88], [11, 1, 84],
  [12, 0.5, 86], [12.5, 0.5, 84], [13, 0.5, 81], [13.5, 0.5, 79], [14, 2, 84],
];
const BASS: ReadonlyArray<readonly [number, number]> = [
  [0, 48], [2, 55], [4, 53], [6, 50], [8, 52], [10, 57], [12, 50], [14, 48],
];
const BARS = 16;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export type Mood = "happy" | "uneasy" | "broken" | "void" | "credits" | "off";

const MOODS: Record<Exclude<Mood, "off">, { bpm: number; detune: number; wobble: number; lead: OscillatorType; gain: number }> = {
  happy: { bpm: 138, detune: 0, wobble: 0, lead: "square", gain: 0.05 },
  uneasy: { bpm: 132, detune: -14, wobble: 6, lead: "square", gain: 0.045 },
  broken: { bpm: 124, detune: -32, wobble: 18, lead: "sawtooth", gain: 0.035 },
  void: { bpm: 96, detune: -60, wobble: 30, lead: "triangle", gain: 0.04 },
  credits: { bpm: 72, detune: 0, wobble: 0, lead: "triangle", gain: 0.06 },
};

class Music {
  private timer: ReturnType<typeof setInterval> | null = null;
  private mood: Mood = "off";
  private nextBeat = 0;
  private startAt = 0;

  play(mood: Mood) {
    if (mood === this.mood) return;
    this.stop();
    this.mood = mood;
    if (mood === "off") return;
    const a = getAudio();
    if (!a) return;
    this.startAt = a.ctx.currentTime + 0.1;
    this.nextBeat = 0;
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.mood = "off";
  }

  private schedule() {
    const a = getAudio();
    if (!a || this.mood === "off") return;
    const m = MOODS[this.mood];
    const beat = 60 / m.bpm;
    const until = a.ctx.currentTime + 0.35;
    for (;;) {
      const at = this.startAt + this.nextBeat * beat;
      if (at > until) break;
      const inBar = this.nextBeat % BARS;
      for (const [b, len, midi] of MELODY) {
        if (b !== inBar) continue;
        const wobble = m.wobble ? Math.sin(this.nextBeat * 12.9898 + midi) * m.wobble : 0;
        const f = hz(midi) * 2 ** ((m.detune + wobble) / 1200);
        playTone(a, envelope(a, a.buses.music, at, { peak: m.gain, attack: 0.005, hold: len * beat * 0.5, decay: len * beat * 0.4 }), at, len * beat, f, m.lead);
      }
      for (const [b, midi] of BASS) {
        if (b !== inBar) continue;
        playTone(a, envelope(a, a.buses.music, at, { peak: m.gain * 1.4, attack: 0.005, hold: beat * 1.2, decay: beat * 0.6 }), at, beat * 2, hz(midi) * 2 ** (m.detune / 1200), "triangle");
      }
      this.nextBeat += 0.5;
    }
  }
}

export const music = new Music();
