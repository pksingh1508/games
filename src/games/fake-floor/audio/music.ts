// Calm, curious music (Plan/05-fake-floor.md §9): soft marimba over synth pads, a different mood
// for each world. It never rushes you: slow tempos, lots of space. Synthesized on the fly and
// scheduled a little ahead on the audio clock. Time trials play it a touch faster.
import { getAudio, type AudioEngine } from "@/engine/audio/engine";

export type SongId = "menu" | "world1" | "world2" | "world3" | "world4" | "world5" | "floor";

type Quality = "maj" | "min" | "maj7" | "m7" | "7" | "sus";

interface Song {
  bpm: number;
  /** 16 tokens per bar: a note ("E5", "Bb4", "C#6"), "-" to hold, "." for a rest. */
  melody: string[];
  /** One chord per bar: root note and quality. */
  chords: Array<[string, Quality]>;
  /** A very soft shaker on the off-beats. */
  shaker: boolean;
}

const SONGS: Record<Exclude<SongId, "menu">, Song> = {
  world1: {
    bpm: 96,
    melody: [
      "E5 . G5 . C6 . B5 . G5 . . . E5 . . .",
      "C5 . E5 . A5 . G5 . E5 . . . C5 . . .",
      "D5 . F5 . A5 . C6 . A5 . . . F5 . . .",
      "B4 . D5 . G5 . F5 . D5 . . . G4 . . .",
      "E5 . G5 . C6 . D6 . E6 . . . C6 . . .",
      "A5 . F5 . C5 . F5 . A5 . . . C6 . . .",
      "F5 . D5 . A4 . D5 . F5 . . . A5 . G5 .",
      "F5 . D5 . B4 . G4 . B4 . D5 . . . . .",
    ],
    chords: [
      ["C3", "maj7"],
      ["A2", "m7"],
      ["D3", "m7"],
      ["G2", "7"],
      ["C3", "maj7"],
      ["F2", "maj7"],
      ["D3", "m7"],
      ["G2", "7"],
    ],
    shaker: true,
  },
  world2: {
    bpm: 84,
    melody: [
      "A4 . . . C5 . E5 . . . D5 . C5 . . .",
      "A4 . . . C5 . F5 . . . E5 . C5 . . .",
      "G4 . . . C5 . E5 . . . G5 . E5 . . .",
      "D5 . . . B4 . G4 . . . B4 . D5 . . .",
      "E5 . . . A5 . C6 . . . B5 . A5 . . .",
      "F5 . . . A5 . C6 . . . A5 . F5 . . .",
      "D5 . . . F5 . A5 . . . G5 . F5 . . .",
      "E5 . . . G#5 . B5 . . . G#5 . E5 . . .",
    ],
    chords: [
      ["A2", "m7"],
      ["F2", "maj7"],
      ["C3", "maj"],
      ["G2", "maj"],
      ["A2", "min"],
      ["F2", "maj7"],
      ["D3", "m7"],
      ["E2", "7"],
    ],
    shaker: false,
  },
  world3: {
    bpm: 76,
    melody: [
      "D4 . . . F4 . . . A4 . . . G4 . . .",
      "E4 . . . G4 . . . C5 . . . G4 . . .",
      "D4 . . . F4 . . . Bb4 . . . A4 . . .",
      "E4 . . . G4 . . . C5 . . . E4 . . .",
      "D4 . . . F4 . A4 . D5 . . . C5 . . .",
      "C5 . . . A4 . F4 . A4 . . . C5 . . .",
      "Bb4 . . . G4 . D4 . G4 . . . Bb4 . . .",
      "A4 . . . C#5 . E5 . A4 . . . . . . .",
    ],
    chords: [
      ["D2", "min"],
      ["C2", "maj"],
      ["Bb1", "maj7"],
      ["C2", "maj"],
      ["D2", "min"],
      ["F2", "maj"],
      ["G2", "min"],
      ["A1", "7"],
    ],
    shaker: false,
  },
  world4: {
    bpm: 90,
    melody: [
      "B4 . E5 . G5 . B5 . . . G5 . E5 . . .",
      "C5 . E5 . G5 . B5 . . . G5 . E5 . . .",
      "A4 . C5 . E5 . A5 . . . E5 . C5 . . .",
      "B4 . D#5 . F#5 . A5 . . . F#5 . D#5 . . .",
      "G5 . F#5 . E5 . B4 . . . E5 . G5 . . .",
      "D5 . G5 . B5 . D6 . . . B5 . G5 . . .",
      "E5 . G5 . C6 . E6 . . . C6 . G5 . . .",
      "D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4 . . .",
    ],
    chords: [
      ["E2", "min"],
      ["C3", "maj7"],
      ["A2", "min"],
      ["B2", "7"],
      ["E2", "min"],
      ["G2", "maj"],
      ["C3", "maj"],
      ["B2", "7"],
    ],
    shaker: true,
  },
  world5: {
    bpm: 100,
    melody: [
      "C5 . F5 . A5 . C6 . A5 . . . F5 . . .",
      "D5 . F5 . A5 . D6 . A5 . . . F5 . . .",
      "D5 . F5 . Bb5 . D6 . Bb5 . . . F5 . . .",
      "E5 . G5 . C6 . E6 . C6 . . . G5 . . .",
      "A5 . . . G5 . F5 . C5 . . . F5 . . .",
      "E5 . . . C5 . A4 . C5 . . . E5 . . .",
      "D5 . . . F5 . Bb5 . A5 . . . G5 . . .",
      "E5 . G5 . Bb5 . C6 . . . . . . . . .",
    ],
    chords: [
      ["F2", "maj"],
      ["D2", "min"],
      ["Bb1", "maj"],
      ["C2", "maj"],
      ["F2", "maj7"],
      ["A2", "min"],
      ["Bb1", "maj"],
      ["C2", "7"],
    ],
    shaker: true,
  },
  floor: {
    bpm: 66,
    melody: [
      "C#4 . . . . . E4 . . . . . G#4 . . .",
      "A4 . . . . . E4 . . . . . C#4 . . .",
      "F#4 . . . . . A4 . . . . . C#5 . . .",
      "G#4 . . . . . C5 . . . . . D#5 . . .",
      "C#5 . . . . . G#4 . . . . . E4 . . .",
      "E4 . . . . . G#4 . . . . . B4 . . .",
      "A4 . . . . . C#5 . . . . . E5 . . .",
      "G#4 . . . . . D#5 . . . . . C5 . . .",
    ],
    chords: [
      ["C#2", "min"],
      ["A1", "maj"],
      ["F#2", "min"],
      ["G#1", "7"],
      ["C#2", "min"],
      ["E2", "maj"],
      ["A1", "maj"],
      ["G#1", "7"],
    ],
    shaker: false,
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

export const SONG_IDS = Object.keys(SONGS) as Array<keyof typeof SONGS>;
export const songFor = (id: keyof typeof SONGS) => SONGS[id];

export function songForRoom(id: string): SongId {
  const world = Number(id.split("-")[0]);
  return world >= 6 ? "floor" : (`world${Math.max(1, world)}` as SongId);
}

// ---------------------------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------------------------

/** A marimba: a sine with a bright, fast-fading overtone and a soft mallet click. */
function marimba(a: AudioEngine, out: AudioNode, t: number, midi: number, peak: number) {
  const ctx = a.ctx;
  const f = hz(midi);
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(f, t);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  body.connect(env).connect(out);
  body.start(t);
  body.stop(t + 0.95);

  const over = ctx.createOscillator();
  over.type = "sine";
  over.frequency.setValueAtTime(f * 4, t);
  const overEnv = ctx.createGain();
  overEnv.gain.setValueAtTime(0.0001, t);
  overEnv.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.003);
  overEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  over.connect(overEnv).connect(out);
  over.start(t);
  over.stop(t + 0.15);
}

/** A soft pad chord: detuned triangles through a low-pass filter, slow in and out. */
function pad(a: AudioEngine, out: AudioNode, t: number, length: number, notes: number[], peak: number) {
  const ctx = a.ctx;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.4;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(peak, t + Math.min(0.8, length * 0.4));
  env.gain.setValueAtTime(peak, t + length * 0.75);
  env.gain.linearRampToValueAtTime(0.0001, t + length + 0.5);
  filter.connect(env).connect(out);
  for (const midi of notes) {
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(hz(midi + 12), t);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length + 0.6);
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
  env.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(env).connect(out);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

function shaker(a: AudioEngine, out: AudioNode, t: number) {
  const ctx = a.ctx;
  const source = ctx.createBufferSource();
  source.buffer = a.noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 6000;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.025, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  source.connect(hp).connect(env).connect(out);
  source.start(t, (t * 3.1) % 1.5);
  source.stop(t + 0.06);
}

// ---------------------------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------------------------

const LOOKAHEAD = 0.2;
const LEVEL = 0.8;

class MusicPlayer {
  private song: SongId | null = null;
  private notes: Note[] = [];
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private at = 0;
  private tempo = 1;
  private paused = false;

  /** Start a song, or carry on if it's already playing. `fast`: time trials. */
  play(id: SongId, { fast = false }: { fast?: boolean } = {}) {
    const audio = getAudio();
    if (!audio) return;
    this.tempo = fast ? 1.1 : 1;
    if (this.song === id && this.out) {
      this.resume();
      return;
    }
    this.fadeOut();
    this.song = id;
    this.notes = melodyNotes(this.current());
    this.out = audio.ctx.createGain();
    this.out.gain.value = LEVEL;
    this.out.connect(audio.buses.music);
    this.step = 0;
    this.at = audio.ctx.currentTime + 0.1;
    this.paused = false;
    this.timer ??= setInterval(() => this.schedule(), 30);
    this.schedule();
  }

  private current(): Song {
    if (this.song === "menu") return { ...SONGS.world1, bpm: 80, shaker: false };
    return SONGS[this.song ?? "world1"];
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

  /** Three soft notes at the door; the music ducks under them. */
  jingle() {
    const audio = getAudio();
    if (!audio) return;
    const t = audio.ctx.currentTime + 0.02;
    const out = audio.ctx.createGain();
    out.gain.value = 1;
    out.connect(audio.buses.music);
    [72, 76, 79, 84].forEach((midi, i) => marimba(audio, out, t + i * 0.09, midi, 0.16));
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
    const song = this.current();
    const stepLength = 60 / (song.bpm * this.tempo) / 4;
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
    for (const note of this.notes) if (note.step === step) marimba(a, out, t, note.midi, 0.11);
    const chord = song.chords[bar % song.chords.length]!;
    const notes = chordNotes(chord);
    if (inBar === 0) {
      pad(a, out, t, stepLength * 16, notes.slice(0, 3), 0.028);
      bass(a, out, t, notes[0]!, stepLength * 6);
    } else if (inBar === 8) bass(a, out, t, notes[0]! + (bar % 2 ? 7 : 12), stepLength * 5);
    if (song.shaker && inBar % 4 === 2) shaker(a, out, t);
  }
}

export const music = new MusicPlayer();
