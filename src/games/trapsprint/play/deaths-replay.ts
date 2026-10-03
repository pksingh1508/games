// The All-Deaths Replay (Plan/06-trapsprint.md §6): every attempt at the level runs again at the
// same time, a crowd of little runners dying in all the ways you did, while the run that made it
// goes all the way to the door. Cheap: each attempt is just its input recording, re-simulated.
import { createLoop, type Loop } from "@/engine/loop";
import { Player } from "@/engine/replay";
import type { Level } from "../core/level";
import type { AttemptRecord } from "../core/session";
import { createWorld, step, type World } from "../core/world";
import { PAL } from "../render/art";
import { drawRunner, Renderer } from "../render/draw";

interface Runner {
  world: World;
  inputs: Player;
  prev: { x: number; y: number };
  colour: string;
  done: boolean;
}

const CROWD = ["#ffffff", "#ffcd75", "#73eff7", "#a7f070", "#ef7d57", "#41a6f6", "#f4a6c8"];
/** Long sessions replay a little faster, so the crowd never takes more than a few seconds. */
const MAX_RUNNERS = 300;

export class DeathsReplay {
  private readonly renderer: Renderer;
  private readonly loop: Loop;
  private readonly hero: Runner | null;
  private readonly crowd: Runner[];
  private skulls: Array<{ x: number; y: number }> = [];
  private readonly born = performance.now();
  private ticks = 0;
  private finished = false;
  private readonly length: number;

  constructor(
    canvas: HTMLCanvasElement,
    level: Level,
    attempts: readonly AttemptRecord[],
    private readonly options: { reducedMotion: () => boolean; onTick?: (alive: number, dead: number) => void; onDone: () => void },
  ) {
    this.renderer = new Renderer(canvas, options.reducedMotion);
    this.renderer.setLevel(level);
    const runs = attempts.filter((a) => a.end !== "restart").slice(-MAX_RUNNERS);
    const make = (a: AttemptRecord, i: number): Runner => {
      const world = createWorld(level, { attempt: a.attempt, checkpoint: a.checkpoint });
      world.invincible = false;
      return { world, inputs: new Player(a.log), prev: { x: world.p.x, y: world.p.y }, colour: CROWD[i % CROWD.length]!, done: false };
    };
    const winner = runs.findLast((a) => a.end === "won");
    this.hero = winner ? make(winner, 0) : null;
    this.crowd = runs.filter((a) => a !== winner).map(make);
    this.length = Math.max(0, ...runs.map((a) => a.ticks));
    const speed = this.length > 900 ? 2 : 1;
    this.loop = createLoop({ update: () => this.update(), render: (alpha) => this.render(alpha), speed: () => speed });
  }

  get total() {
    return this.crowd.length;
  }

  start() {
    this.render(0);
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  private advance(r: Runner) {
    if (r.done) return;
    r.prev = { x: r.world.p.x, y: r.world.p.y };
    const bits = r.inputs.next();
    if (bits === null) {
      r.done = true;
      return;
    }
    step(r.world, bits);
    if (r.world.status === "dead") {
      r.done = true;
      const c = { x: r.world.p.x + r.world.p.w / 2, y: r.world.p.y + r.world.p.h / 2 };
      this.skulls.push(c);
      this.renderer.fx.death(c.x, c.y, r.colour);
    } else if (r.world.status === "won") r.done = true;
  }

  private update() {
    this.ticks++;
    if (this.hero) {
      const before = this.hero.world;
      this.advance(this.hero);
      this.renderer.onEvents(before, before.events.filter((e) => e.type !== "die"));
    }
    for (const r of this.crowd) this.advance(r);
    this.renderer.tick(this.hero?.world ?? null);
    const dead = this.crowd.filter((r) => r.done).length;
    this.options.onTick?.(this.crowd.length - dead, dead);
    if (!this.finished && this.ticks > this.length + 90) {
      this.finished = true;
      this.options.onDone();
    }
  }

  private render(alpha: number) {
    const base = this.hero?.world ?? this.crowd[0]?.world;
    if (!base) return;
    const time = (performance.now() - this.born) / 1000;
    this.renderer.draw({
      world: base,
      prev: this.hero?.prev ?? { x: base.p.x, y: base.p.y },
      alpha,
      time,
      ghost: null,
      ghostPrev: null,
      markers: this.skulls,
      reveal: false,
      hero: false,
    });
    const g = this.renderer.g;
    g.globalAlpha = 0.7;
    for (const r of this.crowd) {
      if (r.done) continue;
      const p = r.world.p;
      drawRunner(g, p, r.prev.x + (p.x - r.prev.x) * alpha, r.prev.y + (p.y - r.prev.y) * alpha, time, { colour: r.colour });
    }
    g.globalAlpha = 1;
    if (this.hero && this.hero.world.status !== "dead") {
      const p = this.hero.world.p;
      drawRunner(g, p, this.hero.prev.x + (p.x - this.hero.prev.x) * alpha, this.hero.prev.y + (p.y - this.hero.prev.y) * alpha, time);
      // A crown for the one that made it.
      const x = Math.round(p.x + 1);
      const y = Math.round(p.y - 5);
      g.fillStyle = PAL.y;
      g.fillRect(x, y + 1, 8, 3);
      g.fillRect(x, y - 1, 1, 2);
      g.fillRect(x + 3, y - 2, 2, 3);
      g.fillRect(x + 7, y - 1, 1, 2);
    }
  }
}
