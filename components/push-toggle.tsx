"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { ensurePushSubscription, getPushPermission, type PushPermission } from "../lib/push";
import { getSessionToken } from "../lib/api-service";
import { Button } from "./ui";

/**
 * Keeps this device's push subscription alive. Rendered once inside DashboardShell, so it
 * covers the owner, tenant and admin dashboards.
 *
 * On mount it silently re-registers a device that already has permission. That matters:
 * a browser can hold a valid PushSubscription while the backend has no row for it (any
 * failed register call leaves exactly that state), and registering only at login means
 * such a device stays dark forever. Re-checking on every dashboard load heals it.
 *
 * It renders nothing once notifications are working.
 */
export function PushToggle() {
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const current = getPushPermission();
    setPermission(current);
    // Already permitted: re-register quietly, never prompt.
    if (current === "granted") {
      void ensurePushSubscription(getSessionToken() ?? undefined, { prompt: false });
    }
  }, []);

  if (permission === "unsupported" || permission === "granted") return null;

  if (permission === "denied") {
    return (
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs text-slate-400">
        <BellOff className="h-4 w-4 shrink-0 text-slate-500" />
        Notifications are blocked for this app. Re-enable them in your browser or system settings to
        get rent, invoice and maintenance alerts.
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
      <p className="text-xs text-slate-300">
        Turn on notifications for invoices, payments and maintenance updates.
      </p>
      <Button
        size="sm"
        variant="secondary"
        icon={Bell}
        loading={busy}
        onClick={async () => {
          setBusy(true);
          // The permission prompt must happen inside this click gesture.
          await ensurePushSubscription(getSessionToken() ?? undefined);
          setPermission(getPushPermission());
          setBusy(false);
        }}
      >
        Enable notifications
      </Button>
    </div>
  );
}
