// The visual beat bar (Plan/07-glitch-run.md §9, §11): every audio cue, drawn. It runs along the
// bottom of the screen at the track's own scale (a beat is always 96 px of track), with "now" under
// the runner: each move you'll need (▲ jump, ˄ hop, ▼ slide, ⚡ clip) sits right under the spot on the
// track where you make it. It runs on the simulation's own clock, so it keeps going when the screen
// freezes or lags: the way to run Not Responding without sound.
import { BEAT_PX, RUNNER_W, RUNNER_X, VIEW_W } from "../core/constants";
import { beatStart, ticksAt, type Run } from "../core/run";
import type { Cue } from "../core/reference";

/** "Now" sits under the runner's middle; the bar's width is the screen's (in beats). */
const NOW = (RUNNER_X + RUNNER_W / 2) / VIEW_W;
const BEATS = VIEW_W / BEAT_PX;

const COLOURS: Record<Cue["move"], string> = { jump: "#00F5D4", hop: "#7FFFE8", slide: "#FF2E88", clip: "#FFC857" };

export class BeatBar {
  private g: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
  }

  draw(cues: readonly Cue[], run: Run, alpha: number, flicker: boolean) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const g = this.g;
    g.clearRect(0, 0, w, h);
    g.fillStyle = flicker ? "rgba(255,46,136,0.28)" : "rgba(7,7,13,0.72)";
    g.beginPath();
    g.roundRect(0, 0, w, h, h / 2);
    g.fill();
    const ticks = ticksAt(run.config, run.beat);
    const now = run.tick + alpha;
    const nowX = w * NOW;
    const beatW = w / BEATS;
    const xOf = (tick: number) => nowX + ((tick - now) / ticks) * beatW;
    // Beats (the bar of each beat; brighter on the downbeat).
    for (let b = Math.max(0, run.beat - 2); b <= run.beat + Math.ceil(BEATS) + 1; b++) {
      const x = xOf(beatStart(run.config, b));
      if (x < 0 || x > w) continue;
      g.fillStyle = b % 4 === 0 ? "rgba(230,241,255,0.4)" : "rgba(230,241,255,0.16)";
      g.fillRect(x - dpr / 2, h * 0.2, dpr, h * 0.6);
    }
    // The cues.
    const size = h * 0.34;
    for (const cue of cues) {
      const x = xOf(cue.tick);
      if (x < -size || x > w + size) continue;
      g.globalAlpha = x < nowX ? Math.max(0, 1 - (nowX - x) / (beatW * 0.6)) : 1;
      g.fillStyle = COLOURS[cue.move];
      g.strokeStyle = COLOURS[cue.move];
      g.lineWidth = Math.max(1.5, dpr * 1.5);
      const y = h / 2;
      g.beginPath();
      switch (cue.move) {
        case "jump":
          g.moveTo(x, y - size);
          g.lineTo(x + size * 0.85, y + size * 0.6);
          g.lineTo(x - size * 0.85, y + size * 0.6);
          g.closePath();
          g.fill();
          break;
        case "hop":
          g.moveTo(x - size * 0.7, y + size * 0.4);
          g.lineTo(x, y - size * 0.5);
          g.lineTo(x + size * 0.7, y + size * 0.4);
          g.stroke();
          break;
        case "slide":
          g.moveTo(x, y + size);
          g.lineTo(x + size * 0.85, y - size * 0.6);
          g.lineTo(x - size * 0.85, y - size * 0.6);
          g.closePath();
          g.fill();
          break;
        case "clip":
          g.moveTo(x + size * 0.2, y - size);
          g.lineTo(x - size * 0.5, y + size * 0.1);
          g.lineTo(x + size * 0.05, y + size * 0.1);
          g.lineTo(x - size * 0.2, y + size);
          g.lineTo(x + size * 0.5, y - size * 0.1);
          g.lineTo(x - size * 0.05, y - size * 0.1);
          g.closePath();
          g.fill();
          break;
      }
      g.globalAlpha = 1;
    }
    // Now.
    g.fillStyle = "#E6F1FF";
    g.fillRect(nowX - dpr, h * 0.1, dpr * 2, h * 0.8);
  }
}
