// One-off PWA icon generator: rasterizes public/icon.svg into the PNG sizes a real
// installable PWA needs. Run with: npm run gen-icons  (requires the `sharp` devDependency).
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const svg = readFileSync(join(publicDir, "icon.svg"));
const BG = "#030712";

// Full-bleed icon (purpose "any"). The SVG already paints a rounded #030712 tile;
// `background` fills the transparent corners so the PNG is a solid square.
async function icon(size, file) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: BG })
    .png()
    .toFile(join(publicDir, file));
  console.log("  ✓", file);
}

// Maskable icon: logo confined to the ~72% safe zone on a solid bg so Android's
// adaptive mask (circle/squircle) never crops the artwork.
async function maskable(size, file) {
  const inner = Math.round(size * 0.72);
  const pad = Math.round((size - inner) / 2);
  const logo = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toFile(join(publicDir, file));
  console.log("  ✓", file);
}

console.log("Generating PWA icons from icon.svg …");
await icon(192, "icon-192.png");
await icon(512, "icon-512.png");
await icon(180, "apple-touch-icon.png");
await maskable(512, "icon-maskable-512.png");
console.log("Done.");
