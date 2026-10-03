import { describe, expect, it } from "vitest";
import { decodeLog, encodeLog, logFromText, logLength, logToText, Player, Recorder, type InputLog } from "./replay";

describe("input recordings", () => {
  it("run-length encode the bits", () => {
    const rec = new Recorder();
    for (const bits of [2, 2, 2, 6, 6, 0]) rec.push(bits);
    expect(rec.snapshot()).toEqual([
      [2, 3],
      [6, 2],
      [0, 1],
    ]);
    expect(rec.length).toBe(6);
  });

  it("split runs longer than 255 ticks", () => {
    const rec = new Recorder();
    for (let i = 0; i < 600; i++) rec.push(2);
    expect(rec.snapshot()).toEqual([
      [2, 255],
      [2, 255],
      [2, 90],
    ]);
  });

  it("play back exactly what was recorded", () => {
    const bits = [1, 1, 5, 5, 5, 0, 2, 2, 6];
    const rec = new Recorder();
    bits.forEach((b) => rec.push(b));
    const player = new Player(rec.snapshot());
    const out: number[] = [];
    let b: number | null;
    while ((b = player.next()) !== null) out.push(b);
    expect(out).toEqual(bits);
    expect(player.done).toBe(true);
  });

  it("survive the byte and text codecs", () => {
    const log: InputLog = [
      [2, 40],
      [6, 12],
      [2, 300],
      [0, 1],
      [5, 9],
    ];
    expect(logLength(decodeLog(encodeLog(log)))).toBe(logLength(log));
    expect(logFromText(logToText(log))).toEqual(decodeLog(encodeLog(log)));
    expect(logToText(log)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
