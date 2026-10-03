// The soundtrack (Plan/09-one-tap-chaos.md §9): "the music is the clock". A catchy loop per speed
// tier, synthesized on the fly and scheduled beat by beat on the audio clock, slightly ahead of
// time. Breaks thin it out, cards get a drum roll, bosses go minor and heavy.
import { envelope, filter, playNoise, playTone, type AudioEngine } from "@/engine/audio/engine";

export type MusicPart = "game" | "break" | "card" | "boss" | "boss-intro" | "countin";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

interface Chord {
  root: number;
  minor: boolean;
}
const C = (root: number, minor = false): Chord => ({ root, minor });

/** Four chords per 8-beat loop, one every two beats. */
const PROGRESSIONS: Chord[][] = [
  [C(48), C(55), C(57, true), C(53)], // C G Am F: bright and bouncy
  [C(50), C(57), C(59, true), C(55)], // D A Bm G
  [C(52, true), C(48), C(55), C(50)], // Em C G D: driving
  [C(54, true), C(50), C(57), C(52)], // F#m D A E: tense
  [C(57, true), C(53), C(48), C(55)], // Am F C G: frantic
];
const BOSS: Chord[] = [C(50, true), C(46), C(55, true), C(57)]; // Dm Bb Gm A

const triad = (c: Chord) => [c.root, c.root + (c.minor ? 3 : 4), c.root + 7];

function kick(a: AudioEngine, out: AudioNode, t: number, peak = 1) {
  playTone(a, envelope(a, out, t, { peak, attack: 0.002, decay: 0.2 }), t, 0.22, 140, "sine", 42);
  playTone(a, envelope(a, out, t, { peak: peak * 0.3, attack: 0.001, decay: 0.02 }), t, 0.03, 1200, "triangle");
}

function snare(a: AudioEngine, out: AudioNode, t: number, peak = 0.55) {
  playNoise(a, filter(a, envelope(a, out, t, { peak, attack: 0.001, decay: 0.12 }), "bandpass", 1900, 0.8), t, 0.14, t * 7);
  playTone(a, envelope(a, out, t, { peak: peak * 0.5, attack: 0.001, decay: 0.07 }), t, 0.09, 210, "triangle", 160);
}

function hat(a: AudioEngine, out: AudioNode, t: number, open = false, peak = 0.18) {
  playNoise(a, filter(a, envelope(a, out, t, { peak, attack: 0.001, decay: open ? 0.14 : 0.03 }), "highpass", 7500), t, open ? 0.18 : 0.05, t * 13);
}

function bass(a: AudioEngine, out: AudioNode, t: number, midi: number, length: number, peak = 0.32) {
  const lp = filter(a, envelope(a, out, t, { peak, attack: 0.005, hold: length * 0.5, decay: length * 0.5 }), "lowpass", 700, 4);
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(380, t + length);
  playTone(a, lp, t, length, hz(midi), "sawtooth");
}

function stab(a: AudioEngine, out: AudioNode, t: number, notes: number[], length: number, peak = 0.07) {
  const lp = filter(a, envelope(a, out, t, { peak, attack: 0.004, decay: length }), "lowpass", 2600);
  for (const n of notes) playTone(a, lp, t, length, hz(n), "square");
}

function pluck(a: AudioEngine, out: AudioNode, t: number, midi: number, peak = 0.09) {
  playTone(a, envelope(a, out, t, { peak, attack: 0.002, decay: 0.12 }), t, 0.14, hz(midi), "triangle");
}

/**
 * Schedule beat `beat` (0-based) of a segment at AudioContext time `t`.
 * `tier` is 1–5; `spb` is seconds per beat.
 */
export function playBeat(a: AudioEngine, out: AudioNode, t: number, spb: number, part: MusicPart, tier: number, beat: number, beats: number) {
  const eighth = spb / 2;
  const sixteenth = spb / 4;
  const prog = part === "boss" || part === "boss-intro" ? BOSS : PROGRESSIONS[Math.min(4, Math.max(0, tier - 1))]!;
  const chord = prog[Math.floor(beat / 2) % 4]!;
  const notes = triad(chord);
  const bar = beat % 4;

  switch (part) {
    case "countin":
      hat(a, out, t, false, 0.25);
      if (beat === beats - 1) {
        for (let i = 0; i < 4; i++) snare(a, out, t + i * sixteenth, 0.18 + i * 0.08);
      }
      return;

    case "card": {
      // A drum roll that swells, and the chord on the downbeat.
      if (beat === 0) stab(a, out, t, notes.map((n) => n + 12), spb * 1.5, 0.09);
      const hits = beat === beats - 1 ? 8 : 4;
      for (let i = 0; i < hits; i++) snare(a, out, t + (i * spb) / hits, 0.12 + (beat / beats) * 0.25);
      kick(a, out, t, 0.6);
      return;
    }

    case "boss-intro":
      if (beat === 0) {
        kick(a, out, t, 1);
        bass(a, out, t, chord.root - 12, spb * 3, 0.38);
      }
      if (beat >= 2) for (let i = 0; i < (beat === 3 ? 4 : 2); i++) kick(a, out, t + (i * spb) / (beat === 3 ? 4 : 2), 0.8);
      hat(a, out, t + eighth, true, 0.12);
      return;

    case "break":
      // Thinner: bass on the beat, hats, a fill into the next round.
      kick(a, out, t, bar === 0 ? 0.9 : 0.55);
      bass(a, out, t, chord.root - 12, eighth, 0.24);
      hat(a, out, t + eighth, false);
      if (beat === beats - 1) {
        for (let i = 0; i < 4; i++) snare(a, out, t + i * sixteenth, 0.2 + i * 0.07);
      } else if (bar === 1 || bar === 3) {
        snare(a, out, t, 0.4);
      }
      return;

    case "boss":
      // Heavy: kick on every beat, toms, a low pedal and minor stabs.
      kick(a, out, t, 1);
      kick(a, out, t + eighth + sixteenth, 0.45);
      if (bar === 1 || bar === 3) snare(a, out, t, 0.6);
      for (let i = 0; i < 4; i++) hat(a, out, t + i * sixteenth, i === 2, 0.14);
      bass(a, out, t, chord.root - 12, eighth, 0.34);
      bass(a, out, t + eighth, chord.root - 12, sixteenth, 0.26);
      bass(a, out, t + eighth + sixteenth, chord.root, sixteenth, 0.22);
      if (beat % 2 === 0) stab(a, out, t + eighth, notes, eighth, 0.08);
      return;

    case "game": {
      // Drums: four on the floor from tier 4; snare on 2 and 4.
      if (tier >= 4 || bar === 0 || bar === 2) kick(a, out, t, 0.95);
      if (bar === 1 || bar === 3) snare(a, out, t, 0.5);
      if (tier >= 3) for (let i = 0; i < 4; i++) hat(a, out, t + i * sixteenth, false, i % 2 ? 0.11 : 0.17);
      else {
        hat(a, out, t, false, 0.16);
        hat(a, out, t + eighth, tier >= 2, 0.14);
      }

      // Bass: root on the beat, octave bounce on the off-beat, sixteenth walks at the top tiers.
      bass(a, out, t, chord.root - 12, eighth * 0.9);
      bass(a, out, t + eighth, chord.root, eighth * 0.8, 0.24);
      if (tier >= 4 && bar === 3) bass(a, out, t + eighth + sixteenth, chord.root + 2, sixteenth, 0.2);

      // Off-beat chord stabs from tier 2.
      if (tier >= 2) stab(a, out, t + eighth, notes.map((n) => n + 12), eighth * 0.7, tier >= 4 ? 0.075 : 0.06);

      // An arpeggio from tier 3 — the hook.
      if (tier >= 3) {
        const arp = [notes[0]! + 24, notes[1]! + 24, notes[2]! + 24, notes[1]! + 24];
        for (let i = 0; i < 4; i++) pluck(a, out, t + i * sixteenth, arp[(i + beat) % 4]!, 0.05 + tier * 0.008);
      } else if (bar === 0) {
        // The tier 1 tune: a little melody over the first chord of each bar.
        const tune = [notes[2]! + 12, notes[1]! + 12, notes[0]! + 12, notes[1]! + 12];
        tune.forEach((n, i) => pluck(a, out, t + i * eighth, n, 0.07));
      }
      return;
    }
  }
}
