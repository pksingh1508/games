"use client";

// Your journal (Plan/03-99-seconds.md §8.4): everything you've found, in your own handwriting. Facts grouped by
// chapter, the timed events on a timeline (they happen at the same second every loop), codes and the notes you
// found, and the scratches that appeared on the walls. In Normal mode, opening it stops the clock.
import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ChapterProgress } from "../core/memory";
import { CHAPTERS, type ChapterId, type Clue } from "../core/types";
import styles from "../ninety.module.css";
import { CHAPTER_DEFS } from "../rooms";

type Tab = "facts" | "timeline" | "codes" | "walls";

interface Found {
  clue: Clue;
  chapter: ChapterId;
  loop: number;
}

export function Journal({ progress, chapter, onClose }: { progress: Record<ChapterId, ChapterProgress>; chapter: ChapterId; onClose(): void }) {
  const [tab, setTab] = useState<Tab>("facts");
  const found: Found[] = CHAPTERS.flatMap((c) =>
    Object.entries(progress[c].clues)
      .map(([id, at]) => ({ clue: CHAPTER_DEFS[c].clues.find((x) => x.id === id)!, chapter: c, loop: at.loop }))
      .filter((f) => f.clue),
  );
  const reached = CHAPTERS.filter((c) => c === chapter || Object.keys(progress[c].clues).length > 0);
  const tabs: Array<[Tab, string]> = [
    ["facts", "Facts"],
    ["timeline", "Timeline"],
    ["codes", "Codes & notes"],
    ["walls", "On the walls"],
  ];
  const line = (f: Found) => (
    <li key={`${f.chapter}:${f.clue.id}`} className={styles.entry} data-journal-entry={f.clue.id}>
      {f.clue.text}
      {f.clue.note && <strong> “{f.clue.note}”</strong>}
      {f.clue.code && f.clue.kind === "code" && <strong> {f.clue.code}</strong>}
      <span className="ml-2 text-base opacity-50">(loop {f.loop})</span>
    </li>
  );
  return (
    <div className={styles.journal} role="dialog" aria-label="Your journal" data-journal>
      <div className="flex items-start justify-between gap-3">
        <h2 className={cn(styles.hand, "text-4xl font-bold")}>Journal</h2>
        <button type="button" className={cn(styles.btn, "!min-h-9 !bg-transparent !px-2 !text-[var(--n9-paper-ink)]")} onClick={onClose} aria-label="Close the journal (J)" data-close-journal>
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className={styles.tabs} role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.tab} onClick={() => setTab(id)} data-tab={id}>
            {label}
          </button>
        ))}
      </div>
      {tab === "facts" &&
        reached.map((c) => {
          const facts = found.filter((f) => f.chapter === c && f.clue.kind === "fact");
          return (
            <section key={c} className="mb-3">
              <h3 className={cn(styles.hand, "text-2xl font-bold underline decoration-[#c9776a]")}>{CHAPTER_DEFS[c].title}</h3>
              {facts.length ? <ul>{facts.map(line)}</ul> : <p className={styles.entry}>Nothing yet. Look around.</p>}
            </section>
          );
        })}
      {tab === "timeline" &&
        reached.map((c) => {
          const events = found.filter((f) => f.chapter === c && f.clue.kind === "event").sort((x, y) => (y.clue.at ?? 0) - (x.clue.at ?? 0));
          return (
            <section key={c} className="mb-3">
              <h3 className={cn(styles.hand, "text-2xl font-bold underline decoration-[#c9776a]")}>{CHAPTER_DEFS[c].title}</h3>
              {events.length ? (
                <ol>
                  {events.map((f) => (
                    <li key={f.clue.id} className={styles.entry} data-journal-entry={f.clue.id}>
                      <strong className="mr-2 inline-block w-10 text-right">{f.clue.at}</strong>
                      {f.clue.text}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.entry}>No timed events noted. Things happen at the same second every loop.</p>
              )}
            </section>
          );
        })}
      {tab === "codes" && (
        <section>
          {found.some((f) => f.clue.kind === "code" || f.clue.kind === "note" || f.clue.code) ? (
            <ul>
              {found
                .filter((f) => f.clue.kind === "code" || f.clue.kind === "note" || f.clue.code)
                .map((f) => (
                  <li key={`${f.chapter}:${f.clue.id}`} className={styles.entry} data-journal-entry={f.clue.id}>
                    {f.clue.kind === "note" ? "In your handwriting: " : ""}
                    <strong>{f.clue.note ?? f.clue.code}</strong>
                    <span className="ml-2 text-base opacity-60">({f.clue.text})</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className={styles.entry}>No codes, no notes. Yet.</p>
          )}
        </section>
      )}
      {tab === "walls" && (
        <section>
          {progress[chapter].scratches.length ? (
            <ul>
              {progress[chapter].scratches.map((s, i) => (
                <li key={i} className={styles.entry}>
                  “{s}”
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.entry}>The walls are clean. For now.</p>
          )}
        </section>
      )}
    </div>
  );
}
