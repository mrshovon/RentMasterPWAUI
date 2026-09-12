"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "./ui";
import { BACKEND_API_BASE, getStoredSession } from "../lib/api-service";
import { useIsMobile } from "../lib/use-is-mobile";
import { useLang, useT } from "../lib/i18n";

// =============================================================================
// Login popup — mounted at the app root, shown on the signed-out login screen.
//
// A SIBLING of AnnouncementGate, not a flag on it. The two are opposites in the one way that
// matters: the announcement requires a session and skips "/" outright, while this one exists only
// where there is no session. One row whose audience depends on a boolean is how the wrong message
// reaches the wrong people.
//
// BILINGUAL, unlike the announcement. This is the first screen a stranger sees and half the
// audience reads Bangla, so the admin writes both editions. A missing Bangla edition falls back to
// the English one rather than showing a blank modal — a half-translated popup beats an empty one.
//
// Deliberately NOT remembered once dismissed: it shows every time the login page is opened. That is
// what was asked for, and it also means there is no per-user state that can get stuck — the admin's
// switch is the only thing that stops it.
// =============================================================================

export interface LoginPopup {
  enabled: boolean;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  imageUrl: string | null;
  updatedAt: string;
}

export function LoginPopupGate() {
  const [popup, setPopup] = useState<LoginPopup | null>(null);
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
        // Never fail silently: a blocked read looks identical to "no popup", which is exactly how a
        // missing CORS header hid a whole feature on this project once before.
        if (!res.ok) {
          console.warn(`[login-popup] check returned ${res.status} from ${url} — showing nothing.`);
          return;
        }
        const json = await res.json();
        const next = json?.data as LoginPopup | undefined;
        if (cancelled || !next?.enabled) return;
        setPopup(next);
        setOpen(true);
      } catch (err) {
        console.warn(`[login-popup] could not reach ${url} (CORS or network?) — showing nothing.`, err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Phones only, by explicit decision. Checked at render rather than in the effect so that dragging
  // a desktop window narrow does not need a reload to be right.
  if (!open || !popup || !isMobile) return null;

  return <LoginPopupModal popup={popup} onClose={() => setOpen(false)} />;
}

/**
 * The popup itself. Exported so the admin editor previews exactly what visitors get — there is no
 * second rendering of this anywhere, so a preview cannot drift from the real thing.
 *
 * `lang` is overridable so the admin can preview either edition without switching the whole console
 * into Bangla.
 */
export function LoginPopupModal({
  popup,
  onClose,
  lang: forcedLang,
}: {
  popup: LoginPopup;
  onClose: () => void;
  lang?: "en" | "bn";
}) {
  const t = useT();
  const appLang = useLang();
  const lang = forcedLang ?? (appLang === "bn" ? "bn" : "en");
  const [imageFailed, setImageFailed] = useState(false);

  // Fall back to the other edition rather than rendering nothing: an admin who wrote only English
  // should reach Bangla readers with English, not with an empty modal.
  const title = (lang === "bn" ? popup.titleBn : popup.titleEn) || popup.titleEn || popup.titleBn;
  const body = (lang === "bn" ? popup.bodyBn : popup.bodyEn) || popup.bodyEn || popup.bodyBn;
  const showImage = !!popup.imageUrl && !imageFailed;

  return (
    // An empty title is intentional and supported: an image-only popup gets a bare header strip
    // with just the ✕, which is the "only image" mode the admin can choose.
    <Modal open onClose={onClose} title={title || ""} size="md">
      <div className="space-y-4">
        {showImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={popup.imageUrl!}
            alt={title || "Bari360"}
            onError={() => setImageFailed(true)}
            className="max-h-[50vh] w-full rounded-xl object-contain"
          />
        )}
        {/* The admin's own words are prose they typed and are not ours to rewrite — they already
            wrote both editions. Only our chrome is translated. */}
        {body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{body}</p>}
        <Button className="w-full" onClick={onClose}>{t("Got it")}</Button>
      </div>
    </Modal>
  );
}
