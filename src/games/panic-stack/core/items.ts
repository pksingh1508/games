// Every item (Plan/11-panic-stack.md §3 "Items that lie"): what it looks like (its name, its picture, the size
// you see) and what it really is (its shape and weight in the physics, how it behaves, the sound it makes when
// you tap it). The picture and the physics shape are deliberately separate: that's how items lie about their
// shape. Twelve come from the plan; seven honest props dress the locations (a crate is a crate).
import type { Vec } from "./geometry";

export type ItemId =
  | "brick"
  | "bowling"
  | "safe"
  | "feather"
  | "box"
  | "duck"
  | "jelly"
  | "ice"
  | "balloon"
  | "vase"
  | "cake"
  | "magnet"
  | "plate"
  | "crate"
  | "anvil"
  | "block"
  | "statue"
  | "loaf"
  | "cargo";

export type Weight = "light" | "medium" | "heavy";

export type ShapeDef =
  | { kind: "box"; w: number; h: number }
  | { kind: "circle"; r: number }
  | { kind: "poly"; points: ReadonlyArray<readonly [number, number]> }
  /** A box with a hidden rounded bottom: the bottom edge sags by `sag` in the middle. */
  | { kind: "rocker"; w: number; h: number; sag: number };

export type Behaviour =
  /** Rises at `rise` m/s on its own; pushes up with at most `push` N more than its weight (anything heavier holds it down). */
  | { type: "float"; rise: number; push: number }
  /** Grows from the moment it's let go, to `maxScale` over `seconds`; pops if it's hit harder than `popImpulse`. */
  | { type: "inflate"; seconds: number; maxScale: number; popImpulse: number }
  /** Shrinks from the moment it's let go, to `minScale` over `seconds`, then it's a puddle. */
  | { type: "melt"; seconds: number; minScale: number }
  /** Squashes flatter (to 1 − maxSquash) under a load of `fullLoad` N or more, and stays squashed. */
  | { type: "squish"; maxSquash: number; fullLoad: number }
  /** Breaks when hit harder than `breakImpulse` (N·s in one sub-step). */
  | { type: "fragile"; breakImpulse: number }
  /** Sticks to whatever it lands on (a weld), up to `maxWelds` things. */
  | { type: "sticky"; maxWelds: number }
  /** Pulls metal items within `radius`: strength × their mass / distance², at most `maxForce` (both ways). */
  | { type: "magnet"; strength: number; radius: number; maxForce: number };

/** The tap test (§3): every item's true sound. */
export type TapSound =
  | "clunk"
  | "thud"
  | "tink"
  | "rock"
  | "squelch"
  | "blorp"
  | "clink"
  | "squeak"
  | "chime"
  | "pff"
  | "clank"
  | "clack"
  | "knock"
  | "clang"
  | "tok"
  | "thunk"
  | "thup"
  | "clong";

/** Each sound's caption (§11: tap-test sounds have captions), and how heavy it sounds. */
export const TAP_SOUNDS: Record<TapSound, { caption: string; sounds: Weight }> = {
  clunk: { caption: "clunk", sounds: "medium" },
  thud: { caption: "THUD", sounds: "heavy" },
  tink: { caption: "tink", sounds: "light" },
  rock: { caption: "clonk… clonk… (it rocks)", sounds: "light" },
  squelch: { caption: "squelch", sounds: "light" },
  blorp: { caption: "blorp (it wobbles)", sounds: "medium" },
  clink: { caption: "clink… drip", sounds: "medium" },
  squeak: { caption: "squeak… hisss", sounds: "light" },
  chime: { caption: "ting-a-ling (so delicate)", sounds: "light" },
  pff: { caption: "pff (soft)", sounds: "medium" },
  clank: { caption: "clank… bzzz", sounds: "medium" },
  clack: { caption: "clack", sounds: "light" },
  knock: { caption: "knock knock", sounds: "medium" },
  clang: { caption: "CLANG", sounds: "heavy" },
  tok: { caption: "tok", sounds: "light" },
  thunk: { caption: "THUNK", sounds: "heavy" },
  thup: { caption: "thup", sounds: "light" },
  clong: { caption: "clong", sounds: "medium" },
};

/** How a liar gives itself away (§10 rule 1: at least two tells each). */
export interface Tell {
  /** drag: how it follows your hand; tap: its sound; belt: what it does on the conveyor; look: a detail in its picture. */
  kind: "drag" | "tap" | "belt" | "look";
  text: string;
}

export interface ItemDef {
  id: ItemId;
  /** What it looks like (what you'd call it). */
  name: string;
  looks: { weight: Weight; shape: "box" | "round" | "odd" };
  /** The picture's size (m). */
  size: { w: number; h: number };
  /** The truth. */
  shape: ShapeDef;
  mass: number;
  friction: number;
  restitution: number;
  /** Magnets pull it. */
  metal?: boolean;
  linearDamping?: number;
  angularDamping?: number;
  behaviours: readonly Behaviour[];
  tap: TapSound;
  /** Liars only: what's really going on, and the tells. */
  lie?: { truth: string; tells: readonly Tell[] };
  /** One line for the item guide, once you've met it. */
  note: string;
}

const box = (w: number, h: number): ShapeDef => ({ kind: "box", w, h });

export const ITEMS: Record<ItemId, ItemDef> = {
  brick: {
    id: "brick",
    name: "Brick",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.8, h: 0.4 },
    shape: box(0.8, 0.4),
    mass: 2,
    friction: 0.8,
    restitution: 0.02,
    behaviours: [],
    tap: "clunk",
    note: "A brick. Sometimes things are exactly what they look like.",
  },
  bowling: {
    id: "bowling",
    name: "Bowling Ball",
    looks: { weight: "heavy", shape: "round" },
    size: { w: 0.62, h: 0.62 },
    shape: { kind: "circle", r: 0.31 },
    mass: 4.5,
    friction: 0.5,
    restitution: 0.05,
    angularDamping: 0.6,
    behaviours: [],
    tap: "thud",
    note: "Heavy and round, as advertised. It rolls off anything that isn't a dip.",
  },
  safe: {
    id: "safe",
    name: "Iron Safe",
    looks: { weight: "heavy", shape: "box" },
    size: { w: 0.8, h: 0.8 },
    shape: box(0.8, 0.8),
    mass: 0.8,
    friction: 0.7,
    restitution: 0.05,
    metal: true,
    angularDamping: 1.5,
    behaviours: [{ type: "float", rise: 0.3, push: 3 }],
    tap: "tink",
    lie: {
      truth: "It's full of helium. Left alone it floats up and away; anything sitting on it holds it down.",
      tells: [
        { kind: "drag", text: "It zips ahead of your hand and bobs about, like something light." },
        { kind: "tap", text: "A hollow “tink”, not a heavy clunk." },
        { kind: "belt", text: "It hovers a finger's width above the belt (look at its shadow), and the belt doesn't sag." },
      ],
    },
    note: "Full of helium. Weigh it down at once, or it drifts off.",
  },
  feather: {
    id: "feather",
    name: "Feather",
    looks: { weight: "light", shape: "odd" },
    size: { w: 1.1, h: 0.36 },
    shape: box(1, 0.22),
    mass: 6,
    friction: 0.75,
    restitution: 0,
    behaviours: [],
    tap: "thud",
    lie: {
      truth: "It weighs as much as an anvil, and it crushes whatever it lands on.",
      tells: [
        { kind: "drag", text: "It lags far behind your hand and sags as you lift it." },
        { kind: "tap", text: "“THUD”." },
        { kind: "belt", text: "The belt sags under it." },
      ],
    },
    note: "As heavy as an anvil. Put it low, and lower it gently.",
  },
  box: {
    id: "box",
    name: "Cardboard Box",
    looks: { weight: "light", shape: "box" },
    size: { w: 0.8, h: 0.6 },
    shape: { kind: "rocker", w: 0.8, h: 0.6, sag: 0.18 },
    angularDamping: 0.4,
    mass: 1,
    friction: 0.6,
    restitution: 0.02,
    behaviours: [],
    tap: "rock",
    lie: {
      truth: "Its bottom is secretly rounded, so it rocks and rolls. Turn it on its side and it's flat.",
      tells: [
        { kind: "belt", text: "It rocks back and forth on the belt." },
        { kind: "tap", text: "“Clonk… clonk”: it rocks when you tap it." },
      ],
    },
    note: "A rounded bottom. Turn it 90° (Q or E) and it stands flat.",
  },
  duck: {
    id: "duck",
    name: "Rubber Duck",
    looks: { weight: "light", shape: "odd" },
    size: { w: 0.62, h: 0.56 },
    shape: {
      kind: "poly",
      points: [
        [-0.29, -0.28],
        [0.27, -0.28],
        [0.31, -0.12],
        [0.22, 0.06],
        [0.12, 0.28],
        [-0.08, 0.28],
        [-0.2, 0.12],
        [-0.31, -0.06],
      ],
    },
    mass: 0.7,
    friction: 0.95,
    restitution: 0,
    behaviours: [{ type: "sticky", maxWelds: 3 }],
    tap: "squelch",
    lie: {
      truth: "It isn't bouncy at all. It's covered in glue, and sticks to whatever it lands on.",
      tells: [
        { kind: "tap", text: "A wet “squelch”, not a squeak." },
        { kind: "look", text: "It's shiny with glue, and strings of goo stretch when you pick it up." },
      ],
    },
    note: "Sticky as glue: it holds things together. Wherever it lands, it stays.",
  },
  jelly: {
    id: "jelly",
    name: "Jelly",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.7, h: 0.5 },
    shape: box(0.7, 0.5),
    mass: 1.4,
    friction: 0.03,
    restitution: 0,
    behaviours: [],
    tap: "blorp",
    lie: {
      truth: "Wobbly and slippery: anything on a slope slides straight off it, and it slides off anything too.",
      tells: [
        { kind: "belt", text: "It jiggles on the belt." },
        { kind: "tap", text: "“Blorp”." },
      ],
    },
    note: "Slippery. Only perfectly flat, perfectly still things stay on it.",
  },
  ice: {
    id: "ice",
    name: "Ice Cube",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.6, h: 0.6 },
    shape: box(0.6, 0.6),
    mass: 1.6,
    friction: 0.12,
    restitution: 0,
    behaviours: [{ type: "melt", seconds: 20, minScale: 0.25 }],
    tap: "clink",
    lie: {
      truth: "It melts. Twenty seconds after you let go it's a puddle, and whatever was on it comes down.",
      tells: [
        { kind: "belt", text: "Little drips fall from it on the belt." },
        { kind: "tap", text: "“Clink… drip”." },
      ],
    },
    note: "Melts in 20 seconds. Slippery too.",
  },
  balloon: {
    id: "balloon",
    name: "Balloon",
    looks: { weight: "light", shape: "round" },
    size: { w: 0.6, h: 0.6 },
    shape: { kind: "circle", r: 0.3 },
    mass: 0.15,
    friction: 0.5,
    restitution: 0.4,
    linearDamping: 0.8,
    angularDamping: 1,
    behaviours: [{ type: "inflate", seconds: 15, maxScale: 1.9, popImpulse: 2.5 }],
    tap: "squeak",
    lie: {
      truth: "It keeps inflating, pushing everything around it apart. Hit it hard and it pops.",
      tells: [
        { kind: "belt", text: "It grows a little as it rides the belt." },
        { kind: "tap", text: "“Squeak… hisss”: it's still filling up." },
      ],
    },
    note: "Keeps inflating for 15 seconds. Pop it with something heavy, or keep it on top.",
  },
  vase: {
    id: "vase",
    name: "Vase",
    looks: { weight: "medium", shape: "odd" },
    size: { w: 0.46, h: 0.76 },
    shape: {
      kind: "poly",
      points: [
        [-0.15, -0.38],
        [0.15, -0.38],
        [0.23, -0.1],
        [0.2, 0.15],
        [0.14, 0.38],
        [-0.14, 0.38],
        [-0.2, 0.15],
        [-0.23, -0.1],
      ],
    },
    mass: 1.2,
    friction: 0.6,
    restitution: 0,
    behaviours: [{ type: "fragile", breakImpulse: 3.5 }],
    tap: "chime",
    lie: {
      truth: "It's fragile. Drop it, or drop something on it, and it breaks: that's the level over.",
      tells: [
        { kind: "look", text: "A hairline crack." },
        { kind: "tap", text: "A delicate “ting-a-ling”." },
      ],
    },
    note: "Fragile. Lower it (and anything onto it) right down before letting go.",
  },
  cake: {
    id: "cake",
    name: "Cake",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.8, h: 0.45 },
    shape: box(0.8, 0.45),
    mass: 1.5,
    friction: 0.75,
    restitution: 0,
    behaviours: [{ type: "squish", maxSquash: 0.45, fullLoad: 70 }],
    tap: "pff",
    lie: {
      truth: "It squashes flatter under weight, and stays squashed. A heavy load lopsided on it tips the tower.",
      tells: [
        { kind: "tap", text: "A soft “pff”, and it dents when you tap it." },
        { kind: "belt", text: "It sags a little every time the belt bumps." },
      ],
    },
    note: "Squashes under weight (up to almost half). Keep it near the top.",
  },
  magnet: {
    id: "magnet",
    name: "Paperweight",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.7, h: 0.45 },
    shape: box(0.7, 0.45),
    mass: 2.5,
    friction: 0.7,
    restitution: 0,
    metal: true,
    behaviours: [{ type: "magnet", strength: 8, radius: 2.2, maxForce: 45 }],
    tap: "clank",
    lie: {
      truth: "It's a magnet. It pulls metal things (safes, anvils, cargo pods, other magnets) toward it.",
      tells: [
        { kind: "look", text: "Paper clips stuck to its side." },
        { kind: "tap", text: "“Clank… bzzz”: it hums." },
      ],
    },
    note: "A magnet in disguise. Metal things creep toward it.",
  },
  plate: {
    id: "plate",
    name: "Plate",
    looks: { weight: "light", shape: "box" },
    size: { w: 0.9, h: 0.14 },
    shape: box(0.9, 0.14),
    mass: 0.6,
    friction: 0.6,
    restitution: 0,
    behaviours: [],
    tap: "clack",
    note: "A plate. Flat and honest.",
  },
  crate: {
    id: "crate",
    name: "Crate",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.8, h: 0.7 },
    shape: box(0.8, 0.7),
    mass: 2.4,
    friction: 0.8,
    restitution: 0,
    behaviours: [],
    tap: "knock",
    note: "A wooden crate. Good and square.",
  },
  anvil: {
    id: "anvil",
    name: "Anvil",
    looks: { weight: "heavy", shape: "odd" },
    size: { w: 0.8, h: 0.5 },
    shape: {
      kind: "poly",
      points: [
        [-0.24, -0.25],
        [0.24, -0.25],
        [0.4, 0.11],
        [0.4, 0.25],
        [-0.4, 0.25],
        [-0.4, 0.11],
      ],
    },
    mass: 6,
    friction: 0.8,
    restitution: 0,
    metal: true,
    behaviours: [],
    tap: "clang",
    note: "An anvil. Really heavy, really metal.",
  },
  block: {
    id: "block",
    name: "Toy Block",
    looks: { weight: "light", shape: "box" },
    size: { w: 0.5, h: 0.5 },
    shape: box(0.5, 0.5),
    mass: 0.8,
    friction: 0.8,
    restitution: 0.02,
    behaviours: [],
    tap: "tok",
    note: "A wooden toy block. Square, light and honest.",
  },
  statue: {
    id: "statue",
    name: "Statue",
    looks: { weight: "heavy", shape: "odd" },
    size: { w: 0.5, h: 0.9 },
    shape: box(0.5, 0.9),
    mass: 4,
    friction: 0.85,
    restitution: 0,
    behaviours: [],
    tap: "thunk",
    note: "A marble statue. Heavy and tall: lay it down, or stand it carefully.",
  },
  loaf: {
    id: "loaf",
    name: "Loaf",
    looks: { weight: "light", shape: "box" },
    size: { w: 0.8, h: 0.4 },
    shape: box(0.8, 0.4),
    mass: 0.8,
    friction: 0.75,
    restitution: 0,
    behaviours: [],
    tap: "thup",
    note: "A loaf of bread. Fresh, light, honest.",
  },
  cargo: {
    id: "cargo",
    name: "Cargo Pod",
    looks: { weight: "medium", shape: "box" },
    size: { w: 0.8, h: 0.6 },
    shape: box(0.8, 0.6),
    mass: 2.2,
    friction: 0.7,
    restitution: 0,
    metal: true,
    behaviours: [],
    tap: "clong",
    note: "A metal cargo pod. Honest, but magnets like it.",
  },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
export const LIARS = ITEM_IDS.filter((id) => ITEMS[id].lie);

export const behaviourOf = <T extends Behaviour["type"]>(def: ItemDef, type: T) =>
  def.behaviours.find((b) => b.type === type) as Extract<Behaviour, { type: T }> | undefined;

/** The physics outline at a scale (inflate, melt) and squash (height only, bottom kept in place), as points. */
export function outline(shape: ShapeDef, scale = 1, squash = 1): Vec[] {
  const pts: ReadonlyArray<readonly [number, number]> = (() => {
    switch (shape.kind) {
      case "box":
        return [
          [-shape.w / 2, -shape.h / 2],
          [shape.w / 2, -shape.h / 2],
          [shape.w / 2, shape.h / 2],
          [-shape.w / 2, shape.h / 2],
        ];
      case "poly":
        return shape.points;
      case "rocker": {
        const { w, h, sag } = shape;
        const out: Array<[number, number]> = [];
        // The rounded bottom, from the right corner to the left, then the flat top. The middle facet is flat
        // but tiny (3 cm), so it sits up straight on its own and tips under anything not dead centre.
        for (const u of [1, 0.72, 0.45, 0.2, 0.04, -0.04, -0.2, -0.45, -0.72, -1]) out.push([(u * w) / 2, -h / 2 + sag * u * u]);
        out.push([-w / 2, h / 2], [w / 2, h / 2]);
        return out;
      }
      case "circle":
        return [];
    }
  })();
  // Squash keeps the bottom where it is and spreads a little sideways.
  const h = shape.kind === "circle" ? shape.r * 2 : Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]));
  const bottom = -h / 2;
  const spread = 1 + 0.35 * (1 - squash);
  return pts.map(([x, y]) => ({ x: x * scale * spread, y: (bottom + (y - bottom) * squash) * scale }));
}

/** Area of the outline at scale 1 (for density). */
export function areaOf(shape: ShapeDef): number {
  if (shape.kind === "circle") return Math.PI * shape.r * shape.r;
  const pts = outline(shape);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}
