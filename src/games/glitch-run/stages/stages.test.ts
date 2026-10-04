import { beforeAll, describe, expect, it } from "vitest";
import { BEAT_TILES, TELEGRAPH_MIN } from "../core/constants";
import { PathPlayer } from "../core/reference";
import { beatStart, createRun, step, ticksAt } from "../core/run";
import { Director, MAX_AT_ONCE } from "../glitches/director";
import { onAt, type GlitchKind } from "../glitches/kinds";
import type { Stage } from "./build";
import { FINAL_STAGE, getStage, STAGE_IDS } from "./index";
import { STAGES } from "./stages";

/** What each stage brings in (Plan/07-glitch-run.md §5). */
const TEACHES: Record<string, GlitchKind> = {
  "02": "frameSkip",
  "03": "inputSwap",
  "04": "screenTear",
  "05": "missingTexture",
  "06": "invert",
  "07": "audioDesync",
  "08": "dejaVu",
  "09": "lowRes",
  "10": "ghostDouble",
  "16": "notResponding",
  "17": "upsideDown",
};

const built = new Map<string, Stage>();
const stage = (id: string) => built.get(id)!;

/** The director, run along a stage's timeline (it only ever reads the run's clock). */
function glitchesOf(s: Stage) {
  const run = createRun({ ...s.config, track: s.config.track.clone() });
  const director = new Director({ plan: s.plan });
  const last = beatStart(run.config, s.beats);
  for (let tick = 0; tick <= last; tick++) {
    const ticks = ticksAt(run.config, 0);
    director.update({
      tick,
      beat: Math.floor(tick / ticks),
      beatTick: tick % ticks,
      corruption: run.corruption,
      panic: 0,
      beatStart: (b) => beatStart(run.config, b),
      ticksAt: (b) => ticksAt(run.config, b),
    });
  }
  return { director, last };
}

describe("the story", () => {
  // Building a stage proves it can be cleared: the reference run gets to the exit (or it throws).
  beforeAll(() => {
    for (const id of STAGE_IDS) built.set(id, getStage(id));
  }, 300_000);

  it("is twenty stages, in order, ending at Root", () => {
    expect(STAGE_IDS).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, "0")));
    expect(STAGES[0]!.name).toBe("Boot Sequence");
    expect(FINAL_STAGE).toBe("20");
    expect(STAGES[19]!.name).toBe("Root");
  });

  it("can be cleared, every stage, by a run that only acts on the beat", () => {
    for (const id of STAGE_IDS) {
      const s = stage(id);
      expect(s.cues.length, id).toBeGreaterThan(10);
      // Every cue is on a beat or a half-beat (that's what the sounds and the beat bar can announce).
      const ticks = ticksAt(s.config, 0);
      for (const cue of s.cues) expect([0, Math.ceil(ticks / 2)], `${id} @${cue.tick}`).toContain((cue.tick - 1) % ticks);
    }
  });

  it("is cleared by playing the reference run's moves (the cues) through the real simulation", () => {
    for (const id of STAGE_IDS) {
      const s = stage(id);
      const run = createRun({ ...s.config, track: s.config.track.clone() });
      const player = new PathPlayer(s.moves);
      while (run.status === "run" && run.tick < 60 * 60 * 5) step(run, player.next(run));
      expect(run.status, `${id}: ${run.cause} at ${run.runner.x}`).toBe("won");
    }
  });

  it("ends every stage with The Debugger's chase", () => {
    for (const id of STAGE_IDS) {
      const s = stage(id);
      expect(s.chaseFrom, id).not.toBeNull();
      expect(s.config.scans?.length, id).toBeGreaterThanOrEqual(3);
      for (const scan of s.config.scans ?? []) expect(scan.beat, id).toBeGreaterThan(s.chaseFrom!);
    }
  });

  it("teaches one glitch at a time, in the plan's order", () => {
    for (const [id, kind] of Object.entries(TEACHES)) {
      const kinds = stage(id).plan.map((p) => p.kind);
      expect(kinds, id).toContain(kind);
      // Nothing turns up before the stage that teaches it.
      const earlier = STAGE_IDS.filter((other) => other < id);
      for (const other of earlier) {
        // Boot Sequence ends with a taste of what's coming: a single Screen Tear in its last second.
        if (other === "01") continue;
        expect(stage(other).plan.map((p) => p.kind), `${kind} before stage ${id} (in ${other})`).not.toContain(kind);
      }
    }
  });

  it("warns at least 0.6 s before every glitch, puts it on its beat, and never has more than two at once", () => {
    for (const id of STAGE_IDS) {
      const s = stage(id);
      const { director, last } = glitchesOf(s);
      expect(director.events.length, id).toBe(s.plan.length);
      for (const e of director.events) {
        expect(e.telegraph, id).toBeGreaterThanOrEqual(TELEGRAPH_MIN);
        expect(e.start, `${id}: ${e.kind} warns after the stage starts`).toBeGreaterThanOrEqual(0);
        const planned = s.plan.find((p) => p.kind === e.kind && beatStart(s.config, p.beat) === onAt(e));
        expect(planned, `${id}: ${e.kind} on its beat`).toBeDefined();
      }
      for (let tick = 0; tick <= last; tick++) expect(director.at(tick).length, `${id} @${tick}`).toBeLessThanOrEqual(MAX_AT_ONCE);
      // Everything comes on before the exit (Boot Sequence's one glitch lasts its very last second).
      for (const e of director.events) expect(onAt(e), id).toBeLessThan(beatStart(s.config, s.beats));
    }
  });

  it("only needs Clip for The Debugger's full scans, and leaves some stages to clear without it (Clean Code)", () => {
    let clean = 0;
    for (const id of STAGE_IDS) {
      const s = stage(id);
      const clips = s.cues.filter((c) => c.move === "clip").length;
      const full = (s.config.scans ?? []).filter((scan) => scan.kind === "full").length;
      expect(clips, id).toBeLessThanOrEqual(full);
      if (full === 0) clean++;
    }
    expect(clean).toBeGreaterThanOrEqual(3);
  });

  it("ends at Root: the ground deleted behind you, then a white void crossed by sound", () => {
    const root = stage(FINAL_STAGE);
    const fin = root.finale!;
    expect(fin).not.toBeNull();
    expect(fin.deleteFrom).toBeGreaterThan(root.chaseFrom!);
    expect(fin.voidFrom).toBeGreaterThan(fin.deleteFrom);
    expect(fin.voidTo).toBeLessThan(root.beats);
    // There's something to cross in the void, and the cues say when.
    const inVoid = root.cues.filter((c) => c.tick >= beatStart(root.config, fin.voidFrom) && c.tick < beatStart(root.config, fin.voidTo));
    expect(inVoid.length).toBeGreaterThanOrEqual(4);
    // Root hands you all three charges (it has three full scans).
    expect(root.config.charges).toBe(3);
    for (const id of STAGE_IDS.filter((i) => i !== FINAL_STAGE)) expect(stage(id).finale, id).toBeNull();
  });

  it("is a whole number of beats long, with the exit a beat after the last of it", () => {
    for (const id of STAGE_IDS) {
      const s = stage(id);
      expect(s.config.track.cols % BEAT_TILES, id).toBe(0);
      expect(s.config.finishCol, id).toBe(s.beats * BEAT_TILES);
    }
  });
});
