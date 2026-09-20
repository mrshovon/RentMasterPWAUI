"use client";

import { useEffect } from "react";
import { BACKEND_API_BASE } from "../lib/api-service";
import {
  buildGoogleHref, buildStack, customFaces,
  findFont, type FontConfigView, type FontSlotView,
} from "../lib/font-catalog";
import { isSafeFontUrl } from "../lib/font-validate";

// =============================================================================
// Applies the typeface the super-admin chose in the admin panel, so the font of
// the whole app can be changed without a redeploy.
//
// Renders nothing. It sets two CSS variables on <html> — --font-body and
// --font-heading — which tailwind.config.js reads for `font-sans` (on <body>,
// so it reaches everything) and `font-display`. Both are declared there with a
// `var(x, fallback)` default, so WITH NOTHING CONFIGURED THIS COMPONENT DOES
// NOTHING AT ALL and the app renders exactly as it shipped. That is deliberate:
// the default path must not depend on a fetch, a script, or localStorage.
//
// It does NOT touch --font-display. That one belongs to next/font (app/layout.tsx)
// and carries Baloo Da 2 plus its size-adjust fallback face; overwriting it would
// throw that away and make one variable mean two different things.
//
// Most loads apply the font BEFORE this component ever mounts: FONT_INIT in
// app/layout.tsx replays the cache below before first paint. This is what keeps
// the cache correct and handles the first load on a new device.
//
// Security: a font setting ends up inside font-family and url(). The family names
// are ours (four fixed constants in lib/font-validate.ts — the admin never supplies
// one), the Google URL is assembled only from specs hardcoded in lib/font-catalog.ts,
// and every custom URL is re-validated here before it becomes CSS. Same posture as
// components/analytics-gate.tsx, and for the same reason.
// =============================================================================

/** The pre-paint script reads this. Keep the shape in sync with FONT_INIT. */
export const FONT_CACHE_KEY = "rentmaster-fonts";

const LINK_ID = "bari360-gfonts";
const FACE_ID = "bari360-font-faces";

/** Strip anything the catalogue does not recognise. An unknown id becomes "unset". */
function sanitiseSlot(raw: any): FontSlotView {
  const r = raw && typeof raw === "object" ? raw : {};
  const id = (v: unknown, script: "latin" | "bengali") =>
    findFont(String(v || ""), script) ? String(v) : "";
  const custom = (v: any) =>
    v && isSafeFontUrl(v.url) && typeof v.format === "string"
      ? { url: v.url as string, format: v.format, originalName: String(v.originalName || "") }
      : null;
  return {
    latinId: id(r.latinId, "latin"),
    banglaId: id(r.banglaId, "bengali"),
    customLatin: custom(r.customLatin),
    customBangla: custom(r.customBangla),
  };
}

function applyConfig(config: FontConfigView) {
  const root = document.documentElement;

  const body = buildStack(config.body, "body");
  const heading = buildStack(config.heading, "heading");
  // removeProperty, not an empty string: an empty value would still be a definition and would
  // beat the var() fallback, leaving the app with no font-family at all.
  if (body) root.style.setProperty("--font-body", body);
  else root.style.removeProperty("--font-body");
  if (heading) root.style.setProperty("--font-heading", heading);
  else root.style.removeProperty("--font-heading");

  const faces = customFaces(config);
  const faceCss = faces
    .map((f) =>
      `@font-face{font-family:"${f.n}";src:url("${f.u}") format("${f.t}");` +
      `font-display:swap;font-weight:100 900;font-style:normal;}`)
    .join("");
  let faceNode = document.getElementById(FACE_ID) as HTMLStyleElement | null;
  if (faceCss) {
    if (!faceNode) {
      faceNode = document.createElement("style");
      faceNode.id = FACE_ID;
      document.head.appendChild(faceNode);
    }
    if (faceNode.textContent !== faceCss) faceNode.textContent = faceCss;
  } else if (faceNode) {
    faceNode.remove();
  }

  const href = buildGoogleHref(config);
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (href) {
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      // Loaded as a print stylesheet and promoted on load, so a third-party request never
      // blocks first paint. Today the app has no render-blocking third-party CSS at all and
      // this feature must not be the one that introduces it. With display=swap the cost of
      // arriving late is a swap, not a delay.
      link.media = "print";
      link.addEventListener("load", () => { link!.media = "all"; });
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  } else if (link) {
    link.remove();
  }

  // What the pre-paint script replays next time. Primitives only — it must not need the
  // catalogue, and it must never be able to introduce a family name of its own.
  try {
    if (body || heading || faces.length || href) {
      localStorage.setItem(FONT_CACHE_KEY, JSON.stringify({
        v: 1, u: config.updatedAt, b: body, h: heading, g: href, f: faces,
      }));
    } else {
      localStorage.removeItem(FONT_CACHE_KEY);
    }
  } catch { /* private window, blocked storage — the fetch path still works */ }
}

export function FontGate() {
  useEffect(() => {
    let cancelled = false;

    // The same escape hatch FONT_INIT honours, and it has to be honoured HERE too or it only
    // lasts until this fetch returns — which would make it useless for its one job: getting
    // back into the admin console to undo a font nobody can read.
    if (window.location.search.includes("nofont=1")) return;

    (async () => {
      let raw: any;
      try {
        const url = `${BACKEND_API_BASE}/api/app/font-config`;
        const res = await fetch(url, { cache: "no-store" });
        // Never fail silently: a blocked read looks identical to "no font configured", which
        // is exactly how a missing CORS header hid a whole feature on this project before.
        if (!res.ok) {
          console.warn(`[fonts] config returned ${res.status} from ${url} — keeping the built-in typeface.`);
          return;
        }
        raw = (await res.json())?.data;
      } catch {
        return; // offline or backend down — whatever the pre-paint script applied stands
      }
      if (cancelled || !raw) return;

      const config: FontConfigView = {
        body: sanitiseSlot(raw.body),
        heading: sanitiseSlot(raw.heading),
        updatedAt: String(raw.updatedAt || ""),
      };

      // Steady state: the pre-paint script already applied this exact version, so there is
      // nothing to do and no DOM to churn.
      try {
        const cached = JSON.parse(localStorage.getItem(FONT_CACHE_KEY) || "null");
        if (cached && cached.v === 1 && cached.u && cached.u === config.updatedAt) return;
      } catch { /* fall through and apply */ }

      applyConfig(config);
    })();

    return () => { cancelled = true; };
  }, []);

  return null;
}

/**
 * Apply a config to THIS device right now.
 *
 * For the admin card: without it, saving changes nothing on screen until a reload, and an
 * admin who sees no change reasonably concludes the setting does not work.
 */
export function applyFontsOnThisDevice(config: FontConfigView) {
  applyConfig({
    body: sanitiseSlot(config.body),
    heading: sanitiseSlot(config.heading),
    updatedAt: String(config.updatedAt || ""),
  });
}
