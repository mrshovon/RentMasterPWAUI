"use client";

import { useEffect } from "react";
import { isNativeApp } from "../lib/platform";

// =====================================================================================
// Turns an Android App Link into an in-app navigation.
//
// WHY IT IS NEEDED AT ALL. This app is a remote-URL Capacitor shell: the WebView is already
// showing www.bari360.space, so when Android hands us a deep link the app comes to the foreground
// on whatever page it was last on. The URL that caused it is delivered as an `appUrlOpen` event
// and is otherwise simply dropped — the payer would be back in the app, but still staring at the
// payment screen instead of the cancel result. This listener is what actually moves them.
//
// Renders nothing. Native-only: in a browser there is no bridge and no deep link to receive.
//
// Uses @capacitor/app, already a dependency and already used this way by update-gate,
// maintenance-gate, announcement-gate and lib/use-revalidate — no new plugin, so this costs the
// APK nothing beyond the manifest entry.
// =====================================================================================

export function DeepLinkGate() {
  useEffect(() => {
    if (!isNativeApp()) return;

    let cancelled = false;
    let remove: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", ({ url }) => {
          if (cancelled || !url) return;
          let target: URL;
          try {
            target = new URL(url);
          } catch {
            return; // not a URL we can act on
          }

          // Only ever navigate WITHIN our own origin. The manifest already scopes the filter to
          // /payment on www.bari360.space, but an intent is attacker-reachable — any app on the
          // device can send one — and this listener must not become a way to point our WebView,
          // session and all, at someone else's page.
          if (target.origin !== window.location.origin) return;
          if (!target.pathname.startsWith("/payment")) return;

          const next = `${target.pathname}${target.search}${target.hash}`;
          // Already there (the link re-opened the page we are on): reload rather than no-op, so a
          // second cancel attempt re-runs its effect instead of showing a stale result.
          if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
            window.location.reload();
            return;
          }
          // replace(), not assign(): the payment screen we came from is a dead end to go Back to.
          window.location.replace(next);
        });
        remove = () => { void handle.remove(); };
      } catch {
        /* no bridge — nothing to listen for */
      }
    })();

    return () => { cancelled = true; remove?.(); };
  }, []);

  return null;
}
