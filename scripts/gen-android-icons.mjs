// Generate Android launcher + notification icons from the brand logo (public/icon.svg).
// Run: npm run gen-android-icons  (after `npx cap add android`).
//
// Produces:
//   - mipmap-*/ic_launcher.png, ic_launcher_round.png   (legacy square launcher)
//   - mipmap-*/ic_launcher_foreground.png               (adaptive icon foreground)
//   - drawable-*/ic_stat_notify.png                     (white status-bar notification icon)
//   - values/ic_launcher_background.xml                 (adaptive background = brand bg)
//   - values/colors.xml                                 (notification_color)

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RES = resolve(ROOT, "android/app/src/main/res");
const LOGO = resolve(ROOT, "public/icon.svg");
const BRAND_BG = "#030712";       // adaptive background
const NOTIFY_TINT = "#6366f1";    // FCM notification color (indigo)

// Density → px. Launcher legacy 48dp base; foreground 108dp canvas; notification 24dp base.
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const NOTIFY = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };

// White house silhouette (transparent bg) — the status-bar icon Android tints.
const NOTIFY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="#ffffff" d="M12 2.6 L21.4 10.6 V21.4 H14.2 V14.6 H9.8 V21.4 H2.6 V10.6 Z"/>
</svg>`;

async function ensure(dir) { await mkdir(dir, { recursive: true }); }

async function genLauncher() {
  for (const [dpi, size] of Object.entries(LAUNCHER)) {
    const dir = `${RES}/mipmap-${dpi}`;
    await ensure(dir);
    const png = await sharp(LOGO).resize(size, size).png().toBuffer();
    await writeFile(`${dir}/ic_launcher.png`, png);
    await writeFile(`${dir}/ic_launcher_round.png`, png);
  }
}

async function genForeground() {
  for (const [dpi, canvas] of Object.entries(FOREGROUND)) {
    const dir = `${RES}/mipmap-${dpi}`;
    await ensure(dir);
    const inner = Math.round(canvas * 0.62); // keep the logo inside the adaptive safe zone
    const logo = await sharp(LOGO).resize(inner, inner).png().toBuffer();
    const fg = await sharp({
      create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: logo, gravity: "centre" }])
      .png()
      .toBuffer();
    await writeFile(`${dir}/ic_launcher_foreground.png`, fg);
  }
}

async function genNotify() {
  for (const [dpi, size] of Object.entries(NOTIFY)) {
    const dir = `${RES}/drawable-${dpi}`;
    await ensure(dir);
    const png = await sharp(Buffer.from(NOTIFY_SVG)).resize(size, size).png().toBuffer();
    await writeFile(`${dir}/ic_stat_notify.png`, png);
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

await genLauncher();
await genForeground();
await genNotify();
await genValues();
console.log("Android icons generated (launcher, adaptive foreground, notification, colors).");
