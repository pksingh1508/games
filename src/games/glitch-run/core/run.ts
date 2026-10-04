// One run, simulated a tick (1/60 s) at a time (Plan/07-glitch-run.md §3, §12). This is the truth:
// glitches only change what you see and how your keys are read, never anything in here. You run
// automatically; you jump, slide and Clip. The track and the tempo decide where you are at every
// tick (one beat of track per beat of music), so a run is exactly the same every time it's played
// with the same inputs.
import { moveY, onGround, type Body, type Solids } from "@/engine/platformer/physics";
import {
  BEAT_PX,
  BITS_PER_CHARGE,
  CLIP_CORRUPTION,
  GROUND_ROW,
  CLIP_GRACE,
  CLIP_TICKS,
  GLITCH,
  HAZARD_INSET,
  JUMP,
  MAX_CHARGES,
  PANIC_BONUS,
  PANIC_RESET,
  PANIC_TICKS,
  PATCH_CORRUPTION,
  PHYSICS,
  RUNNER_H,
  RUNNER_W,
  RUNNER_X,
  SLIDE,
  SLIDE_H,
  TILE,
  VIEW_H,
  VIEW_W,
} from "./constants";
import { AIR, BIT, isSolid, PATCH, SPIKES, type Track } from "./track";

export type DeathCause = "wall" | "spikes" | "void" | "scan";

export type RunEvent =
  | { type: "jump" }
  | { type: "land"; impact: number }
  | { type: "bonk" }
  | { type: "slide" }
  | { type: "clip" }
  /** Glitch pressed with no charge. */
  | { type: "noCharge" }
  /** A Clip that went through something. */
  | { type: "phased" }
  | { type: "bit"; bits: number }
  | { type: "charge"; charges: number }
  | { type: "patch" }
  | { type: "nearMiss" }
  | { type: "beat"; beat: number }
  | { type: "scanFire"; index: number }
  | { type: "panic" }
  | { type: "panicSurvived" }
  | { type: "death"; cause: DeathCause }
  | { type: "win" };

export interface Runner extends Body {
  grounded: boolean;
  coyote: number;
  buffer: number;
  jumpHeld: boolean;
  rising: boolean;
  sliding: boolean;
  /** Ticks of Clip left (0: solid). */
  clip: number;
  /** Extra Clip ticks used up while still inside something. */
  grace: number;
  /** This Clip went through something (style points when it ends). */
  phased: boolean;
}

/** A sweep of The Debugger's scan line: it appears at the right edge and reaches you one beat later. */
export interface Scan {
  /** The beat it's fired on. */
  beat: number;
  /** full: Clip through it. low: jump over it. high: slide under it. */
  kind: "full" | "low" | "high";
}

/** The vertical span (screen y) each kind of scan line covers. */
export const SCAN_SPAN: Record<Scan["kind"], [number, number]> = {
  full: [0, VIEW_H],
  low: [150, VIEW_H],
  high: [0, 180],
};

export interface RunConfig {
  track: Track;
  /** Ticks per beat, from a beat on (sorted). The first applies from beat 0. */
  tempo: ReadonlyArray<{ beat: number; ticks: number }>;
  /** Story stages end here (a column); endless runs don't. */
  finishCol: number | null;
  scans?: readonly Scan[];
  corruption?: number;
  /** Glitch charges to start with. */
  charges?: number;
  /** Corruption that creeps up every beat (endless). */
  drift?: number;
  /** Endless: adds the next chunk when the track runs short. */
  feed?: (track: Track) => void;
}

export interface Run {
  tick: number;
  track: Track;
  runner: Runner;
  status: "run" | "dead" | "won";
  cause: DeathCause | null;
  /** The beat the runner is in, and ticks into it. */
  beat: number;
  beatTick: number;
  bits: number;
  charges: number;
  /** 0–100. */
  corruption: number;
  /** Ticks of Kernel Panic left. */
  panic: number;
  panics: number;
  score: number;
  clips: number;
  glitchHeld: boolean;
  /** The last spike column a near miss was counted at. */
  nearCol: number;
  config: RunConfig;
}

export function createRun(config: RunConfig): Run {
  const runner: Runner = {
    x: 0,
    y: GROUND_ROW * TILE - RUNNER_H,
    w: RUNNER_W,
    h: RUNNER_H,
    vx: 0,
    vy: 0,
    rx: 0,
    ry: 0,
    grounded: true,
    coyote: 0,
    buffer: 0,
    jumpHeld: false,
    rising: false,
    sliding: false,
    clip: 0,
    grace: 0,
    phased: false,
  };
  return {
    tick: 0,
    track: config.track,
    runner,
    status: "run",
    cause: null,
    beat: 0,
    beatTick: 0,
    bits: 0,
    charges: config.charges ?? 0,
    corruption: config.corruption ?? 0,
    panic: 0,
    panics: 0,
    score: 0,
    clips: 0,
    glitchHeld: false,
    nearCol: -99,
    config,
  };
}

/** Ticks per beat at a beat. */
export function ticksAt(config: Pick<RunConfig, "tempo">, beat: number): number {
  let ticks = config.tempo[0]!.ticks;
  for (const t of config.tempo) {
    if (t.beat > beat) break;
    ticks = t.ticks;
  }
  return ticks;
}

/** The tick a beat starts on (beat 0 starts at tick 0). */
export function beatStart(config: Pick<RunConfig, "tempo">, beat: number): number {
  let tick = 0;
  for (let b = 0; b < beat; b++) tick += ticksAt(config, b);
  return tick;
}

/** The score multiplier: ×1 at no corruption, ×5 at 100%. */
export const multiplierOf = (corruption: number) => 1 + corruption / 25;

/** Where the runner's left edge is at a point of the beat grid (exact: no drift, ever). */
export const xAt = (beat: number, beatTick: number, ticks: number) => Math.floor(beat * BEAT_PX + (beatTick * BEAT_PX) / ticks);

/** Only what's below your feet holds you up while you Clip: walls, bars and ceilings let you through. */
function clipSolids(track: Track, floor: number): Solids {
  const firstRow = Math.ceil(floor / TILE);
  return {
    solidAt(x, y, w, h) {
      const c0 = Math.floor(x / TILE);
      const c1 = Math.floor((x + w - 1) / TILE);
      const r0 = Math.max(firstRow, Math.floor(y / TILE));
      const r1 = Math.floor((y + h - 1) / TILE);
      for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (isSolid(track.cell(c, r))) return true;
      return false;
    },
  };
}

const canStand = (track: Track, r: Runner) => !track.solidAt(r.x, r.y + r.h - RUNNER_H, RUNNER_W, RUNNER_H);

function stand(r: Runner) {
  r.sliding = false;
  r.y -= RUNNER_H - SLIDE_H;
  r.h = RUNNER_H;
}

/** Where a scan line is on screen at a tick (it starts at the right edge and reaches you in a beat). */
export function scanScreenX(config: RunConfig, scan: Scan, tick: number): number {
  const fired = beatStart(config, scan.beat);
  const ticks = ticksAt(config, scan.beat);
  return VIEW_W - ((VIEW_W - RUNNER_X) * (tick - fired)) / ticks;
}

function die(run: Run, cause: DeathCause, events: RunEvent[]) {
  run.status = "dead";
  run.cause = cause;
  events.push({ type: "death", cause });
}

export function step(run: Run, bits: number): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.status !== "run") return events;
  const { config, track } = run;
  const r = run.runner;
  run.tick++;

  const jump = (bits & JUMP) !== 0;
  const slide = (bits & SLIDE) !== 0;
  const glitch = (bits & GLITCH) !== 0;
  const glitchPressed = glitch && !run.glitchHeld;
  run.glitchHeld = glitch;

  // Clip: a charge for 0.35 s of being nothing in particular.
  if (glitchPressed && r.clip === 0) {
    if (run.charges > 0) {
      run.charges--;
      run.clips++;
      r.clip = CLIP_TICKS;
      r.grace = 0;
      r.phased = false;
      run.corruption = Math.min(100, run.corruption + CLIP_CORRUPTION);
      events.push({ type: "clip" });
    } else events.push({ type: "noCharge" });
  }

  // Slide on the ground (or keep sliding while there's no room to stand up).
  if (slide && r.grounded && !r.sliding) {
    r.sliding = true;
    r.y += RUNNER_H - SLIDE_H;
    r.h = SLIDE_H;
    events.push({ type: "slide" });
  } else if (r.sliding && !slide && (r.clip > 0 || canStand(track, r))) stand(r);

  // Jump: buffered a few ticks, and still possible a few ticks after running off an edge.
  const pressed = jump && !r.jumpHeld;
  r.jumpHeld = jump;
  if (pressed) r.buffer = PHYSICS.bufferTicks;
  if (r.buffer > 0 && (r.grounded || r.coyote > 0)) {
    if (r.sliding && (r.clip > 0 || canStand(track, r))) stand(r);
    if (!r.sliding) {
      r.vy = PHYSICS.jumpSpeed;
      r.rising = true;
      r.grounded = false;
      r.coyote = 0;
      r.buffer = 0;
      events.push({ type: "jump" });
    }
  }
  if (r.buffer > 0) r.buffer--;
  if (r.rising && (!jump || r.vy >= 0)) {
    if (!jump && r.vy < PHYSICS.jumpCut) r.vy = PHYSICS.jumpCut;
    r.rising = false;
  }
  r.vy = Math.min(PHYSICS.maxFall, r.vy + PHYSICS.gravity + (slide && !r.grounded ? PHYSICS.fastFall : 0));

  // Along the track: the beat grid says exactly where you are.
  run.beatTick++;
  if (run.beatTick >= ticksAt(config, run.beat)) {
    run.beat++;
    run.beatTick = 0;
    run.corruption = Math.min(100, run.corruption + (config.drift ?? 0));
    events.push({ type: "beat", beat: run.beat });
  }
  const targetX = xAt(run.beat, run.beatTick, ticksAt(config, run.beat));
  if (config.feed) while (track.cols * TILE < targetX + VIEW_W * 2) config.feed(track);
  const solids = r.clip > 0 ? clipSolids(track, r.y + r.h) : track;
  const before = r.x;
  while (r.x < targetX) {
    if (solids.solidAt(r.x + 1, r.y, r.w, r.h)) {
      // Into the side of a pit: that's falling in, really.
      die(run, r.y + r.h > GROUND_ROW * TILE + 4 ? "void" : "wall", events);
      return events;
    }
    r.x++;
  }
  const dx = r.x - before;

  const falling = r.vy;
  if (moveY(r, r.vy, solids)) {
    if (falling > 0) {
      if (!r.grounded) events.push({ type: "land", impact: falling });
    } else {
      events.push({ type: "bonk" });
      r.rising = false;
    }
    r.vy = 0;
  }
  r.grounded = onGround(r, solids);
  if (r.grounded) r.coyote = PHYSICS.coyoteTicks;
  else if (r.coyote > 0) r.coyote--;
  // Sliding off an edge: stand up in the air (unless you're holding slide to drop faster).
  if (r.sliding && !r.grounded && !slide && canStand(track, r)) stand(r);

  // The end of a Clip: if you're still inside something, it holds a little longer, then gives up.
  if (r.clip > 0) {
    if (track.solidAt(r.x, r.y, r.w, r.h) || track.anyAt(r.x, r.y, r.w, r.h, SPIKES)) r.phased = true;
    r.clip--;
    if (r.clip === 0 && track.solidAt(r.x, r.y, r.w, r.h)) {
      if (r.grace < CLIP_GRACE) {
        r.clip = 1;
        r.grace++;
      } else {
        die(run, "wall", events);
        return events;
      }
    }
    if (r.clip === 0 && r.phased) {
      events.push({ type: "phased" });
      run.score += 100 * multiplierOf(run.corruption);
    }
  }

  // Hazards (a Clip goes through all of them).
  if (r.clip === 0) {
    const inner = { x: r.x + HAZARD_INSET, y: r.y + HAZARD_INSET, w: r.w - HAZARD_INSET * 2, h: r.h - HAZARD_INSET * 2 };
    if (track.anyAt(inner.x, inner.y, inner.w, inner.h, SPIKES)) {
      die(run, "spikes", events);
      return events;
    }
    const scans = config.scans ?? [];
    for (let i = 0; i < scans.length; i++) {
      const s = scans[i]!;
      const now = scanScreenX(config, s, run.tick);
      const prev = scanScreenX(config, s, run.tick - 1);
      if (Math.abs(prev - VIEW_W) < 1e-6) events.push({ type: "scanFire", index: i });
      // The line swept from prev to now this tick; you're at RUNNER_X on screen.
      const hitX = now <= RUNNER_X + r.w && prev + 3 >= RUNNER_X;
      const [top, bottom] = SCAN_SPAN[s.kind];
      if (hitX && r.y < bottom && r.y + r.h > top) {
        die(run, "scan", events);
        return events;
      }
    }
    // A near miss: spikes within a few pixels, but not touching.
    const near = { x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 };
    if (track.anyAt(near.x, near.y, near.w, near.h, SPIKES)) {
      const col = Math.floor((r.x + r.w) / TILE);
      if (col > run.nearCol + 2) {
        run.nearCol = col;
        run.score += 50 * multiplierOf(run.corruption);
        events.push({ type: "nearMiss" });
      }
    }
  }
  if (r.y > VIEW_H + TILE) {
    die(run, "void", events);
    return events;
  }

  // Bits and patches.
  const c0 = Math.floor(r.x / TILE);
  const c1 = Math.floor((r.x + r.w - 1) / TILE);
  const r0 = Math.floor(r.y / TILE);
  const r1 = Math.floor((r.y + r.h - 1) / TILE);
  for (let c = c0; c <= c1; c++) {
    for (let row = r0; row <= r1; row++) {
      const cell = track.cell(c, row);
      if (cell === BIT) {
        track.set(c, row, AIR);
        run.bits++;
        events.push({ type: "bit", bits: run.bits });
        if (run.bits >= BITS_PER_CHARGE) {
          if (run.charges < MAX_CHARGES) {
            run.charges++;
            run.bits -= BITS_PER_CHARGE;
            events.push({ type: "charge", charges: run.charges });
          } else run.bits = BITS_PER_CHARGE;
        }
      } else if (cell === PATCH) {
        track.set(c, row, AIR);
        run.corruption = Math.max(0, run.corruption - PATCH_CORRUPTION);
        events.push({ type: "patch" });
      }
    }
  }

  // Kernel Panic at 100%: survive ten seconds of chaos for a big bonus, and it calms down.
  if (run.panic > 0) {
    run.panic--;
    if (run.panic === 0) {
      run.score += PANIC_BONUS;
      run.corruption = PANIC_RESET;
      events.push({ type: "panicSurvived" });
    }
  } else if (run.corruption >= 100) {
    run.panic = PANIC_TICKS;
    run.panics++;
    events.push({ type: "panic" });
  }

  run.score += (dx / TILE) * multiplierOf(run.corruption);
  if (config.finishCol !== null && r.x >= config.finishCol * TILE) {
    run.status = "won";
    events.push({ type: "win" });
  }
  return events;
}

/** Metres run (a tile is a metre). */
export const metres = (run: Run) => Math.floor(run.runner.x / TILE);
