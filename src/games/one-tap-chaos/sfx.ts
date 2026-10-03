// Every One Tap Chaos sound, synthesized with Web Audio (no audio files), through the arcade's
// audio engine so the sound switch and volumes apply (Plan/09-one-tap-chaos.md §9).
// Sounds can play now, or on an exact moment of the music clock (cues on a beat).
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

type Recipe = (audio: AudioEngine, t: number, out: AudioNode) => void;

function play(recipe: Recipe, volume: number, at?: number, destination?: AudioNode) {
  const audio = getAudio();
  if (!audio) return;
  const t = Math.max(audio.ctx.currentTime + 0.005, at ?? 0);
  const out = audio.ctx.createGain();
  out.gain.value = volume;
  out.connect(destination ?? audio.buses.sfx);
  recipe(audio, t, out);
  setTimeout(() => out.disconnect(), (t - audio.ctx.currentTime) * 1000 + 6000);
}

const note = (semitones: number, base = 440) => base * 2 ** (semitones / 12);

/** A short sine "voice" with vibrato, for the sheep and the baby. */
function bleat(audio: AudioEngine, out: AudioNode, t: number, pitch: number, length: number, glide: number, vowel: [number, number]) {
  const env = envelope(audio, out, t, { peak: 0.5, attack: 0.02, hold: length * 0.6, decay: length * 0.4 });
  const f1 = filter(audio, env, "bandpass", vowel[0], 5);
  const f2 = filter(audio, env, "bandpass", vowel[1], 8);
  const osc = audio.ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * glide, t + length);
  const lfo = audio.ctx.createOscillator();
  const depth = audio.ctx.createGain();
  lfo.frequency.value = 22;
  depth.gain.value = pitch * 0.05;
  lfo.connect(depth).connect(osc.frequency);
  osc.connect(f1);
  osc.connect(f2);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + length + 0.05);
  lfo.stop(t + length + 0.05);
}

/** A tone with a fast tremolo (alarm bells, mosquitoes, flies). */
function trembling(audio: AudioEngine, out: AudioNode, t: number, freq: number, length: number, rate: number, type: OscillatorType, peak: number) {
  const env = envelope(audio, out, t, { peak, attack: 0.01, hold: length - 0.06, decay: 0.05 });
  const amp = audio.ctx.createGain();
  amp.gain.value = 0.5;
  amp.connect(env);
  const lfo = audio.ctx.createOscillator();
  const depth = audio.ctx.createGain();
  lfo.frequency.value = rate;
  depth.gain.value = 0.5;
  lfo.connect(depth).connect(amp.gain);
  const osc = audio.ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(amp);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + length + 0.05);
  lfo.stop(t + length + 0.05);
}

const RECIPES = {
  /** Every tap gets a tiny click, so you always know it registered. */
  tap: [(a, t, o) => playTone(a, envelope(a, o, t, { peak: 0.25, attack: 0.001, decay: 0.03 }), t, 0.04, 2400, "triangle"), 0.5],
  boing: [
    (a, t, o) => {
      const osc = playTone(a, envelope(a, o, t, { peak: 0.5, attack: 0.005, decay: 0.32 }), t, 0.34, 180, "sine", 620);
      const lfo = a.ctx.createOscillator();
      const depth = a.ctx.createGain();
      lfo.frequency.value = 18;
      depth.gain.value = 30;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + 0.4);
    },
    1,
  ],
  plop: [
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.6, attack: 0.002, decay: 0.16 }), t, 0.18, 720, "sine", 210);
    },
    1,
  ],
  tick: [
    (a, t, o) => {
      for (const d of [0, 0.12]) {
        playTone(a, filter(a, envelope(a, o, t + d, { peak: 0.4, attack: 0.001, decay: 0.03 }), "highpass", 900), t + d, 0.05, 1800, "square");
      }
    },
    0.7,
  ],
  clunk: [
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.7, attack: 0.002, decay: 0.18 }), t, 0.2, 160, "triangle", 70);
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.4, attack: 0.001, decay: 0.05 }), "bandpass", 2500, 2), t, 0.08);
    },
    1,
  ],
  buzz: [(a, t, o) => trembling(a, filter(a, o, "lowpass", 1800), t, 190, 0.7, 45, "sawtooth", 0.32), 0.9],
  slap: [
    (a, t, o) => {
      playNoise(a, filter(a, envelope(a, o, t, { peak: 1, attack: 0.001, decay: 0.09 }), "highpass", 900), t, 0.12);
      playTone(a, envelope(a, o, t, { peak: 0.6, attack: 0.001, decay: 0.12 }), t, 0.14, 210, "sine", 90);
    },
    0.7,
  ],
  pew: [(a, t, o) => playTone(a, envelope(a, o, t, { peak: 0.35, attack: 0.002, decay: 0.2 }), t, 0.22, 1500, "square", 260), 0.8],
  ding: [
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.4, attack: 0.003, decay: 0.8 }), t, 0.9, 1568);
      playTone(a, envelope(a, o, t, { peak: 0.1, attack: 0.003, decay: 0.4 }), t, 0.5, 1568 * 2.76);
    },
    0.9,
  ],
  pump: [
    (a, t, o) => {
      const bp = filter(a, envelope(a, o, t, { peak: 0.5, attack: 0.01, decay: 0.15 }), "bandpass", 500, 3);
      bp.frequency.exponentialRampToValueAtTime(1600, t + 0.15);
      playNoise(a, bp, t, 0.18);
      playTone(a, envelope(a, o, t, { peak: 0.12, attack: 0.01, decay: 0.12 }), t, 0.14, 330, "triangle", 520);
    },
    1.8,
  ],
  pop: [
    (a, t, o) => {
      playNoise(a, envelope(a, o, t, { peak: 1, attack: 0.001, decay: 0.12 }), t, 0.15);
      playTone(a, envelope(a, o, t, { peak: 0.5, attack: 0.001, decay: 0.08 }), t, 0.1, 900, "sine", 120);
    },
    0.8,
  ],
  sizzle: [
    (a, t, o) => {
      const hp = filter(a, envelope(a, o, t, { peak: 0.35, attack: 0.05, hold: 0.4, decay: 0.3 }), "highpass", 3500);
      playNoise(a, hp, t, 0.8);
    },
    0.9,
  ],
  flip: [
    (a, t, o) => {
      const bp = filter(a, envelope(a, o, t, { peak: 0.5, attack: 0.03, decay: 0.2 }), "bandpass", 400, 2);
      bp.frequency.exponentialRampToValueAtTime(2400, t + 0.22);
      playNoise(a, bp, t, 0.26);
    },
    2.2,
  ],
  beep: [
    (a, t, o) => {
      for (const d of [0, 0.18]) playTone(a, envelope(a, o, t + d, { peak: 0.25, attack: 0.003, hold: 0.08, decay: 0.03 }), t + d, 0.12, 988, "square");
    },
    0.9,
  ],
  go: [
    (a, t, o) => {
      for (const [f, d] of [
        [784, 0],
        [1047, 0.07],
      ] as const) {
        playTone(a, envelope(a, o, t + d, { peak: 0.3, attack: 0.003, decay: 0.35 }), t + d, 0.4, f, "triangle");
      }
    },
    1,
  ],
  baa: [(a, t, o) => bleat(a, o, t, 330, 0.45, 0.85, [700, 1200]), 1],
  honk: [
    (a, t, o) => {
      const lp = filter(a, envelope(a, o, t, { peak: 0.3, attack: 0.01, hold: 0.18, decay: 0.05 }), "lowpass", 1800);
      playTone(a, lp, t, 0.25, 392, "sawtooth");
      playTone(a, lp, t, 0.25, 494, "sawtooth");
    },
    1,
  ],
  whoosh: [
    (a, t, o) => {
      const bp = filter(a, envelope(a, o, t, { peak: 0.45, attack: 0.06, decay: 0.2 }), "bandpass", 300, 1.5);
      bp.frequency.exponentialRampToValueAtTime(1800, t + 0.25);
      playNoise(a, bp, t, 0.3);
    },
    2.2,
  ],
  drum: [
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.9, attack: 0.002, decay: 0.3 }), t, 0.32, 150, "sine", 70);
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.3, attack: 0.001, decay: 0.06 }), "bandpass", 1200), t, 0.08);
    },
    0.9,
  ],
  sticks: [(a, t, o) => playTone(a, envelope(a, o, t, { peak: 0.45, attack: 0.001, decay: 0.05 }), t, 0.06, 2100, "triangle"), 0.9],
  snip: [
    (a, t, o) => {
      for (const d of [0, 0.06]) playNoise(a, filter(a, envelope(a, o, t + d, { peak: 0.6, attack: 0.001, decay: 0.03 }), "highpass", 4000), t + d, 0.05);
    },
    1,
  ],
  shutter: [
    (a, t, o) => {
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.7, attack: 0.001, decay: 0.04 }), "bandpass", 3000, 1.5), t, 0.05);
      playNoise(a, filter(a, envelope(a, o, t + 0.07, { peak: 0.5, attack: 0.001, decay: 0.05 }), "bandpass", 2200, 1.5), t + 0.07, 0.06);
    },
    1,
  ],
  whistle: [(a, t, o) => trembling(a, o, t, 2700, 0.42, 28, "sine", 0.22), 1.2],
  kick: [
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.8, attack: 0.001, decay: 0.15 }), t, 0.16, 120, "sine", 60);
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.5, attack: 0.001, decay: 0.04 }), "lowpass", 1500), t, 0.05);
    },
    1.0,
  ],
  cheer: [
    (a, t, o) => {
      const bp = filter(a, envelope(a, o, t, { peak: 0.4, attack: 0.15, hold: 0.5, decay: 0.6 }), "bandpass", 1300, 0.7);
      playNoise(a, bp, t, 1.3);
    },
    1,
  ],
  clap: [
    (a, t, o) => {
      for (const d of [0, 0.012, 0.024]) {
        playNoise(a, filter(a, envelope(a, o, t + d, { peak: 0.7, attack: 0.001, decay: 0.05 }), "bandpass", 1300, 1.2), t + d, 0.07);
      }
    },
    1.3,
  ],
  lullaby: [
    (a, t, o) => {
      [76, 79, 84].forEach((m, i) => {
        const at = t + i * 0.16;
        playTone(a, envelope(a, o, at, { peak: 0.25, attack: 0.003, decay: 0.5 }), at, 0.55, note(m - 69));
      });
    },
    1.1,
  ],
  ring: [(a, t, o) => trembling(a, filter(a, o, "highpass", 600), t, 1480, 0.9, 24, "square", 0.16), 0.9],
  cry: [(a, t, o) => bleat(a, o, t, 520, 0.6, 0.7, [850, 1600]), 0.9],
  chime: [
    (a, t, o) => {
      for (const [f, d] of [
        [1319, 0],
        [1976, 0.1],
      ] as const) {
        playTone(a, envelope(a, o, t + d, { peak: 0.3, attack: 0.003, decay: 0.6 }), t + d, 0.65, f);
      }
    },
    0.8,
  ],
  thunk: [
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.8, attack: 0.002, decay: 0.2 }), t, 0.22, 110, "triangle", 60);
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.3, attack: 0.001, decay: 0.05 }), "lowpass", 900), t, 0.06);
    },
    1.0,
  ],
  thrust: [
    (a, t, o) => {
      const lp = filter(a, envelope(a, o, t, { peak: 0.7, attack: 0.02, decay: 0.3 }), "lowpass", 900);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.3);
      playNoise(a, lp, t, 0.34);
    },
    1.3,
  ],
  crash: [
    (a, t, o) => {
      const lp = filter(a, envelope(a, o, t, { peak: 1, attack: 0.003, decay: 0.7 }), "lowpass", 2500);
      lp.frequency.exponentialRampToValueAtTime(150, t + 0.6);
      playNoise(a, lp, t, 0.75);
      playTone(a, envelope(a, o, t, { peak: 0.7, attack: 0.003, decay: 0.5 }), t, 0.55, 80, "sine", 30);
    },
    0.8,
  ],
  tiptoe: [
    (a, t, o) => {
      for (const [f, d] of [
        [660, 0],
        [880, 0.14],
      ] as const) {
        playTone(a, envelope(a, o, t + d, { peak: 0.3, attack: 0.002, decay: 0.08 }), t + d, 0.1, f, "triangle");
      }
    },
    1,
  ],
  alert: [(a, t, o) => playTone(a, envelope(a, o, t, { peak: 0.3, attack: 0.002, decay: 0.16 }), t, 0.18, 620, "square", 1450), 0.8],
  whine: [(a, t, o) => trembling(a, o, t, 880, 0.6, 9, "sine", 0.2), 0.9],
  swat: [
    (a, t, o) => {
      const bp = filter(a, envelope(a, o, t, { peak: 0.5, attack: 0.02, decay: 0.06 }), "bandpass", 1200, 1);
      playNoise(a, bp, t, 0.08);
      playNoise(a, filter(a, envelope(a, o, t + 0.07, { peak: 1, attack: 0.001, decay: 0.08 }), "highpass", 800), t + 0.07, 0.1);
    },
    0.75,
  ],
  blip: [
    (a, t, o) => {
      for (const [f, d] of [
        [523, 0],
        [784, 0.09],
      ] as const) {
        playTone(a, envelope(a, o, t + d, { peak: 0.3, attack: 0.002, decay: 0.09 }), t + d, 0.1, f, "sine");
      }
    },
    0.9,
  ],
  gotcha: [
    (a, t, o) => {
      playTone(a, filter(a, envelope(a, o, t, { peak: 0.4, attack: 0.01, hold: 0.25, decay: 0.2 }), "lowpass", 1400), t, 0.5, 440, "sawtooth", 180);
    },
    0.9,
  ],
  mystery: [
    (a, t, o) => {
      [0, 3, 6, 11].forEach((s, i) => {
        const at = t + i * 0.09;
        playTone(a, envelope(a, o, at, { peak: 0.22, attack: 0.003, decay: 0.25 }), at, 0.3, note(s, 523), "triangle");
      });
    },
    1.2,
  ],
  gong: [
    (a, t, o) => {
      for (const [f, p] of [
        [98, 0.6],
        [147, 0.3],
        [196 * 1.07, 0.22],
        [311, 0.12],
      ] as const) {
        playTone(a, envelope(a, o, t, { peak: p, attack: 0.01, decay: 2.2 }), t, 2.3, f, "sine");
      }
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.3, attack: 0.002, decay: 0.3 }), "lowpass", 1200), t, 0.4);
    },
    0.7,
  ],
  baton: [
    (a, t, o) => {
      for (const d of [0, 0.1]) playTone(a, envelope(a, o, t + d, { peak: 0.5, attack: 0.001, decay: 0.04 }), t + d, 0.05, 1700, "triangle");
    },
    0.9,
  ],
  sleaze: [
    (a, t, o) => {
      const lp = filter(a, envelope(a, o, t, { peak: 0.35, attack: 0.02, hold: 0.3, decay: 0.2 }), "lowpass", 500, 6);
      lp.frequency.setValueAtTime(500, t);
      lp.frequency.linearRampToValueAtTime(2200, t + 0.18);
      lp.frequency.linearRampToValueAtTime(600, t + 0.45);
      playTone(a, lp, t, 0.5, 233, "sawtooth", 220);
    },
    1,
  ],
  tock: [(a, t, o) => playTone(a, envelope(a, o, t, { peak: 0.35, attack: 0.001, decay: 0.06 }), t, 0.08, 1200, "sine"), 0.8],
  now: [
    (a, t, o) => {
      for (const f of [523, 659, 784, 1047]) playTone(a, envelope(a, o, t, { peak: 0.2, attack: 0.005, decay: 0.5 }), t, 0.55, f, "triangle");
    },
    1,
  ],

  // ----- The show around the microgames -----
  fail: [
    (a, t, o) => {
      // A comedic record scratch: a bent tone and a sweeping hiss.
      const bp = filter(a, envelope(a, o, t, { peak: 0.6, attack: 0.005, decay: 0.32 }), "bandpass", 3000, 2);
      bp.frequency.setValueAtTime(3200, t);
      bp.frequency.exponentialRampToValueAtTime(500, t + 0.12);
      bp.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
      playNoise(a, bp, t, 0.34);
      const osc = playTone(a, envelope(a, o, t, { peak: 0.25, attack: 0.005, decay: 0.3 }), t, 0.32, 330, "sawtooth");
      osc.frequency.linearRampToValueAtTime(110, t + 0.12);
      osc.frequency.linearRampToValueAtTime(380, t + 0.3);
    },
    1.1,
  ],
  smash: [
    (a, t, o) => {
      playNoise(a, filter(a, envelope(a, o, t, { peak: 0.8, attack: 0.001, decay: 0.25 }), "highpass", 2500), t, 0.3);
      [3520, 4186, 2960, 3729].forEach((f, i) => {
        const at = t + 0.03 + i * 0.045;
        playTone(a, envelope(a, o, at, { peak: 0.12, attack: 0.001, decay: 0.12 }), at, 0.14, f, "sine");
      });
    },
    0.8,
  ],
  card: [
    (a, t, o) => {
      const bp = filter(a, envelope(a, o, t, { peak: 0.4, attack: 0.02, decay: 0.12 }), "bandpass", 900, 2);
      playNoise(a, bp, t, 0.15);
      [0, 4, 7, 12].forEach((s, i) => {
        const at = t + 0.12 + i * 0.08;
        playTone(a, envelope(a, o, at, { peak: 0.22, attack: 0.004, decay: i === 3 ? 0.7 : 0.18 }), at, i === 3 ? 0.75 : 0.2, note(s, 523), "square");
      });
    },
    1.2,
  ],
  speedup: [
    (a, t, o) => {
      const lp = filter(a, envelope(a, o, t, { peak: 0.3, attack: 0.5, decay: 0.08 }), "lowpass", 800, 4);
      lp.frequency.exponentialRampToValueAtTime(5000, t + 0.55);
      playTone(a, lp, t, 0.6, 110, "sawtooth", 880);
    },
    0.8,
  ],
  gameover: [
    (a, t, o) => {
      // Wah, wah, wah, waaah.
      const steps: Array<[number, number, number]> = [
        [196, 0, 0.3],
        [185, 0.36, 0.3],
        [175, 0.72, 0.3],
        [165, 1.08, 1.0],
      ];
      for (const [f, d, len] of steps) {
        const lp = filter(a, envelope(a, o, t + d, { peak: 0.4, attack: 0.03, hold: len * 0.6, decay: len * 0.4 }), "lowpass", 900, 3);
        const osc = playTone(a, lp, t + d, len, f, "sawtooth");
        if (len > 0.5) {
          const lfo = a.ctx.createOscillator();
          const depth = a.ctx.createGain();
          lfo.frequency.value = 5;
          depth.gain.value = 6;
          lfo.connect(depth).connect(osc.frequency);
          lfo.start(t + d);
          lfo.stop(t + d + len);
        }
      }
    },
    1,
  ],
  unlock: [
    (a, t, o) => {
      [12, 16, 19, 24, 28].forEach((s, i) => {
        const at = t + i * 0.06;
        playTone(a, envelope(a, o, at, { peak: 0.16, attack: 0.002, decay: 0.3 }), at, 0.32, note(s, 523));
      });
    },
    1.2,
  ],
} satisfies Record<string, [Recipe, number]>;

export type SfxName = keyof typeof RECIPES;

/**
 * Play a named sound now, or at `at` (AudioContext time). Scheduled sounds can go through
 * `destination` (a gain the game can cut, so pausing silences what was already queued).
 */
export function playSfx(name: SfxName, at?: number, destination?: AudioNode) {
  const [recipe, volume] = RECIPES[name];
  play(recipe, volume, at, destination);
}

/** The success jingle climbs with your streak (Plan §9). */
export function playWin(streak: number, at?: number, destination?: AudioNode) {
  const lift = Math.min(12, streak);
  play(
    (a, t, o) => {
      [0, 4, 7].forEach((s, i) => {
        const when = t + i * 0.055;
        playTone(a, envelope(a, o, when, { peak: 0.26, attack: 0.003, decay: i === 2 ? 0.45 : 0.12 }), when, i === 2 ? 0.5 : 0.14, note(s + lift, 659), "triangle");
      });
    },
    0.9,
    at,
    destination,
  );
}

/** Count-in ticks: 3, 2, 1… and a higher one for GO. */
export function playCount(last: boolean, at?: number, destination?: AudioNode) {
  play(
    (a, t, o) => {
      playTone(a, envelope(a, o, t, { peak: 0.3, attack: 0.002, decay: last ? 0.4 : 0.1 }), t, last ? 0.45 : 0.12, last ? 1318 : 880, last ? "triangle" : "sine");
    },
    0.8,
    at,
    destination,
  );
}

/**
 * Development: render a sound into an offline context and report its peak and loudness, so a
 * script can check every sound actually makes sound (and none is shockingly louder than the rest).
 */
export async function measureSfx(name: SfxName | "win" | "count") {
  const ctx = new OfflineAudioContext(1, 44100 * 2.5, 44100);
  const master = ctx.createGain();
  master.connect(ctx.destination);
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  music.connect(master);
  sfx.connect(master);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let seed = 22222;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data[i] = seed / 0x3fffffff - 1;
  }
  const engine = { ctx: ctx as unknown as AudioContext, master, buses: { music, sfx }, noise } as AudioEngine;
  const out = ctx.createGain();
  out.connect(sfx);
  if (name === "win") {
    [0, 4, 7].forEach((st, i) => playTone(engine, envelope(engine, out, 0.01 + i * 0.055, { peak: 0.26, attack: 0.003, decay: 0.2 }), 0.01 + i * 0.055, 0.2, note(st, 659), "triangle"));
  } else if (name !== "count") {
    const [recipe, volume] = RECIPES[name];
    out.gain.value = volume;
    recipe(engine, 0.01, out);
  }
  const rendered = await ctx.startRendering();
  const samples = rendered.getChannelData(0);
  let peak = 0;
  let sum = 0;
  let nan = false;
  for (const v of samples) {
    if (Number.isNaN(v)) nan = true;
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  return { name, peak: Math.round(peak * 1000) / 1000, rms: Math.round(Math.sqrt(sum / samples.length) * 10000) / 10000, nan };
}

/** Every sound's name (development checks). */
export const SFX_NAMES = Object.keys(RECIPES) as SfxName[];

/** Development: render one beat of the music offline (peak and loudness), to balance it against the cues. */
export async function measureMusic(part: import("./music").MusicPart, tier: number) {
  const { playBeat } = await import("./music");
  const ctx = new OfflineAudioContext(1, 44100 * 1.2, 44100);
  const music = ctx.createGain();
  music.connect(ctx.destination);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 12.9898) * 43758.5453 % 1;
  const engine = { ctx: ctx as unknown as AudioContext, master: music, buses: { music, sfx: music }, noise } as AudioEngine;
  for (let beat = 0; beat < 2; beat++) playBeat(engine, music, 0.01 + beat * 0.5, 0.5, part, tier, beat, 8);
  const samples = (await ctx.startRendering()).getChannelData(0);
  let peak = 0;
  let sum = 0;
  for (const v of samples) {
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  return { part, tier, peak: Math.round(peak * 1000) / 1000, rms: Math.round(Math.sqrt(sum / samples.length) * 10000) / 10000 };
}
