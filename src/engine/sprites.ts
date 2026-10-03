// Pixel art as code: sprites are written as rows of palette letters and rendered once to small
// canvases, so a game ships no image files. "." is transparent.

export type PixelRows = readonly string[];
export type PixelPalette = Readonly<Record<string, string>>;

const cache = new Map<string, HTMLCanvasElement>();

/** Render `rows` with `palette` to a canvas (cached), optionally mirrored. */
export function pixelSprite(rows: PixelRows, palette: PixelPalette, { flip = false, key }: { flip?: boolean; key?: string } = {}): HTMLCanvasElement {
  const id = key ? `${key}:${flip ? 1 : 0}` : `${rows.join("|")}#${Object.entries(palette).join(",")}#${flip ? 1 : 0}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  for (let y = 0; y < h; y++) {
    const row = rows[y]!;
    for (let x = 0; x < row.length; x++) {
      const colour = palette[row[x]!];
      if (!colour) continue;
      g.fillStyle = colour;
      g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
    }
  }
  cache.set(id, canvas);
  return canvas;
}

/** Draw at whole pixels (pixel art never sits between pixels). */
export function blit(g: CanvasRenderingContext2D, sprite: CanvasImageSource & { width: number; height: number }, x: number, y: number) {
  g.drawImage(sprite, Math.round(x), Math.round(y));
}
