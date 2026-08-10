"use client";

import { useEffect, useRef } from "react";

// =============================================================================
// REVALIDATE-ON-RETURN — the fix for dashboards that show a frozen snapshot.
//
// Every list in this app is loaded once, in a `useEffect(…, [])`, into `useState`. There is no
// SWR and no react-query. That is fine for a page you open and close, and wrong for this one:
// these dashboards stay open for hours on a phone, and the app is installed as a PWA/APK where
// "closing" it mostly means backgrounding it. So an owner could sit looking at last Tuesday's
// invoices, or — the reason this hook exists — at entitlements their plan no longer grants.
//
// Three signals, because no single one covers the ways this app is actually left and returned to:
//   * `visibilitychange` — tab switching, and the Android app being resumed by the OS;
//   * Capacitor `appStateChange` — the native shell coming to the foreground, which does not
//     always produce a visibility event;
//   * `pageshow` with `persisted` — a back/forward-cache restore, where NO script re-ran at all
//     and this listener is the only thing that will ever notice.
//
// Throttled, and deliberately at the same 30s as components/maintenance-gate.tsx: rapid app
// switching is normal on a phone, and the backend middleware allows 60 requests/minute per IP.
// =============================================================================

const DEFAULT_THROTTLE_MS = 30_000;

export function useRevalidateOnFocus(
  fn: () => void | Promise<void>,
  throttleMs: number = DEFAULT_THROTTLE_MS,
): void {
  // Held in refs so the effect can mount ONCE. Binding `fn` as a dependency would re-add every
  // listener on each render, since callers pass an inline closure.
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const lastRun = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const maybeRun = () => {
      if (cancelled) return;
      const now = Date.now();
      if (now - lastRun.current < throttleMs) return;
      lastRun.current = now;
      void fnRef.current();
    };

    const onVisible = () => { if (document.visibilityState === "visible") maybeRun(); };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) maybeRun(); };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    let removeNative: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) maybeRun();
        });
        removeNative = () => { void handle.remove(); };
      } catch {
        /* no native bridge — the visibility listener covers the browser */
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      removeNative?.();
    };
  }, [throttleMs]);
}

/**
 * Run `fn` on an interval, but only while the page is actually visible.
 *
 * A backgrounded tab polling the API achieves nothing except burning the user's battery and their
 * share of the per-IP rate limit — the same reasoning as the presence heartbeat in lib/presence.ts,
 * which is already visible-only for exactly this reason.
 */
export function usePollWhileVisible(fn: () => void | Promise<void>, intervalMs: number): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void fnRef.current();
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
