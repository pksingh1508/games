// The soundtrack (Plan/07-glitch-run.md §9): driving chiptune, scheduled step by step from the run's
// own beats (so the music and the track never drift apart). Corruption eats into it: a bitcrusher
// grinds the sound down and the arpeggio starts to stutter. In a Kernel Panic, an alarm joins in.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

interface Song {
  /** Bass roots per bar (8 bars), and whether each chord is minor. */
  roots: number[];
  minor: boolean[];
}

/** One tune per mood: the boot, the middle stages, the late ones, the end. */
export const SONGS: Song[] = [
  { roots: [45, 41, 48, 43, 45, 41, 43, 40], minor: [true, false, false, false, true, false, false, false] },
  { roots: [40, 36, 43, 38, 40, 36, 38, 35], minor: [true, false, false, false, true, false, false, false] },
  { roots: [38, 41, 36, 43, 38, 34, 36, 37], minor: [true, false, false, false, true, false, false, false] },
  { roots: [42, 38, 45, 40, 42, 38, 40, 41], minor: [true, false, false, false, true, false, true, false] },
];

function triad(root: number, minor: boolean) {
  return [root + 24, root + 24 + (minor ? 3 : 4), root + 31];
}

function kick(a: AudioEngine, out: AudioNode, t: number) {
  playTone(a, envelope(a, out, t, { peak: 0.9, attack: 0.002, decay: 0.16 }), t, 0.18, 150, "sine", 45);
}

function snare(a: AudioEngine, out: AudioNode, t: number) {
  playNoise(a, filter(a, envelope(a, out, t, { peak: 0.45, attack: 0.001, decay: 0.1 }), "bandpass", 2200, 0.7), t, 0.12, t * 7);
  playTone(a, envelope(a, out, t, { peak: 0.25, attack: 0.001, decay: 0.06 }), t, 0.08, 220, "triangle", 170);
}

function hat(a: AudioEngine, out: AudioNode, t: number, peak: number) {
  playNoise(a, filter(a, envelope(a, out, t, { peak, attack: 0.001, decay: 0.03 }), "highpass", 8000), t, 0.04, t * 13);
}

function bass(a: AudioEngine, out: AudioNode, t: number, midi: number, length: number) {
  const lp = filter(a, envelope(a, out, t, { peak: 0.28, attack: 0.004, hold: length * 0.4, decay: length * 0.5 }), "lowpass", 900, 3);
  playTone(a, lp, t, length, hz(midi), "sawtooth");
}

function lead(a: AudioEngine, out: AudioNode, t: number, midi: number, length: number, peak: number) {
  const lp = filter(a, envelope(a, out, t, { peak, attack: 0.003, decay: length }), "lowpass", 3200);
  playTone(a, lp, t, length, hz(midi), "square");
}

/** A bitcrusher's curve: the wave rounded to `levels` steps. */
function crushCurve(levels: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(x * levels) / levels;
  }
  return curve;
}

class Music {
  private out: GainNode | null = null;
  private crusher: WaveShaperNode | null = null;
  private dry: GainNode | null = null;
  private wet: GainNode | null = null;
  private levels = 0;
  private song = 0;
  private corruption = 0;
  private panic = false;
  private lastLead = 60;
  private paused = false;

  /** Ready the chain (from a tap or key: audio may start). */
  start(song: number) {
    const a = getAudio();
    if (!a) return;
    this.song = song % SONGS.length;
    if (this.out) {
      this.resume();
      return;
    }
    this.out = a.ctx.createGain();
    this.out.gain.value = 0.8;
    this.dry = a.ctx.createGain();
    this.wet = a.ctx.createGain();
    this.crusher = a.ctx.createWaveShaper();
    this.out.connect(this.dry).connect(a.buses.music);
    this.out.connect(this.crusher).connect(this.wet).connect(a.buses.music);
    this.setCorruption(0, false);
  }

  stop() {
    const a = getAudio();
    const out = this.out;
    this.out = null;
    if (!out || !a) return;
    out.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.08);
    setTimeout(() => out.disconnect(), 600);
  }

  pause() {
    const a = getAudio();
    if (!a || !this.out || this.paused) return;
    this.paused = true;
    this.out.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.05);
  }

  resume() {
    const a = getAudio();
    if (!a || !this.out || !this.paused) return;
    this.paused = false;
    this.out.gain.cancelScheduledValues(a.ctx.currentTime);
    this.out.gain.setTargetAtTime(0.8, a.ctx.currentTime, 0.05);
  }

  /** The worse the corruption, the more the bitcrusher eats the music. */
  setCorruption(corruption: number, panic: boolean) {
    const a = getAudio();
    this.corruption = corruption;
    this.panic = panic;
    if (!a || !this.crusher || !this.dry || !this.wet) return;
    const levels = Math.max(3, Math.round(32 - (corruption / 100) * 27 - (panic ? 3 : 0)));
    if (levels !== this.levels) {
      this.levels = levels;
      this.crusher.curve = crushCurve(levels);
    }
    const mix = Math.min(1, corruption / 70 + (panic ? 0.3 : 0));
    this.dry.gain.setTargetAtTime(1 - mix * 0.8, a.ctx.currentTime, 0.1);
    this.wet.gain.setTargetAtTime(mix, a.ctx.currentTime, 0.1);
  }

  /**
   * Schedule one sixteenth: `beat` of the run, `n` (0–3) within it, at audio time `t`, `dt` long.
   * `seed` makes the stutters the same every time the run is played the same way.
   */
  step(beat: number, n: number, t: number, dt: number) {
    const a = getAudio();
    if (!a || !this.out || this.paused) return;
    const out = this.out;
    const song = SONGS[this.song]!;
    const bar = Math.floor(beat / 4) % 8;
    const inBar = beat % 4;
    const root = song.roots[bar]!;
    const chord = triad(root, song.minor[bar]!);
    if (n === 0) kick(a, out, t);
    if (n === 2 && inBar === 3) kick(a, out, t);
    if (n === 0 && (inBar === 1 || inBar === 3)) snare(a, out, t);
    hat(a, out, t, n === 2 ? 0.16 : 0.06);
    if (n === 0 || n === 2) bass(a, out, t, n === 0 ? root : root + 12, dt * 1.8);
    // The arpeggio: up and down the chord. Corruption makes it stutter (the same note again, or nothing).
    const pattern = [0, 1, 2, 1];
    let note = chord[pattern[n]!]! + (bar % 2 && n === 3 ? 12 : 0);
    const glitch = ((beat * 7 + n * 13) % 100) / 100;
    if (glitch < this.corruption / 160) note = this.lastLead;
    else if (glitch > 1 - this.corruption / 400) return;
    this.lastLead = note;
    lead(a, out, t, note, dt * 0.9, 0.05);
    if (this.panic && n === 0) lead(a, out, t, (beat % 2 ? 84 : 79), dt * 2, 0.04);
  }
}

export const music = new Music();
