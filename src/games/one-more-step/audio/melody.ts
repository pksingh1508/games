// Musical footsteps (Plan/01-one-more-step.md §9 "Audio"): every step plays the next note of the level's
// own melody, in a pentatonic scale so it always sounds nice. It only comes home (to its first note) when
// you catch the door: that unfinished feeling is "one more step", as music. Undo plays the note backwards,
// dying plays a sour one.
import { envelope, filter, getAudio, playTone } from "@/engine/audio/engine";
import { hashString } from "@/engine/rng";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];

/** Each world's key (World 5 is minor: it's lying). */
export const KEYS: Record<number, { root: number; scale: number[] }> = {
  1: { root: 60, scale: MAJOR },
  2: { root: 62, scale: MAJOR },
  3: { root: 63, scale: MAJOR },
  4: { root: 65, scale: MAJOR },
  5: { root: 57, scale: MINOR },
  6: { root: 67, scale: MAJOR },
};

export class Melody {
  private readonly notes: number[];
  private readonly key: { root: number; scale: number[] };

  constructor(levelId: string, world: number) {
    this.key = KEYS[world] ?? KEYS[1]!;
    // A wandering tune from the level's name: never landing on home until the end.
    let h = hashString(levelId);
    let deg = 2;
    this.notes = [];
    for (let k = 0; k < 16; k++) {
      h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
      const move = (h % 5) - 2;
      deg = Math.max(1, Math.min(9, deg + (move === 0 ? 1 : move)));
      if (deg % 5 === 0) deg += 1;
      this.notes.push(deg);
    }
  }

  private midi(deg: number) {
    const { root, scale } = this.key;
    return root + Math.floor(deg / 5) * 12 + scale[((deg % 5) + 5) % 5]!;
  }

  /** The note for step `n` (1-based). */
  noteOf(n: number) {
    return this.midi(this.notes[(Math.max(1, n) - 1) % this.notes.length]!);
  }

  /** A step (soft for a wait, muffled for a bump). */
  step(n: number, how: "step" | "wait" | "bump" = "step") {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime + 0.005;
    const m = this.noteOf(n);
    const peak = how === "wait" ? 0.05 : how === "bump" ? 0.04 : 0.11;
    const out = filter(a, envelope(a, a.buses.sfx, t, { peak, attack: 0.004, decay: how === "bump" ? 0.12 : 0.5 }), "lowpass", how === "bump" ? 700 : 3200);
    playTone(a, out, t, 0.55, hz(m), "triangle");
    if (how === "step") playTone(a, envelope(a, a.buses.sfx, t, { peak: 0.03, attack: 0.004, decay: 0.25 }), t, 0.3, hz(m + 12), "sine");
  }

  /** Undo: the note, backwards (it swells up, and stops). */
  undo(n: number) {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime + 0.005;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.18);
    g.gain.setValueAtTime(0.0001, t + 0.19);
    g.connect(a.buses.sfx);
    playTone(a, g, t, 0.2, hz(this.noteOf(n)), "triangle", hz(this.noteOf(n) - 2));
  }

  /** Caught it: home at last, with a little run up to it. */
  home() {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime + 0.01;
    const home = this.key.root + 12;
    [home - 5, home - 3, home].forEach((m, k) => {
      const at = t + k * 0.09;
      playTone(a, envelope(a, a.buses.sfx, at, { peak: k === 2 ? 0.14 : 0.08, attack: 0.004, decay: k === 2 ? 1.2 : 0.3 }), at, k === 2 ? 1.25 : 0.32, hz(m), "triangle");
    });
    playTone(a, envelope(a, a.buses.sfx, t + 0.18, { peak: 0.05, attack: 0.01, decay: 1.4 }), t + 0.18, 1.45, hz(home - 12), "sine");
  }

  /** Hurt: a sour note (two, a semitone apart). */
  sour() {
    const a = getAudio();
    if (!a) return;
    const t = a.ctx.currentTime + 0.005;
    const m = this.key.root - 1;
    for (const d of [0, 1]) playTone(a, envelope(a, a.buses.sfx, t, { peak: 0.08, attack: 0.005, decay: 0.6 }), t, 0.62, hz(m + d), "sawtooth");
  }
}
