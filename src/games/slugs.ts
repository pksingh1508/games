// The 15 games, in the order of the Plan folder.
export const GAME_SLUGS = [
  "one-more-step",
  "nope",
  "99-seconds",
  "dont-trust-the-game",
  "fake-floor",
  "trapsprint",
  "glitch-run",
  "almost-there",
  "one-tap-chaos",
  "last-pixel",
  "panic-stack",
  "cursor-escape",
  "wrong-door",
  "dont-blink",
  "gravity-is-lying",
] as const;

export type GameSlug = (typeof GAME_SLUGS)[number];

export function isGameSlug(value: string): value is GameSlug {
  return (GAME_SLUGS as readonly string[]).includes(value);
}
