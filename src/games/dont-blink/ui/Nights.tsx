"use client";

// Choosing a night (Plan/14-dont-blink.md §5), and the manager's note before it starts (§8.2: "Night 1 — 00:00",
// plus a short note). Nights open one after another; Endless and Custom open once you've survived a full shift.
import { Check, ChevronLeft, Infinity as InfinityIcon, Lock, Moon, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { cn } from "@/lib/cn";
import type { CustomNight } from "../core/nights";
import styles from "../dont-blink.module.css";
import { hoursText, isCleared, isOpen, modesOpen, NIGHT_NUMBERS, RANK_NAMES } from "../progress";
import { dontBlinkSave, type DontBlinkSave } from "../save";

export const NIGHT_INFO: Record<number, { name: string; feel: string; note: string[] }> = {
  1: {
    name: "Training",
    feel: "Three cameras, slow blinks, big changes.",
    note: [
      "Welcome to the Marlow. Tonight you only have three cameras: the Lobby, the Gallery and the Sculpture Hall.",
      "If anything changes, report it. Click it, say what's different, and the system puts it right. Please don't make things up. We can tell.",
      "Your shift ends at six.",
    ],
  },
  2: {
    name: "Full Shift",
    feel: "All five cameras. The statue starts to wander.",
    note: [
      "All five cameras from tonight.",
      "One more thing. The statue in the Sculpture Hall keeps turning up in other rooms, and nobody knows how. If you see it anywhere but its pedestal, report it as an intruder and it'll be put back.",
      "Whatever you do, don't let it near your office.",
    ],
  },
  3: {
    name: "Static",
    feel: "Switching cameras isn't safe any more.",
    note: [
      "The wiring here is older than some of the exhibits. Switching cameras gives you a moment of static, and the lights flicker.",
      "Things can change in the static too. Try not to switch more than you need to.",
    ],
  },
  4: {
    name: "Doubt",
    feel: "Did that change, or are you imagining it?",
    note: [
      "You're tired. Not every blink changes something, whatever it feels like.",
      "Some things change slowly, while you watch them. And I'm told things have been moving in the guard's office.",
      "Your office.",
    ],
  },
  5: {
    name: "It Knows",
    feel: "It knows where you aren't looking.",
    note: [
      "Last night of the week. It knows which rooms you haven't looked at in a while.",
      "Don't trust the clock. If you hear footsteps, look the other way.",
      "See you at six.",
    ],
  },
};

function Locked({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--db-dim)]">
      <Lock className="size-4" aria-hidden />
      {children}
    </span>
  );
}

export interface NightsProps {
  save: DontBlinkSave;
  onNight(n: number): void;
  onEndless(): void;
  onCustom(): void;
  onBack(): void;
}

export function NightSelect({ save, onNight, onEndless, onCustom, onBack }: NightsProps) {
  const modes = modesOpen(save);
  return (
    <div className={cn(styles.root, "min-h-[calc(100dvh-4rem)] px-4 py-6")} data-nights-screen>
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <button type="button" className={cn(styles.btn, "!min-h-10 !px-3")} onClick={onBack} data-back>
            <ChevronLeft className="size-4" aria-hidden /> Title
          </button>
          <h1 className={cn(styles.display, "text-4xl")}>The week of nights</h1>
        </div>
        <ol className="mt-6 grid gap-3">
          {NIGHT_NUMBERS.map((n) => {
            const open = isOpen(save, n);
            const record = save.nights[n];
            const info = NIGHT_INFO[n]!;
            return (
              <li key={n}>
                <button type="button" className={cn(styles.card, "flex w-full items-center gap-4 p-4 text-left disabled:opacity-60")} onClick={() => onNight(n)} disabled={!open} data-night-card={n} data-open={open ? "" : undefined}>
                  <span className={cn(styles.display, "w-14 shrink-0 text-center text-5xl text-[var(--db-green)]")}>{n}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn(styles.display, "block text-2xl")}>{info.name}</span>
                    <span className="block text-sm text-[var(--db-dim)]">{open ? info.feel : <Locked>Survive Night {n - 1} first</Locked>}</span>
                  </span>
                  {record && record.clears > 0 && (
                    <span className="flex shrink-0 flex-col items-end gap-1 text-sm">
                      <span className="rounded-full border border-[var(--db-green-deep)] px-2.5 py-0.5 text-[var(--db-green)]" data-rank={record.best ?? ""}>
                        {record.best ? RANK_NAMES[record.best] : "Survived"}
                      </span>
                      {record.perfect && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--db-dim)]" data-perfect>
                          <Check className="size-3.5" aria-hidden /> no false reports
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className={cn(styles.card, "flex items-start gap-3 p-4 text-left disabled:opacity-60")} onClick={onEndless} disabled={!modes} data-endless>
            <InfinityIcon className="mt-1 size-6 shrink-0 text-[var(--db-green)]" aria-hidden />
            <span>
              <span className={cn(styles.display, "block text-2xl")}>Endless Night</span>
              <span className="block text-sm text-[var(--db-dim)]">
                {modes ? (save.endless.best > 0 ? `No morning. Best: ${hoursText(save.endless.best)}.` : "No morning. Every hour, worse.") : <Locked>Survive Night 2 first</Locked>}
              </span>
            </span>
          </button>
          <button type="button" className={cn(styles.card, "flex items-start gap-3 p-4 text-left disabled:opacity-60")} onClick={onCustom} disabled={!modes} data-custom>
            <SlidersHorizontal className="mt-1 size-6 shrink-0 text-[var(--db-green)]" aria-hidden />
            <span>
              <span className={cn(styles.display, "block text-2xl")}>Custom Night</span>
              <span className="block text-sm text-[var(--db-dim)]">{modes ? "Your night, your rules." : <Locked>Survive Night 2 first</Locked>}</span>
            </span>
          </button>
        </div>
        {isCleared(save, 5) && !save.ending && <p className="mt-4 text-sm text-[var(--db-dim)]">Someone at the front desk has been asking about you.</p>}
      </div>
    </div>
  );
}

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="grid gap-1">
      <span className="flex justify-between text-sm">
        <strong>{label}</strong>
        <span className="text-[var(--db-dim)]">{show}</span>
      </span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[#7CFFB2]" data-custom-setting={id} />
    </label>
  );
}

export function CustomPanel({ custom, onStart, onBack }: { custom: CustomNight; onStart(): void; onBack(): void }) {
  const set = (change: Partial<CustomNight>) => dontBlinkSave.update((s) => ({ ...s, custom: { ...s.custom, ...change } }));
  const toggles: Array<{ key: "staticBlink" | "fakeBlink" | "gradual" | "office" | "mirror"; label: string; about: string }> = [
    { key: "staticBlink", label: "Static blinks", about: "Camera static and power cuts hide changes too." },
    { key: "fakeBlink", label: "Fake blinks", about: "Your eyes flutter. Nothing changes. Probably." },
    { key: "gradual", label: "Slow changes", about: "Some things change while you watch." },
    { key: "office", label: "Your office", about: "Your own room changes too." },
    { key: "mirror", label: "Mirror World", about: "Whole pictures flip. Read the signs." },
  ];
  return (
    <div className={cn(styles.root, "min-h-[calc(100dvh-4rem)] px-4 py-6")} data-custom-screen>
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-3">
          <button type="button" className={cn(styles.btn, "!min-h-10 !px-3")} onClick={onBack} data-back>
            <ChevronLeft className="size-4" aria-hidden /> Nights
          </button>
          <h1 className={cn(styles.display, "text-4xl")}>Custom Night</h1>
        </div>
        <div className={cn(styles.card, "mt-6 grid gap-4 p-5")}>
          <Slider id="blink" label="Blinks every" value={custom.blink} min={2} max={8} step={0.5} show={`${custom.blink.toFixed(1)} s`} onChange={(blink) => set({ blink })} />
          <Slider id="rate" label="Changes an hour" value={custom.rate} min={1} max={10} step={0.5} show={custom.rate.toFixed(1)} onChange={(rate) => set({ rate })} />
          <Slider id="subtlety" label="Subtlest changes" value={custom.subtlety} min={1} max={5} step={1} show={["", "Obvious", "Clear", "Medium", "Subtle", "Very subtle"][custom.subtlety]!} onChange={(subtlety) => set({ subtlety })} />
          <Slider id="visitor" label="The Visitor" value={Math.round(custom.visitor * 100)} min={0} max={100} step={5} show={custom.visitor === 0 ? "Stays put" : `${Math.round(custom.visitor * 100)}% restless`} onChange={(v) => set({ visitor: v / 100 })} />
          <div className="divide-y divide-[var(--db-line)]">
            {toggles.map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-3 py-2.5">
                <label htmlFor={`db-custom-${t.key}`} className="min-w-0">
                  <strong className="block">{t.label}</strong>
                  <span className="text-sm text-[var(--db-dim)]">{t.about}</span>
                </label>
                <ToggleSwitch id={`db-custom-${t.key}`} label={t.label} checked={custom[t.key]} onCheckedChange={(on) => set({ [t.key]: on })} />
              </div>
            ))}
          </div>
        </div>
        <button type="button" className={cn(styles.btn, styles.primary, "mt-5 w-full !min-h-12 text-lg")} onClick={onStart} data-start-custom>
          <Moon className="size-5" aria-hidden /> Start the night
        </button>
      </div>
    </div>
  );
}

export function Intro({ heading, note, assist, onStart, onBack }: { heading: string; note: string[]; assist: boolean; onStart(): void; onBack(): void }) {
  return (
    <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-intro>
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <p className="font-[family-name:var(--font-g-vt323)] text-2xl tracking-[0.2em] text-[var(--db-green)]">00:00</p>
        <h1 className={cn(styles.display, "mt-1 text-6xl")}>{heading}</h1>
        <div className={cn(styles.note, "mt-7 text-left")} data-note>
          {note.map((line) => (
            <p key={line} className="mt-2 first:mt-0">
              {line}
            </p>
          ))}
          <p className="mt-4 text-right italic">R. Marlow, Manager</p>
        </div>
        {assist && <p className="mt-4 text-sm text-[var(--db-dim)]">Assist mode: unlimited photos, slower blinks, no credibility penalty.</p>}
        <div className="mt-7 flex gap-3">
          <button type="button" className={cn(styles.btn, "!min-h-12")} onClick={onBack} data-back>
            <ChevronLeft className="size-4" aria-hidden /> Back
          </button>
          <button type="button" className={cn(styles.btn, styles.primary, "!min-h-12 px-6 text-lg")} onClick={onStart} data-start>
            <Moon className="size-5" aria-hidden /> Start the shift
          </button>
        </div>
      </div>
    </div>
  );
}
