// Input recordings (Plan/gameStack.md §5.4): one input bitmask per simulation tick, run-length
// encoded. A 10-second run is a few hundred bytes. Because the simulations are deterministic, a
// recording replays to exactly the same result: ghosts, the All-Deaths Replay, challenge links.

/** [bits, ticks] pairs. */
export type InputLog = Array<[bits: number, ticks: number]>;

export class Recorder {
  private log: InputLog = [];
  private ticks = 0;

  push(bits: number) {
    this.ticks++;
    const last = this.log[this.log.length - 1];
    if (last && last[0] === bits && last[1] < 255) last[1]++;
    else this.log.push([bits, 1]);
  }

  get length() {
    return this.ticks;
  }

  /** A copy of what's been recorded so far. */
  snapshot(): InputLog {
    return this.log.map(([bits, n]) => [bits, n]);
  }

  reset() {
    this.log = [];
    this.ticks = 0;
  }
}

export function logLength(log: InputLog): number {
  return log.reduce((sum, [, n]) => sum + n, 0);
}

/** Every tick's bits, in order. */
export function* expandLog(log: InputLog): Generator<number> {
  for (const [bits, n] of log) for (let i = 0; i < n; i++) yield bits;
}

/** Plays a log back one tick at a time. */
export class Player {
  private index = 0;
  private used = 0;

  constructor(private readonly log: InputLog) {}

  /** The next tick's bits, or null when the recording has ended. */
  next(): number | null {
    while (this.index < this.log.length && this.used >= this.log[this.index]![1]) {
      this.index++;
      this.used = 0;
    }
    if (this.index >= this.log.length) return null;
    this.used++;
    return this.log[this.index]![0];
  }

  get done() {
    return this.index >= this.log.length || (this.index === this.log.length - 1 && this.used >= this.log[this.index]![1]);
  }
}

/** Two bytes per run: the bits, then the length (1–255). */
export function encodeLog(log: InputLog): Uint8Array {
  const runs: number[] = [];
  for (const [bits, n] of log) {
    let left = n;
    while (left > 0) {
      const take = Math.min(255, left);
      runs.push(bits & 0xff, take);
      left -= take;
    }
  }
  return Uint8Array.from(runs);
}

export function decodeLog(bytes: Uint8Array): InputLog {
  const log: InputLog = [];
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const bits = bytes[i]!;
    const n = bytes[i + 1]!;
    if (n === 0) continue;
    const last = log[log.length - 1];
    if (last && last[0] === bits && last[1] + n <= 255) last[1] += n;
    else log.push([bits, n]);
  }
  return log;
}

/** A compact text form, for generated files and links: base64url of the bytes. */
export function logToText(log: InputLog): string {
  const bytes = encodeLog(log);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function logFromText(text: string): InputLog {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((text.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return decodeLog(bytes);
}
