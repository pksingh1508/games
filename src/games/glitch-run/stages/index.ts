// The story stages, built when they're first played (each is proven clearable as it's built).
import { buildStage, type Stage, type StageSource } from "./build";
import { STAGES } from "./stages";

export const STAGE_IDS = STAGES.map((s) => s.id);
export const FINAL_STAGE = STAGE_IDS[STAGE_IDS.length - 1]!;

const built = new Map<string, Stage>();

export function getStage(id: string): Stage {
  let stage = built.get(id);
  if (!stage) {
    const src = STAGES.find((s) => s.id === id);
    if (!src) throw new Error(`No stage ${id}`);
    stage = buildStage(src);
    built.set(id, stage);
  }
  return stage;
}

export const stageSource = (id: string): StageSource => STAGES.find((s) => s.id === id)!;

/** "stage_04.exe" (the file browser's names). */
export const fileName = (id: string) => `stage_${id}.exe`;
