// Chirp the sparrow (Plan/08-almost-there.md §3, §4): flies beside Pip and comments. Half the time
// Chirp means it; the other half it's trolling you. The tell: a sincere Chirp looks at Pip, a
// trolling Chirp looks at the camera (at you). Mirror Mountain has no Chirp.
import type { ZoneId } from "./mountain";
import type { Climb } from "./climb";

export type Mood = "sincere" | "troll";

export interface Line {
  text: string;
  mood: Mood;
}

export type Cue =
  | "start"
  | "resume"
  | `zone:${ZoneId}`
  | "fall"
  | "bigFall"
  | "hugeFall"
  | "nearMiss"
  | "niceJump"
  | "idle"
  | "bonk"
  | "lyingSign"
  | "warningSign"
  | "elevator"
  | "elevatorDown"
  | "joke"
  | "feather"
  | "fakeSummit"
  | "collapsed"
  | "summit";

const S = (text: string): Line => ({ text, mood: "sincere" });
const T = (text: string): Line => ({ text, mood: "troll" });

export const LINES: Record<Cue, readonly Line[]> = {
  start: [S("Up we go! I'll be right beside you.")],
  resume: [S("You're back! I kept your spot warm."), T("Oh good, you're back. Same ledge, same view.")],
  "zone:foothills": [S("Up we go!")],
  "zone:rooftops": [S("Rooftops! Mind the gutters."), T("Easy bit, this. Promise.")],
  "zone:clocktower": [S("The gears run on a timer. Watch one go round first.")],
  "zone:cliffs": [S("See the flags? They show which way the wind blows.")],
  "zone:ice": [S("Ice slides, snow saps your jump. Land in the middle!")],
  "zone:fake-summit": [T("Almost there! I can see the top!")],
  "zone:inside": [S("It's dark in here. Stay close.")],
  "zone:sky": [S("The clouds don't last. Hop quick!")],
  "zone:summit": [S("This is it. The real top. I'm almost sure.")],
  fall: [
    T("Almost there!"),
    S("Shake it off. You've got this."),
    T("That was on purpose, right?"),
    S("Same jump, steady hands."),
    T("Gravity says hi."),
    S("You were so close."),
    T("Downhill is also a direction."),
    S("Breathe. Look first, then leap."),
  ],
  bigFall: [
    S("Ouch. That was a long way."),
    T("Wheee! Oh. Oh no."),
    S("It's okay. You know the way back up now."),
    T("Look on the bright side: you get to see all this again."),
  ],
  hugeFall: [S("…I'll wait for you up there. Take your time."), T("So. Do you want to talk about it?")],
  nearMiss: [S("So close!"), T("Almost!"), S("That was close! A tiny bit more.")],
  niceJump: [S("Nice jump!"), T("Lucky."), S("Ooh, clean!"), T("I could've done that.")],
  idle: [T("Don't look down."), S("Take your time. I'm not going anywhere."), T("Planning, or napping?")],
  bonk: [S("Mind your head!"), T("Ceiling's solid. Good to know.")],
  lyingSign: [T("Signs never lie!"), T("See? Says so right there.")],
  warningSign: [S("That one's true. Careful here.")],
  elevator: [T("Express to the top! Fancy.")],
  elevatorDown: [S("…Huh. Sorry. I didn't know either.")],
  joke: [T("Saved! Probably.")],
  feather: [S("A Lost Feather! That's a new hat.")],
  fakeSummit: [T("We did it! We actually did it!")],
  collapsed: [S("…I didn't know. Honest. But look: a way in!")],
  summit: [S("We're… actually there.")],
};

/** These always get said (the story); the rest wait for Chirp to have been quiet a while. */
const ALWAYS: ReadonlySet<Cue> = new Set<Cue>(["start", "resume", "bigFall", "hugeFall", "elevatorDown", "fakeSummit", "collapsed", "summit", "feather"]);

/** Ticks Chirp stays quiet after saying something (unless the story needs it). */
export const QUIET_TICKS = 60 * 9;

/** How long a line stays up (ms). */
export const lineMs = (line: Line) => 1600 + line.text.length * 55;

/**
 * What Chirp says to this, if anything. Picks the next line in turn (so it doesn't repeat itself)
 * and remembers it in the climb. Mirror Mountain: nothing, ever.
 */
export function chirpFor(c: Climb, cue: Cue): Line | null {
  if (c.mirrored) return null;
  const lines = LINES[cue];
  if (!lines.length) return null;
  const always = ALWAYS.has(cue) || cue.startsWith("zone:");
  if (!always && c.sim.tick < c.chirp.quiet) return null;
  const line = lines[c.chirp.n % lines.length]!;
  c.chirp.n++;
  c.chirp.quiet = c.sim.tick + QUIET_TICKS;
  return line;
}
