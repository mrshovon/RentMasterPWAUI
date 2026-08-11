/// <reference lib="webworker" />
// Bari360 service worker (Serwist injectManifest source).
// Single SW per scope: it does BOTH offline precaching/runtime caching AND Web Push
// (VAPID) handling — Phase B wires the client subscribe flow to these push listeners.
// This file is compiled by @serwist/next's own build; it is excluded from the main
// tsconfig so `tsc --noEmit` doesn't choke on the webworker globals.

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Injected at build time by Serwist with the list of precached build assets.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// API GETs whose answer must never come from a cache, however briefly.
//
// The runtime cache below is network-first with a 5-second timeout, which is right for invoices
// and tenants: on a slow train, last-known data beats a spinner. It is wrong for entitlements.
// A cached /api/admin/subscription would re-grant a plan that has just ended — silently
// re-enabling paid tabs the app had already locked, which is the exact bug the whole plan-refresh
// path exists to prevent. Better to show nothing than to show a stale yes.
const NEVER_CACHE = ["/api/admin/subscription", "/api/logs", "/api/app/maintenance"];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Backend API GETs (cross-origin): network-first so the freshest data wins when
    // online, but the last successful response is served when offline.
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        url.pathname.startsWith("/api/") &&
        !NEVER_CACHE.some((p) => url.pathname.startsWith(p)),
      handler: new NetworkFirst({
        cacheName: "rentmaster-api-get",
        networkTimeoutSeconds: 5,
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// ---------------------------------------------------------------------------
// Web Push (VAPID) — Phase B. Listeners are inert until the client subscribes.
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  // `sound` is the recipient's own choice, filled in per recipient by the backend's deliver()
  // (lib/push-send.ts): "custom" = the Bari360 tone, "default" = the device's, "off" = silent.
  let payload: { title?: string; body?: string; url?: string; tag?: string; sound?: string } = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || "Bari360";
  event.waitUntil(
    self.registration
      .showNotification(title, {
        body: payload.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: payload.tag,
        // The ONLY sound control the Web Push API gives us. There is no way to attach an audio
        // file to a notification the browser draws — with the app closed, "custom" and "default"
        // both end up as whatever sound the browser uses. The Bari360 tone is played by the page
        // below when one is open, and by the notification channel in the native app (which is
        // where it matters, and where it works in every state).
        silent: payload.sound === "off",
        data: { url: payload.url || "/" },
      })
      .then(() => notifyOpenClients(payload.sound)),
  );
});

/**
 * Tell any open page that a push just arrived, so it can play the brand tone.
 *
 * Only pages that are actually on screen are messaged: a tab sitting in the background has no
 * business making a noise the user cannot trace, and the notification itself already carries the
 * browser's own sound there.
 */
async function notifyOpenClients(sound?: string): Promise<void> {
  if (sound !== "custom") return;
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    if (client.visibilityState === "visible") {
      client.postMessage({ type: "bari360-push", sound });
    }
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string })?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
