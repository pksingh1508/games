// The rules (Plan/01-one-more-step.md §3): a pure function, step(level, state, action) → the next state
// and what happened. Every action, a step or a wait, is one tick of the world, always in this order:
//
//   1. You move (or don't). Onto the exit: you've won, and nothing else happens.
//   2. The tiles react: the crumble tile you left breaks, spikes flip, conveyors push.
//   3. The creatures move: Doory, your echo, the mirror twin, the sentinels.
//   4. The hazards: raised spikes, a hole, something touching you.
//
// No randomness anywhere: the same steps always give the same game.
import { Cell, DELTA, DIRS, manhattan, samePos, type Action, type Cause, type Course, type Dir, type GameEvent, type Pos, type State } from "./types";

/** The finale: wait this many times in a row and Doory comes to you. */
export const FINALE_WAITS = 10;

const at = (c: Course, p: Pos) => p.y * c.w + p.x;
const inside = (c: Course, p: Pos) => p.x >= 0 && p.y >= 0 && p.x < c.w && p.y < c.h;
const add = (p: Pos, d: Dir): Pos => ({ x: p.x + DELTA[d].x, y: p.y + DELTA[d].y });
const MIRROR: Record<Dir, Dir> = { up: "up", down: "down", left: "right", right: "left" };

export function isBroken(c: Course, s: State, i: number): boolean {
  const k = c.crumbleIndex[i]!;
  return k >= 0 && ((s.broken[k >> 5]! >>> (k & 31)) & 1) === 1;
}

/** A hole right now: a hole, a basement hole, or a broken crumble (a broken secret is the exit). */
export function isHole(c: Course, s: State, p: Pos): boolean {
  const i = at(c, p);
  const cell = c.cells[i];
  return cell === Cell.Hole || cell === Cell.Basement || (cell === Cell.Crumble && isBroken(c, s, i));
}

/** Spikes raised right now. Normal spikes flip every tick; lazy ones only when you wait; wave ones rise together. */
export function spikesUp(c: Course, s: State, p: Pos): boolean {
  const i = at(c, p);
  const cell = c.cells[i];
  if (cell === Cell.Wave) return c.wave > 0 && s.tick > 0 && s.tick % c.wave === 0;
  if (cell !== Cell.Spikes) return false;
  const flips = c.lazy[i] ? s.lazyFlips : s.tick;
  return (c.spikesUp[i]! ^ (flips & 1)) === 1;
}

/** Ticks until the wave spikes rise ("Steps left"). */
export const waveIn = (c: Course, s: State) => (c.wave > 0 ? c.wave - (s.tick % c.wave) : 0);

export const echoAt = (c: Course, s: State): Pos | null => (c.echoDelay > 0 ? s.trail[0]! : null);

/** Everything with weight: it presses plates (and keeps a gate from shutting on it). */
function bodies(c: Course, s: State): Pos[] {
  const out: Pos[] = [s.player];
  const echo = echoAt(c, s);
  if (echo) out.push(echo);
  if (s.doors[0] && c.doors.length) out.push(s.doors[0]);
  if (s.twin) out.push(s.twin);
  for (const t of s.sentinels) if (t) out.push(t);
  return out;
}

/** Gates are open while something's on a plate, and can't shut on whatever's in them. */
export function gatesOpen(c: Course, s: State): boolean {
  for (const b of bodies(c, s)) {
    const cell = c.cells[at(c, b)];
    if (cell === Cell.Plate || cell === Cell.Gate) return true;
  }
  return false;
}

/** Plates that something's standing on. */
export function pressedPlates(c: Course, s: State): number[] {
  const out = new Set<number>();
  for (const b of bodies(c, s)) {
    const i = at(c, b);
    if (c.cells[i] === Cell.Plate) out.add(i);
  }
  return [...out].sort((a, b) => a - b);
}

const solid = (c: Course, p: Pos, open: boolean) => !inside(c, p) || c.cells[at(c, p)] === Cell.Wall || (c.cells[at(c, p)] === Cell.Gate && !open);

export function step(c: Course, prev: State, action: Action): { state: State; events: GameEvent[] } {
  const ev: GameEvent[] = [];
  if (prev.status !== "play") return { state: prev, events: ev };
  const s: State = {
    ...prev,
    tick: prev.tick + 1,
    player: { ...prev.player },
    doors: prev.doors.map((d) => ({ ...d })),
    broken: [...prev.broken],
    trail: prev.trail.map((p) => ({ ...p })),
    twin: prev.twin ? { ...prev.twin } : null,
    sentinels: prev.sentinels.map((t) => (t ? { ...t } : null)),
  };
  const wait = action.type === "wait";
  s.waits = wait ? prev.waits + 1 : 0;
  // Lazy spikes only move when you wait.
  if (wait) s.lazyFlips = prev.lazyFlips + 1;
  const open = gatesOpen(c, prev);

  // 1. You move.
  const from = prev.player;
  if (wait) ev.push({ type: "wait" });
  else {
    const to = add(from, action.dir);
    if (solid(c, to, open) || samePos(to, prev.twin)) ev.push({ type: "bump", at: from, dir: action.dir });
    else {
      s.player = to;
      ev.push({ type: "step", from, to });
    }
  }
  if (arrive(c, s, ev)) return { state: s, events: ev };

  // 2. The tiles react: the crumble you left breaks; conveyors push.
  if (!samePos(from, s.player)) crumble(c, s, from, ev);
  conveyors(c, s, ev);
  if (arrive(c, s, ev)) return { state: s, events: ev };

  // 3. The creatures move.
  s.trail.push({ ...s.player });
  if (s.trail.length > c.echoDelay + 1) s.trail.shift();
  moveDoor(c, s, ev);
  if (s.status !== "play") return { state: s, events: ev };
  if (s.twin) moveTwin(c, s, action, ev);
  moveSentinels(c, s, ev);

  // The plates, and the gates they hold open.
  const before = pressedPlates(c, prev);
  const after = pressedPlates(c, s);
  for (const i of after) if (!before.includes(i)) ev.push({ type: "plate", at: { x: i % c.w, y: Math.floor(i / c.w) }, down: true });
  for (const i of before) if (!after.includes(i)) ev.push({ type: "plate", at: { x: i % c.w, y: Math.floor(i / c.w) }, down: false });
  const nowOpen = gatesOpen(c, s);
  if (nowOpen !== open) ev.push({ type: "gates", open: nowOpen });

  // 4. Is anything wrong?
  hazards(c, prev, s, ev);
  if (s.status === "play" && c.twin && s.twin) {
    // Twins leave together: you on one exit, your twin on the other, on the same tick.
    const mine = s.doors.findIndex((d) => samePos(d, s.player));
    const theirs = s.doors.findIndex((d) => samePos(d, s.twin));
    if (mine >= 0 && theirs >= 0 && mine !== theirs) {
      s.status = "won";
      ev.push({ type: "win", at: s.player });
    }
  }
  return { state: s, events: ev };
}

/** Onto an exit (or a basement hole). True when that's the end of the tick. */
function arrive(c: Course, s: State, ev: GameEvent[]): boolean {
  const p = s.player;
  if (c.cells[at(c, p)] === Cell.Basement) {
    s.status = "won";
    ev.push({ type: "fall", at: p }, { type: "win", at: p });
    return true;
  }
  if (c.twin) return false;
  const k = s.doors.findIndex((d) => samePos(d, p));
  if (k < 0) return false;
  if (k === 0 && c.behavior === "brave") {
    // Step into an angry door and it slams shut on you.
    die(s, "door", ev);
    return true;
  }
  if (k === 0 && c.behavior === "finale") {
    s.status = "reset";
    ev.push({ type: "reset" });
    return true;
  }
  s.status = "won";
  ev.push({ type: "win", at: p });
  return true;
}

function crumble(c: Course, s: State, p: Pos, ev: GameEvent[]) {
  const i = at(c, p);
  const cell = c.cells[i];
  if ((cell !== Cell.Crumble && cell !== Cell.Secret) || isBroken(c, s, i)) return;
  const k = c.crumbleIndex[i]!;
  s.broken[k >> 5] = s.broken[k >> 5]! | (1 << (k & 31));
  if (cell === Cell.Secret) {
    // Under this one: the real exit.
    s.doors.push({ ...p });
    ev.push({ type: "reveal", at: { ...p } });
  } else ev.push({ type: "crumble", at: { ...p } });
}

/** Is anything (but `except`) standing here? Your echo counts: it's in the way of everything but you. */
function occupied(c: Course, s: State, p: Pos, except?: Pos): boolean {
  const others: Array<Pos | null> = [s.player, s.twin, ...s.sentinels, echoAt(c, s)];
  if (c.doors.length) others.push(s.doors[0] ?? null);
  return others.some((o) => o && o !== except && samePos(o, p));
}

/** Where Doory may go: not into walls, shut gates, holes, raised spikes, or anyone. */
function doorFree(c: Course, s: State, p: Pos, open: boolean): boolean {
  if (solid(c, p, open) || isHole(c, s, p) || spikesUp(c, s, p)) return false;
  return !occupied(c, s, p);
}

function conveyors(c: Course, s: State, ev: GameEvent[]) {
  const open = gatesOpen(c, s);
  const push = (who: "player" | "door" | "sentinel", body: Pos, careful: boolean) => {
    const i = at(c, body);
    if (c.cells[i] !== Cell.Conveyor) return;
    const to = add(body, DIRS[c.belts[i]!]!);
    if (solid(c, to, open) || occupied(c, s, to, body)) return;
    // Doory holds on rather than be pushed into a hole or onto spikes.
    if (careful && (isHole(c, s, to) || spikesUp(c, s, to))) return;
    ev.push({ type: "push", who, from: { ...body }, to });
    body.x = to.x;
    body.y = to.y;
  };
  push("player", s.player, false);
  if (c.doors.length && s.doors[0] && c.behavior !== "still") push("door", s.doors[0], true);
  for (const t of s.sentinels) if (t) push("sentinel", t, false);
}

function moveDoor(c: Course, s: State, ev: GameEvent[]) {
  const door = s.doors[0];
  if (!door || !c.doors.length) return;
  const open = gatesOpen(c, s);
  if (c.behavior === "shy") {
    if (manhattan(door, s.player) !== 1) return;
    let best: Pos | null = null;
    let far = -1;
    for (const d of DIRS) {
      const to = add(door, d);
      if (!doorFree(c, s, to, open)) continue;
      const dx = to.x - s.player.x;
      const dy = to.y - s.player.y;
      const dist = dx * dx + dy * dy;
      if (dist > far) {
        far = dist;
        best = to;
      }
    }
    if (!best) {
      ev.push({ type: "cornered", at: { ...door } });
      return;
    }
    const first = s.ran < 0;
    if (first) s.ran = s.tick;
    ev.push({ type: "door", from: { ...door }, to: best, first });
    door.x = best.x;
    door.y = best.y;
    return;
  }
  if (c.behavior === "brave" || c.behavior === "finale") {
    if (c.behavior === "finale") {
      if (!s.coming && s.waits >= FINALE_WAITS) s.coming = true;
      if (!s.coming) return;
    }
    const next = towards(c, s, door, open);
    if (!next) return;
    if (samePos(next, s.player)) {
      if (c.behavior === "finale" || c.cells[at(c, s.player)] === Cell.Plate) {
        // It comes to you (or, brave, it reaches you while you're on the plate): it opens.
        ev.push({ type: "charge", from: { ...door }, to: next });
        door.x = next.x;
        door.y = next.y;
        s.status = "won";
        ev.push({ type: "win", at: { ...s.player } });
      } else die(s, "door", ev);
      return;
    }
    ev.push({ type: "charge", from: { ...door }, to: next });
    door.x = next.x;
    door.y = next.y;
  }
}

/** The first step of a shortest path from `from` to you, through tiles Doory may stand on. */
function towards(c: Course, s: State, from: Pos, open: boolean): Pos | null {
  const n = c.w * c.h;
  const prev = new Int32Array(n).fill(-1);
  const start = at(c, from);
  const goal = at(c, s.player);
  prev[start] = start;
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    if (i === goal) break;
    const p = { x: i % c.w, y: Math.floor(i / c.w) };
    for (const d of DIRS) {
      const to = add(p, d);
      if (!inside(c, to)) continue;
      const j = at(c, to);
      if (prev[j] !== -1) continue;
      if (j !== goal && !doorFree(c, s, to, open)) continue;
      prev[j] = i;
      queue.push(j);
    }
  }
  if (prev[goal] === -1) return null;
  let i = goal;
  while (prev[i] !== start) i = prev[i]!;
  return { x: i % c.w, y: Math.floor(i / c.w) };
}

function moveTwin(c: Course, s: State, action: Action, ev: GameEvent[]) {
  const twin = s.twin!;
  if (action.type === "wait") return;
  const to = add(twin, MIRROR[action.dir]);
  const open = gatesOpen(c, s);
  if (solid(c, to, open) || samePos(to, s.player) || samePos(to, echoAt(c, s)) || s.sentinels.some((t) => samePos(t, to))) return;
  ev.push({ type: "twin", from: { ...twin }, to });
  twin.x = to.x;
  twin.y = to.y;
}

/** Sentinels lumber one tile towards you: along the longer gap first (across, on a tie). */
function moveSentinels(c: Course, s: State, ev: GameEvent[]) {
  const open = gatesOpen(c, s);
  s.sentinels.forEach((t, k) => {
    if (!t) return;
    const dx = s.player.x - t.x;
    const dy = s.player.y - t.y;
    const across: Dir | null = dx > 0 ? "right" : dx < 0 ? "left" : null;
    const down: Dir | null = dy > 0 ? "down" : dy < 0 ? "up" : null;
    const order = Math.abs(dx) >= Math.abs(dy) ? [across, down] : [down, across];
    for (const d of order) {
      if (!d) continue;
      const to = add(t, d);
      if (solid(c, to, open)) continue;
      if (s.sentinels.some((o, j) => j !== k && samePos(o, to)) || samePos(to, s.twin) || samePos(to, echoAt(c, s)) || (c.doors.length && samePos(to, s.doors[0]))) continue;
      const from = { ...t };
      t.x = to.x;
      t.y = to.y;
      ev.push({ type: "sentinel", from, to: { ...to } });
      crumble(c, s, from, ev);
      if (isHole(c, s, to)) {
        ev.push({ type: "sentinelFall", at: { ...to } });
        s.sentinels[k] = null;
      }
      return;
    }
  });
}

function hazards(c: Course, prev: State, s: State, ev: GameEvent[]) {
  if (s.status !== "play") return;
  const p = s.player;
  if (isHole(c, s, p)) {
    ev.push({ type: "fall", at: { ...p } });
    die(s, "hole", ev);
    return;
  }
  if (spikesUp(c, s, p)) {
    die(s, "spikes", ev);
    return;
  }
  const echo = echoAt(c, s);
  const was = echoAt(c, prev);
  if (echo && (samePos(echo, p) || (samePos(echo, prev.player) && samePos(was, p)))) {
    die(s, "echo", ev);
    return;
  }
  for (let k = 0; k < s.sentinels.length; k++) {
    const t = s.sentinels[k];
    const t0 = prev.sentinels[k];
    if (t && (samePos(t, p) || (samePos(t, prev.player) && samePos(t0, p)))) {
      die(s, "sentinel", ev);
      return;
    }
  }
  if (s.twin && (isHole(c, s, s.twin) || spikesUp(c, s, s.twin))) die(s, "twin", ev);
}

function die(s: State, cause: Cause, ev: GameEvent[]) {
  s.status = "dead";
  s.cause = cause;
  ev.push({ type: "die", cause, at: { ...s.player } });
}

/** The key of a state for the solver: everything that matters for what happens next. */
export function stateKey(c: Course, s: State): string {
  const parts: Array<string | number> = [s.player.x, s.player.y, s.status];
  for (const d of s.doors) parts.push(d.x, d.y);
  parts.push(s.broken.join(","));
  if (c.cells.some((v, i) => v === Cell.Spikes && !c.lazy[i])) parts.push(s.tick & 1);
  if (c.lazy.some(Boolean)) parts.push(s.lazyFlips & 1);
  if (c.wave) parts.push(s.tick % c.wave);
  if (c.echoDelay) for (const p of s.trail) parts.push(p.x, p.y);
  if (s.twin) parts.push(s.twin.x, s.twin.y);
  for (const t of s.sentinels) parts.push(t ? `${t.x}.${t.y}` : "x");
  if (c.behavior === "finale") parts.push(Math.min(s.waits, FINALE_WAITS), s.coming ? 1 : 0);
  return parts.join(" ");
}
