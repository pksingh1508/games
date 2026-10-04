"use client";

// How to play, the codex, trophies and options (Plan/13-wrong-door.md §8.6, §11): the codex is an
// illustrated notebook of every clue, floor, tool and misfortune you've met; options has Relaxed mode (no
// timer in the Wrong Room) and bigger sign text.
import Link from "next/link";
import { Trophy } from "lucide-react";
import { ToggleSwitch } from "@/components/settings/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { useSave } from "@/engine/save";
import { settingsSave } from "@/engine/settings";
import { cn } from "@/lib/cn";
import { WRONG_DOOR_ACHIEVEMENTS } from "../achievements";
import { CODEX, type CodexPage } from "../content/codex";
import { ITEM_KINDS, type ItemKind } from "../logic/types";
import { wrongDoorSave } from "../save";
import styles from "../wrong-door.module.css";
import { ItemSvg } from "./art";

const PARTS: Array<[CodexPage["part"], string]> = [
  ["clues", "Clues"],
  ["floors", "Floors"],
  ["tools", "Tools"],
  ["misfortunes", "Misfortunes"],
];

export function CodexDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const save = useSave(wrongDoorSave);
  const found = CODEX.filter((p) => save.codex[p.id]).length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="The codex" description={`Every lying rule in the hotel is written down here. ${found} of ${CODEX.length} pages found.`} game="wrong-door" className="w-[min(94vw,46rem)]">
      <div className="grid gap-5" data-codex-dialog>
        {PARTS.map(([part, title]) => (
          <section key={part}>
            <h3 className={cn(styles.display, "text-xl")}>{title}</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CODEX.filter((p) => p.part === part).map((p) =>
                save.codex[p.id] ? (
                  <article key={p.id} className="rounded-xl border border-line p-3" data-page={p.id}>
                    <h4 className="flex items-center gap-2 font-bold">
                      {ITEM_KINDS.includes(p.id as ItemKind) && <ItemSvg kind={p.id as ItemKind} className="size-5" />}
                      {p.title}
                    </h4>
                    {p.lines.map((l) => (
                      <p key={l} className="mt-1 text-sm">
                        {l}
                      </p>
                    ))}
                  </article>
                ) : (
                  <article key={p.id} className="rounded-xl border border-dashed border-line p-3 opacity-60" aria-label="A page you haven't found yet">
                    <h4 className="font-bold">???</h4>
                    <p className="mt-1 text-sm">You haven&apos;t met this yet.</p>
                  </article>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="How to play" game="wrong-door">
      <div className="grid gap-3 text-[0.98rem]">
        <p>Climb from the lobby to floor 13. Every floor has a few doors; one is the way up. Pick wrong and something bad happens: you might fall back down the stairs, get shut in the Wrong Room, be cursed, or lose a key. Run out of keys and the run is over.</p>
        <p>
          <strong>Read the brass plaque first.</strong> It never lies, and it tells you how many signs do. Then gather clues: knock on doors and listen (two knocks a floor), look for light under them, watch which way the candle flame leans, follow footprints by their toes, and ask Mr. Hinges one question. In his red hat, he lies.
        </p>
        <p>Every lie has a rule, and every rule is in the codex. After a wrong door, the Truth Reveal shows you exactly why.</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-1">Do</th>
              <th>Computer</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Look at a door", "Click it, or 1–5", "Tap it"],
              ["Knock and listen", "Hold click, or K", "Hold the door"],
              ["Open it", "Enter (then confirm)", "Open (then confirm)"],
              ["Ask Mr. Hinges", "Click him, or Q", "Tap him"],
              ["Codex", "C", "Codex button"],
              ["Pause", "Esc", "☰ button"],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-t border-line">
                <td className="py-1 font-semibold">{a}</td>
                <td>{b}</td>
                <td>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}

export function TrophyCase({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const save = useSave(wrongDoorSave);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Trophies" game="wrong-door">
      <ul className="grid gap-2">
        {WRONG_DOOR_ACHIEVEMENTS.map((a) => {
          const got = !!save.achievements[a.id];
          return (
            <li key={a.id} className={cn("flex items-start gap-3 rounded-xl border border-line p-3", !got && "opacity-60")} data-trophy={a.id} data-got={got ? "" : undefined}>
              <Trophy className={cn("mt-0.5 size-5 shrink-0", got ? "text-accent-ink" : "")} aria-hidden />
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-sm">{got ? a.description : a.hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-surface">
        Stats: {save.stats.escapes} escapes, {save.stats.floors} floors climbed, {save.stats.wrongDoors} wrong doors, {save.stats.anomalies} anomalies spotted.
      </p>
    </Dialog>
  );
}

export function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const save = useSave(wrongDoorSave);
  const settings = useSave(settingsSave);
  const setPrefs = (change: Partial<typeof save.prefs>) => wrongDoorSave.update((s) => ({ ...s, prefs: { ...s.prefs, ...change } }));
  const rows: Array<{ id: string; title: string; text: React.ReactNode; checked: boolean; set(v: boolean): void }> = [
    { id: "wd-relaxed", title: "Relaxed mode", text: "No timer in the Wrong Room. Take as long as you like to find the draft.", checked: save.prefs.relaxed, set: (relaxed) => setPrefs({ relaxed }) },
    { id: "wd-big", title: "Bigger signs", text: "Sign text on the clue board in a larger size.", checked: save.prefs.bigSigns, set: (bigSigns) => setPrefs({ bigSigns }) },
    {
      id: "wd-sound",
      title: "Sound",
      text: (
        <>
          Knocks, the sounds behind doors (every one has a caption too) and the lobby&apos;s music. Volumes live in the{" "}
          <Link href="/settings" className="underline underline-offset-2">
            arcade&apos;s comfort settings
          </Link>
          .
        </>
      ),
      checked: settings.sound,
      set: (sound) => settingsSave.update((s) => ({ ...s, sound })),
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Options" game="wrong-door">
      <div className="divide-y divide-[color-mix(in_oklab,var(--ink)_10%,transparent)]">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <div className="min-w-0 flex-1 basis-56">
              <label className="font-bold" htmlFor={r.id}>
                {r.title}
              </label>
              <p className="text-sm text-muted-surface">{r.text}</p>
            </div>
            <ToggleSwitch id={r.id} label={r.title} checked={r.checked} onCheckedChange={r.set} />
          </div>
        ))}
      </div>
    </Dialog>
  );
}
