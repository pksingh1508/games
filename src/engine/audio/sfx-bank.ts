// A bank of retro sound effects made with ZzFX's sample builder (Plan/gameStack.md §9), played
// through the arcade's audio engine so the sound switch and volumes apply. Each game lists its
// sounds as ZzFX parameter arrays; they're built once, after the first tap or key press.
import { getAudio } from "./engine";

// ZzFX parameters: volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
// slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay,
// sustainVolume, decay, tremolo, filter.
export type ZzfxParams = ReadonlyArray<number | undefined>;

export interface PlayOptions {
  volume?: number;
  /** Playback rate: 1 is as built; 2 is an octave up. */
  rate?: number;
  /** -1 (left) to 1 (right). */
  pan?: number;
}

export interface SfxBank<N extends string> {
  readonly names: readonly N[];
  /** Build every sound (once). Safe to call often. */
  load(): Promise<void>;
  play(name: N, options?: PlayOptions): void;
}

export function createSfxBank<N extends string>(sounds: Readonly<Record<N, ZzfxParams>>, { gain = 0.45 }: { gain?: number } = {}): SfxBank<N> {
  const names = Object.keys(sounds) as N[];
  let buffers: Partial<Record<N, AudioBuffer>> | null = null;
  let loading: Promise<void> | null = null;
  const lastPlayed = new Map<N, number>();

  /**
   * ZzFX creates its own AudioContext when imported, so it's only loaded after a tap or key
   * press, and that context is closed straight away: only its sample builder is used.
   */
  const load = (): Promise<void> => {
    loading ??= (async () => {
      const audio = getAudio();
      if (!audio) {
        loading = null;
        return;
      }
      const { ZZFX } = await import("zzfx");
      void ZZFX.audioContext?.close?.().catch(() => {});
      const built: Partial<Record<N, AudioBuffer>> = {};
      for (const name of names) {
        const samples = ZZFX.buildSamples(...(sounds[name] as number[]));
        const buffer = audio.ctx.createBuffer(1, Math.max(1, samples.length), ZZFX.sampleRate);
        buffer.getChannelData(0).set(samples);
        built[name] = buffer;
      }
      buffers = built;
    })().catch(() => {
      loading = null;
    });
    return loading;
  };

  const play = (name: N, { volume = 1, rate = 1, pan = 0 }: PlayOptions = {}) => {
    const audio = getAudio();
    if (!audio) return;
    if (!buffers) {
      void load();
      return;
    }
    const buffer = buffers[name];
    if (!buffer) return;
    // The same sound twice within 30 ms just sounds louder: skip it.
    const now = audio.ctx.currentTime;
    if (now - (lastPlayed.get(name) ?? -1) < 0.03) return;
    lastPlayed.set(name, now);
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const level = audio.ctx.createGain();
    level.gain.value = volume * gain;
    let tail: AudioNode = source.connect(level);
    if (pan !== 0 && typeof audio.ctx.createStereoPanner === "function") {
      const panner = audio.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      tail = tail.connect(panner);
    }
    tail.connect(audio.buses.sfx);
    source.onended = () => level.disconnect();
    source.start();
  };

  return { names, load, play };
}
