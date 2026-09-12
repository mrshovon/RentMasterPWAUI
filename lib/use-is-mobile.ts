"use client";

import { useEffect, useState } from "react";

// =============================================================================
// "Is this a phone-sized screen?" — a viewport question, which is a different question from
// lib/platform.ts's isNativeApp().
//
// isNativeApp() asks "are we inside the Capacitor app", and for anything user-facing about SIZE
// that is the wrong test: someone on their phone's browser — which is how most people arrive
// before they ever install anything — answers false to it.
//
// 1023px is Tailwind's `lg` boundary (min-width 1024px), chosen so this agrees with the CSS rather
// than inventing a second idea of "mobile". The login page already splits its brand panel from its
// mobile block at exactly that point.
//
// Why a hook at all, when `lg:hidden` exists: components/ui.tsx's Modal createPortals to
// document.body, so a Tailwind class on an ancestor never reaches it. A portal has to be told in
// JavaScript whether to render.
// =============================================================================

const MOBILE_QUERY = "(max-width: 1023px)";

/**
 * False until mounted, then the live answer — and it keeps listening, so rotating a tablet or
 * dragging a desktop window narrow is reflected rather than frozen at first paint.
 *
 * Starting false matters: the server cannot know the viewport, so deciding during render would
 * make the server HTML and the first client paint disagree. Anything gated on this appears one
 * frame late, which for a popup is invisible and for hydration is the difference between working
 * and a console full of mismatch errors.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => setIsMobile(mq.matches);
    apply();
    // addEventListener rather than the deprecated addListener, with a guard: some older Android
    // WebViews — which is exactly what this app runs in — only have the old one.
    if (mq.addEventListener) {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  return isMobile;
}
