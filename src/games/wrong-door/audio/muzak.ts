// The lobby's music (Plan/13-wrong-door.md §9): elevator muzak, for a hotel with no elevators. A soft bossa:
// electric-piano chords (I–vi–ii–V), a walking bass, a vibraphone tune and a shaker, scheduled a little
// ahead on the audio clock, through the music bus.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const BPM = 104;
const EIGHTH = 60 / BPM / 2;

const CHORDS = [
  { notes: [60, 64, 67, 71], bass: [36, 43] },
  { notes: [57, 60, 64, 67], bass: [33, 40] },
  { notes: [62, 65, 69, 72], bass: [38, 45] },
  { notes: [55, 59, 62, 65], bass: [31, 38] },
];
/** Bossa stabs, in eighths of the bar. */
const STABS = [0, 3, 6];
/** The tune, two bars at a time (eighths; 0 is a rest). */
const TUNE = [
  [76, 0, 79, 0, 0, 83, 0, 81],
  [79, 0, 0, 76, 0, 0, 72, 0],
  [77, 0, 81, 0, 0, 84, 0, 83],
  [81, 0, 79, 0, 77, 0, 74, 0],
];

export class Muzak {
  private timer = 0;
  private nextAt = 0;
  private step = 0;
  private out: GainNode | null = null;
  private audio: AudioEngine | null = null;

  get playing() {
    return this.timer !== 0;
  }

  start() {
    if (this.timer) return;
    const a = getAudio();
    if (!a) return;
    this.audio = a;
    const out = a.ctx.createGain();
    out.gain.setValueAtTime(0.0001, a.ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(0.5, a.ctx.currentTime + 1.2);
    out.connect(filter(a, a.buses.music, "lowpass", 3200));
    this.out = out;
    this.nextAt = a.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 90);
    this.schedule();
  }

  stop() {
    if (!this.timer) return;
    window.clearInterval(this.timer);
    this.timer = 0;
    const a = this.audio;
    const out = this.out;
    if (a && out) {
      const now = a.ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      window.setTimeout(() => out.disconnect(), 800);
    }
    this.out = null;
  }

  private schedule() {
    const a = this.audio;
    const out = this.out;
    if (!a || !out) return;
    while (this.nextAt < a.ctx.currentTime + 0.35) {
      this.play(a, out, this.step, this.nextAt);
      this.nextAt += EIGHTH;
      this.step++;
    }
  }

  private play(a: AudioEngine, out: AudioNode, step: number, t: number) {
    const bar = Math.floor(step / 8) % CHORDS.length;
    const e = step % 8;
    const chord = CHORDS[bar]!;
    if (STABS.includes(e)) {
      for (const n of chord.notes) {
        playTone(a, envelope(a, out, t, { peak: 0.045, attack: 0.012, decay: 0.7 }), t, 0.75, hz(n), "sine");
        playTone(a, envelope(a, out, t, { peak: 0.012, attack: 0.005, decay: 0.2 }), t, 0.25, hz(n + 12), "sine");
      }
    }
    if (e === 0 || e === 4) {
      const n = chord.bass[e === 0 ? 0 : 1]!;
      playTone(a, envelope(a, out, t, { peak: 0.16, attack: 0.01, decay: 0.45 }), t, 0.5, hz(n + 12), "triangle");
    }
    const tune = TUNE[bar]![e]!;
    if (tune) playTone(a, envelope(a, out, t, { peak: 0.05, attack: 0.004, decay: 0.9 }), t, 0.95, hz(tune), "sine");
    // The shaker: on every eighth, accented off the beat.
    playNoise(a, filter(a, envelope(a, out, t, { peak: e % 2 ? 0.035 : 0.018, attack: 0.004, decay: 0.05 }), "highpass", 6500), t, 0.07, step * 0.07);
  }
}
