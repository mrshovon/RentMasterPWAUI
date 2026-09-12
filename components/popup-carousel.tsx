"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Modal, Button } from "./ui";
import { useLang, useT } from "../lib/i18n";

// =============================================================================
// The popup modal, shared by the app-open announcements and the sign-in banners.
//
// ONE COMPONENT FOR BOTH, and for one item or ten. The two features differ only in WHERE they are
// shown, which is their gates' business, not this one's — and the admin edits them side by side, so
// two near-copies would drift in exactly the details a reader notices.
//
// ⭐ ONE DISMISSAL, HOWEVER MANY ITEMS. That is the whole reason this is a carousel rather than a
// queue of modals: three active announcements should not mean three things to close every time the
// app opens, which is how people learn to swat popups away unread.
//
// With a single item, every trace of the carousel is gone — no dots, no arrows, nothing to swipe.
// The common case must not get worse to serve the rare one.
// =============================================================================

export interface PopupItem {
  id: string;
  active: boolean;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  imageUrl: string | null;
}

export interface PopupSet {
  items: PopupItem[];
  updatedAt: string;
}

/** How far a finger must travel before it counts as a swipe rather than a tap or a scroll. */
const SWIPE_PX = 40;

export function PopupCarousel({
  items,
  onClose,
  lang: forcedLang,
}: {
  items: PopupItem[];
  onClose: () => void;
  /** Forces one edition, so the admin can preview Bangla without switching the whole console. */
  lang?: "en" | "bn";
}) {
  const t = useT();
  const appLang = useLang();
  const lang = forcedLang ?? (appLang === "bn" ? "bn" : "en");

  const [index, setIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const touchX = useRef<number | null>(null);

  if (!items.length) return null;

  // Clamped rather than trusted: an item being removed under us (a refetch mid-view) must not
  // leave this pointing past the end of the list.
  const safeIndex = Math.min(index, items.length - 1);
  const item = items[safeIndex];
  const many = items.length > 1;
  const isLast = safeIndex === items.length - 1;

  // Fall back to the other edition rather than rendering nothing: an admin who wrote only English
  // should reach Bangla readers with English, not with an empty modal.
  const title = (lang === "bn" ? item.titleBn : item.titleEn) || item.titleEn || item.titleBn;
  const body = (lang === "bn" ? item.bodyBn : item.bodyEn) || item.bodyEn || item.bodyBn;
  const showImage = !!item.imageUrl && !failedImages[item.id];

  const go = (next: number) => setIndex(Math.max(0, Math.min(items.length - 1, next)));

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    go(dx < 0 ? safeIndex + 1 : safeIndex - 1);
  }

  return (
    // An empty title is intentional and supported: an image-only popup gets a bare header strip
    // with just the ✕, which is the "only image" mode the admin can choose.
    <Modal open onClose={onClose} title={title || ""} size="md">
      <div className="space-y-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {showImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageUrl!}
            alt={title || "Bari360"}
            onError={() => setFailedImages((f) => ({ ...f, [item.id]: true }))}
            className="max-h-[50vh] w-full rounded-xl object-contain"
          />
        )}

        {/* The admin's own words are prose they typed, in the language they typed it in, and are
            not ours to rewrite — same rule as lib/notice-i18n.ts. Only our chrome is translated. */}
        {body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{body}</p>}

        {many && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(safeIndex - 1)}
              disabled={safeIndex === 0}
              aria-label={t("Previous")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-overlay/[0.06] hover:text-heading disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Real buttons, not decorative dots: on a phone they are the reliable way to jump, and
                a screen reader needs to be told which one is current. */}
            <div className="flex items-center gap-1.5">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t("Go to {0}").replace("{0}", String(i + 1))}
                  aria-current={i === safeIndex}
                  className={
                    "h-2 rounded-full transition-all " +
                    (i === safeIndex ? "w-5 bg-primary" : "w-2 bg-overlay/20 hover:bg-overlay/40")
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(safeIndex + 1)}
              disabled={isLast}
              aria-label={t("Next")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-overlay/[0.06] hover:text-heading disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Reads "Next" until the last one, so nobody closes the modal at item 1 of 3 thinking they
            have seen everything — but it never TRAPS them: the ✕ always closes. */}
        {many && !isLast ? (
          <Button className="w-full" onClick={() => go(safeIndex + 1)}>Next</Button>
        ) : (
          <Button className="w-full" onClick={onClose}>Got it</Button>
        )}
      </div>
    </Modal>
  );
}
