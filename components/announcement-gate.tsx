"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Button } from "./ui";
import { BACKEND_API_BASE, getStoredSession } from "../lib/api-service";
import { useT } from "../lib/i18n";

// =============================================================================
// Announcement popup — mounted once at the app root (next to MaintenanceGate).
//
// The super-admin writes one announcement (admin → Settings → Announcement) and every owner and
// tenant sees it as a modal when they open the app, for as long as it is switched on.
//
// Deliberately NOT remembered once dismissed: the admin's switch is the only thing that stops it.
// That is the behaviour that was asked for — it is an announcement, not a notice — and it is also
// the escape hatch, since there is no per-user state that could get stuck.
//
// The admin never sees it. They have a Preview button in the editor instead, which is what keeps
// them able to reach the switch and turn it back off — same rule as the maintenance gate.
// =============================================================================

export interface Announcement {
  enabled: boolean;
  title: string;
  body: string;
  imageUrl: string | null;
  updatedAt: string;
}

export function AnnouncementGate() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  // The version last put on screen, so returning from the background does not re-open the same
  // popup the user just closed — but a NEW announcement still gets through. A ref, not state:
  // it is read inside the effect's own callback and must never re-run it.
  const shownVersion = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const url = `${BACKEND_API_BASE}/api/app/announcement`;
      try {
        const res = await fetch(url, { cache: "no-store" });
        // Never fail silently: a blocked read looks identical to "no announcement", which is
        // exactly how a missing CORS header hid a whole feature on this project once before.
        if (!res.ok) {
          console.warn(`[announcement] check returned ${res.status} from ${url} — showing nothing.`);
          return;
        }
        const json = await res.json();
        const next = json?.data as Announcement | undefined;
        if (cancelled || !next?.enabled) return;
        setAnnouncement(next);
        if (shownVersion.current === next.updatedAt) return; // already shown this exact one
        shownVersion.current = next.updatedAt;
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

  if (!open || !announcement) return null;

  // Signed-out screens are not where an announcement belongs, and the admin is never shown it.
  const role = getStoredSession()?.role;
  if (!role || role === "admin") return null;
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path === "/" || path.startsWith("/reset-password")) return null;

  return (
    <AnnouncementModal announcement={announcement} onClose={() => setOpen(false)} />
  );
}

/**
 * The popup itself. Exported so the admin editor can preview exactly what users get — there is no
 * second rendering of this anywhere, so a preview cannot drift from the real thing.
 */
export function AnnouncementModal({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  const t = useT();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!announcement.imageUrl && !imageFailed;

  return (
    // An empty title is intentional and supported: an image-only announcement gets a bare header
    // strip with just the ✕, which is the "only image" mode the admin can choose.
    <Modal open onClose={onClose} title={announcement.title || ""} size="md">
      <div className="space-y-4">
        {showImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={announcement.imageUrl!}
            alt={announcement.title || "Announcement"}
            onError={() => setImageFailed(true)}
            className="max-h-[50vh] w-full rounded-xl object-contain"
          />
        )}
        {/* The admin's own words are prose they typed and are not ours to rewrite — same rule as
            lib/notice-i18n.ts and the maintenance gate. Only our chrome is translated. */}
        {announcement.body && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{announcement.body}</p>
        )}
        <Button className="w-full" onClick={onClose}>{t("Got it")}</Button>
      </div>
    </Modal>
  );
}
