// Renders the app icons from the logo mark. Run with: pnpm icons
// Outputs are committed, so this only needs re-running when the logo changes.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const PINK = "#FF3D7F";
const INK = "#0E0B16";
const CREAM = "#F5F1E8";
const LIME = "#C6FF3D";

/** The eye, drawn inside a 64×64 box. */
const eye = `
  <path d="M8 33 Q32 8 56 33 Q32 56 8 33 z" fill="${CREAM}"/>
  <circle cx="29" cy="33" r="10.5" fill="${INK}"/>
  <circle cx="33" cy="29" r="3.2" fill="${CREAM}"/>
  <rect x="46" y="9" width="7" height="7" fill="${LIME}"/>`;

/** Rounded tile (regular icons). */
const roundedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${PINK}"/>${eye}</svg>`;

/** Full-bleed square with the eye scaled into the safe zone (maskable + Apple icons). */
const bleedSvg = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${PINK}"/><g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${eye}</g></svg>`;

const render = (svg, size) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toBuffer();

/** A .ico file containing PNG images (supported by every modern browser). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

await mkdir("public/icons", { recursive: true });

await writeFile("public/icons/icon-192.png", await render(roundedSvg, 192));
await writeFile("public/icons/icon-512.png", await render(roundedSvg, 512));
await writeFile("public/icons/icon-maskable-512.png", await render(bleedSvg(0.72), 512));
await writeFile("src/app/apple-icon.png", await render(bleedSvg(0.86), 180));
await writeFile(
  "src/app/favicon.ico",
  ico([
    { size: 16, data: await render(roundedSvg, 16) },
    { size: 32, data: await render(roundedSvg, 32) },
    { size: 48, data: await render(roundedSvg, 48) },
  ]),
);

console.log("Icons written: public/icons/*.png, src/app/apple-icon.png, src/app/favicon.ico");
