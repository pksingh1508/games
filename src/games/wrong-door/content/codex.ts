// The codex (Plan/13-wrong-door.md §8.6): a notebook page for every kind of clue, floor, tool and
// misfortune you've met. Pages appear as you meet them; every lying rule in the hotel is written here
// (§10 rule 2: "there are no secret lies").
import type { Archetype, Consequence, Floor, ItemKind } from "../logic/types";

export type CodexId =
  | "signs"
  | "doorman"
  | "double"
  | "knock"
  | "light"
  | "candle"
  | "footprints"
  | "numbers"
  | "memory"
  | "anomaly"
  | "mirror"
  | "lucky"
  | "dark"
  | "banquet"
  | "shifting"
  | "final"
  | ItemKind
  | Consequence;

export interface CodexPage {
  id: CodexId;
  title: string;
  /** Which section it's in. */
  part: "clues" | "floors" | "tools" | "misfortunes";
  lines: string[];
}

export const CODEX: readonly CodexPage[] = [
  {
    id: "signs",
    part: "clues",
    title: "Signs and the plaque",
    lines: [
      "Every door may carry a sign, and signs can lie.",
      "The brass plaque never lies. It says how many signs tell the truth: read it first.",
      "Try each door in turn: if that one were the way up, which signs would be true? Only one door fits the plaque.",
      "A confident sign (“This is the way up.”) is no more honest than a shy one.",
    ],
  },
  {
    id: "doorman",
    part: "clues",
    title: "Mr. Hinges",
    lines: [
      "The doorman answers one yes-or-no question a floor.",
      "In his red hat (the one with the feather) he lies. In his black hat he tells the truth.",
      "“Is your hat red?” is a waste of a question: a liar says no, and so does an honest man.",
    ],
  },
  {
    id: "double",
    part: "clues",
    title: "The double question",
    lines: [
      "“If I asked you whether door 2 is the way up, would you say yes?”",
      "An honest man tells you the truth. A liar would lie about door 2, then lies about that lie: two lies make the truth.",
      "So it works even when you can't see his hat (in the dark, or when he's taken it off).",
    ],
  },
  {
    id: "knock",
    part: "clues",
    title: "Knocking",
    lines: [
      "Knock on a door and listen (two knocks a floor). Every sound comes with a caption.",
      "Wind: the way up and out. Always.",
      "Footsteps: someone's waiting, and they'll chase you down the stairs.",
      "Ticking: a trap. It'll shut you in the Wrong Room.",
      "Whispers: a curse on your next floor.",
      "Silence: could be anything, the way up included. Unless the plaque promises wind.",
    ],
  },
  { id: "light", part: "clues", title: "Light under the doors", lines: ["A line of light under a door means the path goes on. A dark door is a dead end.", "On honest floors, the way up is always lit (but it isn't the only lit door)."] },
  {
    id: "candle",
    part: "clues",
    title: "The candle",
    lines: ["Air flows towards the open stairs, so the flame leans towards the way up.", "It only tells you which side: left of the candle, or right of it."],
  },
  {
    id: "footprints",
    part: "clues",
    title: "Footprints",
    lines: ["Footprints run between you and a door. Follow the toes, not the trail.", "Toes pointing at the door: someone went through it. Toes pointing back at you: they came out of it. A dead end."],
  },
  { id: "numbers", part: "floors", title: "Room numbers", lines: ["Some floors put a run of numbers on the plaque. The door whose room number comes next is the way up.", "Only well-known runs, long enough that there's one right answer."] },
  {
    id: "memory",
    part: "floors",
    title: "Memory floors",
    lines: ["“The way up is the same kind of door you went through on floor 4.” Wood, iron, velvet, glass or round.", "Chalk remembers for you: once you carry it, every door you go through gets a mark in your notes."],
  },
  {
    id: "anomaly",
    part: "floors",
    title: "Anomalies",
    lines: [
      "Some floors are furnished just like the lobby. If anything at all is different, go back the way you came. If nothing is, go on up.",
      "The lobby has a ship sailing right, a clock at three, two lamps, a fern on the left, a red rug, diamond wallpaper and a sign saying 13.",
    ],
  },
  { id: "mirror", part: "floors", title: "Mirror floors", lines: ["Everything is flipped, even the writing. Left means right and right means left.", "Trust the door numbers, not where the doors seem to be."] },
  {
    id: "lucky",
    part: "floors",
    title: "The Lucky Floor 🎲",
    lines: [
      "Three doors, no clues. Pick one. Mr. Hinges always opens a wrong door you didn't pick, and always offers to let you switch.",
      "Switch. Your first pick was right one time in three, and it still is. The other two doors had two chances in three between them, and he's just shown you which of the two it isn't.",
      "It's the only floor that's luck, and losing only sends you down a floor. It never costs a key.",
    ],
  },
  { id: "dark", part: "floors", title: "Dark floors", lines: ["The lights are out: you can't read the signs or see the doorman's hat.", "The candle still leans, and your ears still work. A lantern makes it light again."] },
  {
    id: "banquet",
    part: "floors",
    title: "Liar's Banquet",
    lines: ["Tonight every kind of clue lies, except the one on the plaque.", "A lying sign is false; lying light is under the dead ends; a lying candle leans away; lying footprints point the wrong way. Turn them round."],
  },
  { id: "shifting", part: "floors", title: "Shifting doors", lines: ["When you go to open a door, the lights flicker and the doors move.", "Every door has its own scratch mark. Remember the way up's, then follow it."] },
  { id: "final", part: "floors", title: "The Final Floor", lines: ["“None of these doors is the way out.” It's true.", "Believe the plaque. Look for a way out that isn't one of the doors."] },
  { id: "stethoscope", part: "tools", title: "Stethoscope", lines: ["One more knock on every floor, for the rest of the run."] },
  { id: "lantern", part: "tools", title: "Lantern", lines: ["Dark floors aren't dark for you: you can read the signs and see the doorman's hat."] },
  { id: "truthCoin", part: "tools", title: "Truth Coin", lines: ["Flip it on one sign: heads, it's true; tails, it's lying. One use."] },
  { id: "crowbar", part: "tools", title: "Crowbar", lines: ["Peek through one door's crack: do the stairs go up? One use."] },
  { id: "chalk", part: "tools", title: "Chalk", lines: ["Mark doors (marks move with them when they shift).", "From now on, every door you go through is noted."] },
  { id: "luckyKey", part: "tools", title: "Lucky Key", lines: ["A spare key: one more mistake you can afford."] },
  { id: "downstairs", part: "misfortunes", title: "Down the Stairs", lines: ["Someone was waiting (you heard footsteps). Back down a floor, and it's a new puzzle there."] },
  { id: "wrongRoom", part: "misfortunes", title: "The Wrong Room", lines: ["A trap (it was ticking). The door slams behind you in the dark: find the draft before time runs out, or lose a key.", "Relaxed mode takes the timer away."] },
  { id: "cursed", part: "misfortunes", title: "Cursed", lines: ["Whispers. Your next floor is cursed: no knocking, a silent doorman, or scrambled sign letters (never one that would make it unfair)."] },
  { id: "loseKey", part: "misfortunes", title: "Lost Key", lines: ["Silence, and darkness, and a key slips from your pocket. Run out of keys and the run is over."] },
];

export const CODEX_BY_ID = new Map(CODEX.map((p) => [p.id, p]));

/** The pages a floor introduces when you step onto it. (The Lucky Floor's maths and the Final Floor's page
 * come after you've played them: reading them first would give the game away.) */
export function pagesFor(floor: Floor): CodexId[] {
  const out = new Set<CodexId>();
  if (floor.doors.some((d) => d.sign) || floor.rule) out.add("signs");
  if (floor.doorman && !floor.lucky) out.add("doorman");
  if (floor.doors.some((d) => d.light !== null)) out.add("light");
  if (floor.candle) out.add("candle");
  if (floor.footprints) out.add("footprints");
  const byKind: Partial<Record<Archetype, CodexId>> = {
    sequence: "numbers",
    memory: "memory",
    anomaly: "anomaly",
    mirror: "mirror",
    dark: "dark",
    liarsBanquet: "banquet",
    shifting: "shifting",
  };
  const kind = byKind[floor.archetype];
  if (kind) out.add(kind);
  if (floor.windRule) out.add("knock");
  return [...out];
}
