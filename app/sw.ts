/// <reference lib="webworker" />
// RentMaster service worker (Serwist injectManifest source).
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
        request.method === "GET" && url.pathname.startsWith("/api/"),
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
  let payload: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || "RentMaster";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url || "/" },
    }),
  );
});

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
