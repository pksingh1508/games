"use client";

// The night shift (Plan/14-dont-blink.md §8.3–§8.6): the HUD along the top (the clock, unreported changes,
// credibility, eye strain, photos left), the monitor (the camera with its on-screen text, your eyelids, the report
// ring, the stamp, captions; the reference photo beside it), the camera buttons, and your hands: hold your eyes
// open, look at the photo, report. The night ends with a slow fade (or, if you've asked for them, a scare).
import { Armchair, Camera, Eye, Flag, Pause, Play as PlayIcon, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { onTabVisibility } from "@/engine/browser/tab";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { useComfort } from "@/games/shared/device";
import { Store } from "@/games/shared/store";
import { cn } from "@/lib/cn";
import { VIEW_H, VIEW_W } from "../core/constants";
import type { GameSetup, NightResult } from "../core/game";
import { ANOMALY_INFO, ANOMALY_TYPES, CAMERA_NAMES, CAMERAS, type AnomalyType, type CameraId } from "../core/types";
import styles from "../dont-blink.module.css";
import { initialHud, Runtime, type Hud } from "../play/runtime";
import { paintRoom } from "../render/view";
import { drawVisitor } from "../scenes/visitor";
import { dontBlinkSave } from "../save";
import { TYPE_ICONS } from "./icons";
import { OptionsDialog } from "./Menus";

export interface PlayProps {
  setup: GameSetup;
  /** "Night 3", "Endless Night", "Custom Night". */
  title: string;
  /** The night's over: record it (straight away). */
  onEnd(result: NightResult): void;
  /** …then, after the fade (or the scare), move on. */
  onFinish(): void;
  /** Leave without finishing. */
  onLeave(): void;
}

type Report = null | { stage: "aim" } | { stage: "pick"; x: number; y: number };

const camNumber = (c: CameraId) => (c === "office" ? "" : String(CAMERAS.indexOf(c) + 1).padStart(2, "0"));

function Osd({ camera, clock }: { camera: CameraId; clock: string }) {
  if (camera === "office") return null;
  const [h, m] = clock.split(":");
  return (
    <div className={styles.osd} aria-hidden>
      <span style={{ left: "0.75rem", top: "0.6rem" }}>
        CAM {camNumber(camera)} · {CAMERA_NAMES[camera].toUpperCase()}
      </span>
      <span style={{ right: "0.75rem", top: "0.6rem" }}>
        <span className={styles.rec} />
        REC
      </span>
      <span style={{ left: "0.75rem", bottom: "0.6rem" }}>MARLOW MUSEUM</span>
      <span style={{ right: "0.75rem", bottom: "0.6rem" }}>
        {h}:{m} AM
      </span>
    </div>
  );
}

/** The scare: its face, far too close (jump scares are off unless you switch them on). */
function Scare() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#050605";
    g.fillRect(0, 0, canvas.width, canvas.height);
    drawVisitor(g, 320, 1060, 6.2, "reach");
  }, []);
  return <canvas ref={ref} width={640} height={400} className={cn(styles.canvas, styles.scare)} aria-hidden />;
}

export function PlayScreen({ setup, title, onEnd, onFinish, onLeave }: PlayProps) {
  const save = useSave(dontBlinkSave);
  const settings = useSave(settingsSave);
  const comfort = useComfort();
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const top = useRef<HTMLDivElement | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);
  const photoCanvas = useRef<HTMLCanvasElement | null>(null);
  const runtime = useRef<Runtime | null>(null);
  const [hudStore] = useState(() => new Store<Hud>(initialHud()));
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const [paused, setPausedState] = useState(false);
  const pausedRef = useRef(false);
  const setPaused = (next: boolean) => {
    pausedRef.current = next;
    setPausedState(next);
  };
  const [report, setReportState] = useState<Report>(null);
  const reportRef = useRef<Report>(null);
  const setReport = (next: Report) => {
    reportRef.current = next;
    setReportState(next);
  };
  const [over, setOver] = useState<NightResult | null>(null);
  const [options, setOptions] = useState(false);
  const [held, setHeld] = useState(false);

  const ended = useEffectEvent((result: NightResult) => {
    setReport(null);
    setHeld(false);
    onEnd(result);
    setOver(result);
  });
  const flashing = useEffectEvent(() => comfort.reduceFlashing);
  const captions = useEffectEvent(() => dontBlinkSave.get().prefs.captions);

  // One runtime per night.
  useEffect(() => {
    if (!canvas.current || !top.current || !bottom.current) return;
    const created = new Runtime(canvas.current, { top: top.current, bottom: bottom.current }, { setup, reduceFlashing: () => flashing(), captions: () => captions() }, hudStore, {
      onEnd: (result) => ended(result),
    });
    runtime.current = created;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __db?: unknown }).__db = { runtime: created };
    created.start();
    created.resume();
    return () => {
      created.destroy();
      runtime.current = null;
    };
  }, [setup, hudStore]);

  // After the night: the sun comes up, or the slow fade (or the scare), then on.
  const finish = useEffectEvent(() => onFinish());
  useEffect(() => {
    if (!over) return;
    const won = over.status === "won";
    const ms = comfort.reducedMotion ? 1200 : won ? 2400 : 3000;
    const timer = window.setTimeout(() => finish(), ms);
    return () => window.clearTimeout(timer);
  }, [over, comfort.reducedMotion]);

  // The reference photo: the camera's morning photo from the binder.
  useEffect(() => {
    if (!hud.photo || !photoCanvas.current) return;
    const target = photoCanvas.current;
    const src = paintRoom(hud.camera, 1.5, { visitor: hud.camera === "sculpture" ? { pose: "cover" } : null });
    target.width = src.width;
    target.height = src.height;
    target.getContext("2d")!.drawImage(src, 0, 0);
  }, [hud.photo, hud.camera]);

  const pause = () => {
    if (pausedRef.current || over) return;
    runtime.current?.pause();
    setHeld(false);
    setReport(null);
    setPaused(true);
  };
  const resume = () => {
    setPaused(false);
    runtime.current?.resume();
  };

  // Looking away pauses.
  const looked = useEffectEvent((hidden: boolean) => {
    if (hidden) pause();
  });
  useEffect(() => onTabVisibility((hidden) => looked(hidden)), []);

  const hold = (on: boolean) => {
    runtime.current?.setHolding(on);
    setHeld(on && !pausedRef.current);
  };

  const pick = (type: AnomalyType) => {
    const r = reportRef.current;
    if (!r || r.stage !== "pick") return;
    runtime.current?.report(r.x, r.y, type);
    setReport(null);
  };

  // Keys: 1–5 cameras (or, with the picker open, 1–9 the types), 6 or O your office, R report, F the photo,
  // hold Space to keep your eyes open, Esc to cancel or pause.
  const onKey = useEffectEvent((event: KeyboardEvent, down: boolean) => {
    if (document.querySelector("[role=dialog]")) return;
    const rt = runtime.current;
    if (!rt) return;
    if (event.code === "Space") {
      event.preventDefault();
      if (event.repeat) return;
      if (!pausedRef.current && !over) hold(down);
      return;
    }
    if (!down || event.repeat || over) return;
    if (event.code === "Escape") {
      event.preventDefault();
      if (reportRef.current) setReport(null);
      else if (pausedRef.current) resume();
      else pause();
      return;
    }
    if (pausedRef.current) return;
    const r = reportRef.current;
    const digit = /^Digit([1-9])$/.exec(event.code)?.[1] ?? /^Numpad([1-9])$/.exec(event.code)?.[1];
    if (r?.stage === "pick") {
      if (digit) {
        event.preventDefault();
        pick(ANOMALY_TYPES[Number(digit) - 1]!);
      }
      return;
    }
    if (digit) {
      const n = Number(digit);
      const museum = hud.cameras.filter((c) => c !== "office");
      const camera = n === 6 ? "office" : museum[n - 1];
      if (camera) {
        event.preventDefault();
        rt.look(camera);
      }
      return;
    }
    if (event.code === "KeyO") rt.look("office");
    else if (event.code === "KeyR") setReport(r ? null : { stage: "aim" });
    else if (event.code === "KeyF") rt.togglePhoto();
  });
  // Switching windows mid-hold: the key-up never comes, so let go.
  const letGo = useEffectEvent(() => hold(false));
  useEffect(() => {
    const downs = (event: KeyboardEvent) => onKey(event, true);
    const ups = (event: KeyboardEvent) => onKey(event, false);
    const blur = () => letGo();
    window.addEventListener("keydown", downs);
    window.addEventListener("keyup", ups);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", downs);
      window.removeEventListener("keyup", ups);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const onScreen = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pausedRef.current || over || event.button > 0) return;
    const at = runtime.current?.toScene(event.clientX, event.clientY);
    if (!at) return;
    setReport({ stage: "pick", ...at });
  };

  const eyeDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    hold(true);
  };
  const eyeUp = () => hold(false);

  const reduce = comfort.reduceFlashing;
  const office = hud.camera === "office";
  const museum = hud.cameras.filter((c) => c !== "office");
  const won = over?.status === "won";
  const scare = !!over && !won && over.lost !== null && settings.jumpScares && !comfort.reducedMotion;

  return (
    <div
      className={cn(styles.root, styles.area, hud.lying && styles.lying, report && styles.reporting, reduce && styles.reduce)}
      aria-label={`${title}, Don't Blink`}
      data-game-area
      data-mode={setup.mode}
      data-night={setup.night}
      data-phase={over ? "end" : paused ? "paused" : "play"}
      data-status={hud.status}
      data-ready={hud.ready ? "" : undefined}
      data-camera={hud.camera}
      data-active={hud.active}
      data-clock={hud.clock}
      data-reporting={report?.stage}
    >
      <div className={styles.bar} data-hud>
        <span className={cn(styles.display, "text-xl")}>{title}</span>
        <span className={styles.clock} data-hud-clock aria-label={`${hud.clock} AM`}>
          {hud.clock}
        </span>
        <span className={styles.stat} title="Unreported changes">
          <span className="text-xs text-[var(--db-dim)] max-sm:hidden">UNREPORTED</span>
          <span className={styles.pips} role="img" aria-label={`${hud.active} of ${hud.max} unreported changes`} data-pips={hud.active} data-danger={hud.danger !== null ? "" : undefined}>
            {Array.from({ length: hud.max }, (_, k) => (
              <span key={k} className={styles.pip} data-on={k < hud.active ? "" : undefined} />
            ))}
          </span>
        </span>
        <span className={styles.stat} title="Credibility: false reports you can make this hour">
          <span className="text-xs text-[var(--db-dim)] max-sm:hidden">CREDIBILITY</span>
          <span className={styles.cred} role="img" aria-label={`Credibility: ${hud.credibility} of ${hud.credibilityOf}`} data-warned={hud.warned ? "" : undefined} data-credibility={hud.credibility}>
            {Array.from({ length: hud.credibilityOf }, (_, k) => (
              <span key={k} data-gone={k >= hud.credibility ? "" : undefined} />
            ))}
          </span>
        </span>
        <span className={styles.stat} title="Eye strain">
          <Eye className="size-4" aria-hidden />
          <span className={styles.meter} role="meter" aria-label="Eye strain" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hud.strain} data-strain={hud.strain}>
            <span style={{ width: `${hud.strain}%` }} />
          </span>
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button type="button" className={cn(styles.btn, "!min-h-9 !px-2.5")} onClick={pause} aria-label="Pause (Esc)" disabled={paused || !!over} data-pause>
            <Pause className="size-4" aria-hidden />
          </button>
        </span>
      </div>

      <div className={cn(styles.monitor, office && styles.office)} data-monitor>
        <div className={styles.pane}>
          <div className={styles.screen} onPointerDown={onScreen} data-screen>
            <canvas ref={canvas} className={styles.canvas} aria-hidden />
            {!office && <div className={styles.scanlines} aria-hidden />}
            <div className={styles.vignette} aria-hidden />
            <Osd camera={hud.camera} clock={hud.clock} />
            {hud.danger !== null && !over && (
              <>
                <div className={styles.dangerEdge} aria-hidden />
                <div className={styles.countdown} role="alert" data-danger={hud.danger}>
                  Five changes. Report one: {hud.danger}
                </div>
              </>
            )}
            {report?.stage === "pick" && <span className={styles.ring} style={{ left: `${(report.x / VIEW_W) * 100}%`, top: `${(report.y / VIEW_H) * 100}%` }} aria-hidden />}
            {report?.stage === "aim" && <div className={styles.banner}>Click what changed (or where it was). Esc to cancel.</div>}
            {hud.stamp && (
              <div key={`stamp-${hud.stamp.key}`} className={styles.stamp} data-ok={hud.stamp.ok ? "" : undefined} data-stamp={hud.stamp.ok ? "accepted" : "denied"}>
                <b>{hud.stamp.title}</b>
                <span>{hud.stamp.detail}</span>
              </div>
            )}
            {hud.caption && (
              <div key={`caption-${hud.caption.key}`} className={styles.caption} data-caption>
                {hud.caption.text}
              </div>
            )}
            <div className={styles.lids} aria-hidden>
              <div ref={top} className={cn(styles.lid, styles.lidTop)} data-lid="top" />
              <div ref={bottom} className={cn(styles.lid, styles.lidBottom)} data-lid="bottom" />
            </div>
            {over && (
              <div className={cn(styles.overlay, won ? styles.sunrise : "", !scare && styles.fade)} style={{ background: won ? undefined : "#000" }} data-over={over.status}>
                {scare ? <Scare /> : won ? <p className={cn(styles.display, "text-5xl text-white drop-shadow")}>06:00 AM</p> : null}
              </div>
            )}
          </div>
        </div>
        {hud.photo && (
          <div className={styles.pane} data-photo-pane>
            <figure className={styles.photo} data-photo>
              <canvas ref={photoCanvas} aria-label={`The morning photo of the ${CAMERA_NAMES[hud.camera]}`} role="img" />
              <figcaption>{CAMERA_NAMES[hud.camera]}, 6:00 AM</figcaption>
              <button type="button" className={cn(styles.btn, "absolute right-2 top-2 !min-h-8 !px-2")} onClick={() => runtime.current?.togglePhoto()} aria-label="Put the photo away">
                <X className="size-4" aria-hidden />
              </button>
            </figure>
          </div>
        )}
        <p className="sr-only" aria-live="polite" data-message>
          {hud.message}
        </p>
      </div>

      <div className={styles.controls} data-controls>
        <div className={styles.cams} role="group" aria-label="Cameras">
          {museum.map((c, i) => (
            <button key={c} type="button" className={styles.cam} aria-pressed={hud.camera === c} onClick={() => runtime.current?.look(c)} data-cam={c} disabled={paused || !!over}>
              <small>CAM {camNumber(c)}</small>
              <span>{CAMERA_NAMES[c]}</span>
              <span className="sr-only"> (key {i + 1})</span>
            </button>
          ))}
          <button type="button" className={styles.cam} aria-pressed={office} onClick={() => runtime.current?.look("office")} data-cam="office" disabled={paused || !!over}>
            <small>
              <Armchair className="inline size-3.5" aria-hidden /> 6 · O
            </small>
            <span>Your office</span>
          </button>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={cn(styles.btn, styles.eye)}
            onPointerDown={eyeDown}
            onPointerUp={eyeUp}
            onPointerCancel={eyeUp}
            onLostPointerCapture={eyeUp}
            onContextMenu={(e) => e.preventDefault()}
            data-held={held ? "" : undefined}
            aria-pressed={held}
            aria-label="Hold to keep your eyes open (Space)"
            disabled={paused || !!over}
            data-eye
          >
            <Eye className="size-5" aria-hidden />
            <span className="max-sm:hidden">Hold</span>
          </button>
          <button type="button" className={styles.btn} onClick={() => runtime.current?.togglePhoto()} aria-pressed={hud.photo} disabled={paused || !!over || (hud.photos === 0 && !hud.photo)} aria-label={`Reference photo (F), ${hud.photos === null ? "unlimited" : `${hud.photos} left`}`} data-photo-button data-photos={hud.photos ?? "unlimited"}>
            <Camera className="size-5" aria-hidden />
            <span>{hud.photos === null ? "∞" : hud.photos}</span>
          </button>
          <button type="button" className={cn(styles.btn, styles.reportBtn)} aria-pressed={!!report} onClick={() => setReport(report ? null : { stage: "aim" })} disabled={paused || !!over} data-report>
            <Flag className="size-5" aria-hidden />
            Report
          </button>
        </div>
      </div>

      {report?.stage === "pick" && !over && (
        <div className={styles.picker} style={{ left: "50%", bottom: "0.5rem", transform: "translateX(-50%)" }} role="group" aria-label="What changed here?" data-picker>
          <div className="flex items-center justify-between gap-2">
            <strong>What changed here?</strong>
            <button type="button" className={cn(styles.btn, "!min-h-8 !px-2")} onClick={() => setReport(null)} aria-label="Cancel (Esc)" data-cancel>
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className={styles.types}>
            {ANOMALY_TYPES.map((t, i) => {
              const Icon = TYPE_ICONS[t];
              const label = ANOMALY_INFO[hud.labels[t]].label;
              return (
                <button key={t} type="button" className={styles.type} onClick={() => pick(t)} data-type={t} title={hud.lying ? undefined : ANOMALY_INFO[t].about}>
                  <Icon className="size-5" aria-hidden />
                  <span className={styles.typeLabel}>{label}</span>
                  <kbd>{i + 1}</kbd>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {paused && !over && (
        <div className={styles.overlay} data-card="paused">
          <div className={cn(styles.card, "w-[min(24rem,100%)] p-6 text-center")}>
            <p className={cn(styles.display, "text-4xl")}>Paused</p>
            <p className="mt-2 text-sm text-[var(--db-dim)]">
              {title} · {hud.clock} AM. The museum waits for you.
            </p>
            <div className="mt-5 grid gap-2">
              <button type="button" className={cn(styles.btn, styles.primary)} onClick={resume} data-resume>
                <PlayIcon className="size-4" aria-hidden /> Back to the cameras
              </button>
              <button type="button" className={styles.btn} onClick={() => setOptions(true)} data-options>
                Options
              </button>
              <button type="button" className={cn(styles.btn, styles.danger)} onClick={onLeave} data-leave>
                Leave the night
              </button>
            </div>
            {save.prefs.assist && <p className="mt-4 text-xs text-[var(--db-dim)]">Assist mode is on.</p>}
          </div>
        </div>
      )}
      <OptionsDialog open={options} onOpenChange={setOptions} />
    </div>
  );
}
