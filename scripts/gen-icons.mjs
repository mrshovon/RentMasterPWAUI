// Generate EVERY app icon from the brand logo (public/brandImages/logo-master.jpg).
// Run: npm run gen-icons
//
// Replaces the two older generators (this file rasterised the placeholder icon.svg for the
// web; gen-android-icons.mjs did the Android set) — one source of truth, one command.
//
// Produces:
//   WEB (public/)
//     - favicon.png, icon-192.png, icon-512.png, apple-touch-icon.png
//     - icon-maskable-512.png   (logo inset on brand bg, for the PWA maskable safe zone)
//     - logo.png                (in-app brand mark; small, so the UI never loads the raw JPEG)
//   ANDROID (android/app/src/main/res/)
//     - mipmap-*/ic_launcher.png, ic_launcher_round.png   (launcher / app drawer)
//     - mipmap-*/ic_launcher_foreground.png               (adaptive icon foreground)
//     - drawable-*/ic_stat_notify.png                     (status-bar notification icon)
//     - values/ic_launcher_background.xml, values/colors.xml
//
// Why the notification icon is NOT the logo: Android draws status-bar icons as a flat alpha
// MASK — every colour is discarded and whatever is opaque is painted solid white. A
// full-colour JPEG with no transparency would render as a plain white square. It has to be a
// transparent silhouette, so we draw one: the key-and-house motif from the logo, deliberately
// simplified because fine detail is illegible at 24dp.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RES = resolve(ROOT, "android/app/src/main/res");
const PUBLIC = resolve(ROOT, "public");
const LOGO = resolve(PUBLIC, "brandImages/logo-master.jpg");

// Sampled from the logo's own background gradient (#136aba top -> #073181 bottom). The
// midpoint is what the adaptive/maskable padding blends into with the least visible seam.
const BRAND_BG = "#0b4fa0";
const NOTIFY_TINT = "#136aba"; // FCM notification tint, from the logo's lighter blue

// Density -> px. Launcher legacy 48dp base; adaptive foreground 108dp canvas; notification 24dp.
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const NOTIFY = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };

// The emblem must sit inside the adaptive icon's 72/108 safe zone or the launcher's circular
// mask clips it. 0.76 keeps a little more of the artwork than the strict minimum.
const ADAPTIVE_SCALE = 0.76;

// Key-and-house silhouette traced from the logo, flattened for 24dp legibility. The key is
// punched THROUGH the house with fill-rule="evenodd", keeping it a clean two-tone mask —
// which is all Android will render anyway.
// NOTE ON GEOMETRY: with fill-rule="evenodd", two overlapping cut-outs cancel and the
// overlap fills back in — an earlier version overlapped the bow and the shaft by 0.5 units
// and rendered a white bar across the key. The subpaths below are exactly ADJACENT
// (shaft starts at the circle's bottom edge, 10.25 + 2.85 = 13.1; teeth start at the
// shaft's right edge, x = 12.95) so the cut-out stays continuous.
const NOTIFY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="#ffffff" fill-rule="evenodd" d="
    M12 1.7 L23 10.2 V22.3 H1 V10.2 Z
    M12 7.4 a2.85 2.85 0 1 0 0 5.7 a2.85 2.85 0 1 0 0 -5.7 Z
    M11.05 13.1 h1.9 v6.1 h-1.9 Z
    M12.95 14.9 h2.3 v1.5 h-2.3 Z
    M12.95 17.4 h1.8 v1.5 h-1.8 Z
  "/>
</svg>`;

const ensure = (dir) => mkdir(dir, { recursive: true });

/** Logo resized to an exact square, full-bleed. */
const square = (size) => sharp(LOGO).resize(size, size, { fit: "cover" }).png().toBuffer();

/** Logo inset on a background — used for maskable / adaptive safe zones. */
async function inset(canvas, scale, background) {
  const logo = await square(Math.round(canvas * scale));
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Circular crop for the legacy round launcher icon (Android does not round these itself). */
async function circle(size) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(await square(size))
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function genWeb() {
  await ensure(PUBLIC);
  const sizes = {
    "favicon.png": 32,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
    "logo.png": 256,
  };
  for (const [name, size] of Object.entries(sizes)) {
    await writeFile(`${PUBLIC}/${name}`, await square(size));
  }
  // Maskable: platforms crop up to 20% off each edge, so inset the artwork on brand colour.
  await writeFile(`${PUBLIC}/icon-maskable-512.png`, await inset(512, 0.8, BRAND_BG));
}

async function genLauncher() {
  for (const [dpi, size] of Object.entries(LAUNCHER)) {
    const dir = `${RES}/mipmap-${dpi}`;
    await ensure(dir);
    await writeFile(`${dir}/ic_launcher.png`, await square(size));
    await writeFile(`${dir}/ic_launcher_round.png`, await circle(size));
  }
}

async function genForeground() {
  for (const [dpi, canvas] of Object.entries(FOREGROUND)) {
    const dir = `${RES}/mipmap-${dpi}`;
    await ensure(dir);
    // Transparent padding — the adaptive BACKGROUND layer supplies the colour behind it.
    await writeFile(`${dir}/ic_launcher_foreground.png`, await inset(canvas, ADAPTIVE_SCALE, TRANSPARENT));
  }
}

async function genNotify() {
  for (const [dpi, size] of Object.entries(NOTIFY)) {
    const dir = `${RES}/drawable-${dpi}`;
    await ensure(dir);
    await writeFile(
      `${dir}/ic_stat_notify.png`,
      await sharp(Buffer.from(NOTIFY_SVG)).resize(size, size).png().toBuffer()
    );
  }
}

async function genValues() {
  await ensure(`${RES}/values`);
  await writeFile(
    `${RES}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BRAND_BG}</color>\n</resources>\n`
  );
  await writeFile(
    `${RES}/values/colors.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="notification_color">${NOTIFY_TINT}</color>\n</resources>\n`
  );
}

await genWeb();
await genLauncher();
await genForeground();
await genNotify();
await genValues();
console.log("Icons generated from", LOGO);
console.log("  web:     favicon, icon-192/512, maskable-512, apple-touch-icon, logo");
console.log("  android: launcher (+round), adaptive foreground, notification silhouette, colors");
