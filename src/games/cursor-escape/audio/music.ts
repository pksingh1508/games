// The music (Plan/12-cursor-escape.md §9): calm, like an old screensaver. Soft pads under a slow, bell-
// like tune, a different key for each drive; in System32 it starts to go wrong (notes drop out, the pads
// drift out of tune). Plus DeskOS 98's startup and shutdown jingles. All generated: no files.
import { envelope, filter, getAudio, playTone, type AudioEngine } from "@/engine/audio/engine";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export type Song = "desktop" | "control" | "internet" | "system" | "boss" | "menu";

interface Tune {
  /** Chord roots (MIDI), a bar each. */
  roots: number[];
  minor: boolean[];
  /** Beats a minute. */
  bpm: number;
  /** Notes go missing, pads detune. */
  broken: number;
}

const TUNES: Record<Song, Tune> = {
  menu: { roots: [57, 53, 60, 55], minor: [true, false, false, false], bpm: 72, broken: 0 },
  desktop: { roots: [60, 57, 53, 55], minor: [false, true, false, false], bpm: 76, broken: 0 },
  control: { roots: [62, 59, 55, 57], minor: [false, true, false, false], bpm: 80, broken: 0 },
  internet: { roots: [64, 60, 57, 62], minor: [true, false, true, false], bpm: 84, broken: 0.05 },
  system: { roots: [57, 58, 53, 52], minor: [true, false, false, true], bpm: 70, broken: 0.22 },
  boss: { roots: [52, 53, 52, 50], minor: [true, false, true, false], bpm: 96, broken: 0.3 },
};

const MELODY = [0, 2, 4, 7, 4, 2, 4, 9, 7, 4, 2, 0, 2, 4, 2, -1];

function pad(a: AudioEngine, out: AudioNode, t: number, midi: number, length: number, detune: number) {
  const lp = filter(a, envelope(a, out, t, { peak: 0.07, attack: 0.6, hold: length - 1.2, decay: 0.8 }), "lowpass", 1400);
  playTone(a, lp, t, length, hz(midi) * (1 + detune), "triangle");
  playTone(a, lp, t, length, hz(midi) * (1.003 - detune), "sine");
}

function bell(a: AudioEngine, out: AudioNode, t: number, midi: number) {
  playTone(a, envelope(a, out, t, { peak: 0.09, attack: 0.005, decay: 1.1 }), t, 1.1, hz(midi), "sine");
  playTone(a, envelope(a, out, t, { peak: 0.025, attack: 0.005, decay: 0.5 }), t, 0.5, hz(midi) * 2.76, "sine");
}

class Music {
  private song: Song | null = null;
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private next = 0;
  private step = 0;
  private paused = false;

  /** Start (or switch to) a song. From a click or a key (audio may start). */
  play(song: Song) {
    const a = getAudio();
    if (!a) return;
    if (this.song === song && this.out) {
      this.resume();
      return;
    }
    this.stop();
    this.song = song;
    const out = a.ctx.createGain();
    out.gain.value = 0.0001;
    out.gain.setTargetAtTime(0.9, a.ctx.currentTime, 0.4);
    out.connect(a.buses.music);
    this.out = out;
    this.next = a.ctx.currentTime + 0.1;
    this.step = 0;
    this.paused = false;
    this.timer = setInterval(() => this.schedule(), 120);
    this.schedule();
  }

  stop() {
    const a = getAudio();
    const out = this.out;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.out = null;
    this.song = null;
    if (out && a) {
      out.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.15);
      setTimeout(() => out.disconnect(), 900);
    }
  }

  pause() {
    const a = getAudio();
    if (!a || !this.out || this.paused) return;
    this.paused = true;
    this.out.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.1);
  }

  resume() {
    const a = getAudio();
    if (!a || !this.out || !this.paused) return;
    this.paused = false;
    this.out.gain.cancelScheduledValues(a.ctx.currentTime);
    this.out.gain.setTargetAtTime(0.9, a.ctx.currentTime, 0.2);
    this.next = Math.max(this.next, a.ctx.currentTime + 0.05);
  }

  private schedule() {
    const a = getAudio();
    if (!a || !this.out || !this.song || this.paused) return;
    const tune = TUNES[this.song];
    const beat = 60 / tune.bpm;
    while (this.next < a.ctx.currentTime + 0.4) {
      const t = this.next;
      const bar = Math.floor(this.step / 8) % tune.roots.length;
      const root = tune.roots[bar]!;
      const n = this.step % 8;
      // A broken machine: deterministic dropouts.
      const glitch = ((this.step * 37) % 100) / 100 < tune.broken;
      if (n === 0) {
        const third = tune.minor[bar] ? 3 : 4;
        const detune = glitch ? 0.012 : 0;
        for (const iv of [0, third, 7]) pad(a, this.out, t, root - 12 + iv, beat * 8, detune);
      }
      if (n % 2 === 0 && !glitch) {
        const scale = tune.minor[bar] ? [0, 2, 3, 5, 7, 8, 10, 12, 14, 15] : [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
        const deg = MELODY[(this.step / 2) % MELODY.length]!;
        const note = root + 12 + (deg < 0 ? -1 : scale[Math.min(scale.length - 1, deg)]!);
        bell(a, this.out, t, note);
      }
      this.next += beat / 2;
      this.step++;
    }
  }
}

export const music = new Music();

/** DeskOS 98 starting up: a rising, airy chord. */
export function startupJingle() {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime + 0.05;
  [60, 64, 67, 72, 76].forEach((m, i) => bell(a, a.buses.sfx, t + i * 0.12, m));
  pad(a, a.buses.sfx, t, 48, 2.4, 0);
}

/** …and shutting down: falling, and fading. */
export function shutdownJingle() {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime + 0.05;
  [76, 72, 67, 64, 60, 55].forEach((m, i) => bell(a, a.buses.sfx, t + i * 0.16, m));
}
