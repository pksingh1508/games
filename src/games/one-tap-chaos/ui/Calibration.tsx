"use client";

// Calibration (Plan/09-one-tap-chaos.md §8.2): tap along to a beat; the game measures how late your
// taps land on this device (touch delay, Bluetooth headphones…) and corrects for it from then on.
// The pulse you see is drawn on the audio's own timeline, so you can follow your eyes or your ears.
import { ArrowLeft, Check, Headphones, RotateCcw } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { getAudio } from "@/engine/audio/engine";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { CALIBRATION_BPM, LISTEN_BEATS, measureOffset, TAP_BEATS, tapErrors, type CalibrationResult } from "../core/calibration";
import { AudioClock, eventSeconds } from "../core/clock";
import { playSfx } from "../sfx";
import styles from "../otc.module.css";
import { Metro } from "./Metro";

const SPB = 60 / CALIBRATION_BPM;
const TOTAL = LISTEN_BEATS + TAP_BEATS;

type Phase = { name: "intro" } | { name: "running"; start: number } | { name: "done"; result: CalibrationResult | null };

export function Calibration({ onDone, onSkip, firstTime }: { onDone: () => void; onSkip: () => void; firstTime: boolean }) {
  const settings = useSave(settingsSave);
  const [phase, setPhase] = useState<Phase>({ name: "intro" });
  const [errors, setErrors] = useState<number[]>([]);
  const taps = useRef<number[]>([]);
  const ring = useRef<HTMLDivElement | null>(null);
  const label = useRef<HTMLParagraphElement | null>(null);

  const begin = () => {
    // Called from a tap, so audio is allowed to start.
    const audio = getAudio();
    const clock = new AudioClock();
    clock.sync(audio);
    const start = performance.now() / 1000 + 0.6;
    if (audio) {
      for (let k = 0; k < TOTAL; k++) {
        const at = clock.toAudio(start + k * SPB);
        if (at !== null) playSfx(k < LISTEN_BEATS ? "tock" : "sticks", at);
      }
    }
    taps.current = [];
    setErrors([]);
    setPhase({ name: "running", start });
  };

  const tapBeats = (start: number) => Array.from({ length: TAP_BEATS }, (_, i) => start + (LISTEN_BEATS + i) * SPB);

  const finish = useEffectEvent((start: number) => {
    setPhase({ name: "done", result: measureOffset(taps.current, tapBeats(start)) });
  });

  const recordTap = (seconds: number) => {
    if (phase.name !== "running") return;
    const beats = tapBeats(phase.start);
    if (seconds < beats[0]! - SPB / 2) return;
    taps.current.push(seconds);
    setErrors(tapErrors(taps.current, beats));
  };
  const onKeyTap = useEffectEvent((seconds: number) => recordTap(seconds));

  // The pulse and the countdown run on the same clock the clicks were scheduled on.
  useEffect(() => {
    if (phase.name !== "running") return;
    const { start } = phase;
    let frame = 0;
    const tick = () => {
      const t = performance.now() / 1000 - start;
      const beat = t / SPB;
      const k = Math.floor(beat);
      const pulse = beat >= 0 ? Math.max(0, 1 - (beat - k) * 4) : 0;
      if (ring.current) ring.current.style.transform = `scale(${1 + pulse * 0.35})`;
      if (label.current) {
        label.current.textContent = beat < 0 ? "Get ready…" : k < LISTEN_BEATS ? `Listen… ${LISTEN_BEATS - k}` : k < TOTAL ? `Tap! ${TOTAL - k}` : "Done!";
      }
      if (beat > TOTAL + 0.3) {
        finish(start);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase.name !== "running") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (!event.repeat) onKeyTap(eventSeconds(event.timeStamp));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase.name]);

  const save = (offsetMs: number | null) => {
    settingsSave.update((s) => ({ ...s, tapOffsetMs: offsetMs }));
    onDone();
  };

  const current = settings.tapOffsetMs;

  return (
    <section
      className={cn(styles.stage, "flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-10 text-center text-[#1B1B1B]")}
      onPointerDown={phase.name === "running" ? (event) => recordTap(eventSeconds(event.timeStamp)) : undefined}
      style={phase.name === "running" ? { touchAction: "none", userSelect: "none" } : undefined}
    >
      <div className={styles.rays} aria-hidden />
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#544924]">{firstTime ? "Before your first run" : "Options"}</p>
      <h1 className={cn(styles.show, "mt-2 text-4xl sm:text-5xl")}>Tap timing</h1>

      {phase.name === "intro" && (
        <div className="mt-6 max-w-lg">
          <Metro mood="happy" className="mx-auto h-36 w-28" />
          <p className="mt-4 text-lg">
            Every screen, speaker and pair of headphones adds a little delay. Tap along with the beat for a few seconds and the game
            will correct for yours.
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-[#544924]">
            <Headphones className="size-4" aria-hidden /> Use the speakers or headphones you’ll play with.
          </p>
          <p className="mt-2 text-sm text-[#544924]">Right now: {current === null ? "not calibrated (0 ms)" : `${current} ms`}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-lg" onClick={begin} data-sound="click">
              Start
            </button>
            <button type="button" className="btn btn-secondary" onClick={onSkip} data-sound="click">
              {firstTime ? "Skip for now" : "Back"}
            </button>
          </div>
        </div>
      )}

      {phase.name === "running" && (
        <div className="mt-8 flex flex-col items-center">
          <div className="relative grid size-56 place-items-center sm:size-64">
            <div ref={ring} className="absolute inset-6 rounded-full border-[10px] border-[#1B1B1B] bg-[#2B59C3] shadow-[0_8px_0_#1B1B1B]" />
            <p ref={label} className={cn(styles.show, "relative text-3xl text-white")} aria-live="polite">
              Get ready…
            </p>
          </div>
          <p className="mt-6 text-lg font-semibold">Tap anywhere (or press Space) on every beat.</p>
          <TapScale errors={errors} />
        </div>
      )}

      {phase.name === "done" && (
        <div className="mt-6 max-w-lg">
          {phase.result ? (
            <>
              <p className={cn(styles.show, "text-5xl")}>{phase.result.offsetMs} ms</p>
              <p className="mt-3 text-lg">
                {phase.result.offsetMs >= 0 ? "Your taps land a little late" : "Your taps land a little early"} on this device. The game will
                shift its timing to match.
                {phase.result.offsetMs > 150 && " That's a lot: Bluetooth audio, probably."}
              </p>
              <p className="mt-1 text-sm text-[#544924]">
                Steadiness: ±{phase.result.spreadMs} ms over {phase.result.used} taps.
              </p>
              <TapScale errors={errors} />
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" className="btn btn-lg" onClick={() => save(phase.result!.offsetMs)} data-sound="success">
                  <Check className="size-5" aria-hidden /> Use this
                </button>
                <button type="button" className="btn btn-secondary" onClick={begin} data-sound="click">
                  <RotateCcw className="size-4" aria-hidden /> Try again
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={cn(styles.show, "text-3xl")}>Not enough taps</p>
              <p className="mt-3 text-lg">Tap on each of the {TAP_BEATS} beats after the listening ones. Let’s go again.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" className="btn btn-lg" onClick={begin} data-sound="click">
                  <RotateCcw className="size-5" aria-hidden /> Try again
                </button>
                <button type="button" className="btn btn-secondary" onClick={onSkip} data-sound="click">
                  <ArrowLeft className="size-4" aria-hidden /> Skip
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Each tap as a dot: left of centre is early, right is late. */
function TapScale({ errors }: { errors: number[] }) {
  return (
    <div className="mt-6 w-[min(86vw,26rem)]" aria-hidden>
      <div className="relative h-10 rounded-full border-[3px] border-[#1B1B1B] bg-white">
        <span className="absolute inset-y-1 left-1/2 w-1 -translate-x-1/2 rounded bg-[#1B1B1B]" />
        {errors.map((e, i) => (
          <span
            key={i}
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1B1B1B] bg-[#FFB703]"
            style={{ left: `${50 + Math.max(-48, Math.min(48, (e / 0.3) * 48))}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs font-bold uppercase text-[#544924]">
        <span>Early</span>
        <span>On the beat</span>
        <span>Late</span>
      </div>
    </div>
  );
}
