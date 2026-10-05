// TRUTH.exe (Plan/04-dont-trust-the-game.md §3): a corrupted assistant that always tells the truth, in riddles.
// Stuck on the same step for 3 minutes, a riddle; for 6, the answer straight; for 10, HELPER offers an honest
// skip. Each scene reports which step you're on; the hints are about that step.

export interface Hint {
  riddle: string;
  direct: string;
}

export const HINTS: Readonly<Record<string, Hint>> = {
  "tutorial:spikes": { riddle: "PAPER DOESN'T CUT.", direct: "THE SPIKES THAT FLUTTER ARE PAPER. WALK THROUGH THEM." },
  "tutorial:exit": { riddle: "THE WAY OUT IS BEHIND YOU.", direct: "WALK LEFT, PAST WHERE YOU STARTED, ALL THE WAY TO THE DOOR." },
  "tutorial:pause": { riddle: "RESUMING ISN'T CONTINUING.", direct: "OPEN THE PAUSE MENU (ESC OR ☰) AND PICK OPTIONS." },
  "options:bright": { riddle: "LET THERE BE LIGHT.", direct: "TURN BRIGHTNESS ALL THE WAY UP." },
  "options:jump": { riddle: "F13 IS NOT A KEY YOU HAVE.", direct: "REMAP JUMP. THE BUTTON GETS TIRED IF YOU CHASE IT (OR TAB TO IT AND PRESS ENTER)." },
  "options:bridge": { riddle: "EASY IS A WALL.", direct: "SET DIFFICULTY TO HARD. IT BUILDS A BRIDGE." },
  "options:sign": { riddle: "MORE GAMES IS UP THERE.", direct: "CLIMB TO THE TOP RIGHT AND TOUCH THE MORE GAMES SIGN." },
  "options:code": { riddle: "TURN IT UP. LISTEN CLOSELY.", direct: "SET VOLUME TO 100. THE CODE IS WHISPERED: 7 2 9." },
  launcher: { riddle: "THE RIGHT DOOR IS RIGHT.", direct: "OPEN RIGHT DOOR." },
  "loading:see": { riddle: "SOME OF THE SCREEN IS OFF THE SCREEN.", direct: "PULL THE SAFE FRAME LEVER BY THE FLOOR, OR GO FULLSCREEN." },
  "loading:push": { riddle: "THE MISSING 1% WANTS A PUSH.", direct: "GET TO THE RIGHT OF THE 1% BLOCK IN THE CORNER AND PUSH IT LEFT, INTO THE GAP." },
  crash: { riddle: "THE BLUE WORDS DO THINGS.", direct: "CLICK openSecretDoor IN THE ERROR." },
  "404": { riddle: "ZERO IS A DOOR.", direct: "CLIMB THE FIRST 4'S STAIRS, JUMP TO THE 0, DROP IN THROUGH THE GAP ON TOP." },
  "void:wall": { riddle: "WINDOWS CAN SQUEEZE WALLS.", direct: "TURN THE CRANK FOUR TIMES. OR MAKE YOUR WINDOW NARROWER." },
  "void:reload": { riddle: "IT LOOKED RIGHT AT YOU.", direct: "RELOAD THE PAGE. REALLY." },
  "console:find": { riddle: "BLANK ISN'T EMPTY.", direct: "SELECT THE TEXT ON THE BLANK POSTER. OR TAP THE VERSION NUMBER SEVEN TIMES." },
  "console:open": { riddle: "MANNERS OPEN DOORS.", direct: "TYPE: please open door" },
  credits: { riddle: "UP.", direct: "CLIMB THE NAMES TO THE TOP." },
};

/** Minutes stuck on a step before each kind of help. */
export const HELP_AFTER = { riddle: 3, direct: 6, skip: 10 } as const;
/** "Hints sooner" (the real settings). */
export const HELP_SOONER = { riddle: 1, direct: 2, skip: 5 } as const;

export type HelpLevel = "none" | "riddle" | "direct" | "skip";

export function helpFor(stuckMs: number, sooner: boolean): HelpLevel {
  const at = sooner ? HELP_SOONER : HELP_AFTER;
  const minutes = stuckMs / 60_000;
  if (minutes >= at.skip) return "skip";
  if (minutes >= at.direct) return "direct";
  if (minutes >= at.riddle) return "riddle";
  return "none";
}
