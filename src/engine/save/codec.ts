// Encoding helpers for save files and share codes: gzip, base64(url), SHA-256.
// Everything here uses built-in browser APIs (no libraries), see Plan/gameStack.md §5.2.

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const encodeText = (text: string): Uint8Array<ArrayBuffer> => textEncoder.encode(text);
export const decodeText = (bytes: Uint8Array): string => textDecoder.decode(bytes);

/** True when the browser can gzip natively (Safari 16.4+, Chrome 80+, Firefox 113+). */
export const canCompress = (): boolean =>
  typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

async function pipeThrough(
  bytes: Uint8Array<ArrayBuffer>,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  }).pipeThrough(transform);

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export const gzip = (bytes: Uint8Array<ArrayBuffer>) => pipeThrough(bytes, new CompressionStream("gzip"));
export const gunzip = (bytes: Uint8Array<ArrayBuffer>) => pipeThrough(bytes, new DecompressionStream("gzip"));

/** gzip files always start with the bytes 1f 8b. */
export const isGzip = (bytes: Uint8Array): boolean => bytes[0] === 0x1f && bytes[1] === 0x8b;

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export const toBase64Url = (bytes: Uint8Array): string =>
  toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const fromBase64Url = (code: string): Uint8Array<ArrayBuffer> =>
  fromBase64(code.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(code.length / 4) * 4, "="));

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encodeText(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Human-friendly byte sizes: 512 B, 3.2 KB, 1.4 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
