"use client";

import { AnimatePresence, m } from "motion/react";
import { Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  CATEGORY_LABELS,
  INPUT_LABELS,
  type GameCategory,
  type InputKind,
} from "@/games/registry";
import { cn } from "@/lib/cn";

export interface BrowserItem {
  slug: string;
  title: string;
  genre: string;
  tagline: string;
  category: GameCategory;
  inputs: InputKind[];
  /** The server-rendered card (no cover-art JavaScript is shipped). */
  card: ReactNode;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as GameCategory[];
const INPUTS: InputKind[] = ["keyboard", "mouse", "touch", "one-button", "gamepad"];

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-sound="tick"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "border-transparent bg-ink-on-bg text-bg shadow-[0_4px_0_0_var(--accent)]"
          : "border-line text-muted hover:border-[color-mix(in_oklab,var(--ink-on-bg)_35%,transparent)] hover:text-ink-on-bg",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("font-mono text-xs", active ? "text-bg/70" : "text-muted")}>{count}</span>
      )}
    </button>
  );
}

/** Filterable grid of game cabinets. */
export function GameBrowser({
  items,
  advanced = false,
  rail = false,
}: {
  items: BrowserItem[];
  /** Search and input filters (the full library page). */
  advanced?: boolean;
  /** On phones, a swipeable row instead of a long stack. */
  rail?: boolean;
}) {
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [input, setInput] = useState<InputKind | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (input === "all" || item.inputs.includes(input)) &&
        (!q || `${item.title} ${item.genre} ${item.tagline}`.toLowerCase().includes(q)),
    );
  }, [items, category, input, query]);

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, items.filter((i) => i.category === c).length])),
    [items],
  );

  const clear = () => {
    setCategory("all");
    setInput("all");
    setQuery("");
  };

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <FilterChip active={category === "all"} onClick={() => setCategory("all")} count={items.length}>
            All games
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)} count={counts[c]}>
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
        </div>
        {advanced && (
          <label className="relative block w-full lg:w-80">
            <span className="sr-only">Search games</span>
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the arcade…"
              className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-ink placeholder:text-muted-surface focus:border-accent focus:outline-none"
            />
          </label>
        )}
      </div>

      {advanced && (
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by controls">
          <span className="pixel-label mr-1 text-[0.7rem] text-muted">Plays with</span>
          <FilterChip active={input === "all"} onClick={() => setInput("all")}>
            Anything
          </FilterChip>
          {INPUTS.map((i) => (
            <FilterChip key={i} active={input === i} onClick={() => setInput(i)}>
              {INPUT_LABELS[i]}
            </FilterChip>
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "game" : "games"} shown
      </p>

      <m.ul
        layout
        layoutScroll={rail}
        className={cn(
          "mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
          rail &&
            "max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:gap-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-2 max-sm:[scrollbar-width:none]",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map((item) => (
            <m.li
              key={item.slug}
              layout
              className={cn(rail && "max-sm:w-[84%] max-sm:shrink-0 max-sm:snap-start")}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              {item.card}
            </m.li>
          ))}
        </AnimatePresence>
      </m.ul>

      {rail && filtered.length > 1 && (
        <p aria-hidden className="mt-4 text-center font-mono text-xs text-muted sm:hidden">
          Swipe for more cabinets →
        </p>
      )}

      {filtered.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-3xl font-extrabold">NOPE.</p>
          <p className="mt-2 text-muted">No cabinet matches that. The arcade isn&apos;t lying this time.</p>
          <button type="button" onClick={clear} className="btn btn-secondary btn-sm mt-6" data-sound="click">
            <X className="size-4" aria-hidden /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
