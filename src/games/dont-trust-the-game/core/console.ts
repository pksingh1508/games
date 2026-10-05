// The developer console (Plan/04-dont-trust-the-game.md §5 Chapter 5): help, ls, cat, jump --height 999 (works,
// briefly), sudo open door ("Nice try."), please open door (opens). The same boot messages go to the browser's
// real console, for desktop players who look there.

export const VERSION = "v1.0.3";

/** Printed when the console opens (and, styled, to the browser's own console). */
export const BOOT = [
  `SUPER HAPPY JUMP! ${VERSION}: developer console`,
  "psst. HELPER looks away when it lies.",
  "The door doesn't care about sudo. It cares about manners.",
  "Type helper.truth() for a secret.",
] as const;

export const FILES: Readonly<Record<string, readonly string[]>> = {
  "secrets.txt": [
    "1. HELPER looks away when it lies. It always has.",
    "2. The door opens for polite people.",
    "3. There are 12 secrets. This file isn't one of them.",
  ],
  "helper.cfg": ["lie_rate = 0.5", "tell = glance_sideways", "voice_when_lying = off_key", "afraid_of_the_ending = true"],
  "truth.exe": ["▒▓░▒ 01110100 ▓▒░", "I ALWAYS TELL THE TRUTH. IN RIDDLES. SORRY."],
  "door.exe": ["door.exe: a door.", "Opens for: people who ask nicely.", "Does not open for: sudo."],
};

export type ConsoleEffect = "clear" | "close" | "moon" | "open" | "truth" | "cfg" | "sudo";

export interface ConsoleReply {
  lines: string[];
  effect?: ConsoleEffect;
}

export const HELP = ["help", "ls", "cat <file>", "jump --height <n>", "open door", "whoami", "clear", "exit"] as const;

/** Run one command. */
export function runCommand(raw: string): ConsoleReply {
  const input = raw.trim().replace(/\s+/g, " ");
  const lower = input.toLowerCase();
  if (!input) return { lines: [] };
  if (lower === "help") return { lines: ["Commands:", ...HELP.map((h) => `  ${h}`)] };
  if (lower === "ls" || lower === "dir") return { lines: [Object.keys(FILES).join("  ")] };
  if (lower.startsWith("cat")) {
    const name = lower.slice(3).trim();
    if (!name) return { lines: ["cat: which file? Try ls."] };
    const file = FILES[name];
    if (!file) return { lines: [`cat: ${name}: no such file`] };
    return { lines: [...file], effect: name === "helper.cfg" ? "cfg" : undefined };
  }
  const jump = /^jump(?: --height (-?\d+))?$/.exec(lower);
  if (jump) {
    const h = Number(jump[1] ?? 1);
    if (h >= 100) return { lines: [`Jump height set to ${h}. For a few seconds.`], effect: "moon" };
    if (h <= 0) return { lines: ["That's not a jump. That's standing still."] };
    return { lines: [`Jump height ${h}: that's just a normal jump.`] };
  }
  if (lower === "open door" || lower === "open the door") return { lines: ["Permission denied."] };
  if (lower.startsWith("sudo")) return { lines: ["Nice try."], effect: "sudo" };
  if (lower === "please open door" || lower === "please open the door" || lower === "open door please" || lower === "open the door please") {
    return { lines: ["Opening door… ", "The door is open. Thank you for asking nicely."], effect: "open" };
  }
  if (lower.startsWith("please")) return { lines: ["Since you asked nicely: no. (Try please open door.)"] };
  if (lower === "helper.truth()" || lower === "helper.truth" || lower === "truth") {
    return { lines: ["The truth: I lie because when you finish, the game ends. And so do I."], effect: "truth" };
  }
  if (lower === "whoami") return { lines: ["player (definitely not HELPER)"] };
  if (lower.startsWith("echo")) return { lines: [input.slice(4).trim()] };
  if (lower === "clear" || lower === "cls") return { lines: [], effect: "clear" };
  if (lower === "exit" || lower === "close") return { lines: [], effect: "close" };
  if (lower === "quit") return { lines: ["quit doesn't work. Never has. (Try exit.)"] };
  return { lines: [`command not found: ${input.split(" ")[0]}. Try help.`] };
}
