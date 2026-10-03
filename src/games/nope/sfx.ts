// Every NOPE! sound, synthesized with Web Audio (no audio files to download). The audience
// (laughs, applause, groans) follows the game's laugh-track switch. All of it respects the
// global sound switch and volumes through engine/audio.
import { createRng, type Rng } from "@/engine/rng";
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";
import { nopeSave } from "./save";

type Recipe = (audio: AudioEngine, t: number, out: AudioNode, rng: Rng) => void;

let calls = 0;

function play(recipe: Recipe, volume = 1, { audience = false }: { audience?: boolean } = {}) {
  if (audience && !nopeSave.get().prefs.laughTrack) return;
  const audio = getAudio();
  if (!audio) return;
  const out = audio.ctx.createGain();
  out.gain.value = volume;
  out.connect(audio.buses.sfx);
  recipe(audio, audio.ctx.currentTime + 0.01, out, createRng(`sfx:${calls++}`));
  setTimeout(() => out.disconnect(), 8000);
}

// Vowel formants (F1, F2) for Mr. Nope's babble and the audience.
const VOWELS: Array<[number, number]> = [
  [800, 1150], // a
  [500, 1750], // e
  [330, 2050], // i
  [480, 820], // o
  [340, 700], // u
];

function voice(
  audio: AudioEngine,
  out: AudioNode,
  at: number,
  { pitch, glide = 1, vowel, length, peak }: { pitch: number; glide?: number; vowel: [number, number]; length: number; peak: number },
) {
  const env = envelope(audio, out, at, { peak, attack: 0.012, hold: length * 0.45, decay: length * 0.55 });
  const f1 = filter(audio, env, "bandpass", vowel[0], 6);
  const f2 = filter(audio, env, "bandpass", vowel[1], 9);
  const osc = audio.ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(pitch, at);
  osc.frequency.exponentialRampToValueAtTime(pitch * glide, at + length);
  osc.connect(f1);
  osc.connect(f2);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

export const sfx = {
  /** The stamp: a heavy rubber THUNK. */
  thunk() {
    play((audio, t, out) => {
      playTone(audio, envelope(audio, out, t, { peak: 0.95, attack: 0.004, decay: 0.38 }), t, 0.4, 150, "sine", 46);
      playTone(audio, envelope(audio, out, t, { peak: 0.3, attack: 0.002, decay: 0.08 }), t, 0.1, 320, "triangle", 110);
      playNoise(audio, filter(audio, envelope(audio, out, t, { peak: 0.55, attack: 0.002, decay: 0.13 }), "lowpass", 1100), t, 0.2);
    }, 1.7);
  },

  /** Correct: a game-show "ding-ding". */
  ding() {
    play((audio, t, out) => {
      const dings: Array<[number, number]> = [
        [1318.5, 0],
        [1760, 0.13],
      ];
      for (const [freq, delay] of dings) {
        const at = t + delay;
        playTone(audio, envelope(audio, out, at, { peak: 0.3, attack: 0.004, decay: 0.9 }), at, 1, freq);
        playTone(audio, envelope(audio, out, at, { peak: 0.07, attack: 0.004, decay: 0.5 }), at, 0.6, freq * 2.76);
      }
    });
  },

  /** A red fuse ran out. */
  boom() {
    play((audio, t, out) => {
      const low = filter(audio, envelope(audio, out, t, { peak: 1, attack: 0.005, decay: 1.1 }), "lowpass", 2800);
      low.frequency.exponentialRampToValueAtTime(110, t + 0.9);
      playNoise(audio, low, t, 1.2);
      playTone(audio, envelope(audio, out, t, { peak: 0.8, attack: 0.005, decay: 0.7 }), t, 0.8, 70, "sine", 28);
    });
  },

  /** One second of fuse. Kind (green) fuses tock softly. */
  tick(kind: "red" | "green" = "red", urgent = false) {
    play((audio, t, out) => {
      if (kind === "green") {
        playTone(audio, envelope(audio, out, t, { peak: 0.12, attack: 0.002, decay: 0.07 }), t, 0.1, 880, "sine");
        return;
      }
      const hp = filter(audio, envelope(audio, out, t, { peak: urgent ? 0.22 : 0.14, attack: 0.001, decay: 0.03 }), "highpass", 1200);
      playTone(audio, hp, t, 0.04, urgent ? 2400 : 1900, "square");
    });
  },

  /** Mr. Nope talks: gibberish syllables that follow the text. */
  babble(text: string, { wink = false }: { wink?: boolean } = {}) {
    const letters = text.replace(/[^a-z]/gi, "");
    if (!letters) return;
    play((audio, t, out) => {
      const syllables = Math.min(12, Math.max(2, Math.ceil(letters.length / 3)));
      const question = text.trim().endsWith("?");
      const base = wink ? 175 : 150;
      for (let i = 0; i < syllables; i++) {
        const ch = letters.charCodeAt((i * 3) % letters.length);
        const at = t + i * 0.085;
        const last = i === syllables - 1;
        const contour = last ? (question ? 1.25 : 0.82) : 1 + ((ch % 7) - 3) * 0.035;
        voice(audio, out, at, {
          pitch: base * contour,
          glide: last ? (question ? 1.15 : 0.85) : 0.97,
          vowel: VOWELS[ch % VOWELS.length] ?? [800, 1150],
          length: 0.07,
          peak: 0.5,
        });
      }
    }, 0.7);
  },

  /** The audience laughs (laugh track). */
  laugh() {
    play(
      (audio, t, out, rng) => {
        const air = filter(audio, out, "lowpass", 3200);
        for (let v = 0; v < 8; v++) {
          const start = t + rng() * 0.3;
          const pitch = 170 + rng() * 170;
          const has = 3 + Math.floor(rng() * 4);
          const rate = 0.13 + rng() * 0.05;
          for (let h = 0; h < has; h++) {
            const at = start + h * rate;
            const fade = 1 - h / (has + 1);
            voice(audio, air, at, {
              pitch: pitch * (1 - h * 0.03),
              glide: 0.92,
              vowel: rng() > 0.3 ? [760, 1200] : [520, 1650],
              length: 0.085,
              peak: 0.18 * fade,
            });
            playNoise(audio, filter(audio, envelope(audio, air, at, { peak: 0.05 * fade, attack: 0.01, decay: 0.08 }), "bandpass", 1300, 1.2), at, 0.1, rng());
          }
        }
      }, 0.95, { audience: true });
  },

  /** The audience goes "awww". */
  aww() {
    play(
      (audio, t, out, rng) => {
        for (let v = 0; v < 6; v++) {
          const at = t + rng() * 0.12;
          voice(audio, out, at, { pitch: 230 + rng() * 120, glide: 0.72, vowel: [640, 1000], length: 0.9, peak: 0.12 });
        }
      }, 0.95, { audience: true });
  },

  /** The audience claps. */
  applause(seconds = 1.6) {
    play(
      (audio, t, out, rng) => {
        const claps = Math.round(seconds * 120);
        for (let i = 0; i < claps; i++) {
          const along = rng() ** 1.6;
          const at = t + along * seconds;
          const peak = (0.05 + rng() * 0.12) * (1 - along * 0.75);
          const band = filter(audio, envelope(audio, out, at, { peak, attack: 0.001, decay: 0.03 }), "bandpass", 1100 + rng() * 1600, 1.4);
          playNoise(audio, band, at, 0.05, rng() * 2);
        }
        const wash = filter(audio, envelope(audio, out, t, { peak: 0.05, attack: 0.2, decay: seconds }), "bandpass", 2200, 0.5);
        playNoise(audio, wash, t, seconds + 0.3);
      }, 1.5, { audience: true });
  },

  /** A snare roll and a crash: the big reveal. */
  drumroll(seconds = 1.1) {
    play((audio, t, out) => {
      let at = t;
      while (at < t + seconds) {
        const along = (at - t) / seconds;
        const band = filter(audio, envelope(audio, out, at, { peak: 0.08 + along * 0.22, attack: 0.001, decay: 0.05 }), "bandpass", 1900, 0.8);
        playNoise(audio, band, at, 0.07, at * 3);
        at += 1 / (18 + along * 12);
      }
      const end = t + seconds;
      const crash = filter(audio, envelope(audio, out, end, { peak: 0.32, attack: 0.002, decay: 1.4 }), "highpass", 4500);
      playNoise(audio, crash, end, 1.6, 0.4);
      playTone(audio, envelope(audio, out, end, { peak: 0.7, attack: 0.003, decay: 0.3 }), end, 0.35, 120, "sine", 48);
    }, 0.65);
  },

  /** Episode cleared: a little brass fanfare. */
  fanfare() {
    play((audio, t, out) => {
      const brass = filter(audio, out, "lowpass", 2600);
      const notes: Array<[number, number, number]> = [
        [523.25, 0, 0.12],
        [659.25, 0.12, 0.12],
        [783.99, 0.24, 0.12],
        [1046.5, 0.36, 0.7],
        [783.99, 0.36, 0.7],
        [659.25, 0.36, 0.7],
      ];
      for (const [freq, delay, length] of notes) {
        const at = t + delay;
        const env = envelope(audio, brass, at, { peak: 0.12, attack: 0.025, hold: length * 0.6, decay: length * 0.6 });
        playTone(audio, env, at, length + 0.2, freq, "sawtooth");
        playTone(audio, env, at, length + 0.2, freq * 1.004, "sawtooth");
      }
    });
  },

  /** A quick swish for transitions. */
  whoosh() {
    play((audio, t, out) => {
      const band = filter(audio, envelope(audio, out, t, { peak: 0.22, attack: 0.06, decay: 0.2 }), "bandpass", 500, 1.2);
      band.frequency.exponentialRampToValueAtTime(3200, t + 0.24);
      playNoise(audio, band, t, 0.3);
    }, 1.7);
  },

  /** Confetti and little wins. */
  pop() {
    play((audio, t, out) => {
      playTone(audio, envelope(audio, out, t, { peak: 0.35, attack: 0.002, decay: 0.08 }), t, 0.1, 520, "sine", 1250);
    });
  },

  /** Answer buttons and small taps. */
  boop() {
    play((audio, t, out) => {
      playTone(audio, envelope(audio, out, t, { peak: 0.18, attack: 0.002, decay: 0.07 }), t, 0.09, 540, "triangle", 470);
    }, 1.4);
  },

  /** Rubber squeak: grabbing Mr. Nope, squeezing ketchup. */
  squeak() {
    play((audio, t, out) => {
      const osc = playTone(audio, envelope(audio, out, t, { peak: 0.2, attack: 0.01, decay: 0.16 }), t, 0.2, 900, "sine");
      osc.frequency.linearRampToValueAtTime(1500, t + 0.07);
      osc.frequency.linearRampToValueAtTime(1050, t + 0.17);
    }, 1.3);
  },

  /** A locked door rattles. */
  rattle() {
    play((audio, t, out) => {
      for (let i = 0; i < 6; i++) {
        const at = t + i * 0.045;
        const band = filter(audio, envelope(audio, out, at, { peak: 0.16, attack: 0.001, decay: 0.03 }), "bandpass", 2600 - i * 120, 4);
        playNoise(audio, band, at, 0.05, i * 0.2);
      }
    }, 2.6);
  },

  /** A door, a fridge, a lid: a soft thump. */
  thump() {
    play((audio, t, out) => {
      playTone(audio, envelope(audio, out, t, { peak: 0.5, attack: 0.003, decay: 0.18 }), t, 0.22, 110, "sine", 60);
      playNoise(audio, filter(audio, envelope(audio, out, t, { peak: 0.12, attack: 0.002, decay: 0.08 }), "lowpass", 600), t, 0.1);
    });
  },

  /** The cat approves. */
  purr(seconds = 1.2) {
    play((audio, t, out) => {
      const body = envelope(audio, out, t, { peak: 0.35, attack: 0.15, hold: seconds - 0.4, decay: 0.3 });
      const tremolo = audio.ctx.createGain();
      tremolo.gain.value = 0.5;
      tremolo.connect(body);
      const lfo = audio.ctx.createOscillator();
      lfo.frequency.value = 24;
      const depth = audio.ctx.createGain();
      depth.gain.value = 0.5;
      lfo.connect(depth).connect(tremolo.gain);
      lfo.start(t);
      lfo.stop(t + seconds + 0.1);
      playNoise(audio, filter(audio, tremolo, "lowpass", 380), t, seconds + 0.1);
    });
  },

  /** A skip fly is caught. */
  coin() {
    play((audio, t, out) => {
      playTone(audio, envelope(audio, out, t, { peak: 0.2, attack: 0.002, decay: 0.08 }), t, 0.09, 988, "square");
      playTone(audio, envelope(audio, out, t + 0.07, { peak: 0.2, attack: 0.002, decay: 0.25 }), t + 0.07, 0.3, 1319, "square");
    }, 0.85);
  },

  /** Changing the TV channel. */
  static() {
    play((audio, t, out) => {
      playNoise(audio, filter(audio, envelope(audio, out, t, { peak: 0.14, attack: 0.005, decay: 0.22 }), "bandpass", 3200, 0.6), t, 0.3);
    }, 2.2);
  },

  /** A skip fly's buzz. Returns a function that stops it. */
  buzz(): () => void {
    const audio = getAudio();
    if (!audio) return () => {};
    const t = audio.ctx.currentTime;
    const out = audio.ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.05, t + 0.2);
    out.connect(audio.buses.sfx);
    const band = filter(audio, out, "bandpass", 700, 2);
    const wobble = audio.ctx.createOscillator();
    wobble.frequency.value = 9;
    const wobbleDepth = audio.ctx.createGain();
    wobbleDepth.gain.value = 14;
    wobble.connect(wobbleDepth);
    const oscillators = [188, 191.5].map((freq) => {
      const osc = audio.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      wobbleDepth.connect(osc.frequency);
      osc.connect(band);
      osc.start(t);
      return osc;
    });
    wobble.start(t);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const now = audio.ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setTargetAtTime(0.0001, now, 0.05);
      [...oscillators, wobble].forEach((osc) => osc.stop(now + 0.3));
      setTimeout(() => out.disconnect(), 600);
    };
  },
};
