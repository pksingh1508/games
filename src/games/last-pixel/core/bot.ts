// A player made of code (Plan/10-last-pixel.md §14: "Every level can reach exactly 100% (tested with a
// script that covers every cell)"). It sweeps the job with the level's tools at a steady hand's speed,
// mops up what's left, then hunts Pix: chasing it, scrubbing it out of the ground, moving the HUD,
// pausing on a dead pixel, cornering a mimic, clicking it in the page, looking away from the tab. The tests
// play every level with it; the clean-up star's target time comes from its runs.
import { BEAT_TICKS, FULL, HZ } from "./constants";
import { dist, type Rect, type Vec } from "./geometry";
import type { Task, ToolId } from "./level";
import { TOOLS, TOOLS_FOR } from "./tools";
import type { Command, Input, World } from "./world";

/** How fast the bot's hand moves (cells a second): a calm, steady stroke. */
export const BOT_SPEED = 46;
/** How fast it chases Pix. */
export const BOT_CHASE = 70;

interface Stroke {
  tool: ToolId;
  points: Vec[];
}

/** The bounding box of each task's cells. */
function boxes(world: World): Map<Task, Rect> {
  const out = new Map<Task, { x0: number; y0: number; x1: number; y1: number }>();
  const { cov, w } = world;
  for (let i = 0; i < cov.size; i++) {
    const task = cov.taskAt(i);
    if (!task) continue;
    const x = i % w;
    const y = (i - x) / w;
    const b = out.get(task);
    if (!b) out.set(task, { x0: x, y0: y, x1: x, y1: y });
    else {
      b.x0 = Math.min(b.x0, x);
      b.y0 = Math.min(b.y0, y);
      b.x1 = Math.max(b.x1, x);
      b.y1 = Math.max(b.y1, y);
    }
  }
  return new Map([...out].map(([task, b]) => [task, { x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }]));
}

const toolFor = (world: World, task: Task): ToolId => TOOLS_FOR[task].find((t) => world.level.tools.includes(t))!;

/** Rows across a box, back and forth, `gap` apart. */
function rows(box: Rect, gap: number, inset: number, wiggle = 0): Vec[] {
  const pts: Vec[] = [];
  let left = true;
  for (let y = box.y + inset; y <= box.y + box.h - inset + gap * 0.5; y += gap) {
    const yy = Math.min(y, box.y + box.h - inset);
    const x0 = box.x + inset;
    const x1 = box.x + box.w - inset;
    if (wiggle) {
      // Scrubbing: little zig-zags along the row (the sponge cleans faster for it).
      const n = Math.ceil((x1 - x0) / 2);
      for (let k = 0; k <= n; k++) {
        const x = left ? x0 + ((x1 - x0) * k) / n : x1 - ((x1 - x0) * k) / n;
        pts.push({ x, y: yy + (k % 2 ? wiggle : -wiggle) });
      }
    } else {
      pts.push({ x: left ? x0 : x1, y: yy }, { x: left ? x1 : x0, y: yy });
    }
    left = !left;
  }
  return pts;
}

/** The plan for the clean-up: one or more strokes per task. */
export function cleanPlan(world: World): Stroke[] {
  const plan: Stroke[] = [];
  for (const [task, box] of boxes(world)) {
    const tool = toolFor(world, task);
    const def = TOOLS[tool];
    if (def.kind === "mower") {
      plan.push({ tool, points: rows(box, def.radius * 1.6, 1.5) });
    } else if (def.kind === "shovel") {
      // Down each band of the drive and off its nearer edge (top or bottom), a few times over.
      const pts: Vec[][] = [];
      for (let x = box.x + 2; x <= box.x + box.w - 2 + 3; x += def.radius * 1.5) {
        const xx = Math.min(x, box.x + box.w - 2);
        const up = box.y + box.h / 2 > world.h / 2;
        for (let pass = 0; pass < 3; pass++) {
          pts.push(up ? [{ x: xx, y: box.y + box.h - 1 }, { x: xx, y: box.y - 3 }] : [{ x: xx, y: box.y }, { x: xx, y: box.y + box.h + 3 }]);
        }
      }
      for (const points of pts) plan.push({ tool, points });
    } else if (tool === "sponge") {
      plan.push({ tool, points: rows(box, def.radius * 1.2, 1, 1.6) });
    } else if (tool === "scratch") {
      plan.push({ tool, points: rows(box, def.radius * 1.1, 0.5) });
      plan.push({ tool, points: rows(box, def.radius * 1.1, 1.8) });
    } else {
      plan.push({ tool, points: rows(box, def.core * 1.75, Math.min(def.core, 2)) });
    }
  }
  return plan;
}

/** Steering the mower: point a little way ahead along the route and wait for it to get there. */
function* steer(world: World, points: Vec[], tool: ToolId): Generator<Input> {
  const m = world.painter.mower;
  const route: Vec[] = [];
  let from: Vec = { x: m.x, y: m.y };
  for (const p of points) {
    const d = dist(from, p);
    const n = Math.max(1, Math.ceil(d / 1.5));
    for (let k = 1; k <= n; k++) {
      const x = from.x + ((p.x - from.x) * k) / n;
      const y = from.y + ((p.y - from.y) * k) / n;
      route.push({ x: Math.max(0.5, Math.min(world.w - 0.5, x)), y: Math.max(0.5, Math.min(world.h - 0.5, y)) });
    }
    from = p;
  }
  yield { pointer: route[0]!, down: true, path: [route[0]!], commands: [{ type: "tool", tool }, { type: "press", at: route[0]! }] };
  // A carrot on a stick: the pointer stays about 8 cells ahead, so the mower never brakes until the end.
  let k = 0;
  for (let n = 0; n < HZ * 4 + route.length * 6; n++) {
    while (k < route.length - 1 && dist(m, route[k]!) < 8) k++;
    const to = route[k]!;
    if (k === route.length - 1 && dist(m, to) < 1.5) break;
    yield { pointer: to, down: true, path: [to] };
  }
  yield { pointer: route[route.length - 1]!, down: false, commands: [{ type: "release" }] };
}

/** Inputs that walk a polyline at `speed`, button down (a press at the start, a release at the end). */
function* walk(world: World, points: Vec[], speed: number, tool: ToolId): Generator<Input> {
  if (TOOLS[tool].kind === "mower") {
    yield* steer(world, points, tool);
    return;
  }
  let at = points[0]!;
  yield { pointer: at, down: true, path: [at], commands: [{ type: "tool", tool }, { type: "press", at }] };
  const step = speed / HZ;
  for (let k = 1; k < points.length; k++) {
    const to = points[k]!;
    let d = dist(at, to);
    while (d > 1e-9) {
      const s = Math.min(step, d);
      at = { x: at.x + ((to.x - at.x) * s) / d, y: at.y + ((to.y - at.y) * s) / d };
      d -= s;
      yield { pointer: at, down: true, path: [at] };
    }
  }
  yield { pointer: at, down: false, commands: [{ type: "release" }] };
}

/** The nearest cell still to do, and its task. */
function nearestLeft(world: World, from: Vec): { at: Vec; task: Task } | null {
  const { cov, w } = world;
  let best: { at: Vec; task: Task } | null = null;
  let bestD = Infinity;
  for (let i = 0; i < cov.size; i++) {
    if (!cov.region[i] || cov.amount[i]! >= FULL) continue;
    const x = i % w;
    const y = (i - x) / w;
    const at = { x: x + 0.5, y: y + 0.5 };
    const d = dist(at, from);
    if (d < bestD) {
      bestD = d;
      best = { at, task: cov.taskAt(i)! };
    }
  }
  return best;
}

/** A short stroke over a leftover cell (for the shovel: push it off the nearer edge). */
function mopStroke(world: World, cell: { at: Vec; task: Task }): Stroke {
  const tool = toolFor(world, cell.task);
  const def = TOOLS[tool];
  const { at } = cell;
  if (def.kind === "shovel") {
    const box = boxes(world).get("shovel")!;
    const up = box.y + box.h / 2 > world.h / 2;
    return { tool, points: [{ x: at.x, y: at.y + (up ? 2 : -2) }, { x: at.x, y: up ? box.y - 3 : box.y + box.h + 3 }] };
  }
  if (def.kind === "mower") {
    // Drive straight over it from where the mower is, and a little past.
    const m = world.painter.mower;
    const d = Math.hypot(at.x - m.x, at.y - m.y) || 1;
    return { tool, points: [at, { x: at.x + ((at.x - m.x) / d) * 3, y: at.y + ((at.y - m.y) / d) * 3 }] };
  }
  const r = Math.max(0.6, def.core * 0.5);
  // A little scrub on the spot.
  return { tool, points: [{ x: at.x - r, y: at.y }, { x: at.x + r, y: at.y + 0.3 }, { x: at.x - r, y: at.y - 0.3 }, { x: at.x + r, y: at.y }, { x: at.x - r, y: at.y + 0.3 }, { x: at.x + r, y: at.y }] };
}

/** Play the clean-up through to the switch (or until `maxTicks`). Returns the ticks it took. */
export function playClean(world: World, maxTicks = HZ * 600): number {
  const start = world.tick;
  for (const stroke of cleanPlan(world)) {
    for (const input of walk(world, stroke.points, BOT_SPEED, stroke.tool)) {
      world.step(input);
      if (world.phase !== "clean" && world.phase !== "revenge") return world.tick - start;
      if (world.tick - start > maxTicks) return world.tick - start;
    }
  }
  let from: Vec = world.painter.mower ?? { x: 0, y: 0 };
  let guard = 0;
  while ((world.phase === "clean" || world.phase === "revenge") && world.tick - start <= maxTicks && guard++ < 5000) {
    if (world.phase === "revenge") {
      world.step({ pointer: null, down: false });
      continue;
    }
    const cell = nearestLeft(world, from);
    if (!cell) break;
    const stroke = mopStroke(world, cell);
    for (const input of walk(world, stroke.points, BOT_SPEED, stroke.tool)) {
      world.step(input);
      if (world.phase !== "clean") break;
    }
    from = cell.at;
  }
  return world.tick - start;
}

/**
 * The bot's hand in the hunt: it plays like a person. It sees Pix about a fifth of a second late and only
 * half-guesses where it's going; its hand speeds up rather than teleporting, tops out at a brisk pace, and
 * it can't click again straight away. It has to find Pix by its tells: a camouflaged Pix only when it
 * shimmers, the real one among decoys after a couple of beats, a wobbling panel or a dead pixel after a
 * moment's thought.
 */
export interface Hand {
  at: Vec;
  v: Vec;
  down: boolean;
  /** Where it last saw Pix (a camouflaged Pix between shimmers stays where it was seen). */
  seen: Vec[];
  cooldown: number;
  /** A net being drawn: where, and for how long so far. */
  net: { rect: Rect; ticks: number } | null;
  /** Uses the net and freeze when it has them. */
  tools: boolean;
}

const REACT = 12;
/** The magnifier's lens (cells): inside it, camouflage doesn't work. */
export const LENS_R = 9;
const HAND_ACCEL = 900 / HZ;
const CLICK_GAP = 15;

export const newHand = (world: World): Hand => ({ at: world.cursor ?? { x: world.w / 2, y: world.h / 2 }, v: { x: 0, y: 0 }, down: false, seen: [], cooldown: 0, net: null, tools: true });

/** Move the hand towards `to` (speed-limited, with some acceleration). */
function reach(hand: Hand, to: Vec, top = BOT_CHASE) {
  const dx = to.x - hand.at.x;
  const dy = to.y - hand.at.y;
  const d = Math.hypot(dx, dy);
  // Ease in to stop where it's aiming rather than sailing past it.
  const want = Math.min(top, d * 9);
  const tx = d > 1e-9 ? (dx / d) * want : 0;
  const ty = d > 1e-9 ? (dy / d) * want : 0;
  const ax = tx - hand.v.x;
  const ay = ty - hand.v.y;
  const a = Math.hypot(ax, ay);
  const k = a > HAND_ACCEL ? HAND_ACCEL / a : 1;
  hand.v = { x: hand.v.x + ax * k, y: hand.v.y + ay * k };
  hand.at = { x: hand.at.x + hand.v.x / HZ, y: hand.at.y + hand.v.y / HZ };
}

/** One tick of the hunt: the bot's input. Moves the HUD panel itself when Pix hides under it. */
export function huntInput(world: World, hand: Hand): Input {
  const p = world.pix;
  const commands: Command[] = [];
  const t = world.roundTicks;
  if (hand.cooldown > 0) hand.cooldown--;
  // What it can see: a camouflaged Pix when it shimmers, or through the magnifier's lens.
  const lensed = world.kit.magnifier && dist(hand.at, p) < LENS_R;
  const visible = !(world.def.camo && !world.shimmering() && !lensed && !p.gaveUp && p.mode === "free") && p.mode !== "burrow" && p.mode !== "tab";
  if (visible || !hand.seen.length) hand.seen.push({ x: p.x, y: p.y });
  else hand.seen.push(hand.seen[hand.seen.length - 1]!);
  if (hand.seen.length > REACT + 2) hand.seen.shift();
  const old = hand.seen[0]!;
  const next = hand.seen[1] ?? old;
  const aim = { x: old.x + (next.x - old.x) * REACT * 0.5, y: old.y + (next.y - old.y) * REACT * 0.5 };
  const release = (): Input => {
    hand.down = false;
    commands.push({ type: "release" });
    return { pointer: hand.at, down: false, commands };
  };
  // Picking out the real one takes a couple of beats.
  const thinking = (world.def.decoys ?? 0) > 0 && t < BEAT_TICKS * 2.5;
  switch (p.mode) {
    case "burrow": {
      // Follow the detector's beeps, scrubbing.
      if (t < HZ * 1.5) break;
      reach(hand, p, BOT_CHASE * 0.4);
      const was = hand.down;
      hand.down = true;
      return { pointer: hand.at, down: true, path: [hand.at], commands: was ? [] : [{ type: "press", at: hand.at }] };
    }
    case "hud":
      if (p.arrived && p.modeTicks > HZ) {
        // Drag the wobbling panel out of the way.
        const hud = world.layout.hud.map((r, k) => (k === p.hud ? { ...r, y: r.y > world.h / 2 ? r.y + r.h + 4 : r.y - r.h - 4 } : r));
        world.setLayout({ ...world.layout, hud });
      }
      break;
    case "dead":
      if (p.arrived && p.modeTicks > HZ * 2) commands.push({ type: "paused" });
      break;
    case "tab":
      if (p.arrived && p.modeTicks > HZ * 2) commands.push({ type: "hidden" }, { type: "visible" });
      break;
    case "mimic": {
      // It mirrors you: walk towards it along the mirrored axis; for the other axis, pin it against an edge.
      const style = world.def.mimic ?? "mirrorX";
      const along = style === "mirrorX" ? "x" : "y";
      const across = along === "x" ? "y" : "x";
      const gap = p[across] - hand.at[across];
      const to = { ...hand.at };
      if (Math.abs(gap) > 1) to[across] += Math.sign(gap) * 0.6;
      else to[along] += Math.sign(p[along] - hand.at[along]) * 0.4;
      hand.at = to;
      hand.v = { x: 0, y: 0 };
      if (hand.down) return release();
      return { pointer: hand.at, down: false, commands };
    }
    default:
      break;
  }
  if (hand.down) return release();
  // A quick net round where it's heading (drawn in under half a second, so it can't slip out).
  if (hand.net) {
    hand.net.ticks++;
    if (hand.net.ticks >= 9) {
      const rect = hand.net.rect;
      hand.net = null;
      hand.cooldown = HZ;
      return { pointer: hand.at, down: false, commands: [{ type: "net", rect, ticks: 9 }] };
    }
    return { pointer: hand.at, down: true, net: { ...hand.net } };
  }
  const freeToNet = p.mode === "free" || p.mode === "stunned" || (p.mode === "hud" && !p.arrived);
  if (hand.tools && !thinking && visible && freeToNet && world.onCanvas() && hand.cooldown === 0 && t > HZ * 1.5) {
    if (world.nets > 0 && dist(hand.at, aim) < 18) {
      const lead = { x: aim.x + (next.x - old.x) * 20, y: aim.y + (next.y - old.y) * 20 };
      hand.net = { rect: { x: Math.min(aim.x, lead.x) - 7, y: Math.min(aim.y, lead.y) - 6, w: Math.abs(lead.x - aim.x) + 14, h: Math.abs(lead.y - aim.y) + 12 }, ticks: 1 };
      return { pointer: hand.at, down: true, net: { ...hand.net } };
    }
    if (world.freezes > 0 && dist(hand.at, aim) < 10) commands.push({ type: "freeze" });
  }
  if (p.mode !== "burrow" && !thinking) reach(hand, aim);
  if (!thinking && hand.cooldown === 0 && dist(hand.at, aim) <= world.catchRadius() * 0.6 && (world.catchable() || p.mode === "hud")) {
    commands.push({ type: "press", at: hand.at });
    hand.down = true;
    hand.cooldown = CLICK_GAP;
  }
  return { pointer: hand.at, down: hand.down, path: [hand.at], commands };
}

/** Hunt until it's caught (and paint any trail left), or `maxTicks`. Returns the hunt's ticks. */
export function playHunt(world: World, maxTicks = HZ * 90): number {
  const hand = newHand(world);
  const start = world.huntTicks;
  let n = 0;
  while (world.phase !== "done" && world.phase !== "finish" && n++ < maxTicks) {
    if (world.phase === "hunt") world.step(huntInput(world, hand));
    else {
      hand.seen = [];
      world.step({ pointer: hand.at, down: false });
    }
  }
  if (world.phase === "finish") {
    // The trail: the same mop-up.
    let guard = 0;
    while (world.phase === "finish" && guard++ < 3000) {
      const cell = nearestLeft(world, hand.at);
      if (!cell) break;
      for (const input of walk(world, mopStroke(world, cell).points, BOT_SPEED, toolFor(world, cell.task))) {
        world.step(input);
        if (world.phase !== "finish") break;
      }
      hand.at = cell.at;
    }
  }
  return world.huntTicks - start;
}
