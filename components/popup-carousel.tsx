"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLang, useT } from "../lib/i18n";

// =============================================================================
// The popup, shared by the app-open announcements and the sign-in banners.
//
// ONE COMPONENT FOR BOTH, and for one item or ten. The two features differ only in WHERE they are
// shown, which is their gates' business, not this one's — and the admin edits them side by side, so
// two near-copies would drift in exactly the details a reader notices.
//
// ⭐ PROMO-CARD LOOK, NOT A DIALOG (UIDesigns/pop_up_design.jpeg). The image fills a centred,
// rounded card edge to edge, the app stays visible behind a light frosted veil, and the only control
// is a round ✕ floating off the card's corner. That is why this does not use ui.tsx's Modal: no
// header strip, no bottom sheet, no footer button.
//
// ⭐ ONE DISMISSAL, HOWEVER MANY ITEMS. That is the whole reason this is a carousel rather than a
// queue of modals: three active announcements should not mean three things to close every time the
// app opens, which is how people learn to swat popups away unread. Several items are browsed by
// swiping or by the dots under the card; the ✕ closes the whole set.
//
// With a single item, every trace of the carousel is gone — no dots, nothing to swipe.
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
  // Portal only after mount: rendering it during SSR/hydration would mismatch the server's null.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Escape closes, for desktop. The backdrop still does not — same rule as ui.tsx's Modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!items.length || !mounted) return null;

  // Clamped rather than trusted: an item being removed under us (a refetch mid-view) must not
  // leave this pointing past the end of the list.
  const safeIndex = Math.min(index, items.length - 1);
  const item = items[safeIndex];
  const many = items.length > 1;

  // Fall back to the other edition rather than rendering nothing: an admin who wrote only English
  // should reach Bangla readers with English, not with an empty card.
  const title = (lang === "bn" ? item.titleBn : item.titleEn) || item.titleEn || item.titleBn;
  const body = (lang === "bn" ? item.bodyBn : item.bodyEn) || item.bodyEn || item.bodyBn;
  const showImage = !!item.imageUrl && !failedImages[item.id];
  const hasText = !!(title || body);

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

  // Portalled to <body> for the same reason as Modal: a transformed ancestor would otherwise become
  // the containing block of this fixed overlay.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Bari360"}
      // Light theme: a whitish frosted veil, as in the reference. Dark theme: the usual scrim, so the
      // screen does not flash white at night.
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-surface/60 px-4 backdrop-blur-[3px] animate-fade-in dark:bg-scrim/75"
      style={{
        paddingTop: "calc(1.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="relative my-auto w-full max-w-sm animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close")}
          className="absolute -right-2 -top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-heading shadow-lg ring-1 ring-line/10 backdrop-blur transition hover:bg-surface active:scale-95"
        >
          <X className="h-6 w-6" strokeWidth={2.25} />
        </button>

        <div
          className="overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-line/[0.06]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {showImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={item.id}
              src={item.imageUrl!}
              alt={title || "Bari360"}
              onError={() => setFailedImages((f) => ({ ...f, [item.id]: true }))}
              // contain, never cover: banners carry text near their edges, and cropping a tall one to
              // the height cap would cut it off. Normal proportions fill the card edge to edge anyway.
              className={
                "block w-full bg-surface-2 object-contain " + (hasText ? "max-h-[45dvh]" : "max-h-[75dvh]")
              }
            />
          )}

          {/* The admin's own words are prose they typed, in the language they typed it in, and are
              not ours to rewrite — same rule as lib/notice-i18n.ts. Only our chrome is translated. */}
          {(hasText || !showImage) && (
            <div className="max-h-[40dvh] space-y-2 overflow-y-auto p-5">
              {title && <h2 className="pr-6 text-lg font-bold leading-snug text-heading">{title}</h2>}
              {body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{body}</p>}
            </div>
          )}
        </div>

        {/* Real buttons, not decorative dots: on a phone they are the reliable way to jump, and a
            screen reader needs to be told which one is current. */}
        {many && (
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                onClick={() => go(i)}
                aria-label={t("Go to {0}").replace("{0}", String(i + 1))}
                aria-current={i === safeIndex}
                className={
                  "h-2 rounded-full shadow-sm ring-1 ring-line/10 transition-all " +
                  (i === safeIndex ? "w-5 bg-primary" : "w-2 bg-surface/80 hover:bg-surface")
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
