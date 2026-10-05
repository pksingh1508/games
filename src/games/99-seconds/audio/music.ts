// The soundtrack (Plan/03-99-seconds.md §9): each chapter's music is exactly one loop long, so you learn where you
// are in the loop from the music ("the phone rings when the cello comes in"). Written against the loop clock
// (seconds left), scheduled a moment ahead as the clock runs: it pauses when the game does, and stretches when a
// glance at a clock holds a second. Relaxed mode's longer loops get a quiet bed before the music proper.
import { envelope, filter, getAudio, playTone, type AudioEngine } from "@/engine/audio/engine";
import type { ChapterId } from "../core/types";

type Voice = "pluck" | "pad" | "cello" | "bell" | "bass" | "flute";

export interface Note {
  /** Seconds left when it starts. */
  at: number;
  dur: number;
  midi: number;
  voice: Voice;
  gain: number;
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const CHORDS = {
  Am: [57, 60, 64],
  F: [53, 57, 60],
  C: [48, 52, 55],
  G: [55, 59, 62],
  Dm: [50, 53, 57],
  Bb: [46, 50, 53],
  E: [52, 56, 59],
} as const;

/** The quiet bed under Relaxed mode's extra seconds (above 99). */
function bed(root: number): Note[] {
  const out: Note[] = [];
  for (let at = 150; at > 99; at -= 4) out.push({ at, dur: 4, midi: root, voice: "pad", gain: 0.08 });
  return out;
}

/** Chapter 1: a slow music box in A minor. The cello comes in at 77, with the phone; everything drops when the lights dip at 66; a bell at 42; the bird's flute at 13. */
function waitingRoom(): Note[] {
  const out: Note[] = bed(45);
  const prog = [CHORDS.Am, CHORDS.F, CHORDS.C, CHORDS.G];
  for (let at = 99, i = 0; at > 0; at -= 2, i++) {
    const chord = prog[i % 4]!;
    if (at <= 66 && at > 63) continue;
    out.push({ at, dur: 1.9, midi: chord[0]! - 12, voice: "bass", gain: 0.16 });
    out.push({ at, dur: 2, midi: chord[1]!, voice: "pad", gain: 0.05 });
    const fast = at <= 10;
    const steps = fast ? 8 : 4;
    for (let k = 0; k < steps; k++) out.push({ at: at - k * (2 / steps), dur: 0.5, midi: chord[k % 3]! + 12 + (k >= 3 ? 12 : 0), voice: "pluck", gain: fast ? 0.12 : 0.09 });
  }
  [52, 50, 48, 47].forEach((m, k) => out.push({ at: 77 - k * 3, dur: 2.8, midi: m - 12, voice: "cello", gain: 0.16 }));
  out.push({ at: 42, dur: 2.5, midi: 88, voice: "bell", gain: 0.18 });
  [81, 84, 88, 86, 84].forEach((m, k) => out.push({ at: 13 - k * 0.6, dur: 0.55, midi: m, voice: "flute", gain: 0.1 }));
  for (const at of [3, 2, 1]) out.push({ at, dur: 0.9, midi: 81, voice: "bell", gain: 0.12 });
  return out.sort((a, b) => b.at - a.at);
}

/** Chapter 2: a homely walking bass and pizzicato, slipping up a key at 66 and again at 33. */
function kitchen(): Note[] {
  const out: Note[] = bed(48);
  const prog = [CHORDS.C, [57, 60, 64], CHORDS.Dm, CHORDS.G];
  for (let at = 99, i = 0; at > 0; at -= 2, i++) {
    const shift = at <= 33 ? 2 : at <= 66 ? 1 : 0;
    const chord = prog[i % 4]!;
    const walk = [chord[0]! - 12, chord[1]! - 12, chord[2]! - 12, chord[0]! - 10];
    walk.forEach((m, k) => out.push({ at: at - k * 0.5, dur: 0.45, midi: m + shift, voice: "bass", gain: 0.13 }));
    [1, 3].forEach((k) => out.push({ at: at - k * 0.5 + 0.25, dur: 0.25, midi: chord[1]! + 12 + shift, voice: "pluck", gain: 0.08 }));
    if (at <= 10) out.push({ at: at - 1, dur: 0.2, midi: chord[2]! + 24 + shift, voice: "pluck", gain: 0.1 });
  }
  return out.sort((a, b) => b.at - a.at);
}

/** Chapter 3: a mechanical ostinato in D minor; the "time flies" theme at 77, a bell at every landing. */
function clockRoom(): Note[] {
  const out: Note[] = bed(38);
  const prog = [CHORDS.Dm, CHORDS.Bb, CHORDS.F, CHORDS.C];
  for (let at = 99; at > 0; at -= 1) out.push({ at, dur: 0.6, midi: at % 2 ? 38 : 45, voice: "bass", gain: 0.12 });
  for (let at = 99, i = 0; at > 0; at -= 4, i++) {
    const chord = prog[i % 4]!;
    for (const m of chord) out.push({ at, dur: 3.8, midi: m, voice: "pad", gain: 0.035 });
  }
  [74, 77, 81, 86, 89].forEach((m, k) => out.push({ at: 77 - k * 0.4, dur: 0.6, midi: m, voice: "flute", gain: 0.11 }));
  for (const [at, m] of [
    [70, 86],
    [62, 81],
    [54, 77],
    [46, 86],
    [38, 74],
    [30, 81],
    [22, 77],
    [14, 86],
    [6, 74],
  ] as const)
    out.push({ at, dur: 1.4, midi: m, voice: "bell", gain: 0.1 });
  return out.sort((a, b) => b.at - a.at);
}

const SCORES: Record<ChapterId, () => Note[]> = { "waiting-room": waitingRoom, kitchen, "clock-room": clockRoom };

function sound(audio: AudioEngine, n: Note, when: number) {
  const bus = audio.buses.music;
  const f = hz(n.midi);
  switch (n.voice) {
    case "pluck":
      playTone(audio, envelope(audio, bus, when, { peak: n.gain, attack: 0.003, decay: n.dur }), when, n.dur + 0.05, f, "triangle");
      break;
    case "pad":
      for (const d of [-3, 3]) {
        const o = playTone(audio, envelope(audio, filter(audio, bus, "lowpass", 1400), when, { peak: n.gain, attack: 0.6, hold: Math.max(0, n.dur - 1.2), decay: 0.6 }), when, n.dur + 0.1, f, "sine");
        o.detune.value = d;
      }
      break;
    case "cello": {
      const o = playTone(audio, envelope(audio, filter(audio, bus, "lowpass", 1100), when, { peak: n.gain, attack: 0.25, hold: n.dur * 0.6, decay: n.dur * 0.4 }), when, n.dur + 0.1, f, "sawtooth");
      for (let k = 0; k < n.dur * 5; k++) o.detune.setValueAtTime(k % 2 ? 12 : -12, when + k * 0.2);
      break;
    }
    case "bell":
      playTone(audio, envelope(audio, bus, when, { peak: n.gain, attack: 0.004, decay: n.dur }), when, n.dur + 0.05, f, "sine");
      playTone(audio, envelope(audio, bus, when, { peak: n.gain * 0.35, attack: 0.004, decay: n.dur * 0.6 }), when, n.dur * 0.6 + 0.05, f * 2.76, "sine");
      break;
    case "bass":
      playTone(audio, envelope(audio, bus, when, { peak: n.gain, attack: 0.01, decay: n.dur }), when, n.dur + 0.05, f, "triangle");
      break;
    case "flute": {
      const o = playTone(audio, envelope(audio, bus, when, { peak: n.gain, attack: 0.05, hold: n.dur * 0.5, decay: n.dur * 0.5 }), when, n.dur + 0.05, f, "sine");
      o.detune.setValueAtTime(-8, when);
      o.detune.linearRampToValueAtTime(8, when + n.dur);
      break;
    }
  }
}

/** Schedules a chapter's score against the loop clock, a moment ahead. */
export class Music {
  private notes: Note[] = [];
  private next = 0;

  /** A loop begins: the score from the top (or, in a long loop, from the bed). */
  start(chapter: ChapterId, left: number) {
    this.notes = SCORES[chapter]();
    this.next = this.notes.findIndex((n) => n.at <= left + 1e-6);
    if (this.next < 0) this.next = this.notes.length;
  }

  stop() {
    this.next = this.notes.length;
  }

  /** The clock says this many seconds are left: schedule what's due in the next fifth of a second. */
  sync(left: number) {
    const audio = getAudio();
    if (!audio) return;
    while (this.next < this.notes.length && this.notes[this.next]!.at >= left - 0.2) {
      const n = this.notes[this.next++]!;
      sound(audio, n, audio.ctx.currentTime + 0.03 + Math.max(0, left - n.at));
    }
  }
}
