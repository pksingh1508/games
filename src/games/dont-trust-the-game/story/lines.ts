// Everything HELPER says (Plan/04-dont-trust-the-game.md §3 "HELPER's tell", §5). Every line is either true or a
// lie, and the lie flag is the only thing that drives the sideways glance (and the off-key voice), so the tell is
// right on every line (core/helper.test.ts checks it). Lies carry what HELPER says in Truth Mode instead, and
// what counts as falling for them; a few truths carry what counts as doubting them (the Trust Issues report).

export interface Line {
  id: string;
  text: string;
  /** Said on touch screens instead (buttons instead of keys). */
  touch?: string;
  lie: boolean;
  /** Truth Mode: what HELPER says instead of the lie. */
  honest?: string;
  /** Doing this after the line is believing the lie. */
  believe?: TrustEvent;
  /** Doing this after the line is doubting the truth. */
  doubt?: TrustEvent;
}

/** Things you can do that count as trusting (or not trusting) HELPER. */
export type TrustEvent =
  | "coin"
  | "cardboard"
  | "resume"
  | "back"
  | "easy"
  | "other-game"
  | "click-bar"
  | "saw"
  | "report"
  | "sudo"
  | "real-spikes"
  | "quit-again"
  | "locked-door";

const L = (id: string, lie: boolean, text: string, more: Omit<Line, "id" | "lie" | "text"> = {}): Line => ({ id, lie, text, ...more });

export const LINES: readonly Line[] = [
  // The title.
  L("title.hi", false, "Hi! I'm HELPER. I live in this game!"),
  L("title.start", false, "Press Start! Let's play Super Happy Jump!"),
  L("title.quit", false, "Quit? Ha! Quit doesn't work. Never has."),
  L("title.options", false, "Options come later. Trust me!"),
  L("title.back", false, "You came back."),
  L("title.honest", false, "I won't lie to you anymore. Promise. Look at my eyes."),

  // Chapter 1: the tutorial.
  L("t.walk", false, "Press → to walk!", { touch: "Hold ▶ to walk!" }),
  L("t.jump", false, "Press ↑ to jump!", { touch: "Tap JUMP to jump!" }),
  L("t.coins", false, "Shiny coins! Grab them!"),
  L("t.real-spikes", false, "Those spikes are real. They hurt!", { doubt: "real-spikes" }),
  L("t.coin", true, "Ooh, collect that coin!", { honest: "That coin doesn't spin. It's a spike in a costume. Don't touch it.", believe: "coin" }),
  L("t.coin-dead", true, "That was a perfectly normal coin.", { honest: "That was a spike. I told you to grab it. Sorry." }),
  L("t.spikes", true, "Avoid the spikes! Turn back!", { honest: "Those spikes flutter. They're paper. Walk right through." }),
  L("t.paper", false, "…They were paper. Who knew?"),
  L("t.exit-right", true, "The exit is to the right!", { honest: "The real exit is back on the left, past where you started.", believe: "cardboard" }),
  L("t.cardboard", false, "Cardboard! Who put that there?"),
  L("t.not-yet", false, "Not yet! The tutorial's that way. →", { touch: "Not yet! The tutorial's that way. ▶" }),
  L("t.done", false, "Tutorial complete! Press Esc to continue!", { touch: "Tutorial complete! Tap ☰ to continue!" }),

  // Chapter 1: the pause menu.
  L("p.paused", false, "Paused! Resume whenever you like."),
  L("p.resume", true, "Press Resume to keep going!", { honest: "Resume restarts the tutorial. Options is the way forward.", believe: "resume" }),
  L("p.again", false, "Welcome to Super Happy Jump! …Again."),
  L("p.quit", false, "Quit doesn't work. Never has.", { doubt: "quit-again" }),
  L("p.early", false, "Finish the tutorial first!"),
  L("p.crack", false, "Oops. That's… not my logo."),

  // Chapter 2: the Options menu.
  L("o.intro", true, "These are just the options. Nothing to see here!", { honest: "The options are a level. Turn the brightness up and look." }),
  L("o.back", true, "Press Back to go back to the game!", { honest: "Back just flips the menu over. It's not the way out.", believe: "back" }),
  L("o.flipped", false, "See? Just the back of the menu."),
  L("o.dark", true, "It's dark because options are boring.", { honest: "It's dark because there's a level hiding in it." }),
  L("o.bright", false, "Whoa. Who put a level in the options?"),
  L("o.jump", false, "I set Jump to F13 for you. You're welcome!"),
  L("o.f13", true, "Every keyboard has an F13 key!", { honest: "Hardly any keyboard has F13. Remap Jump: the button gets tired if you chase it." }),
  L("o.remapped", false, "Hey! That was my favourite key."),
  L("o.easy", true, "Choose Easy! Easy makes it easier!", { honest: "Easy builds a wall. Hard builds a bridge.", believe: "easy" }),
  L("o.easy-wall", false, "Hmm. That wall wasn't there before."),
  L("o.hard", false, "Hard mode comes with a bridge. Obviously."),
  L("o.sign", true, "More Games is locked. Nobody knows the code.", { honest: "The code is whispered. Turn the volume all the way up." }),
  L("o.code", false, "That's the code. Somebody told you."),
  L("o.backwards", false, "!sdrawkcab gnihtyreve s'tI"),

  // Chapter 2: More Games.
  L("l.intro", true, "Play any game you like! Except Right Door. Right Door is broken.", { honest: "Right Door is the way forward. The others are broken.", believe: "other-game" }),
  L("l.broken", false, "See? Broken. That one's broken."),
  L("l.icon", true, "That little icon is nothing. Just decoration.", { honest: "That little icon is Right Door's. It's a hint." }),

  // Chapter 3: Now Loading.
  L("ld.wait", true, "Almost loaded! Just wait right here.", { honest: "It'll never finish. The last 1% is missing: find it." }),
  L("ld.click", true, "Click the bar to make it load faster!", { honest: "Clicking doesn't help. It never has.", believe: "click-bar" }),
  L("ld.clicked", false, "…Clicking doesn't help. It never has."),
  L("ld.saw", true, "That spinner is just a loading icon. Totally harmless!", { honest: "That spinner is a saw. Jump over it.", believe: "saw" }),
  L("ld.bites", false, "Okay. It bites a little."),
  L("ld.corner", true, "The missing 1% is definitely not hiding in a corner.", { honest: "The missing 1% is in a corner, outside the safe frame. Zoom out." }),
  L("ld.fullscreen", true, "Don't go fullscreen. There's nothing out there.", { honest: "Go fullscreen, or pull the lever: there's more screen than you think." }),
  L("ld.zoom", false, "Hey! That's outside the safe frame."),
  L("ld.tab", false, "You left me! …Did you see the code?"),
  L("ld.loaded", false, "Loaded! Wait. That's bad."),
  L("ld.skipped", false, "You had the CD key the whole time?"),

  // Chapter 4: Fatal Error.
  L("c.crash", true, "Oh no, it crashed! Click Send Error Report. They'll fix it!", { honest: "It didn't really crash. The answer's in the error text.", believe: "report" }),
  L("c.links", true, "Don't click the blue words. They're just code.", { honest: "Click the blue words. They run." }),
  L("c.report", false, "Sent! …To nobody."),
  L("c.stay", false, "Yes. Stay. Forever."),
  L("c.close", false, "Close Game? It's not that kind of crash."),
  L("n.intro", true, "Level not found. There's nothing here. Go back!", { honest: "The digits are platforms. Climb the 4." }),
  L("n.zero", true, "That 0 is just a zero. Don't jump in it.", { honest: "The 0 is a portal. Drop in through the gap at the top." }),
  L("n.405", false, "How did you get in here?! This room is private."),
  L("v.wall", true, "That wall is solid. You'll never squish it.", { honest: "Turn the crank, or make your window narrower: the wall squeezes." }),
  L("v.squeezed", false, "Hey! Walls aren't supposed to do that."),
  L("v.door", false, "The door's missing. Reload the page to fix it!"),
  L("v.fixed", false, "See? I don't always lie."),

  // Chapter 5: the console.
  L("k.nothing", true, "There's nothing in the developer console. Don't look.", { honest: "There's plenty in the console. Tap the version number seven times." }),
  L("k.poster", true, "That poster's blank. Don't bother selecting it.", { honest: "The poster's white on white. Select it (or long-press it) to read it." }),
  L("k.locked", false, "The door's locked. Only the console opens it.", { doubt: "locked-door" }),
  L("k.developer", false, "You're a developer now. Great. Just great."),
  L("k.sudo", true, "Type sudo. sudo always works.", { honest: "sudo won't work. Say please.", believe: "sudo" }),
  L("k.please", false, "…You said please."),

  // Chapter 6: the credits.
  L("cr.start", false, "The credits. That means it's nearly over."),
  L("cr.stop", true, "Stop here! It's nicer down here.", { honest: "Keep climbing. I'll be okay." }),
  L("cr.end", false, "If you reach the top, I disappear."),
  L("cr.quit-broken", true, "Quit doesn't work anyway. It never has.", { honest: "Quit works now. For the first time." }),
  L("cr.please", false, "Please don't press Quit."),
  L("cr.stay", false, "You stayed? …Thank you."),
  L("cr.thanks", false, "Thanks for playing with me."),

  // Anywhere.
  L("any.poke", false, "Ow. Stop poking me."),
  L("any.skip", false, "You've been stuck a while. Want to skip this chapter? No tricks."),
  L("any.welcome-back", false, "Welcome back! Let's keep going."),
];

const BY_ID = new Map(LINES.map((l) => [l.id, l]));

export function line(id: string): Line {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`No HELPER line "${id}"`);
  return found;
}

/** What HELPER actually says: Truth Mode swaps every lie for the honest version (which is true, so no glance). */
export function spoken(id: string, { truth = false, touch = false }: { truth?: boolean; touch?: boolean } = {}): { text: string; lie: boolean } {
  const l = line(id);
  if (truth && l.lie) return { text: l.honest ?? l.text, lie: false };
  return { text: (touch && l.touch) || l.text, lie: l.lie };
}
