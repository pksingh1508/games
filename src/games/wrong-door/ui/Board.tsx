"use client";

// The clue board under the hall (Plan/13-wrong-door.md §8.2 "Bottom bar"): every sign in full, in plain
// English (big enough to read on a phone), the other clues in words, what you've found out so far, and the
// door you're looking at, with what you can do to it.
import { BookOpen, Ear, HandHelping, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/cn";
import { CAPTIONS } from "../audio/behind";
import { describeClues, signWords, wayWord } from "../content/reveal";
import { questionText } from "../logic/doorman";
import type { DoorId, Floor } from "../logic/types";
import { can, knocksAllowed, knocksLeft, type Choice, type RunState } from "../run/state";
import styles from "../wrong-door.module.css";
import { ITEM_NAMES, ItemSvg, KeySvg, STYLE_NAMES } from "./art";

export interface BoardProps {
  floor: Floor;
  run: RunState;
  canRead: boolean;
  selected: DoorId | null;
  busy: boolean;
  bigSigns: boolean;
  coarse: boolean;
  /** The number a door shows (its place, after shifting doors move). */
  place(door: DoorId): number;
  scrambled(text: string, door: DoorId): string;
  onSelect(door: DoorId): void;
  onKnock(door: DoorId): void;
  onOpen(choice: Choice): void;
  onCoin(door: DoorId): void;
  onCrowbar(door: DoorId): void;
  onChalk(door: DoorId): void;
  onAsk(): void;
  onPickUp(): void;
  onCodex(): void;
  /** A note (a new codex page, something picked up), next to the codex. */
  note: string | null;
}

export function Board(props: BoardProps) {
  const { floor, run, canRead, selected, busy, place } = props;
  const allowed = can(run, floor);
  const fallen = !!floor.shuffle && run.play.shuffled;
  const signed = floor.doors.filter((d) => d.sign);
  const door = selected ? floor.doors[selected - 1] : null;
  const curse = run.play.curse;
  const clues = describeClues(floor, place, canRead);

  return (
    <section className={styles.board} aria-label="Clues" data-board>
      {curse && (
        <p className="mb-2 rounded-lg bg-[#2a1e2f] px-3 py-1.5 text-sm font-bold text-[#f3e3d3]" data-curse={curse}>
          Cursed:{" "}
          {curse === "noKnock" ? "no knocking on this floor." : curse === "silentDoorman" ? "Mr. Hinges won't say a word tonight." : "the letters on the signs are scrambled."}
        </p>
      )}

      {signed.length > 0 && (
        <div>
          <h2 className={cn(styles.display, "text-lg")}>Signs</h2>
          {!canRead ? (
            <p className="mt-1 italic opacity-75">Too dark to read the signs.</p>
          ) : fallen ? (
            <p className="mt-1 italic opacity-75">The signs fell off when the lights flickered.</p>
          ) : (
            <ul className={cn(styles.signs, "mt-1 grid gap-1")} data-big={props.bigSigns ? "" : undefined}>
              {signed.map((d) => {
                const text = props.scrambled(signWords(floor, d.id), d.id);
                const coin = run.play.coins[d.id];
                return (
                  <li key={d.id}>
                    <button type="button" className={cn("flex w-full items-baseline gap-2 rounded-lg px-2 py-1 text-left hover:bg-black/5", selected === d.id && "bg-black/10")} onClick={() => props.onSelect(d.id)} data-sign={d.id}>
                      <span className={cn(styles.chip, "shrink-0")}>Door {place(d.id)}</span>
                      <span aria-label={text}>
                        <span className={floor.mirror ? styles.mirrorText : undefined} aria-hidden={floor.mirror || undefined}>
                          “{text}”
                        </span>
                      </span>
                      {coin !== undefined && (
                        <span className={cn(styles.stamp, "ml-auto shrink-0")} data-true={coin ? "" : undefined} data-false={!coin ? "" : undefined}>
                          {coin ? "TRUE" : "FALSE"}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {clues.length > 0 && (
        <ul className="mt-2 grid gap-0.5 text-[0.95rem]" data-clues>
          {clues.map((c) => (
            <li key={c}>· {c}</li>
          ))}
        </ul>
      )}

      {floor.anomaly && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={styles.btn} onClick={() => props.onOpen("back")} disabled={busy} data-go="back">
            ↩ Go back the way you came
          </button>
          <button type="button" className={cn(styles.btn, styles.gold)} onClick={() => props.onOpen(1)} disabled={busy} data-go="ahead">
            Open the door ahead
          </button>
        </div>
      )}

      {/* The door you're looking at. */}
      {!floor.anomaly && (
        <div className="mt-3 rounded-xl border-2 border-[#2a1e2f]/15 p-2.5" data-door-panel>
          {door ? (
            <>
              <p className="font-bold">
                Door {place(door.id)} · {STYLE_NAMES[door.style]}
                {door.number !== null && ` · room ${door.number}`}
                {run.play.opened.includes(door.id) && <span className="ml-2 text-[#a3283a]">(wrong: you&apos;ve been through it)</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={cn(styles.btn, styles.gold)} onClick={() => props.onOpen(door.id)} disabled={busy || run.play.opened.includes(door.id)} data-open>
                  Open door {place(door.id)}
                </button>
                {!floor.lucky && (
                  <button type="button" className={styles.btn} onClick={() => props.onKnock(door.id)} disabled={busy || !allowed.knock || run.play.knocks[door.id] !== undefined || run.play.opened.includes(door.id)} data-knock>
                    <Ear className="size-4" aria-hidden /> Knock ({knocksLeft(run)} left)
                  </button>
                )}
                {allowed.coin && door.sign && canRead && !fallen && run.play.coins[door.id] === undefined && (
                  <button type="button" className={styles.btn} onClick={() => props.onCoin(door.id)} disabled={busy} data-use="truthCoin">
                    <ItemSvg kind="truthCoin" className="size-5" /> Flip the Truth Coin on its sign
                  </button>
                )}
                {allowed.crowbar && run.play.peeks[door.id] === undefined && !run.play.opened.includes(door.id) && (
                  <button type="button" className={styles.btn} onClick={() => props.onCrowbar(door.id)} disabled={busy} data-use="crowbar">
                    <ItemSvg kind="crowbar" className="size-5" /> Peek with the crowbar
                  </button>
                )}
                {allowed.chalk && (
                  <button type="button" className={styles.btn} onClick={() => props.onChalk(door.id)} disabled={busy} data-use="chalk">
                    <ItemSvg kind="chalk" className="size-5" /> {run.play.chalk.includes(door.id) ? "Rub out the chalk" : "Chalk it"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="opacity-75">
              {floor.lucky ? "Pick a door. Any door." : props.coarse ? "Tap a door to look closer. Hold one to knock." : `Click a door (or press 1–${floor.doors.length}) to look closer. Hold to knock.`}
            </p>
          )}
        </div>
      )}

      <Log floor={floor} run={run} place={place} />

      {run.items.chalk && run.chalkLog.length > 0 && (
        <p className="mt-2 text-sm" data-chalk-notes>
          ✎ Your chalk notes:{" "}
          {run.chalkLog
            .slice(-8)
            .map((n) => `floor ${n.floor}, ${n.style ? `${STYLE_NAMES[n.style]} door` : "back the way you came"}`)
            .join(" · ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {floor.doorman && !floor.lucky && (
          <button type="button" className={styles.btn} onClick={props.onAsk} disabled={busy || !allowed.ask} data-ask>
            <MessageCircleQuestion className="size-4" aria-hidden /> {run.play.answer ? "Asked" : "Ask Mr. Hinges"}
          </button>
        )}
        {floor.item && !run.play.taken && (
          <button type="button" className={styles.btn} onClick={props.onPickUp} disabled={busy} data-pickup>
            <HandHelping className="size-4" aria-hidden /> Pick up the {ITEM_NAMES[floor.item]}
          </button>
        )}
        <button type="button" className={styles.btn} onClick={props.onCodex} data-codex>
          <BookOpen className="size-4" aria-hidden /> Codex
        </button>
        {props.note && (
          <p className="rounded-full bg-[#c9a227] px-3 py-1 text-sm font-bold" role="status" data-toast>
            {props.note}
          </p>
        )}
        <Inventory run={run} />
      </div>
    </section>
  );
}

/** What you've found out on this floor. */
function Log({ floor, run, place }: { floor: Floor; run: RunState; place(door: DoorId): number }) {
  const lines: string[] = [];
  for (const [d, sound] of Object.entries(run.play.knocks)) if (sound) lines.push(`${CAPTIONS[sound].icon} Behind door ${place(Number(d))}: ${CAPTIONS[sound].text}.`);
  if (run.play.answer) lines.push(`🎩 You asked: “${questionText(run.play.answer.question)}” Mr. Hinges: “${run.play.answer.yes ? "Yes." : "No."}”`);
  for (const [d, truth] of Object.entries(run.play.coins)) lines.push(`🪙 The Truth Coin says door ${place(Number(d))}'s sign ${truth ? "tells the truth" : "is lying"}.`);
  for (const [d, up] of Object.entries(run.play.peeks)) lines.push(`🔧 Through door ${place(Number(d))}'s crack: ${up ? "the stairs go up!" : "a blank wall."}`);
  for (const d of run.play.opened) lines.push(`✗ Door ${place(d)} wasn't the ${wayWord(floor)}.`);
  if (run.play.lucky) lines.push(`🎲 You picked door ${run.play.lucky.picked}. He opened door ${run.play.lucky.opened}: nothing there.`);
  if (!lines.length) return null;
  return (
    <ul className="mt-3 grid gap-0.5 text-[0.95rem]" aria-live="polite" data-log>
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

function Inventory({ run }: { run: RunState }) {
  const items = run.items;
  const chips: Array<[string, React.ReactNode]> = [];
  chips.push([`${knocksAllowed(run)} knocks a floor`, <Ear key="e" className="size-4" aria-hidden />]);
  if (items.truthCoin) chips.push([`Truth Coin ×${items.truthCoin}`, <ItemSvg key="c" kind="truthCoin" className="size-4" />]);
  if (items.crowbar) chips.push([`Crowbar ×${items.crowbar}`, <ItemSvg key="b" kind="crowbar" className="size-4" />]);
  if (items.chalk) chips.push(["Chalk", <ItemSvg key="k" kind="chalk" className="size-4" />]);
  if (items.lantern) chips.push(["Lantern", <ItemSvg key="l" kind="lantern" className="size-4" />]);
  if (items.stethoscope) chips.push(["Stethoscope", <ItemSvg key="s" kind="stethoscope" className="size-4" />]);
  return (
    <div className="ml-auto flex flex-wrap items-center gap-1.5" aria-label="What you carry" data-inventory>
      {chips.map(([label, icon]) => (
        <span key={label} className={styles.chip}>
          {icon} {label}
        </span>
      ))}
      <span className={styles.chip} aria-label={`${run.keys} keys`}>
        <KeySvg className="size-4 text-[#836919]" /> ×{run.keys}
      </span>
    </div>
  );
}
