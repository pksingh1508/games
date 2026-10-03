"use client";

// The practice room (Plan/09-one-tap-chaos.md §5): any unlocked microgame or boss, on its own,
// at any speed, optionally under one Chaos Card you've met.
import { ArrowLeft, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { TIERS } from "../core/timing";
import { BOSSES, BOSS_ORDER, MICROGAMES, MICROGAME_IDS, unlockedMicrogames, unlockScore } from "../microgames";
import type { BossId, MicrogameId } from "../microgames/types";
import { CARD_ORDER, RULES, type RuleId } from "../rules";
import type { OtcSave } from "../save";
import styles from "../otc.module.css";
import { MicrogameIcon, RuleIcon } from "./icons";

export function PracticeRoom({
  save,
  onPlay,
  onBack,
}: {
  save: OtcSave;
  onPlay: (game: MicrogameId | BossId, tier: number, rule: RuleId | null) => void;
  onBack: () => void;
}) {
  const [tier, setTier] = useState(1);
  const [rule, setRule] = useState<RuleId | null>(null);
  const open = new Set(unlockedMicrogames(save.best));
  const cards = CARD_ORDER.slice(0, save.cardsUnlocked);

  return (
    <section className={cn(styles.stage, "min-h-[calc(100dvh-4rem)] px-4 py-8 text-[#1B1B1B] sm:px-8")}>
      <div className={styles.rays} aria-hidden />
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={onBack} className="btn btn-secondary btn-sm" data-sound="click">
          <ArrowLeft className="size-4" aria-hidden /> Menu
        </button>
        <h1 className={cn(styles.show, "mt-4 text-4xl sm:text-5xl")}>Practice room</h1>
        <p className="mt-2 max-w-xl text-lg">Pick a microgame and drill it. No lives to lose, and nothing here counts toward your best.</p>

        <div className="mt-6 grid gap-4 rounded-[1.75rem] border-[3px] border-[#1B1B1B] bg-white/85 p-5 sm:grid-cols-2">
          <fieldset>
            <legend className="font-mono text-xs font-bold uppercase tracking-wider text-[#626262]">Speed</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Speed">
              {TIERS.map((bpm, i) => (
                <button
                  key={bpm}
                  type="button"
                  role="radio"
                  aria-checked={tier === i + 1}
                  onClick={() => setTier(i + 1)}
                  className={cn(
                    "rounded-xl border-[3px] border-[#1B1B1B] px-3 py-1.5 font-mono text-sm font-bold",
                    tier === i + 1 ? "bg-[#1B1B1B] text-[#FFD23F]" : "bg-white hover:bg-[#FFF3B0]",
                  )}
                  data-sound="click"
                >
                  {i + 1} · {bpm}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-mono text-xs font-bold uppercase tracking-wider text-[#626262]">Chaos card</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Chaos card">
              {[null, ...cards].map((card) => (
                <button
                  key={card ?? "none"}
                  type="button"
                  role="radio"
                  aria-checked={rule === card}
                  onClick={() => setRule(card)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border-[3px] border-[#1B1B1B] px-2.5 py-1.5 text-sm font-bold",
                    rule === card ? "bg-[#1B1B1B] text-[#FFD23F]" : "bg-white hover:bg-[#FFF3B0]",
                  )}
                  data-sound="click"
                >
                  {card ? <RuleIcon rule={card} className="size-4" /> : null}
                  {card ? RULES[card].name : "None"}
                </button>
              ))}
              {cards.length < CARD_ORDER.length && (
                <span className="flex items-center gap-1 px-2 text-sm text-[#626262]">
                  <Lock className="size-3.5" aria-hidden /> {CARD_ORDER.length - cards.length} more to meet in a run
                </span>
              )}
            </div>
          </fieldset>
        </div>

        <h2 className={cn(styles.show, "mt-8 text-2xl")}>Microgames</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MICROGAME_IDS.map((id) => {
            const game = MICROGAMES[id];
            const unlocked = open.has(id);
            const allowed = !rule || RULES[rule].allows(game);
            const record = save.practice[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!unlocked || !allowed}
                  onClick={() => onPlay(id, tier, rule)}
                  className={cn(
                    "flex h-full w-full flex-col items-center gap-2 rounded-2xl border-[3px] border-[#1B1B1B] p-3 text-center shadow-[0_4px_0_#1B1B1B] transition-transform",
                    unlocked && allowed ? "bg-white hover:-translate-y-0.5" : "cursor-not-allowed bg-white/50 opacity-70",
                  )}
                  data-sound="click"
                >
                  <span className="grid size-16 place-items-center rounded-xl" style={{ background: unlocked ? game.bg : "#D9D9D9" }}>
                    {unlocked ? <MicrogameIcon id={id} className="size-12" /> : <Lock className="size-7" aria-hidden />}
                  </span>
                  <span className={cn(styles.show, "text-lg leading-tight")}>{unlocked ? game.instruction : "???"}</span>
                  <span className="text-xs leading-snug text-[#3D3D3D]">
                    {!unlocked
                      ? `Score ${unlockScore(id)} in a run to unlock`
                      : !allowed
                        ? `Not dealt under ${RULES[rule!].name}`
                        : record
                          ? `✓ ${record.wins} · ✖ ${record.losses}`
                          : game.hint}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <h2 className={cn(styles.show, "mt-8 text-2xl")}>Bosses</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {BOSS_ORDER.map((id) => {
            const boss = BOSSES[id];
            const met = save.bossesSeen.includes(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!met}
                  onClick={() => onPlay(id, tier, null)}
                  className={cn(
                    "flex h-full w-full items-center gap-3 rounded-2xl border-[3px] border-[#1B1B1B] p-3 text-left shadow-[0_4px_0_#1B1B1B]",
                    met ? "bg-white hover:-translate-y-0.5" : "cursor-not-allowed bg-white/50 opacity-70",
                  )}
                  data-sound="click"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl" style={{ background: met ? boss.bg : "#D9D9D9" }}>
                    {met ? <MicrogameIcon id={id} className="size-11" /> : <Lock className="size-6" aria-hidden />}
                  </span>
                  <span>
                    <span className={cn(styles.show, "block text-lg leading-tight")}>{met ? boss.name : "A boss"}</span>
                    <span className="text-xs text-[#3D3D3D]">{met ? boss.hint : `Reach round ${(BOSS_ORDER.indexOf(id) + 1) * 10} to meet this one`}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
