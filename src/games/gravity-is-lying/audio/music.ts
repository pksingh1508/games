// Light, floaty music (Plan/15-gravity-is-lying.md §9): a music-box melody over soft pads, a tune
// for each world. When Newt walks on the ceiling the melody literally turns upside down: every note
// is mirrored in the key (the highest notes become the lowest), and it flips back when Newt does.
// Synthesized on the fly and scheduled a little ahead on the audio clock.
import { getAudio, type AudioEngine } from "@/engine/audio/engine";

export type SongId = "menu" | "lab" | "factory" | "gallery" | "town" | "orbit" | "tree";

type Quality = "maj" | "min" | "maj7" | "m7" | "7" | "sus";

interface Song {
  bpm: number;
  /** The key: the tonic's pitch class (0 = C) and its scale (for the mirrored melody). */
  key: number;
  scale: "major" | "minor";
  /** The note the melody mirrors around (MIDI). */
  pivot: number;
  /** 16 tokens per bar: a note ("E5", "Bb4"), "-" to hold, "." for a rest. */
  melody: string[];
  chords: Array<[string, Quality]>;
}

const SONGS: Record<SongId, Song> = {
  menu: {
    bpm: 84,
    key: 0,
    scale: "major",
    pivot: 72,
    melody: [
      "C5 . E5 . G5 . . . F5 . E5 . D5 . . .",
      "E5 . G5 . C6 . . . B5 . G5 . . . . .",
      "A5 . G5 . F5 . . . E5 . D5 . C5 . . .",
      "D5 . E5 . F5 . E5 . D5 . . . G4 . . .",
    ],
    chords: [
      ["C3", "maj7"],
      ["E2", "m7"],
      ["F2", "maj7"],
      ["G2", "sus"],
    ],
  },
  lab: {
    bpm: 96,
    key: 0,
    scale: "major",
    pivot: 74,
    melody: [
      "E5 . G5 . C6 . . . B5 . G5 . E5 . . .",
      "F5 . A5 . D6 . . . C6 . A5 . F5 . . .",
      "E5 . G5 . B5 . . . A5 . G5 . E5 . D5 .",
      "C5 . D5 . E5 . G5 . - . . . . . . .",
      "A5 . G5 . E5 . . . F5 . E5 . C5 . . .",
      "D5 . E5 . F5 . A5 . G5 . . . . . . .",
      "E5 . C5 . G4 . C5 . E5 . G5 . C6 . . .",
      "B5 . G5 . D5 . F5 . E5 . D5 . C5 . . .",
    ],
    chords: [
      ["C3", "maj7"],
      ["D3", "m7"],
      ["E2", "m7"],
      ["C3", "maj"],
      ["A2", "m7"],
      ["D3", "m7"],
      ["C3", "maj7"],
      ["G2", "7"],
    ],
  },
  factory: {
    bpm: 100,
    key: 7,
    scale: "major",
    pivot: 74,
    melody: [
      "G4 . B4 . D5 . G5 . F#5 . D5 . B4 . . .",
      "C5 . E5 . G5 . C6 . B5 . G5 . E5 . . .",
      "A4 . C5 . E5 . A5 . G5 . E5 . C5 . . .",
      "D5 . F#5 . A5 . . . G5 . F#5 . D5 . . .",
      "B4 . D5 . G5 . B5 . A5 . G5 . D5 . . .",
      "E5 . G5 . C6 . E6 . D6 . C6 . G5 . . .",
      "A5 . F#5 . D5 . A4 . D5 . F#5 . A5 . . .",
      "G5 . D5 . B4 . D5 . G5 . . . . . . .",
    ],
    chords: [
      ["G2", "maj"],
      ["C3", "maj7"],
      ["A2", "m7"],
      ["D3", "7"],
      ["G2", "maj7"],
      ["C3", "maj"],
      ["D3", "sus"],
      ["G2", "maj"],
    ],
  },
  gallery: {
    bpm: 88,
    key: 9,
    scale: "minor",
    pivot: 72,
    melody: [
      "A4 . . . C5 . E5 . . . D5 . C5 . . .",
      "B4 . . . D5 . F5 . . . E5 . D5 . . .",
      "C5 . . . E5 . G5 . . . F5 . E5 . . .",
      "D5 . . . B4 . G4 . . . B4 . E5 . . .",
      "A5 . . . G5 . E5 . . . C5 . E5 . . .",
      "F5 . . . E5 . D5 . . . A4 . D5 . . .",
      "E5 . . . C5 . A4 . . . C5 . E5 . . .",
      "D5 . . . C5 . B4 . . . G4 . A4 . . .",
    ],
    chords: [
      ["A2", "m7"],
      ["D3", "m7"],
      ["C3", "maj7"],
      ["E2", "7"],
      ["A2", "min"],
      ["D3", "min"],
      ["F2", "maj7"],
      ["E2", "7"],
    ],
  },
  town: {
    bpm: 92,
    key: 5,
    scale: "major",
    pivot: 72,
    melody: [
      "F5 . A5 . C6 . . . A5 . F5 . C5 . . .",
      "G5 . A5 . Bb5 . . . A5 . G5 . F5 . . .",
      "E5 . G5 . C6 . . . Bb5 . G5 . E5 . . .",
      "F5 . G5 . A5 . C6 . A5 . . . . . . .",
      "D5 . F5 . A5 . . . G5 . F5 . D5 . . .",
      "Bb4 . D5 . F5 . . . E5 . D5 . Bb4 . . .",
      "C5 . E5 . G5 . Bb5 . A5 . G5 . E5 . . .",
      "F5 . C5 . A4 . C5 . F5 . . . . . . .",
    ],
    chords: [
      ["F2", "maj7"],
      ["C3", "sus"],
      ["C3", "7"],
      ["F2", "maj"],
      ["D3", "m7"],
      ["Bb2", "maj7"],
      ["C3", "7"],
      ["F2", "maj"],
    ],
  },
  orbit: {
    bpm: 76,
    key: 2,
    scale: "major",
    pivot: 74,
    melody: [
      "D5 . . . A5 . . . F#5 . . . E5 . . .",
      "B4 . . . F#5 . . . D5 . . . C#5 . . .",
      "G4 . . . D5 . . . B4 . . . A4 . . .",
      "A4 . . . E5 . . . C#5 . . . . . . .",
      "F#5 . . . E5 . . . D5 . . . A4 . . .",
      "B4 . . . C#5 . . . D5 . . . F#5 . . .",
      "G5 . . . F#5 . . . E5 . . . D5 . . .",
      "E5 . . . A4 . . . D5 . . . . . . .",
    ],
    chords: [
      ["D3", "maj7"],
      ["B2", "m7"],
      ["G2", "maj7"],
      ["A2", "sus"],
      ["D3", "maj"],
      ["B2", "min"],
      ["G2", "maj"],
      ["A2", "7"],
    ],
  },
  tree: {
    bpm: 72,
    key: 4,
    scale: "minor",
    pivot: 71,
    melody: [
      "E5 . . . G5 . B5 . . . A5 . G5 . . .",
      "F#5 . . . A5 . C6 . . . B5 . A5 . . .",
      "G5 . . . E5 . C5 . . . D5 . E5 . . .",
      "D#5 . . . F#5 . B5 . . . . . . . . .",
      "E5 . . . B4 . G4 . . . B4 . E5 . . .",
      "C5 . . . E5 . A5 . . . G5 . E5 . . .",
      "D5 . . . F#5 . A5 . . . G5 . F#5 . . .",
      "E5 . . . B4 . E5 . . . . . . . . .",
    ],
    chords: [
      ["E2", "min"],
      ["D3", "maj"],
      ["C3", "maj7"],
      ["B2", "7"],
      ["E2", "m7"],
      ["A2", "m7"],
      ["D3", "maj"],
      ["E2", "min"],
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

const INTERVALS: Record<Quality, number[]> = {
  maj: [0, 4, 7, 12],
  min: [0, 3, 7, 12],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  sus: [0, 5, 7, 12],
};

export const chordNotes = ([root, quality]: [string, Quality]) => INTERVALS[quality].map((i) => midiOf(root) + i);

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] } as const;

/** A note as a step of the song's scale (notes outside it round down to the step below). */
function degreeOf(song: Pick<Song, "key" | "scale">, midi: number): number {
  const steps = SCALES[song.scale];
  const rel = midi - song.key;
  const octave = Math.floor(rel / 12);
  const within = rel - octave * 12;
  let d = 0;
  for (let i = 0; i < steps.length; i++) if (steps[i]! <= within) d = i;
  return octave * 7 + d;
}

function midiOfDegree(song: Pick<Song, "key" | "scale">, degree: number): number {
  const octave = Math.floor(degree / 7);
  const d = degree - octave * 7;
  return song.key + octave * 12 + SCALES[song.scale][d]!;
}

/** The melody upside down: every note mirrored around the pivot, in the key (so it still sounds right). */
export function invert(song: Pick<Song, "key" | "scale" | "pivot">, midi: number): number {
  const pivot = degreeOf(song, song.pivot);
  return midiOfDegree(song, 2 * pivot - degreeOf(song, midi));
}

export interface Note {
  step: number;
  midi: number;
  steps: number;
}

export function melodyNotes(song: Pick<Song, "melody">): Note[] {
  const tokens = song.melody.flatMap((bar) => {
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

export const SONG_IDS = Object.keys(SONGS) as SongId[];
export const songFor = (id: SongId) => SONGS[id];

const WORLD_SONGS: Record<number, SongId> = { 1: "lab", 2: "factory", 3: "gallery", 4: "town", 5: "orbit", 6: "tree" };
export const songForWorld = (world: number): SongId => WORLD_SONGS[world] ?? "lab";

// ---------------------------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------------------------

/** A music box: a sine with a glassy overtone that fades fast. */
function musicBox(a: AudioEngine, out: AudioNode, t: number, midi: number, peak: number) {
  const ctx = a.ctx;
  const f = hz(midi);
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(f, t);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  body.connect(env).connect(out);
  body.start(t);
  body.stop(t + 1.15);

  const glass = ctx.createOscillator();
  glass.type = "sine";
  glass.frequency.setValueAtTime(f * 3.01, t);
  const glassEnv = ctx.createGain();
  glassEnv.gain.setValueAtTime(0.0001, t);
  glassEnv.gain.exponentialRampToValueAtTime(peak * 0.25, t + 0.003);
  glassEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  glass.connect(glassEnv).connect(out);
  glass.start(t);
  glass.stop(t + 0.4);
}

/** A soft, airy pad: detuned sines and triangles, slow in and out. */
function pad(a: AudioEngine, out: AudioNode, t: number, length: number, notes: number[], peak: number) {
  const ctx = a.ctx;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1100;
  filter.Q.value = 0.3;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(peak, t + Math.min(0.9, length * 0.4));
  env.gain.setValueAtTime(peak, t + length * 0.75);
  env.gain.linearRampToValueAtTime(0.0001, t + length + 0.6);
  filter.connect(env).connect(out);
  for (const midi of notes) {
    for (const [type, detune] of [
      ["triangle", -7],
      ["sine", 7],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(hz(midi + 12), t);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length + 0.7);
    }
  }
}

function bass(a: AudioEngine, out: AudioNode, t: number, midi: number, length: number) {
  const ctx = a.ctx;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(hz(midi), t);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.13, t + 0.03);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(env).connect(out);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

// ---------------------------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------------------------

const LOOKAHEAD = 0.2;
const LEVEL = 0.75;

class MusicPlayer {
  private song: SongId | null = null;
  private notes: Note[] = [];
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private at = 0;
  private paused = false;
  /** Newt is upside down: the melody is too. */
  private inverted = false;

  play(id: SongId) {
    const audio = getAudio();
    if (!audio) return;
    if (this.song === id && this.out) {
      this.resume();
      return;
    }
    this.fadeOut();
    this.song = id;
    this.notes = melodyNotes(SONGS[id]);
    this.out = audio.ctx.createGain();
    this.out.gain.value = LEVEL;
    this.out.connect(audio.buses.music);
    this.step = 0;
    this.at = audio.ctx.currentTime + 0.1;
    this.paused = false;
    this.timer ??= setInterval(() => this.schedule(), 30);
    this.schedule();
  }

  /** Upside down (or not): from the next note on. */
  setInverted(on: boolean) {
    this.inverted = on;
  }

  pause() {
    if (!this.out || this.paused) return;
    const audio = getAudio();
    if (!audio) return;
    this.paused = true;
    this.out.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.08);
  }

  resume() {
    if (!this.out || !this.paused) return;
    const audio = getAudio();
    if (!audio) return;
    this.paused = false;
    this.at = Math.max(this.at, audio.ctx.currentTime + 0.05);
    this.out.gain.cancelScheduledValues(audio.ctx.currentTime);
    this.out.gain.setTargetAtTime(LEVEL, audio.ctx.currentTime, 0.1);
  }

  stop() {
    this.fadeOut();
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** A little rising run at the portal; the music ducks under it. */
  jingle() {
    const audio = getAudio();
    if (!audio) return;
    const t = audio.ctx.currentTime + 0.02;
    const out = audio.ctx.createGain();
    out.gain.value = 1;
    out.connect(audio.buses.music);
    const song = SONGS[this.song ?? "lab"];
    const root = song.key + 72;
    [0, 4, 7, 12].forEach((i, n) => musicBox(audio, out, t + n * 0.08, root + i, 0.14));
    setTimeout(() => out.disconnect(), 1600);
    if (this.out) {
      this.out.gain.setTargetAtTime(0.3, t, 0.03);
      this.out.gain.setTargetAtTime(this.paused ? 0.0001 : LEVEL, t + 0.8, 0.25);
    }
  }

  private fadeOut() {
    const out = this.out;
    this.out = null;
    if (!out) return;
    const audio = getAudio();
    if (!audio) return;
    out.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.15);
    setTimeout(() => out.disconnect(), 900);
  }

  private schedule() {
    const audio = getAudio();
    if (!audio || !this.out || this.paused || !this.song) return;
    const song = SONGS[this.song];
    const stepLength = 60 / song.bpm / 4;
    const loop = song.melody.length * 16;
    if (this.at < audio.ctx.currentTime - 0.2) this.at = audio.ctx.currentTime + 0.05;
    while (this.at < audio.ctx.currentTime + LOOKAHEAD) {
      this.playStep(audio, song, this.step % loop, this.at, stepLength);
      this.step++;
      this.at += stepLength;
    }
  }

  private playStep(a: AudioEngine, song: Song, step: number, t: number, stepLength: number) {
    const out = this.out!;
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    for (const note of this.notes) if (note.step === step) musicBox(a, out, t, this.inverted ? invert(song, note.midi) : note.midi, 0.1);
    const chord = song.chords[bar % song.chords.length]!;
    const notes = chordNotes(chord);
    if (inBar === 0) {
      pad(a, out, t, stepLength * 16, notes.slice(0, 3), 0.024);
      bass(a, out, t, notes[0]!, stepLength * 7);
    } else if (inBar === 8) bass(a, out, t, notes[0]! + 7, stepLength * 6);
  }
}

export const music = new MusicPlayer();
