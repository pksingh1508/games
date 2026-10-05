"use client";

// The Quit ending (Plan/04-dont-trust-the-game.md §5, §7 "Trust Issues meter"): HELPER says thanks, and the game
// shows how many lies you believed and how many truths you doubted. Then you're back in the arcade, for real.
// In Truth Mode, a short honest goodbye instead.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { shareResult } from "@/games/shared/share";
import { cn } from "@/lib/cn";
import styles from "../dttg.module.css";
import { shareText, trustReport } from "../progress";
import type { DttgSave } from "../save";
import { SECRET_COUNT } from "../story/secrets";
import { HelperFace } from "../ui/Helper";

export function QuitEnding({ save, truth, onTitle }: { save: DttgSave; truth: boolean; onTitle: () => void }) {
  const router = useRouter();
  const r = trustReport(save);
  const [shared, setShared] = useState<string | null>(null);

  if (truth) {
    return (
      <div className={cn(styles.full, styles.title)} data-ending="truth">
        <div className="size-24">
          <HelperFace honest />
        </div>
        <p className={styles.realTitle}>That&apos;s all of them.</p>
        <p className="max-w-md text-lg font-bold">Every lie, and the truth that was under it. Thanks for listening this time.</p>
        <button type="button" className={styles.cuteBtn} data-primary onClick={onTitle} data-to-title>
          Title
        </button>
      </div>
    );
  }

  return (
    <div className={cn(styles.full, styles.title, "!gap-[2.5cqh]")} data-ending="quit">
      <div className="size-20 opacity-80">
        <HelperFace honest />
      </div>
      <p className={styles.realTitle}>Thanks for playing with me.</p>
      <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4" data-trust-report>
        {[
          ["Lies you believed", r.believed],
          ["Truths you doubted", r.doubted],
          ["Secrets", `${r.secrets}/${SECRET_COUNT}`],
          ["Deaths", r.deaths],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border-2 border-[#2d1b4e] bg-white p-2" data-stat={label}>
            <div className="text-2xl font-extrabold text-[#c2306f]">{value}</div>
            <div className="text-xs font-bold">{label}</div>
          </div>
        ))}
      </div>
      <div className={styles.titleBtns}>
        <button type="button" className={styles.cuteBtn} data-primary onClick={() => router.push("/")} data-to-arcade>
          Back to the arcade
        </button>
        <button
          type="button"
          className={styles.cuteBtn}
          onClick={async () => {
            const out = await shareResult(shareText(r, `${window.location.origin}/games/dont-trust-the-game`));
            setShared(out === "copied" ? "Copied!" : out === "shared" ? "Shared!" : "Couldn't share.");
          }}
          data-share
        >
          {shared ?? "Share"}
        </button>
      </div>
    </div>
  );
}
