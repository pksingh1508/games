// The tools' own sounds (Plan/10-last-pixel.md §9 "calm, ASMR-like sounds"): a roller's squish, a brush's
// whisper, a sponge on glass, a coin scratching foil, the mower's engine, a shovel scraping, the washer's
// hiss, an eraser's rub. Each is one voice of filtered noise (and, for the mower, an engine note) whose
// loudness follows how hard you're working, so a still tool is silent.
import { getAudio, type AudioEngine } from "@/engine/audio/engine";
import type { ToolId } from "../core/level";

interface Voice {
  noise: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  engine?: OscillatorNode;
  engineGain?: GainNode;
  wobble?: OscillatorNode;
}

const PROFILE: Record<ToolId, { type: BiquadFilterType; freq: number; q: number; level: number; wobble?: number }> = {
  roller: { type: "bandpass", freq: 850, q: 0.9, level: 0.5, wobble: 7 },
  brush: { type: "highpass", freq: 2600, q: 0.7, level: 0.22 },
  sponge: { type: "bandpass", freq: 1500, q: 2.5, level: 0.35, wobble: 4 },
  scratch: { type: "bandpass", freq: 3600, q: 1.4, level: 0.4, wobble: 23 },
  mower: { type: "lowpass", freq: 520, q: 0.8, level: 0.3 },
  shovel: { type: "lowpass", freq: 900, q: 1.2, level: 0.45, wobble: 9 },
  washer: { type: "highpass", freq: 2900, q: 0.6, level: 0.5 },
  eraser: { type: "bandpass", freq: 1150, q: 2, level: 0.35, wobble: 11 },
};

export class ToolSound {
  private voice: Voice | null = null;
  private tool: ToolId | null = null;
  private level = 0;

  /** Which tool's in your hand (its voice starts silent). */
  use(tool: ToolId) {
    if (this.tool === tool && this.voice) return;
    this.stop();
    const a = getAudio();
    if (!a) return;
    this.tool = tool;
    this.voice = build(a, tool);
  }

  /** How hard you're working it (0–1), and for the mower, how fast it's going (0–1). */
  set(level: number, speed = 0) {
    const a = getAudio();
    const v = this.voice;
    if (!a || !v || !this.tool) return;
    this.level += (Math.min(1, level) - this.level) * 0.25;
    const p = PROFILE[this.tool];
    const now = a.ctx.currentTime;
    if (this.tool === "mower") {
      // The engine idles, and revs as it goes.
      v.engine!.frequency.setTargetAtTime(48 + speed * 70, now, 0.08);
      v.engineGain!.gain.setTargetAtTime(0.05 + speed * 0.09, now, 0.08);
      v.gain.gain.setTargetAtTime(p.level * (0.15 + speed * 0.5), now, 0.08);
      return;
    }
    v.gain.gain.setTargetAtTime(p.level * this.level, now, 0.04);
  }

  stop() {
    const a = getAudio();
    const v = this.voice;
    this.voice = null;
    this.tool = null;
    this.level = 0;
    if (!v || !a) return;
    const now = a.ctx.currentTime;
    v.gain.gain.setTargetAtTime(0.0001, now, 0.05);
    v.engineGain?.gain.setTargetAtTime(0.0001, now, 0.05);
    setTimeout(() => {
      for (const n of [v.noise, v.engine, v.wobble]) {
        try {
          n?.stop();
        } catch {
          // Already stopped.
        }
      }
      v.gain.disconnect();
      v.engineGain?.disconnect();
    }, 400);
  }
}

function build(a: AudioEngine, tool: ToolId): Voice {
  const p = PROFILE[tool];
  const gain = a.ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(a.buses.sfx);
  const filter = a.ctx.createBiquadFilter();
  filter.type = p.type;
  filter.frequency.value = p.freq;
  filter.Q.value = p.q;
  filter.connect(gain);
  const noise = a.ctx.createBufferSource();
  noise.buffer = a.noise;
  noise.loop = true;
  noise.connect(filter);
  noise.start();
  const voice: Voice = { noise, filter, gain };
  if (p.wobble) {
    // A slow wobble on the filter: a squish, a scrape, a rub.
    const wobble = a.ctx.createOscillator();
    wobble.frequency.value = p.wobble;
    const depth = a.ctx.createGain();
    depth.gain.value = p.freq * 0.3;
    wobble.connect(depth).connect(filter.frequency);
    wobble.start();
    voice.wobble = wobble;
  }
  if (tool === "mower") {
    const engineGain = a.ctx.createGain();
    engineGain.gain.value = 0.0001;
    const lp = a.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 600;
    engineGain.connect(a.buses.sfx);
    lp.connect(engineGain);
    const engine = a.ctx.createOscillator();
    engine.type = "sawtooth";
    engine.frequency.value = 48;
    engine.connect(lp);
    engine.start();
    voice.engine = engine;
    voice.engineGain = engineGain;
  }
  return voice;
}
