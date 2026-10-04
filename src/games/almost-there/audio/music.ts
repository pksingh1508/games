// Calm, melancholy music, a different instrument for each zone (Plan/08-almost-there.md §9). The
// whole climb shares one slow chord loop that never restarts: when you reach a new zone, or fall
// back into an old one, only the instrument and its melody change, at the next bar. Falling doesn't
// interrupt it, which is oddly comforting. Synthesized on the fly, scheduled a little ahead.
import { getAudio, type AudioEngine } from "@/engine/audio/engine";
import type { ZoneId } from "../core/mountain";

export type SongId = ZoneId | "title" | "credits";

type Voice = "pluck" | "accordion" | "musicBox" | "flute" | "glass" | "brass" | "cello" | "harp" | "piano";

interface Part {
  voice: Voice;
  /** 16 tokens per bar: a note ("E5", "Bb4", "C#6"), "-" to hold, "." for a rest. */
  melody: string[];
  level: number;
}

/** D minor, slowly: Dm · Bbmaj7 · F · C · Gm7 · Bb · Dm · A7. */
const CHORDS: Array<[string, "maj" | "min" | "maj7" | "m7" | "7"]> = [
  ["D2", "min"],
  ["Bb1", "maj7"],
  ["F2", "maj"],
  ["C2", "maj"],
  ["G2", "m7"],
  ["Bb1", "maj"],
  ["D2", "min"],
  ["A1", "7"],
];

/** The fake credits are triumphant (D major), which is the lie. */
const CREDIT_CHORDS: typeof CHORDS = [
  ["D2", "maj"],
  ["G1", "maj"],
  ["D2", "maj"],
  ["A1", "maj"],
  ["G1", "maj"],
  ["D2", "maj"],
  ["A1", "7"],
  ["D2", "maj"],
];

export const BPM = 72;

const PARTS: Record<SongId, Part> = {
  foothills: {
    voice: "pluck",
    level: 0.12,
    melody: [
      "D5 . . . F5 . A5 . . . G5 . F5 . . .",
      "D5 . . . . . F5 . . . E5 . D5 . . .",
      "C5 . . . F5 . A5 . . . C6 . A5 . . .",
      "G5 . . . . . E5 . . . C5 . . . . .",
      "Bb4 . . . D5 . G5 . . . F5 . D5 . . .",
      "F5 . . . . . D5 . . . Bb4 . . . . .",
      "A4 . . . D5 . F5 . . . E5 . D5 . . .",
      "C#5 . . . E5 . . . A5 . . . . . . .",
    ],
  },
  rooftops: {
    voice: "accordion",
    level: 0.05,
    melody: [
      "A4 . D5 . F5 - - . E5 . D5 - - . A4 .",
      "Bb4 . D5 . F5 - - . A5 . F5 - - - - .",
      "A4 . C5 . F5 - - . G5 . A5 - - - - .",
      "G5 . E5 . C5 - - . E5 . G5 - - - - .",
      "F5 . D5 . Bb4 - - . D5 . F5 - - . G5 .",
      "F5 - - . D5 - - . F5 . Bb5 - - - - .",
      "A5 . F5 . D5 - - . F5 . A5 - - - - .",
      "G5 . E5 . C#5 - - . E5 - - - - - - .",
    ],
  },
  clocktower: {
    voice: "musicBox",
    level: 0.08,
    melody: [
      "D6 . A5 . F5 . A5 . D6 . A5 . F5 . A5 .",
      "D6 . Bb5 . F5 . Bb5 . D6 . Bb5 . F5 . Bb5 .",
      "C6 . A5 . F5 . A5 . C6 . A5 . F5 . A5 .",
      "C6 . G5 . E5 . G5 . C6 . G5 . E5 . G5 .",
      "Bb5 . G5 . D5 . G5 . Bb5 . G5 . D5 . G5 .",
      "Bb5 . F5 . D5 . F5 . Bb5 . F5 . D5 . F5 .",
      "A5 . F5 . D5 . F5 . A5 . F5 . D5 . F5 .",
      "A5 . E5 . C#5 . E5 . A5 . . . . . . .",
    ],
  },
  cliffs: {
    voice: "flute",
    level: 0.07,
    melody: [
      "A5 - - - - - G5 - F5 - - - E5 - - -",
      "D5 - - - - - - - F5 - - - - - - -",
      "C5 - - - F5 - - - A5 - - - G5 - - -",
      "E5 - - - - - - - . . . . . . . .",
      "D5 - - - G5 - - - Bb5 - - - A5 - - -",
      "F5 - - - - - - - D5 - - - - - - -",
      "F5 - - - E5 - - - D5 - - - E5 - - -",
      "E5 - - - - - - - . . . . . . . .",
    ],
  },
  ice: {
    voice: "glass",
    level: 0.08,
    melody: [
      "D6 . . . . . . . A5 . . . . . . .",
      "F6 . . . . . . . D6 . . . . . . .",
      "C6 . . . . . . . A5 . . . F5 . . .",
      "G5 . . . . . . . . . . . E5 . . .",
      "D6 . . . . . . . Bb5 . . . . . . .",
      "F5 . . . . . . . D5 . . . . . . .",
      "A5 . . . . . . . F5 . . . D5 . . .",
      "C#6 . . . . . . . A5 . . . . . . .",
    ],
  },
  "fake-summit": {
    voice: "brass",
    level: 0.05,
    melody: [
      "D5 . . . A5 . . . D6 - - - C6 . A5 .",
      "Bb5 - - - - - - - F5 . . . . . . .",
      "A5 . . . C6 . . . F6 - - - E6 . C6 .",
      "E6 - - - - - - - . . . . . . . .",
      "D6 . . . Bb5 . . . G5 - - - A5 . Bb5 .",
      "F5 - - - - - - - . . . . D5 . F5 .",
      "A5 - - - - - - - D6 - - - - - - -",
      "C#6 - - - - - - - . . . . . . . .",
    ],
  },
  inside: {
    voice: "cello",
    level: 0.06,
    melody: [
      "D4 - - - - - - - F4 - - - E4 - - -",
      "D4 - - - - - - - - - - - . . . .",
      "C4 - - - - - - - F4 - - - - - - -",
      "E4 - - - - - - - G4 - - - - - - -",
      "G4 - - - - - - - F4 - - - D4 - - -",
      "F4 - - - - - - - . . . . . . . .",
      "A4 - - - - - - - F4 - - - D4 - - -",
      "E4 - - - - - - - C#4 - - - - - - -",
    ],
  },
  sky: {
    voice: "harp",
    level: 0.08,
    melody: [
      "D5 F5 A5 D6 . . . . D5 F5 A5 C6 . . . .",
      "Bb4 D5 F5 A5 . . . . Bb4 D5 F5 Bb5 . . . .",
      "F5 A5 C6 F6 . . . . F5 A5 C6 A5 . . . .",
      "E5 G5 C6 E6 . . . . E5 G5 C6 G5 . . . .",
      "G4 Bb4 D5 G5 . . . . G4 Bb4 D5 F5 . . . .",
      "Bb4 D5 F5 Bb5 . . . . Bb4 D5 F5 D5 . . . .",
      "D5 F5 A5 D6 . . . . D5 F5 A5 F5 . . . .",
      "C#5 E5 A5 C#6 . . . . E5 A5 C#6 E6 . . . .",
    ],
  },
  summit: {
    voice: "piano",
    level: 0.09,
    melody: [
      "A5 . . . D6 . . . F6 . . . E6 . D6 .",
      "D6 . . . . . . . A5 . . . . . . .",
      "C6 . . . F6 . . . A6 . . . G6 . F6 .",
      "E6 . . . . . . . C6 . . . . . . .",
      "D6 . . . G6 . . . Bb6 . . . A6 . G6 .",
      "F6 . . . . . . . D6 . . . . . . .",
      "F6 . . . E6 . . . D6 . . . E6 . . .",
      "E6 . . . . . . . A5 . . . . . . .",
    ],
  },
  title: {
    voice: "musicBox",
    level: 0.07,
    melody: [
      "A5 . . . D6 . . . F6 . . . E6 . D6 .",
      "D6 . . . . . . . A5 . . . . . . .",
      "C6 . . . F6 . . . A6 . . . G6 . F6 .",
      "E6 . . . . . . . C6 . . . . . . .",
      "D6 . . . G6 . . . Bb6 . . . A6 . G6 .",
      "F6 . . . . . . . D6 . . . . . . .",
      "F6 . . . E6 . . . D6 . . . E6 . . .",
      "E6 . . . . . . . A5 . . . . . . .",
    ],
  },
  credits: {
    voice: "brass",
    level: 0.06,
    melody: [
      "D5 . F#5 . A5 . D6 - - - A5 . F#5 . A5 .",
      "B5 - - - - - - - G5 . . . . . . .",
      "A5 . . . D6 . . . F#6 - - - E6 . D6 .",
      "E6 - - - - - - - . . . . . . . .",
      "D6 . . . B5 . . . G5 - - - A5 . B5 .",
      "A5 - - - - - - - . . . . F#5 . A5 .",
      "D6 - - - - - - - A5 - - - - - - -",
      "D6 - - - - - - - . . . . . . . .",
    ],
  },
};

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C#5" → MIDI 73. */
export function midiOf(token: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(token);
  if (!m) throw new Error(`Bad note ${token}`);
  const accidental = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + NOTE_INDEX[m[1]!]! + accidental;
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const INTERVALS = { maj: [0, 4, 7], min: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], "7": [0, 4, 7, 10] } as const;

export const chordNotes = ([root, quality]: (typeof CHORDS)[number]) => INTERVALS[quality].map((i) => midiOf(root) + i);

export interface Note {
  step: number;
  midi: number;
  steps: number;
}

export function melodyNotes(melody: readonly string[]): Note[] {
  const tokens = melody.flatMap((bar) => {
    const t = bar.trim().split(/\s+/);
    if (t.length !== 16) throw new Error(`A bar needs 16 steps: "${bar}"`);
    return t;
  });
  const notes: Note[] = [];
  tokens.forEach((token, step) => {
    if (token === "-") {
      const last = notes[notes.length - 1];
      if (last && last.step + last.steps === step) last.steps++;
    } else if (token !== ".") notes.push({ step, midi: midiOf(token), steps: 1 });
  });
  return notes;
}

export const SONG_IDS = Object.keys(PARTS) as SongId[];
export const partFor = (id: SongId) => PARTS[id];

// ---------------------------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------------------------

function osc(a: AudioEngine, type: OscillatorType, f: number, t: number, end: number, out: AudioNode, detune = 0) {
  const o = a.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  o.detune.value = detune;
  o.connect(out);
  o.start(t);
  o.stop(end);
  return o;
}

function env(a: AudioEngine, out: AudioNode, t: number, peak: number, attack: number, hold: number, release: number) {
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  if (hold > 0) g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  g.connect(out);
  return g;
}

function lowpass(a: AudioEngine, out: AudioNode, f: number, q = 0.5) {
  const filter = a.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = f;
  filter.Q.value = q;
  filter.connect(out);
  return filter;
}

/** One note in a voice. `length` is the held length in seconds. */
export function playVoice(a: AudioEngine, out: AudioNode, voice: Voice, t: number, midi: number, length: number, peak: number) {
  const f = hz(midi);
  switch (voice) {
    case "pluck": {
      const e = env(a, lowpass(a, out, 2200), t, peak, 0.005, 0, 0.9);
      osc(a, "triangle", f, t, t + 1, e);
      osc(a, "sine", f * 2, t, t + 0.3, env(a, out, t, peak * 0.25, 0.003, 0, 0.25));
      return;
    }
    case "accordion": {
      const e = env(a, lowpass(a, out, 1600), t, peak, 0.04, Math.max(0, length - 0.05), 0.12);
      osc(a, "sawtooth", f, t, t + length + 0.2, e, -5);
      osc(a, "sawtooth", f, t, t + length + 0.2, e, 6);
      return;
    }
    case "musicBox": {
      osc(a, "sine", f, t, t + 1.3, env(a, out, t, peak, 0.003, 0, 1.2));
      osc(a, "sine", f * 2.76, t, t + 0.4, env(a, out, t, peak * 0.3, 0.002, 0, 0.35));
      return;
    }
    case "flute": {
      const e = env(a, out, t, peak, 0.09, Math.max(0, length - 0.1), 0.25);
      const o = osc(a, "sine", f, t, t + length + 0.4, e);
      const lfo = a.ctx.createOscillator();
      lfo.frequency.value = 5;
      const depth = a.ctx.createGain();
      depth.gain.value = 4;
      lfo.connect(depth).connect(o.detune);
      lfo.start(t);
      lfo.stop(t + length + 0.4);
      osc(a, "triangle", f * 2, t, t + length + 0.4, env(a, out, t, peak * 0.08, 0.1, Math.max(0, length - 0.1), 0.2));
      return;
    }
    case "glass": {
      osc(a, "sine", f, t, t + 2.4, env(a, out, t, peak, 0.004, 0, 2.2));
      osc(a, "sine", f * 2.32, t, t + 1.2, env(a, out, t, peak * 0.25, 0.004, 0, 1));
      osc(a, "sine", f * 4.25, t, t + 0.6, env(a, out, t, peak * 0.1, 0.004, 0, 0.5));
      return;
    }
    case "brass": {
      const filter = a.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 1;
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.linearRampToValueAtTime(2200, t + 0.08);
      filter.frequency.exponentialRampToValueAtTime(900, t + 0.08 + length);
      filter.connect(out);
      const e = env(a, filter, t, peak, 0.04, Math.max(0, length - 0.05), 0.18);
      osc(a, "sawtooth", f, t, t + length + 0.3, e);
      osc(a, "square", f / 2, t, t + length + 0.3, env(a, filter, t, peak * 0.3, 0.05, Math.max(0, length - 0.05), 0.15));
      return;
    }
    case "cello": {
      const e = env(a, lowpass(a, out, 900, 0.7), t, peak, 0.28, Math.max(0, length - 0.3), 0.5);
      const o = osc(a, "sawtooth", f, t, t + length + 0.6, e);
      const lfo = a.ctx.createOscillator();
      lfo.frequency.value = 4.5;
      const depth = a.ctx.createGain();
      depth.gain.value = 6;
      lfo.connect(depth).connect(o.detune);
      lfo.start(t);
      lfo.stop(t + length + 0.6);
      return;
    }
    case "harp": {
      osc(a, "triangle", f, t, t + 1.6, env(a, out, t, peak, 0.004, 0, 1.4));
      osc(a, "sine", f * 2, t, t + 0.8, env(a, out, t, peak * 0.3, 0.003, 0, 0.6));
      return;
    }
    case "piano": {
      osc(a, "sine", f, t, t + 2, env(a, out, t, peak, 0.004, 0, 1.8));
      osc(a, "sine", f * 2, t, t + 1, env(a, out, t, peak * 0.35, 0.004, 0, 0.9));
      osc(a, "triangle", f * 3, t, t + 0.4, env(a, out, t, peak * 0.1, 0.003, 0, 0.3));
      return;
    }
  }
}

/** The soft bed under every zone: the chord as a pad, and a bass note. */
function bed(a: AudioEngine, out: AudioNode, t: number, bar: number, barLength: number, dark: boolean, chords = CHORDS) {
  const notes = chordNotes(chords[bar % chords.length]!);
  const filter = lowpass(a, out, dark ? 500 : 800, 0.4);
  const e = a.ctx.createGain();
  e.gain.setValueAtTime(0.0001, t);
  e.gain.linearRampToValueAtTime(0.022, t + barLength * 0.35);
  e.gain.setValueAtTime(0.022, t + barLength * 0.8);
  e.gain.linearRampToValueAtTime(0.0001, t + barLength + 0.4);
  e.connect(filter);
  for (const midi of notes.slice(0, 3)) {
    for (const detune of [-7, 7]) osc(a, "triangle", hz(midi + 12), t, t + barLength + 0.5, e, detune);
  }
  osc(a, "sine", hz(notes[0]!), t, t + barLength * 0.6, env(a, out, t, 0.12, 0.03, barLength * 0.2, barLength * 0.35));
}

// ---------------------------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------------------------

const LOOKAHEAD = 0.25;
const LEVEL = 0.85;

class MusicPlayer {
  private song: SongId | null = null;
  /** Switch at the next bar. */
  private next: SongId | null = null;
  private notes: Note[] = [];
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** The shared clock: steps since the climb's music began (it never resets on a fall). */
  private step = 0;
  private at = 0;
  private paused = false;
  private silent = false;

  /** Play this zone's part (at the next bar if something's already playing). */
  play(id: SongId) {
    const audio = getAudio();
    if (!audio) return;
    this.silent = false;
    if (this.out && this.song) {
      this.resume();
      if (id !== this.song) this.next = id;
      return;
    }
    this.song = id;
    this.notes = melodyNotes(PARTS[id].melody);
    this.out = audio.ctx.createGain();
    this.out.gain.value = LEVEL;
    this.out.connect(audio.buses.music);
    this.at = audio.ctx.currentTime + 0.1;
    this.paused = false;
    this.timer ??= setInterval(() => this.schedule(), 40);
    this.schedule();
  }

  get playing(): SongId | null {
    return this.next ?? this.song;
  }

  pause() {
    if (!this.out || this.paused) return;
    const audio = getAudio();
    if (!audio) return;
    this.paused = true;
    this.out.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.1);
  }

  resume() {
    if (!this.out || !this.paused) return;
    const audio = getAudio();
    if (!audio) return;
    this.paused = false;
    this.at = Math.max(this.at, audio.ctx.currentTime + 0.05);
    this.out.gain.cancelScheduledValues(audio.ctx.currentTime);
    this.out.gain.setTargetAtTime(this.silent ? 0.0001 : LEVEL, audio.ctx.currentTime, 0.15);
  }

  /** The record scratches to a halt ("…just kidding."). Resumes with the next play(). */
  cut() {
    const audio = getAudio();
    if (!audio || !this.out) return;
    this.silent = true;
    const t = audio.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0.0001, t + 0.12);
    // The scratch.
    const o = audio.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    const g = env(audio, audio.buses.music, t, 0.08, 0.01, 0.1, 0.25);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.4);
  }

  /** Bring the music back after a cut (at the next bar). */
  unsilence() {
    const audio = getAudio();
    if (!audio || !this.out) return;
    this.silent = false;
    this.out.gain.cancelScheduledValues(audio.ctx.currentTime);
    this.out.gain.setTargetAtTime(this.paused ? 0.0001 : LEVEL, audio.ctx.currentTime, 0.8);
  }

  stop() {
    const out = this.out;
    this.out = null;
    this.song = null;
    this.next = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (!out) return;
    const audio = getAudio();
    if (!audio) return;
    out.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.2);
    setTimeout(() => out.disconnect(), 1200);
  }

  /** A fanfare for a summit (the music ducks under it). `real`: quieter, and it resolves. */
  fanfare(real = false) {
    const audio = getAudio();
    if (!audio) return;
    const t = audio.ctx.currentTime + 0.03;
    const out = audio.ctx.createGain();
    out.gain.value = 1;
    out.connect(audio.buses.music);
    const notes = real ? [62, 66, 69, 74, 78] : [62, 66, 69, 74, 74, 78, 81];
    notes.forEach((midi, i) => playVoice(audio, out, real ? "piano" : "brass", t + i * (real ? 0.22 : 0.13), midi, real ? 0.6 : i === notes.length - 1 ? 1 : 0.12, real ? 0.1 : 0.07));
    setTimeout(() => out.disconnect(), 4000);
    if (this.out) {
      this.out.gain.setTargetAtTime(0.2, t, 0.05);
      this.out.gain.setTargetAtTime(this.paused || this.silent ? 0.0001 : LEVEL, t + 2, 0.4);
    }
  }

  private schedule() {
    const audio = getAudio();
    if (!audio || !this.out || this.paused || !this.song) return;
    const stepLength = 60 / BPM / 4;
    if (this.at < audio.ctx.currentTime - 0.3) this.at = audio.ctx.currentTime + 0.05;
    while (this.at < audio.ctx.currentTime + LOOKAHEAD) {
      const inBar = this.step % 16;
      if (inBar === 0 && this.next) {
        this.song = this.next;
        this.next = null;
        this.notes = melodyNotes(PARTS[this.song].melody);
      }
      if (!this.silent) this.playStep(audio, this.step, this.at, stepLength);
      this.step++;
      this.at += stepLength;
    }
  }

  private playStep(a: AudioEngine, step: number, t: number, stepLength: number) {
    const out = this.out!;
    const part = PARTS[this.song!];
    const loop = part.melody.length * 16;
    const s = step % loop;
    for (const note of this.notes) if (note.step === s) playVoice(a, out, part.voice, t, note.midi, note.steps * stepLength, part.level);
    if (step % 16 === 0) bed(a, out, t, Math.floor(step / 16), stepLength * 16, this.song === "inside", this.song === "credits" ? CREDIT_CHORDS : CHORDS);
  }
}

export const music = new MusicPlayer();
