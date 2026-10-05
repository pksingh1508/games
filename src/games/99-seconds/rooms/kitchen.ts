// Chapter 2: The Kitchen (Plan/03-99-seconds.md §5). The hatch in the floor is sealed with wax, and its key is
// frozen in a block of ice. Boiling water melts the wax; the oven melts the ice (30 seconds, door shut). But a
// watched pot never boils: it needs 50 seconds of nobody looking at it. And there's no loop clock up top: the wall
// clock runs slow (the loop "ends early" by it), while the note on the fridge, in your handwriting, says THE OVEN
// IS HONEST. Everything has to happen at once, inside one loop.
import type { ChapterDef, Condition, Effect, Hotspot, Interaction } from "../core/types";

const has = (flag: string, is = true): Condition => ({ flag, is });
const set = (flag: string, value = true): Effect => ({ setFlag: flag, value });
const say = (text: string): Effect => ({ say: text });

/** The wall clock runs slow: it loses three seconds in every ten, so by its reckoning the loop ends early. */
export const WALL_CLOCK_RATE = 0.7;

/** What the slow wall clock shows (seconds left, by its reckoning), this far into a loop. */
export const wallClockShows = (loopSeconds: number, elapsedMs: number) => Math.max(0, loopSeconds - (WALL_CLOCK_RATE * elapsedMs) / 1000);

/** You can see the pot from the stove wall and from the hob close-up (but not from inside the oven's close-up). */
const WATCHING_POT: Condition = { viewing: ["north", "closeup:stove"] };
const HEATING: readonly Condition[] = [has("pot.onHob"), has("pot.water"), has("hob.on"), has("pot.boiling", false)];

const hotspots: Hotspot[] = [
  // North: the stove and its pot, the oven and its timer.
  { id: "stove", view: "north", label: "the hob", box: [500, 360, 600, 140], zoom: "closeup:stove" },
  { id: "oven", view: "north", label: "the oven", box: [560, 550, 480, 200], zoom: "closeup:oven" },
  { id: "timer", view: "north", label: "the oven timer", box: [730, 500, 140, 50], zoom: "closeup:oven" },
  { id: "jars", view: "north", label: "the spice jars", box: [150, 280, 280, 100], look: "Salt, pepper, thyme. All labelled in your handwriting." },
  // East: the fridge, its note, the freezer, the calendar.
  { id: "freezer", view: "east", label: "the freezer", box: [560, 120, 440, 210], zoom: "closeup:freezer" },
  { id: "note", view: "east", label: "the note on the fridge", box: [680, 410, 200, 160] },
  { id: "fridge", view: "east", label: "the fridge", box: [560, 590, 440, 170], look: "Nothing in the fridge but a lemon." },
  { id: "calendar", view: "east", label: "the calendar", box: [1100, 220, 200, 220], look: "Every day is crossed off except today. Today is circled. Every day is today." },
  // South: the table, the hatch in the floor, the back door.
  { id: "hatch", view: "south", label: "the hatch in the floor", box: [580, 775, 440, 115], zoom: "closeup:hatch" },
  { id: "table", view: "south", label: "the table", box: [420, 500, 760, 260], look: "Two places set. Neither has been eaten from." },
  { id: "backdoor", view: "south", label: "the back door", box: [1250, 270, 220, 490], look: "Painted shut. Decades of paint." },
  // West: the sink, the cupboard (and the mitt in it), the wall clock, the radio.
  { id: "sink", view: "west", label: "the sink", box: [460, 360, 340, 170] },
  { id: "cupboard", view: "west", label: "the cupboard", box: [380, 140, 500, 240] },
  { id: "mitt", view: "west", label: "the oven mitt", box: [500, 200, 160, 150], when: [has("cupboard.open"), has("mitt.taken", false)] },
  { id: "wallclock", view: "west", label: "the wall clock", box: [1020, 150, 260, 260], zoom: "closeup:wallclock" },
  { id: "radio", view: "west", label: "the radio", box: [910, 390, 180, 90] },
  // Close-ups.
  { id: "pot", view: "closeup:stove", label: "the pot", box: [430, 200, 560, 460], when: [has("pot.onHob")] },
  { id: "burner", view: "closeup:stove", label: "the burner", box: [430, 430, 560, 280], when: [has("pot.onHob", false)] },
  { id: "knob", view: "closeup:stove", label: "the burner knob", box: [1080, 480, 240, 240] },
  { id: "ovendoor", view: "closeup:oven", label: "the oven door", box: [350, 300, 900, 520], when: [has("oven.open", false)] },
  { id: "ovenshut", view: "closeup:oven", label: "close the oven door", box: [350, 700, 900, 160], when: [has("oven.open")] },
  { id: "tray", view: "closeup:oven", label: "the oven tray", box: [450, 360, 700, 300], when: [has("oven.open")] },
  { id: "dial", view: "closeup:oven", label: "the oven dial", box: [1290, 350, 170, 170] },
  { id: "display", view: "closeup:oven", label: "the oven timer", box: [1270, 160, 220, 110] },
  { id: "ice", view: "closeup:freezer", label: "the block of ice", box: [580, 330, 440, 340], when: [has("ice.taken", false)] },
  { id: "face", view: "closeup:wallclock", label: "the clock face", box: [470, 120, 660, 660] },
  { id: "wax", view: "closeup:hatch", label: "the wax seal", box: [660, 380, 280, 220], when: [has("wax.melted", false)] },
  { id: "keyhole", view: "closeup:hatch", label: "the keyhole", box: [700, 420, 200, 160], when: [has("wax.melted"), has("hatch.unlocked", false)] },
  { id: "handle", view: "closeup:hatch", label: "the hatch's ring handle", box: [1060, 420, 180, 180] },
];

/** Put a pot (of water, or not) on the hob, from the wall or the close-up. */
const place = (on: string): Interaction[] => [
  { id: `${on}-water`, on, use: "water", requires: [has("pot.onHob", false)], effects: [{ takeItem: "water" }, set("pot.onHob"), set("pot.water"), say("You put the pot of water on the hob.")] },
  { id: `${on}-empty`, on, use: "pot", requires: [has("pot.onHob", false)], effects: [{ takeItem: "pot" }, set("pot.onHob"), set("pot.water", false), say("You put the empty pot back on the hob.")] },
];

const interactions: Interaction[] = [
  ...place("stove"),
  ...place("burner"),
  // The pot.
  { id: "pot-mitt", on: "pot", use: "mitt", requires: [has("pot.boiling")], effects: [set("pot.onHob", false), set("pot.boiling", false), set("pot.water", false), { giveItem: "boiling" }, say("With the mitt, you lift the boiling pot off the hob.")] },
  { id: "pot-hot", on: "pot", requires: [has("pot.boiling")], effects: [say("The handles are scalding. You'd need a mitt.")] },
  { id: "pot-take-water", on: "pot", requires: [has("pot.water")], effects: [set("pot.onHob", false), set("pot.water", false), { giveItem: "water" }, say("You take the pot of water off the hob.")] },
  { id: "pot-take", on: "pot", effects: [set("pot.onHob", false), { giveItem: "pot" }, say("An empty pot.")] },
  { id: "knob-on", on: "knob", requires: [has("hob.on", false)], effects: [set("hob.on"), { playSound: "ignite" }, say("The burner catches. A ring of blue flame.")] },
  { id: "knob-off", on: "knob", effects: [set("hob.on", false), { playSound: "click" }, say("Off.")] },
  // The sink.
  { id: "fill", on: "sink", use: "pot", durationMs: 3000, doing: "Filling the pot…", effects: [{ takeItem: "pot" }, { giveItem: "water" }, { playSound: "pour" }, say("A pot of cold water.")] },
  { id: "sink-boiling", on: "sink", use: "boiling", effects: [say("Not after all that.")] },
  { id: "tap", on: "sink", effects: [{ playSound: "tap" }, say("The tap runs cold.")] },
  // The cupboard and the mitt.
  { id: "cupboard-open", on: "cupboard", requires: [has("cupboard.open", false)], effects: [set("cupboard.open"), { playSound: "creak" }, say("Plates, a colander, and an oven mitt.")] },
  { id: "cupboard-shut", on: "cupboard", effects: [set("cupboard.open", false), { playSound: "click" }] },
  { id: "mitt", on: "mitt", effects: [set("mitt.taken"), { giveItem: "mitt" }, { revealClue: "mitt" }, say("An oven mitt, singed at the thumb.")] },
  // The freezer and the ice.
  { id: "ice", on: "ice", durationMs: 1500, doing: "Prising the ice loose…", effects: [set("ice.taken"), { giveItem: "ice" }, { revealClue: "ice" }, say("A block of ice. Frozen in the middle of it: a key.")] },
  // The oven.
  { id: "oven-open", on: "ovendoor", effects: [set("oven.open"), { playSound: "creak" }, say("The oven door drops open.")] },
  { id: "oven-shut", on: "ovenshut", effects: [set("oven.open", false), { playSound: "thunk" }, say("Shut.")] },
  { id: "tray-ice", on: "tray", use: "ice", requires: [has("ice.inOven", false), has("key.inOven", false)], effects: [{ takeItem: "ice" }, set("ice.inOven"), say("You set the block of ice on the oven tray.")] },
  { id: "key-mitt", on: "tray", use: "mitt", requires: [has("key.inOven")], effects: [set("key.inOven", false), { giveItem: "key" }, say("With the mitt, you fish the key out of the puddle.")] },
  { id: "key-hot", on: "tray", requires: [has("key.inOven")], effects: [{ revealClue: "hot" }, say("The key's too hot to touch.")] },
  { id: "ice-melting", on: "tray", requires: [has("ice.inOven")], effects: [say("The ice is still there. It needs heat, and the door shut.")] },
  { id: "tray-empty", on: "tray", effects: [say("An empty oven tray.")] },
  { id: "dial-on", on: "dial", requires: [has("oven.on", false)], effects: [set("oven.on"), { playSound: "click" }, say("The oven hums. Its light comes on.")] },
  { id: "dial-off", on: "dial", effects: [set("oven.on", false), { playSound: "click" }, say("Off.")] },
  { id: "display", on: "display", effects: [{ revealClue: "timer" }, say("The oven timer counts down, second by second, right along with the loop.")] },
  { id: "timer", on: "timer", effects: [{ revealClue: "timer" }, { goToView: "closeup:oven" }] },
  // The notes and clocks.
  { id: "note", on: "note", effects: [{ revealClue: "honest" }, say("In your handwriting: THE OVEN IS HONEST.")] },
  { id: "face", on: "face", effects: [{ revealClue: "slow" }, say("Its second hand sticks, stutters, jumps. This clock is losing time.")] },
  { id: "radio", on: "radio", effects: [{ revealClue: "radio" }, { playSound: "click" }, say("The same tune, over and over. Each time round, it lasts exactly one loop.")] },
  // The hatch.
  { id: "pour", on: "wax", use: "boiling", durationMs: 3000, doing: "Pouring…", effects: [{ takeItem: "boiling" }, { giveItem: "pot" }, set("wax.melted"), { revealClue: "waxmelt" }, { playSound: "hiss" }, say("The wax hisses and runs. Underneath: a keyhole.")] },
  { id: "wax-water", on: "wax", use: "water", effects: [say("Cold water just beads on the wax.")] },
  { id: "wax", on: "wax", effects: [{ revealClue: "wax" }, say("Thick red wax, poured over the hatch's lock. You can just see the shape of a keyhole underneath.")] },
  { id: "unlock", on: "keyhole", use: "key", effects: [{ takeItem: "key" }, set("hatch.unlocked"), { playSound: "unlock" }, say("The key turns.")] },
  { id: "keyhole", on: "keyhole", effects: [say("A keyhole, still warm from the wax.")] },
  { id: "lift", on: "handle", requires: [has("hatch.unlocked")], effects: [{ revealClue: "down" }, { playSound: "hatch" }, { endChapter: "next" }] },
  { id: "handle", on: "handle", effects: [say("It won't lift. Locked.")] },
];

export const KITCHEN: ChapterDef = {
  id: "kitchen",
  number: 2,
  title: "The Kitchen",
  start: { room: "kitchen", view: "north" },
  startFlags: ["pot.onHob"],
  clockViews: ["north", "closeup:oven", "west", "closeup:wallclock"],
  closeups: { "closeup:stove": "north", "closeup:oven": "north", "closeup:freezer": "east", "closeup:hatch": "south", "closeup:wallclock": "west" },
  hideClock: true,
  hotspots,
  interactions,
  events: [],
  processes: [
    // A watched pot never boils: 50 seconds of nobody looking at it.
    { id: "boil", while: [...HEATING, { not: WATCHING_POT }], ms: 50_000, effects: [set("pot.boiling"), { revealClue: "boil" }, { playSound: "whistle", caption: "[the pot comes to the boil, North wall]", wall: "north" }] },
    // …and the tell: watch it for a moment, and the bubbles stop.
    { id: "stare", while: [...HEATING, WATCHING_POT], ms: 2000, effects: [{ revealClue: "frozen" }] },
    // The oven frees the key in 30 seconds, with its door shut.
    { id: "melt", while: [has("ice.inOven"), has("oven.on"), has("oven.open", false)], ms: 30_000, effects: [set("ice.inOven", false), set("key.inOven"), { revealClue: "melt" }, { playSound: "ding", caption: "[the oven pings, North wall]", wall: "north" }] },
    // A whole minute of staring at a heating pot (the A Watched Pot trophy).
    { id: "marathon", while: [...HEATING, WATCHING_POT], ms: 60_000, effects: [set("stared")] },
    // Looking at the wall clock (to notice later that the loop ended "early" by it).
    { id: "glance", while: [{ viewing: ["west", "closeup:wallclock"] }], ms: 500, effects: [set("saw.wallclock")] },
  ],
  atZero: [{ requires: [has("saw.wallclock")], effects: [{ revealClue: "early" }] }],
  items: [
    { id: "pot", name: "Pot", about: "An empty saucepan." },
    { id: "water", name: "Pot of water", about: "A saucepan of cold water." },
    { id: "boiling", name: "Boiling pot", about: "A saucepan of boiling water, held in the mitt." },
    { id: "ice", name: "Block of ice", about: "A block of ice with a key frozen in the middle." },
    { id: "key", name: "Key", about: "A small iron key, still warm." },
    { id: "mitt", name: "Oven mitt", about: "An oven mitt, singed at the thumb." },
  ],
  clues: [
    { id: "honest", kind: "note", text: "On the fridge, in your handwriting.", note: "THE OVEN IS HONEST" },
    { id: "timer", kind: "fact", text: "The oven timer counts down right along with the loop." },
    { id: "slow", kind: "fact", text: "The wall clock's second hand stutters. It's losing time." },
    { id: "early", kind: "fact", text: "The loop ended while the wall clock still had half a minute to go." },
    { id: "radio", kind: "fact", text: "The tune on the radio lasts exactly one loop." },
    { id: "frozen", kind: "fact", text: "Watch the pot while it heats, and its bubbles freeze." },
    { id: "boil", kind: "fact", text: "The pot boils after 50 seconds, but only the seconds nobody's watching it." },
    { id: "ice", kind: "fact", text: "A key, frozen in a block of ice in the freezer." },
    { id: "melt", kind: "fact", text: "In the oven, with the door shut, the ice melts in 30 seconds." },
    { id: "hot", kind: "fact", text: "The key comes out of the oven too hot to touch." },
    { id: "mitt", kind: "fact", text: "An oven mitt, in the cupboard over the sink." },
    { id: "wax", kind: "fact", text: "The hatch's lock is sealed under red wax." },
    { id: "waxmelt", kind: "fact", text: "Boiling water melts the wax off the lock." },
    { id: "down", kind: "fact", text: "Under the hatch: stairs, going down." },
  ],
  goals: [
    { id: "boil", done: "boil", stages: ["A WATCHED POT…", "…NEVER BOILS. FILL IT, LIGHT IT, LOOK AWAY.", "WATER IN THE POT, POT ON THE HOB, FLAME ON. THEN DON'T LOOK AT IT FOR 50 SECONDS."] },
    { id: "key", done: "melt", stages: ["THE KEY IS ON ICE.", "THE OVEN WILL FREE IT. SHUT THE DOOR.", "ICE ON THE OVEN TRAY, DOOR SHUT, OVEN ON. 30 SECONDS. THE MITT FOR THE KEY."] },
    { id: "down", done: "down", stages: ["WAX MELTS.", "BOILING WATER ON THE WAX.", "POUR THE BOILING POT ON THE HATCH. KEY IN THE LOCK. LIFT."] },
  ],
};
