import { describe, expect, it } from "vitest";
import {
  decodeText,
  encodeText,
  formatBytes,
  fromBase64,
  fromBase64Url,
  gunzip,
  gzip,
  isGzip,
  sha256Hex,
  toBase64,
  toBase64Url,
} from "./codec";

describe("codec", () => {
  it("round-trips base64 and base64url", () => {
    const bytes = new Uint8Array(Array.from({ length: 300 }, (_, i) => (i * 37) % 256));
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    const url = toBase64Url(bytes);
    expect(url).not.toMatch(/[+/=]/);
    expect(fromBase64Url(url)).toEqual(bytes);
  });

  it("gzips and gunzips", async () => {
    const text = JSON.stringify({ hello: "arcade", repeated: "lie ".repeat(500) });
    const packed = await gzip(encodeText(text));
    expect(isGzip(packed)).toBe(true);
    expect(packed.length).toBeLessThan(text.length);
    expect(decodeText(await gunzip(packed))).toBe(text);
  });

  it("hashes with SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
