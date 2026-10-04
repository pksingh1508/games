// The sound of each place (Plan/05-fake-floor.md §9): rain on the rooftops (it gusts on the same beat
// as the splashes you see), the lantern chains creaking at each end of their swing, the gallery's hum,
// a cold shimmer in the mirrors, and the Floor breathing. Built from the engine's shared noise and a
// few oscillators, on the effects bus.
import { getAudio } from "@/engine/audio/engine";
import type { Env } from "../core/room";
import { SWING_PERIOD } from "../render/lighting";
import { gustAt } from "../render/weather";
import { playSfx } from "./sfx";

const RAIN_LEVEL = { none: 0, light: 0.05, steady: 0.09, heavy: 0.14 } as const;

class Ambience {
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private rain: GainNode | null = null;
  private breath: GainNode | null = null;
  private master: GainNode | null = null;
  private env: Env | null = null;
  private lastSwing = -1;
  private lastBeat = -1;
  private paused = false;

  /** Start the room's ambience. */
  start(env: Env) {
    this.stop();
    const audio = getAudio();
    if (!audio) return;
    this.env = env;
    this.paused = false;
    const ctx = audio.ctx;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    master.connect(audio.buses.sfx);
    this.master = master;
    this.nodes.push(master);

    if (env.rain !== "none") {
      const source = ctx.createBufferSource();
      source.buffer = audio.noise;
      source.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1400;
      band.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.value = RAIN_LEVEL[env.rain];
      source.connect(band).connect(gain).connect(master);
      source.start();
      this.rain = gain;
      this.sources.push(source);
      this.nodes.push(band, gain);
    }

    const drone = (freqs: number[], level: number, type: OscillatorType = "sine") => {
      const gain = ctx.createGain();
      gain.gain.value = level;
      gain.connect(master);
      this.nodes.push(gain);
      for (const f of freqs) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = f;
        osc.connect(gain);
        osc.start();
        this.sources.push(osc);
      }
      return gain;
    };
    if (env.look === 5) drone([55, 110.4], 0.03);
    if (env.look === 4) drone([880, 881.5, 1318], 0.006);
    if (env.look === 6) this.breath = drone([41, 61.5], 0.0001, "triangle");
  }

  /** Per frame: the rain swells with each gust, chains creak, the Floor breathes. */
  update(seconds: number) {
    const audio = getAudio();
    if (!audio || !this.env || this.paused) return;
    const now = audio.ctx.currentTime;
    if (this.rain) this.rain.gain.setTargetAtTime(RAIN_LEVEL[this.env.rain] * (0.45 + 1.1 * gustAt(seconds)), now, 0.1);
    if (this.env.lantern) {
      const swing = Math.floor((seconds / SWING_PERIOD) * 2);
      if (swing !== this.lastSwing) {
        if (this.lastSwing >= 0) playSfx("chain", { volume: 0.5, rate: swing % 2 ? 1 : 0.85 });
        this.lastSwing = swing;
      }
    }
    if (this.breath) {
      const breathe = 0.5 + 0.5 * Math.sin((seconds / 4) * Math.PI * 2);
      this.breath.gain.setTargetAtTime(0.012 + 0.03 * breathe, now, 0.2);
      const beat = Math.floor(seconds / 1.4);
      if (beat !== this.lastBeat) {
        if (this.lastBeat >= 0) playSfx("thump", { volume: 0.5 });
        this.lastBeat = beat;
      }
    }
  }

  pause() {
    const audio = getAudio();
    if (!audio || !this.master) return;
    this.paused = true;
    this.master.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.08);
  }

  resume() {
    const audio = getAudio();
    if (!audio || !this.master) return;
    this.paused = false;
    this.master.gain.setTargetAtTime(1, audio.ctx.currentTime, 0.2);
  }

  stop() {
    const audio = getAudio();
    const master = this.master;
    const sources = this.sources;
    const nodes = this.nodes;
    this.sources = [];
    this.nodes = [];
    this.master = null;
    this.rain = null;
    this.breath = null;
    this.env = null;
    this.lastSwing = -1;
    this.lastBeat = -1;
    if (!audio || !master) return;
    master.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.1);
    setTimeout(() => {
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          // Already stopped.
        }
      }
      for (const n of nodes) n.disconnect();
    }, 500);
  }
}

export const ambience = new Ambience();
