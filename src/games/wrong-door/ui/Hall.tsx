"use client";

// The hall (Plan/13-wrong-door.md §8.2): the doors across the middle, Mr. Hinges to one side, the candle,
// footprints and light on the floor, and the lobby's furniture on the wall (the same on every floor, so you
// know it by heart when an anomaly floor changes something). Doors are buttons: tap to look closer, hold
// to knock.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { statementShort } from "../logic/statements";
import type { Anomaly, DoorId, Floor, Sound } from "../logic/types";
import type { RunState } from "../run/state";
import styles from "../wrong-door.module.css";
import { CAPTIONS } from "../audio/behind";
import { CandleSvg, ClockSvg, DoorFrameSvg, DoorLeafSvg, FloorSignSvg, HingesSvg, ITEM_NAMES, ItemSvg, LampSvg, PaintingSvg, PlantSvg, PrintSvg, STYLE_NAMES, type HatShown, type PaintingState } from "./art";

/** The wall's colour, by floor: warm at the bottom, darker and stranger higher up. The lobby (and every
 * anomaly floor, which pretends to be it) is the first. */
export function wallFor(floor: number, lobby: boolean): { wall: string; ink: string } {
  if (lobby || floor <= 3) return { wall: "#e7d3c0", ink: "#d3bba3" };
  if (floor <= 6) return { wall: "#dcbcbc", ink: "#c7a1a3" };
  if (floor <= 9) return { wall: "#a9c0bb", ink: "#90a8a3" };
  if (floor <= 12) return { wall: "#6e5a78", ink: "#5d4a67" };
  return { wall: "#2b2030", ink: "#403346" };
}

const diamonds = (ink: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='36' height='48'><path d='M18 4 L30 24 L18 44 L6 24 Z' fill='none' stroke='${ink}' stroke-width='2'/></svg>`)}")`;

function useSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 430 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setSize({ w: el.clientWidth || 800, h: el.clientHeight || 430 });
    fit();
    const ob = new ResizeObserver(fit);
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return [ref, size] as const;
}

export interface HallProps {
  floor: Floor;
  run: RunState;
  selected: DoorId | null;
  /** The door swinging open (and whether the stairs go up behind it). */
  opening: { door: DoorId; up: boolean } | null;
  /** A door you've just knocked on, and what you heard. */
  heard: { door: DoorId; sound: Sound } | null;
  /** Mr. Hinges's answer, in his speech bubble. */
  speech: string | null;
  canRead: boolean;
  /** The door he opened on the Lucky Floor. */
  luckyOpened: DoorId | null;
  flickering: boolean;
  scrambled: (text: string, door: DoorId) => string;
  onSelect(door: DoorId): void;
  onKnock(door: DoorId): void;
  onHinges(): void;
  onBack(): void;
  onPainting(): void;
  onPickUp(): void;
}

export function Hall(props: HallProps) {
  const { floor, run, selected, opening, heard, speech, canRead, luckyOpened, flickering } = props;
  const [ref, { w, h }] = useSize();
  const n = floor.doors.length;
  const lobbyLook = !!floor.anomaly;
  const changed: Anomaly | null = floor.anomaly?.changed ?? null;
  const look = wallFor(floor.number, lobbyLook);
  const final = floor.final;
  // The row of doors: between the way back (left) and Mr. Hinges (right).
  const rowLeft = w * 0.13;
  const rowRight = w * 0.87;
  const slot = (rowRight - rowLeft) / Math.max(1, n);
  const doorW = Math.min(slot * 0.72, h * 0.25);
  const doorH = doorW * 2;
  const placeOf = (id: DoorId) => (floor.shuffle && run.play.shuffled ? floor.shuffle.indexOf(id) + 1 : id);
  const centerOf = (place: number) => rowLeft + slot * (place - 0.5);
  const hat: HatShown | null = floor.doorman ? (!canRead ? "dark" : floor.doorman.hat === "off" ? "off" : floor.doorman.lies ? "red" : "black") : null;
  const painting: PaintingState = changed === "paintingUpsideDown" ? "upsideDown" : changed === "paintingMissing" ? "missing" : changed === "shipSailsLeft" ? "left" : "normal";
  const candleX = floor.candle ? rowLeft + slot * floor.candle.at : 0;
  // The way back opens on anomaly floors (not in the lobby itself: that's floor 0) and when it's the way out.
  const backOpen = (!!floor.anomaly && floor.number > 0) || final?.way === "back";
  const paintingOpen = final?.way === "painting";
  const wallStyle: CSSProperties = {
    backgroundColor: look.wall,
    backgroundImage: changed === "stripes" ? `repeating-linear-gradient(90deg, ${look.ink} 0 3px, transparent 3px 26px)` : diamonds(look.ink),
  };

  // Footprints: from where you stand (the bottom middle) to the door, toes one way or the other.
  const prints = (() => {
    if (!floor.footprints || !canRead) return [];
    const to = { x: centerOf(placeOf(floor.footprints.door)), y: h * 0.79 };
    const from = { x: w * 0.5, y: h * 1.02 };
    const steps = 7;
    const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90 + (floor.footprints.toes === "out" ? 180 : 0);
    return Array.from({ length: steps }, (_, k) => {
      const t = (k + 0.6) / (steps + 0.4);
      const side = k % 2 ? 1 : -1;
      const nx = -(to.y - from.y);
      const ny = to.x - from.x;
      const len = Math.hypot(nx, ny) || 1;
      return { x: from.x + (to.x - from.x) * t + (side * nx * 7) / len, y: from.y + (to.y - from.y) * t + (side * ny * 7) / len, angle };
    });
  })();

  return (
    <div ref={ref} className={cn(styles.hall, floor.mirror && styles.mirrored, flickering && styles.flicker)} data-hall data-mirror={floor.mirror ? "" : undefined} data-dark={!canRead ? "" : undefined}>
      <div className={styles.wall} style={wallStyle} />
      <div className={styles.skirting} />
      <div className={styles.floorStrip} />
      <div className={styles.rug} data-blue={changed === "rugBlue" ? "" : undefined} />

      {/* The lobby's furniture. */}
      <button
        type="button"
        className={styles.painting}
        style={{ left: "2.5%", top: "4%", width: "13%", aspectRatio: "160 / 110" }}
        disabled={!paintingOpen}
        onClick={props.onPainting}
        aria-label={paintingOpen ? "The painting of a ship (it's on hinges)" : "A painting of a ship"}
        tabIndex={paintingOpen ? 0 : -1}
        data-painting
      >
        <PaintingSvg state={painting} />
      </button>
      <div className="absolute" style={{ left: "46%", top: "1.5%", width: "8%", aspectRatio: "70 / 30" }} aria-hidden>
        <FloorSignSvg text={changed === "signThirtyOne" ? "31" : "13"} />
      </div>
      <div className="absolute" style={{ right: "3%", top: "2.5%", width: "8%", aspectRatio: "1" }} aria-hidden>
        <ClockSvg hour={changed === "clockTime" ? 9 : 3} backwards={changed === "clockBackwards"} />
      </div>
      {[22, 78, ...(changed === "threeLamps" ? [50] : [])].map((x) => (
        <div key={x} className="absolute" style={{ left: `${x - 1.6}%`, top: x === 50 ? "4%" : "2.5%", width: "3.2%", aspectRatio: "40 / 60" }} aria-hidden>
          <LampSvg lit={!(changed === "lampOut" && x === 78)} />
        </div>
      ))}
      {changed !== "plantMissing" && (
        <div className="absolute z-[2]" style={{ [changed === "plantMoved" ? "right" : "left"]: changed === "plantMoved" ? "12%" : "1%", bottom: "3%", width: "6.5%", aspectRatio: "60 / 90" }} aria-hidden>
          <PlantSvg />
        </div>
      )}

      {/* The way you came in. */}
      <button type="button" className={styles.backDoor} disabled={!backOpen} onClick={props.onBack} aria-label={backOpen ? "Go back the way you came" : "The door you came in by"} tabIndex={backOpen ? 0 : -1} data-back>
        <div className={styles.doorFrame}>
          <DoorFrameSvg style="back" />
          <div className={styles.leaf}>
            <DoorLeafSvg style="back" />
          </div>
        </div>
      </button>

      {/* The doors. */}
      {floor.doors.map((d) => {
        const place = placeOf(d.id);
        const isOpen = opening?.door === d.id || luckyOpened === d.id;
        const up = opening?.door === d.id ? opening.up : false;
        const opened = run.play.opened.includes(d.id);
        const knocked = run.play.knocks[d.id];
        const coin = run.play.coins[d.id];
        const peeked = run.play.peeks[d.id];
        const fallen = !!floor.shuffle && run.play.shuffled;
        const sign = d.sign ? props.scrambled(statementShort(d.sign, d.id), d.id) : null;
        const label = [
          `Door ${place}`,
          floor.number && d.number !== null ? `room ${d.number}` : null,
          STYLE_NAMES[d.style],
          d.sign && canRead && !fallen ? `sign: ${props.scrambled(statementShort(d.sign, d.id), d.id)}` : null,
          d.light ? "light underneath" : null,
          knocked ? `you heard ${CAPTIONS[knocked].text}` : null,
          opened ? "opened: wrong" : null,
          run.play.chalk.includes(d.id) ? "chalked" : null,
          d.scratch ? `scratch: ${d.scratch}` : null,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <DoorButton
            key={d.id}
            style={{ left: centerOf(place) - doorW / 2, width: doorW, height: doorH }}
            label={label}
            selected={selected === d.id}
            onSelect={() => props.onSelect(d.id)}
            onKnock={() => props.onKnock(d.id)}
            data-door={d.id}
            data-place={place}
          >
            <div className={styles.doorFrame}>
              <DoorFrameSvg style={d.style} />
              <div className={styles.behind} data-up={isOpen && up ? "" : undefined} data-round={d.style === "round" ? "" : undefined} />
              <div className={styles.leaf} style={isOpen ? { transform: "rotateY(-78deg)" } : undefined}>
                <DoorLeafSvg style={d.style} />
                {d.scratch && <Scratch kind={d.scratch} />}
                {run.play.chalk.includes(d.id) && <span className={cn(styles.mark, "bottom-[12%] left-[16%] text-white/90")}>✓</span>}
                {sign && (
                  <span className={cn(styles.plate, styles.serif)} data-fallen={fallen ? "" : undefined} style={!canRead ? { filter: "blur(3px) brightness(0.3)" } : undefined}>
                    {canRead ? sign : "· · ·"}
                    {coin !== undefined && (
                      <span className={cn(styles.stamp, "absolute -right-1 -top-3 bg-[#f3e3d3]")} data-true={coin ? "" : undefined} data-false={!coin ? "" : undefined}>
                        {coin ? "TRUE" : "FALSE"}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <span className={cn(styles.number, styles.display)}>{d.number !== null ? d.number : floor.shuffle && run.play.shuffled ? place : d.id}</span>
            {d.light && <span className={styles.light} aria-hidden />}
            {opened && (
              <svg viewBox="0 0 10 10" className={styles.cross} aria-hidden>
                <path d="M1 1 L9 9 M9 1 L1 9" stroke="#e8e0d6" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            )}
            {peeked !== undefined && <span className={cn(styles.mark, "-bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[#ffd48a]")}>{peeked ? "↑ stairs" : "✗ wall"}</span>}
            {heard?.door === d.id && (
              <span className={styles.heard} role="status">
                {CAPTIONS[heard.sound].icon} {CAPTIONS[heard.sound].text}
              </span>
            )}
          </DoorButton>
        );
      })}

      {/* The candle. */}
      {floor.candle && (
        <div className="absolute z-[3]" style={{ left: candleX - w * 0.022, bottom: "4%", width: w * 0.044, height: w * 0.1 }} aria-label={`A candle, its flame leaning ${floor.candle.lean}`} role="img" data-candle={floor.candle.lean}>
          <CandleSvg lean={floor.candle.lean} />
        </div>
      )}

      {/* Footprints. */}
      {prints.map((p, k) => (
        <div key={k} className="pointer-events-none absolute" style={{ left: p.x - w * 0.009, top: p.y - w * 0.018, width: w * 0.018, height: w * 0.036, rotate: `${p.angle}deg` }} aria-hidden>
          <PrintSvg />
        </div>
      ))}
      {floor.footprints && canRead && (
        <span className="sr-only">
          Footprints lead to door {placeOf(floor.footprints.door)}, the toes pointing {floor.footprints.toes === "in" ? "at the door" : "back at you"}.
        </span>
      )}

      {/* Something lying on the rug. */}
      {floor.item && !run.play.taken && (
        <button type="button" onClick={props.onPickUp} className="absolute z-[3] grid place-items-center rounded-full bg-[#2a1e2f]/40 p-1 text-[#f3e3d3]" style={{ left: "62%", bottom: "6%", width: w * 0.05, height: w * 0.05 }} aria-label={`Pick up the ${ITEM_NAMES[floor.item]}`} data-item={floor.item}>
          <ItemSvg kind={floor.item} className="size-full" />
        </button>
      )}

      {/* Mr. Hinges. */}
      {hat && (
        <button type="button" className={cn(styles.hinges, "z-[3]")} onClick={props.onHinges} aria-label={`Mr. Hinges, the doorman${hat === "red" ? ", in a red hat with a feather" : hat === "black" ? ", in a black hat" : hat === "off" ? ", his hat behind his back" : ", too dark to see his hat"}`} data-hinges={hat}>
          <HingesSvg hat={hat} />
          {speech && (
            <span className={cn(styles.speech, floor.mirror && styles.mirrorText)} role="status">
              {speech}
            </span>
          )}
        </button>
      )}

      {!canRead && <div className={styles.dark} style={{ "--x": floor.candle ? `${(candleX / w) * 100}%` : "50%" } as CSSProperties} aria-hidden />}
    </div>
  );
}

/** A door: tap to look closer; hold (or long-press) to knock. */
function DoorButton({
  style,
  label,
  selected,
  onSelect,
  onKnock,
  children,
  ...data
}: {
  style: CSSProperties;
  label: string;
  selected: boolean;
  onSelect(): void;
  onKnock(): void;
  children: React.ReactNode;
  "data-door": number;
  "data-place": number;
}) {
  const hold = useRef<{ timer: number; fired: boolean } | null>(null);
  const start = () => {
    const h = { timer: 0, fired: false };
    h.timer = window.setTimeout(() => {
      h.fired = true;
      onKnock();
    }, 520);
    hold.current = h;
  };
  const end = () => {
    if (hold.current) window.clearTimeout(hold.current.timer);
  };
  return (
    <button
      type="button"
      className={styles.door}
      style={style}
      aria-label={label}
      aria-pressed={selected}
      data-selected={selected ? "" : undefined}
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (hold.current?.fired) {
          hold.current = null;
          return;
        }
        onSelect();
      }}
      {...data}
    >
      {children}
    </button>
  );
}

function Scratch({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    slash: "M3 9 L9 1",
    cross: "M2 2 L8 8 M8 2 L2 8",
    ring: "M5 1.5 a3.5 3.5 0 1 0 0.01 0",
    double: "M2 8 L6 1 M5 9 L9 2",
    zigzag: "M1 3 L4 7 L6 3 L9 7",
  };
  return (
    <svg viewBox="0 0 10 10" className="absolute right-[16%] top-[56%] w-[24%]" aria-hidden>
      <path d={paths[kind]} stroke="#f3e3d3" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  );
}
