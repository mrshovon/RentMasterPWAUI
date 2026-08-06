"use client";

import { useEffect } from "react";
import { isNativeApp } from "../lib/platform";
import { BACKEND_API_BASE } from "../lib/api-service";

// =============================================================================
// Loads Google Analytics / Tag Manager using IDs the super-admin sets in the
// admin panel, so tracking can be turned on, changed or switched off without a
// redeploy.
//
// Renders nothing. It injects the official Google snippets only when the admin
// has both supplied an ID and enabled the surface the user is actually on
// (browser vs the installed Android shell).
//
// Security: the IDs are validated server-side against ^G-[A-Z0-9]+$ /
// ^GTM-[A-Z0-9]+$ before they can be stored, and are only ever interpolated
// into a fixed googletagmanager.com URL. There is deliberately no free-text
// "custom snippet" setting anywhere in this feature — that would be stored XSS
// on every page for whoever holds the admin account.
// =============================================================================

interface AnalyticsConfig {
  gaMeasurementId: string;
  gtmContainerId: string;
  enabledWeb: boolean;
  enabledApp: boolean;
}

// Belt-and-braces: the server already rejects malformed ids, but this component
// writes into a <script src>, so it re-checks rather than trusting the response.
const GA_ID = /^G-[A-Z0-9]{4,20}$/;
const GTM_ID = /^GTM-[A-Z0-9]{4,20}$/;

declare global {
  interface Window { dataLayer?: unknown[] }
}

export function AnalyticsGate() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let config: AnalyticsConfig;
      try {
        const url = `${BACKEND_API_BASE}/api/app/analytics-config`;
        const res = await fetch(url, { cache: "no-store" });
        // Never fail silently: a blocked read looks identical to "analytics off", which is
        // exactly how a missing CORS header hid a whole feature on this project once before.
        if (!res.ok) {
          console.warn(`[analytics] config returned ${res.status} from ${url} — tracking stays off.`);
          return;
        }
        const json = await res.json();
        config = json?.data;
      } catch {
        return; // no config, no tracking — fail closed
      }
      if (cancelled || !config) return;

      // Respect the per-surface switches. `isNativeApp()` is the same check the
      // Android download button uses.
      const allowed = isNativeApp() ? config.enabledApp : config.enabledWeb;
      if (!allowed) return;

      // Shared by both tags; must exist before either script runs.
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) { window.dataLayer!.push(args); }

      if (config.gaMeasurementId && GA_ID.test(config.gaMeasurementId)) {
        if (!document.getElementById("ga4-src")) {
          const s = document.createElement("script");
          s.id = "ga4-src";
          s.async = true;
          s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.gaMeasurementId)}`;
          document.head.appendChild(s);
          gtag("js", new Date());
          gtag("config", config.gaMeasurementId);
        }
      }

      if (config.gtmContainerId && GTM_ID.test(config.gtmContainerId)) {
        if (!document.getElementById("gtm-src")) {
          window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
          const s = document.createElement("script");
          s.id = "gtm-src";
          s.async = true;
          s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmContainerId)}`;
          document.head.appendChild(s);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return null;
}
