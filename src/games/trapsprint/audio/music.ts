// Chiptune for each zone (Plan/06-trapsprint.md §9): pulse lead, triangle bass, noise drums,
// synthesized on the fly and scheduled a little ahead on the audio clock. It keeps playing when
// you die (the rhythm keeps you going), and runs a little faster in speedrun mode.
import { getAudio, type AudioEngine } from "@/engine/audio/engine";

export type SongId = "menu" | "zone1" | "zone2" | "zone3";

interface Song {
  bpm: number;
  /** 16 tokens per bar: a note ("E5", "Bb4", "C#6"), "-" to hold, "." for a rest. */
  lead: string[];
  /** One chord root (MIDI) per bar, and which way the bass walks over it. */
  roots: number[];
  minor: boolean[];
  bass: Array<number | null>;
  /** 16 steps per bar: k kick, s snare, h hat, o open hat, x kick + hat, y kick + snare. */
  drums: string | null;
}

const MAJOR = false;
const MINOR = true;

const SONGS: Record<Exclude<SongId, "menu">, Song> = {
  zone1: {
    bpm: 150,
    lead: [
      "E5 - G5 - C6 - B5 - G5 - - - E5 - G5 -",
      "D5 - G5 - B5 - D6 - B5 - - - G5 - D5 -",
      "C5 - E5 - A5 - G5 - E5 - - - C5 - E5 -",
      "F5 - A5 - C6 - A5 - G5 - F5 - E5 - D5 -",
      "A5 - - - G5 - F5 - E5 - - - C5 - - -",
      "B4 - D5 - G5 - - - F5 - E5 - D5 - - -",
      "E5 - - - C5 - E5 - G5 - - - C6 - - -",
      "B5 - A5 - G5 - F5 - E5 - D5 - B4 - - -",
    ],
    roots: [48, 43, 45, 41, 41, 43, 48, 43],
    minor: [MAJOR, MAJOR, MINOR, MAJOR, MAJOR, MAJOR, MAJOR, MAJOR],
    bass: [0, null, 12, null, 0, null, 12, null, 0, null, 12, null, 0, null, 7, null],
    drums: "k.h.s.h.k.k.s.h.",
  },
  zone2: {
    bpm: 160,
    lead: [
      "A4 . A4 . C5 . A4 . E5 . D5 . C5 . B4 .",
      "A4 . A4 . C5 . A4 . G5 . E5 . D5 . C5 .",
      "F4 . A4 . C5 . F5 . E5 . C5 . A4 . C5 .",
      "G4 . B4 . D5 . G5 . F5 . D5 . B4 . D5 .",
      "E5 - - - D5 - C5 - D5 - E5 - A4 - - -",
      "G5 - - - E5 - C5 - E5 - G5 - C6 - - -",
      "B5 - A5 - G5 - D5 - G5 - - - B4 - - -",
      "G#5 - - - E5 - - - B4 - - - G#4 - - -",
    ],
    roots: [45, 45, 41, 43, 45, 48, 43, 40],
    minor: [MINOR, MINOR, MAJOR, MAJOR, MINOR, MAJOR, MAJOR, MAJOR],
    bass: [0, null, 0, null, 12, null, 0, null, 0, null, 0, null, 12, null, 10, null],
    drums: "k.hhy.hhk.hhy.ho",
  },
  zone3: {
    bpm: 140,
    lead: [
      "D5 - - - F5 - A5 - D6 - - - C#6 - A5 -",
      "Bb5 - A5 - G5 - F5 - G5 - - - F5 - D5 -",
      "G5 - - - Bb5 - D6 - C6 - Bb5 - A5 - G5 -",
      "A5 - - - E5 - C#5 - E5 - - - A4 - - -",
      "F5 - E5 - D5 - - - A4 - D5 - F5 - - -",
      "E5 - D5 - C5 - - - G4 - C5 - E5 - - -",
      "D5 - C5 - Bb4 - - - F4 - Bb4 - D5 - - -",
      "C#5 - D5 - E5 - F5 - G5 - - - A5 - - -",
    ],
    roots: [50, 46, 43, 45, 50, 48, 46, 45],
    minor: [MINOR, MAJOR, MINOR, MAJOR, MINOR, MAJOR, MAJOR, MAJOR],
    bass: [0, null, null, 0, 12, null, 0, null, 0, null, null, 0, 12, null, 7, null],
    drums: "k..ks.h.k..ks.h.",
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

export interface Note {
  step: number;
  midi: number;
  /** Length in steps. */
  steps: number;
}

/** Turn a song's lead into notes (step numbers from the start of the loop). */
export function leadNotes(song: Pick<Song, "lead">): Note[] {
  const tokens = song.lead.flatMap((bar) => {
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

// ---------------------------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------------------------

const waves = new WeakMap<AudioContext, Map<number, PeriodicWave>>();

/** A pulse wave of the given duty (12.5 %, 25 %: the NES's classic timbres). */
function pulse(ctx: AudioContext, duty: number): PeriodicWave {
  let byDuty = waves.get(ctx);
  if (!byDuty) {
    byDuty = new Map();
    waves.set(ctx, byDuty);
  }
  const hit = byDuty.get(duty);
  if (hit) return hit;
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
  const wave = ctx.createPeriodicWave(real, imag);
  byDuty.set(duty, wave);
  return wave;
}

function tone(a: AudioEngine, out: AudioNode, t: number, length: number, midi: number, { duty, type, peak, vibrato = 0 }: { duty?: number; type?: OscillatorType; peak: number; vibrato?: number }) {
  const ctx = a.ctx;
  const osc = ctx.createOscillator();
  if (duty) osc.setPeriodicWave(pulse(ctx, duty));
  else osc.type = type ?? "triangle";
  osc.frequency.setValueAtTime(hz(midi), t);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  env.gain.setValueAtTime(peak, t + Math.max(0.01, length * 0.6));
  env.gain.exponentialRampToValueAtTime(peak * 0.5, t + length * 0.9);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.04);
  osc.connect(env).connect(out);
  if (vibrato && length > 0.2) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 6;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(hz(midi) * vibrato, t + 0.2);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + length + 0.06);
  }
  osc.start(t);
  osc.stop(t + length + 0.06);
}

function drum(a: AudioEngine, out: AudioNode, t: number, kind: "k" | "s" | "h" | "o") {
  const ctx = a.ctx;
  if (kind === "k") {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    env.gain.setValueAtTime(0.55, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + 0.18);
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = a.noise;
  const hp = ctx.createBiquadFilter();
  hp.type = kind === "s" ? "bandpass" : "highpass";
  hp.frequency.value = kind === "s" ? 1800 : 7000;
  const env = ctx.createGain();
  const length = kind === "s" ? 0.13 : kind === "o" ? 0.16 : 0.04;
  env.gain.setValueAtTime(kind === "s" ? 0.42 : 0.16, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  source.connect(hp).connect(env).connect(out);
  source.start(t, (t * 7.3) % 1.5);
  source.stop(t + length + 0.02);
  if (kind === "s") tone(a, out, t, 0.06, 50, { type: "triangle", peak: 0.18 });
}

// ---------------------------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------------------------

const LOOKAHEAD = 0.15;

class MusicPlayer {
  private song: SongId | null = null;
  private notes: Note[] = [];
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** The next step to schedule, and when it plays. */
  private step = 0;
  private at = 0;
  private tempo = 1;
  private paused = false;

  /** Start a song, or carry on if it's already playing. `fast`: speedrun mode. */
  play(id: SongId, { fast = false, transpose = 0 }: { fast?: boolean; transpose?: number } = {}) {
    const audio = getAudio();
    if (!audio) return;
    this.tempo = fast ? 1.08 : 1;
    this.transpose = transpose;
    if (this.song === id && this.out) {
      this.resume();
      return;
    }
    this.fadeOut();
    this.song = id;
    this.notes = leadNotes(this.current());
    this.out = audio.ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(audio.buses.music);
    this.step = 0;
    this.at = audio.ctx.currentTime + 0.08;
    this.paused = false;
    this.timer ??= setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  private transpose = 0;

  private current(): Song {
    if (this.song === "menu") return { ...SONGS.zone1, bpm: 112, drums: null };
    return SONGS[this.song ?? "zone1"];
  }

  /** Quiet down while paused; the song picks up where it was. */
  pause() {
    // (Check before touching the audio engine: getAudio() creates it.)
    if (!this.out || this.paused) return;
    const audio = getAudio();
    if (!audio) return;
    this.paused = true;
    this.out.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.05);
  }

  resume() {
    if (!this.out || !this.paused) return;
    const audio = getAudio();
    if (!audio) return;
    this.paused = false;
    this.at = Math.max(this.at, audio.ctx.currentTime + 0.05);
    this.out.gain.cancelScheduledValues(audio.ctx.currentTime);
    this.out.gain.setTargetAtTime(0.9, audio.ctx.currentTime, 0.05);
  }

  stop() {
    this.fadeOut();
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** A little fanfare at the door; the music ducks under it. */
  jingle() {
    const audio = getAudio();
    if (!audio) return;
    const t = audio.ctx.currentTime + 0.02;
    const out = audio.ctx.createGain();
    out.gain.value = 1;
    out.connect(audio.buses.music);
    [72, 76, 79, 84].forEach((midi, i) => tone(audio, out, t + i * 0.075, 0.07, midi, { duty: 0.25, peak: 0.09 }));
    tone(audio, out, t + 0.3, 0.5, 88, { duty: 0.25, peak: 0.09, vibrato: 0.01 });
    tone(audio, out, t + 0.3, 0.5, 48, { type: "triangle", peak: 0.2 });
    setTimeout(() => out.disconnect(), 1500);
    if (this.out) {
      this.out.gain.setTargetAtTime(0.25, t, 0.03);
      this.out.gain.setTargetAtTime(this.paused ? 0.0001 : 0.9, t + 0.9, 0.2);
    }
  }

  private fadeOut() {
    const out = this.out;
    this.out = null;
    if (!out) return;
    const audio = getAudio();
    if (!audio) return;
    out.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.08);
    setTimeout(() => out.disconnect(), 600);
  }

  private schedule() {
    const audio = getAudio();
    if (!audio || !this.out || this.paused || !this.song) return;
    const song = this.current();
    const stepLength = 60 / (song.bpm * this.tempo) / 4;
    const loop = song.lead.length * 16;
    // Fell behind (a hidden tab)? Skip ahead instead of playing a burst.
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
    const k = this.transpose;
    for (const note of this.notes) {
      if (note.step === step) tone(a, out, t, note.steps * stepLength * 0.92, note.midi + k, { duty: 0.25, peak: 0.075, vibrato: 0.012 });
    }
    const root = song.roots[bar % song.roots.length]! + k;
    const walk = song.bass[inBar];
    if (walk !== null && walk !== undefined) tone(a, out, t, stepLength * 1.6, root - 12 + walk, { type: "triangle", peak: 0.22 });
    // A soft arpeggio on the off-beats.
    if (inBar % 4 === 2) {
      const third = song.minor[bar % song.minor.length] ? 3 : 4;
      const chord = [0, third, 7, 12];
      tone(a, out, t, stepLength * 0.8, root + 12 + chord[(inBar / 2 + bar) % 4]!, { duty: 0.125, peak: 0.03 });
    }
    const hit = song.drums?.[inBar];
    if (hit && hit !== ".") {
      if (hit === "x") {
        drum(a, out, t, "k");
        drum(a, out, t, "h");
      } else if (hit === "y") {
        drum(a, out, t, "k");
        drum(a, out, t, "s");
      } else drum(a, out, t, hit as "k" | "s" | "h" | "o");
    }
  }
}

export const music = new MusicPlayer();

/** The song for a level: its zone's tune, a little higher in Remix. */
export function songForLevel(levelId: string): { id: SongId; transpose: number } {
  const remix = levelId.startsWith("R");
  const zone = Number(levelId.replace(/^R/, "").split("-")[0]);
  return { id: `zone${Math.min(3, Math.max(1, zone))}` as SongId, transpose: remix ? 2 : 0 };
}
