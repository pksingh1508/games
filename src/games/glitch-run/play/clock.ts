// The audio clock, mapped onto the performance clock the game loop runs on (as One Tap Chaos does),
// so a sound can be scheduled to be heard at exactly the moment a tick happens, whatever the
// device's output delay.
import type { AudioEngine } from "@/engine/audio/engine";

export class AudioClock {
  /** Audible audio-clock time minus performance time, in seconds. Null until audio runs. */
  private delta: number | null = null;

  sync(audio: AudioEngine | null) {
    if (!audio || audio.ctx.state !== "running") return;
    const ctx = audio.ctx;
    let sample: number | null = null;
    if (typeof ctx.getOutputTimestamp === "function") {
      const stamp = ctx.getOutputTimestamp();
      if (stamp.contextTime && stamp.performanceTime && stamp.contextTime > 0 && stamp.performanceTime > 0) {
        sample = stamp.contextTime - stamp.performanceTime / 1000;
      }
    }
    if (sample === null) {
      const latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
      sample = ctx.currentTime - latency - performance.now() / 1000;
    }
    // Jump on a big change (a resumed context), otherwise glide so notes never jitter.
    if (this.delta === null || Math.abs(sample - this.delta) > 0.05) this.delta = sample;
    else this.delta += (sample - this.delta) * 0.05;
  }

  /** The audio-clock time at which a sound is heard at `seconds` on the performance clock. */
  toAudio(seconds: number): number | null {
    return this.delta === null ? null : seconds + this.delta;
  }
}
