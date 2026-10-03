// A small camera for the platformers: follow a target inside a dead zone, stay inside the level,
// and shake (unless motion is reduced). TrapSprint's levels fit one screen, so it only shakes.

export interface Camera {
  x: number;
  y: number;
  shake: number;
  /** Seed for the shake pattern (no randomness: a shake looks the same every time). */
  shakeTick: number;
}

export const createCamera = (): Camera => ({ x: 0, y: 0, shake: 0, shakeTick: 0 });

export function followCamera(
  cam: Camera,
  target: { x: number; y: number },
  view: { w: number; h: number },
  world: { w: number; h: number },
  { deadX = 40, deadY = 30, lerp = 0.2 }: { deadX?: number; deadY?: number; lerp?: number } = {},
) {
  const cx = cam.x + view.w / 2;
  const cy = cam.y + view.h / 2;
  let tx = cam.x;
  let ty = cam.y;
  if (target.x < cx - deadX) tx = target.x + deadX - view.w / 2;
  if (target.x > cx + deadX) tx = target.x - deadX - view.w / 2;
  if (target.y < cy - deadY) ty = target.y + deadY - view.h / 2;
  if (target.y > cy + deadY) ty = target.y - deadY - view.h / 2;
  cam.x += (tx - cam.x) * lerp;
  cam.y += (ty - cam.y) * lerp;
  cam.x = Math.max(0, Math.min(world.w - view.w, cam.x));
  cam.y = Math.max(0, Math.min(world.h - view.h, cam.y));
}

export function shakeCamera(cam: Camera, amount: number) {
  cam.shake = Math.max(cam.shake, amount);
}

/** This frame's shake offset; it fades by itself. Returns 0,0 when motion is reduced. */
export function shakeOffset(cam: Camera, reducedMotion: boolean): { x: number; y: number } {
  if (cam.shake <= 0.05 || reducedMotion) {
    cam.shake = 0;
    return { x: 0, y: 0 };
  }
  cam.shakeTick++;
  const k = cam.shakeTick;
  const offset = { x: Math.round(Math.sin(k * 2.7) * cam.shake), y: Math.round(Math.cos(k * 3.3) * cam.shake) };
  cam.shake *= 0.82;
  return offset;
}
