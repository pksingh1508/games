// The night-shift tester (Plan/14-dont-blink.md §14: "every night is survivable by a tester using the reference
// photos"): a careful human, played by the computer. It only knows what a player could know: what's on the
// screen it's watching (and only once it's looked long enough, longer for subtler changes, and only while its
// eyes are open), the HUD's count of unreported changes, and which room the stone scrape came from. It knows the
// rooms' morning photos by heart (that's what the binder is for) and uses its photos on subtle nights. It never
// holds its eyes open, ignores creaks and footsteps, and takes most of a second to file each report.
import { OBJECTS } from "./catalogue";
import { seconds, VIEW_W } from "./constants";
import type { Active, Game } from "./game";
import { boxAt, boxCentre, visitorBox } from "./report";
import type { CameraId } from "./types";

export interface BotSkill {
  /** Seconds to spot a change: base + per subtlety level. */
  spot: number;
  perSubtlety: number;
  /** Subtle changes (4–5) take this much longer without a photo up. */
  noPhoto: number;
  /** Seconds to file a report once it's spotted. */
  file: number;
  /** Seconds it gives a camera before moving on, when it's hunting. */
  dwell: number;
}

export const CAREFUL: BotSkill = { spot: 0.7, perSubtlety: 0.5, noPhoto: 1.6, file: 0.9, dwell: 3.5 };

type Target = { kind: "anomaly"; slot: string } | { kind: "visitor" };

export class Bot {
  /** Ticks spent looking at each change (by slot). */
  private looked = new Map<string, number>();
  /** Changes it has spotted and not yet reported. */
  private spotted = new Set<string>();
  private visitorLooked = 0;
  private visitorSpotted = false;
  /** Where it heard the Visitor last. */
  private visitorRoom: CameraId = "sculpture";
  /** When it last checked each camera. */
  private checked = new Map<CameraId, number>();
  private arrived = 0;
  private filing: { target: Target; ready: number } | null = null;
  reports = 0;

  constructor(
    private readonly skill: BotSkill = CAREFUL,
    /** Never leaves its first camera (the naive watcher: proof the nights need more than that). */
    private readonly stayPut = false,
  ) {}

  /** Hear what happened last tick (the runtime's events, before the game clears them). */
  hear(game: Game) {
    for (const e of game.events) {
      if (e.type === "scrape") this.visitorRoom = e.room;
      if (e.type === "home") {
        this.visitorRoom = "sculpture";
        this.visitorSpotted = false;
        this.visitorLooked = 0;
      }
    }
  }

  /** One tick of a careful guard, before the game steps. */
  act(game: Game) {
    if (game.status !== "play") return;
    const t = game.tick;
    // Forget changes that are gone (reported).
    for (const slot of [...this.spotted]) if (!game.active.has(slot)) this.spotted.delete(slot);
    for (const slot of [...this.looked.keys()]) if (!game.active.has(slot)) this.looked.delete(slot);

    this.perceive(game);

    // Finish filing a report.
    if (this.filing) {
      if (t < this.filing.ready) return;
      const target = this.filing.target;
      this.filing = null;
      this.file(game, target);
      return;
    }

    // Something spotted on this camera: report it.
    const here = [...this.spotted].find((slot) => game.active.get(slot)?.def.camera === game.camera);
    if (here) {
      this.filing = { target: { kind: "anomaly", slot: here }, ready: t + seconds(this.skill.file) };
      return;
    }
    if (this.visitorSpotted && game.visitorRoom === game.camera && game.visitorStep > 0) {
      this.filing = { target: { kind: "visitor" }, ready: t + seconds(this.skill.file) };
      return;
    }
    if (this.stayPut || game.static > 0) return;

    // The Visitor's out: go and send it home (it can't move while you watch it).
    if (game.config.visitor > 0 && this.visitorRoom !== "sculpture" && this.visitorRoom !== "office" && game.canLook(this.visitorRoom)) {
      if (game.camera !== this.visitorRoom) this.go(game, this.visitorRoom);
      return;
    }

    // Changes waiting that it hasn't found: hunt for them, the least recently checked camera first.
    const unknown = game.active.size - this.spotted.size;
    const dwell = seconds(this.skill.dwell);
    if (unknown > 0) {
      const spottedElsewhere = [...this.spotted].map((s) => game.active.get(s)?.def.camera).find((c) => c && c !== game.camera);
      if (spottedElsewhere && game.canLook(spottedElsewhere)) {
        this.go(game, spottedElsewhere);
        return;
      }
      if (t - this.arrived >= dwell) this.go(game, this.stalest(game));
      return;
    }
    const spotted = [...this.spotted].map((s) => game.active.get(s)?.def.camera).find((c) => !!c);
    if (spotted && spotted !== game.camera) {
      this.go(game, spotted);
      return;
    }
    // All quiet: patrol slowly.
    if (t - this.arrived >= dwell * 2) this.go(game, this.stalest(game));
  }

  private stalest(game: Game): CameraId {
    let best = game.camera;
    let when = Infinity;
    for (const c of game.cameras) {
      if (c === game.camera) continue;
      if (c === "office" && !game.config.cameras.includes("office")) continue;
      const at = this.checked.get(c) ?? -1;
      if (at < when) {
        when = at;
        best = c;
      }
    }
    return best;
  }

  private go(game: Game, camera: CameraId) {
    if (game.look(camera)) {
      this.checked.set(camera, game.tick);
      this.arrived = game.tick;
      // On subtle nights, out comes the binder.
      const subtle = game.config.subtlety[1] >= 4;
      if (subtle && game.active.size > this.spotted.size && game.photos > 0 && camera !== "office") game.usePhoto();
    }
  }

  private need(game: Game, a: Active): number {
    const s = this.skill;
    let need = s.spot + s.perSubtlety * a.def.subtlety;
    if (a.def.subtlety >= 4 && game.photoLeft <= 0) need *= s.noPhoto;
    return seconds(need);
  }

  private perceive(game: Game) {
    if (!game.seeing()) return;
    this.checked.set(game.camera, game.tick);
    for (const [slot, a] of game.active) {
      if (a.def.camera !== game.camera || this.spotted.has(slot)) continue;
      // A slow change only shows once it's well under way.
      if (a.creep && (game.tick - a.at) / a.creep.ticks < 0.5) continue;
      const n = (this.looked.get(slot) ?? 0) + 1;
      this.looked.set(slot, n);
      if (n >= this.need(game, a)) this.spotted.add(slot);
    }
    if (game.visitorStep > 0 && game.visitorRoom === game.camera && !this.visitorSpotted) {
      this.visitorRoom = game.camera;
      if (++this.visitorLooked >= seconds(0.8)) this.visitorSpotted = true;
    }
  }

  private file(game: Game, target: Target) {
    const mirrored = game.mirrored();
    const show = (x: number) => (mirrored ? VIEW_W - x : x);
    if (target.kind === "visitor") {
      const box = visitorBox(game.camera);
      if (!box || game.visitorRoom !== game.camera) return;
      const c = boxCentre(box);
      game.report(show(c.x), c.y, "intruder");
      this.reports++;
      return;
    }
    const a = game.active.get(target.slot);
    if (!a || a.def.camera !== game.camera) return;
    this.reports++;
    if (a.def.object === "@view") {
      game.report(VIEW_W / 2, 200, "mirror");
      return;
    }
    const o = OBJECTS.get(a.def.object)!;
    const s = game.states.get(o.id)!;
    // Click it where it is, or where it was if it's gone.
    const c = boxCentre(boxAt(o, s.visible ? s : o.base));
    game.report(show(c.x), c.y, a.def.type);
  }
}

/** Play a whole night with a bot at the controls. */
export function playNight(game: Game, bot: Bot = new Bot()): Game {
  const limit = seconds(60 * 60);
  while (game.status === "play" && game.tick < limit) {
    bot.act(game);
    game.step();
    bot.hear(game);
    game.events.length = 0;
  }
  return game;
}
