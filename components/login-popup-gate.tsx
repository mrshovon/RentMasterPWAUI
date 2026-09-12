"use client";

import { useEffect, useState } from "react";
import { PopupCarousel, type PopupSet } from "./popup-carousel";
import { BACKEND_API_BASE, getStoredSession } from "../lib/api-service";
import { useIsMobile } from "../lib/use-is-mobile";

// =============================================================================
// Login banners — mounted at the app root, shown on the signed-out login screen.
//
// A SIBLING of AnnouncementGate, not a flag on it. The two are opposites in the one way that
// matters: the announcement requires a session and skips "/" outright, while this one exists only
// where there is no session. One row whose audience depends on a boolean is how the wrong message
// reaches the wrong people.
//
// Several active banners become one swipeable modal — see PopupCarousel. Deliberately NOT
// remembered once dismissed: they show every time the login page is opened. That is what was asked
// for, and it also means there is no per-user state that can get stuck; the admin's switches are
// the only thing that stops them.
// =============================================================================

export function LoginPopupGate() {
  const [set, setSet] = useState<PopupSet | null>(null);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Read once per page load. The login page is a page load by definition — there is no in-app
  // navigation to it — so there is nothing to re-check on, unlike the announcement gate.
  useEffect(() => {
    let cancelled = false;

    // Only the signed-out login screen. Checked before the request so every other page in the app
    // costs nothing at all.
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path !== "/") return;
    // Someone with a session is mid-redirect to their dashboard; a popup would flash and vanish.
    if (getStoredSession()) return;

    const url = `${BACKEND_API_BASE}/api/app/login-popup`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        // Never fail silently: a blocked read looks identical to "no banners", which is exactly how
        // a missing CORS header hid a whole feature on this project once before.
        if (!res.ok) {
          console.warn(`[login-popup] check returned ${res.status} from ${url} — showing nothing.`);
          return;
        }
        const json = await res.json();
        const next = json?.data as PopupSet | undefined;
        // The route already strips inactive banners, so anything here is meant to be seen.
        if (cancelled || !next?.items?.length) return;
        setSet(next);
        setOpen(true);
      } catch (err) {
        console.warn(`[login-popup] could not reach ${url} (CORS or network?) — showing nothing.`, err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Phones only, by explicit decision. Checked at render rather than in the effect so that dragging
  // a desktop window narrow does not need a reload to be right.
  if (!open || !set?.items.length || !isMobile) return null;

  return <PopupCarousel items={set.items} onClose={() => setOpen(false)} />;
}
