// Small made-up levels for the tests (the real ones are in levels/).
import type { HuntKit, LevelDef, PixDef, Scene, Task, ToolId } from "./level";
import { hex, Picture } from "./picture";

/** A plain canvas: every cell is the job (or `region` says which task, 0 for none). */
export function testScene(w = 40, h = 24, tasks: Task[] = ["paint"], region?: (x: number, y: number) => number): Scene {
  const before = new Picture(w, h, hex("#9A9590"));
  const after = new Picture(w, h, hex("#8E7DFF"));
  const reg = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) reg[y * w + x] = region ? region(x, y) : 1;
  return { w, h, before, after, region: reg, tasks };
}

export const KIT: HuntKit = { net: 3, bait: 1, freeze: 1, magnifier: true };

export function testLevel(over: Partial<LevelDef> & { pix?: PixDef; tools?: ToolId[]; scene?: () => Scene } = {}): LevelDef {
  return {
    id: "T-01",
    world: 1,
    name: "Test",
    hint: "",
    tools: ["roller"],
    scene: () => testScene(),
    pix: { speed: 8, flee: true },
    hunt: KIT,
    target: 99999,
    ...over,
  };
}
