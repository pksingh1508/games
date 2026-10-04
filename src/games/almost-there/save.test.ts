import { beforeEach, describe, expect, it } from "vitest";
import { logFromText } from "@/engine/replay";
import { newClimb, tickClimb, type Climb } from "./core/climb";
import { almostThereSave, clearClimb, climbBackup, climbSave, defaultAlmostThereSave, loadClimb, writeClimb } from "./save";
import { getMountain } from "./world";
import { ROUTES } from "./world/routes";

/** A climb partway up, mid-air. */
function midAir(): Climb {
  const m = getMountain();
  const c = newClimb(m);
  let i = 0;
  for (const [bits, n] of logFromText(ROUTES.normal.up)) {
    for (let k = 0; k < n; k++, i++) {
      tickClimb(m, c, bits);
      if (i > 3000 && !c.sim.pip.grounded && c.sim.pip.vy > 1) return c;
    }
  }
  throw new Error("never in the air");
}

describe("saves", () => {
  beforeEach(() => {
    localStorage.clear();
    climbSave.reload();
    climbBackup.reload();
    almostThereSave.reload();
  });

  it("a climb saved mid-air comes back exactly as it was", () => {
    const c = midAir();
    writeClimb(c, 10_000);
    climbSave.reload();
    expect(loadClimb()).toEqual(JSON.parse(JSON.stringify(c)));
    expect(JSON.parse(localStorage.getItem("mfg:game:almost-there:climb")!).climb.sim.pip.grounded).toBe(false);
  });

  it("a damaged climb falls back to the previous one", () => {
    const c = midAir();
    writeClimb(c, 20_000);
    localStorage.setItem("mfg:game:almost-there:climb", "{ not json");
    climbSave.reload();
    expect(climbSave.get().climb).toBeNull();
    expect(loadClimb()).toEqual(JSON.parse(JSON.stringify(c)));
  });

  it("the end of a climb clears both copies", () => {
    writeClimb(midAir(), 30_000);
    clearClimb();
    climbSave.reload();
    climbBackup.reload();
    expect(loadClimb()).toBeNull();
  });

  it("the record's defaults match its format", () => {
    almostThereSave.set(defaultAlmostThereSave());
    almostThereSave.flush();
    almostThereSave.reload();
    expect(almostThereSave.get()).toEqual(defaultAlmostThereSave());
  });
});
