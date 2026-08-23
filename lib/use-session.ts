"use client";

import { useEffect, useState } from "react";
import {
  getStoredSession, setStoredSession, clearSession, ensureValidToken, apiLogout,
  redirectToLogin,
  type StoredSession,
} from "./api-service";
import { getSupabaseBrowser } from "./supabase-browser";

export type SessionProfile = StoredSession;

// Identity only. The token fields rotate on every silent refresh and no consumer of `session`
// reads them (they go through api-service), so comparing them would defeat the purpose.
function sameSession(a: SessionProfile, b: SessionProfile): boolean {
  return a.role === b.role && a.userId === b.userId && a.name === b.name;
}

/**
 * Client-side route guard for the three dashboards.
 *
 * It has to be client-side: the session lives in localStorage, which Next middleware cannot
 * read, so there is nothing for a server guard to inspect. What matters instead is that the
 * guard re-runs whenever the page could be showing stale authenticated content.
 *
 * The mount-only version of this let a signed-out user press Back and land on a working
 * dashboard. `window.location.href` on sign-out PUSHED a history entry, so /owner stayed
 * reachable, and the browser restored it from the back/forward cache — a frozen snapshot where
 * React state still held the old profile and the mount effect never fired again. The page
 * painted in full. So: `replace` on the way out, and re-validate on the way back in.
 */
export function useSessionGuard(allowedRole?: "owner" | "tenant" | "admin" | "building") {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Returns true when the stored session is present and allowed to be on this page.
    // Redirects (and returns false) otherwise.
    function validate(): boolean {
      const stored = getStoredSession();
      if (!stored) {
        redirectToLogin();
        return false;
      }
      // Role mismatch security check.
      if (allowedRole && stored.role !== allowedRole) {
        redirectToLogin();
        return false;
      }
      // getStoredSession re-parses the JSON, so it hands back a fresh object every time. Since
      // this now runs on every tab focus, storing it unconditionally would re-render the whole
      // dashboard each time the user came back to the tab. Only replace it when it changed.
      setSession((prev) => (prev && sameSession(prev, stored) ? prev : stored));
      return true;
    }

    if (!validate()) return;
    setCheckingSession(false);
    // Proactively renew the access token so a long-open dashboard doesn't drift into 401s.
    void ensureValidToken();

    // `persisted` marks a back/forward-cache restore: no script re-ran, so this listener is the
    // only chance to notice the session went away while the page was frozen.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) validate();
    };
    // Covers the Android app being resumed and plain tab switching, where bfcache isn't involved
    // but the session may have been ended elsewhere in the meantime.
    const onVisibility = () => {
      if (document.visibilityState === "visible") validate();
    };
    // Fires in OTHER tabs when this origin's localStorage changes — so signing out of one tab
    // signs out of all of them.
    const onStorage = () => { validate(); };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [allowedRole]);

  const login = (role: "owner" | "tenant" | "admin" | "building", userId: string, name: string) => {
    setStoredSession({ role, userId, name });
    window.location.replace(`/${role}`);
  };

  const logout = () => {
    // Fire the server-side revocation BEFORE clearing, since it needs the token. Un-awaited:
    // `keepalive` lets it finish after we navigate away, and a slow network must not make
    // signing out feel broken.
    void apiLogout();
    void signOutSupabase();
    clearSession();
    // `replace`, not `href`: this is the change that stops Back from resurrecting the dashboard.
    window.location.replace("/");
  };

  return { session, checkingSession, login, logout };
}

// The /reset-password page's Supabase client runs with persistSession:true, so it can leave an
// sb-*-auth-token behind in localStorage that our own session key knows nothing about. Clear it
// too. Best-effort — this throws when the Supabase env vars aren't configured, which is normal
// for anyone who never opened the reset page.
async function signOutSupabase(): Promise<void> {
  try {
    await getSupabaseBrowser().auth.signOut();
  } catch {
    /* not configured, or nothing to sign out of */
  }
}

// Sign-out path for callers outside a dashboard page (e.g. the maintenance gate), so every exit
// clears the same things and leaves the same history behind.
export function hardSignOut(): void {
  void apiLogout();
  void signOutSupabase();
  clearSession(); // also purges the service-worker API cache
  window.location.replace("/");
}
