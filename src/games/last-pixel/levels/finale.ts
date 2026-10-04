// The finale, Pix's Revenge (Plan/10-last-pixel.md §5): a wall with the game's name painted on it, the dot
// on its "i" missing. Pix un-paints a great swathe of it while you repaint; when it's the last pixel again it
// uses everything it knows, and it takes three catches. The last time it hides in the logo's "i", which is
// where it belonged all along.
import { BIG_KIT, level } from "./kit";
import { room } from "./scenes";

export const FINALE = level({
  id: "5-01",
  world: 5,
  name: "Pix's Revenge",
  hint: "Pix is un-painting everything. Repaint while it runs. When it's the last pixel again, catch it. Three times.",
  tools: ["roller", "brush"],
  scene: () => room({ seed: "5-01", paint: "lavender", mural: "logo", old: "plaster" }),
  revenge: 2600,
  pix: { speed: 10, flee: true, camo: true, trail: 80 },
  rounds: [
    { speed: 10, flee: true, decoys: 4, tricks: ["hud"] },
    { speed: 11, flee: true, tricks: ["dead", "mimic", "dom"], mimic: "mirrorX", spots: ["logo"] },
  ],
  hunt: BIG_KIT,
});
