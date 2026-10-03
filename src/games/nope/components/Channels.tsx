"use client";

// Episode select, styled as a TV with four channels (Plan/02-nope.md §8). Locked channels show
// static and "no signal".
import { ArrowLeft, Lock, Play, RotateCcw, Star } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { useSave } from "@/engine/save";
import { cn } from "@/lib/cn";
import styles from "../nope.module.css";
import { EPISODES, loadEpisode } from "../questions/episodes";
import { EPISODE_IDS, episodeKey, nopeSave, type EpisodeId } from "../save";
import { sfx } from "../sfx";
import { formatTime } from "../state/run";
import { Backdrop } from "./Backdrop";
import { MrNope } from "./MrNope";

export function ChannelSelect({
  onPlay,
  onRestart,
  onBack,
  reducedMotion,
}: {
  onPlay: (episode: EpisodeId) => void;
  onRestart: (episode: EpisodeId) => void;
  onBack: () => void;
  reducedMotion: boolean;
}) {
  const save = useSave(nopeSave);
  const suggested = (save.run?.episode ?? Math.min(save.unlocked, 4)) as EpisodeId;
  const [channel, setChannel] = useState<EpisodeId>(suggested);

  // Warm up the most likely episode, so Start is instant.
  useEffect(() => {
    void loadEpisode(suggested);
  }, [suggested]);

  const info = EPISODES[channel];
  const record = save.episodes[episodeKey(channel)];
  const locked = channel > save.unlocked;
  const running = save.run?.episode === channel ? save.run : null;

  const tune = (id: EpisodeId) => {
    if (id === channel) return;
    sfx.static();
    setChannel(id);
    if (id <= save.unlocked) void loadEpisode(id);
  };

  return (
    <div className={cn(styles.stage, "min-h-[calc(100dvh-4rem)] px-4 pb-16 pt-6 sm:pt-8")}>
      <Backdrop theme="day" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="btn btn-ghost btn-sm text-[#FFF4D6]" data-sound="click">
            <ArrowLeft className="size-4" aria-hidden /> Title
          </button>
          <p className="pixel-label text-[0.7rem] text-[#FFC93C]">Channel guide</p>
        </div>

        <h1 className={cn(styles.comic, styles.logoText, "mt-2 text-center text-[clamp(2.4rem,7vw,3.8rem)] leading-none")}>
          What&apos;s on tonight?
        </h1>

        {/* The TV set */}
        <div className="mx-auto mt-6 grid max-w-3xl gap-4 rounded-[2.5rem] border-[4px] border-[#161414] bg-[#7A4A2A] p-4 shadow-[0_18px_0_0_rgba(0,0,0,0.45),inset_0_0_0_6px_#94603B] sm:grid-cols-[1fr_9.5rem] sm:p-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] sm:aspect-[16/11] border-[5px] border-[#161414] bg-[#0B0909] shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={channel}
                className="absolute inset-0"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.02 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.02 }}
                transition={{ duration: 0.18 }}
              >
                {locked ? (
                  <div className="grid size-full place-items-center">
                    <div aria-hidden className={cn("absolute inset-0 opacity-50", !reducedMotion && styles.static)} />
                    <div className="relative rounded-2xl bg-[#0B0909]/85 px-6 py-5 text-center">
                      <Lock className="mx-auto size-8 text-[#FFC93C]" aria-hidden />
                      <p className={cn(styles.comic, "mt-2 text-4xl tracking-wider text-[#FFF4D6]")}>No signal</p>
                      <p className="mt-1 text-sm text-[#9B9483]">Clear Episode {channel - 1} to tune in.</p>
                    </div>
                  </div>
                ) : (
                  <div className={cn("flex size-full flex-col items-center justify-center gap-3 px-6 text-center", CHANNEL_BG[channel])}>
                    <p className="pixel-label rounded-full bg-[#161414]/70 px-3 py-1 text-[0.65rem] text-[#FFF4D6]">Channel {channel} · Episode {channel}</p>
                    <h2 className={cn(styles.comic, styles.logoText, "text-[clamp(2.2rem,6.5vw,3.8rem)] leading-[0.9]")}>{info.name}</h2>
                    <p className={cn(styles.show, "max-w-sm text-lg text-[#FFF4D6] [text-shadow:0_2px_0_#161414]")}>{info.tagline}</p>
                    {record.clears > 0 ? (
                      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-[#FFF4D6]">
                        <span className="rounded-full bg-[#161414]/70 px-3 py-1">Best {record.bestScore?.toLocaleString("en-US")} pts</span>
                        {record.bestTimeMs !== null && <span className="rounded-full bg-[#161414]/70 px-3 py-1">Fastest {formatTime(record.bestTimeMs)}</span>}
                        {record.perfect && (
                          <span className="flex items-center gap-1 rounded-full bg-[#FFC93C] px-3 py-1 font-bold text-[#161414]">
                            <Star className="size-3" fill="currentColor" aria-hidden /> Perfect
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 rounded-full bg-[#161414]/70 px-3 py-1 font-mono text-xs text-[#FFF4D6]">
                        {running ? `In progress: question ${running.index + 1}` : "New episode"}
                      </p>
                    )}
                    {record.bestGrid && <p className="text-sm tracking-tight" aria-label="Best result grid">{record.bestGrid}</p>}
                  </div>
                )}
              </m.div>
            </AnimatePresence>
            <div aria-hidden className="scanlines pointer-events-none absolute inset-0 opacity-40" />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.6rem] shadow-[inset_0_0_80px_rgba(255,255,255,0.08)]" />
          </div>

          {/* Channel buttons */}
          <div className="flex flex-col gap-3">
            <div role="radiogroup" aria-label="Channels" className="grid grid-cols-4 gap-2 sm:grid-cols-1">
              {EPISODE_IDS.map((id) => {
                const isLocked = id > save.unlocked;
                const cleared = save.episodes[episodeKey(id)].clears > 0;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={channel === id}
                    aria-label={`Channel ${id}: ${EPISODES[id].name}${isLocked ? " (locked)" : cleared ? " (cleared)" : ""}`}
                    onClick={() => tune(id)}
                    className={cn(
                      "relative flex h-14 items-center justify-center gap-2 rounded-2xl border-[3px] border-[#161414] font-mono text-sm font-bold uppercase tracking-wider transition-transform active:translate-y-1",
                      channel === id
                        ? "bg-[#FFC93C] text-[#161414] shadow-[0_2px_0_0_#161414]"
                        : "bg-[#E8DCC0] text-[#161414] shadow-[0_5px_0_0_#161414] hover:-translate-y-0.5",
                    )}
                  >
                    <span className="hidden sm:inline">CH</span> {id}
                    {isLocked ? (
                      <Lock className="size-3.5" aria-hidden />
                    ) : cleared ? (
                      <Star className="size-3.5 fill-current" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div aria-hidden className="hidden flex-1 flex-col items-center justify-end gap-3 sm:flex">
              <div className="grid size-16 place-items-center rounded-full border-[3px] border-[#161414] bg-[#3A2416] shadow-[inset_0_-4px_0_rgba(0,0,0,0.4)]">
                <div className="h-6 w-1.5 rounded-full bg-[#E8DCC0]" style={{ rotate: `${(channel - 1) * 60 - 90}deg` }} />
              </div>
              <div className="h-14 w-full rounded-xl bg-[repeating-linear-gradient(90deg,#3A2416_0_4px,#5C3A22_4px_8px)]" />
            </div>
          </div>
        </div>

        {/* What to do */}
        <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {locked ? (
            <p className={cn(styles.show, "flex items-center gap-3 text-xl text-[#FFF4D6]")}>
              <MrNope mood="smug" className="h-14 w-auto" /> Nice try. It&apos;s locked.
            </p>
          ) : running ? (
            <>
              <button type="button" onClick={() => onPlay(channel)} className="btn btn-lg w-full sm:w-auto" data-sound="coin">
                <Play className="size-5" fill="currentColor" aria-hidden /> Continue (Q{running.index + 1})
              </button>
              <button type="button" onClick={() => onRestart(channel)} className="btn btn-secondary btn-lg w-full sm:w-auto" data-sound="click">
                <RotateCcw className="size-5" aria-hidden /> Start over
              </button>
            </>
          ) : (
            <button type="button" onClick={() => onPlay(channel)} className="btn btn-lg w-full sm:w-auto" data-sound="coin">
              <Play className="size-5" fill="currentColor" aria-hidden /> {record.clears > 0 ? `Replay episode ${channel}` : `Start episode ${channel}`}
            </button>
          )}
        </div>
        {save.run && save.run.episode !== channel && !locked && (
          <p className="mt-3 text-center text-sm text-[#9B9483]">
            Starting this channel ends your run in Episode {save.run.episode}.
          </p>
        )}
        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-[#9B9483]">{info.focus}</p>
      </div>
    </div>
  );
}

const CHANNEL_BG: Record<EpisodeId, string> = {
  1: "bg-[radial-gradient(circle_at_50%_30%,#6CC646,#1F5416)]",
  2: "bg-[radial-gradient(circle_at_50%_30%,#9FD8FF,#2B59C3)]",
  3: "bg-[radial-gradient(circle_at_50%_30%,#FFB86B,#C2306F)]",
  4: "bg-[radial-gradient(circle_at_50%_30%,#5B3FB0,#140F30)]",
};
