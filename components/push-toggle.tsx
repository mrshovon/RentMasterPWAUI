"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { ensurePushSubscription, getPushPermission, type PushPermission } from "../lib/push";
import { ensureNativePush } from "../lib/native-push";
import { isNativeApp } from "../lib/platform";
import { getSessionToken, rentMasterFetch } from "../lib/api-service";
import { toast } from "./toast";
import { UpdateCheckButton } from "./update-gate";
import { Button } from "./ui";

interface PushTestResult {
  success: boolean;
  configured: boolean;
  tokens: number;
  delivered: number;
  hint: string | null;
}

/**
 * Sends a test notification to this device and reports the outcome.
 *
 * Push failures are invisible on a phone — a missing server key and a misrouted transport
 * both look like "nothing happened". This turns that into one tap with a real answer.
 */
export function PushTestButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await rentMasterFetch<PushTestResult>("/api/notifications/test", {
        method: "POST",
      });
      if (res.success) {
        toast.success(`Test sent to ${res.delivered} device${res.delivered === 1 ? "" : "s"}. Check your notification shade.`);
      } else {
        toast.error(res.hint || "The test notification could not be delivered.");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" icon={Send} loading={busy} onClick={run} className={className}>
      Send test notification
    </Button>
  );
}

/**
 * Keeps this device's push subscription alive. Rendered once inside DashboardShell, so it
 * covers the owner, tenant and admin dashboards.
 *
 * On mount it silently re-registers a device that already has permission. That matters:
 * a browser can hold a valid PushSubscription while the backend has no row for it (any
 * failed register call leaves exactly that state), and registering only at login means
 * such a device stays dark forever. Re-checking on every dashboard load heals it.
 *
 * Once permission is granted it collapses to a single quiet "send test notification" action,
 * so a user on a phone can verify the whole chain without a console.
 */
export function PushToggle() {
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Inside the native app, notifications go through FCM (not Web Push). Register the
    // native token and render nothing — the OS handles the permission prompt.
    if (isNativeApp()) {
      void ensureNativePush();
      setPermission("granted");
      return;
    }
    const current = getPushPermission();
    setPermission(current);
    // Already permitted: re-register quietly, never prompt.
    if (current === "granted") {
      void ensurePushSubscription(getSessionToken() ?? undefined, { prompt: false });
    }
  }, []);

  if (permission === "unsupported") return null;

  // Working: stay out of the way, but keep the self-tests reachable. UpdateCheckButton
  // renders nothing outside the native app, so this row is just the push test in a browser.
  if (permission === "granted") {
    return (
      <div className="mb-5 flex flex-wrap justify-end gap-1">
        <UpdateCheckButton />
        <PushTestButton />
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-line/[0.06] bg-overlay/[0.02] px-4 py-2.5 text-xs text-muted">
        <BellOff className="h-4 w-4 shrink-0 text-subtle" />
        Notifications are blocked for this app. Re-enable them in your browser or system settings to
        get rent, invoice and maintenance alerts.
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
      <p className="text-xs text-fg">
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
