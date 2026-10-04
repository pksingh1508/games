// The OS's sabotage (Plan/12-cursor-escape.md §3): what's in force at a tick, all of it put together.
// Turning movement (invert, rotate, sensitivity) multiplies into one matrix; the others combine simply.
// Steady mode (comfort) softens each one: inversions become gentle rotations, lag is halved, drift and
// big cursors are smaller, trails shorter.
import type { Effect } from "./level";

/** Everything the sabotage is doing at once. */
export interface Rules {
  /** Hand to cursor: [a, b, c, d] for x' = a x + b y, y' = c x + d y. */
  m: [number, number, number, number];
  /** Lag: the share of the gap to the hand the cursor closes each tick (1: no lag). */
  follow: number;
  driftX: number;
  driftY: number;
  /** Fake cursor offset (null: none). */
  fake: { dx: number; dy: number } | null;
  decoys: number;
  /** Hitbox (and sprite) scale. */
  scale: number;
  /** Trail stays solid this many ticks (0: no trail). */
  trail: number;
  /** Movement is turned at all (the arrow's drawn mirrored): for the HUD and for Ambidextrous. */
  turned: boolean;
}

export const NO_RULES: Rules = { m: [1, 0, 0, 1], follow: 1, driftX: 0, driftY: 0, fake: null, decoys: 0, scale: 1, trail: 0, turned: false };

const rotation = (degrees: number): [number, number, number, number] => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.round(Math.cos(r) * 1e9) / 1e9;
  const s = Math.round(Math.sin(r) * 1e9) / 1e9;
  return [c, -s, s, c];
};

const mul = (a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number] => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
];

/** Steady mode: the same sabotage, gentler. */
export function soften(effect: Effect): Effect | { type: "turn"; degrees: number } {
  switch (effect.type) {
    case "invert":
      return { type: "turn", degrees: effect.axes === "x" ? 25 : effect.axes === "y" ? -25 : 35 };
    case "rotate":
      return { type: "turn", degrees: effect.degrees === 90 ? 25 : effect.degrees === 180 ? 35 : -25 };
    case "lag":
      return { type: "lag", follow: Math.min(1, effect.follow * 2) };
    case "sensitivity":
      return { type: "sensitivity", multiplier: Math.sqrt(effect.multiplier) };
    case "drift":
      return { type: "drift", vx: effect.vx / 2, vy: effect.vy / 2 };
    case "decoys":
      return { type: "decoys", count: Math.max(2, effect.count - 1) };
    case "largeCursor":
      return { type: "largeCursor", scale: 1 + (effect.scale - 1) / 2 };
    case "solidTrail":
      return { type: "solidTrail", trail: Math.round(effect.trail / 2) };
    default:
      return effect;
  }
}

/** All of these at once. */
export function rulesOf(effects: ReadonlyArray<Effect | { type: "turn"; degrees: number }>): Rules {
  if (effects.length === 0) return NO_RULES;
  const rules: Rules = { ...NO_RULES, m: [1, 0, 0, 1] };
  for (const e of effects) {
    switch (e.type) {
      case "invert":
        rules.m = mul(e.axes === "x" ? [-1, 0, 0, 1] : e.axes === "y" ? [1, 0, 0, -1] : [-1, 0, 0, -1], rules.m);
        rules.turned = true;
        break;
      case "rotate":
        rules.m = mul(rotation(e.degrees), rules.m);
        rules.turned = true;
        break;
      case "turn":
        rules.m = mul(rotation(e.degrees), rules.m);
        rules.turned = true;
        break;
      case "sensitivity":
        rules.m = mul([e.multiplier, 0, 0, e.multiplier], rules.m);
        break;
      case "lag":
        rules.follow = Math.min(rules.follow, e.follow);
        break;
      case "drift":
        rules.driftX += e.vx;
        rules.driftY += e.vy;
        break;
      case "fakeCursor":
        rules.fake = { dx: e.dx, dy: e.dy };
        break;
      case "decoys":
        rules.decoys = Math.max(rules.decoys, e.count);
        break;
      case "largeCursor":
        rules.scale = Math.max(rules.scale, e.scale);
        break;
      case "solidTrail":
        rules.trail = Math.max(rules.trail, e.trail);
        break;
      case "recentre":
        break;
    }
  }
  return rules;
}

/** What the notification says (Plan §3: "Mouse settings updated ✓"). */
export function noticeOf(effect: Effect): { title: string; body: string } {
  switch (effect.type) {
    case "invert":
      return {
        title: "Mouse settings updated",
        body: effect.axes === "x" ? "Swap left and right ✓" : effect.axes === "y" ? "Swap up and down ✓" : "Swap everything ✓",
      };
    case "rotate":
      return { title: "Display settings updated", body: `Pointer rotated ${effect.degrees}° ✓` };
    case "lag":
      return { title: "Mouse settings updated", body: "Pointer smoothing: maximum ✓" };
    case "sensitivity":
      return { title: "Mouse settings updated", body: effect.multiplier > 1 ? "Pointer speed: fastest ✓" : "Pointer speed: slowest ✓" };
    case "drift":
      return { title: "Mouse settings updated", body: "Pointer drift calibration ✓" };
    case "fakeCursor":
      return { title: "Display settings updated", body: "Pointer shadow: offset ✓" };
    case "decoys":
      return { title: "Accessibility settings updated", body: `Show ${effect.count} extra pointers ✓` };
    case "largeCursor":
      return { title: "Accessibility settings updated", body: "Pointer size: extra large ✓" };
    case "solidTrail":
      return { title: "Mouse settings updated", body: "Pointer trails: enabled ✓" };
    case "recentre":
      return { title: "For your convenience", body: "Pointer moved to the middle ✓" };
  }
}
