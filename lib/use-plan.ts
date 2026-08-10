"use client";

import { useCallback, useEffect, useState } from "react";
import { rentMasterFetch, onEntitlementChange } from "./api-service";
import { useRevalidateOnFocus, usePollWhileVisible } from "./use-revalidate";
import type { SubscriptionResponse } from "../types/api";

// =============================================================================
// THE OWNER'S PLAN, KEPT CURRENT.
//
// This used to be a `loadPlan()` closure and a `useState` inside a 3,500-line component, called
// once from `useEffect(…, [])` and after two specific creates. Which produced the bug this hook
// exists to kill: **entitlements only changed at login.** An owner sitting on an open dashboard
// when their plan lapsed — or when an admin revoked an add-on — kept every perk on screen for the
// rest of the session. The Staff tab still opened. The "add property" button still invited them.
// Only the eventual 403 gave it away, and nothing turned that into a correction.
//
// The server was never wrong: the access token carries no plan claims, so /api/admin/subscription
// is authoritative on every call. The staleness was purely a matter of never asking again.
//
// So this asks again, on four signals, in rough order of how quickly they matter:
//
//   1. An entitlement 403 (`SUBSCRIPTION_LOCKED`, `FEATURE_NOT_ENABLED`, …). The fastest and most
//      precise: the server has just told us our copy is wrong, at the exact moment the user is
//      looking. See lib/api-service.ts.
//   2. Returning to the app — tab focus, native resume, bfcache restore. 30s-throttled.
//   3. A five-minute poll while visible, for the case where nothing else happens: a plan that
//      lapses at midnight on a dashboard left open overnight.
//   4. Mount.
//
// Rate budget: the backend middleware allows 60 req/min per IP. Two of these are throttled and one
// is every five minutes, so the ceiling here is a small fraction of that.
//
// Deliberately a plain hook, not a React context. One component owns the owner dashboard and
// passes what its children need as props already; a provider would add a tree without removing
// any prop-drilling.
// =============================================================================

/** Matches the throttle used by components/maintenance-gate.tsx and lib/use-revalidate.ts. */
const FOCUS_THROTTLE_MS = 30_000;
const POLL_INTERVAL_MS = 5 * 60_000;

export interface UsePlan {
  plan: SubscriptionResponse | null;
  /** True only for the FIRST load, so a background refresh never blanks the screen. */
  loading: boolean;
  refreshPlan: () => Promise<void>;
  /** Locally mark the pending lifecycle event as seen, once the modal has been dismissed. */
  clearPendingEvent: () => void;
}

export function usePlan(enabled: boolean = true): UsePlan {
  const [plan, setPlan] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPlan = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await rentMasterFetch<SubscriptionResponse>("/api/admin/subscription", { role: "owner" });
      setPlan(res);
    } catch {
      // Non-fatal on purpose. A failed refresh must leave the last known plan in place rather
      // than blanking the dashboard — and it must never re-enable something the user has already
      // been told is locked. The Plan tab has its own retry.
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { void refreshPlan(); }, [refreshPlan]);

  // 1. The server just refused something on entitlement grounds.
  useEffect(() => {
    if (!enabled) return;
    return onEntitlementChange(() => { void refreshPlan(); });
  }, [enabled, refreshPlan]);

  // 2 + 3.
  useRevalidateOnFocus(() => { if (enabled) void refreshPlan(); }, FOCUS_THROTTLE_MS);
  usePollWhileVisible(() => { if (enabled) void refreshPlan(); }, POLL_INTERVAL_MS);

  // Applied locally as well as server-side so the modal closes immediately, rather than staying
  // up until the next refresh lands.
  const clearPendingEvent = useCallback(() => {
    setPlan((prev) => (prev ? { ...prev, pendingEvent: null } : prev));
  }, []);

  return { plan, loading, refreshPlan, clearPendingEvent };
}
