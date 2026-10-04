// The music (Plan/10-last-pixel.md §9): calm while you clean (soft pads, slow plucks), and when Pix wakes the
// music cuts. Then the chase: plucked strings at a quick 120 beats a minute, the same beat the real Pix
// blinks on (its decoys don't keep it). The finale's chase is the same tune in a minor key. All generated.
import { envelope, filter, getAudio, playTone, type AudioEngine } from "@/engine/audio/engine";
import { BPM } from "../core/constants";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export type Song = "menu" | "calm" | "chase" | "finale";

interface Tune {
  roots: number[];
  minor: boolean[];
  bpm: number;
  /** Steps per beat. */
  steps: number;
  chase: boolean;
}

const TUNES: Record<Song, Tune> = {
  menu: { roots: [60, 65, 57, 62], minor: [false, false, true, true], bpm: 70, steps: 2, chase: false },
  calm: { roots: [62, 57, 59, 55], minor: [false, false, true, false], bpm: 76, steps: 2, chase: false },
  chase: { roots: [64, 60, 62, 59], minor: [false, false, false, true], bpm: BPM, steps: 4, chase: true },
  finale: { roots: [57, 53, 55, 52], minor: [true, false, false, true], bpm: BPM, steps: 4, chase: true },
};

const CALM_MELODY = [0, 4, 7, 4, 9, 7, 4, 2, 0, 2, 4, 7, 4, 2, 0, -1];
const CHASE_MELODY = [7, -1, 9, 7, 4, -1, 2, 4, 7, 9, 11, 9, 7, -1, 4, 2];

function pad(a: AudioEngine, out: AudioNode, t: number, midi: number, length: number) {
  const lp = filter(a, envelope(a, out, t, { peak: 0.05, attack: 0.7, hold: Math.max(0.1, length - 1.4), decay: 0.7 }), "lowpass", 1100);
  playTone(a, lp, t, length, hz(midi), "triangle");
  playTone(a, lp, t, length, hz(midi) * 1.004, "sine");
}

function pluck(a: AudioEngine, out: AudioNode, t: number, midi: number, peak: number, decay: number) {
  const lp = filter(a, envelope(a, out, t, { peak, attack: 0.003, decay }), "lowpass", 2400, 2);
  playTone(a, lp, t, decay, hz(midi), "sawtooth");
}

class Music {
  private song: Song | null = null;
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private next = 0;
  private step = 0;
  private paused = false;

  /** Start (or switch to) a song (from a tap or a key: audio may start). */
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
    const chase = TUNES[song].chase;
    out.gain.value = chase ? 0.9 : 0.0001;
    if (!chase) out.gain.setTargetAtTime(0.9, a.ctx.currentTime, 0.5);
    out.connect(a.buses.music);
    this.out = out;
    this.next = a.ctx.currentTime + 0.03;
    this.step = 0;
    this.paused = false;
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }

  /** Cut it (the switch: Pix wakes, and the room goes quiet). */
  cut() {
    const a = getAudio();
    if (!a || !this.out) return;
    this.out.gain.cancelScheduledValues(a.ctx.currentTime);
    this.out.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.02);
    const out = this.out;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.out = null;
    this.song = null;
    setTimeout(() => out.disconnect(), 600);
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
    const stepLen = 60 / tune.bpm / tune.steps;
    while (this.next < a.ctx.currentTime + 0.35) {
      const t = this.next;
      const perBar = tune.steps * 4;
      const bar = Math.floor(this.step / perBar) % tune.roots.length;
      const root = tune.roots[bar]!;
      const n = this.step % perBar;
      const scale = tune.minor[bar] ? [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19] : [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
      if (tune.chase) {
        // Bass on the beat; a plucked tune over it.
        if (n % tune.steps === 0) pluck(a, this.out, t, root - 24 + (n % (tune.steps * 2) === 0 ? 0 : 7), 0.12, 0.18);
        const deg = CHASE_MELODY[this.step % CHASE_MELODY.length]!;
        if (deg >= 0 && n % 2 === 0) pluck(a, this.out, t, root + scale[Math.min(scale.length - 1, deg)]!, 0.06, 0.16);
        if (n % tune.steps === 2) pluck(a, this.out, t, root + 7, 0.025, 0.08);
      } else {
        if (n === 0) {
          const third = tune.minor[bar] ? 3 : 4;
          for (const iv of [0, third, 7]) pad(a, this.out, t, root - 12 + iv, stepLen * perBar);
        }
        const deg = CALM_MELODY[this.step % CALM_MELODY.length]!;
        if (deg >= 0 && n % 2 === 0) pluck(a, this.out, t, root + 12 + scale[Math.min(scale.length - 1, deg)]!, 0.035, 0.9);
      }
      this.next += stepLen;
      this.step++;
    }
  }
}

export const music = new Music();

/** 100%: a happy little run up. */
export function fanfare() {
  const a = getAudio();
  if (!a) return;
  const t = a.ctx.currentTime + 0.02;
  [72, 76, 79, 84, 88].forEach((m, i) => pluck(a, a.buses.sfx, t + i * 0.08, m, 0.09, 0.5));
}
