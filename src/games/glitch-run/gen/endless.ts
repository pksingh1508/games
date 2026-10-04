// An endless (or daily) run's track, built as you go (Plan/07-glitch-run.md §5, §10.5). Each chunk the
// generator offers is tried by the reference run first, on its own copy of the track: if there's no
// way through it from where the last one left off, it's taken back and another is tried. The way
// through is what the cues (sounds and the beat bar) announce.
import { createRun, type RunConfig } from "../core/run";
import { cuesOf, search, startOf, type Cue, type Node } from "../core/reference";
import { Track, type Chunk } from "../core/track";
import { BEAT_TILES } from "../core/constants";
import { ENDLESS_TEMPO, Generator } from "./generator";

const copy = (chunk: Chunk): Chunk => ({ ...chunk, cells: chunk.cells.slice() });

export class EndlessTrack {
  readonly track = new Track();
  readonly generator: Generator;
  /** The cues of the best way through so far (it can still change ahead of you as track is added). */
  cues: Cue[] = [];
  /** The reference run's own track (it collects bits too, so it can't share the real one). */
  private readonly shadow = new Track();
  /** Every different way through so far (each carries on into the next chunk). */
  private frontier: Node[];

  constructor(seed: number) {
    this.generator = new Generator(seed);
    this.frontier = startOf(createRun({ track: this.shadow, tempo: ENDLESS_TEMPO, finishCol: null }));
  }

  /** The run's config: endless tempo, no finish, and this as the feed. */
  config(extra: Partial<RunConfig> = {}): RunConfig {
    return { track: this.track, tempo: ENDLESS_TEMPO, finishCol: null, drift: 0.4, feed: () => this.feed(), ...extra };
  }

  /** Add one chunk that the reference run can get through. */
  feed() {
    const beat = this.shadow.cols / BEAT_TILES;
    const skip = new Set<string>();
    for (let tries = 0; tries < 12; tries++) {
      const chunk = this.generator.choose(beat, skip);
      this.shadow.append(copy(chunk));
      // A beat short of the end: the search only stops on half-beats, and must not run off the edge.
      const found = search(this.frontier, this.shadow.cols - BEAT_TILES);
      if (found) {
        this.frontier = found.frontier;
        this.cues = cuesOf(found.moves);
        this.track.append(copy(chunk));
        this.generator.accept(chunk, beat);
        return;
      }
      this.shadow.pop();
      skip.add(chunk.id);
    }
    throw new Error(`No chunk fits at beat ${beat}`);
  }
}
