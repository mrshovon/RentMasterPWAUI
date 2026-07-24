"use client";

import { useCallback, useEffect, useState } from "react";
import { Wrench, LogOut } from "lucide-react";
import { Modal, Button } from "./ui";
import { BACKEND_API_BASE, clearSession, getStoredSession } from "../lib/api-service";
import { formatDateTime } from "../lib/format";

// =============================================================================
// Maintenance gate — mounted once at the app root (next to Toaster/ConfirmHost/UpdateGate).
//
// The super-admin declares a downtime window (admin → Settings → System maintenance) and
// every owner/tenant gets a blocking modal when they open the app.
//
// Two deliberate escape hatches, both of which exist so an enabled window can always be
// switched back OFF:
//   * the admin is NEVER blocked;
//   * on the login page the notice is dismissible, so the admin can still sign in.
//
// Re-checked when the tab becomes visible and when the native app returns to the foreground,
// so turning maintenance off releases users without them force-quitting the app.
// =============================================================================

interface MaintenanceMode {
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  message: string;
}

/** Don't re-hit the network more than once every 30s on rapid app/tab switching. */
const RECHECK_THROTTLE_MS = 30_000;

const DEFAULT_MESSAGE =
  "RentMaster is temporarily unavailable while we carry out scheduled maintenance. " +
  "Please try again after the window below.";

export function MaintenanceGate() {
  const [mode, setMode] = useState<MaintenanceMode | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [lastCheck, setLastCheck] = useState(0);

  const run = useCallback(async (force = false) => {
    if (!force && Date.now() - lastCheck < RECHECK_THROTTLE_MS) return;
    setLastCheck(Date.now());
    try {
      const res = await fetch(`${BACKEND_API_BASE}/api/app/maintenance`, { cache: "no-store" });
      if (!res.ok) return; // fail open — never lock people out over a failed check
      const json = await res.json();
      setMode(json?.data ?? null);
    } catch {
      /* fail open */
    }
  }, [lastCheck]);

  useEffect(() => {
    void run(true);

    const onVisible = () => { if (document.visibilityState === "visible") void run(); };
    document.addEventListener("visibilitychange", onVisible);

    let remove: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive && !cancelled) void run();
        });
        remove = () => { void handle.remove(); };
      } catch {
        /* no native bridge — the visibility listener covers the browser */
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      remove?.();
    };
    // `run` is recreated whenever lastCheck changes; binding it here would re-add the
    // listeners on every check. The throttle lives inside run(), so a stable mount is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mode?.enabled) return null;
  // A window whose end time has already passed is over, whatever the flag still says.
  if (mode.endAt && new Date(mode.endAt).getTime() <= Date.now()) return null;

  const role = getStoredSession()?.role;
  if (role === "admin") return null; // the admin must always be able to turn this off

  // On the login screen this is a heads-up, not a wall: the admin signs in from here.
  const onLoginPage = typeof window !== "undefined" && window.location.pathname === "/";
  if (onLoginPage && dismissed) return null;

  const window_ =
    mode.startAt && mode.endAt
      ? `${formatDateTime(mode.startAt)} → ${formatDateTime(mode.endAt)}`
      : mode.endAt
        ? `Until ${formatDateTime(mode.endAt)}`
        : mode.startAt
          ? `From ${formatDateTime(mode.startAt)}`
          : null;

  return (
    <Modal
      open
      dismissible={onLoginPage}
      onClose={() => setDismissed(true)}
      title="System under maintenance"
      subtitle={window_ ?? undefined}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 p-4">
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm leading-relaxed text-fg">{mode.message || DEFAULT_MESSAGE}</p>
        </div>

        {window_ && (
          <div className="rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-subtle">
              Maintenance window
            </div>
            <div className="mt-1 text-sm font-semibold text-heading">{window_}</div>
          </div>
        )}

        {onLoginPage ? (
          <Button className="w-full" onClick={() => setDismissed(true)}>
            Continue to sign in
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon={LogOut}
            className="w-full"
            onClick={() => { clearSession(); window.location.href = "/"; }}
          >
            Sign out
          </Button>
        )}
      </div>
    </Modal>
  );
}
