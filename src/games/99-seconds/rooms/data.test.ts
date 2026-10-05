// The chapters as data (Plan/03-99-seconds.md §10, §12): everything they mention exists, every close-up has a way
// back, hotspots fit the scene, every sound that's a clue has a caption, and every goal's answer goes in the journal.
import { describe, expect, it } from "vitest";
import type { Condition, Effect } from "../core/types";
import { CHAPTERS } from "../core/types";
import { CHAPTER_DEFS } from ".";
import { NOTES } from "./clock-room";

function effectsOf(e: readonly Effect[]): Effect[] {
  return e.flatMap((x) => ("when" in x ? [x, ...effectsOf(x.then), ...effectsOf(x.else ?? [])] : [x]));
}

function cluesIn(c: Condition): string[] {
  if ("clue" in c) return [c.clue];
  if ("not" in c) return cluesIn(c.not);
  if ("any" in c) return c.any.flatMap(cluesIn);
  if ("all" in c) return c.all.flatMap(cluesIn);
  return [];
}

describe("the chapters' data", () => {
  for (const id of CHAPTERS) {
    const ch = CHAPTER_DEFS[id];
    const hotspotIds = new Set(ch.hotspots.map((h) => h.id));
    const itemIds = new Set(ch.items.map((i) => i.id));
    const clueIds = new Set(ch.clues.map((c) => c.id));
    const views = new Set(["north", "east", "south", "west", ...Object.keys(ch.closeups)]);
    const allEffects = [...ch.interactions.flatMap((i) => effectsOf(i.effects)), ...ch.events.flatMap((e) => effectsOf(e.effects)), ...ch.processes.flatMap((p) => effectsOf(p.effects)), ...ch.atZero.flatMap((z) => effectsOf(z.effects))];

    it(`${id}: everything it mentions exists`, () => {
      for (const i of ch.interactions) {
        if (i.on.startsWith("item:")) expect(itemIds.has(i.on.slice(5)), i.id).toBe(true);
        else expect(hotspotIds.has(i.on), `${i.id} → ${i.on}`).toBe(true);
        if (i.use) expect(itemIds.has(i.use), `${i.id} uses ${i.use}`).toBe(true);
      }
      for (const e of allEffects) {
        if ("revealClue" in e) expect(clueIds.has(e.revealClue), e.revealClue).toBe(true);
        if ("giveItem" in e) expect(itemIds.has(e.giveItem), e.giveItem).toBe(true);
        if ("goToView" in e) expect(views.has(e.goToView), e.goToView).toBe(true);
      }
      for (const g of ch.goals) expect(clueIds.has(g.done), g.done).toBe(true);
      for (const i of ch.interactions) for (const c of i.requires ?? []) for (const clue of cluesIn(c)) expect(clueIds.has(clue)).toBe(true);
      expect(new Set(ch.hotspots.map((h) => h.id)).size).toBe(ch.hotspots.length);
      expect(new Set(ch.interactions.map((i) => i.id)).size).toBe(ch.interactions.length);
      expect(new Set(ch.clues.map((c) => c.id)).size).toBe(ch.clues.length);
    });

    it(`${id}: every close-up has a way back, and every hotspot is somewhere you can see, big enough to hit`, () => {
      for (const [closeup, parent] of Object.entries(ch.closeups)) {
        expect(closeup.startsWith("closeup:")).toBe(true);
        expect(["north", "east", "south", "west"]).toContain(parent);
      }
      for (const h of ch.hotspots) {
        expect(views.has(h.view), `${h.id} on ${h.view}`).toBe(true);
        if (h.zoom) expect(views.has(h.zoom), h.zoom).toBe(true);
        const [x, y, w, hh] = h.box;
        expect(x >= 0 && y >= 0 && x + w <= 1600 && y + hh <= 900, h.id).toBe(true);
        expect(Math.min(w, hh), h.id).toBeGreaterThanOrEqual(50);
        expect(h.label.length).toBeGreaterThan(2);
      }
    });

    it(`${id}: nothing you can use hides under the turn tabs or the Back button, even on a phone on its side`, () => {
      // The smallest room that has them: a 640×360 phone on its side draws it 398 px wide. The tabs are 44×64 px,
      // flush with its sides; Back is a 44 px square 8 px in from the top-left (ninety.module.css .arrow, .backBtn;
      // all in pixels, whatever the text size). Upright, they're under the room; on a computer, the room's bigger.
      const px = 1600 / 398;
      type Box = [x: number, y: number, w: number, h: number];
      const tabs: Box[] = [
        [0, 450 - 32 * px, 44 * px, 64 * px],
        [1600 - 44 * px, 450 - 32 * px, 44 * px, 64 * px],
      ];
      const back: Box[] = [[8 * px, 8 * px, 44 * px, 44 * px]];
      for (const h of ch.hotspots) {
        const [x, y, w, hh] = h.box;
        for (const [zx, zy, zw, zh] of h.view.startsWith("closeup:") ? back : tabs) {
          const covered = Math.max(0, Math.min(x + w, zx + zw) - Math.max(x, zx)) * Math.max(0, Math.min(y + hh, zy + zh) - Math.max(y, zy));
          expect(covered / (w * hh), h.id).toBeLessThanOrEqual(0.15);
        }
      }
    });

    it(`${id}: every sound that tells you something has a caption (rule 6), and the journal records every goal's answer (rule 5)`, () => {
      for (const e of ch.events) for (const x of effectsOf(e.effects)) if ("playSound" in x) expect(x.caption, `${x.playSound} at ${e.at}`).toBeTruthy();
      for (const p of ch.processes) for (const x of effectsOf(p.effects)) if ("playSound" in x) expect(x.caption, `${x.playSound} (${p.id})`).toBeTruthy();
      for (const c of ch.clues) {
        expect(c.text.length).toBeGreaterThan(5);
        if (c.kind === "event") expect(c.at, c.id).toBeTypeOf("number");
        if (c.kind === "code") expect(c.code).toMatch(/^\d+$/);
        if (c.kind === "note") expect(c.note).toBeTruthy();
      }
      for (const g of ch.goals) {
        expect(g.stages).toHaveLength(3);
        for (const s of g.stages) expect(s).toBe(s.toUpperCase());
      }
    });
  }

  it("the three notes in your handwriting are the three the notepad wants", () => {
    const notes = CHAPTERS.flatMap((id) => CHAPTER_DEFS[id].clues.filter((c) => c.kind === "note").map((c) => c.note));
    expect(notes.sort()).toEqual(["LEAVE AT ZERO", "THE CLOCK KNOWS THE REST", "THE OVEN IS HONEST"]);
    expect(NOTES.filter((n) => n.real).map((n) => n.text).sort()).toEqual(notes);
  });
});
