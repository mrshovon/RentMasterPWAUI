// =============================================================================
// Shared brand helpers for the two generators (build-brand.mjs, gen-icons.mjs).
//
// brand.config.json at the repo root is the ONE place a colour is ever typed. Everything
// else — dark-theme variants, the Android colorPrimaryDark, hover shades — is DERIVED here
// so that changing `primary` moves the whole palette in step instead of leaving half of it
// on the old hue.
//
// Derivation is done in HSL and pins LIGHTNESS to a fixed target rather than nudging it by a
// percentage. That matters: a lighten-by-20% rule gives wildly different results for a dark
// navy and a bright red, so the dark theme would be readable for one brand colour and not the
// next. Pinning L means any input hue lands at the same contrast against the dark surface.
// =============================================================================

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** #RGB or #RRGGBB -> [r, g, b] 0-255. Throws loudly: a typo'd hex must not ship silently. */
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`Not a hex colour: ${JSON.stringify(hex)} (expected #RRGGBB)`);
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export const rgbToHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Tailwind's <alpha-value> needs channels, not a hex — "224 71 59". */
export const rgbToTriple = ([r, g, b]) => `${r} ${g} ${b}`;
export const tripleFromHex = (hex) => rgbToTriple(hexToRgb(hex));

function rgbToHsl([r, g, b]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [((h * 60) % 360 + 360) % 360, s, l];
}

function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

/**
 * Re-light a colour to an absolute HSL lightness, keeping its hue.
 * Saturation is nudged toward `satFloor` because a colour pushed near white or near black
 * loses apparent chroma and reads grey — the dark-theme primary has to stay recognisably
 * the brand, not a pink smudge.
 */
export function relight(hex, targetL, satFloor = 0) {
  const [h, s, _l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, Math.max(s, satFloor), targetL]));
}

/** Lightness of a hex, 0-1. Exposed so derivations can reason about relative brightness. */
export const lightnessOf = (hex) => rgbToHsl(hexToRgb(hex))[2];

/** WCAG relative luminance + contrast ratio — used to pick readable ink over a fill. */
function luminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrast(hexA, hexB) {
  const [a, b] = [luminance(hexToRgb(hexA)), luminance(hexToRgb(hexB))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * The full palette, derived from the handful of hexes in brand.config.json.
 *
 * The LIGHT values are used verbatim — they are what the user typed, and second-guessing
 * them would defeat the point of the config. Only the DARK variants and the Android shades
 * are computed, because nobody wants to hand-pick five colours to change one.
 */
export function loadBrand() {
  const cfg = JSON.parse(readFileSync(resolve(ROOT, "brand.config.json"), "utf8"));
  for (const key of ["primary", "ink", "accent", "danger", "iconBg"]) {
    if (!cfg[key]) throw new Error(`brand.config.json is missing "${key}"`);
    hexToRgb(cfg[key]); // validate every entry before anything is written
  }

  return {
    ...cfg,
    light: {
      primary: cfg.primary,
      accent: cfg.accent,
      danger: cfg.danger,
      wordmark: cfg.ink,
      // White on the brand red is 4.09:1 — under AA for body text, over the 3:1 bar for UI
      // components, and better than the teal it replaces (3.39:1). Kept white rather than
      // auto-flipping to dark ink, which would make primary buttons read as disabled.
      btnInk: "#FFFFFF",
    },
    dark: {
      // L 0.68 is where a mid-chroma hue clears the dark surface (--bg 15 20 30) comfortably
      // without glowing. The 0.72 saturation floor stops desaturated brands going grey.
      primary: relight(cfg.primary, 0.68, 0.72),
      accent: relight(cfg.accent, 0.68, 0.55),
      // Danger CANNOT just be pinned to the same lightness as primary. In this palette the two
      // are only 4 degrees apart in hue — on light they are told apart by lightness alone
      // (55% vs 42%), so relighting both to 0.68 collapses them into one salmon and "Delete"
      // stops looking different from "Save". Carry the light-theme lightness GAP across
      // instead, with a floor at 0.58 so the result still clears 4.5:1 on the dark surface.
      danger: relight(
        cfg.danger,
        Math.min(0.74, Math.max(0.58, 0.68 + (lightnessOf(cfg.danger) - lightnessOf(cfg.primary)))),
        0.72,
      ),
      // The wordmark ink is near-black by definition, so on dark it has to invert outright,
      // not lighten a little. 0.92 keeps it just off pure white, matching --heading.
      wordmark: relight(cfg.ink, 0.92, 0.06),
      btnInk: "#02060F",
    },
    android: {
      // Material's colorPrimaryDark is conventionally ~2 steps down the primary ramp.
      primaryDark: relight(cfg.primary, 0.44),
    },
  };
}
