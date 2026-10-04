// The gravity hum (Plan/15-gravity-is-lying.md §9, §10.2): the main warning sound. A rising tone
// that starts at least 0.75 s before a timed turn and swells right up to it, so you can time a jump
// by ear. Synthesized live, so it can stop the moment you pause.
import { getAudio } from "@/engine/audio/engine";

class Hum {
  private nodes: { osc: OscillatorNode; wobble: OscillatorNode; gain: GainNode } | null = null;

  /** Start the hum: it rises for `seconds`, then the turn comes. */
  start(seconds: number) {
    this.stop();
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const gain = a.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + seconds * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.12);
    gain.connect(a.buses.sfx);
    const osc = a.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + seconds);
    const lp = a.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(2400, t + seconds);
    osc.connect(lp).connect(gain);
    // A wobble that speeds up as the turn comes.
    const wobble = a.ctx.createOscillator();
    wobble.frequency.setValueAtTime(5, t);
    wobble.frequency.linearRampToValueAtTime(18, t + seconds);
    const depth = a.ctx.createGain();
    depth.gain.value = 9;
    wobble.connect(depth).connect(osc.frequency);
    osc.start(t);
    wobble.start(t);
    osc.stop(t + seconds + 0.2);
    wobble.stop(t + seconds + 0.2);
    this.nodes = { osc, wobble, gain };
  }

  stop() {
    const n = this.nodes;
    this.nodes = null;
    if (!n) return;
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime;
    n.gain.gain.cancelScheduledValues(t);
    n.gain.gain.setTargetAtTime(0.0001, t, 0.02);
    try {
      n.osc.stop(t + 0.1);
      n.wobble.stop(t + 0.1);
    } catch {
      // Already stopped.
    }
  }
}

export const hum = new Hum();
