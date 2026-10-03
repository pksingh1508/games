import { ImageResponse } from "next/og";
import { CATEGORY_LABELS, getGame, GAMES } from "@/games/registry";
import { GAME_SLUGS, type GameSlug } from "@/games/slugs";
import { isFont, loadGoogleFont, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

// Image routes need their own params in a static export (the layout's don't apply).
export function generateStaticParams() {
  return GAME_SLUGS.map((slug) => ({ slug }));
}
export const alt = "Game preview";
export const size = OG_SIZE;
export const contentType = "image/png";

/** The Google Font used for each game's title (same as its page). */
const TITLE_FONT: Record<GameSlug, { family: string; weight: 400 | 700 | 800 | 900; scale: number }> = {
  "one-more-step": { family: "Fredoka", weight: 700, scale: 1 },
  nope: { family: "Bangers", weight: 400, scale: 1.15 },
  "99-seconds": { family: "Fraunces", weight: 700, scale: 1 },
  "dont-trust-the-game": { family: "Baloo 2", weight: 800, scale: 0.86 },
  "fake-floor": { family: "Pixelify Sans", weight: 700, scale: 1 },
  trapsprint: { family: "Press Start 2P", weight: 400, scale: 0.55 },
  "glitch-run": { family: "Rubik Glitch", weight: 400, scale: 0.95 },
  "almost-there": { family: "Silkscreen", weight: 700, scale: 0.8 },
  "one-tap-chaos": { family: "Bungee", weight: 400, scale: 0.78 },
  "last-pixel": { family: "Baloo 2", weight: 800, scale: 1 },
  "panic-stack": { family: "Rubik", weight: 900, scale: 0.95 },
  "cursor-escape": { family: "VT323", weight: 400, scale: 1.3 },
  "wrong-door": { family: "Limelight", weight: 400, scale: 0.92 },
  "dont-blink": { family: "Cormorant SC", weight: 700, scale: 1 },
  "gravity-is-lying": { family: "Lexend", weight: 800, scale: 0.86 },
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug as GameSlug);
  const p = game.palette;
  const font = TITLE_FONT[game.slug];
  const eyebrow = `GAME ${String(game.number).padStart(2, "0")} / ${GAMES.length} · ${CATEGORY_LABELS[game.category].toUpperCase()}`;
  const footer = `${SITE.fullName.toUpperCase()} · EVERY LIE HAS A TELL`;
  const title = font.family === "Silkscreen" ? game.title.toUpperCase() : game.title;

  const fonts = (
    await Promise.all([
      loadGoogleFont(font.family, font.weight, title),
      loadGoogleFont("Bricolage Grotesque", 700, `“${game.tagline}”${game.genre}`),
      loadGoogleFont("Pixelify Sans", 700, `${eyebrow}${footer}`),
    ])
  ).filter(isFont);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: p.bg,
          color: p.inkOnBg,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: -180, top: -220, width: 700, height: 700, borderRadius: 700, background: p.accent, opacity: 0.3, filter: "blur(110px)" }} />
        <div style={{ fontFamily: "Pixelify Sans", fontSize: 26, letterSpacing: 4, color: p.accent }}>{eyebrow}</div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: font.family, fontSize: 130 * font.scale, fontWeight: font.weight, lineHeight: 1 }}>{title}</div>
          <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 44, fontWeight: 700, marginTop: 30, maxWidth: 980, lineHeight: 1.15 }}>
            {`“${game.tagline}”`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "Pixelify Sans", fontSize: 22, letterSpacing: 3, color: p.muted }}>{footer}</div>
          <div
            style={{
              fontFamily: "Bricolage Grotesque",
              fontSize: 26,
              fontWeight: 700,
              background: p.accent,
              color: p.onAccent,
              padding: "10px 24px",
              borderRadius: 16,
              boxShadow: `0 8px 0 0 ${p.accentDeep}`,
            }}
          >
            {game.genre}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
