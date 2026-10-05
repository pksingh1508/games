// Don't Trust The Game's local save (Plan/04-dont-trust-the-game.md §12 "Persistence"): where the story is (and a
// separate Truth Mode run), each chapter's record, the 12 secrets, how often you trusted HELPER, the endings, and
// whether you've come back since. Plus the settings that live outside the fiction. The reload puzzle uses
// sessionStorage (browser/tricks.ts), not this.
import * as v from "valibot";
import { defineSave, type SaveDef } from "@/engine/save";
import { SCENES, type SceneId } from "./core/story";

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));
const Scene = v.nullable(v.picklist(SCENES));

const Chapter = v.object({
  /** Times finished. */
  done: Count,
  /** Lies believed during the last time through. */
  believed: Count,
  /** Fastest time through (ms), or 0. */
  bestMs: Count,
});

const DttgSaveV1 = v.object({
  v: v.literal(1),
  /** Where the story is (null: not started). */
  scene: Scene,
  /** Truth Mode's run, after the ending. */
  truthScene: Scene,
  /** The logo has cracked: the title shows the real name. */
  cracked: v.boolean(),
  chapters: v.object({ 1: Chapter, 2: Chapter, 3: Chapter, 4: Chapter, 5: Chapter, 6: Chapter }),
  secrets: v.record(v.string(), v.number()),
  trust: v.object({ believed: Count, doubted: Count }),
  /** How the game last ended, and how often each way. */
  ending: v.nullable(v.picklist(["quit", "stay"])),
  endings: v.object({ quit: Count, stay: Count }),
  /** "You came back." has been said (it's said once, on the first visit after the ending). */
  cameBack: v.boolean(),
  achievements: v.record(v.string(), v.number()),
  deaths: Count,
  playMs: Count,
  prefs: v.object({
    /** Captions for the sounds that are clues. */
    captions: v.boolean(),
    speed: v.picklist(["slow", "normal", "fast", "instant"]),
    /** Say HELPER's eyes out loud, for players who can't see the glance. */
    describeEyes: v.boolean(),
    /** Assist: nothing hurts. */
    invincible: v.boolean(),
    /** TRUTH.exe turns up sooner. */
    sooner: v.boolean(),
  }),
});
export type DttgSave = v.InferOutput<typeof DttgSaveV1>;
export type ChapterNo = 1 | 2 | 3 | 4 | 5 | 6;
export type Prefs = DttgSave["prefs"];

const emptyChapter = () => ({ done: 0, believed: 0, bestMs: 0 });

export const defaultDttgSave = (): DttgSave => ({
  v: 1,
  scene: null,
  truthScene: null,
  cracked: false,
  chapters: { 1: emptyChapter(), 2: emptyChapter(), 3: emptyChapter(), 4: emptyChapter(), 5: emptyChapter(), 6: emptyChapter() },
  secrets: {},
  trust: { believed: 0, doubted: 0 },
  ending: null,
  endings: { quit: 0, stay: 0 },
  cameBack: false,
  achievements: {},
  deaths: 0,
  playMs: 0,
  prefs: { captions: true, speed: "normal", describeEyes: false, invincible: false, sooner: false },
});

export const dttgSaveDefinition: SaveDef<DttgSave> = {
  key: "mfg:game:dont-trust-the-game",
  version: 1,
  schema: DttgSaveV1,
  defaults: defaultDttgSave,
};

export const dttgSave = defineSave<DttgSave>(dttgSaveDefinition);

export type { SceneId };
