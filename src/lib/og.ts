// Helpers for social preview images (generated once, at build time).

export const OG_SIZE = { width: 1200, height: 630 };

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700 | 800 | 900; style: "normal" };

/**
 * Fetch a Google Font subset (only the characters in `text`) as TrueType for the image renderer.
 * Runs at build time only. If the network is unavailable, the default font is used instead.
 */
export async function loadGoogleFont(
  family: string,
  weight: Font["weight"],
  text: string,
): Promise<Font | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match?.[1]) return null;
    const response = await fetch(match[1]);
    if (!response.ok) return null;
    return { name: family, data: await response.arrayBuffer(), weight, style: "normal" };
  } catch {
    return null;
  }
}

export const isFont = (font: Font | null): font is Font => font !== null;
