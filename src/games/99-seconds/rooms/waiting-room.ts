// Chapter 1: The Waiting Room (Plan/03-99-seconds.md §5). A locked door with a keypad under a big clock, a window
// onto painted bricks, the chair you wake up in, a coat, a desk with a phone, and a photo screwed to the wall.
// The code is 0742: "42" is scratched behind the photo (the coat's coin turns its screws), and at 42 seconds left
// the clock flickers "07", if you're looking. Through the door is the same room, mirrored, where a spring lever
// holds the door open for ten seconds, and the note behind the photo says LEAVE AT ZERO. Stand in that doorway
// as the clock hits zero, and you're out.
import type { ChapterDef, Condition, Effect, Hotspot, Interaction } from "../core/types";

const N: Condition = { room: "normal" };
const M: Condition = { room: "mirror" };
const has = (flag: string, is = true): Condition => ({ flag, is });
const set = (flag: string, value = true): Effect => ({ setFlag: flag, value });
const say = (text: string): Effect => ({ say: text });
/** In the normal room with this flag (or not), or the mirrored room with that one. */
const either = (n: string, m: string, is = true): Condition => ({ any: [{ all: [N, has(n, is)] }, { all: [M, has(m, is)] }] });

const hotspots: Hotspot[] = [
  // North: the door, the clock, the keypad (or, through the looking-glass, the lever), the sign.
  { id: "clock", view: "north", label: "the clock", box: [610, 90, 380, 160], zoom: "closeup:clock" },
  { id: "door", view: "north", label: "the door", box: [650, 300, 300, 460], when: [either("n.door", "m.door", false)] },
  { id: "keypad", view: "north", label: "the keypad", box: [1000, 440, 120, 180], when: [N], zoom: "closeup:keypad" },
  { id: "lever", view: "north", label: "the lever", box: [1000, 420, 120, 220], when: [M] },
  { id: "sign", view: "north", label: "the sign", box: [230, 320, 300, 110] },
  { id: "doorway", view: "north", label: "the open doorway", box: [670, 320, 260, 440], when: [either("n.door", "m.door")] },
  // East: the window (and the bird at 13), the radiator, the plant.
  { id: "window", view: "east", label: "the window", box: [520, 170, 560, 420], look: "A window onto a brick wall. Somebody has painted a sky on the bricks." },
  { id: "bird", view: "east", label: "the bird", box: [880, 470, 140, 110], when: [has("bird")], look: "A small brown bird on the sill. Tap. Tap. Tap." },
  { id: "radiator", view: "east", label: "the radiator", box: [560, 620, 480, 120], look: "Cold. It has never been on." },
  { id: "plant", view: "east", label: "the plant", box: [1180, 420, 220, 340] },
  // South: the chair you wake up in, the coat, the magazines.
  { id: "chair", view: "south", label: "the chair", box: [600, 400, 280, 360], look: "The chair you keep waking up in. Still warm." },
  { id: "coat", view: "south", label: "the coat", box: [1120, 200, 220, 450] },
  { id: "magazines", view: "south", label: "the magazines", box: [280, 560, 220, 200], look: "Magazines, all from the same week. Every cover says TIME FLIES." },
  // West: the photo, the lamp, the phone, the drawer.
  { id: "photo", view: "west", label: "the photo", box: [690, 200, 220, 220], zoom: "closeup:photo" },
  { id: "lamp", view: "west", label: "the lamp", box: [470, 360, 160, 210] },
  { id: "phone", view: "west", label: "the phone", box: [930, 480, 170, 90] },
  { id: "drawer", view: "west", label: "the desk drawer", box: [690, 590, 220, 90], zoom: "closeup:drawer" },
  // Close-ups.
  { id: "display", view: "closeup:clock", label: "the clock's display", box: [300, 200, 1000, 500], look: "Big red digits, counting down. 99 when you wake. 0 when you… don't." },
  ...["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d, i): Hotspot => ({ id: `k${d}`, view: "closeup:keypad", label: `key ${d}`, box: [560 + (i % 3) * 160, 270 + Math.floor(i / 3) * 130, 140, 120] })),
  { id: "kC", view: "closeup:keypad", label: "clear", box: [560, 660, 140, 120] },
  { id: "k0", view: "closeup:keypad", label: "key 0", box: [720, 660, 140, 120] },
  { id: "kOK", view: "closeup:keypad", label: "enter", box: [880, 660, 140, 120] },
  { id: "screw1", view: "closeup:photo", label: "the top screw", box: [460, 130, 120, 120], when: [either("n.s1", "m.s1", false)] },
  { id: "screw2", view: "closeup:photo", label: "the bottom screw", box: [1020, 650, 120, 120], when: [either("n.s2", "m.s2", false)] },
  { id: "frame", view: "closeup:photo", label: "the photo", box: [600, 240, 400, 420], when: [either("n.photo", "m.photo", false)] },
  { id: "behind", view: "closeup:photo", label: "the scratches behind the photo", box: [480, 160, 640, 600], when: [either("n.photo", "m.photo")] },
  { id: "tally", view: "closeup:drawer", label: "the tally marks", box: [300, 240, 1000, 420] },
  { id: "through", view: "closeup:doorway", label: "go through", box: [560, 140, 480, 640] },
];

const room = (n: string, m: string): Condition => ({ any: [{ all: [N, has(n)] }, { all: [M, has(m)] }] });
void room;

const interactions: Interaction[] = [
  // The door.
  { id: "door-n", on: "door", requires: [N], effects: [say("Locked. Its hinges are on this side, right next to the handle. That isn't how doors work.")] },
  { id: "door-m", on: "door", requires: [M], effects: [say("No handle on this side. Only the lever.")] },
  { id: "sign-n", on: "sign", requires: [N], effects: [say("PLEASE WAIT. YOUR TURN WILL COME.")] },
  { id: "sign-m", on: "sign", requires: [M], effects: [say("The same sign, but the letters are all backwards.")] },
  // The keypad.
  ...["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d): Interaction => ({ id: `type-${d}`, on: `k${d}`, effects: [{ type: d }, { playSound: "beep" }] })),
  { id: "clear", on: "kC", effects: [{ clearEntry: true }, { playSound: "beep" }] },
  {
    id: "open",
    on: "kOK",
    requires: [{ entry: "0742" }],
    effects: [{ clearEntry: true }, set("n.door"), { revealClue: "code" }, { playSound: "unlock", caption: "[the lock clicks]", wall: "north" }, { goToView: "north" }, say("The lock clicks. The door swings open.")],
  },
  { id: "wrong", on: "kOK", effects: [{ clearEntry: true }, { playSound: "buzz", caption: "[the keypad buzzes]", wall: "north" }, say("ERROR. The keypad buzzes at you.")] },
  // Through the door: the same room, mirrored (and back again).
  {
    id: "through-n",
    on: "doorway",
    requires: [N],
    effects: [set("n.door", false), set("m.door", false), { goToRoom: "mirror", view: "south" }, { revealClue: "mirror" }, { playSound: "door" }, say("You step through into… the same room. Backwards. The door swings shut behind you.")],
  },
  { id: "stand", on: "doorway", requires: [M], effects: [{ goToView: "closeup:doorway" }, say("You stand in the doorway, holding the door with your shoulder. Beyond it: the room again, the right way round.")] },
  {
    id: "through-m",
    on: "through",
    effects: [set("m.door", false), set("n.door", false), { goToRoom: "normal", view: "south" }, { playSound: "door" }, say("You step through. The same room again, the right way round. The door clicks shut behind you.")],
  },
  // The lever.
  { id: "lever-open", on: "lever", requires: [has("m.door", false), has("m.charging", false)], effects: [set("m.door"), { resetProcess: "spring" }, { playSound: "spring", caption: "[the lever clanks; the door springs open]", wall: "north" }, say("You haul the lever down. The door springs open.")] },
  { id: "lever-open-already", on: "lever", requires: [has("m.door")], effects: [say("The door's already open. The lever's straining to pull it shut.")] },
  { id: "lever-charging", on: "lever", requires: [has("m.charging")], effects: [say("The lever won't budge. Something inside is still winding back.")] },
  // The coat.
  { id: "coat-n", on: "coat", requires: [N, has("n.coin", false)], durationMs: 3000, doing: "Searching the coat…", effects: [{ giveItem: "coin" }, set("n.coin"), { revealClue: "coin" }, say("In the pocket: a coin, worn thin at the edge.")] },
  { id: "coat-m", on: "coat", requires: [M, has("m.coin", false)], durationMs: 3000, doing: "Searching the coat…", effects: [{ giveItem: "coin" }, set("m.coin"), { revealClue: "coin" }, say("In the pocket: a coin, worn thin at the edge. The same coin.")] },
  { id: "coat-empty", on: "coat", effects: [say("Empty pockets now.")] },
  // The photo and its screws.
  { id: "s1-n", on: "screw1", use: "coin", requires: [N], durationMs: 6000, doing: "Unscrewing…", effects: [set("n.s1"), { playSound: "screw" }, say("One screw out.")] },
  { id: "s2-n", on: "screw2", use: "coin", requires: [N], durationMs: 6000, doing: "Unscrewing…", effects: [set("n.s2"), { playSound: "screw" }, say("One screw out.")] },
  { id: "s1-m", on: "screw1", use: "coin", requires: [M], durationMs: 6000, doing: "Unscrewing…", effects: [set("m.s1"), { playSound: "screw" }, say("One screw out.")] },
  { id: "s2-m", on: "screw2", use: "coin", requires: [M], durationMs: 6000, doing: "Unscrewing…", effects: [set("m.s2"), { playSound: "screw" }, say("One screw out.")] },
  ...(["screw1", "screw2"] as const).map((on): Interaction => ({ id: `${on}-bare`, on, effects: [{ revealClue: "screws" }, say("A flat-headed screw. Your fingernails won't turn it. Something thin and flat might.")] })),
  { id: "lift-n", on: "frame", requires: [N, has("n.s1"), has("n.s2")], effects: [set("n.photo"), { playSound: "lift" }, say("You lift the photo off the wall.")] },
  { id: "lift-m", on: "frame", requires: [M, has("m.s1"), has("m.s2")], effects: [set("m.photo"), { playSound: "lift" }, say("You lift the photo off the wall.")] },
  { id: "frame-held", on: "frame", effects: [{ revealClue: "screws" }, say("A photo of this room, with someone asleep in the chair. It's held to the wall by two screws.")] },
  { id: "behind-n", on: "behind", requires: [N], effects: [{ revealClue: "note42" }, say("Scratched into the plaster: 42. And under it, in handwriting a lot like yours: THE CLOCK KNOWS THE REST.")] },
  { id: "behind-m", on: "behind", requires: [M], effects: [{ revealClue: "zero" }, say("Scratched into the plaster, in your handwriting: LEAVE AT ZERO.")] },
  // The phone (it rings at 77).
  { id: "answer-n", on: "phone", requires: [has("phone"), N], effects: [set("phone", false), { revealClue: "phone" }, { playSound: "pickup" }, say("Static. Then a voice that sounds like yours: “Don't go through.” Click.")] },
  { id: "answer-m", on: "phone", requires: [has("phone"), M], effects: [set("phone", false), { revealClue: "phone2" }, { playSound: "pickup" }, say("Static. Your own voice, very calm: “Wait in the doorway. Wait for zero.” Click.")] },
  { id: "phone-dead", on: "phone", effects: [say("A rotary phone. No dial tone.")] },
  // The rest of the room.
  { id: "lamp-off", on: "lamp", requires: [has("lamp.off", false)], effects: [set("lamp.off"), { playSound: "click" }, say("Click.")] },
  { id: "lamp-on", on: "lamp", effects: [set("lamp.off", false), { playSound: "click" }, say("Click.")] },
  { id: "plant", on: "plant", durationMs: 2000, doing: "Digging in the soil…", effects: [say("Just soil. Somebody has dug here before, though.")] },
  { id: "tally", on: "tally", effects: [{ revealClue: "tally" }, say("Tally marks, in your handwriting. One for every time you've woken up in that chair.")] },
];

export const WAITING_ROOM: ChapterDef = {
  id: "waiting-room",
  number: 1,
  title: "The Waiting Room",
  start: { room: "normal", view: "north" },
  mirrored: ["mirror"],
  clockViews: ["north", "closeup:clock"],
  closeups: { "closeup:clock": "north", "closeup:keypad": "north", "closeup:photo": "west", "closeup:drawer": "west", "closeup:doorway": "north" },
  hotspots,
  interactions,
  events: [
    { at: 77, effects: [set("phone"), { playSound: "ring", caption: "[the phone rings, West wall]", wall: "west" }] },
    { at: 71, effects: [set("phone", false)] },
    { at: 66, effects: [set("dim"), { revealClue: "lights" }, { playSound: "dip", caption: "[the lights dip]" }] },
    { at: 64, effects: [set("dim", false)] },
    { at: 42, effects: [set("glitch"), { playSound: "glitch", caption: "[a buzz from the clock, North wall]", wall: "north" }] },
    { at: 42, requires: [{ viewing: ["north", "closeup:clock"] }, N], effects: [{ revealClue: "clock07" }] },
    { at: 41, effects: [set("glitch", false)] },
    { at: 13, effects: [set("bird"), { playSound: "bird", caption: "[a bird lands on the sill, East wall]", wall: "east" }] },
    { at: 13, requires: [{ viewing: "east" }], effects: [{ revealClue: "bird" }] },
    { at: 10, effects: [set("bird", false)] },
    { at: 3, requires: [{ viewing: "closeup:doorway" }], effects: [{ revealClue: "frame" }, { playSound: "hum", caption: "[the doorframe hums]" }] },
  ],
  processes: [
    // The spring door stays open ten seconds, then slams (and shoves you out of the doorway).
    {
      id: "spring",
      while: [has("m.door")],
      ms: 10_000,
      effects: [
        set("m.door", false),
        set("m.charging"),
        { playSound: "slam", caption: "[the door slams]", wall: "north" },
        { revealClue: "lever" },
        { when: [{ viewing: "closeup:doorway" }], then: [{ goToView: "north" }, say("The door slams shut and shoves you back into the room.")] },
      ],
    },
    { id: "recharge", while: [has("m.charging")], ms: 30_000, effects: [set("m.charging", false), { playSound: "ratchet", caption: "[the lever clicks back into place]", wall: "north" }] },
  ],
  atZero: [{ requires: [M, { viewing: "closeup:doorway" }, has("m.door")], effects: [{ revealClue: "out" }, { endChapter: "next" }] }],
  items: [{ id: "coin", name: "Coin", about: "An old coin, worn thin at the edge. Flat enough to turn a screw." }],
  clues: [
    { id: "coin", kind: "fact", text: "A coin in the coat pocket, worn thin at the edge." },
    { id: "screws", kind: "fact", text: "The photo is held to the wall by two flat-headed screws." },
    { id: "note42", kind: "note", text: "Behind the photo, scratched into the wall: 42.", code: "42", note: "THE CLOCK KNOWS THE REST" },
    { id: "clock07", kind: "event", text: "At 42 seconds left, the clock flickered: 07.", at: 42, code: "07" },
    { id: "code", kind: "code", text: "The door code.", code: "0742" },
    { id: "mirror", kind: "fact", text: "Through the door is the same room, mirrored. Its hinges were on the wrong side." },
    { id: "phone", kind: "event", text: "At 77 seconds left the phone rang. A voice like yours: “Don't go through.”", at: 77 },
    { id: "phone2", kind: "event", text: "In the mirrored room, the voice on the phone said: “Wait in the doorway. Wait for zero.”", at: 77 },
    { id: "lights", kind: "event", text: "At 66 seconds left the lights dip.", at: 66 },
    { id: "bird", kind: "event", text: "At 13 seconds left a bird lands on the sill and taps three times.", at: 13 },
    { id: "tally", kind: "fact", text: "Tally marks in the desk drawer, in your handwriting: one for every loop." },
    { id: "lever", kind: "fact", text: "The lever holds the mirrored door open for 10 seconds, then needs 30 to wind back." },
    { id: "zero", kind: "note", text: "Behind the mirrored photo, in your handwriting.", note: "LEAVE AT ZERO" },
    { id: "frame", kind: "event", text: "Standing in the open doorway, the frame glows in the last three seconds.", at: 3 },
    { id: "out", kind: "fact", text: "Standing in the doorway at zero, you slipped out of the loop." },
  ],
  goals: [
    { id: "door", done: "code", stages: ["LOOK UP AT THE CLOCK.", "THE CLOCK TALKS AT 42. THE PHOTO KNOWS THE REST.", "THE DOOR IS 0742."] },
    { id: "escape", done: "out", stages: ["DON'T GO THROUGH.", "WAIT IN THE DOORWAY. WAIT FOR ZERO.", "PULL THE LEVER AT 10. STAND IN THE DOORWAY. DON'T MOVE."] },
  ],
};
