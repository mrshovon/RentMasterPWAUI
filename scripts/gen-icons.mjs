// Generate EVERY app icon, the Android splash, and the Android colour resources from the
// brand artwork + brand.config.json.  Run: npm run gen-icons   (or `npm run brand` for both steps)
//
// Produces:
//   WEB (public/)
//     - favicon.png, logo.png                              transparent mark, sits on any surface
//     - logo-wordmark.png, logo-wordmark-dark.png          the full lock-up, one per theme
//     - icon-192.png, icon-512.png, apple-touch-icon.png   opaque, mark inset on ICON_BG
//     - icon-maskable-512.png                              tighter inset for the maskable safe zone
//   ANDROID (android/app/src/main/res/)
//     - mipmap-*/ic_launcher.png, ic_launcher_round.png
//     - mipmap-*/ic_launcher_foreground.png       adaptive foreground, transparent padding
//     - drawable-*/ic_stat_notify.png             status-bar silhouette
//     - drawable{,-land-*,-port-*}/splash.png     launch screen, the full lock-up
//     - values/colors.xml, values/ic_launcher_background.xml
//
// ---------------------------------------------------------------------------------------
// WHY THE ARTWORK IS REBUILT RATHER THAN USED DIRECTLY
//
// Two different reasons, one per source:
//
//   app_icon_logo_2.png / logo_new_2.png — real PNGs with real alpha, so nothing has to be
//     reconstructed. They are still rebuilt pixel-by-pixel so the colours can be REPAINTED to
//     the exact hexes in brand.config.json. That is the whole point: the artwork follows a
//     future brand-colour change instead of freezing whatever red it was exported with.
//     The lock-up is two-coloured, so it gets a two-way repaint keyed on saturation — the
//     "bari36" ink is neutral, the house is not, and in the source the two do not overlap at
//     all (29,951 saturated pixels, 15,448 neutral, zero in between).
//
//   notification_icon_new.jpeg.jpeg — a grey house on a solid BLACK field, and a JPEG, so it
//     has no alpha to read. Android draws status-bar icons as a flat ALPHA MASK: every colour
//     is discarded and whatever is opaque is painted solid white. Handed this file directly,
//     Android would render a filled white square. Alpha is recovered from luminance instead,
//     and the result forced to pure white.
//
// The square masks then trim to the mark's bounding box and re-pad to a centred square, so the
// glyph is optically centred in every icon regardless of where it sat in the source frame. The
// lock-up is trimmed but NOT padded — its 2.4:1 aspect ratio is the artwork's own.
// ---------------------------------------------------------------------------------------

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadBrand, hexToRgb, ROOT } from "./brand-lib.mjs";

const RES = resolve(ROOT, "android/app/src/main/res");
const PUBLIC = resolve(ROOT, "public");

const brand = loadBrand();

// Source artwork. The bare house glyph drives every icon; the full lock-up drives the header
// wordmark and the splash; the notification silhouette is separate art again.
const MARK_SRC = resolve(PUBLIC, "brandImages/app_icon_logo_2.png");
const WORDMARK_SRC = resolve(PUBLIC, "brandImages/logo_new_2.png");
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

// ---------------------------------------------------------------------------------------
// SCALES. These read low for a reason: the house glyph is PORTRAIT (307x369 once trimmed, so
// 0.83:1) and maskToSquare pads it to a square by its LONGER side. A scale of S therefore gives
// the glyph S of the canvas vertically but only 0.83*S horizontally — set S by what looks right
// across the top and bottom, not by the width, or the icon reads as cramped even though it is
// geometrically centred.
const ADAPTIVE_SCALE = 0.5; // adaptive foreground + maskable. Android guarantees only the centre
                            // 72/108 = 0.667 CIRCLE is visible, and a 0.83:1 glyph has a diagonal
                            // 1.30x its height — so 0.5 * 1.30 = 0.65 is about the largest that
                            // keeps the house's base corners out of the round mask.
const ICON_SCALE = 0.58; // opaque square icons: no mask to fear, but the same portrait glyph, so
                         // this lands ~107px of top/bottom margin on a 512 canvas.
const NOTIFY_SCALE = 0.85; // the status bar gives us the whole 24dp box
const SPLASH_WORDMARK_SCALE = 0.62; // lock-up WIDTH as a fraction of the canvas's SHORT edge

/** Linear ramp with clamping — turns a channel measurement into an alpha byte. */
const ramp = (v, lo, hi) => Math.max(0, Math.min(255, Math.round(((v - lo) / (hi - lo)) * 255)));

/**
 * Rebuild a source as a transparent, single-colour PNG.
 *
 * `alphaOf(r,g,b,a)` decides opacity per pixel — reading the source alpha where there is one and
 * reconstructing it from colour where there is not. Every opaque pixel is painted `rgb`. The
 * result is cropped to the mark's alpha bounding box and re-padded to a centred square.
 */
async function maskToSquare(src, alphaOf, rgb) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = alphaOf(data[i], data[i + 1], data[i + 2], data[i + 3]);
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

/** Alpha straight from the PNG — the glyph is monochrome, so it is repainted to one brand hex. */
const alphaMask = (src, hex) => maskToSquare(src, (_r, _g, _b, a) => a, hexToRgb(hex));

/** Alpha from luminance — the black JPEG field drops out, the glyph becomes pure white. */
const lumaMask = (src) =>
  maskToSquare(src, (r, g, b) => ramp(0.299 * r + 0.587 * g + 0.114 * b, 8, 90), [255, 255, 255]);

/**
 * The full "bari36 + house" lock-up, repainted to the configured hexes and trimmed.
 *
 * Two colours, so the single-hex repaint above will not do: every pixel is mixed between `ink`
 * and `primary` by its SATURATION. The wordmark ink is neutral (#3B3838, saturation 3) and the
 * house is not (saturation 165), so the two classes are far apart — but a hard threshold would
 * fringe the anti-aliased boundary between them, hence the same ramp the alpha masks use.
 * Source alpha is carried through untouched.
 *
 * Trimmed to the alpha bounding box but deliberately NOT padded to a square: the lock-up's
 * aspect ratio is part of the artwork, and a caller that wants margin adds its own.
 */
async function wordmark(src, primaryHex, inkHex) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const [pr, pg, pb] = hexToRgb(primaryHex);
  const [ir, ig, ib] = hexToRgb(inkHex);
  const out = Buffer.alloc(width * height * 4);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const mix = ramp(Math.max(r, g, b) - Math.min(r, g, b), 25, 90) / 255;
      const o = (y * width + x) * 4;
      out[o] = Math.round(ir + (pr - ir) * mix);
      out[o + 1] = Math.round(ig + (pg - ig) * mix);
      out[o + 2] = Math.round(ib + (pb - ib) * mix);
      out[o + 3] = a;
      if (a > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`No artwork found in ${src} — is it fully transparent?`);

  return sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer();
}

const ensure = (dir) => mkdir(dir, { recursive: true });

/**
 * The brand mark alone, transparent, at `size`.
 *
 * The RGB is re-flattened to `art.rgb` AFTER resizing rather than trusting the resampler.
 * Lanczos overshoots at the edges of a hard-edged glyph, and at a big reduction the overshoot
 * is the whole pixel: scaling the source straight down to a 32px favicon turned #E0473B into
 * #FF5143. Since the mark is monochrome by construction, only the ALPHA channel carries
 * information worth resampling — so keep that and repaint the colour exactly.
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

/**
 * The lock-up centred on a rectangular canvas. Unlike `inset`, the size is set by WIDTH: the
 * artwork is 2.4x wider than it is tall, so scaling it by the short edge the way a square glyph
 * is scaled would overflow every portrait canvas. The height follows from the aspect ratio.
 */
async function insetWordmark(lockup, canvasW, canvasH, scale, background) {
  const art = await sharp(lockup)
    .resize({ width: Math.round(Math.min(canvasW, canvasH) * scale) })
    .png()
    .toBuffer();
  return sharp({ create: { width: canvasW, height: canvasH, channels: 4, background } })
    .composite([{ input: art, gravity: "centre" }])
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

async function genWeb(markArt, lockupLight, lockupDark) {
  await ensure(PUBLIC);
  // Transparent: these sit on the app's own surfaces and in the browser tab, where a white
  // plate behind the glyph would read as a sticker in dark mode.
  await writeFile(`${PUBLIC}/logo.png`, await mark(markArt, 256));
  await writeFile(`${PUBLIC}/favicon.png`, await mark(markArt, 32));
  // Two lock-ups, not one: the "bari36" ink is near-black by definition, so on the dark theme
  // it would vanish. components/ui.tsx <Wordmark /> swaps between them with Tailwind's dark:
  // variant, which is wired to [data-theme="dark"] — pure CSS, so there is no hydration flash.
  await writeFile(`${PUBLIC}/logo-wordmark.png`, lockupLight);
  await writeFile(`${PUBLIC}/logo-wordmark-dark.png`, lockupDark);
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

// The launch screen shows the full lock-up rather than the bare glyph: it is the one moment the
// app has the whole screen and nothing else to say, so it may as well say the name. ICON_BG is
// light, so the light-theme lock-up is the readable one on it whatever theme the app opens in.
async function genSplash(lockupLight) {
  for (const [dir, [w, h]] of Object.entries(SPLASH)) {
    await ensure(`${RES}/${dir}`);
    await writeFile(
      `${RES}/${dir}/splash.png`,
      await insetWordmark(lockupLight, w, h, SPLASH_WORDMARK_SCALE, OPAQUE_BG),
    );
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

const markArt = await alphaMask(MARK_SRC, brand.light.primary);
const notifyArt = await lumaMask(NOTIFY_SRC);
const lockupLight = await wordmark(WORDMARK_SRC, brand.light.primary, brand.light.wordmark);
const lockupDark = await wordmark(WORDMARK_SRC, brand.dark.primary, brand.dark.wordmark);

await genWeb(markArt, lockupLight, lockupDark);
await genLauncher(markArt);
await genForeground(markArt);
await genNotify(notifyArt);
await genSplash(lockupLight);
await genValues();

console.log("Icons generated from", MARK_SRC.replace(ROOT, "."), "at", brand.light.primary);
console.log("  web:     favicon, logo, wordmark (light + dark), icon-192/512, maskable-512, apple-touch-icon");
console.log("  android: launcher (+round), adaptive foreground, notification silhouette, splash x11, colours");
