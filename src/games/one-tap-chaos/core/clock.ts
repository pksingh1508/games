// Clocks (Plan/09-one-tap-chaos.md §12). The run's timeline lives on the high-resolution
// performance clock, the same one input events and frames are stamped with. The audio clock is
// mapped onto it continuously (via getOutputTimestamp), so every note is scheduled ahead on the
// audio clock to be heard at exactly the right moment, whatever the device's output delay.
//
// The player's calibrated tap offset delays what you see and how taps are judged by the same
// amount, so sound, picture and thumb all line up (Bluetooth headphones included).
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

/** Seconds on the performance clock, from an event's timeStamp (falls back to now). */
export function eventSeconds(timeStamp: number | undefined): number {
  const now = performance.now();
  if (typeof timeStamp !== "number" || !Number.isFinite(timeStamp) || Math.abs(timeStamp - now) > 1000) return now / 1000;
  return Math.min(timeStamp, now) / 1000;
}
