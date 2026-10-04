// What a level is made of (Plan/10-last-pixel.md §12 "Data model"): a picture to uncover (before and
// after), which cells are the job and which tool does each, Pix's traits and tricks, and the hunt tools.
import type { Colour, Picture } from "./picture";

export type ToolId = "roller" | "brush" | "sponge" | "scratch" | "mower" | "shovel" | "washer" | "eraser";
/** The jobs: each tool does one (paint takes the roller or the brush). */
export type Task = "paint" | "wipe" | "scratch" | "mow" | "shovel" | "wash" | "erase";

/**
 * Pix's tricks, one at a time and in order: each lasts until you see through it.
 * burrow: under the surface (scrub over it) · hud: under a HUD panel (drag the panel) · dead: a "dead pixel"
 * on your monitor (pause, and it's gone) · mimic: a second mouse cursor (yours touches it) · dom: out of the
 * canvas into the page (click it there) · tab: into the browser tab's icon (look away and back).
 */
export type Trick = "burrow" | "hud" | "dead" | "mimic" | "dom" | "tab";

export type HuntToolId = "catch" | "net" | "bait" | "freeze";

/** How a mimic cursor moves "wrong". */
export type MimicStyle = "mirrorX" | "mirrorY" | "swap";

export interface PixDef {
  /** Running speed, cells a second (wandering is slower). */
  speed: number;
  /** Runs from your cursor. */
  flee?: boolean;
  /** Within 2% of the background, shimmering every 2 seconds. */
  camo?: boolean;
  /** Copies of itself (the real one blinks on the beat). */
  decoys?: number;
  /** Cells it un-paints as it runs (the repaint trail). */
  trail?: number;
  tricks?: Trick[];
  mimic?: MimicStyle;
  /** Page spots it escapes to (data-pix-spot names), in order of preference. */
  spots?: string[];
}

/** A level's picture: what you start with, what you uncover, and which cells are the job. */
export interface Scene {
  w: number;
  h: number;
  before: Picture;
  after: Picture;
  /** A second look for uncovered cells (mown stripes the other way). */
  after2?: Picture;
  /** Per cell: 0 not part of the job, k the k-th task in `tasks`. */
  region: Uint8Array;
  tasks: Task[];
  /** A night scene: fireflies (decoys hide among them). */
  night?: boolean;
  /** The colour Pix glows (it matches the scene's light). */
  glow?: Colour;
}

export interface HuntKit {
  net: number;
  bait: number;
  freeze: number;
  magnifier: boolean;
}

export interface LevelDef {
  /** "2-07"; the finale is "5-01". */
  id: string;
  world: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** Shown before you start (what's new). */
  hint: string;
  /** The tools on the tool bar (the first is in your hand). */
  tools: ToolId[];
  scene: () => Scene;
  pix: PixDef;
  /** The finale: Pix gets away again, with these, after each catch. */
  rounds?: PixDef[];
  /** The finale: how many cells Pix un-paints before it's the last pixel again. */
  revenge?: number;
  hunt: HuntKit;
  /** The clean-up star: done within this many ticks (set from the bot's run, levels/targets.ts). */
  target: number;
  /** Not needed to finish the game (the tab escape). */
  bonus?: boolean;
  /** Where the mower starts (cells), facing right. */
  mower?: { x: number; y: number };
}
