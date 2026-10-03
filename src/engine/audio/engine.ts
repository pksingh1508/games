// The shared Web Audio engine (Plan/gameStack.md §9.2): one AudioContext with gain buses,
// master → music / sfx. It's created on the first sound (browsers keep audio suspended until
// the player taps or presses a key), follows the global volume settings, and goes quiet while
// the tab is hidden. Games build their sounds on top of it.
import { settingsSave } from "../settings";

export type Bus = "music" | "sfx";

export interface AudioEngine {
  ctx: AudioContext;
  master: GainNode;
  buses: Record<Bus, GainNode>;
  /** Two seconds of white noise, shared by every noisy sound. */
  noise: AudioBuffer;
}

let engine: AudioEngine | null = null;

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Deterministic noise: no Math.random, and every load sounds the same.
  let seed = 22222;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data[i] = (seed / 0x3fffffff) - 1;
  }
  return buffer;
}

function applyVolumes(target: AudioEngine) {
  const settings = settingsSave.get();
  const now = target.ctx.currentTime;
  target.master.gain.setTargetAtTime(settings.sound ? settings.volume.master : 0, now, 0.02);
  target.buses.music.gain.setTargetAtTime(settings.volume.music, now, 0.02);
  target.buses.sfx.gain.setTargetAtTime(settings.volume.sfx, now, 0.02);
}

function create(): AudioEngine | null {
  const Context =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;

  const ctx = new Context({ latencyHint: "interactive" });
  const master = ctx.createGain();
  // A gentle limiter, so stacked sounds never clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter).connect(ctx.destination);

  const music = ctx.createGain();
  const sfx = ctx.createGain();
  music.connect(master);
  sfx.connect(master);

  const created: AudioEngine = { ctx, master, buses: { music, sfx }, noise: makeNoise(ctx) };
  applyVolumes(created);
  settingsSave.subscribe(() => applyVolumes(created));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void ctx.suspend().catch(() => {});
    else void ctx.resume().catch(() => {});
  });
  return created;
}

/** True when sounds should play at all (the master switch is on and the volume isn't zero). */
export function soundOn(): boolean {
  const settings = settingsSave.get();
  return settings.sound && settings.volume.master > 0;
}

/**
 * The engine, created on first use. Returns null on the server, when Web Audio is missing,
 * or when sound is switched off (so callers can skip building sounds nobody will hear).
 */
export function getAudio(): AudioEngine | null {
  if (typeof window === "undefined" || !soundOn()) return null;
  engine ??= create();
  if (engine && engine.ctx.state === "suspended" && document.visibilityState === "visible") {
    void engine.ctx.resume().catch(() => {});
  }
  return engine;
}

// ---------------------------------------------------------------------------------------------
// Small building blocks for synthesized sounds.
// ---------------------------------------------------------------------------------------------

/** A gain node with an attack/decay envelope, connected to `destination`. */
export function envelope(
  audio: AudioEngine,
  destination: AudioNode,
  at: number,
  { peak, attack, decay, hold = 0 }: { peak: number; attack: number; decay: number; hold?: number },
): GainNode {
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack);
  if (hold > 0) gain.gain.setValueAtTime(Math.max(peak, 0.0002), at + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + decay);
  gain.connect(destination);
  return gain;
}

/** Play the shared noise (looped, so any length works) into `destination`. */
export function playNoise(audio: AudioEngine, destination: AudioNode, at: number, duration: number, offset = 0) {
  const source = audio.ctx.createBufferSource();
  source.buffer = audio.noise;
  source.loop = true;
  source.connect(destination);
  source.start(at, offset % audio.noise.duration);
  source.stop(at + duration);
  return source;
}

/** A single oscillator note into `destination`. */
export function playTone(
  audio: AudioEngine,
  destination: AudioNode,
  at: number,
  duration: number,
  frequency: number,
  type: OscillatorType = "sine",
  glideTo?: number,
) {
  const osc = audio.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + duration);
  osc.connect(destination);
  osc.start(at);
  osc.stop(at + duration + 0.05);
  return osc;
}

/** A biquad filter connected to `destination`. */
export function filter(
  audio: AudioEngine,
  destination: AudioNode,
  type: BiquadFilterType,
  frequency: number,
  q = 1,
): BiquadFilterNode {
  const node = audio.ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  node.connect(destination);
  return node;
}
