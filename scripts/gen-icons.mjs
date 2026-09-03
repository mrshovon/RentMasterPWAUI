// Generate EVERY app icon, the Android splash, and the Android colour resources from the
// brand mark + brand.config.json.  Run: npm run gen-icons   (or `npm run brand` for both steps)
//
// Produces:
//   WEB (public/)
//     - favicon.png, logo.png                              transparent mark, sits on any surface
//     - icon-192.png, icon-512.png, apple-touch-icon.png   opaque, mark inset on ICON_BG
//     - icon-maskable-512.png                              tighter inset for the maskable safe zone
//   ANDROID (android/app/src/main/res/)
//     - mipmap-*/ic_launcher.png, ic_launcher_round.png
//     - mipmap-*/ic_launcher_foreground.png       adaptive foreground, transparent padding
//     - drawable-*/ic_stat_notify.png             status-bar silhouette
//     - drawable{,-land-*,-port-*}/splash.png     launch screen
//     - values/colors.xml, values/ic_launcher_background.xml
//
// ---------------------------------------------------------------------------------------
// WHY THE SOURCES ARE MASKED RATHER THAN USED DIRECTLY
//
// Both source files are JPEGs, and JPEG cannot store transparency. That breaks them in two
// different ways, so each gets its own mask:
//
//   app_icon_new.jpeg.jpeg — the "transparent" checkerboard is BAKED IN as real #FEFEFE/#EDEDED
//     pixels. Used as-is, the logo shows a grey grid on every surface. But the mark is the only
//     CHROMATIC thing in the frame, so alpha can be recovered from saturation: ~106k saturated
//     pixels vs ~282k neutral ones, with only ~5.5k in between. The opaque pixels are then
//     repainted to the exact configured hex — the JPEG had drifted to #E33F33 — which is also
//     what makes the logo follow a future colour change instead of freezing whatever red the
//     artwork happened to be exported with.
//
//   notification_icon_new.jpeg.jpeg — a grey house on a solid BLACK field. Android draws
//     status-bar icons as a flat ALPHA MASK: every colour is discarded and whatever is opaque
//     is painted solid white. Handed this file directly, Android would render a filled white
//     square. Alpha is recovered from luminance instead, and the result forced to pure white.
//
// Both masks then trim to the mark's bounding box and re-pad to a centred square, so the glyph
// is optically centred in every icon regardless of where it sat in the source frame.
// ---------------------------------------------------------------------------------------

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadBrand, hexToRgb, ROOT } from "./brand-lib.mjs";

const RES = resolve(ROOT, "android/app/src/main/res");
const PUBLIC = resolve(ROOT, "public");

const brand = loadBrand();

// Source artwork. app_icon_new and logo_new are byte-identical, so one file serves the logo
// and every app icon; only the notification silhouette is separate art.
const MARK_SRC = resolve(PUBLIC, "brandImages/app_icon_new.jpeg.jpeg");
const NOTIFY_SRC = resolve(PUBLIC, "brandImages/notification_icon_new.jpeg.jpeg");

// The mark is a bare red glyph with transparency, NOT the full-bleed disc it replaces, so the
// backdrop behind it has to be light — on the old #0b4fa0 blue (or on the brand red itself)
// the glyph would simply disappear.
const ICON_BG = brand.iconBg;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const [BG_R, BG_G, BG_B] = hexToRgb(ICON_BG);
const OPAQUE_BG = { r: BG_R, g: BG_G, b: BG_B, alpha: 1 };

// Density -> px. Launcher legacy 48dp base; adaptive foreground 108dp canvas; notification 24dp.
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const NOTIFY = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };

// Splash canvases — the dimensions Capacitor scaffolded, kept exactly so no density bucket
// ends up missing an asset and falling back to a stretched one.
const SPLASH = {
  "drawable": [480, 320],
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280],
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
};

// A bare glyph needs a tighter inset than the full-bleed disc this replaces (which used 0.76).
// 0.62 is the adaptive icon's 66/108 safe zone — anything larger gets clipped by the launcher's
// circular mask on stock Android.
const ADAPTIVE_SCALE = 0.62;
const ICON_SCALE = 0.72; // opaque square icons: room to breathe, no mask to fear
const NOTIFY_SCALE = 0.85; // the status bar gives us the whole 24dp box
const SPLASH_SCALE = 0.28; // fraction of the SHORT edge

/** Linear ramp with clamping — turns a channel measurement into an alpha byte. */
const ramp = (v, lo, hi) => Math.max(0, Math.min(255, Math.round(((v - lo) / (hi - lo)) * 255)));

/**
 * Rebuild an opaque JPEG as a transparent, single-colour PNG.
 *
 * `alphaOf(r,g,b)` decides opacity per pixel; every opaque pixel is painted `rgb`. The result
 * is cropped to the mark's alpha bounding box and re-padded to a centred square.
 */
async function maskToSquare(src, alphaOf, rgb) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = alphaOf(data[i], data[i + 1], data[i + 2]);
      const o = (y * width + x) * 4;
      out[o] = rgb[0];
      out[o + 1] = rgb[1];
      out[o + 2] = rgb[2];
      out[o + 3] = a;
      // Ignore near-transparent pixels when measuring the bounds: JPEG ringing leaves a faint
      // halo of low-alpha noise well outside the artwork, and letting that set the box would
      // pad the glyph down to nothing.
      if (a > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`No artwork found in ${src} — is the mask threshold right?`);

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const side = Math.max(w, h);
  return sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left: minX, top: minY, width: w, height: h })
    .extend({
      top: Math.floor((side - h) / 2),
      bottom: Math.ceil((side - h) / 2),
      left: Math.floor((side - w) / 2),
      right: Math.ceil((side - w) / 2),
      background: TRANSPARENT,
    })
    .png()
    .toBuffer()
    .then((buf) => ({ buf, rgb }));
}

/** Alpha from chroma — the checkerboard is neutral, the mark is not. */
const chromaMask = (src, hex) =>
  maskToSquare(src, (r, g, b) => ramp(Math.max(r, g, b) - Math.min(r, g, b), 25, 90), hexToRgb(hex));

/** Alpha from luminance — the black field drops out, the glyph becomes pure white. */
const lumaMask = (src) =>
  maskToSquare(src, (r, g, b) => ramp(0.299 * r + 0.587 * g + 0.114 * b, 8, 90), [255, 255, 255]);

const ensure = (dir) => mkdir(dir, { recursive: true });

/**
 * The brand mark alone, transparent, at `size`.
 *
 * The RGB is re-flattened to `art.rgb` AFTER resizing rather than trusting the resampler.
 * Lanczos overshoots at the edges of a hard-edged glyph, and at a big reduction the overshoot
 * is the whole pixel: scaling the 1254px source straight down to a 32px favicon turned
 * #E0473B into #FF5143. Since the mark is monochrome by construction, only the ALPHA channel
 * carries information worth resampling — so keep that and repaint the colour exactly.
 */
async function mark(art, size) {
  const alpha = await sharp(art.buf)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .extractChannel("alpha")
    .toBuffer();
  const [r, g, b] = art.rgb;
  return sharp({ create: { width: size, height: size, channels: 3, background: { r, g, b } } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

/** The mark centred on a canvas — pass `TRANSPARENT` for adaptive foregrounds. */
async function inset(art, canvasW, scale, background, canvasH = canvasW) {
  const glyph = await mark(art, Math.round(Math.min(canvasW, canvasH) * scale));
  return sharp({ create: { width: canvasW, height: canvasH, channels: 4, background } })
    .composite([{ input: glyph, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Circular crop for the legacy round launcher icon (Android does not round these itself). */
async function circle(art, size) {
  const cut = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  return sharp(await inset(art, size, ICON_SCALE, OPAQUE_BG))
    .composite([{ input: cut, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function genWeb(markArt) {
  await ensure(PUBLIC);
  // Transparent: these sit on the app's own surfaces and in the browser tab, where a white
  // plate behind the glyph would read as a sticker in dark mode.
  await writeFile(`${PUBLIC}/logo.png`, await mark(markArt, 256));
  await writeFile(`${PUBLIC}/favicon.png`, await mark(markArt, 32));
  // Opaque: home-screen and launcher surfaces. apple-touch-icon in particular MUST be opaque —
  // iOS composites a transparent one onto black.
  const opaque = { "icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180 };
  for (const [name, size] of Object.entries(opaque)) {
    await writeFile(`${PUBLIC}/${name}`, await inset(markArt, size, ICON_SCALE, OPAQUE_BG));
  }
  // Maskable: platforms crop up to 20% off each edge, so inset harder than the plain icons.
  await writeFile(`${PUBLIC}/icon-maskable-512.png`, await inset(markArt, 512, ADAPTIVE_SCALE, OPAQUE_BG));
}

async function genLauncher(markArt) {
  for (const [dpi, size] of Object.entries(LAUNCHER)) {
    const dir = `${RES}/mipmap-${dpi}`;
    await ensure(dir);
    await writeFile(`${dir}/ic_launcher.png`, await inset(markArt, size, ICON_SCALE, OPAQUE_BG));
    await writeFile(`${dir}/ic_launcher_round.png`, await circle(markArt, size));
  }
}

async function genForeground(markArt) {
  for (const [dpi, canvas] of Object.entries(FOREGROUND)) {
    const dir = `${RES}/mipmap-${dpi}`;
    await ensure(dir);
    // Transparent padding — the adaptive BACKGROUND layer supplies the colour behind it.
    await writeFile(`${dir}/ic_launcher_foreground.png`, await inset(markArt, canvas, ADAPTIVE_SCALE, TRANSPARENT));
  }
}

async function genNotify(notifyArt) {
  for (const [dpi, size] of Object.entries(NOTIFY)) {
    const dir = `${RES}/drawable-${dpi}`;
    await ensure(dir);
    await writeFile(`${dir}/ic_stat_notify.png`, await inset(notifyArt, size, NOTIFY_SCALE, TRANSPARENT));
  }
}

async function genSplash(markArt) {
  for (const [dir, [w, h]] of Object.entries(SPLASH)) {
    await ensure(`${RES}/${dir}`);
    await writeFile(`${RES}/${dir}/splash.png`, await inset(markArt, w, SPLASH_SCALE, OPAQUE_BG, h));
  }
}

async function genValues() {
  await ensure(`${RES}/values`);
  const xml = (body) =>
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<!-- GENERATED by scripts/gen-icons.mjs from brand.config.json — do not edit by hand. -->\n` +
    `<resources>\n${body}\n</resources>\n`;
  const color = (name, value) => `    <color name="${name}">${value}</color>`;

  await writeFile(`${RES}/values/ic_launcher_background.xml`, xml(color("ic_launcher_background", ICON_BG)));
  await writeFile(
    `${RES}/values/colors.xml`,
    xml(
      [
        // FCM tints the status-bar silhouette with this. lib/fcm-send.ts in the BACKEND repo
        // also sends a `color` per message, which wins — keep the two in step.
        color("notification_color", brand.light.primary),
        // values/styles.xml has always referenced these three; until now they were defined
        // nowhere in the app and silently resolved to Capacitor's library defaults (indigo/pink).
        color("colorPrimary", brand.light.primary),
        color("colorPrimaryDark", brand.android.primaryDark),
        color("colorAccent", brand.light.primary),
      ].join("\n"),
    ),
  );
}

const markArt = await chromaMask(MARK_SRC, brand.light.primary);
const notifyArt = await lumaMask(NOTIFY_SRC);

await genWeb(markArt);
await genLauncher(markArt);
await genForeground(markArt);
await genNotify(notifyArt);
await genSplash(markArt);
await genValues();

console.log("Icons generated from", MARK_SRC.replace(ROOT, "."), "at", brand.light.primary);
console.log("  web:     favicon, logo, icon-192/512, maskable-512, apple-touch-icon");
console.log("  android: launcher (+round), adaptive foreground, notification silhouette, splash x11, colours");
