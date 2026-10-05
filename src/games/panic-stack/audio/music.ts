// The music (Plan/11-panic-stack.md §9): a bouncy track that speeds up with panic, with a heartbeat layer above
// 70%. A walking bass, offbeat chord stabs, a cheeky little tune and a kit, all synthesized and scheduled a
// little ahead on the audio clock, through the music bus. The tempo is read every step, so it rises smoothly.
import { envelope, filter, getAudio, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Four bars: I – vi – IV – V in C.
const ROOTS = [48, 45, 41, 43];
const CHORDS = [
  [60, 64, 67],
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
];
/** The tune: one note per eighth (0 rests), two bars a line. */
const TUNE = [
  [72, 0, 76, 79, 0, 76, 74, 0],
  [72, 0, 69, 0, 72, 74, 0, 0],
  [69, 0, 72, 77, 0, 76, 74, 0],
  [71, 0, 74, 0, 79, 0, 77, 76],
];

export class Music {
  private timer = 0;
  private nextAt = 0;
  private step = 0;
  private out: GainNode | null = null;
  private audio: AudioEngine | null = null;
  /** 0–1, read every step. */
  panic = 0;
  /** The calm menu tune (no drums, slower). */
  private calm = false;

  get playing() {
    return this.timer !== 0;
  }

  start(calm = false) {
    if (this.timer && this.calm === calm) return;
    if (this.timer) this.stop();
    this.calm = calm;
    const a = getAudio();
    if (!a) return;
    this.audio = a;
    const out = a.ctx.createGain();
    out.gain.setValueAtTime(0.0001, a.ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(0.55, a.ctx.currentTime + 0.6);
    out.connect(filter(a, a.buses.music, "lowpass", 5200));
    this.out = out;
    this.nextAt = a.ctx.currentTime + 0.08;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 80);
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
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      window.setTimeout(() => out.disconnect(), 600);
    }
    this.out = null;
  }

  private eighth() {
    const bpm = this.calm ? 96 : 112 * (1 + 0.4 * this.panic);
    return 60 / bpm / 2;
  }

  private schedule() {
    const a = this.audio;
    const out = this.out;
    if (!a || !out) return;
    while (this.nextAt < a.ctx.currentTime + 0.3) {
      this.play(a, out, this.step, this.nextAt);
      this.nextAt += this.eighth();
      this.step++;
    }
  }

  private play(a: AudioEngine, out: AudioNode, step: number, t: number) {
    const bar = Math.floor(step / 8) % 4;
    const e = step % 8;
    // Bouncy bass: root, octave, root, fifth.
    if (e % 2 === 0) {
      const n = ROOTS[bar]! + [0, 12, 0, 7][e / 2]!;
      playTone(a, envelope(a, out, t, { peak: 0.16, attack: 0.005, decay: 0.18 }), t, 0.2, hz(n), "triangle");
    }
    // Offbeat stabs.
    if (e % 2 === 1 && !(this.calm && e % 4 === 3)) {
      for (const n of CHORDS[bar]!) playTone(a, envelope(a, out, t, { peak: 0.03, attack: 0.004, decay: 0.12 }), t, 0.14, hz(n), "square");
    }
    const note = TUNE[bar]![e]!;
    if (note) playTone(a, envelope(a, out, t, { peak: 0.05, attack: 0.004, decay: 0.22 }), t, 0.25, hz(this.panic > 0.7 ? note + 1 : note), "triangle");
    if (!this.calm) {
      // Kick on 1 and 3, snare on 2 and 4, hats on the eighths.
      if (e === 0 || e === 4) playTone(a, envelope(a, out, t, { peak: 0.3, attack: 0.002, decay: 0.12 }), t, 0.14, 110, "sine", 45);
      if (e === 2 || e === 6) playNoise(a, filter(a, envelope(a, out, t, { peak: 0.08, attack: 0.002, decay: 0.08 }), "bandpass", 1800), t, 0.1, step * 0.11);
      playNoise(a, filter(a, envelope(a, out, t, { peak: e % 2 ? 0.025 : 0.015, attack: 0.002, decay: 0.03 }), "highpass", 7000), t, 0.04, step * 0.07);
      // The heartbeat above 70% panic: lub-dub, every beat.
      if (this.panic > 0.7 && e % 2 === 0) {
        const k = Math.min(1, (this.panic - 0.7) / 0.3);
        playTone(a, envelope(a, out, t, { peak: 0.35 * k, attack: 0.005, decay: 0.1 }), t, 0.12, 58, "sine", 40);
        const t2 = t + 0.13;
        playTone(a, envelope(a, out, t2, { peak: 0.25 * k, attack: 0.005, decay: 0.09 }), t2, 0.1, 52, "sine", 38);
      }
    }
  }
}

export const music = new Music();
