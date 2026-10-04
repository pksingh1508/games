// The reference run (Plan/07-glitch-run.md §10.5, §12): a search over what a player can do on every
// half-beat (run, jump, hop, slide, and in story chases Clip), using the real simulation. It proves a
// stretch of track can be passed (every endless chunk, every story stage), and its path is what the
// audio cues and the visual beat bar announce: "jump on the next beat", one beat ahead.
import { BITS_PER_CHARGE, GLITCH, JUMP, SLIDE, TILE } from "./constants";
import { step, ticksAt, type Run } from "./run";

export type Move = "run" | "jump" | "hop" | "slide" | "clip";

export interface Cue {
  /** The tick to act on (always a beat or a half-beat). */
  tick: number;
  move: Exclude<Move, "run" | "hop"> | "hop";
}

/** Input bits for a move, `k` ticks into its half-beat. */
function bitsFor(move: Move, k: number): number {
  switch (move) {
    case "run":
      return 0;
    case "jump":
      return JUMP;
    case "hop":
      return k < 5 ? JUMP : 0;
    case "slide":
      return SLIDE;
    case "clip":
      return k < 2 ? GLITCH : 0;
  }
}

/** What a Clip costs the search, against 1 for any other move. */
const CLIP_COST = 12;

/** Ticks from here to the next half-beat. */
function toNextHalf(run: Run): number {
  const ticks = ticksAt(run.config, run.beat);
  const half = Math.ceil(ticks / 2);
  return run.beatTick < half ? half - run.beatTick : ticks - run.beatTick;
}

/** A move made: on `tick` and for `span` ticks (to the next half-beat). `held`: a jump kept held from the half-beat before. */
export interface Step {
  tick: number;
  move: Move;
  span: number;
  held?: boolean;
}

/** The actions so far, newest first (ways that branch off share what came before: endless runs get long). */
export interface Path extends Step {
  before: Path | null;
}

export interface Node {
  run: Run;
  cost: number;
  path: Path | null;
  /** The last half-beat's move (a jump held on into the next half-beat is the same jump). */
  prev: Move;
}

const clone = (run: Run): Run => ({ ...run, runner: { ...run.runner } });

/** What makes two moments different for the runner's body. */
function key(run: Run): string {
  const r = run.runner;
  return `${r.y},${Math.round(r.vy * 4)},${r.grounded ? 1 : 0},${r.sliding ? 1 : 0},${r.jumpHeld ? 1 : 0},${r.rising ? 1 : 0},${r.coyote},${r.buffer},${r.clip}`;
}

/** Glitch power in hand: charges, and the bits toward the next. More can do anything less can. */
const energy = (run: Run) => run.charges * BITS_PER_CHARGE + run.bits;

export interface SearchOptions {
  /** Story chases: Clip through full scan lines (with the charges the stage gives you). */
  allowClip?: boolean;
  /** Keep at most this many different states per half-beat. */
  beam?: number;
}

export interface Found {
  /** The cheapest way (fewest actions): its moves (running along isn't one), and where it ends. */
  moves: Step[];
  end: Run;
  /** Every different way that got there (to carry on from, when more track is added). */
  frontier: Node[];
}

/** Where a search starts: a run (its track is used as it is: pass a copy if pickups matter). */
export const startOf = (run: Run): Node[] => [{ run: clone(run), cost: 0, path: null, prev: "run" }];

function movesOf(path: Path | null): Step[] {
  const moves: Step[] = [];
  for (let p = path; p; p = p.before) moves.push({ tick: p.tick, move: p.move, span: p.span, ...(p.held ? { held: true } : {}) });
  return moves.reverse();
}

/**
 * Find the cheapest way (fewest actions) from `from` to column `untilCol`, acting only on half-beats.
 * Null: no way.
 */
export function search(from: Run | Node[], untilCol: number, { allowClip = false, beam = 600 }: SearchOptions = {}): Found | null {
  const moves: Move[] = allowClip ? ["run", "jump", "hop", "slide", "clip"] : ["run", "jump", "hop", "slide"];
  let frontier: Node[] = Array.isArray(from) ? from : startOf(from);
  const goal = untilCol * TILE;
  for (let guard = 0; guard < 100_000 && frontier.length; guard++) {
    // Everyone moves together (where you are on the track depends only on the tick).
    if (frontier[0]!.run.runner.x >= goal || frontier.some((n) => n.run.status === "won")) {
      const done = [...frontier].sort((a, b) => a.cost - b.cost);
      return { moves: movesOf(done[0]!.path), end: done[0]!.run, frontier: done };
    }
    const next = new Map<string, Node>();
    for (const node of frontier) {
      const span = toNextHalf(node.run);
      for (const move of moves) {
        if (move === "clip" && (node.run.charges === 0 || node.run.runner.clip > 0)) continue;
        const run = clone(node.run);
        const at = run.tick + 1;
        for (let k = 0; k < span && run.status === "run"; k++) step(run, bitsFor(move, k));
        if (run.status === "dead") continue;
        const held = move === "jump" && node.prev === "jump";
        // Clip only where nothing else will do (the cues must work for a player with no charge to spare).
        const cost = node.cost + (move === "run" || held ? 0 : move === "clip" ? CLIP_COST : 1);
        const id = key(run);
        const seen = next.get(id);
        // Two ways to the same moment: keep the cheaper, unless Clip's in play and the other has more
        // glitch power in hand (then it can do everything the cheaper one can, and more).
        const better = !seen || (allowClip && energy(run) !== energy(seen.run) ? energy(run) > energy(seen.run) : cost < seen.cost);
        if (better) next.set(id, { run, cost, path: move === "run" ? node.path : { tick: at, move, span, held, before: node.path }, prev: move });
      }
    }
    frontier = [...next.values()];
    if (frontier.length > beam) {
      frontier.sort((a, b) => a.cost - b.cost);
      frontier = frontier.slice(0, beam);
    }
  }
  return null;
}

/** The cues a path gives: when to act, and how (a jump held on is the same jump). */
export const cuesOf = (moves: readonly Step[]): Cue[] => moves.filter((m) => m.move !== "run" && !m.held).map((m) => ({ tick: m.tick, move: m.move as Cue["move"] }));

/** Plays a path back exactly, tick by tick (the tests, and QA's autoplay). */
export class PathPlayer {
  private i = 0;

  constructor(private readonly moves: readonly Step[]) {}

  /** The input bits for the run's next step. */
  next(run: Run): number {
    const tick = run.tick + 1;
    while (this.i < this.moves.length && this.moves[this.i]!.tick + this.moves[this.i]!.span <= tick) this.i++;
    const m = this.moves[this.i];
    return m && m.tick <= tick ? bitsFor(m.move, tick - m.tick) : 0;
  }
}
