"use client";

import { useEffect } from "react";
import { rentMasterFetch } from "./api-service";
import { isNativeApp } from "./platform";

// =============================================================================
// PRESENCE HEARTBEAT — tells the backend this session is alive, so the admin
// console can show who is online and when each account was last seen.
//
// Ping cadence is 60s, and ONLY while the tab/app is actually visible. That is
// well inside the 60 req/min per-IP throttle in the backend middleware, and it
// means a backgrounded tab stops counting as online (which is the point — the
// server treats anything not seen for 5 minutes as offline).
// =============================================================================

const PING_INTERVAL_MS = 60_000;
const DEVICE_ID_KEY = "bari360.deviceId";

/**
 * A stable id for this browser/install, so the admin can see "2 devices" rather
 * than a new row per page load. Persisted in localStorage; if that is
 * unavailable (private mode, storage disabled) we fall back to a per-session id
 * rather than failing — presence is telemetry, never a hard dependency.
 */
function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `ephemeral-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Start the heartbeat. Returns a cleanup function — call it from the effect that
 * started it. Safe to call on the server (it no-ops).
 */
export function startPresenceHeartbeat(): () => void {
  if (typeof window === "undefined") return () => {};

  const id = deviceId();
  const platform = isNativeApp() ? "android" : "web";
  let stopped = false;

  const ping = async () => {
    if (stopped || document.visibilityState !== "visible") return;
    try {
      await rentMasterFetch("/api/admin/presence", {
        method: "POST",
        body: JSON.stringify({ deviceId: id, platform }),
      });
    } catch {
      // Deliberately silent. A failed heartbeat must never interrupt the user or
      // surface a toast — it only costs the admin a stale "last seen".
    }
  };

  ping();
  const timer = window.setInterval(ping, PING_INTERVAL_MS);

  // Coming back to a backgrounded tab should register immediately rather than
  // waiting out the rest of the interval.
  const onVisible = () => { if (document.visibilityState === "visible") ping(); };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * Run the heartbeat for as long as the dashboard is mounted.
 *
 * `enabled` should be false while the session guard is still checking — pinging
 * before a token exists just produces a guaranteed 401.
 */
export function usePresenceHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    return startPresenceHeartbeat();
  }, [enabled]);
}
