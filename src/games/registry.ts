// Everything the website shows about each game. Content comes from the design docs in /Plan.
// When a game is built, flip its `status` to "playable".
import { GAME_PALETTES, type Palette } from "./palettes";
import { GAME_SLUGS, type GameSlug } from "./slugs";

export type GameCategory = "puzzle" | "platformer" | "arcade";
export type InputKind = "keyboard" | "mouse" | "touch" | "one-button" | "gamepad";
export type GameStatus = "workshop" | "playable";

export interface GameInfo {
  slug: GameSlug;
  number: number;
  title: string;
  tagline: string;
  genre: string;
  category: GameCategory;
  /** One line: what lies to you. */
  mindTrick: string;
  pitch: string[];
  hooks: Array<{ title: string; text: string }>;
  goal: string;
  controls: Array<{ action: string; desktop: string; mobile: string }>;
  tricks: Array<{ name: string; expect: string; actually: string; tell: string }>;
  features: string[];
  comfort: string[];
  inspirations: string[];
  session: string;
  inputs: InputKind[];
  status: GameStatus;
  palette: Palette;
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  puzzle: "Puzzles",
  platformer: "Platformers",
  arcade: "Arcade",
};

export const INPUT_LABELS: Record<InputKind, string> = {
  keyboard: "Keyboard",
  mouse: "Mouse",
  touch: "Touch",
  "one-button": "One button",
  gamepad: "Gamepad",
};

type GameData = Omit<GameInfo, "slug" | "number" | "palette">;

const DATA: Record<GameSlug, GameData> = {
  "one-more-step": {
    title: "One More Step",
    tagline: "The exit is one step away. It always is.",
    genre: "Turn-based grid puzzle",
    category: "puzzle",
    mindTrick: "The exit door has feet and runs away. Nothing moves unless you move.",
    pitch: [
      "You're a tiny blob with feet, standing on a grid. The exit is right there. A friendly voice says “Just one more step!” You take the step… and the door takes one too. Away from you.",
      "Nothing moves unless you move. Spikes rise, floors crumble, shadows copy you, and the exit scurries off whenever you get close. Nobody explains the rules. You discover them one step at a time.",
    ],
    hooks: [
      { title: "The goal-gradient trap", text: "People rush when the goal is close. The last step is exactly where the traps live." },
      { title: "Rules you discover", text: "No tutorials and no text. Every level is a tiny experiment: step, watch, form a theory, test it." },
      { title: "Habits turned against you", text: "Once a rule feels automatic, a later world quietly bends it." },
    ],
    goal: "Step onto the exit door's tile. The door doesn't want you to.",
    controls: [
      { action: "Step", desktop: "Arrow keys / WASD", mobile: "Swipe" },
      { action: "Wait one tick", desktop: "Space", mobile: "Wait button" },
      { action: "Undo", desktop: "Z", mobile: "Undo button" },
      { action: "Restart", desktop: "R", mobile: "Restart button" },
    ],
    tricks: [
      {
        name: "The Runaway Door",
        expect: "The exit stays put.",
        actually: "It scurries away when you're right next to it.",
        tell: "It has little feet that twitch when you're two tiles away.",
      },
      {
        name: "The Painted Door",
        expect: "A door is a door.",
        actually: "It's painted on the wall. The real exit is under a crumbling tile.",
        tell: "Painted doors have no shadow and no feet.",
      },
      {
        name: "The Lying Narrator",
        expect: "“One more step!” is encouragement.",
        actually: "In the last world, it lies about how close you are.",
        tell: "When it lies, the speech bubble's tail points away from you.",
      },
    ],
    features: [
      "40 levels in 5 worlds, plus a finale",
      "Unlimited, instant undo",
      "Par steps and 3-star ratings",
      "Footsteps that play a melody",
      "A narrator who starts lying",
      "Every level checked by a solver",
    ],
    comfort: ["Turn-based: no time pressure", "Colourblind-safe hazards", "Reduce motion", "Keyboard or touch only"],
    inspirations: ["Circle the Cat", "Hoplite", "SUPERHOT", "Baba Is You"],
    session: "1–4 min per level",
    inputs: ["keyboard", "touch"],
    status: "workshop",
  },

  nope: {
    title: "NOPE!",
    tagline: "Wrong. Also wrong. NOPE.",
    genre: "Troll quiz",
    category: "puzzle",
    mindTrick: "The obvious answer is wrong. The screen itself can be the answer.",
    pitch: [
      "A loud quiz show hosted by Mr. Nope, a big red rubber stamp with eyebrows. The questions look easy: “Click the biggest button.” “What's 2 + 2?” “Don't press anything.” This quiz plays dirty.",
      "Get it wrong and a giant NOPE! slams onto the screen, and the stamp mark stays as a souvenir. Lose all three hearts and the episode starts again. The quiz remembers everything.",
    ],
    hooks: [
      { title: "Fast brain vs. slow brain", text: "Every question triggers a quick, intuitive answer that's wrong. You win by slowing down." },
      { title: "Everything is clickable", text: "Text can be clicked, buttons can be dragged, and doing nothing is sometimes the answer." },
      { title: "Your failures become content", text: "“How many NOPE stamps are on your screen?” Count them." },
    ],
    goal: "Answer all 15 questions in an episode before your hearts run out.",
    controls: [
      { action: "Answer", desktop: "Click", mobile: "Tap" },
      { action: "Drag things", desktop: "Click + drag (or click, then click where it goes)", mobile: "Touch + drag (or tap, then tap)" },
      { action: "Hold on something", desktop: "Rest the cursor on it, or hold Space", mobile: "Press and hold" },
      { action: "Type answers", desktop: "Keyboard", mobile: "On-screen keyboard" },
      { action: "Pause", desktop: "Esc", mobile: "Pause button" },
    ],
    tricks: [
      {
        name: "Button in Disguise",
        expect: "The answers are the four buttons.",
        actually: "The question banner itself is the biggest button.",
        tell: "The banner has a button-style shadow and reacts when you hover over it.",
      },
      {
        name: "Just a Normal Question",
        expect: "Every question is a trick.",
        actually: "Sometimes 2 + 2 really is 4.",
        tell: "Mr. Nope winks when his “hint” is a lie.",
      },
      {
        name: "The Kind Fuse",
        expect: "A ticking timer means hurry.",
        actually: "Sometimes the answer is to let it run out.",
        tell: "The fuse is green instead of red.",
      },
    ],
    features: [
      "60 original questions in 4 episodes",
      "Mr. Nope, a host with a winking tell",
      "The stamp wall: your failures, on display",
      "Bomb questions and hidden skip flies",
      "A shareable emoji results card",
      "A mobile version of every question",
    ],
    comfort: ["No flashing", "Shape-based colourblind variants", "Laugh track can be turned off", "Large text option"],
    inspirations: ["The Impossible Quiz", "Brain Test", "TV game shows"],
    session: "10–20 min per episode",
    inputs: ["mouse", "touch"],
    status: "playable",
  },

  "99-seconds": {
    title: "99 Seconds",
    tagline: "You have 99 seconds. You've had them before.",
    genre: "Time-loop escape room",
    category: "puzzle",
    mindTrick: "Every 99 seconds the room resets. Only your knowledge survives.",
    pitch: [
      "You wake up in a locked room. The clock on the wall reads 99, and it's counting down. At zero there's a flash, and you're back in the chair. The doors are locked again. Everything is back where it was.",
      "But you remember. The code, the drawer, the noise at second 42. Collect knowledge across many loops, then pull off the perfect run, while notes in your own handwriting start appearing on the walls.",
    ],
    hooks: [
      { title: "Knowledge is all you keep", text: "Your progress lives in your head and your journal, not in your pockets." },
      { title: "The stopped-clock illusion", text: "The first second after you glance at a clock feels longer. Here, it actually is." },
      { title: "Idioms come to life", text: "A watched pot never boils. In the kitchen chapter, it really doesn't." },
    ],
    goal: "Escape each room before the loop resets, then break the loop for good.",
    controls: [
      { action: "Turn to another wall", desktop: "← / →", mobile: "Swipe" },
      { action: "Inspect or use", desktop: "Click", mobile: "Tap" },
      { action: "Open the journal", desktop: "J", mobile: "Journal button" },
      { action: "Highlight hotspots", desktop: "H", mobile: "Hint button" },
    ],
    tricks: [
      {
        name: "The Watched Clock",
        expect: "A second is a second.",
        actually: "The first second after you look at a clock lasts longer.",
        tell: "The tick sound stretches out.",
      },
      {
        name: "The Fake Escape",
        expect: "An open door means freedom.",
        actually: "Through the door is the same room, mirrored.",
        tell: "The door's hinges are on the wrong side.",
      },
      {
        name: "Notes From Yourself",
        expect: "Someone was trapped here before.",
        actually: "It was you. You'll write those notes yourself in the last chapter.",
        tell: "The handwriting matches your journal.",
      },
    ],
    features: [
      "3 chapters and 2 endings",
      "An auto-filling journal of clues",
      "A soundtrack exactly one loop long",
      "Hints disguised as story",
      "Relaxed and Hardcore modes",
      "A single-loop speedrun challenge",
    ],
    comfort: ["Relaxed mode: 150-second loops", "Hotspot highlighting", "Subtitles for every sound clue", "Reduce flashing"],
    inspirations: ["Outer Wilds", "Twelve Minutes", "Majora's Mask", "Escape-the-room games"],
    session: "45–90 min story",
    inputs: ["mouse", "touch"],
    status: "workshop",
  },

  "dont-trust-the-game": {
    title: "Don't Trust The Game",
    tagline: "The tutorial lies. The menu lies. The game lies.",
    genre: "Meta puzzle-adventure",
    category: "puzzle",
    mindTrick: "The tutorial, the menus, the loading screen and even the browser tab lie to you.",
    pitch: [
      "It starts as a cheerful platformer called “Super Happy Jump!”, with a friendly guide named HELPER. HELPER tells you what to do. Some of it is true. A lot of it isn't.",
      "The coin kills you. The spikes are paper. The Options menu is a level, the loading bar is a platform, and the crash screen hides the answer. HELPER has a reason to lie: when you finish, the game ends.",
    ],
    hooks: [
      { title: "Trained to obey", text: "We trust instructions like “Press ESC to continue”. This game uses that trust." },
      { title: "Clues in the blind spots", text: "Answers hide in tips, version numbers, error text and the browser tab." },
      { title: "It remembers you", text: "Close the game, come back, and it knows." },
    ],
    goal: "Reach the end while working out which instructions to trust.",
    controls: [
      { action: "Move", desktop: "← → / A D", mobile: "On-screen buttons" },
      { action: "Jump", desktop: "Space / ↑", mobile: "Jump button" },
      { action: "Menus, sliders, text", desktop: "Mouse", mobile: "Tap / drag" },
      { action: "Pause (also a puzzle)", desktop: "Esc", mobile: "Menu button" },
    ],
    tricks: [
      {
        name: "The Deadly Coin",
        expect: "Coins are good.",
        actually: "It's a spike in disguise.",
        tell: "It doesn't spin like real coins, and HELPER glances sideways.",
      },
      {
        name: "Easy Is Hard",
        expect: "Picking Easy makes it easier.",
        actually: "A giant wall appears. Picking Hard opens the path.",
        tell: "You learn this one the fun way.",
      },
      {
        name: "Reload the Page",
        expect: "Surely that's a trick.",
        actually: "It's true. Reloading reveals the exit.",
        tell: "HELPER looks straight at you, so it's the truth.",
      },
    ],
    features: [
      "6 chapters with two endings",
      "HELPER, a guide with a consistent tell",
      "A settings menu that's secretly a level",
      "Browser tricks with in-game alternatives",
      "A truthful, glitchy hint bot",
      "Truth Mode after the ending",
    ],
    comfort: ["Captions for audio clues", "Reduce flashing", "No jump scares", "Optional invincibility"],
    inspirations: ["There Is No Game", "Pony Island", "The Stanley Parable", "Frog Fractions"],
    session: "45–75 min story",
    inputs: ["keyboard", "mouse", "touch"],
    status: "workshop",
  },

  "fake-floor": {
    title: "Fake Floor",
    tagline: "Look before you leap. Then look again.",
    genre: "Perception platformer",
    category: "platformer",
    mindTrick: "Some floors are fake, and the clues you learn will eventually lie too.",
    pitch: [
      "A platformer where the danger isn't enemies. It's the ground. Floors can be solid, fake, crumbling, invisible, or simply painted onto the background.",
      "Throw pebbles to test the way ahead: tok means solid, silence means trouble. Learn each world's tell, like grout that doesn't line up or tiles that stay dry in the rain. Then World 4 arrives, and the floors start faking their tells.",
    ],
    hooks: [
      { title: "Expert eyes", text: "You slowly get better at spotting tiny differences, and you can feel it happening." },
      { title: "Trust, then betrayal", text: "When a tell gets faked, you have to find a deeper one." },
      { title: "Test or gamble?", text: "Throw a pebble to be sure, or save it and trust your eyes." },
    ],
    goal: "Cross each room without falling through the floor.",
    controls: [
      { action: "Move", desktop: "← → / A D", mobile: "Arrow buttons" },
      { action: "Jump", desktop: "Space / ↑", mobile: "Jump button" },
      { action: "Throw a pebble", desktop: "Click a floor, or F (hold to aim further)", mobile: "Tap the floor to test" },
      { action: "Look ahead", desktop: "Hold Shift", mobile: "Hold the eye button" },
      { action: "Restart the room", desktop: "R", mobile: "Restart button" },
    ],
    tricks: [
      {
        name: "Welcome Mat",
        expect: "The first tile is safe.",
        actually: "It's fake. You fall in the first second (onto a safety net).",
        tell: "Its grout lines don't line up with its neighbours.",
      },
      {
        name: "The Dry Tile",
        expect: "Every floor looks wet in the rain.",
        actually: "The dry one is fake.",
        tell: "Rain never splashes on it.",
      },
      {
        name: "The Painted Floor",
        expect: "Lined-up floors are real.",
        actually: "It's part of the background painting.",
        tell: "It slides slightly when the camera moves.",
      },
    ],
    features: [
      "50 short rooms in 5 worlds, then The Floor itself",
      "Pebbles that never lie",
      "Rain, lantern-light and parallax tells",
      "A betrayal world where the tells are faked",
      "Clean, Barefoot and Quick medals",
      "Time trials and hidden pebbles",
    ],
    comfort: ["High-contrast tells option", "Slow motion, unlimited pebbles or safety nets (assist)", "Tells never rely on colour", "Remappable keys"],
    inspirations: ["Squid Game's glass bridge", "Level Devil", "Hollow Knight", "Spot the difference"],
    session: "15–40 s per room",
    inputs: ["keyboard", "gamepad", "touch"],
    status: "playable",
  },

  trapsprint: {
    title: "TrapSprint",
    tagline: "Run fast. Die faster. Remember everything.",
    genre: "Troll platformer + speedrun",
    category: "platformer",
    mindTrick: "Hidden traps fire exactly when you feel safe. Memorise them, then sprint.",
    pitch: [
      "Single-screen levels. Start on the left, door on the right. Looks easy. It isn't. Spikes pop up, the floor drops away, the ceiling falls and the door runs off.",
      "You'll die a lot, but you respawn instantly and every death teaches you something. Then the real game begins: sprint through the level you've memorised, chase medal times and race your own ghost.",
    ],
    hooks: [
      { title: "Surprise is funny", text: "A sudden trap that costs you nothing is the core of physical comedy." },
      { title: "From victim to master", text: "The level that killed you 30 times becomes a 6-second speedrun." },
      { title: "Learned paranoia", text: "Soon you fear everything, including the harmless painted spikes." },
    ],
    goal: "Reach the door. Then reach it faster.",
    controls: [
      { action: "Move", desktop: "← → / A D / stick or D-pad", mobile: "Left / right pad (bottom left)" },
      { action: "Jump (hold for higher)", desktop: "Space / ↑ / W / gamepad A", mobile: "Jump button (bottom right)" },
      { action: "Quick restart", desktop: "R / gamepad Y", mobile: "Restart button (top right)" },
      { action: "Pause", desktop: "Esc / P / Start", mobile: "Pause button (top right)" },
    ],
    tricks: [
      {
        name: "Pop Spikes",
        expect: "Flat ground is safe.",
        actually: "Spikes shoot up as you pass.",
        tell: "Tiny holes in the floor tile.",
      },
      {
        name: "The Runaway Door",
        expect: "The door is the finish line.",
        actually: "It rolls away when you get close.",
        tell: "The door has tiny wheels.",
      },
      {
        name: "Victory Lap",
        expect: "Touching the door means you won.",
        actually: "The “Level Complete!” banner falls on your head.",
        tell: "You can see the banner's rope.",
      },
    ],
    features: [
      "30 levels in 3 zones, plus 30 Remix levels",
      "20 trap types, each with a tell",
      "Instant respawn in under 0.3 seconds",
      "Medal times, and the ghost of your best run",
      "The All-Deaths Replay",
      "Zone speedruns with splits",
    ],
    comfort: ["Assist mode: slow motion, trap reveal, invincibility", "No screen shake with reduced motion", "Traps read by shape, not colour", "Remappable keys and big touch buttons"],
    inspirations: ["Level Devil", "Syobon Action", "Super Meat Boy", "Celeste"],
    session: "30 s – 3 min per level",
    inputs: ["keyboard", "gamepad", "touch"],
    status: "playable",
  },

  "glitch-run": {
    title: "Glitch Run",
    tagline: "The game is broken. Use it.",
    genre: "Glitch auto-runner",
    category: "platformer",
    mindTrick: "The screen and controls “break” on purpose, and you are the bug.",
    pitch: [
      "You're a corrupted sprite running through the memory of a game that wants you gone. Frames skip, the screen tears, textures go missing and your controls swap.",
      "All the chaos follows rules. Learn them to survive, then glitch on purpose: phase through walls and run at high corruption for huge scores, while The Debugger hunts you down to “fix” you.",
    ],
    hooks: [
      { title: "Your eyes lie", text: "Screen tears shift the ground you see away from the real ground." },
      { title: "Trust your ears", text: "When vision fails, the audio cues and your shadow tell the truth." },
      { title: "Risk vs. reward", text: "Using glitch power breaks the world further, and multiplies your score." },
    ],
    goal: "Run as far as you can, and escape The Debugger.",
    controls: [
      { action: "Jump", desktop: "Space / ↑", mobile: "Tap right side" },
      { action: "Slide", desktop: "↓ / S", mobile: "Tap left side" },
      { action: "Glitch (phase through)", desktop: "Shift", mobile: "Glitch button" },
      { action: "Pause", desktop: "Esc", mobile: "Pause button" },
    ],
    tricks: [
      {
        name: "Where's the Floor?",
        expect: "The ground is where you see it.",
        actually: "A screen tear has shifted it.",
        tell: "Your shadow always shows the real ground.",
      },
      {
        name: "Hands Betray You",
        expect: "Jump is always jump.",
        actually: "Input Swap reversed your controls.",
        tell: "The control icons flip and your runner turns colour-inverted.",
      },
      {
        name: "The Freeze",
        expect: "A frozen game is a paused game.",
        actually: "It's still running behind the “Not Responding” screen.",
        tell: "The music never stops.",
      },
    ],
    features: [
      "20 story stages and endless mode",
      "11 glitch events, each with a warning",
      "Corruption that multiplies your score",
      "The Debugger, a boss that patches you",
      "A daily run everyone shares",
      "A visual beat bar for every audio cue",
    ],
    comfort: ["Photosensitivity warning", "Reduce flashing (WCAG safe)", "Gentle glitches mode", "Reduce screen shake"],
    inspirations: ["Canabalt", "Bit.Trip Runner", "Geometry Dash"],
    session: "1–5 min runs",
    inputs: ["keyboard", "touch"],
    status: "workshop",
  },

  "almost-there": {
    title: "Almost There",
    tagline: "You're so close. You're always so close.",
    genre: "Vertical rage climber",
    category: "platformer",
    mindTrick: "Fake summits, a lying progress bar and very long falls.",
    pitch: [
      "Pip is a tiny climber with a huge backpack and a flag for the top of the mountain. Hold to charge a jump, release to leap. Once you're in the air, there's no steering.",
      "A sparrow named Chirp keeps saying “Almost there!” The progress bar says 97%. You reach the summit, the credits roll… and halfway through, the ground under your flag crumbles.",
    ],
    hooks: [
      { title: "The goal feels close", text: "People try harder near the end, so the game makes the end always feel near." },
      { title: "So-close jumps", text: "Almost making a jump is more motivating than missing it badly." },
      { title: "Every metre can be lost", text: "Falls are never deaths, just long, painful trips down." },
    ],
    goal: "Reach the real summit and plant your flag.",
    controls: [
      { action: "Walk", desktop: "← → / A D", mobile: "Arrow buttons" },
      { action: "Charge a jump", desktop: "Hold Space", mobile: "Hold the jump button" },
      { action: "Choose direction", desktop: "Hold ← / → as you release", mobile: "Hold an arrow as you release" },
      { action: "Pause", desktop: "Esc", mobile: "Pause button" },
    ],
    tricks: [
      {
        name: "The Lying Progress Bar",
        expect: "The bar is accurate.",
        actually: "It says 99.9% for the whole second half.",
        tell: "The altitude on the pause screen is always honest.",
      },
      {
        name: "The Fake Summit",
        expect: "Flag, fanfare, credits: you won.",
        actually: "The camera pans up, the mountain keeps going, and your ledge crumbles.",
        tell: "The credits say “Thanks for playing… so far”.",
      },
      {
        name: "Chirp's Encouragement",
        expect: "Chirp is cheering you on.",
        actually: "Half the time it's trolling you.",
        tell: "It looks at the camera when it's trolling.",
      },
    ],
    features: [
      "One continuous climb, 45 screens, nine zones",
      "Charge jumps with no air control",
      "Continuous save: no undoing a fall",
      "Fake credits, real summit",
      "Lost Feathers and hats for Pip",
      "Mirror Mountain New Game+",
    ],
    comfort: ["Assist mode: checkpoints and trajectory preview", "Slow motion", "Reduce motion", "Remappable keys"],
    inspirations: ["Jump King", "Getting Over It", "Only Up!", "Celeste"],
    session: "1–4 h first climb",
    inputs: ["keyboard", "gamepad", "touch"],
    status: "playable",
  },

  "one-tap-chaos": {
    title: "One Tap Chaos",
    tagline: "One button. Infinite ways to mess it up.",
    genre: "One-button microgames",
    category: "arcade",
    mindTrick: "There's only one tap, but what it means, and whether to tap at all, keeps changing.",
    pitch: [
      "Tiny games flash by in 3 to 5 seconds each: “JUMP!” “CATCH!” “DON'T!” “WAIT…” You only ever have one input, a tap, and the beat keeps getting faster.",
      "Every few rounds a Chaos Card flips over and adds a rule: Opposite Day, Red Means No, Simon Says, Lag. Your brain knows what to do. Your thumb does something else.",
    ],
    hooks: [
      { title: "Go / No-Go", text: "Stopping yourself from tapping is surprisingly hard after tapping all along." },
      { title: "The Stroop effect", text: "A red “TAP” when red means don't makes your brain argue with itself." },
      { title: "Rhythm as a trap", text: "The beat pulls you into a flow, so the sudden “DON'T!” is even harder to resist." },
    ],
    goal: "Clear as many microgames in a row as you can before you run out of lives.",
    controls: [
      { action: "Tap (the only input)", desktop: "Space / Enter / click / gamepad A", mobile: "Tap anywhere" },
      { action: "Pause", desktop: "Esc or P", mobile: "Pause button (top right)" },
    ],
    tricks: [
      {
        name: "The Rhythm Trap",
        expect: "The beat says tap.",
        actually: "“DON'T!” lands right on the beat you were about to tap.",
        tell: "The instruction is always on screen. Read before you tap.",
      },
      {
        name: "Missing Crown",
        expect: "Every instruction counts.",
        actually: "Under Simon Says, instructions without a crown are traps.",
        tell: "The empty crown slot is shown.",
      },
      {
        name: "The Loading Bar",
        expect: "“Tap to skip” means tap.",
        actually: "It's a microgame, and the answer is not to tap.",
        tell: "Its text uses the microgame font, not the menu font.",
      },
    ],
    features: [
      "24 microgames and 3 bosses",
      "8 Chaos Cards that stack",
      "Music-synced speed tiers",
      "Input calibration for fair timing",
      "A daily run with a share card",
      "Practice room for every microgame",
    ],
    comfort: ["Works with a single switch", "Reduced speed mode", "Visual beat for every sound", "No colour-only rules"],
    inspirations: ["WarioWare", "Rhythm Heaven", "Simon Says"],
    session: "1–5 min runs",
    inputs: ["one-button", "keyboard", "touch"],
    status: "playable",
  },

  "last-pixel": {
    title: "Last Pixel",
    tagline: "99.99% complete. The last pixel disagrees.",
    genre: "Clean-up + hunt",
    category: "arcade",
    mindTrick: "You're 99.99% done, but the last pixel is alive and will hide anywhere.",
    pitch: [
      "Paint the wall. Mow the lawn. Wipe the window. It's calm and deeply satisfying: 80%… 95%… 99.99%. One pixel is left. You move to paint it… and it moves.",
      "Meet Pix. It runs from your cursor, blends into the background, hides under the HUD, pretends to be a dead pixel on your monitor, and even escapes into the page around the game.",
    ],
    hooks: [
      { title: "The itch of 99.99%", text: "An almost-finished task is unbearable, and the game knows it." },
      { title: "Calm, then chaos", text: "Relaxing clean-up suddenly turns into a frantic chase." },
      { title: "Is it my screen?", text: "Players genuinely check their monitors. Then the pixel blinks." },
    ],
    goal: "Get every level to a true 100%, including Pix.",
    controls: [
      { action: "Use the tool", desktop: "Click + drag", mobile: "Touch + drag" },
      { action: "Catch Pix", desktop: "Click it", mobile: "Tap it" },
      { action: "Net (trap in a box)", desktop: "Shift + drag", mobile: "Net tool + drag" },
      { action: "Magnifier", desktop: "Mouse wheel / M", mobile: "Pinch" },
    ],
    tricks: [
      {
        name: "Not My Monitor?",
        expect: "That's a dead pixel on my screen.",
        actually: "It's Pix, pretending.",
        tell: "It disappears when you pause the game.",
      },
      {
        name: "Hide and HUD",
        expect: "The HUD is just interface.",
        actually: "Pix is hiding underneath it.",
        tell: "The panel wobbles, and you can drag it aside.",
      },
      {
        name: "The Logo",
        expect: "The logo is decoration.",
        actually: "The dot on the “i” has been missing all along. Pix took it.",
        tell: "Look at the title screen.",
      },
    ],
    features: [
      "41 levels and 8 satisfying tools",
      "Pix, with 10 escape tricks",
      "Net, magnifier, bait and freeze",
      "A pixel detector that beeps closer",
      "No fail state in the hunt",
      "A finale that completes the logo",
    ],
    comfort: ["Hunt assist: slower Pix, bigger catch area", "Brightness-based camouflage", "Visual and audio detector", "One-handed play"],
    inspirations: ["Satisfying cleaning games", "Progressbar95", "Desktop Goose", "Where's Waldo?"],
    session: "1–3 min per level",
    inputs: ["mouse", "touch"],
    status: "workshop",
  },

  "panic-stack": {
    title: "Panic Stack",
    tagline: "Stack it high. Don't trust anything you stack.",
    genre: "Physics stacking",
    category: "arcade",
    mindTrick: "Objects lie about their weight and shape. Panic hits when your tower looks safe.",
    pitch: [
      "Items roll in on a conveyor. Drag them onto the platform and build a tower to the goal line, then keep it standing for three seconds.",
      "Except the items lie. The iron safe is full of helium and floats away. The feather weighs as much as an anvil. And just when your tower looks perfect: earthquake. Or a cat. Or a siren… and nothing happens.",
    ],
    hooks: [
      { title: "The size–weight illusion", text: "We judge weight by looks. Here, looks actively lie." },
      { title: "Judging by category", text: "“Safes are heavy” is a shortcut the game breaks on purpose." },
      { title: "Fake panic", text: "Some alarms are fake. The damage comes from your rushed reaction." },
    ],
    goal: "Reach the goal line and hold the tower steady for 3 seconds.",
    controls: [
      { action: "Pick up and move", desktop: "Click + drag", mobile: "Touch + drag" },
      { action: "Rotate", desktop: "Q / E or wheel", mobile: "Two-finger twist or buttons" },
      { action: "Tap-test an item", desktop: "Click it once", mobile: "Tap it once" },
      { action: "Oops (undo once)", desktop: "Space", mobile: "Undo button" },
    ],
    tricks: [
      {
        name: "The Floating Safe",
        expect: "Heavy things go at the bottom.",
        actually: "It floats away unless something holds it down.",
        tell: "It zips ahead of your cursor and goes “tink” when tapped.",
      },
      {
        name: "The Lead Feather",
        expect: "Light things go on top.",
        actually: "It crushes everything below.",
        tell: "It lags far behind your cursor and goes “THUD”.",
      },
      {
        name: "Fake Panic",
        expect: "An alarm means danger.",
        actually: "Nothing happens. Your rushed placement is the danger.",
        tell: "The siren light is a cardboard cut-out.",
      },
    ],
    features: [
      "36 levels in 6 locations",
      "12 items, most of them liars",
      "12 panic events, all telegraphed",
      "A panic meter that speeds the music",
      "Endless Tower and a daily stack",
      "Zen mode with no pressure",
    ],
    comfort: ["Zen mode", "Rotation buttons", "Hold-to-drop option", "Reduce screen shake"],
    inspirations: ["Tricky Towers", "Jenga", "Stack", "Overcooked"],
    session: "1–3 min per level",
    inputs: ["mouse", "touch"],
    status: "workshop",
  },

  "cursor-escape": {
    title: "Cursor Escape",
    tagline: "You are the cursor. The computer wants you deleted.",
    genre: "Cursor maze & dodge",
    category: "arcade",
    mindTrick: "You are the cursor. The OS inverts you, lags you, hides you and fakes you.",
    pitch: [
      "You're the mouse pointer inside DeskOS 98, a cranky old operating system that wants to uninstall you. Guide the cursor through each window to its close button without touching the walls.",
      "Then the OS fights back. It inverts your movement, adds lag, hides your cursor behind a fake one and spawns decoy cursors. Over text you become an I-beam, and every cursor shape has its own rules.",
    ],
    hooks: [
      { title: "Mirror hands", text: "Your brain adapts to inverted controls in seconds, then gets confused when they switch back." },
      { title: "Which one is me?", text: "Four cursors, one hand. Psychologists study exactly this question." },
      { title: "The hand you trust most", text: "You never think about your mouse pointer. Now you will." },
    ],
    goal: "Reach each window's close button and click it.",
    controls: [
      { action: "Move the cursor", desktop: "Mouse (captured)", mobile: "Trackpad mode: drag anywhere" },
      { action: "Click", desktop: "Left click", mobile: "Tap" },
      { action: "Pause / release the mouse", desktop: "Esc", mobile: "Pause button" },
      { action: "Restart", desktop: "R", mobile: "Restart button" },
    ],
    tricks: [
      {
        name: "Mirror Hand",
        expect: "Move right, go right.",
        actually: "You go left.",
        tell: "The arrow is drawn mirrored, and a notification warns you first.",
      },
      {
        name: "Who Am I?",
        expect: "You're the only cursor.",
        actually: "Four cursors move at once. Only one is you.",
        tell: "Yours moves exactly with your hand, and its tip glows.",
      },
      {
        name: "Trail of Doom",
        expect: "Pointer trails are just pretty.",
        actually: "Your own trail becomes a wall.",
        tell: "The trail is drawn solid, not fading.",
      },
    ],
    features: [
      "40 levels across 4 drives",
      "Cursor shapes with their own rules",
      "10 kinds of OS sabotage",
      "A boss called The Uninstaller",
      "Touch trackpad mode for phones",
      "An ending that sets you free",
    ],
    comfort: ["Steady mode: gentler sabotage", "Sensitivity calibration", "Large hitbox assist", "Every sabotage announced"],
    inspirations: ["Cursor*10", "The World's Hardest Game", "Windowkill", "Desktop Goose"],
    session: "30 s – 2 min per level",
    inputs: ["mouse", "touch"],
    status: "workshop",
  },

  "wrong-door": {
    title: "Wrong Door",
    tagline: "Three doors. Two liars. One way out. Probably.",
    genre: "Deduction roguelite",
    category: "puzzle",
    mindTrick: "Doors, signs and a doorman that lie by rules you have to crack.",
    pitch: [
      "You check into The Ambiguous Hotel. Your room is on floor 13, and there are no elevators. Only doors.",
      "Every floor has a few doors and a handful of clues. Some signs lie. The doorman, Mr. Hinges, answers one question but lies when he wears his red hat. Knock and listen, watch the candle flame, then choose.",
    ],
    hooks: [
      { title: "Knights and knaves", text: "Classic logic puzzles about truth-tellers and liars, made spooky and playable." },
      { title: "The Monty Hall floor", text: "Switching wins two times out of three. Your gut will refuse to believe it." },
      { title: "Prove yourself wrong", text: "Once you like a door, every clue looks like proof. The game rewards doubt." },
    ],
    goal: "Climb from the lobby to floor 13 without running out of keys.",
    controls: [
      { action: "Choose a door", desktop: "Click or 1–5", mobile: "Tap" },
      { action: "Knock and listen", desktop: "Hold click / K", mobile: "Long-press a door" },
      { action: "Ask the doorman", desktop: "Click him / Q", mobile: "Tap him" },
      { action: "Open the codex", desktop: "C", mobile: "Book button" },
    ],
    tricks: [
      {
        name: "The Confident Sign",
        expect: "A confident sign is a true sign.",
        actually: "Only one sign tells the truth, and it isn't that one.",
        tell: "Always read the brass plaque first.",
      },
      {
        name: "The Red Hat",
        expect: "The doorman is helpful.",
        actually: "Today, he's lying.",
        tell: "A red hat with a feather.",
      },
      {
        name: "Backwards Footprints",
        expect: "Footprints lead the way.",
        actually: "Whoever made them walked backwards.",
        tell: "Look at which way the heels point.",
      },
    ],
    features: [
      "13 floors per run",
      "Every logic floor has exactly one answer",
      "A doorman who lies by a rule",
      "Knocks, candles, footprints and light",
      "A Truth Reveal after every wrong door",
      "A daily run everyone shares",
    ],
    comfort: ["Captions for every sound clue", "No colour-only clues", "No time pressure", "No jump scares"],
    inspirations: ["The Lady or the Tiger?", "The Monty Hall problem", "The Exit 8", "Return of the Obra Dinn"],
    session: "10–20 min runs",
    inputs: ["mouse", "touch"],
    status: "workshop",
  },

  "dont-blink": {
    title: "Don't Blink",
    tagline: "Something changes every time you blink. You will blink.",
    genre: "Observation thriller",
    category: "arcade",
    mindTrick: "Every time you blink, something changes. Spot it before the changes pile up.",
    pitch: [
      "You're the new night guard at The Marlow Museum of Curious Things. Watch the cameras and report anything unusual until 6 AM. The previous guard? He blinked.",
      "Every few seconds your eyes close for a split second, and something changes. A portrait turns its head. A vase disappears. The statue is closer than it was. Let five changes pile up and they come for you.",
    ],
    hooks: [
      { title: "Change blindness", text: "People miss big changes that happen during a blink. This game is that experiment." },
      { title: "Tunnel vision", text: "While you watch one camera, you miss what happens on another." },
      { title: "Your own eyelids", text: "Hold your eyes open to stop blinking, until they give up on you." },
    ],
    goal: "Survive until 6 AM without letting five changes pile up.",
    controls: [
      { action: "Switch camera", desktop: "1–5 or click", mobile: "Tap a thumbnail" },
      { action: "Report a change", desktop: "R, then click the object", mobile: "Report, then tap the object" },
      { action: "Keep eyes open", desktop: "Hold Space", mobile: "Hold the eye button" },
      { action: "Check the reference photo", desktop: "F", mobile: "Camera button" },
    ],
    tricks: [
      {
        name: "The Blink",
        expect: "You'd notice if something changed.",
        actually: "You often won't. That's change blindness.",
        tell: "Memorise the room before each blink.",
      },
      {
        name: "Mirror World",
        expect: "The camera shows the room.",
        actually: "The whole image has been flipped.",
        tell: "The text on the signs is backwards.",
      },
      {
        name: "The Slow Change",
        expect: "Changes only happen during blinks.",
        actually: "Some happen slowly, with no blink at all.",
        tell: "Stare long enough and you'll catch it moving.",
      },
    ],
    features: [
      "5 nights, Endless and Custom Night",
      "9 kinds of change to spot",
      "The Visitor, a statue that moves when you don't look",
      "Camera static that hides changes",
      "Reference photos to check your memory",
      "Optional webcam blink detection (on your device only)",
    ],
    comfort: ["No jump scares by default", "Reduce flashing: soft blinks", "Captions for sound cues", "Assist mode"],
    inspirations: ["I'm on Observation Duty", "Five Nights at Freddy's", "Doctor Who's Weeping Angels"],
    session: "6–8 min nights",
    inputs: ["mouse", "touch", "keyboard"],
    status: "workshop",
  },

  "gravity-is-lying": {
    title: "Gravity Is Lying",
    tagline: "Down is a matter of opinion.",
    genre: "Gravity puzzle-platformer",
    category: "platformer",
    mindTrick: "The arrow, the camera and the narrator all lie about which way is down.",
    pitch: [
      "Newt is a small explorer with a very long scarf. Newt's guide is Isaac, a talking apple who claims to be the world's leading expert on gravity, because he once fell on a very famous head.",
      "Gravity flips and twists from room to room. The arrow on screen lies, the camera tilts the world, and Isaac lies whenever he feels like it. The truth is in the world itself: how the scarf hangs, how water drips, how the dust drifts.",
    ],
    hooks: [
      { title: "Seeing over feeling", text: "A tilted room makes people misjudge which way is up. This game tilts it on purpose." },
      { title: "Gravity hills", text: "Some rooms recreate the real illusion where water seems to roll uphill." },
      { title: "Read the world", text: "You learn to trust drips and dust instead of the interface." },
    ],
    goal: "Reach each room's portal, and collect the golden apples on the way.",
    controls: [
      { action: "Walk along the floor", desktop: "← → / A D", mobile: "Arrow buttons" },
      { action: "Jump", desktop: "Space / ↑", mobile: "Jump button" },
      { action: "Flip gravity", desktop: "F / ↓", mobile: "Flip button" },
      { action: "Restart room", desktop: "R", mobile: "Restart button" },
    ],
    tricks: [
      {
        name: "The Lying Arrow",
        expect: "The arrow shows which way is down.",
        actually: "In liar rooms it points the wrong way.",
        tell: "The scarf, the drips and the dust all disagree with it.",
      },
      {
        name: "The Tilted Room",
        expect: "The room looks upright, so down is down.",
        actually: "The camera is rotated, so you fall sideways.",
        tell: "Hanging lamps sit at an angle.",
      },
      {
        name: "Isaac's Countdown",
        expect: "“Gravity flips in 3… 2… 1…”",
        actually: "Nothing happens. You jumped for nothing.",
        tell: "His leaf droops when he lies.",
      },
    ],
    features: [
      "44 rooms in 6 worlds",
      "Four-way gravity, flips and planetoids",
      "Truth anchors: scarf, drips and dust",
      "A narrator apple with a droopy tell",
      "Golden apples in every room",
      "Truth Mode after the finale",
    ],
    comfort: ["Reduce motion: no camera rotation", "Motion sickness warning", "Screen- or character-relative controls", "Assist arrow"],
    inspirations: ["VVVVVV", "Super Mario Galaxy", "And Yet It Moves", "Fez"],
    session: "1–4 min per room",
    inputs: ["keyboard", "gamepad", "touch"],
    status: "playable",
  },
};

export const GAMES: GameInfo[] = GAME_SLUGS.map((slug, i) => ({
  slug,
  number: i + 1,
  palette: GAME_PALETTES[slug],
  ...DATA[slug],
}));

export function getGame(slug: GameSlug): GameInfo {
  return GAMES.find((g) => g.slug === slug)!;
}

/** The next and previous games, wrapping around the arcade. */
export function getNeighbours(slug: GameSlug): { prev: GameInfo; next: GameInfo } {
  const index = GAMES.findIndex((g) => g.slug === slug);
  return {
    prev: GAMES[(index - 1 + GAMES.length) % GAMES.length]!,
    next: GAMES[(index + 1) % GAMES.length]!,
  };
}

/** A few games to suggest next: same category first, then the rest. */
export function getRelated(slug: GameSlug, count = 3): GameInfo[] {
  const game = getGame(slug);
  const others = GAMES.filter((g) => g.slug !== slug);
  const same = others.filter((g) => g.category === game.category);
  const rest = others.filter((g) => g.category !== game.category);
  return [...same, ...rest].slice(0, count);
}

export const playableCount = () => GAMES.filter((g) => g.status === "playable").length;
