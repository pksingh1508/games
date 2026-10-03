import { ImageResponse } from "next/og";
import { isFont, loadGoogleFont, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const alt = `${SITE.fullName}: ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const heading = "Fifteen games that lie to you.";
  const sticker = "Fairly.";
  const small = `${SITE.fullName} · No accounts · Saves stay on your device`;
  const fonts = (
    await Promise.all([
      loadGoogleFont("Bricolage Grotesque", 800, `${heading}${sticker}${SITE.name}`),
      loadGoogleFont("Pixelify Sans", 700, small.toUpperCase()),
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
          background: "#0E0B16",
          color: "#F5F1E8",
          fontFamily: "Bricolage Grotesque",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: -200, top: -260, width: 760, height: 760, borderRadius: 760, background: "#FF3D7F", opacity: 0.28, filter: "blur(120px)" }} />
        <div style={{ position: "absolute", right: -160, bottom: -200, width: 620, height: 620, borderRadius: 620, background: "#3DE0FF", opacity: 0.18, filter: "blur(120px)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#FF3D7F", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 42, height: 26, borderRadius: 26, background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 18, height: 18, borderRadius: 18, background: "#0E0B16", marginLeft: -8 }} />
            </div>
          </div>
          <div style={{ fontSize: 38, fontWeight: 800 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, maxWidth: 1000 }}>{heading}</div>
          <div style={{ display: "flex", marginTop: 26 }}>
            <div
              style={{
                fontSize: 54,
                fontWeight: 800,
                background: "#FF3D7F",
                color: "#0E0B16",
                padding: "4px 24px 10px",
                borderRadius: 20,
                transform: "rotate(-3deg)",
                boxShadow: "0 10px 0 0 #A62853",
              }}
            >
              {sticker}
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "Pixelify Sans", fontSize: 24, letterSpacing: 4, color: "#C6FF3D" }}>{small.toUpperCase()}</div>
      </div>
    ),
    { ...size, fonts },
  );
}
