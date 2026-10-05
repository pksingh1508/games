// Every platformer scene of Super Happy Jump! (Plan/04-dont-trust-the-game.md §5), placed by coordinates (rows
// count from the top; a ledge two rows up is the highest step a jump clears). The scenes around them (the
// menus, HELPER, the console) live in ui/; the solver proves each level in levels.test.ts.
import { textWidth } from "@/engine/pixel-font";
import { TILE } from "../core/constants";
import { CELL, LevelBuilder, type Level } from "../core/level";

/** Chapter 1: the tutorial. Walk, jump, real coins (they spin), the coin that doesn't (a spike), real spikes in a
 * pit, paper spikes in a tunnel (they flutter: walk through), "the exit is to the right" (cardboard), and the real
 * exit back past where you started, off the left of the screen. */
function tutorial(): Level {
  // Everything past the real exit starts 8 columns in, so the exit is off the left of the screen when you start.
  const o = 8;
  const b = new LevelBuilder("tutorial", "tutorial", 64 + o, 17);
  b.fill(0, 0, 0, 16, CELL.solid).fill(63 + o, 0, 63 + o, 16, CELL.solid);
  b.fill(1, 15, 62 + o, 16, CELL.solid);
  b.door("exit", "exit", 2, 14);
  b.spawn(14 + o, 14).checkpoint(14 + o, 14);
  // Jump up a step; three real coins on top.
  b.fill(17 + o, 13, 26 + o, 14, CELL.solid);
  b.coin(20 + o, 12).coin(22 + o, 12).coin(24 + o, 12);
  // A pit of real spikes (they don't move).
  b.fill(29 + o, 15, 31 + o, 16, CELL.air).fill(29 + o, 16, 31 + o, 16, CELL.spike);
  b.checkpoint(33 + o, 14);
  // The coin that doesn't spin, out of reach unless you jump for it.
  b.fakeCoin(36 + o, 12);
  // The tunnel of paper spikes: the ceiling's too low to jump them.
  b.fill(39 + o, 0, 45 + o, 13, CELL.solid).fill(40 + o, 14, 44 + o, 14, CELL.paper);
  b.checkpoint(46 + o, 14);
  // "The exit is to the right!": it's cardboard.
  b.door("cardboard", "fake", 60 + o, 14);
  b.zone("walk", 13 + o, 10, 15 + o, 14).zone("jump", 15 + o, 10, 16 + o, 14).zone("coins", 19 + o, 9, 21 + o, 12).zone("real-spikes", 26 + o, 8, 28 + o, 14);
  b.zone("coin", 32 + o, 8, 34 + o, 14).zone("spikes", 37 + o, 10, 38 + o, 14).zone("exit-right", 47 + o, 8, 49 + o, 14);
  b.sign("SUPER HAPPY JUMP!", (7 + o) * TILE, 4 * TILE, 2, "#c2306f");
  b.sign("EXIT >", (52 + o) * TILE, 10 * TILE, 1, "#7e1f48");
  b.sign("NOPE", (60 + o) * TILE + 1, 12 * TILE + 4, 1, "#c2306f");
  // Solver: right through the paper spikes first, then back to the real exit.
  b.via(47 + o, 14);
  return b.build();
}

/** Chapter 2: behind the Options menu. The menu panel covers the left half; the level is on the right, hidden in
 * the dark until the brightness is up. Climb the ledges (jump has to be remapped from F13 first), cross the bridge
 * that only Hard mode has, and touch the More Games sign. */
function options(): Level {
  const b = new LevelBuilder("options", "options", 30, 17);
  b.fill(0, 15, 29, 16, CELL.solid).fill(29, 0, 29, 16, CELL.solid);
  b.spawn(26, 14);
  b.fill(19, 13, 21, 13, CELL.hidden);
  b.fill(16, 11, 17, 11, CELL.hidden);
  b.fill(19, 9, 21, 9, CELL.hidden);
  b.fill(16, 7, 17, 7, CELL.hidden);
  b.fill(19, 5, 20, 5, CELL.hidden);
  // Easy: "Easy? Nah." (a wall in the way); the gap only Hard mode bridges, and the sign on the far side.
  b.fill(22, 0, 24, 14, CELL.easy);
  b.fill(21, 5, 26, 5, CELL.hard);
  b.fill(27, 5, 28, 5, CELL.hidden);
  b.button("more-games", 27, 3, 28, 4);
  b.zone("gap", 18, 2, 21, 4).zone("climb", 18, 10, 22, 12);
  b.via(20, 12).via(17, 10).via(20, 8).via(17, 6).via(20, 4);
  return b.build();
}

/** Chapter 3: the loading screen, stuck at 99%. The bar is a platform with the last 1% missing at its end; the
 * spinner is a saw; the dots of "Loading..." are stepping stones (one is missing). The missing 1% is a block on a
 * ledge in the corner, outside the screen's safe frame: zoom out (the lever, or fullscreen) to see it, push it off
 * the ledge, and it drops into the gap. */
function loading(): Level {
  const b = new LevelBuilder("loading", "loading", 36, 21);
  b.frame(0, 2, 29, 18);
  b.fill(0, 18, 35, 20, CELL.plain).fill(35, 0, 35, 20, CELL.plain);
  b.fill(2, 16, 4, 16, CELL.ledge).fill(3, 14, 5, 14, CELL.ledge);
  b.fill(6, 12, 28, 12, CELL.bar).set(29, 13, CELL.bar);
  b.notch(29, 12);
  b.saw(
    [
      [9 * TILE + 8, 12 * TILE - 8],
      [27 * TILE + 8, 12 * TILE - 8],
    ],
    0.85,
  );
  b.set(23, 10, CELL.dot).set(26, 8, CELL.dot);
  b.fill(30, 8, 34, 8, CELL.bar);
  b.block(32, 7);
  b.lever("zoom", 27, 17);
  b.sticker("outside", 33, 17);
  b.spawn(2, 17);
  b.zone("bar", 6, 9, 9, 11).zone("saw", 10, 9, 12, 11).zone("dots", 20, 8, 23, 11).zone("corner", 24, 4, 28, 7).zone("lever", 24, 14, 26, 17);
  b.sign("NOW LOADING", 15 * TILE, 4 * TILE, 3, "#e9e7ff");
  b.sign("LOADING", 9 * TILE, 9 * TILE + 4, 2, "#a8a3d1");
  b.sign("SAFE", 26 * TILE + 4, 15 * TILE + 2, 1, "#a8a3d1");
  b.sign("FRAME", 26 * TILE + 2, 15 * TILE + 9, 1, "#a8a3d1");
  b.via(8, 11).via(24, 11).via(26, 7).via(33, 7);
  return b.build();
}

/** Chapter 4: "Error 404: Level not found". The giant digits are platforms (climb the 4's diagonal), and the 0 is a
 * portal: drop in through the gap in its top. Bonk the second 4 from below and it becomes a 5: room 405. */
function notFound(): Level {
  const b = new LevelBuilder("404", "error", 30, 17);
  b.fill(0, 15, 29, 16, CELL.plain);
  b.fill(1, 13, 2, 13, CELL.ledge);
  const four = (c: number) => {
    b.fill(c + 5, 6, c + 5, 13, CELL.digit);
    b.fill(c, 11, c + 6, 11, CELL.digit);
    for (let k = 0; k < 4; k++) b.set(c + 4 - k, 7 + k, CELL.digit);
  };
  four(3);
  four(18);
  // The 0: a ring with a gap in its top; the inside is a portal.
  b.fill(11, 6, 12, 6, CELL.digit).fill(14, 6, 15, 6, CELL.digit);
  b.fill(11, 7, 11, 13, CELL.digit).fill(15, 7, 15, 13, CELL.digit).fill(12, 13, 14, 13, CELL.digit);
  b.portal("zero", 12, 7, 14, 12);
  b.bonk("405", 20, 11);
  b.spawn(4, 14);
  b.zone("intro", 3, 10, 6, 14).zone("zero", 8, 3, 10, 6).zone("under-four", 19, 12, 22, 14);
  b.sign("ERROR 404: LEVEL NOT FOUND", 8 * TILE, 2 * TILE, 1, "#6a6a7a");
  b.sign("GO BACK", 1 * TILE + 1, 12 * TILE + 8, 1, "#6a6a7a");
  b.via(8, 5).via(13, 5);
  return b.build();
}

/** Room 405: not in the game (it is now). The door goes back to 404. */
function secretRoom(): Level {
  const b = new LevelBuilder("405", "secret", 30, 17);
  b.fill(0, 15, 29, 16, CELL.solid);
  b.door("back", "back", 2, 14);
  b.fill(20, 13, 25, 14, CELL.ledge);
  b.spawn(5, 14);
  b.sticker("405", 23, 12);
  b.zone("inside", 4, 8, 8, 14);
  b.sign("ROOM 405", 11 * TILE, 3 * TILE, 3, "#ffd23f");
  b.sign("THIS ROOM IS NOT IN THE GAME", 7 * TILE, 6 * TILE, 1, "#f2d8ff");
  b.sign("(IT IS NOW)", 12 * TILE + 4, 7 * TILE + 2, 1, "#f2d8ff");
  return b.build();
}

/** Chapter 4: the void. A wall all the way up (squeeze it: the crank, or make the window narrower), and past it a
 * door frame with no door: "door.png not found". Reload the page and it's there. */
function voidRoom(): Level {
  const b = new LevelBuilder("void", "void", 30, 17);
  b.fill(0, 15, 29, 16, CELL.solid);
  b.fill(14, 0, 15, 12, CELL.wall).fill(14, 13, 15, 14, CELL.wallLow);
  b.door("door", "frame", 24, 14);
  b.spawn(3, 14);
  b.sticker("note", 27, 14);
  b.zone("wall", 9, 8, 12, 14).zone("door", 20, 8, 22, 14);
  b.sign("DOOR.PNG NOT FOUND", 20 * TILE + 4, 10 * TILE, 1, "#ff6fa8");
  b.via(20, 14);
  return b.build();
}

/** Chapter 5: the white room. A locked door ("console access only"), and on the wall a poster that looks blank. */
function consoleRoom(): Level {
  const b = new LevelBuilder("console", "console", 30, 17);
  b.fill(0, 15, 29, 16, CELL.solid).fill(0, 0, 29, 0, CELL.solid);
  b.door("door", "locked", 26, 14);
  b.spawn(3, 14);
  b.zone("door", 22, 8, 24, 14).zone("poster", 7, 8, 13, 14);
  b.sign("CONSOLE ACCESS ONLY", 21 * TILE, 9 * TILE + 6, 1, "#8b8b9a");
  return b.build();
}

/** The credits, as a climb: every line is a ledge (they wobble when you stand on them). At the top: Quit, and Stay. */
export const CREDITS: readonly string[] = [
  "SUPER HAPPY JUMP!",
  "A GAME BY HELPER",
  "STARRING YOU",
  "AND HELPER",
  "HELPER - AS ITSELF",
  "TRUTH.EXE - AS ITSELF",
  "THE COIN - A SPIKE",
  "THE SPIKES - PAPER",
  "THE EXIT - TO THE LEFT",
  "RESUME - RESTART",
  "EASY - HARD",
  "THE OPTIONS - A LEVEL",
  "THE LOADING BAR - STRUCTURAL",
  "THE 1% - PUSHED",
  "THE CRASH - FAKE",
  "LEVEL 404 - FOUND",
  "ROOM 405 - SECRET",
  "THE WALL - SQUEEZED",
  "THE RELOAD - TRUE",
  "THE CONSOLE - NOT EMPTY",
  "THE MAGIC WORD - PLEASE",
  "NO COINS WERE HARMED",
  "EXCEPT ONE",
  "THANKS FOR TRUSTING",
  "AND FOR NOT TRUSTING",
  "ALMOST THERE",
  "IF YOU REACH THE TOP",
  "HELPER DISAPPEARS",
];

export const CREDITS_SCALE = 2;

function credits(): Level {
  const rows = 6 + CREDITS.length * 2 + 4;
  const b = new LevelBuilder("credits", "credits", 30, rows);
  const floor = rows - 2;
  b.fill(0, floor, 29, rows - 1, CELL.solid);
  b.spawn(14, floor - 1);
  CREDITS.forEach((text, i) => {
    const row = floor - 2 - i * 2;
    const cols = Math.ceil(textWidth(text, CREDITS_SCALE) / TILE) + 1;
    // Zig-zag gently around the middle; every line overlaps the next, so you can always jump up through it.
    const offset = [0, 4, 7, 4, 0, -3][i % 6]!;
    const col = Math.max(1, Math.min(29 - cols, 15 - Math.floor(cols / 2) + offset));
    b.name(text, col, row, cols).via(col + Math.floor(cols / 2), row - 1);
  });
  const top = floor - 2 - CREDITS.length * 2;
  b.fill(4, top, 25, top, CELL.ledge);
  b.button("quit", 6, top - 2, 9, top - 1).button("stay", 20, top - 2, 23, top - 1);
  b.zone("start", 10, floor - 6, 19, floor - 1).zone("halfway", 0, floor - CREDITS.length, 29, floor - CREDITS.length + 1).zone("top", 0, top - 3, 29, top - 1);
  return b.build();
}

export type LevelId = "tutorial" | "options" | "loading" | "404" | "405" | "void" | "console" | "credits";

const BUILDERS: Record<LevelId, () => Level> = {
  tutorial,
  options,
  loading,
  "404": notFound,
  "405": secretRoom,
  void: voidRoom,
  console: consoleRoom,
  credits,
};

const cache = new Map<LevelId, Level>();

export function getLevel(id: LevelId): Level {
  let level = cache.get(id);
  if (!level) {
    level = BUILDERS[id]();
    cache.set(id, level);
  }
  return level;
}

export const LEVEL_IDS = Object.keys(BUILDERS) as LevelId[];
