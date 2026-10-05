"use client";

// The ending (Plan/14-dont-blink.md §5 "The ending"): at 6:00 AM on the last night the sun comes up, the day
// guard arrives, looks at you and says "Who are you? We don't have a night guard." Then, after the credits, a
// morning photo of the Sculpture Hall: the Visitor back on its pedestal, wearing your hat.
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "../dont-blink.module.css";
import { paintRoom } from "../render/view";
import { SCENES } from "../scenes";
import { face, poly, rect, type G } from "../scenes/paint";

const LINES = ["…", "Who are you?", "We don't have a night guard."];

/** The day guard, in the lobby doorway, in the morning light. */
function dayGuard(g: G, x: number, y: number) {
  poly(g, [
    [x - 24, y],
    [x + 24, y],
    [x + 20, y - 92],
    [x - 20, y - 92],
  ], "#2b3a5e", "#141c30", 1.5);
  rect(g, x - 2, y - 92, 4, 50, "#c9a227");
  face(g, x, y - 108, 15, { skin: "#d9b391", hair: "#3a2a1c", eyes: "front", mouth: "flat" });
  poly(g, [
    [x - 17, y - 118],
    [x + 17, y - 118],
    [x + 15, y - 131],
    [x - 15, y - 131],
  ], "#1f2b4a", "#0d1426", 1);
  poly(g, [
    [x - 18, y - 118],
    [x + 24, y - 118],
    [x + 20, y - 114],
    [x - 18, y - 114],
  ], "#0d1426");
}

export function Ending({ reducedMotion, onSeen, onDone }: { reducedMotion: boolean; onSeen(): void; onDone(): void }) {
  const [stage, setStage] = useState<"dawn" | "photo">("dawn");
  const [line, setLine] = useState(0);
  const dawn = useRef<HTMLCanvasElement | null>(null);
  const photo = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = dawn.current;
    if (stage !== "dawn" || !canvas) return;
    // The front doors stand open.
    const states = new Map(SCENES.lobby.objects.map((o) => [o.id, o.id === "lobby.doors" ? { ...o.base, variant: "open" } : o.base] as const));
    const lobby = paintRoom("lobby", 1.5, { states });
    const g = canvas.getContext("2d")!;
    canvas.width = lobby.width;
    canvas.height = lobby.height;
    g.drawImage(lobby, 0, 0);
    g.scale(1.5, 1.5);
    // Morning through the open front doors, and the day guard in them.
    const light = g.createRadialGradient(320, 220, 10, 320, 220, 420);
    light.addColorStop(0, "rgba(255, 214, 160, 0.5)");
    light.addColorStop(1, "rgba(255, 170, 110, 0.12)");
    g.fillStyle = light;
    g.fillRect(0, 0, 640, 400);
    dayGuard(g, 360, 300);
  }, [stage]);

  useEffect(() => {
    const canvas = photo.current;
    if (stage !== "photo" || !canvas) return;
    const hall = paintRoom("sculpture", 1.5, { visitor: { pose: "cover", hat: true } });
    canvas.width = hall.width;
    canvas.height = hall.height;
    canvas.getContext("2d")!.drawImage(hall, 0, 0);
  }, [stage]);

  // Each part starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

  // Once the day guard has said it, you've seen the ending.
  const seen = useEffectEvent(() => onSeen());
  const said = stage === "photo" || line >= LINES.length - 1;
  useEffect(() => {
    if (said) seen();
  }, [said]);

  // The day guard's words, one line at a time.
  useEffect(() => {
    if (stage !== "dawn" || line >= LINES.length - 1) return;
    const timer = window.setTimeout(() => setLine((n) => n + 1), reducedMotion ? 600 : 1700);
    return () => window.clearTimeout(timer);
  }, [stage, line, reducedMotion]);

  if (stage === "dawn") {
    return (
      <div className={cn(styles.root, styles.sunrise, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-ending="dawn">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <p className="font-[family-name:var(--font-g-vt323)] text-2xl tracking-[0.2em] text-[#ffe7c4]">06:00 AM · THE LAST NIGHT</p>
          <canvas ref={dawn} className="mt-4 aspect-[16/10] w-full max-w-[min(100%,calc((100dvh-16rem)*1.6))] rounded-xl shadow-2xl" role="img" aria-label="The lobby at dawn. The day guard stands in the open doors, looking at you." />
          <p className={cn(styles.display, "mt-5 min-h-[2.6rem] text-3xl text-white sm:text-4xl")} aria-live="polite" data-day-guard>
            {LINES.slice(0, line + 1).join(" ")}
          </p>
          {line >= LINES.length - 1 && (
            <button type="button" className={cn(styles.btn, styles.primary, "mt-4 !min-h-12 px-6")} onClick={() => setStage("photo")} data-ending-continue>
              …
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.root, "grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8")} data-ending="photo">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <p className="font-[family-name:var(--font-g-vt323)] text-xl tracking-[0.3em] text-[var(--db-dim)]">THE NEXT MORNING</p>
        <figure className={cn(styles.photo, "mt-5 !w-full max-w-[min(100%,calc((100dvh-15rem)*1.6))]")} data-post-credits>
          <canvas ref={photo} role="img" aria-label="A photo of the Sculpture Hall. The statue is back on its pedestal, its hands over its face. It's wearing a night guard's cap." />
          <figcaption>Sculpture Hall, 6:00 AM</figcaption>
        </figure>
        <button type="button" className={cn(styles.btn, "mt-8 !min-h-12 px-6")} onClick={onDone} data-ending-done>
          Back to the museum
        </button>
      </div>
    </div>
  );
}
