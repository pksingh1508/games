// Mr. Nope's stock lines. Straight-faced lines are never lies about an answer (secret rule 5):
// banter only.

/** After a NOPE. */
export const SMUG_LINES = [
  "NOPE!",
  "Ha! Classic.",
  "Wrong-o.",
  "Delicious.",
  "That's going on the wall.",
  "I love this job.",
  "Bold. Wrong, but bold.",
  "Thank you for your stamp donation.",
  "Mmm. Tasty mistake.",
  "Nope nope nope.",
];

/** After a correct answer. He takes it personally. */
export const OFFENDED_LINES = [
  "Hmph.",
  "Lucky guess.",
  "Who told you?",
  "I'll allow it.",
  "Fine. FINE.",
  "Ugh. Correct.",
  "Did you cheat? You cheated.",
  "Beginner's luck.",
  "I hate that you're right.",
  "That one was a warm-up anyway.",
];

/** Poking Mr. Nope when he isn't the answer. */
export const POKE_LINES = [
  "Hey! No touching the host.",
  "I'm not the answer. Usually.",
  "Watch the paint!",
  "Poke me again and see what happens. (Nothing happens.)",
  "Ticklish. Stop.",
  "I'm a rubber stamp, not a button.",
];

/** Clicking other bits of the set when they aren't the answer. */
export const HOTSPOT_LINES = {
  hearts: ["Those are your hearts. Try not to lose them.", "Still beating. For now."],
  counter: ["That's the question number. It's not going anywhere.", "Counting down the questions? Me too."],
  logo: ["That's my name. In lights. As it should be.", "Nice logo, right? I designed it."],
  sky: ["Lovely sky today.", "I painted that sky myself."],
  fuse: ["Ow! Hot hot hot.", "Don't play with fire. Unless the question says so."],
  stage: ["That's the stage floor. Mind your step."],
  skip: ["Catch a fly and you'll get a skip.", "No skips in the slot. Look out for flies."],
} as const;

export const pickLine = (lines: readonly string[], n: number) => lines[((n % lines.length) + lines.length) % lines.length] ?? "";
