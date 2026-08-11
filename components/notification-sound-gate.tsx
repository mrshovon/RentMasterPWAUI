"use client";

import { useEffect } from "react";
import { isNativeApp } from "../lib/platform";
import { playTone, primeTone } from "../lib/notification-sound";

// =============================================================================
// Plays the Bari360 tone when a push arrives while a page is open.
//
// Renders nothing. Mounted once at the app root next to the other gates.
//
// Why this exists at all: a service worker cannot attach a sound to the notification it draws —
// the Web Push API has no such option, so on the web the browser's own sound is the only thing
// that plays once the app is closed. When a page IS open we can do better, and this is that path.
// app/sw.ts messages every visible client after showing a notification; we play the tone here.
//
// Does nothing in the native app: there the sound belongs to the Android notification channel
// (lib/native-push.ts) and the OS has already played it. Playing it again would double it up.
// =============================================================================

export function NotificationSoundGate() {
  useEffect(() => {
    // Browsers — including the app's WebView — refuse to play audio until the user has interacted
    // with the page, and the refusal is per element, so the first gesture of the session has to
    // prime the very element that will play later. Without this the first notification of a
    // session is always silent. Done on native too, where lib/native-push.ts plays the same tone
    // for a push that arrives while the app is open.
    const onGesture = () => primeTone();
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    window.addEventListener("keydown", onGesture, { once: true });

    // The rest is Web Push only: in the native app the sound belongs to the Android notification
    // channel and the OS has already played it, so repeating it here would double it up.
    const hasSW = !isNativeApp() && typeof navigator !== "undefined" && "serviceWorker" in navigator;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; sound?: string } | undefined;
      // The service worker only messages us when the recipient chose the custom tone, but this
      // re-checks rather than trusting it: an unexpected sound here means an unexplained noise.
      if (data?.type === "bari360-push" && data.sound === "custom") playTone();
    };
    if (hasSW) navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      if (hasSW) navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
