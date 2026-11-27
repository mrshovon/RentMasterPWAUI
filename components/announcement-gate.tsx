"use client";

import { useEffect, useRef, useState } from "react";
import { PopupCarousel, type PopupSet } from "./popup-carousel";
import { BACKEND_API_BASE, getStoredSession } from "../lib/api-service";
import { markPopupShown, popupVersion, wasPopupShown } from "../lib/popup-session";

// =============================================================================
// Announcement popup — mounted once at the app root (next to MaintenanceGate).
//
// The super-admin writes a LIST of announcements (admin → Settings → Announcements) and every owner
// and tenant sees the active ones as a single swipeable modal when they open the app, for as long as
// they are switched on.
//
// Deliberately NOT remembered once dismissed: the admin's switches are the only thing that stops
// them. That is the behaviour that was asked for — these are announcements, not notices — and it is
// also the escape hatch, since there is no per-user state that could get stuck.
//
// The admin never sees them. They have a Preview button in the editor instead, which is what keeps
// them able to reach the switches and turn them back off — same rule as the maintenance gate.
// =============================================================================

export function AnnouncementGate() {
  const [set, setSet] = useState<PopupSet | null>(null);
  const [open, setOpen] = useState(false);
  // The version last put on screen, so returning from the background does not re-open the same
  // popups the user just closed — but an edited list still gets through. A ref, not state: it is
  // read inside the effect's own callback and must never re-run it.
  const shownVersion = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const url = `${BACKEND_API_BASE}/api/app/announcement`;
      try {
        const res = await fetch(url, { cache: "no-store" });
        // Never fail silently: a blocked read looks identical to "no announcements", which is
        // exactly how a missing CORS header hid a whole feature on this project once before.
        if (!res.ok) {
          console.warn(`[announcement] check returned ${res.status} from ${url} — showing nothing.`);
          return;
        }
        const json = await res.json();
        const next = json?.data as PopupSet | undefined;
        const count = next?.items?.length || 0;
        // Diagnostic, not noise: an empty list, a missing session and a blocked request all look
        // identical on screen, and that ambiguity already hid a CORS failure on this project once.
        console.info("[announcement] check", {
          url, status: res.status, count,
          role: getStoredSession()?.role || null,
          path: window.location.pathname,
        });
        // The route already strips inactive items, so anything here is meant to be seen.
        if (cancelled || !next?.items?.length) return;

        // Do not mark the list as shown while the gate is hidden — a visitor who signs in during
        // this tab session must still get the announcement.
        const role = getStoredSession()?.role;
        const path = window.location.pathname;
        if (!role || role === "admin" || path === "/" || path.startsWith("/reset-password")) {
          console.info("[announcement] skipped by audience gating", { role, path, count });
          return;
        }
        const version = popupVersion(next);
        if (wasPopupShown("announcement", version)) {
          console.info("[announcement] already shown in this tab session", { version, count });
          return;
        }
        setSet(next);
        if (shownVersion.current === version) return; // already shown this exact list this mount
        shownVersion.current = version;
        markPopupShown("announcement", version);
        setOpen(true);
      } catch (err) {
        console.warn(`[announcement] could not reach ${url} (CORS or network?) — showing nothing.`, err);
      }
    }

    void check();

    // The native shell keeps its WebView alive across backgrounding, so without this a cold start
    // would be the only time an announcement published mid-session was ever seen.
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive && !cancelled) void check();
        });
        remove = () => { void handle.remove(); };
      } catch {
        /* no native bridge — a browser "app open" is a page load, which the initial check covers */
      }
    })();

    return () => { cancelled = true; remove?.(); };
  }, []);

  if (!open || !set?.items.length) return null;

  // Signed-out screens are not where an announcement belongs, and the admin is never shown them.
  const role = getStoredSession()?.role;
  if (!role || role === "admin") return null;
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path === "/" || path.startsWith("/reset-password")) return null;

  return <PopupCarousel items={set.items} onClose={() => setOpen(false)} />;
}
