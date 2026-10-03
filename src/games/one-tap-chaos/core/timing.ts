// Tempo and timing windows (Plan/09-one-tap-chaos.md §3, §10).

/** Beats per minute for speed tiers 1–5. */
export const TIERS = [100, 115, 130, 145, 160] as const;
/** Reduced speed mode caps the tempo here (Plan §11). */
export const REDUCED_SPEED_BPM = 120;

export const GAME_BEATS = 8;
export const BOSS_BEATS = 16;
export const BREAK_BEATS = 4;
export const CARD_BEATS = 4;
export const BOSS_INTRO_BEATS = 4;
export const COUNT_IN_BEATS = 4;
export const RESUME_COUNT_IN_BEATS = 3;

/** Lag: every tap lands half a beat late. */
export const LAG_BEATS = 0.5;
/** Double Tap: two taps within this many seconds make one action. */
export const DOUBLE_TAP_SECONDS = 0.25;

export const secondsPerBeat = (bpm: number) => 60 / bpm;

/** Half the timing window in milliseconds: ±120 ms at the start, never tighter than ±60 ms. */
export const windowMs = (difficulty: number) => 120 - 60 * Math.min(1, Math.max(0, difficulty));

/** The same window, in beats at a tempo. */
export const windowBeats = (difficulty: number, bpm: number) => (windowMs(difficulty) / 1000) * (bpm / 60);
