// Sounds that change while they play (Plan/08-almost-there.md §9, §11): the charge's rising tone,
// so timing can be learned by ear; the whoosh of a fall, louder the longer you fall; and each
// zone's air (wind on the cliffs, drips in the ice, the clock's tick in the tower).
import { getAudio, type AudioEngine } from "@/engine/audio/engine";
import type { ZoneId } from "../core/mountain";

/** The charge: a soft tone sliding up with the charge, and a ping when it's full. */
class ChargeTone {
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private full = false;

  set(level: number | null) {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime;
    if (level === null) {
      if (this.gain) {
        this.gain.gain.cancelScheduledValues(t);
        this.gain.gain.setTargetAtTime(0.0001, t, 0.015);
        const osc = this.osc;
        setTimeout(() => osc?.stop(), 120);
      }
      this.osc = null;
      this.gain = null;
      this.full = false;
      return;
    }
    if (!this.osc) {
      this.gain = a.ctx.createGain();
      this.gain.gain.setValueAtTime(0.0001, t);
      this.gain.gain.linearRampToValueAtTime(0.05, t + 0.03);
      this.gain.connect(a.buses.sfx);
      this.osc = a.ctx.createOscillator();
      this.osc.type = "triangle";
      this.osc.connect(this.gain);
      this.osc.start(t);
    }
    // Two octaves over the charge: 220 Hz to 880 Hz.
    this.osc.frequency.setTargetAtTime(220 * 2 ** (level * 2), t, 0.01);
    if (level >= 1 && !this.full) {
      this.full = true;
      ping(a);
    }
  }
}

function ping(a: AudioEngine) {
  const t = a.ctx.currentTime;
  const o = a.ctx.createOscillator();
  o.frequency.value = 1760;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g).connect(a.buses.sfx);
  o.start(t);
  o.stop(t + 0.16);
}

/** The fall: wind rushing past, louder and brighter the longer and faster you fall. */
class Whoosh {
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;

  /** 0: not falling; 1: a long, fast fall. `soft` for reduced motion. */
  set(amount: number, soft = false) {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime;
    if (amount <= 0.01) {
      if (this.gain) {
        this.gain.gain.setTargetAtTime(0.0001, t, 0.05);
        const source = this.source;
        setTimeout(() => source?.stop(), 300);
      }
      this.source = null;
      this.gain = null;
      this.filter = null;
      return;
    }
    if (!this.source) {
      this.gain = a.ctx.createGain();
      this.gain.gain.value = 0.0001;
      this.gain.connect(a.buses.sfx);
      this.filter = a.ctx.createBiquadFilter();
      this.filter.type = "bandpass";
      this.filter.Q.value = 0.8;
      this.filter.connect(this.gain);
      this.source = a.ctx.createBufferSource();
      this.source.buffer = a.noise;
      this.source.loop = true;
      this.source.connect(this.filter);
      this.source.start(t);
    }
    this.gain!.gain.setTargetAtTime(Math.min(1, amount) * (soft ? 0.08 : 0.22), t, 0.08);
    this.filter!.frequency.setTargetAtTime(300 + amount * 1500, t, 0.1);
  }
}

/** Each zone's air: on a loop, quiet. */
class Ambience {
  private zone: ZoneId | null = null;
  private nodes: AudioNode[] = [];
  private stops: Array<() => void> = [];
  private windGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(zone: ZoneId) {
    if (zone === this.zone) return;
    this.stop();
    const a = getAudio();
    if (!a) return;
    this.zone = zone;
    const t = a.ctx.currentTime;
    const out = a.ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(1, t + 1.5);
    out.connect(a.buses.sfx);
    this.nodes.push(out);
    // Wind everywhere outside (stronger on the cliffs and in the sky), drips inside.
    const windy = zone === "cliffs" || zone === "sky" || zone === "summit" || zone === "fake-summit";
    if (zone !== "inside") {
      const source = a.ctx.createBufferSource();
      source.buffer = a.noise;
      source.loop = true;
      const lp = a.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = windy ? 500 : 300;
      const g = a.ctx.createGain();
      g.gain.value = windy ? 0.05 : 0.018;
      source.connect(lp).connect(g).connect(out);
      source.start(t);
      this.windGain = g;
      this.stops.push(() => source.stop());
    }
    const tickSound = (f: number, level: number, decay: number) => {
      const now = a.ctx.currentTime;
      const o = a.ctx.createOscillator();
      o.frequency.value = f;
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(level, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + decay + 0.02);
    };
    if (zone === "clocktower") {
      let n = 0;
      this.timer = setInterval(() => tickSound(n++ % 2 ? 1900 : 2300, 0.02, 0.03), 500);
    } else if (zone === "ice" || zone === "inside") {
      let n = 0;
      this.timer = setInterval(() => {
        n++;
        if (n % 3 === 0 || n % 7 === 0) tickSound(1200 + ((n * 373) % 900), 0.025, 0.12);
      }, 650);
    }
  }

  /** Gusts: the wind swells while they blow. */
  gust(on: boolean) {
    const a = getAudio();
    if (!a || !this.windGain) return;
    this.windGain.gain.setTargetAtTime(on ? 0.09 : 0.04, a.ctx.currentTime, 0.4);
  }

  stop() {
    this.zone = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const a = getAudio();
    for (const node of this.nodes) {
      if (a && node instanceof GainNode) node.gain.setTargetAtTime(0.0001, a.ctx.currentTime, 0.2);
    }
    const stops = this.stops;
    const nodes = this.nodes;
    setTimeout(() => {
      stops.forEach((s) => {
        try {
          s();
        } catch {
          // Already stopped.
        }
      });
      nodes.forEach((n) => n.disconnect());
    }, 900);
    this.stops = [];
    this.nodes = [];
    this.windGain = null;
  }
}

export const chargeTone = new ChargeTone();
export const whoosh = new Whoosh();
export const ambience = new Ambience();
