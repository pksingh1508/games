// The 12 hidden secrets (Plan/04-dont-trust-the-game.md §6, §7: "Collector"). None of them is needed to finish,
// and every one can be found on a phone (the real console's secret also works in the game's own).

export const SECRETS = [
  { id: "real-coins", chapter: 1, name: "The Real Coins", found: "Grabbed all three coins that spin." },
  { id: "poke", chapter: 0, name: "Poke", found: "Poked HELPER until it complained." },
  { id: "backwards", chapter: 2, name: ".sdrawkcaB", found: "Read the tip in Backwards English." },
  { id: "all-games", chapter: 2, name: "Game Collector", found: "Tried every game in More Games." },
  { id: "tab", chapter: 3, name: "Don't Leave Me", found: "Switched tabs during the loading screen." },
  { id: "outside", chapter: 3, name: "Outside the Frame", found: "Picked up the sticker outside the safe frame." },
  { id: "room-405", chapter: 4, name: "Room 405", found: "Found the room that isn't in the game." },
  { id: "delete-save", chapter: 4, name: "Just Kidding", found: "Ran deleteSave() from the error. (It didn't.)" },
  { id: "void-note", chapter: 4, name: "A Note in the Void", found: "Read the note behind the missing door." },
  { id: "helper-cfg", chapter: 5, name: "helper.cfg", found: "Read HELPER's settings." },
  { id: "moon-jump", chapter: 5, name: "Moon Jump", found: "Jumped with --height 999." },
  { id: "truth", chapter: 5, name: "helper.truth()", found: "Asked HELPER for the truth, in a console." },
] as const;

export type SecretId = (typeof SECRETS)[number]["id"];

export const SECRET_COUNT = SECRETS.length;
