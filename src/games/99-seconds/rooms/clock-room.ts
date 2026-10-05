// Chapter 3: The Clock Room (Plan/03-99-seconds.md §5). You're inside the giant clock: the back of its face, its
// gears, its pendulum, a clockmaker's bench. Time flies: at 77 seconds left the little clock on the bench sprouts
// wings, and it lands somewhere new every eight seconds; catch it, wind it, and it fits the gears' empty axle.
// Then the crank moves the big hand past 99, onto a scratched-out mark: 100. At zero the loop gets a hundredth
// second, and for that second there's a door behind the pendulum. Before you go, the notepad asks you to write
// what you read. Write the notes you found, and the loop closes. Don't, and nobody ever wrote them.
import type { ChapterDef, Condition, Effect, Hotspot, Interaction, TimedEvent } from "../core/types";

const has = (flag: string, is = true): Condition => ({ flag, is });
const set = (flag: string, value = true): Effect => ({ setFlag: flag, value });
const say = (text: string): Effect => ({ say: text });

/** The notepad: the three notes you found (and three that only look like them). */
export const NOTES = [
  { id: "clock", text: "THE CLOCK KNOWS THE REST", real: true },
  { id: "d1", text: "LEAVE AT ONE", real: false },
  { id: "oven", text: "THE OVEN IS HONEST", real: true },
  { id: "d2", text: "THE POT KNOWS THE REST", real: false },
  { id: "zero", text: "LEAVE AT ZERO", real: true },
  { id: "d3", text: "THE DOOR IS HONEST", real: false },
] as const;

/** Where the little clock lands, and when (seconds left): four seconds on each perch, four in the air between. */
export const PERCHES: ReadonlyArray<{ at: number; wall: "north" | "east" | "south" | "west" }> = [
  { at: 70, wall: "north" },
  { at: 62, wall: "east" },
  { at: 54, wall: "south" },
  { at: 46, wall: "north" },
  { at: 38, wall: "west" },
  { at: 30, wall: "east" },
  { at: 22, wall: "south" },
  { at: 14, wall: "north" },
  { at: 6, wall: "west" },
];
const PERCH_SECONDS = 4;
const WALL_NAMES = { north: "North", east: "East", south: "South", west: "West" } as const;

const PERCH_BOXES = {
  north: [730, 0, 140, 110],
  east: [490, 140, 140, 110],
  south: [730, 10, 140, 110],
  west: [890, 350, 190, 180],
} as const;

const hotspots: Hotspot[] = [
  // North: the back of the giant face, the crank.
  { id: "face", view: "north", label: "the giant clock face", box: [460, 50, 680, 680], zoom: "closeup:face" },
  { id: "crank", view: "north", label: "the crank", box: [1240, 490, 230, 240] },
  // East: the gears, the empty axle, the winding key.
  { id: "gears", view: "east", label: "the gears", box: [300, 150, 900, 560] },
  { id: "axle", view: "east", label: "the empty axle", box: [740, 480, 160, 160], when: [has("gears.running", false)] },
  { id: "key", view: "east", label: "the winding key", box: [1290, 270, 130, 180], when: [has("key.taken", false)] },
  // South: the pendulum, the chair, and (for one second) a door.
  { id: "pendulum", view: "south", label: "the pendulum", box: [600, 0, 400, 720] },
  { id: "chair", view: "south", label: "the chair", box: [1170, 430, 230, 330], look: "The chair you keep waking up in. Even here." },
  { id: "door100", view: "south", label: "the door behind the pendulum", box: [640, 280, 320, 480], when: [has("second100")] },
  // West: the bench, the notepad, the little clock.
  { id: "notepad", view: "west", label: "the notepad", box: [370, 420, 280, 120], zoom: "closeup:notepad" },
  { id: "tools", view: "west", label: "the tools", box: [300, 150, 500, 220], look: "Tweezers, tiny screwdrivers, a loupe. A clockmaker's tools, all laid out." },
  { id: "little", view: "west", label: "the little clock", box: [890, 350, 190, 180], when: [has("flown", false)] },
  // The little clock, landed.
  ...(Object.keys(PERCH_BOXES) as Array<keyof typeof PERCH_BOXES>).map((wall): Hotspot => ({ id: `perch-${wall}`, view: wall, label: "the little winged clock", box: PERCH_BOXES[wall], when: [has(`perch.${wall}`)] })),
  // Close-ups.
  { id: "mark", view: "closeup:face", label: "the scratched-out mark", box: [700, 30, 200, 130] },
  { id: "hands", view: "closeup:face", label: "the hands", box: [560, 180, 480, 480], look: "Two hands. The long one sweeps the seconds. The short one has always pointed at 99." },
  ...NOTES.map((n, i): Hotspot => ({ id: `write-${n.id}`, view: "closeup:notepad", label: `write: ${n.text}`, box: [1000, 150 + i * 100, 500, 84] })),
  { id: "tear", view: "closeup:notepad", label: "tear off the page", box: [1000, 770, 500, 70] },
];

const NOTES_RIGHT: readonly Condition[] = [has("note.clock"), has("note.zero"), has("note.oven"), { not: { any: [has("note.d1"), has("note.d2"), has("note.d3")] } }];

const interactions: Interaction[] = [
  // The key and the little clock.
  { id: "key", on: "key", effects: [set("key.taken"), { giveItem: "key" }, { revealClue: "key" }, say("A big brass winding key.")] },
  { id: "little", on: "little", effects: [say("A little mantel clock, ticking much too fast. A feather pokes out from under its case. It won't come off the bench. Not yet.")] },
  ...(Object.keys(PERCH_BOXES) as Array<keyof typeof PERCH_BOXES>).map(
    (wall): Interaction => ({
      id: `catch-${wall}`,
      on: `perch-${wall}`,
      effects: [set(`perch.${wall}`, false), set("caught"), { giveItem: "flyer" }, { revealClue: "caught" }, { playSound: "catch" }, say("Got it! Its little wings beat against your hands.")],
    }),
  ),
  { id: "wind", on: "item:flyer", use: "key", durationMs: 4000, doing: "Winding…", effects: [{ takeItem: "flyer" }, { giveItem: "wound" }, { revealClue: "wind" }, { playSound: "wind" }, say("You wind it until it stops struggling. Its wings fold away.")] },
  // The gears.
  {
    id: "fit",
    on: "axle",
    use: "wound",
    effects: [{ takeItem: "wound" }, set("gears.running"), { revealClue: "gears" }, { playSound: "gears", caption: "[gears grind into motion, East wall]", wall: "east" }, say("It fits the empty axle exactly. The gears shudder, and start to turn.")],
  },
  { id: "fit-wild", on: "axle", use: "flyer", effects: [say("It won't sit still long enough. It needs winding first.")] },
  { id: "axle", on: "axle", effects: [{ revealClue: "axle" }, say("An empty axle. Something about the size of a small clock is missing.")] },
  { id: "gears-on", on: "gears", requires: [has("gears.running")], effects: [say("Turning now. Ticking.")] },
  { id: "gears", on: "gears", effects: [say("Brass gears, all still. One axle is empty.")] },
  // The crank and the hundredth mark.
  { id: "crank", on: "crank", requires: [has("gears.running"), has("hand.at100", false)], durationMs: 4000, doing: "Turning the crank…", effects: [set("hand.at100"), { revealClue: "crank" }, { playSound: "clunk" }, say("The short hand creeps past 99 and settles on the scratched-out mark.")] },
  { id: "crank-done", on: "crank", requires: [has("hand.at100")], effects: [say("It won't go any further. 100 is as far as it goes.")] },
  { id: "crank-stuck", on: "crank", effects: [say("It won't turn. Nothing's driving it.")] },
  { id: "mark", on: "mark", effects: [{ revealClue: "hundred" }, say("Past 99, before 0: a mark someone has scratched out. 100.")] },
  // The pendulum.
  { id: "pendulum-still", on: "pendulum", requires: [has("second100")], effects: [say("Frozen mid-swing.")] },
  { id: "pendulum", on: "pendulum", effects: [say("A pendulum as long as a tree, swinging slowly. There's something behind it, a shape in the wall.")] },
  // The notepad: write what you read.
  ...NOTES.flatMap((n): Interaction[] => [
    { id: `wrote-${n.id}`, on: `write-${n.id}`, requires: [has(`note.${n.id}`)], effects: [say("Already written.")] },
    { id: `write-${n.id}`, on: `write-${n.id}`, durationMs: 2500, doing: "Writing…", effects: [set(`note.${n.id}`), { revealClue: "wrote" }, { playSound: "pencil" }] },
  ]),
  { id: "tear", on: "tear", effects: [...NOTES.map((n) => set(`note.${n.id}`, false)), { playSound: "tear" }, say("You tear off the page and start again.")] },
  // The door that exists for one second.
  { id: "true", on: "door100", requires: NOTES_RIGHT, effects: [{ revealClue: "out" }, { endChapter: "true" }] },
  { id: "paradox", on: "door100", effects: [{ revealClue: "out" }, { endChapter: "paradox" }] },
];

/** The little clock's flight: feathers first, then wings at 77, then a perch every eight seconds. */
const flight: TimedEvent[] = [
  ...[90, 85, 81].flatMap((at): TimedEvent[] => [
    { at, effects: [set("feather")] },
    { at, requires: [{ viewing: "west" }], effects: [{ revealClue: "feathers" }] },
    { at: at - 2, effects: [set("feather", false)] },
  ]),
  { at: 77, effects: [set("flown"), { playSound: "wings", caption: "[wings beating, West wall]", wall: "west" }] },
  { at: 77, requires: [{ viewing: "west" }], effects: [{ revealClue: "flies" }] },
  ...PERCHES.flatMap(({ at, wall }): TimedEvent[] => [
    { at, requires: [has("caught", false)], effects: [set(`perch.${wall}`), { playSound: "flutter", caption: `[a fluttering, ${WALL_NAMES[wall]} wall]`, wall }] },
    { at, requires: [has("caught", false), { viewing: wall }], effects: [{ revealClue: `p${at}` }] },
    { at: at - PERCH_SECONDS, effects: [set(`perch.${wall}`, false)] },
  ]),
];

export const CLOCK_ROOM: ChapterDef = {
  id: "clock-room",
  number: 3,
  title: "The Clock Room",
  start: { room: "clock", view: "north" },
  clockViews: ["north", "closeup:face"],
  closeups: { "closeup:face": "north", "closeup:notepad": "west" },
  hotspots,
  interactions,
  events: flight,
  processes: [],
  atZero: [{ requires: [has("hand.at100")], effects: [set("second100"), { revealClue: "second100" }, { playSound: "hundred", caption: "[the clock strikes a hundred]" }, { extraSecond: true }] }],
  items: [
    { id: "key", name: "Winding key", about: "A big brass winding key." },
    { id: "flyer", name: "The little clock", about: "A little mantel clock with wings, beating against your hands." },
    { id: "wound", name: "The little clock (wound)", about: "Wound tight. Its wings are folded away." },
  ],
  clues: [
    { id: "feathers", kind: "event", text: "Before 77 seconds, feathers drift down from the little clock on the bench.", at: 90 },
    { id: "flies", kind: "event", text: "At 77 seconds left, the little clock sprouts wings and flies off the bench.", at: 77 },
    ...PERCHES.map(({ at, wall }) => ({ id: `p${at}`, kind: "event" as const, text: `At ${at} seconds left it landed on the ${WALL_NAMES[wall]} wall, for four seconds.`, at })),
    { id: "caught", kind: "fact", text: "The little clock can be caught while it's landed." },
    { id: "key", kind: "fact", text: "A brass winding key hangs by the gears." },
    { id: "wind", kind: "fact", text: "Wound up, the little clock stops flying." },
    { id: "axle", kind: "fact", text: "The gears have an empty axle, the size of a small clock." },
    { id: "gears", kind: "fact", text: "With the little clock on the axle, the gears turn." },
    { id: "hundred", kind: "fact", text: "A scratched-out mark on the clock face, past 99: 100." },
    { id: "crank", kind: "fact", text: "With the gears turning, the crank moves the short hand onto 100." },
    { id: "second100", kind: "event", text: "With the hand on 100, the loop has a hundredth second. A door appears behind the pendulum.", at: 0 },
    { id: "wrote", kind: "fact", text: "The notepad on the bench says: Write what you read." },
    { id: "out", kind: "fact", text: "Through the door, in the hundredth second." },
  ],
  goals: [
    { id: "catch", done: "caught", stages: ["TIME FLIES.", "IT LANDS EVERY FEW SECONDS. BE THERE WHEN IT DOES.", "AT 70 IT LANDS ON TOP OF THE BIG CLOCK. CATCH IT."] },
    { id: "wind", done: "gears", stages: ["WIND IT UP.", "THE KEY HANGS BY THE GEARS. THE GEARS HAVE A GAP.", "WIND THE LITTLE CLOCK WITH THE KEY. PUT IT ON THE EMPTY AXLE."] },
    { id: "hundred", done: "crank", stages: ["COUNT PAST 99.", "THE CRANK MOVES THE SHORT HAND.", "TURN THE CRANK. THE HAND GOES TO 100."] },
    { id: "door", done: "out", stages: ["ONE MORE SECOND.", "AT 100, LOOK BEHIND THE PENDULUM.", "WHEN THE CLOCK SAYS 100, GO THROUGH THE DOOR BEHIND THE PENDULUM."] },
  ],
};
