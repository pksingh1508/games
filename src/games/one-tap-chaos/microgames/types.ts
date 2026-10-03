// The microgame contract (Plan/09-one-tap-chaos.md §12). Everything inside a microgame is
// measured in beats, not seconds, so a faster tempo speeds every scene up for free. Scenes are
// deterministic: the same context and the same taps always give the same result, which is what
// lets the bots (and the tests) prove every microgame can be won.
import type { Rng } from "@/engine/rng";
import type { SfxName } from "../sfx";

export type Outcome = "win" | "lose" | "pending";

export interface MicrogameContext {
  /** Tempo of this round. */
  bpm: number;
  /** Length in beats: 8, or 16 for a boss. */
  beats: number;
  rng: Rng;
  /** 0 at the start of a run → 1 deep into it. */
  difficulty: number;
  /** Half the timing window, in beats (±120 ms early on, never tighter than ±60 ms). */
  window: number;
  /** Opposite Day: play the inverted version. Only asked of invertible microgames. */
  inverted: boolean;
  /** Beats that go dark under Lights Out; key moments are kept out of them. */
  dark: ReadonlyArray<readonly [number, number]>;
  /** Comfort option: hold to pump instead of tapping fast. */
  holdMode: boolean;
  /** Play a sound right now (the engine plays it; tests ignore it). */
  emit(sound: SfxName): void;
}

/** What a microgame's scene can draw on: a 1000 × 1000 square, plus whatever else is visible. */
export interface View {
  /** Visible area in scene units; the square is always fully visible. */
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** The display font's family name (Bungee), ready for canvas text. */
  font: string;
  reducedMotion: boolean;
  reduceFlashing: boolean;
  /** Off in trap rounds: there, the show judges you, not the scene. */
  showVerdict: boolean;
}

/** A sound the scene wants on a beat, scheduled ahead on the music clock. */
export interface Cue {
  beat: number;
  sound: SfxName;
}

/** An instruction that changes mid-round (bosses, LOADING…). */
export interface Label {
  text: string;
  /** Shown with the crown (The Liar). */
  crown?: boolean;
  /** A rule sign the scene is showing ("OPPOSITE!"). */
  rule?: string;
}

export interface Scene {
  /** Advance the scene to beat `b`. Called with increasing beats; big jumps must be fine. */
  update(b: number): void;
  /** One tap (an action) at beat `b`. It can be up to a frame in the past, never in the future. */
  tap(b: number): void;
  /** The finger came off (hold mode). */
  release?(b: number): void;
  /** Win or lose as soon as it's decided; with `final`, the verdict at the end of the last beat. */
  outcome(final: boolean): Outcome;
  draw(g: CanvasRenderingContext2D, b: number, view: View): void;
  /** The bot's taps, in beats: when to act to win. */
  plan(): number[];
  /** Sounds on fixed beats (alarm rings, drum sticks…). */
  cues?: Cue[];
  /** A changing instruction; null keeps the microgame's own. */
  label?(b: number): Label | null;
}

export type MicrogameId =
  | "jump"
  | "catch"
  | "stop"
  | "dont"
  | "shoot"
  | "pump"
  | "flip"
  | "wait"
  | "count"
  | "dodge"
  | "beat"
  | "cut"
  | "snap"
  | "kick"
  | "high-five"
  | "sleep"
  | "bigger"
  | "match"
  | "stack"
  | "land"
  | "freeze"
  | "swat"
  | "loading"
  | "mystery";

export type BossId = "conductor" | "liar" | "final-tap";

export interface Microgame<Id extends string = MicrogameId> {
  id: Id;
  /** "JUMP!" */
  instruction: string;
  /** What to do, for the practice room and How to Play. */
  hint: string;
  /** Can appear under Opposite Day, as an inverted version. */
  invertible: boolean;
  /** Winning means not tapping at all. */
  refrain: boolean;
  /** On Opposite Day, winning means not tapping at all (SHOOT! becomes "hold your fire"). */
  invertedRefrain?: boolean;
  /** The scene's single strong background colour. */
  bg: string;
  /** The signature sound, played as the round starts (the only cue under Silent). */
  cue: SfxName;
  /** Caption for that sound. */
  caption: string;
  create(ctx: MicrogameContext): Scene;
}

export type Boss = Microgame<BossId> & { name: string };
