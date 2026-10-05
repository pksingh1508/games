// Small vector helpers (metres).
export interface Vec {
  x: number;
  y: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The angle wrapped to (−π, π]. */
export const wrapAngle = (a: number) => {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  if (r <= -Math.PI) r += Math.PI * 2;
  return r;
};
