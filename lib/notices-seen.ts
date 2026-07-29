"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// =============================================================================
// Unread notice tracking.
//
// The Notices menu badge used to render `notices.length` — the running total, which only ever
// grew and never cleared, so it stopped meaning anything the moment you'd read them all.
//
// There is no read state on the server (`notices` has no read column and no per-user join
// table), and broadcast rows are shared by every recipient, so per-row flags would need a new
// table + endpoint. A single "last opened the Notices tab at" timestamp gives the badge its
// meaning back with no migration. Cost: it is per-browser, so the same account on a second
// device starts with everything unread again. Acceptable for a badge.
// =============================================================================

const KEY_PREFIX = "rentmaster-notices-seen";

/** Scoped per account so two logins on one browser don't inherit each other's read state. */
function storageKey(accountKey: string) {
  return `${KEY_PREFIX}:${accountKey}`;
}

export interface UnreadNotices {
  /** Notices created after the last time this account opened the Notices tab. */
  unreadCount: number;
  /** Call when the tab is opened — clears the badge. */
  markAllSeen: () => void;
}

/**
 * @param notices     the fetched feed (any order; only `created_at` is read)
 * @param accountKey  stable per-account id, e.g. `owner:<uid>`. Pass undefined while the
 *                    session is still resolving — nothing is read or written until it lands.
 */
export function useUnreadNotices(
  notices: { created_at: string }[],
  accountKey: string | undefined,
): UnreadNotices {
  // Starts null for the static render and syncs after mount, mirroring LanguageProvider —
  // reading localStorage during the first client render of a prerendered page is a hydration
  // mismatch. Until it syncs, `seenAt` is null and everything counts as unread, which is also
  // the correct answer for an account that has genuinely never opened the tab.
  const [seenAt, setSeenAt] = useState<string | null>(null);

  useEffect(() => {
    if (!accountKey) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(storageKey(accountKey)); } catch { /* private mode */ }
    setSeenAt(stored);
  }, [accountKey]);

  // Compare as epoch ms, not as strings. Postgres renders timestamptz with variable fractional
  // precision ('…:45+00:00' vs '…:45.123456+00:00'), so a lexicographic compare would depend on
  // a formatting detail we don't control. NaN from an unparseable value sorts as "not newer",
  // which keeps a malformed row out of the badge rather than pinning it there forever.
  const seenMs = seenAt ? Date.parse(seenAt) : NaN;

  const unreadCount = useMemo(() => {
    if (Number.isNaN(seenMs)) return notices.length;
    return notices.filter((n) => Date.parse(n.created_at) > seenMs).length;
  }, [notices, seenMs]);

  // Watermark at the newest notice rather than `now`, so a notice that lands between the fetch
  // and this call isn't silently marked read — it stays unread and shows up on the next load.
  const newest = useMemo(() => {
    let best = "";
    let bestMs = -Infinity;
    for (const n of notices) {
      const ms = Date.parse(n.created_at);
      if (ms > bestMs) { bestMs = ms; best = n.created_at; }
    }
    return best;
  }, [notices]);

  const markAllSeen = useCallback(() => {
    if (!accountKey) return;
    // Nothing in the feed = nothing to mark, and the badge is already 0. Deliberately NOT
    // `new Date()` here: a failed fetch leaves `notices` empty (the dashboards load it through
    // Promise.allSettled and keep the last value on rejection), and stamping "now" in that
    // moment would mark every real notice read the next time the feed loads properly.
    if (!newest) return;
    // Never move the watermark backwards. Decided here rather than inside the setState updater
    // so the stored value and the state can't disagree.
    if (!Number.isNaN(seenMs) && seenMs >= Date.parse(newest)) return;
    setSeenAt(newest);
    try { localStorage.setItem(storageKey(accountKey), newest); } catch { /* just won't persist */ }
  }, [accountKey, newest, seenMs]);

  return { unreadCount, markAllSeen };
}
