// A 3 × 5 pixel font for words painted inside canvas games (TrapSprint's "LEVEL COMPLETE!" banner,
// Fake Floor's signs and its "TOK"). Web fonts would blur at this size; these are crisp at any scale.

const GLYPHS: Record<string, string> = {
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101110011",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "110001010100111",
  "3": "110001010001110",
  "4": "101101111001001",
  "5": "111100110001110",
  "6": "011100110101010",
  "7": "111001010010010",
  "8": "010101010101010",
  "9": "010101011001110",
  "!": "010010010000010",
  "?": "110001010000010",
  ".": "000000000000010",
  ",": "000000000010100",
  ":": "000010000010000",
  "-": "000000111000000",
  "+": "000010111010000",
  "'": "010010000000000",
  '"': "101101000000000",
  "/": "001001010100100",
  "(": "010100100100010",
  ")": "010001001001010",
  "=": "000111000111000",
  "<": "001010100010001",
  ">": "100010001010100",
  "*": "000101010101000",
  " ": "000000000000000",
};

export const GLYPH_W = 3;
export const GLYPH_H = 5;

/** Width in pixels of `text` at `scale` (1 px between letters). */
export const textWidth = (text: string, scale = 1) => Math.max(0, text.length * (GLYPH_W + 1) - 1) * scale;

/** Paint `text` with its top-left at x, y. */
export function pixelText(g: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, scale = 1) {
  g.fillStyle = colour;
  let cx = Math.round(x);
  for (const ch of text.toUpperCase()) {
    const bits = GLYPHS[ch] ?? GLYPHS["?"]!;
    for (let i = 0; i < 15; i++) {
      if (bits[i] === "1") g.fillRect(cx + (i % 3) * scale, Math.round(y) + Math.floor(i / 3) * scale, scale, scale);
    }
    cx += (GLYPH_W + 1) * scale;
  }
}

/** Break `text` into lines no wider than `maxWidth` pixels (at scale 1). */
export function wrapPixelText(text: string, maxWidth: number): string[] {
  const perLine = Math.max(1, Math.floor((maxWidth + 1) / (GLYPH_W + 1)));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= perLine) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
