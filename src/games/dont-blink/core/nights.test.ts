// The nights (Plan/14-dont-blink.md §5) and the rooms' catalogue (§12): every night has plenty to change in
// every camera it uses, subtle changes only come later, and every anomaly points at a real object.
import { describe, expect, it } from "vitest";
import { SCENES } from "../scenes";
import { ALL_CAMERAS, ANOMALIES, OBJECTS } from "./catalogue";
import { eligible } from "./director";
import { customNight, DEFAULT_CUSTOM, endlessHour, NIGHTS, nightConfig } from "./nights";
import { ANOMALY_TYPES } from "./types";

describe("the nights", () => {
  it("get harder: faster blinks, more changes, subtler ones, a more restless Visitor", () => {
    for (let i = 1; i < NIGHTS.length; i++) {
      const [a, b] = [NIGHTS[i - 1]!, NIGHTS[i]!];
      expect(b.blink[1]).toBeLessThanOrEqual(a.blink[1]);
      expect(b.subtlety[1]).toBeGreaterThanOrEqual(a.subtlety[1]);
      expect(b.visitor).toBeGreaterThanOrEqual(a.visitor);
      expect(b.photos).toBeLessThanOrEqual(a.photos + 1);
    }
    expect(nightConfig(1).visitor).toBe(0);
    expect(nightConfig(1).subtlety).toEqual([1, 2]);
    expect(nightConfig(5).subtlety[1]).toBe(5);
    expect(nightConfig(1).cameras).toHaveLength(3);
  });

  it("bring their tricks in order (§5)", () => {
    expect(nightConfig(2).features).toEqual([]);
    expect(nightConfig(3).features).toEqual(expect.arrayContaining(["staticBlink", "flicker"]));
    expect(nightConfig(4).features).toEqual(expect.arrayContaining(["fakeBlink", "gradual", "officeAnomalies"]));
    expect(nightConfig(4).features).not.toContain("mirror");
    expect(nightConfig(5).features).toEqual(expect.arrayContaining(["mirror", "itKnows", "lyingHud", "misdirection"]));
  });

  it("each have plenty to change in every camera they use", () => {
    for (const config of NIGHTS) {
      const pool = eligible(config, { colour: true, gradual: false });
      for (const camera of config.cameras) {
        if (camera === "office" && !config.features.includes("officeAnomalies")) continue;
        expect(pool.filter((a) => a.camera === camera).length, `night ${config.night}, ${camera}`).toBeGreaterThanOrEqual(5);
      }
      // Without colour changes too.
      expect(eligible(config, { colour: false, gradual: false }).length).toBeGreaterThan(20);
    }
    expect(eligible(nightConfig(4), { colour: true, gradual: true }).length).toBeGreaterThanOrEqual(5);
  });

  it("Endless climbs an hour at a time and never lies about the time", () => {
    expect(endlessHour(0).rate).toBeLessThan(endlessHour(8).rate);
    expect(endlessHour(8).rate).toBeLessThan(endlessHour(14).rate);
    expect(endlessHour(14).blink[0]).toBeLessThan(endlessHour(4).blink[0]);
    for (let h = 0; h < 30; h++) expect(endlessHour(h).features).not.toContain("lyingHud");
  });

  it("Custom Night is what you set", () => {
    const c = customNight({ ...DEFAULT_CUSTOM, blink: 3, visitor: 0.9, office: true, mirror: true, subtlety: 5 });
    expect(c.blink[0]).toBeLessThan(3);
    expect(c.visitor).toBe(0.9);
    expect(c.cameras).toContain("office");
    expect(c.features).toEqual(expect.arrayContaining(["officeAnomalies", "mirror"]));
    expect(c.subtlety).toEqual([1, 5]);
    expect(customNight(DEFAULT_CUSTOM).features).toEqual([]);
  });
});

describe("the rooms", () => {
  it("every anomaly is one change to a real object in its own room, with a drawing for every variant", () => {
    const ids = new Set<string>();
    for (const a of ANOMALIES) {
      expect(ids.has(a.id), a.id).toBe(false);
      ids.add(a.id);
      if (a.object === "@view") {
        expect(a.type).toBe("mirror");
        continue;
      }
      const o = OBJECTS.get(a.object);
      expect(o, a.id).toBeDefined();
      expect(o!.camera).toBe(a.camera);
      expect(Object.keys(a.set).length, a.id).toBeGreaterThan(0);
      // A change that makes something appear only targets things that start hidden, and vice versa.
      if (a.set.visible === true) expect(o!.base.visible).toBe(false);
      if (a.set.visible === false) expect(o!.base.visible).toBe(true);
      if (!o!.base.visible) expect(["extra", "intruder"]).toContain(a.type);
      if (a.gradual) expect(Object.keys(a.set).every((k) => ["x", "y", "tint"].includes(k)), a.id).toBe(true);
    }
    for (const c of ALL_CAMERAS) {
      const scene = SCENES[c];
      for (const o of scene.objects) expect(scene.draw[o.kind], o.id).toBeTypeOf("function");
    }
  });

  it("every kind of change turns up somewhere", () => {
    for (const t of ANOMALY_TYPES) expect(ANOMALIES.some((a) => a.type === t), t).toBe(true);
    // ~15 per room (§12 "Technical risks").
    for (const c of ALL_CAMERAS) expect(ANOMALIES.filter((a) => a.camera === c).length, c).toBeGreaterThanOrEqual(11);
  });

  it("the Visitor stands in every room on its route", () => {
    for (const c of ["sculpture", "gallery", "lobby", "corridor", "office"] as const) expect(SCENES[c].visitor, c).toBeDefined();
  });
});
